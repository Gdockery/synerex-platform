"""
Web routes - homepage, account, project, client, whitelabel.
Ported from api/controllers/web/
"""
import json
import re
import secrets
import os
import time
from pathlib import Path

from sqlalchemy import insert

from flask import (
    Blueprint,
    Response,
    current_app,
    jsonify,
    redirect,
    render_template,
    request,
    send_from_directory,
    session,
    url_for,
)
from flask_cors import cross_origin
from flask_login import current_user, login_required

from app.extensions import db
from app.db.request_session import get_session
from app.helpers.decorators import license_required
from app.models.client import Client
from app.models.meter import Meter
from app.models.project import Project, project_user
from app.models.report_data import ReportData
from app.models.user import User
from app.models.xeco import Xeco
from app.services import pdf_service as pdf_service_module

web_bp = Blueprint("web", __name__, url_prefix="")


def _get_static_root():
    """Static root: .tmp/public or assets from 8087 dir."""
    from app.config import _8087_ROOT
    tmp_public = _8087_ROOT / ".tmp" / "public"
    assets = _8087_ROOT / "assets"
    return str(tmp_public) if tmp_public.exists() else str(assets)


def _get_branding_from_hostname(hostname):
    """Branding identifier from hostname. Returns None for defaults."""
    if not hostname:
        return current_app.config.get("DEFAULT_BRANDING", "tracking")
    if hostname.startswith("portal."):
        return None
    local = current_app.config.get("LOCAL_HOSTNAMES") or []
    if hostname in local:
        return current_app.config.get("DEFAULT_BRANDING", "tracking")
    parts = hostname.split(".")
    subdomain = parts[0].lower() if parts else ""
    if subdomain and subdomain not in ("", "www"):
        return subdomain
    return current_app.config.get("DEFAULT_BRANDING", "tracking")


def _get_brand_name():
    """Brand name from whitelabel (for legal pages). Supports domain mappings."""
    hostname = (request.host or "").split(":")[0]
    mappings = current_app.config.get("WHITELABEL_DOMAIN_MAPPINGS") or {}
    if hostname in mappings:
        branding = mappings[hostname]
    else:
        branding = _get_branding_from_hostname(hostname)
    if branding is None:
        return "Synerex"
    base_path = Path(current_app.config.get("WHITELABEL_BASE_PATH", ""))
    if base_path.exists():
        brand_file = base_path / branding / "brandname.txt"
        if brand_file.exists():
            try:
                return brand_file.read_text().strip() or "Synerex"
            except Exception:
                pass
    return "Synerex"


def _user_to_dict(user):
    """Serialize user for Angular (omit sensitive fields)."""
    if not user:
        return None
    d = {
        "id": user.id,
        "firstName": user.firstName,
        "lastName": user.lastName,
        "email": user.email,
        "role": user.role,
        "client": user.client,
        "defaultProject": user.defaultProject,
        "lastActiveAt": user.lastActiveAt,
    }
    if hasattr(user, "userLogo"):
        d["userLogo"] = bool(user.userLogo)
    return d


def _project_to_dict(p, include_meters=False, sess=None):
    """Serialize project for Angular (match Sails bootstrap shape for CurrentUserService)."""
    if not p:
        return None
    d = {
        "id": p.id,
        "name": p.name,
        "slug": p.slug,
        "client": p.client,
        "orgId": getattr(p, "org_id", None),
        "xecoManager": p.xecoManager,
        "timeZoneId": getattr(p, "timeZoneId", None) or "America/Chicago",
        "selectedTest": getattr(p, "selectedTest", None),
        "kvaSavings": getattr(p, "kvaSavings", None),
        "kvarSavings": getattr(p, "kvarSavings", None),
        "kwPeakSavings": getattr(p, "kwPeakSavings", None),
        "kwhSavings": getattr(p, "kwhSavings", None),
        "pfSavings": getattr(p, "pfSavings", None),
        "reportFields": getattr(p, "reportFields", None) or {},
        "activeEmvAnalysisId": getattr(p, "active_emv_analysis_id", None),
    }
    if include_meters:
        sess = sess or get_session()
        try:
            rows = sess.query(Meter.id, Meter.name).filter_by(project=p.id, isDeleted=False).all()
            d["meters"] = [{"id": r[0], "name": r[1]} for r in rows]
        except Exception:
            d["meters"] = []  # Schema mismatch (e.g. missing columns) - skip meters
    return d


def _serve_spa():
    """Render SPA with bootstrapped data. Used by / and SPA catch-all."""
    sess = get_session()
    user = sess.query(User).get(current_user.id)
    if not user:
        return redirect(url_for("auth.show_login_page"))
    projects = []
    if user.role == 8:
        projs = sess.query(Project).filter_by(isDeleted=False).all()
    else:
        proj_ids = sess.query(project_user.c.project_users).filter(
            project_user.c.user_projects == user.id
        ).all()
        proj_ids = [r[0] for r in proj_ids]
        projs = sess.query(Project).filter(Project.id.in_(proj_ids), Project.isDeleted == False).all()
    for p in projs:
        pd = _project_to_dict(p, include_meters=(user.role == 8), sess=sess)
        if pd:
            projects.append(pd)
    xeco = sess.query(Xeco).first()
    try:
        clients_q = sess.query(Client).filter_by(isDeleted=False).all()
        clients = [
            {
                "id": c.id,
                "name": c.name,
                "legalName": getattr(c, "legalName", None),
                "createdBy": getattr(c, "createdBy", None),
                "logoImgSrc": getattr(c, "logoImgSrc", None),
            }
            for c in clients_q
        ]
    except Exception:
        clients = []  # Schema mismatch (e.g. missing createdBy)
    website_url = current_app.config.get("WEBSITE_URL") or current_app.config.get("MY_ACCOUNT_URL", "") or ""
    website_home = website_url.rstrip("/").replace("/my-account", "") if website_url else ""
    my_account_url = current_app.config.get("MY_ACCOUNT_URL", "") or ""
    if not my_account_url and website_home:
        my_account_url = website_home

    # Docker env may use internal hostnames (website, license-service) - browser cannot resolve.
    # Use request host to build browser-facing URLs when we detect internal config.
    def _is_internal_host(u):
        if not u:
            return False
        for h in ("website", "license-service", "emv-program", "tracking-program", "proxy"):
            if h in u.lower():
                return True
        return False

    if request and _is_internal_host(website_url or my_account_url):
        # Prefer explicit public URL (e.g. http://localhost:5173) when set
        public_base = (current_app.config.get("TRACKING_PUBLIC_WEBSITE_URL") or "").rstrip("/").replace("/my-account", "")
        if not public_base:
            scheme = request.headers.get("X-Forwarded-Proto", request.scheme) or "http"
            host = request.headers.get("X-Forwarded-Host", request.host) or request.host
            public_base = f"{scheme}://{host}".rstrip("/")
        website_home = public_base
        my_account_url = public_base

    # EMV URL for "Run EM&V Analysis" link - must be browser-accessible
    emv_url = current_app.config.get("EMV_URL", "") or "http://localhost:8082"
    if request and _is_internal_host(emv_url):
        public_emv = (current_app.config.get("TRACKING_PUBLIC_EMV_URL") or "").rstrip("/")
        if not public_emv:
            scheme = request.headers.get("X-Forwarded-Proto", request.scheme) or "http"
            host = request.headers.get("X-Forwarded-Host", request.host) or request.host
            # When behind proxy: /emv/ serves EMV
            public_emv = f"{scheme}://{host}/emv".rstrip("/")
        emv_url = public_emv

    locals_data = {
        "environment": current_app.config.get("ENV", "development"),
        "user": _user_to_dict(user),
        "appVersion": current_app.config.get("APP_VERSION", "1.0.0"),
        "xecoAdvancedOptions": {"id": xeco.id} if xeco else {},
        "clients": clients,
        "xecoUsersAndAdmins": [],
        "myAccountUrl": my_account_url,
        "websiteHomeUrl": (website_home + "/") if website_home else "",
        "emvUrl": emv_url.rstrip("/"),
    }
    locals_data["user"]["projects"] = projects
    return render_template(
        "web/app.html",
        BOOTSTRAP_DATA=json.dumps(locals_data),
        app_version=locals_data["appVersion"],
        my_account_url=my_account_url,
        website_home_url=(website_home + "/") if website_home else "",
    )


# License-protected wrapper for SPA shell (used by / and /<path>)
_serve_spa_licensed = license_required(_serve_spa)


@web_bp.route("/secure/view")
def secure_view():
    """GET /secure/view?proposal=TOKEN|?depositInvoice=TOKEN|... - PDF download."""
    DOCUMENT_KINDS = [
        "proposal", "depositInvoice", "testReport", "finalInvoice", "installationInvoice",
        "totalInvoice", "billAnalytic", "costSavings", "lsPotential", "co2Savings",
        "partsProcurement", "budgetInvoice", "budgetReport", "financeAgreement",
        "shippingDocuments", "meterCertificate", "selectedBillAnalytic",
        "selectedProposal", "selectedShippingDocuments",
    ]
    document_share_token = None
    document_kind = None
    extra_params = {}
    for name in DOCUMENT_KINDS:
        val = request.args.get(name)
        if val:
            if document_share_token:
                return jsonify({"error": "Cannot specify multiple document types"}), 400
            document_kind = name
            if name in ("testReport", "meterCertificate", "selectedBillAnalytic",
                        "selectedProposal", "selectedShippingDocuments"):
                try:
                    parsed = json.loads(val) if isinstance(val, str) else val
                    if isinstance(parsed, dict):
                        document_share_token = parsed.get("token") or val
                        if name == "meterCertificate" and "meter" in parsed:
                            extra_params["meter"] = int(parsed["meter"])
                        elif name == "testReport":
                            if "test" in parsed:
                                extra_params["test"] = int(parsed["test"])
                            if "meters" in parsed:
                                extra_params["metersToReport"] = parsed["meters"]
                        elif name in ("selectedBillAnalytic", "selectedProposal", "selectedShippingDocuments") and "bills" in parsed:
                            extra_params["metersToReport"] = parsed["bills"]
                    else:
                        document_share_token = val
                except (json.JSONDecodeError, TypeError):
                    document_share_token = val
            else:
                document_share_token = val

    if not document_share_token:
        return jsonify({"error": "Invalid link. A document token must be specified."}), 400

    project = Project.query.filter_by(documentShareToken=document_share_token, isDeleted=False).first()
    if not project:
        return jsonify({"error": "Project not found"}), 404

    # Generate PDF for supported document kinds
    if document_kind in pdf_service_module.SUPPORTED_DOCUMENT_KINDS:
        try:
            pdf_stream = pdf_service_module.generate_pdf(project, document_kind, **extra_params)
            pdf_bytes = pdf_stream.read()
            filename = f"{document_kind}-{project.slug or project.id}.pdf"
            return Response(
                pdf_bytes,
                mimetype="application/pdf",
                headers={"Content-Disposition": f'inline; filename="{filename}"'},
            )
        except Exception as e:
            current_app.logger.exception("PDF generation failed")
            msg = f"PDF generation failed: {str(e)}"
            if "text/html" in (request.headers.get("Accept") or ""):
                return (
                    f"<html><body><h2>Document Error</h2><p>{msg}</p></body></html>",
                    500,
                    {"Content-Type": "text/html"},
                )
            return jsonify({"error": msg}), 500

    # Unsupported document kinds
    msg = "PDF generation is not yet available for this document type. The secure document view requires the Python PDF service."
    if "text/html" in (request.headers.get("Accept") or ""):
        return (
            f"<html><body><h2>Document Not Available</h2><p>{msg}</p></body></html>",
            501,
            {"Content-Type": "text/html"},
        )
    return jsonify({"error": msg}), 501


@web_bp.route("/invite/accept")
def invite_accept():
    """GET /invite/accept?token= - invite page for new users to set password."""
    token = request.args.get("token")
    if not token:
        return redirect(url_for("auth.show_login_page"))
    user = User.query.filter_by(resetPasswordToken=token).first()
    if not user:
        return redirect(url_for("auth.show_login_page"))
    return render_template(
        "auth/accept-invite.html",
        token=user.resetPasswordToken,
        email=user.email,
        full_name=f"{user.firstName} {user.lastName}",
    )


@web_bp.route("/")
def index():
    """Homepage - redirect to login or serve SPA with bootstrapped data."""
    token = request.args.get("token")
    if token:
        user = User.query.filter_by(resetPasswordToken=token).first()
        if user:
            return render_template(
                "auth/accept-invite.html",
                token=user.resetPasswordToken,
                email=user.email,
                full_name=f"{user.firstName} {user.lastName}",
            )
        return redirect(url_for("auth.show_login_page"))
    if not current_user.is_authenticated:
        return redirect(url_for("auth.show_login_page"))
    return _serve_spa_licensed()


@web_bp.route("/favicon.ico")
def favicon():
    """Avoid SPA bootstrap for favicon - return 204 or serve from static."""
    from app.config import _8087_ROOT
    for subdir in (".tmp/public", "assets", "images"):
        candidate = _8087_ROOT / subdir / "favicon.ico"
        if candidate.exists():
            return send_from_directory(str(candidate.parent), "favicon.ico")
    return Response(status=204)


@web_bp.route("/<path:path>")
@login_required
@license_required
def serve_spa_catchall(path):
    """SPA catch-all: serve index for Angular client-side routes. Requires valid license."""
    return _serve_spa()


@web_bp.route("/api/account", methods=["GET"])
@login_required
def get_account():
    """GET /api/account - logged-in user details."""
    user = User.query.get(current_user.id)
    if not user:
        return jsonify({"error": "User session not found"}), 200

    default_project = None
    if user.defaultProject:
        p = Project.query.get(user.defaultProject)
        if p:
            default_project = {"id": p.id, "name": p.name}

    resp = {
        "id": user.id,
        "firstName": user.firstName,
        "lastName": user.lastName,
        "email": user.email,
        "defaultProject": default_project,
        "lastActiveAt": user.lastActiveAt,
    }
    if hasattr(user, "userLogo"):
        resp["userLogo"] = bool(user.userLogo)
    return jsonify({"meta": {}, "response": resp})


@web_bp.route("/api/account", methods=["PUT"])
@login_required
@license_required
def update_account():
    """PUT /api/account - update logged-in user."""
    data = request.get_json() or {}
    user = User.query.get(current_user.id)
    if not user:
        return jsonify({"error": "Not found"}), 404

    for k in ("firstName", "lastName", "email", "phone", "defaultProject"):
        if k in data:
            setattr(user, k, data[k])
    db.session.commit()
    return jsonify({"meta": {}, "response": {"id": user.id}})


@web_bp.route("/api/account/<int:uid>/upload-logo", methods=["POST"])
@login_required
@license_required
def upload_user_logo(uid):
    """POST /api/account/:id/upload-logo - multipart form with logo file (My Account)."""
    if current_user.id != uid and current_user.role != 8:
        return jsonify({"error": "Forbidden"}), 403
    user = User.query.get(uid)
    if not user:
        return jsonify({"error": "User not found"}), 404

    logo = request.files.get("logo")
    if not logo or not logo.filename:
        return jsonify({"error": "logo file required"}), 400

    storage = Path(current_app.config.get("STORAGE_LOCAL_PATH", ""))
    if not storage:
        return jsonify({"error": "Storage not configured"}), 500

    upload_dir = storage / "images" / "user_company_logo"
    upload_dir.mkdir(parents=True, exist_ok=True)

    basename = f"{uid}-user-logo"
    dest = upload_dir / basename
    try:
        logo.save(str(dest))
        if hasattr(user, "userLogo"):
            user.userLogo = True
        db.session.commit()
        return jsonify({"message": "1 file(s) uploaded successfully!"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@web_bp.route("/api/account", methods=["POST"])
def accept_invite():
    """POST /api/account - accept invite (no login required)."""
    data = request.get_json() or request.form or {}
    token = data.get("token")
    password = data.get("password")
    if not token or not password:
        return jsonify({"error": "Token and password required"}), 400

    user = User.query.filter_by(resetPasswordToken=token).first()
    if not user:
        return jsonify({"error": "Invalid token"}), 404

    import bcrypt
    user.hashedPassword = bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=8)).decode()
    user.resetPasswordToken = ""
    db.session.commit()
    return jsonify({"meta": {}, "response": {"id": user.id}})


@web_bp.route("/api/project", methods=["GET"])
@web_bp.route("/api/project/", methods=["GET"])
@login_required
@license_required
def list_projects():
    """GET /api/project - list projects with pagination."""
    sess = get_session()
    page = request.args.get("page", 1, type=int)
    page_size = request.args.get("pageSize", 500, type=int)
    page_size = min(page_size, 500)
    name = request.args.get("name", "").strip()
    client_arg = request.args.get("client")
    client_id = None
    if client_arg is not None and str(client_arg).strip():
        try:
            client_id = int(client_arg)
        except (ValueError, TypeError):
            pass

    current_app.logger.info("[list_projects] client_arg=%r client_id=%s", client_arg, client_id)

    q = sess.query(Project).filter_by(isDeleted=False)
    if name:
        q = q.filter(Project.name.ilike(f"%{name}%"))
    if client_id:
        q = q.filter(Project.client == client_id)

    q = q.order_by(Project.name.asc())
    total = q.count()
    items = q.offset((page - 1) * page_size).limit(page_size).all()
    current_app.logger.info("[list_projects] total=%d items=%d (client_id=%s)", total, len(items), client_id)

    rows = []
    for p in items:
        row = {"id": p.id, "name": p.name, "slug": p.slug, "xecoManager": p.xecoManager}
        if p.client:
            c = sess.query(Client).get(p.client)
            row["client"] = {"id": c.id, "name": c.name} if c else {"id": p.client, "name": "(deleted)"}
        else:
            row["client"] = None
        if p.xecoManager:
            u = sess.query(User).get(p.xecoManager)
            if u:
                row["xecoManager"] = {"id": u.id, "fullName": f"{u.firstName} {u.lastName}"}
        rows.append(row)

    return jsonify({"meta": {"page": page, "total": total}, "response": rows})


@web_bp.route("/api/project/<int:pid>", methods=["GET"])
@login_required
@license_required
def get_project(pid):
    """GET /api/project/:id"""
    sess = get_session()
    p = sess.query(Project).filter_by(id=pid, isDeleted=False).first()
    if not p:
        return jsonify({"error": "Not found"}), 404
    user = sess.query(User).get(current_user.id) if current_user.is_authenticated else None
    if not user:
        return jsonify({"error": "Unauthorized"}), 403
    if user.role != 8:
        row = sess.query(project_user).filter(
            project_user.c.project_users == pid,
            project_user.c.user_projects == user.id,
        ).first()
        if not row:
            return jsonify({"error": "Unauthorized"}), 403
    return jsonify({"meta": {}, "response": _project_to_dict(p, sess=sess)})


def _slugify(name):
    """Generate kebab-case slug from name."""
    s = re.sub(r"[^a-z0-9]+", "-", (name or "").lower()).strip("-")
    return s or "project"


def _create_report_data_for_project(project_id):
    """Create ReportData records for a new project."""
    records = [
        ("week", "kwh", "weeklykwh"),
        ("today", "kwh", "today kwh"),
        ("month", "avgKva", ""),
        ("month", "kwh", ""),
        ("month", "peak", ""),
        ("lastMonth", "kwh", ""),
        ("lastMonth", "peak", ""),
        ("lastMonth", "totalCost", ""),
        ("lastMonth", "totalSavings", ""),
        ("year", "totalSavings", ""),
        ("lastYear", "totalSavings", ""),
        ("allTime", "totalSavings", ""),
        ("today", "I2RLossSavings", ""),
        ("week", "I2RLossSavings", ""),
        ("month", "I2RLossSavings", ""),
        ("lastMonth", "I2RLossSavings", ""),
        ("year", "I2RLossSavings", ""),
        ("lastYear", "I2RLossSavings", ""),
        ("allTime", "I2RLossSavings", ""),
        ("year", "carbonSavings", ""),
        ("allTime", "carbonSavings", ""),
        ("allTime", "carbonSavingsAmount", ""),
        ("allTime", "kwhSavingsAmount", ""),
        ("allTime", "peakSavingsAmount", ""),
        ("allTime", "peakSavings", ""),
        ("allTime", "kwhSavings", ""),
        ("allTime", "I2RLossSavingsAmount", ""),
        ("month", "pfc", ""),
        ("lastMonth", "pfc", ""),
        ("year", "pfc", ""),
        ("lastYear", "pfc", ""),
        ("allTime", "pfc", ""),
    ]
    sess = get_session()
    for period, value_type, desc in records:
        rd = ReportData(
            type="project",
            typeId=project_id,
            project=project_id,
            period=period,
            valueType=value_type,
            description=desc or "",
            value=0,
        )
        sess.add(rd)


PROJECT_UPDATE_BLACKLIST = {"id", "createdAt", "updatedAt", "isDeleted", "org_id"}
CLIENT_UPDATE_BLACKLIST = {"id", "createdAt", "updatedAt", "isDeleted", "users", "org_id"}

_PROJECT_BOOL_FIELDS = {"subNeeded", "gwControl"}
_PROJECT_INT_NULLABLE_FIELDS = {"xecoManager", "selectedTest", "servicePlan", "active_emv_analysis_id"}
_SANITIZE_SKIP = object()  # sentinel: do not set this attribute


def _extract_client_id(v):
    """Extract client ID from int, str, or object with id. Returns None if invalid/empty."""
    if v is None:
        return None
    if isinstance(v, (int, float)) and v == int(v):
        return int(v)
    if isinstance(v, str) and v.strip():
        try:
            return int(v)
        except (ValueError, TypeError):
            return None
    if isinstance(v, dict):
        return _extract_client_id(v.get("id"))
    if hasattr(v, "id"):
        return _extract_client_id(getattr(v, "id"))
    return None


def _sanitize_project_val(k, v):
    """Convert empty/invalid form values for Project model columns. Returns _SANITIZE_SKIP to skip."""
    if v is None:
        return None
    if k == "client":
        cid = _extract_client_id(v)
        if cid is None:
            return _SANITIZE_SKIP
        return cid
    if v == "":
        if k in _PROJECT_BOOL_FIELDS:
            return False
        if k in _PROJECT_INT_NULLABLE_FIELDS:
            return None
        if k in ("depositAmount", "discount", "totalCost", "carbonCreditRate", "salesTax",
                 "currencyExchangeRate", "multiplier", "peakMultiplier", "initialPf", "ILRatio",
                 "kwRate", "kwhRate", "taxRate"):
            return _SANITIZE_SKIP  # float/numeric - '' would fail
        return ""  # string fields accept ''
    return v


@web_bp.route("/api/project/create-from-bill", methods=["POST"])
@login_required
@license_required
def create_project_from_bill():
    """
    POST /api/project/create-from-bill
    Create Client + Project + electricBillAnalysis in one transaction.
    Body: { client?: {...}, clientId?: int, project: {...}, electricBillAnalysis: {...} }
    Use clientId to attach to existing client; otherwise client object creates new client.
    """
    sess = get_session()
    data = request.get_json() or {}
    client_vals = data.get("client") or {}
    client_id = data.get("clientId")
    project_vals = data.get("project") or {}
    electric_bill_analysis = data.get("electricBillAnalysis")

    if not project_vals.get("name"):
        return jsonify({"error": "Project name is required"}), 400
    if electric_bill_analysis is None:
        return jsonify({"error": "Bill analytic data is required"}), 400

    try:
        # 1. Client: create new or use existing
        if client_id:
            c = sess.query(Client).filter_by(id=client_id, isDeleted=False).first()
            if not c:
                return jsonify({"error": "Client not found or access denied"}), 400
            # Ensure client has org_id so project appears in EMV dropdown
            if not (getattr(c, "org_id", None) or "").strip():
                from app.services.org_registry import ensure_org
                org_name = getattr(c, "name", None) or "Unknown"
                org_id_from_session = session.get("orgId") or (session.get("user") or {}).get("org_id")
                result = ensure_org(org_name=org_name, org_type="customer", org_id=org_id_from_session)
                if result and result.get("org_id"):
                    c.org_id = result["org_id"]
                    sess.add(c)
                    sess.flush()
        else:
            if not client_vals.get("name"):
                return jsonify({"error": "Client name is required when creating a new client"}), 400
            org_name = client_vals.get("name") or client_vals.get("legalName") or "Unknown"
            role = getattr(current_user, "role", None)
            org_id_from_session = None
            if role != 8:
                org_id_from_session = session.get("orgId") or (session.get("user") or {}).get("org_id")
            from app.services.org_registry import ensure_org
            result = ensure_org(org_name=org_name, org_type="customer", org_id=org_id_from_session)
            org_id = result.get("org_id") if result else None
            c = Client(
                name=client_vals["name"],
                org_id=org_id,
                isDeleted=False,
                createdBy=current_user.id,
            )
            for k in ("legalName", "address", "city", "state", "zip", "country",
                      "contactName", "contactTitle", "contactPhone", "marketSegment",
                      "taxId", "shippingTerms", "salesTax", "financeEmail", "financePhone",
                      "managerName", "managerPhone", "managerEmail", "managerLocation"):
                if k in client_vals and client_vals[k] is not None:
                    setattr(c, k, client_vals[k])
            sess.add(c)
            sess.flush()

        # 2. Create Project
        slug = project_vals.get("slug") or _slugify(project_vals["name"])
        if sess.query(Project).filter_by(slug=slug).first():
            slug = f"{slug}-{secrets.token_hex(4)}"

        doc_token = secrets.token_urlsafe(32)
        sales_tax = client_vals.get("salesTax")
        if sales_tax is None and c.salesTax is not None:
            sales_tax = c.salesTax

        p = Project(
            name=project_vals["name"],
            slug=slug,
            client=c.id,
            org_id=c.org_id,
            documentShareToken=doc_token,
            salesTax=sales_tax,
            timeZoneId=project_vals.get("timeZoneId") or "America/Chicago",
            isDeleted=False,
            electricBillAnalysis=electric_bill_analysis,
            electricBillAnalysisUpdatedAt=int(time.time() * 1000),
        )
        for k in ("location", "proposalNumber", "startDate"):
            if k in project_vals and project_vals[k] is not None:
                setattr(p, k, project_vals[k])
        sess.add(p)
        sess.flush()

        # 3. ReportData
        _create_report_data_for_project(p.id)

        # 4. Assign current user to project
        sess.execute(
            insert(project_user).values(
                project_users=p.id,
                user_projects=current_user.id,
            )
        )
        sess.commit()

        # Response: project with client and electricBillAnalysis
        client_dict = {
            "id": c.id,
            "name": c.name,
            "address": c.address,
            "city": c.city,
            "state": c.state,
            "zip": c.zip,
        }
        proj_dict = _project_to_dict(p, sess=sess)
        if proj_dict:
            proj_dict["client"] = client_dict
            proj_dict["electricBillAnalysis"] = electric_bill_analysis
        return jsonify({
            "meta": {},
            "response": proj_dict or {"id": p.id, "client": client_dict, "electricBillAnalysis": electric_bill_analysis},
        })
    except Exception as e:
        sess.rollback()
        current_app.logger.exception("create_from_bill failed")
        return jsonify({"error": str(e)}), 500


@web_bp.route("/api/project", methods=["POST"])
@web_bp.route("/api/project/", methods=["POST"])
@login_required
@license_required
def create_project():
    """POST /api/project - create project (valuesToSet)."""
    sess = get_session()
    data = request.get_json() or {}
    vals = data.get("valuesToSet") or {}
    if not vals.get("name"):
        return jsonify({"error": "name required"}), 400

    client_id = _extract_client_id(vals.get("client"))
    current_app.logger.info("[create_project] vals.client=%s -> client_id=%s", vals.get("client"), client_id)
    if not client_id:
        return jsonify({"error": "client required"}), 400

    client = sess.query(Client).filter_by(id=client_id, isDeleted=False).first()
    if not client:
        return jsonify({"error": "Client not found"}), 400

    # Ensure client has org_id so project appears in EMV dropdown (filtered by org_id)
    client_org_id = getattr(client, "org_id", None) or ""
    if not str(client_org_id).strip():
        from app.services.org_registry import ensure_org
        org_name = getattr(client, "name", None) or client.name or vals.get("name", "Unknown")
        org_id_from_session = session.get("orgId") or (session.get("user") or {}).get("org_id")
        result = ensure_org(org_name=org_name, org_type="customer", org_id=org_id_from_session)
        if result and result.get("org_id"):
            client.org_id = result["org_id"]
            sess.add(client)
            sess.flush()
            client_org_id = client.org_id
            current_app.logger.info("[create_project] backfilled client org_id=%s for client id=%s", client_org_id, client.id)

    slug = vals.get("slug") or _slugify(vals["name"])
    if sess.query(Project).filter_by(slug=slug).first():
        slug = f"{slug}-{secrets.token_hex(4)}"

    doc_token = secrets.token_urlsafe(32)
    sales_tax = vals.get("salesTax")
    if sales_tax is None and client.salesTax is not None:
        sales_tax = client.salesTax

    p = Project(
        name=vals["name"],
        slug=slug,
        client=client_id,
        org_id=getattr(client, "org_id", None),
        documentShareToken=doc_token,
        salesTax=sales_tax,
        timeZoneId=vals.get("timeZoneId") or "America/Chicago",
        isDeleted=False,
    )
    for k in (
        "location", "proposalNumber", "invoiceNumber", "workOrder", "purchaseOrder",
        "depositAmount", "discount", "totalCost", "carbonCreditRate", "currencyCode",
        "currencyExchangeRate", "startDate", "subNeeded", "subStartDate",
        "xecoManager", "gwControl", "electricBillAnalysis", "equipmentInfo", "reportFields",
    ):
        if k not in vals:
            continue
        v = _sanitize_project_val(k, vals[k])
        if v is _SANITIZE_SKIP or (v is None and k not in _PROJECT_INT_NULLABLE_FIELDS):
            continue
        setattr(p, k, v)

    sess.add(p)
    sess.flush()

    _create_report_data_for_project(p.id)

    # Assign creating user to project (required for project to appear in user's bootstrap/sidebar)
    sess.execute(
        insert(project_user).values(
            project_users=p.id,
            user_projects=current_user.id,
        )
    )
    sess.commit()
    current_app.logger.info("[create_project] created project id=%s name=%r client=%s org_id=%s", p.id, p.name, p.client, getattr(p, "org_id", None))
    return jsonify({
        "meta": {},
        "response": {
            "id": p.id,
            "orgId": getattr(p, "org_id", None),
            "client": p.client,
            "name": p.name,
        },
    })


@web_bp.route("/api/project/<int:pid>", methods=["PUT"])
@login_required
@license_required
def update_project(pid):
    """PUT /api/project/:id - update project (valuesToSet)."""
    sess = get_session()
    p = sess.query(Project).filter_by(id=pid, isDeleted=False).first()
    if not p:
        return jsonify({"error": "Not found"}), 404

    data = request.get_json() or {}
    vals = data.get("valuesToSet") or {}
    if "client" in vals:
        v = _sanitize_project_val("client", vals["client"])
        current_app.logger.info("[update_project] pid=%s vals.client=%s -> sanitized=%s (p.client before=%s)",
                                pid, vals.get("client"), v, p.client)
    for k, v in vals.items():
        if k in PROJECT_UPDATE_BLACKLIST:
            continue
        if not hasattr(p, k):
            continue
        v = _sanitize_project_val(k, v)
        if v is _SANITIZE_SKIP:
            continue
        setattr(p, k, v)
    sess.commit()
    current_app.logger.info("[update_project] pid=%s done, p.client=%s", pid, p.client)
    return jsonify({"meta": {}, "response": {"id": p.id}})


@web_bp.route("/api/project/<int:pid>", methods=["DELETE"])
@login_required
@license_required
def destroy_project(pid):
    """DELETE /api/project/:id - soft delete."""
    sess = get_session()
    p = sess.query(Project).filter_by(id=pid, isDeleted=False).first()
    if not p:
        return jsonify({"error": "Not found"}), 404
    p.isDeleted = True
    sess.commit()
    return jsonify({"meta": {}, "response": {"id": pid}})


@web_bp.route("/api/client", methods=["GET"])
@web_bp.route("/api/client/", methods=["GET"])
@login_required
@license_required
def list_clients():
    """GET /api/client - list clients with pagination. Supports page, pageSize, orderBy, orderDirection, name, contactName, country."""
    sess = get_session()
    page = request.args.get("page", 1, type=int)
    page_size = min(request.args.get("pageSize", 10, type=int), 500)
    order_by = request.args.get("orderBy", "name")
    order_dir = request.args.get("orderDirection", "ASC").upper()

    base = sess.query(Client).filter_by(isDeleted=False)
    name_filter = request.args.get("name", "").strip()
    if name_filter:
        base = base.filter(Client.name.ilike(f"%{name_filter}%"))
    contact_filter = request.args.get("contactName", "").strip()
    if contact_filter:
        base = base.filter(Client.contactName.ilike(f"%{contact_filter}%"))
    country_filter = request.args.get("country", "").strip()
    if country_filter:
        base = base.filter(Client.country.ilike(f"%{country_filter}%"))

    total = base.count()

    if order_by and order_by in ("name", "contactName", "country", "legalName", "id"):
        col = getattr(Client, order_by, Client.name)
        if order_dir == "DESC":
            col = col.desc()
        base = base.order_by(col)
    else:
        base = base.order_by(Client.name)

    offset = (page - 1) * page_size
    clients = base.offset(offset).limit(page_size).all()

    records = [
        {
            "id": c.id,
            "name": c.name,
            "legalName": c.legalName,
            "contactName": getattr(c, "contactName", None),
            "country": getattr(c, "country", None),
            "org_id": getattr(c, "org_id", None),
        }
        for c in clients
    ]
    return jsonify({"meta": {"page": page, "total": total}, "response": records})


@web_bp.route("/api/client/<int:cid>", methods=["GET"])
@login_required
@license_required
def get_client(cid):
    """GET /api/client/:id"""
    sess = get_session()
    c = sess.query(Client).filter_by(id=cid, isDeleted=False).first()
    if not c:
        return jsonify({"error": "Not found"}), 404
    resp = {"id": c.id, "name": c.name, "legalName": c.legalName, "address": c.address}
    if hasattr(c, "org_id"):
        resp["org_id"] = c.org_id
    return jsonify({"meta": {}, "response": resp})


@web_bp.route("/api/client", methods=["POST"])
@web_bp.route("/api/client/", methods=["POST"])
@login_required
@license_required
def create_client():
    """POST /api/client - create client (valuesToSet). Registers org_id with License service."""
    sess = get_session()
    data = request.get_json() or {}
    vals = data.get("valuesToSet") or {}
    if not vals.get("name"):
        return jsonify({"error": "name required"}), 400
    vals.setdefault("createdBy", current_user.id)
    vals.setdefault("isDeleted", False)
    c = Client()
    # Ensure org in License registry (create or adopt) - org_id available to all programs
    org_name = vals.get("name") or vals.get("legalName") or "Unknown"
    role = getattr(current_user, "role", None)
    org_id_from_session = None
    if role != 8:  # Not XECO_ADMIN - customer creating their own client, adopt their org
        org_id_from_session = session.get("orgId") or (session.get("user") or {}).get("org_id")
    from app.services.org_registry import ensure_org
    result = ensure_org(org_name=org_name, org_type="customer", org_id=org_id_from_session)
    if result:
        c.org_id = result.get("org_id")
    for k, v in vals.items():
        if k in CLIENT_UPDATE_BLACKLIST:
            continue
        if hasattr(c, k):
            setattr(c, k, v)
    sess.add(c)
    sess.commit()
    return jsonify({"meta": {}, "response": {"id": c.id, "org_id": c.org_id}})


@web_bp.route("/api/client/<int:cid>", methods=["PUT"])
@login_required
@license_required
def update_client(cid):
    """PUT /api/client/:id - update client (valuesToSet)."""
    sess = get_session()
    c = sess.query(Client).filter_by(id=cid, isDeleted=False).first()
    if not c:
        return jsonify({"error": "Not found"}), 404
    data = request.get_json() or {}
    vals = data.get("valuesToSet") or {}
    for k, v in vals.items():
        if k in CLIENT_UPDATE_BLACKLIST:
            continue
        if hasattr(c, k):
            setattr(c, k, v)
    sess.commit()
    return jsonify({"meta": {}, "response": {"id": c.id}})


@web_bp.route("/api/client/<int:cid>", methods=["DELETE"])
@login_required
@license_required
def destroy_client(cid):
    """DELETE /api/client/:id - soft delete."""
    sess = get_session()
    c = sess.query(Client).filter_by(id=cid, isDeleted=False).first()
    if not c:
        return jsonify({"error": "Not found"}), 404
    c.isDeleted = True
    sess.commit()
    return jsonify({"meta": {}, "response": {"id": cid}})


@web_bp.route("/api/client/<int:cid>/upload-logo", methods=["POST"])
@login_required
@license_required
def upload_client_logo(cid):
    """POST /api/client/:id/upload-logo - multipart form with logo file."""
    sess = get_session()
    c = sess.query(Client).filter_by(id=cid, isDeleted=False).first()
    if not c:
        return jsonify({"error": "Not found"}), 404

    logo = request.files.get("logo")
    if not logo or not logo.filename:
        return jsonify({"error": "logo file required"}), 400

    storage = Path(current_app.config.get("STORAGE_LOCAL_PATH", ""))
    if not storage:
        return jsonify({"error": "Storage not configured"}), 500

    upload_dir = storage / "images" / "client_company_logo"
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Frontend expects /images/client_company_logo/{id}-client-logo (no ext)
    basename = f"{cid}-client-logo"
    dest = upload_dir / basename
    try:
        logo.save(str(dest))
        c.logoImgSrc = basename
        sess.commit()
        return jsonify({"message": "1 file(s) uploaded successfully!"})
    except Exception as e:
        sess.rollback()
        return jsonify({"error": str(e)}), 500


@web_bp.route("/faq")
def faq_page():
    """GET /faq - Frequently Asked Questions."""
    return render_template("legal/faq.html", brand_name=_get_brand_name())


@web_bp.route("/terms")
def terms_page():
    """GET /terms - Terms of Use."""
    return render_template("legal/terms.html", brand_name=_get_brand_name())


@web_bp.route("/agreement")
def agreement_page():
    """GET /agreement - Privacy Policy."""
    return render_template("legal/agreement.html", brand_name=_get_brand_name())


@web_bp.route("/api/whitelabel/brand-name", methods=["GET"])
def get_brand_name():
    """GET /api/whitelabel/brand-name - no auth required."""
    hostname = request.host or ""
    base_path = Path(current_app.config.get("WHITELABEL_BASE_PATH", ""))
    if not base_path.exists():
        return jsonify({"response": "Synerex"})

    parts = hostname.split(".")
    subdomain = parts[0].lower() if parts else ""
    if subdomain in ("", "www", "portal"):
        return jsonify({"response": "Synerex"})

    brand_file = base_path / subdomain / "brandname.txt"
    if brand_file.exists():
        try:
            return jsonify({"response": brand_file.read_text().strip() or "Synerex"})
        except Exception:
            pass
    return jsonify({"response": "Synerex"})


@web_bp.route("/js/<path:path>")
@web_bp.route("/css/<path:path>")
@web_bp.route("/images/<path:path>")
@web_bp.route("/fonts/<path:path>")
@web_bp.route("/scripts/<path:path>")
def serve_static(path):
    """Serve static assets. Production: redirect to S3. Images: check whitelabel first."""
    prefix = request.path.split("/", 2)[1]
    # S3 redirect in production (skip when test_prod)
    s3_bucket = current_app.config.get("S3_BUCKET_NAME")
    env = current_app.config.get("ENV", "development")
    environment = current_app.config.get("ENVIRONMENT", env)  # test_prod skips S3
    if s3_bucket and env == "production" and environment != "test_prod":
        region = current_app.config.get("S3_REGION", "")
        region_part = f".{region}" if region else ""
        app_ver = current_app.config.get("APP_VERSION", "1.0.0")
        s3_url = f"https://s3{region_part}.amazonaws.com/{s3_bucket}/{app_ver}/static{request.path}"
        return redirect(s3_url, code=302)
    # Whitelabel image lookup for /images/*
    if prefix == "images":
        hostname = (request.host or "").split(":")[0]
        mappings = current_app.config.get("WHITELABEL_DOMAIN_MAPPINGS") or {}
        branding = mappings.get(hostname) or _get_branding_from_hostname(hostname)
        if branding:
            base = Path(current_app.config.get("WHITELABEL_BASE_PATH", ""))
            if base.exists():
                whitelabel_file = base / branding / "images" / path
                if whitelabel_file.exists() and whitelabel_file.is_file():
                    img_dir = base / branding / "images"
                    return send_from_directory(str(img_dir), path)
    # Default: serve from 8087 static root
    static_root = Path(_get_static_root())
    folder = static_root / prefix
    if folder.exists():
        return send_from_directory(str(folder), path)
    return {"error": "Not found"}, 404


@web_bp.route("/assets/images/company_logo", methods=["POST"])
@web_bp.route("/assets/images/company_logo/", methods=["POST"])
@login_required
@license_required
def upload_company_logo_legacy():
    """POST /assets/images/company_logo - legacy logo upload."""
    upload = request.files and list(request.files.values())
    file = upload[0] if upload and hasattr(upload[0], "filename") else request.files.get("file") or request.files.get("logo")
    if not file or not getattr(file, "filename", None):
        return jsonify({"error": "No file provided"}), 400
    storage = Path(current_app.config.get("STORAGE_LOCAL_PATH", ""))
    if not storage:
        return jsonify({"error": "Storage not configured"}), 500
    upload_dir = storage / "images" / "company_logo"
    upload_dir.mkdir(parents=True, exist_ok=True)
    ext = Path(file.filename).suffix or ""
    basename = f"upload-{secrets.token_hex(8)}{ext}"
    dest = upload_dir / basename
    try:
        file.save(str(dest))
        return jsonify({"filename": basename, "path": f"/images/company_logo/{basename}"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@web_bp.route("/files/<path:path>")
@cross_origin()
def serve_files(path):
    """Serve /files/* from storage."""
    storage = Path(current_app.config.get("STORAGE_LOCAL_PATH", ""))
    if not storage:
        return {"error": "Not configured"}, 404
    files_dir = storage / "files"
    full = files_dir / path
    if full.exists() and full.is_file():
        return send_from_directory(str(files_dir), path)
    return {"error": "Not found"}, 404
