"""
EMV integration routes - project list, Bill Analytic export, push baseline, client report.
Enables EMV program to: fetch projects, import Bill Analytic data, push analysis results.
Supports X-EMV-API-Key for service-to-service calls from EMV backend.
"""
from flask import Blueprint, current_app, jsonify, request
from flask_login import current_user, login_required

from app.db.request_session import get_session
from app.helpers.decorators import emv_api_key_or_login, license_required
from app.models.client import Client
from app.models.project import Project, project_user
from app.models.user import User

emv_bp = Blueprint("emv", __name__, url_prefix="")


def _is_emv_api_key_request():
    """Return True if request is authenticated via EMV API key (no user session)."""
    api_key = current_app.config.get("EMV_API_KEY")
    provided = request.headers.get("X-EMV-API-Key")
    return bool(api_key and provided and api_key == provided)


def _user_has_project_access(sess, project_id):
    """Return True if current user has access to project (admin or project member)."""
    if not current_user.is_authenticated:
        return False
    user = sess.query(User).get(current_user.id)
    if not user:
        return False
    if user.role == 8:
        return True
    row = sess.query(project_user).filter(
        project_user.c.project_users == project_id,
        project_user.c.user_projects == user.id,
    ).first()
    return row is not None


def _projects_for_user(sess, org_id=None, client_id=None):
    """
    Return project IDs the current user has access to, optionally filtered by org_id and client_id.
    """
    user = sess.query(User).get(current_user.id)
    if not user:
        return []
    if user.role == 8:
        q = sess.query(Project).filter_by(isDeleted=False)
    else:
        proj_ids = sess.query(project_user.c.project_users).filter(
            project_user.c.user_projects == user.id
        ).all()
        proj_ids = [r[0] for r in proj_ids]
        q = sess.query(Project).filter(Project.id.in_(proj_ids), Project.isDeleted == False)
    if org_id:
        q = q.filter(Project.org_id == org_id)
    if client_id is not None:
        q = q.filter(Project.client == client_id)
    return q.all()


# -----------------------------------------------------------------------------
# Step 1: Project List API
# -----------------------------------------------------------------------------


@emv_bp.route("/api/emv/projects", methods=["GET"])
@emv_api_key_or_login
def emv_projects():
    """
    GET /api/emv/projects?orgId=X&clientId=Y
    Return list of projects for EMV program to use when setting up analysis.
    orgId: required - filter by org
    clientId: optional - filter by client
    """
    sess = get_session()
    org_id = request.args.get("orgId", "").strip()
    client_id_arg = request.args.get("clientId")
    if not org_id:
        return jsonify({"error": "orgId is required"}), 400
    client_id = None
    if client_id_arg is not None and str(client_id_arg).strip():
        try:
            client_id = int(client_id_arg)
        except (ValueError, TypeError):
            pass
    if _is_emv_api_key_request():
        q = sess.query(Project).filter_by(isDeleted=False).filter(Project.org_id == org_id)
        if client_id is not None:
            q = q.filter(Project.client == client_id)
        projects = q.all()
    else:
        projects = _projects_for_user(sess, org_id=org_id, client_id=client_id)
    rows = []
    for p in projects:
        client_name = ""
        if p.client:
            c = sess.query(Client).filter_by(id=p.client, isDeleted=False).first()
            client_name = c.name if c else "(deleted)"
        rows.append({
            "orgId": p.org_id or org_id,
            "clientId": p.client,
            "clientName": client_name,
            "projectId": p.id,
            "projectName": p.name,
            "location": p.location or "",
        })
    return jsonify({"meta": {}, "response": {"projects": rows}})


# -----------------------------------------------------------------------------
# Step 2: Bill Analytic Export API
# -----------------------------------------------------------------------------


@emv_bp.route("/api/emv/project/bill-analytic", methods=["GET"])
@emv_api_key_or_login
def emv_project_bill_analytic():
    """
    GET /api/emv/project/bill-analytic?orgId=X&clientId=Y&projectId=Z
    Return electricBillAnalysis for the specified project. EMV uses this to
    pre-fill its analysis form (only fields that exist in EMV UI should be mapped).
    """
    org_id = request.args.get("orgId", "").strip()
    client_id_arg = request.args.get("clientId")
    project_id_arg = request.args.get("projectId")
    if not org_id or project_id_arg is None:
        return jsonify({"error": "orgId and projectId are required"}), 400
    try:
        project_id = int(project_id_arg)
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid projectId"}), 400
    client_id = None
    if client_id_arg is not None and str(client_id_arg).strip():
        try:
            client_id = int(client_id_arg)
        except (ValueError, TypeError):
            pass
    sess = get_session()
    q = sess.query(Project).filter_by(id=project_id, isDeleted=False)
    if org_id:
        q = q.filter(Project.org_id == org_id)
    if client_id is not None:
        q = q.filter(Project.client == client_id)
    p = q.first()
    if not p:
        return jsonify({"error": "Project not found"}), 404
    if not _is_emv_api_key_request() and not _user_has_project_access(sess, project_id):
        return jsonify({"error": "Access denied"}), 403
    eba = (p.electricBillAnalysis or {}) if hasattr(p, "electricBillAnalysis") else {}
    rf = (p.reportFields or {}) if hasattr(p, "reportFields") else {}
    return jsonify({
        "meta": {},
        "response": {
            "electricBillAnalysis": eba,
            "reportFields": rf,
        },
    })


# -----------------------------------------------------------------------------
# Step 2b: Save EM&V Pre-fill Fields
# -----------------------------------------------------------------------------

@emv_bp.route("/api/emv/save-prefill", methods=["POST"])
@emv_api_key_or_login
def emv_save_prefill():
    """
    POST /api/emv/save-prefill
    Called by Tracking frontend when user clicks "Send to EM&V".
    Saves all Client/Project/Billing pre-fill fields into project.reportFields
    so the EMV dropdown import can retrieve them without URL parameters.
    Body: { orgId, projectId, clientId, fields: { company, cp_address, ... } }
    """
    data = request.get_json() or {}
    org_id = (data.get("orgId") or "").strip()
    project_id_arg = data.get("projectId")
    fields = data.get("fields") or {}
    if not org_id or project_id_arg is None:
        return jsonify({"error": "orgId and projectId are required"}), 400
    try:
        project_id = int(project_id_arg)
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid projectId"}), 400
    sess = get_session()
    q = sess.query(Project).filter_by(id=project_id, isDeleted=False).filter(Project.org_id == org_id)
    p = q.first()
    if not p:
        return jsonify({"error": "Project not found"}), 404
    if not _is_emv_api_key_request() and not _user_has_project_access(sess, project_id):
        return jsonify({"error": "Access denied"}), 403
    existing = dict(p.reportFields or {})
    existing.update({k: v for k, v in fields.items() if v is not None and v != ""})
    p.reportFields = existing
    sess.commit()
    return jsonify({"meta": {}, "response": {"saved": len(fields)}}), 200


# -----------------------------------------------------------------------------
# Step 3 & 4: EMV Analysis Storage + Push Baseline API
# -----------------------------------------------------------------------------


@emv_bp.route("/api/emv/push-baseline", methods=["POST"])
@emv_api_key_or_login
def emv_push_baseline():
    """
    POST /api/emv/push-baseline
    EMV program pushes analysis results to Tracking. Updates project baseline
    (kwhSavings, kwPeakSavings, etc.) and stores HTML report for client viewing.
    Body: orgId, clientId, projectId, kwhSavings, kwPeakSavings, pfSavings,
          kvarSavings, kvaSavings, reportHtml, analysisDate, offPeriod, onPeriod
    """
    import secrets

    from app.models.emv_analysis import EmvAnalysis

    data = request.get_json() or {}
    org_id = (data.get("orgId") or "").strip()
    client_id = data.get("clientId")
    project_id_arg = data.get("projectId")
    if not org_id or project_id_arg is None:
        return jsonify({"error": "orgId and projectId are required"}), 400
    try:
        project_id = int(project_id_arg)
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid projectId"}), 400

    sess = get_session()
    q = sess.query(Project).filter_by(id=project_id, isDeleted=False)
    if org_id:
        q = q.filter(Project.org_id == org_id)
    if client_id is not None:
        try:
            q = q.filter(Project.client == int(client_id))
        except (ValueError, TypeError):
            pass
    p = q.first()
    if not p:
        return jsonify({"error": "Project not found"}), 404
    if not _is_emv_api_key_request() and not _user_has_project_access(sess, project_id):
        return jsonify({"error": "Access denied"}), 403

    kwh_savings = data.get("kwhSavings")
    kw_peak_savings = data.get("kwPeakSavings")
    pf_savings = data.get("pfSavings")
    kvar_savings = data.get("kvarSavings")
    kva_savings = data.get("kvaSavings")
    report_html = data.get("reportHtml")
    analysis_date = data.get("analysisDate")
    off_period = data.get("offPeriod") or {}
    on_period = data.get("onPeriod") or {}

    now_ms = int(__import__("time").time() * 1000)
    share_token = secrets.token_urlsafe(32)

    emv = EmvAnalysis(
        project_id=project_id,
        org_id=org_id,
        client_id=client_id,
        kwh_savings=float(kwh_savings) if kwh_savings is not None else None,
        kw_peak_savings=float(kw_peak_savings) if kw_peak_savings is not None else None,
        pf_savings=float(pf_savings) if pf_savings is not None else None,
        kvar_savings=float(kvar_savings) if kvar_savings is not None else None,
        kva_savings=float(kva_savings) if kva_savings is not None else None,
        report_html=report_html,
        share_token=share_token,
        analysis_date=str(analysis_date) if analysis_date else None,
        off_period_start=off_period.get("start") if isinstance(off_period, dict) else None,
        off_period_end=off_period.get("end") if isinstance(off_period, dict) else None,
        on_period_start=on_period.get("start") if isinstance(on_period, dict) else None,
        on_period_end=on_period.get("end") if isinstance(on_period, dict) else None,
        createdAt=now_ms,
        updatedAt=now_ms,
    )
    sess.add(emv)
    sess.flush()

    p.kwhSavings = emv.kwh_savings if emv.kwh_savings is not None else (p.kwhSavings or 0)
    p.kwPeakSavings = emv.kw_peak_savings if emv.kw_peak_savings is not None else (p.kwPeakSavings or 0)
    p.pfSavings = emv.pf_savings if emv.pf_savings is not None else (p.pfSavings or 0)
    p.kvarSavings = emv.kvar_savings if emv.kvar_savings is not None else (p.kvarSavings or 0)
    p.kvaSavings = emv.kva_savings if emv.kva_savings is not None else (p.kvaSavings or 0)
    p.active_emv_analysis_id = emv.id  # Newest push becomes active baseline
    p.updatedAt = now_ms
    sess.add(p)

    try:
        sess.commit()
    except Exception as e:
        sess.rollback()
        current_app.logger.exception("emv_push_baseline failed")
        return jsonify({"error": str(e)}), 500

    report_url = f"/secure/emv-report?token={share_token}"
    return jsonify({
        "meta": {},
        "response": {
            "success": True,
            "message": "Baseline pushed. Project savings updated for ongoing tracking.",
            "emvAnalysisId": emv.id,
            "reportToken": share_token,
            "reportUrl": report_url,
        },
    })


# -----------------------------------------------------------------------------
# Step 5: Client HTML Report Page (Tracking)
# Step 8: Test Selection - list analyses, set active, report by analysisId
# -----------------------------------------------------------------------------


@emv_bp.route("/api/project/<int:project_id>/emv-analyses", methods=["GET"])
@login_required
@license_required
def emv_list_analyses(project_id):
    """
    GET /api/project/:id/emv-analyses
    List all EM&V analyses for the project (for test selection dropdown).
    """
    if not _user_has_project_access(get_session(), project_id):
        return jsonify({"error": "Unauthorized"}), 403
    from app.models.emv_analysis import EmvAnalysis

    sess = get_session()
    analyses = (
        sess.query(EmvAnalysis)
        .filter_by(project_id=project_id)
        .order_by(EmvAnalysis.createdAt.desc())
        .all()
    )
    p = sess.query(Project).filter_by(id=project_id, isDeleted=False).first()
    active_id = getattr(p, "active_emv_analysis_id", None) if p else None
    rows = []
    for a in analyses:
        rows.append({
            "id": a.id,
            "analysisDate": a.analysis_date,
            "offPeriod": {"start": a.off_period_start, "end": a.off_period_end},
            "onPeriod": {"start": a.on_period_start, "end": a.on_period_end},
            "createdAt": a.createdAt,
            "isActive": a.id == active_id,
        })
    return jsonify({"meta": {}, "response": {"analyses": rows, "activeId": active_id}})


@emv_bp.route("/api/project/<int:project_id>/emv-analysis/active", methods=["PUT"])
@login_required
@license_required
def emv_set_active_analysis(project_id):
    """
    PUT /api/project/:id/emv-analysis/active
    Set which EM&V analysis is the active baseline. Body: { analysisId: int }.
    Copies that analysis's savings to project and uses it for report when no analysisId given.
    """
    if not _user_has_project_access(get_session(), project_id):
        return jsonify({"error": "Unauthorized"}), 403
    from app.models.emv_analysis import EmvAnalysis

    data = request.get_json() or {}
    analysis_id = data.get("analysisId")
    if analysis_id is None:
        return jsonify({"error": "analysisId is required"}), 400
    try:
        analysis_id = int(analysis_id)
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid analysisId"}), 400

    sess = get_session()
    emv = sess.query(EmvAnalysis).filter_by(id=analysis_id, project_id=project_id).first()
    if not emv:
        return jsonify({"error": "Analysis not found"}), 404
    p = sess.query(Project).filter_by(id=project_id, isDeleted=False).first()
    if not p:
        return jsonify({"error": "Project not found"}), 404

    now_ms = int(__import__("time").time() * 1000)
    p.active_emv_analysis_id = emv.id
    p.kwhSavings = emv.kwh_savings if emv.kwh_savings is not None else (p.kwhSavings or 0)
    p.kwPeakSavings = emv.kw_peak_savings if emv.kw_peak_savings is not None else (p.kwPeakSavings or 0)
    p.pfSavings = emv.pf_savings if emv.pf_savings is not None else (p.pfSavings or 0)
    p.kvarSavings = emv.kvar_savings if emv.kvar_savings is not None else (p.kvarSavings or 0)
    p.kvaSavings = emv.kva_savings if emv.kva_savings is not None else (p.kvaSavings or 0)
    p.updatedAt = now_ms
    sess.add(p)
    try:
        sess.commit()
    except Exception as e:
        sess.rollback()
        current_app.logger.exception("emv_set_active_analysis failed")
        return jsonify({"error": str(e)}), 500
    return jsonify({
        "meta": {},
        "response": {"success": True, "activeId": emv.id, "message": "Baseline updated."},
    })


@emv_bp.route("/api/project/<int:project_id>/emv-report", methods=["GET"])
@login_required
@license_required
def emv_report_project(project_id):
    """
    GET /api/project/:id/emv-report?analysisId=X
    Serve EM&V HTML report. If analysisId given, use that analysis; else use active one; else latest.
    """
    if not _user_has_project_access(get_session(), project_id):
        return jsonify({"error": "Unauthorized"}), 404
    from app.models.emv_analysis import EmvAnalysis

    sess = get_session()
    analysis_id_arg = request.args.get("analysisId")
    emv = None
    if analysis_id_arg:
        try:
            aid = int(analysis_id_arg)
            emv = sess.query(EmvAnalysis).filter_by(id=aid, project_id=project_id).first()
        except (ValueError, TypeError):
            pass
    if not emv:
        p = sess.query(Project).filter_by(id=project_id, isDeleted=False).first()
        active_id = getattr(p, "active_emv_analysis_id", None) if p else None
        if active_id:
            emv = sess.query(EmvAnalysis).filter_by(id=active_id, project_id=project_id).first()
    if not emv:
        emv = (
            sess.query(EmvAnalysis)
            .filter_by(project_id=project_id)
            .order_by(EmvAnalysis.createdAt.desc())
            .first()
        )
    if not emv or not emv.report_html:
        return jsonify({"error": "No EM&V report found for this project"}), 404
    import re

    html = emv.report_html or ""
    html = re.sub(r"<script[^>]*>[\s\S]*?</script>", "", html, flags=re.IGNORECASE)
    from flask import Response

    return Response(html, mimetype="text/html; charset=utf-8")


@emv_bp.route("/secure/emv-report", methods=["GET"])
def emv_report_token():
    """
    GET /secure/emv-report?token=XXX
    Serve EM&V HTML report for client viewing. No login required - token-based access.
    """
    token = request.args.get("token")
    if not token:
        return (
            "<html><body><h2>Invalid link</h2><p>Token required.</p></body></html>",
            400,
            {"Content-Type": "text/html"},
        )
    sess = get_session()
    from app.models.emv_analysis import EmvAnalysis

    emv = sess.query(EmvAnalysis).filter_by(share_token=token).first()
    if not emv or not emv.report_html:
        return (
            "<html><body><h2>Report not found</h2><p>Invalid or expired link.</p></body></html>",
            404,
            {"Content-Type": "text/html"},
        )
    html = emv.report_html or ""
    import re
    html = re.sub(r"<script[^>]*>[\s\S]*?</script>", "", html, flags=re.IGNORECASE)
    return html, 200, {"Content-Type": "text/html; charset=utf-8"}
