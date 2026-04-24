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

from sqlalchemy import insert, or_

from flask import (
    Blueprint,
    Response,
    current_app,
    jsonify,
    make_response,
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
from app.models.xeco import CompanySettings
from app.services import pdf_service as pdf_service_module

web_bp = Blueprint("web", __name__, url_prefix="")


def _login_url():
    """Login URL with application root when behind proxy (e.g. /tracking/login)."""
    base = current_app.config.get("APPLICATION_ROOT", "") or ""
    return f"{base}/login" if base else url_for("auth.show_login_page")


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


_ROLE_FRIENDLY_NAMES = {
    1: "Client User",
    2: "Client Admin",
    3: "Client Manager",
    4: "Xeco User",
    7: "Account Manager",
    8: "Synerex Admin",
    9: "OEM Admin",
    10: "OEM User",
}


def _get_client_name_for_user(user):
    """Return the client company name for the given user, or None."""
    if not user or not user.client:
        return None
    try:
        from app.db.db import get_session as _gs
        from app.models.client import Client
        client = _gs().query(Client).get(user.client)
        return client.name if client else None
    except Exception:
        return None


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
        "roleFriendlyName": _ROLE_FRIENDLY_NAMES.get(getattr(user, "role", None), "User"),
        "client": user.client,
        "clientName": _get_client_name_for_user(user),
        "defaultProject": user.defaultProject,
        "lastActiveAt": user.lastActiveAt,
    }
    if hasattr(user, "userLogo"):
        d["userLogo"] = bool(user.userLogo)
    # Include orgId for OEM users so Angular can load the OEM's own logo in the navbar
    if getattr(user, "role", None) in (9, 10):
        org_id = getattr(user, "org_id", None) or session.get("orgId")
        if org_id:
            d["orgId"] = org_id
    # Include sponsorOrgId for client users so Angular can load the OEM's logo
    if user.client:
        try:
            from app.models.client import Client as _Client
            c = get_session().query(_Client).get(user.client)
            if c:
                sponsor = getattr(c, "sponsor_org_id", None)
                if sponsor:
                    d["sponsorOrgId"] = sponsor
        except Exception:
            pass
    # JIT-provisioned client users: user.client is None but org_id is set directly on the user row
    elif getattr(user, "role", None) in (1, 2, 3, 4, 5, 6, 7):
        jit_org_id = getattr(user, "org_id", None)
        if jit_org_id:
            d["orgId"] = jit_org_id
            try:
                from app.models.client import Client as _Client
                c = get_session().query(_Client).filter_by(org_id=jit_org_id).first()
                if c:
                    sponsor = getattr(c, "sponsor_org_id", None)
                    if sponsor:
                        d["sponsorOrgId"] = sponsor
            except Exception:
                pass
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
        "documentShareToken": getattr(p, "documentShareToken", None),
        "xecoManager": p.xecoManager,
        "timeZoneId": getattr(p, "timeZoneId", None) or "America/Chicago",
        "selectedTest": getattr(p, "selectedTest", None),
        "kvaSavings": getattr(p, "kvaSavings", None),
        "kvarSavings": getattr(p, "kvarSavings", None),
        "kwPeakSavings": getattr(p, "kwPeakSavings", None),
        "kwhSavings": getattr(p, "kwhSavings", None),
        "pfSavings": getattr(p, "pfSavings", None),
        "reportFields": getattr(p, "reportFields", None) or {},
        "electricBillAnalysis": getattr(p, "electricBillAnalysis", None) or {},
        "electricBillAnalysisUpdatedAt": getattr(p, "electricBillAnalysisUpdatedAt", None),
        "equipmentInfo": getattr(p, "equipmentInfo", None) or None,
        "salesTax": getattr(p, "salesTax", None),
        "discount": getattr(p, "discount", None),
        "currencyCode": getattr(p, "currencyCode", None),
        "currencyExchangeRate": getattr(p, "currencyExchangeRate", None),
        "activeEmvAnalysisId": getattr(p, "active_emv_analysis_id", None),
        "location": getattr(p, "location", None),
    }
    if include_meters:
        sess = sess or get_session()
        try:
            rows = (
                sess.query(Meter.id, Meter.name, Meter.isReporting)
                .filter_by(project=p.id, isDeleted=False)
                .all()
            )
            # Include isReporting so Angular ViewTestComponent can auto-check reporting meters
            # (it uses meter.isReporting == 1; omitted field was always undefined before).
            d["meters"] = [
                {"id": r[0], "name": r[1], "isReporting": 1 if r[2] else 0}
                for r in rows
            ]
        except Exception:
            d["meters"] = []  # Schema mismatch (e.g. missing columns) - skip meters
    return d


def _serve_spa():
    """Render SPA with bootstrapped data. Used by / and SPA catch-all."""
    sess = get_session()
    user = sess.query(User).get(current_user.id)
    if not user:
        return redirect(_login_url())
    projects = []
    if user.role == 8:
        # Synerex Admin sees all projects
        projs = sess.query(Project).filter_by(isDeleted=False).all()
    elif user.role in (1, 2, 3, 4) and user.client:
        # Client users: automatically see ALL projects under their client org
        # (no manual junction-table assignment required — OEM creates project → client sees it)
        projs = sess.query(Project).filter_by(client=user.client, isDeleted=False).all()
    elif user.role in (9, 10) and user.org_id:
        # OEM users: see all projects for clients they sponsor or own
        oem_clients = sess.query(Client).filter(
            db.or_(Client.sponsor_org_id == user.org_id, Client.org_id == user.org_id),
            Client.isDeleted == False
        ).all()
        client_ids = [c.id for c in oem_clients]
        projs = sess.query(Project).filter(
            Project.client.in_(client_ids), Project.isDeleted == False
        ).all() if client_ids else []
    else:
        proj_ids = sess.query(project_user.c.project_users).filter(
            project_user.c.user_projects == user.id
        ).all()
        proj_ids = [r[0] for r in proj_ids]
        projs = sess.query(Project).filter(Project.id.in_(proj_ids), Project.isDeleted == False).all()
    for p in projs:
        pd = _project_to_dict(p, include_meters=(user.role in (8, 9, 10)), sess=sess)
        if pd:
            projects.append(pd)
    xeco = sess.query(CompanySettings).first()
    try:
        clients_q = sess.query(Client).filter_by(isDeleted=False).all()
        # OEM users (9, 10): only their org's clients, excluding OEM's own client record
        if user.role in (9, 10):
            org_id_bootstrap = session.get("orgId") or (session.get("user") or {}).get("orgId")
            if not org_id_bootstrap and user.client:
                oem_c = sess.query(Client).get(user.client)
                if oem_c:
                    org_id_bootstrap = getattr(oem_c, "org_id", None)
            if org_id_bootstrap:
                clients_q = [
                    c for c in clients_q
                    if (getattr(c, "org_id", None) == org_id_bootstrap or getattr(c, "sponsor_org_id", None) == org_id_bootstrap)
                    and (not user.client or c.id != user.client)
                ]
        # Client Admin (2), Client Manager (3): only their own client
        elif user.role in (2, 3) and user.client:
            clients_q = [c for c in clients_q if c.id == user.client]
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

    # OEM display name: for OEM users (role 9, 10), prefer brand_name from oem_branding table,
    # then fall back to the OEM client record name.
    oem_display_name = None
    if user.role in (9, 10):
        oem_org_id = getattr(user, "org_id", None) or session.get("orgId")
        if oem_org_id:
            try:
                from app.models.oem_branding import OemBranding as _OemBranding
                _b = sess.query(_OemBranding).filter_by(org_id=oem_org_id).first()
                if _b and _b.brand_name:
                    oem_display_name = _b.brand_name.strip()
            except Exception:
                pass
        if not oem_display_name and user.client:
            oem_client = sess.query(Client).get(user.client)
            if oem_client:
                name = (oem_client.name or "").strip()
                if name.lower().startswith("oem "):
                    name = name[4:].strip()
                oem_display_name = name or oem_client.name

    # Populate account managers list scoped to the logged-in user's org
    xeco_users_and_admins = []
    try:
        if user.role == 8:
            # Synerex Admin: all non-client users (roles 7, 8, 9, 10)
            mgr_users = sess.query(User).filter(
                User._role.in_([7, 8, 9, 10]), User.isDeleted == False
            ).all()
            xeco_users_and_admins = [
                {"id": u.id, "fullName": f"{u.firstName} {u.lastName}".strip()}
                for u in mgr_users
            ]
        elif user.role in (9, 10):
            # OEM Admin/User: users with same org_id (roles 7, 9, 10)
            oem_org_id_mgr = getattr(user, "org_id", None) or session.get("orgId")
            if oem_org_id_mgr:
                mgr_users = sess.query(User).filter(
                    User.org_id == oem_org_id_mgr,
                    User._role.in_([7, 9, 10]),
                    User.isDeleted == False
                ).all()
                xeco_users_and_admins = [
                    {"id": u.id, "fullName": f"{u.firstName} {u.lastName}".strip()}
                    for u in mgr_users
                ]
    except Exception:
        xeco_users_and_admins = []

    locals_data = {
        "environment": current_app.config.get("ENV", "development"),
        "user": _user_to_dict(user),
        "appVersion": current_app.config.get("APP_VERSION", "1.0.0"),
        "xecoAdvancedOptions": {"id": xeco.id} if xeco else {},
        "clients": clients,
        "xecoUsersAndAdmins": xeco_users_and_admins,
        "myAccountUrl": my_account_url,
        "websiteHomeUrl": (website_home + "/") if website_home else "",
        "emvUrl": emv_url.rstrip("/"),
        "oemDisplayName": oem_display_name,
    }
    locals_data["user"]["projects"] = projects
    # SSO JWT may set session userRole; use it for bootstrap so OEM (9,10) get correct nav
    sess_role = session.get("userRole")
    if sess_role is not None:
        locals_data["user"]["role"] = sess_role
    elif session.get("user", {}).get("role") is not None:
        locals_data["user"]["role"] = session["user"]["role"]
    app_root = current_app.config.get("APPLICATION_ROOT", "") or ""
    req_host = (request.host or "") if request else ""
    if app_root and "8087" in str(req_host):
        app_root = ""
    locals_data["apiBasePath"] = app_root
    # Production build may have vendor.bundle.js (CommonsChunkPlugin); load it before main
    prefix = f"{app_root}/js" if app_root else "/js"
    static_root = Path(_get_static_root())
    vendor_path = None
    if (static_root / "js" / "vendor.bundle.js").exists():
        vendor_path = f"{prefix}/vendor.bundle.js"
    main_path = f"{prefix}/main.bundle.js"
    script_paths = [p for p in [vendor_path, main_path] if p]
    resp = make_response(render_template(
        "web/app.html",
        BOOTSTRAP_DATA=json.dumps(locals_data),
        app_version=locals_data["appVersion"],
        my_account_url=my_account_url,
        website_home_url=(website_home + "/") if website_home else "",
        script_paths=script_paths,
        script_path=main_path,
        vendor_path=vendor_path,
    ))
    resp.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, private"
    resp.headers["Pragma"] = "no-cache"
    return resp


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
        return redirect(_login_url())
    if not current_user.is_authenticated:
        return redirect(_login_url())
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


@web_bp.route("/api/whoami", methods=["GET"])
def whoami():
    """GET /api/whoami - diagnostic: show current session user and projects."""
    from app.models.project import project_user as _pu
    if not current_user.is_authenticated:
        return jsonify({"authenticated": False, "message": "Not logged in to Tracking"})
    sess = get_session()
    u = sess.query(User).get(current_user.id)
    if not u:
        return jsonify({"authenticated": True, "flask_login_id": current_user.id, "error": "User not found in DB"})
    proj_ids = sess.query(_pu.c.project_users).filter(_pu.c.user_projects == u.id).all()
    proj_ids = [r[0] for r in proj_ids]
    from app.models.project import Project as _P
    projs = sess.query(_P).filter(_P.id.in_(proj_ids), _P.isDeleted == False).all()
    return jsonify({
        "authenticated": True,
        "user_id": u.id,
        "email": u.email,
        "role": u.role,
        "org_id": u.org_id,
        "session_org_id": session.get("orgId"),
        "session_user_role": session.get("userRole"),
        "projects": [{"id": p.id, "name": p.name} for p in projs],
    })


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
        "role": user.role,
        "defaultProject": default_project,
        "lastActiveAt": user.lastActiveAt,
    }
    if hasattr(user, "userLogo"):
        resp["userLogo"] = bool(user.userLogo)
    # Include orgId for verification (OEM/Client org-scoped features)
    org_id = session.get("orgId") or (session.get("user") or {}).get("orgId")
    if not org_id and user.client:
        c = db.session.query(Client).get(user.client)
        if c:
            org_id = getattr(c, "org_id", None)
    if org_id is not None:
        resp["orgId"] = org_id
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
    """GET /api/project - list projects with pagination.
    OEM users (role 9, 10) only see projects for their org's clients.
    Client Admin/Manager (2, 3) only see projects under their client (their organization)."""
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

    user = sess.query(User).get(current_user.id)
    oem_org_id = _get_oem_org_id(sess, user) if user else None

    # OEM users: if client_id provided, verify it belongs to their org (legacy or sponsored)
    if user and getattr(user, "role", None) in (9, 10) and oem_org_id and client_id:
        client_obj = sess.query(Client).filter_by(id=client_id, isDeleted=False).first()
        if not client_obj or (
            getattr(client_obj, "org_id", None) != oem_org_id
            and getattr(client_obj, "sponsor_org_id", None) != oem_org_id
        ):
            return jsonify({"meta": {"page": page, "total": 0}, "response": []}), 200

    # Client Admin, Client Manager: if client_id provided, must be their client
    if user and getattr(user, "role", None) in (2, 3) and user.client and client_id:
        if client_id != user.client:
            return jsonify({"meta": {"page": page, "total": 0}, "response": []}), 200

    q = sess.query(Project).filter_by(isDeleted=False)
    if name:
        q = q.filter(Project.name.ilike(f"%{name}%"))
    if client_id:
        q = q.filter(Project.client == client_id)

    # OEM users: only projects whose client belongs to their org (legacy or sponsored)
    if user and getattr(user, "role", None) in (9, 10) and oem_org_id:
        q = q.join(Client, Project.client == Client.id).filter(
            or_(Client.org_id == oem_org_id, Client.sponsor_org_id == oem_org_id)
        )
    # Client User, Client Admin, Client Manager: only projects under their client (their organization)
    elif user and getattr(user, "role", None) in (1, 2, 3) and user.client:
        q = q.filter(Project.client == user.client)
    # Account Manager: only projects for their assigned client
    elif user and getattr(user, "role", None) == 7 and user.client:
        q = q.filter(Project.client == user.client)

    q = q.order_by(Project.name.asc())
    total = q.count()
    items = q.offset((page - 1) * page_size).limit(page_size).all()
    current_app.logger.info("[list_projects] total=%d items=%d (client_id=%s)", total, len(items), client_id)

    rows = []
    for p in items:
        row = {"id": p.id, "name": p.name, "slug": p.slug, "xecoManager": p.xecoManager}
        if p.client:
            c = sess.query(Client).get(p.client)
            # Prefer legalName for display; name may be "Client - {address}" from create-from-bill
            if c:
                display_name = c.legalName if c.legalName else c.name
            else:
                display_name = "(deleted)"
            row["client"] = {"id": c.id, "name": display_name} if c else {"id": p.client, "name": "(deleted)"}
        else:
            row["client"] = None
        if p.xecoManager:
            u = sess.query(User).get(p.xecoManager)
            if u:
                row["xecoManager"] = {"id": u.id, "fullName": f"{u.firstName} {u.lastName}"}
        rows.append(row)

    return jsonify({"meta": {"page": page, "total": total}, "response": rows})


@web_bp.route("/api/project/<int:pid>/ensure-document-token", methods=["POST", "OPTIONS"])
@login_required
@license_required
def ensure_project_document_token(pid):
    """Ensure project has documentShareToken; generate and save if missing. Returns { documentShareToken }."""
    if request.method == "OPTIONS":
        return "", 204
    sess = get_session()
    p = sess.query(Project).filter_by(id=pid, isDeleted=False).first()
    if not p:
        return jsonify({"error": "Project not found"}), 404
    user = sess.query(User).get(current_user.id) if current_user.is_authenticated else None
    if not user or not _user_can_access_project(sess, user, p):
        return jsonify({"error": "Unauthorized"}), 403
    token = getattr(p, "documentShareToken", None)
    if not token or not str(token).strip():
        token = secrets.token_urlsafe(32)
        p.documentShareToken = token
        sess.commit()
    return jsonify({"meta": {}, "response": {"documentShareToken": token}})


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
    if not user or not _user_can_access_project(sess, user, p):
        return jsonify({"error": "Unauthorized"}), 403
    return jsonify({"meta": {}, "response": _project_to_dict(p, include_meters=True, sess=sess)})


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
CLIENT_UPDATE_BLACKLIST = {"id", "createdAt", "updatedAt", "isDeleted", "users", "org_id", "sponsor_org_id"}

_PROJECT_BOOL_FIELDS = {"subNeeded", "gwControl"}


def _get_oem_org_id(sess, user):
    """Return org_id for OEM users (role 9, 10). None for non-OEM or if unset."""
    if not user or getattr(user, "role", None) not in (9, 10):
        return None
    org_id = session.get("orgId") or (session.get("user") or {}).get("orgId") or (session.get("user") or {}).get("org_id")
    if not org_id:
        org_id = getattr(user, "org_id", None)
    if not org_id and user.client:
        oem_client = sess.query(Client).get(user.client)
        if oem_client:
            org_id = getattr(oem_client, "org_id", None)
    return org_id


_GLOBAL_NUM_PREFIX = "3421"
_GLOBAL_NUM_START = 2843
_OEM_NUM_START = 2843


def _is_conforming_number(val):
    """Return True if val looks like a number we issued (3421-NNNN or 8-digit zero-padded)."""
    if not val:
        return False
    val = str(val).strip()
    import re as _re
    if _re.match(r"^\d{4}-\d{4,}$", val):
        return True
    if _re.match(r"^\d{8,}$", val):
        return True
    return False


def _generate_project_number(sess, sponsor_org_id):
    """
    Assign the next sequential project number for the given sponsor_org_id.
    - sponsor_org_id is None (Synerex/admin projects): global format '3421-NNNN'
      starting at 3421-2843; when NNNN exceeds 9999 the prefix increments.
    - sponsor_org_id set (OEM projects): per-OEM 8-digit zero-padded integer
      starting at 00002843; each OEM has its own counter.
    """
    import re as _re

    if sponsor_org_id:
        # Per-OEM: find the highest existing number for this OEM
        rows = (
            sess.query(Project.proposalNumber)
            .join(Client, Project.client == Client.id)
            .filter(
                Client.sponsor_org_id == sponsor_org_id,
                Project.proposalNumber.isnot(None),
                Project.proposalNumber != "",
            )
            .all()
        )
        max_seq = _OEM_NUM_START - 1
        for (pn,) in rows:
            if pn and _re.match(r"^\d{8,}$", str(pn).strip()):
                try:
                    max_seq = max(max_seq, int(pn))
                except ValueError:
                    pass
        return f"{max_seq + 1:08d}"
    else:
        # Global (Synerex): find the highest existing 'PREFIX-NNNN' number
        rows = (
            sess.query(Project.proposalNumber)
            .join(Client, Project.client == Client.id)
            .filter(
                Client.sponsor_org_id.is_(None),
                Project.proposalNumber.isnot(None),
                Project.proposalNumber != "",
            )
            .all()
        )
        max_prefix = int(_GLOBAL_NUM_PREFIX)
        max_seq = _GLOBAL_NUM_START - 1
        for (pn,) in rows:
            if pn:
                m = _re.match(r"^(\d{4})-(\d+)$", str(pn).strip())
                if m:
                    p, s = int(m.group(1)), int(m.group(2))
                    if p > max_prefix or (p == max_prefix and s > max_seq):
                        max_prefix, max_seq = p, s
        next_seq = max_seq + 1
        if next_seq > 9999:
            max_prefix += 1
            next_seq = 0
        return f"{max_prefix}-{next_seq:04d}"


def _oem_can_access_client(sess, user, client):
    """True if user is admin (8), Account Manager (7) accessing assigned client, or OEM (9,10) with client in their org."""
    if not user or not client:
        return False
    if getattr(user, "role", None) == 8:
        return True
    if getattr(user, "role", None) == 7:
        return user.client and client.id == user.client
    if getattr(user, "role", None) not in (9, 10):
        return True  # Other roles: allow
    oem_org_id = _get_oem_org_id(sess, user)
    if not oem_org_id:
        return False
    # Legacy: client.org_id == oem_org_id; new: client.sponsor_org_id == oem_org_id
    return (
        getattr(client, "org_id", None) == oem_org_id
        or getattr(client, "sponsor_org_id", None) == oem_org_id
    )


def _user_can_create_project_for_client(sess, user, client):
    """
    True if user can create a project for this client.
    OEM Admin: clients in their org. Client Admin/Manager: only their own client.
    Synerex Admin: any. Account Manager: only their assigned client.
    """
    if not user or not client:
        return False
    role = getattr(user, "role", None)
    if role == 8:
        return True
    if role == 7:
        return user.client and client.id == user.client
    if role in (9, 10):
        oem_org_id = _get_oem_org_id(sess, user)
        if not oem_org_id:
            return False
        return (
            getattr(client, "org_id", None) == oem_org_id
            or getattr(client, "sponsor_org_id", None) == oem_org_id
        )
    if role in (2, 3):  # Client Admin, Client Manager
        return user.client and client.id == user.client
    return False


def _user_can_access_project(sess, user, project):
    """True if user can access project: admin, in project_user, OEM with client in their org, or Client Admin/Manager with project under their client."""
    if not user or not project:
        return False
    if getattr(user, "role", None) == 8:
        return True
    row = sess.query(project_user).filter(
        project_user.c.project_users == project.id,
        project_user.c.user_projects == user.id,
    ).first()
    if row:
        return True
    if getattr(user, "role", None) in (9, 10) and project.client:
        c = sess.query(Client).get(project.client)
        return c is not None and _oem_can_access_client(sess, user, c)
    if getattr(user, "role", None) in (2, 3) and user.client and project.client:
        # Client Admin, Client Manager: any project under their client (their organization)
        return project.client == user.client
    return False

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
            user = sess.query(User).get(current_user.id)
            if not _user_can_create_project_for_client(sess, user, c):
                return jsonify({"error": "You cannot create projects for this client"}), 403
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
            # Client Admin (2) and Client Manager (3) can only create projects under existing client
            role = getattr(current_user, "role", None)
            if role in (2, 3):
                return jsonify({"error": "Client Admin must select an existing client. Use clientId to create a project."}), 400
            if not client_vals.get("name"):
                return jsonify({"error": "Client name is required when creating a new client"}), 400
            org_name = client_vals.get("name") or client_vals.get("legalName") or "Unknown"
            org_id_from_session = None
            sponsor_org_id = None
            if role in (9, 10):
                user_obj = sess.query(User).get(current_user.id)
                oem_org_id = _get_oem_org_id(sess, user_obj)
                if oem_org_id:
                    sponsor_org_id = oem_org_id
            elif role != 8:
                org_id_from_session = session.get("orgId") or (session.get("user") or {}).get("org_id")
            from app.services.org_registry import ensure_org
            result = ensure_org(
                org_name=org_name,
                org_type="customer",
                org_id=org_id_from_session,
                sponsor_org_id=sponsor_org_id,
            )
            org_id = result.get("org_id") if result else None
            c = Client(
                name=client_vals["name"],
                org_id=org_id,
                isDeleted=False,
                createdBy=current_user.id,
            )
            if sponsor_org_id and hasattr(c, "sponsor_org_id"):
                c.sponsor_org_id = sponsor_org_id
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
        if "currencyExchangeRate" in project_vals and project_vals["currencyExchangeRate"] is not None:
            try:
                p.currencyExchangeRate = float(project_vals["currencyExchangeRate"])
            except (TypeError, ValueError):
                pass
        if "reportFields" in project_vals and isinstance(project_vals["reportFields"], dict):
            existing_rf = dict(getattr(p, "reportFields", None) or {})
            existing_rf.update(project_vals["reportFields"])
            p.reportFields = existing_rf
        # Auto-assign sequential project number if not already set
        if not _is_conforming_number(getattr(p, "proposalNumber", None)):
            sponsor = getattr(c, "sponsor_org_id", None)
            p.proposalNumber = _generate_project_number(sess, sponsor)
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

    user = sess.query(User).get(current_user.id)
    if not _user_can_create_project_for_client(sess, user, client):
        return jsonify({"error": "You cannot create projects for this client"}), 403

    # Enforce project_limit from license entitlements
    user_org_id = getattr(client, "org_id", None) or session.get("orgId") or (session.get("user") or {}).get("orgId")
    if user_org_id and getattr(user, "role", None) != 8:
        from app.services.license_service import get_limit
        project_limit = get_limit(user_org_id, "site_limit", "tracking")
        if project_limit is not None and project_limit > 0:
            existing_count = sess.query(Project).filter_by(isDeleted=False).join(
                Client, Project.client == Client.id
            ).filter(Client.org_id == user_org_id).count()
            if existing_count >= project_limit:
                return jsonify({
                    "error": f"Project limit reached ({existing_count}/{project_limit}). Please upgrade your subscription.",
                    "code": "LIMIT_EXCEEDED",
                    "limit": "site_limit",
                    "current": existing_count,
                    "max": project_limit,
                }), 403

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

    # Auto-assign sequential project number if not already set
    if not _is_conforming_number(getattr(p, "proposalNumber", None)):
        sponsor = getattr(client, "sponsor_org_id", None)
        p.proposalNumber = _generate_project_number(sess, sponsor)
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
    user = sess.query(User).get(current_user.id)
    if not user or not _user_can_access_project(sess, user, p):
        return jsonify({"error": "Forbidden"}), 403

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
    user = sess.query(User).get(current_user.id)
    if not user or not _user_can_access_project(sess, user, p):
        return jsonify({"error": "Forbidden"}), 403
    p.isDeleted = True
    sess.commit()
    return jsonify({"meta": {}, "response": {"id": pid}})


@web_bp.route("/api/oems", methods=["GET"])
@web_bp.route("/api/oems/", methods=["GET"])
@login_required
def list_oems():
    """GET /api/oems - list all OEM organizations. Synerex Admin (role 8) only."""
    user = current_user
    if getattr(user, "role", None) != 8:
        return jsonify({"error": "Forbidden"}), 403

    license_url = current_app.config.get("LICENSE_SERVICE_URL", "http://license-service:8000")
    try:
        import urllib.request as _ur
        import json as _json
        req = _ur.urlopen(f"{license_url.rstrip('/')}/api/orgs/?org_type=oem", timeout=10)
        ls_data = _json.loads(req.read().decode())
        oem_orgs = ls_data.get("orgs", [])
    except Exception as e:
        current_app.logger.warning("Failed to fetch OEM orgs from License Service: %s", e)
        oem_orgs = []

    # Enrich with client counts and admin user info from the Tracking DB
    sess = get_session()
    result = []
    for org in oem_orgs:
        org_id = org.get("org_id", "")
        # Count clients sponsored by this OEM
        client_count = sess.query(Client).filter(
            Client.sponsor_org_id == org_id,
            Client.isDeleted == False,
        ).count()
        # Get OEM admin users (role 9) associated with this OEM org
        oem_admins = sess.query(User).filter(
            User.org_id == org_id,
            User.role == 9,
            User.isDeleted == False,
        ).all()
        admin_emails = [u.email for u in oem_admins]

        result.append({
            "org_id": org_id,
            "org_name": org.get("org_name", ""),
            "client_count": client_count,
            "admin_emails": admin_emails,
        })

    return jsonify({"oems": result, "total": len(result)})


@web_bp.route("/api/client", methods=["GET"])
@web_bp.route("/api/client/", methods=["GET"])
@login_required
@license_required
def list_clients():
    """GET /api/client - list clients with pagination. Supports page, pageSize, orderBy, orderDirection, name, contactName, country.
    OEM users (role 9, 10) only see clients in their org. Client Admin/Manager (2, 3) only see their own client.
    Cloud Kitchen is deduplicated per org (one per OEM)."""
    sess = get_session()
    page = request.args.get("page", 1, type=int)
    page_size = min(request.args.get("pageSize", 10, type=int), 500)
    order_by = request.args.get("orderBy", "name")
    order_dir = request.args.get("orderDirection", "ASC").upper()

    base = sess.query(Client).filter_by(isDeleted=False)

    # OEM users (9, 10) only see clients in their org
    user = sess.query(User).get(current_user.id)
    role = getattr(user, "role", None)
    org_id = session.get("orgId") or (session.get("user") or {}).get("orgId") or (session.get("user") or {}).get("org_id")
    if not org_id and user:
        org_id = getattr(user, "org_id", None)
    if not org_id and user and user.client:
        oem_client = sess.query(Client).get(user.client)
        if oem_client:
            org_id = getattr(oem_client, "org_id", None)
    if role in (9, 10):
        if not org_id:
            # OEM user with no resolvable org_id — return empty list (never expose all clients)
            return jsonify({"meta": {"page": page, "total": 0}, "response": []}), 200
        # OEM sees clients: legacy (org_id match) or sponsored (sponsor_org_id match)
        base = base.filter(
            or_(
                Client.org_id == org_id,
                Client.sponsor_org_id == org_id,
            )
        )
        # Exclude OEM's own client record - only show their customers
        if user and user.client:
            base = base.filter(Client.id != user.client)
    elif role == 7 and user and user.client:
        # Account Manager: only their assigned client (e.g. Cloud Kitchen)
        base = base.filter(Client.id == user.client)
    elif role in (2, 3) and user and user.client:
        # Client Admin, Client Manager: only their own client (their organization)
        base = base.filter(Client.id == user.client)

    # Synerex Admin (role 8): optional filter by OEM sponsor_org_id (used by OEM list "View Clients" button)
    if role == 8:
        sponsor_org_filter = request.args.get("sponsor_org_id", "").strip()
        if sponsor_org_filter:
            base = base.filter(Client.sponsor_org_id == sponsor_org_filter)

    name_filter = request.args.get("name", "").strip()
    if name_filter:
        base = base.filter(Client.name.ilike(f"%{name_filter}%"))
    contact_filter = request.args.get("contactName", "").strip()
    if contact_filter:
        base = base.filter(Client.contactName.ilike(f"%{contact_filter}%"))
    country_filter = request.args.get("country", "").strip()
    if country_filter:
        base = base.filter(Client.country.ilike(f"%{country_filter}%"))

    if order_by and order_by in ("name", "contactName", "country", "legalName", "id"):
        col = getattr(Client, order_by, Client.name)
        if order_dir == "DESC":
            col = col.desc()
        base = base.order_by(col)
    else:
        base = base.order_by(Client.name)

    # Apply pagination
    all_clients = base.all()
    total = len(all_clients)
    offset = (page - 1) * page_size
    clients = all_clients[offset : offset + page_size]

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
    user = sess.query(User).get(current_user.id)
    if not _oem_can_access_client(sess, user, c):
        return jsonify({"error": "Forbidden"}), 403
    resp = {
        "id": c.id,
        "name": c.name,
        "legalName": c.legalName,
        "address": c.address,
        "city": c.city,
        "state": c.state,
        "zip": c.zip,
        "country": c.country,
        "contactName": c.contactName,
        "contactTitle": c.contactTitle,
        "contactPhone": c.contactPhone,
        "marketSegment": c.marketSegment,
        "taxId": c.taxId,
        "shippingTerms": c.shippingTerms,
        "salesTax": c.salesTax,
        "financeEmail": c.financeEmail,
        "financePhone": c.financePhone,
        "managerName": c.managerName,
        "managerCertificate": c.managerCertificate,
        "managerPhone": c.managerPhone,
        "managerEmail": c.managerEmail,
        "managerLocation": c.managerLocation,
        "logoImgSrc": c.logoImgSrc,
        "org_id": getattr(c, "org_id", None),
    }
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
    sponsor_org_id = None
    if role in (9, 10):
        # OEM Admin/User: create new customer org with its own org_id, linked via sponsor_org_id
        oem_org_id = _get_oem_org_id(sess, sess.query(User).get(current_user.id))
        if oem_org_id:
            sponsor_org_id = oem_org_id
            # Do NOT pass org_id - let License Service generate unique org_id per customer
    elif role != 8:
        # Account Manager (7) etc: adopt existing org from session
        org_id_from_session = session.get("orgId") or (session.get("user") or {}).get("org_id")
    from app.services.org_registry import ensure_org
    result = ensure_org(
        org_name=org_name,
        org_type="customer",
        org_id=org_id_from_session,
        sponsor_org_id=sponsor_org_id,
    )
    if result:
        c.org_id = result.get("org_id")
        if sponsor_org_id and hasattr(c, "sponsor_org_id"):
            c.sponsor_org_id = sponsor_org_id
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
    user = sess.query(User).get(current_user.id)
    if not _oem_can_access_client(sess, user, c):
        return jsonify({"error": "Forbidden"}), 403
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
    user = sess.query(User).get(current_user.id)
    if not _oem_can_access_client(sess, user, c):
        return jsonify({"error": "Forbidden"}), 403
    c.isDeleted = True
    sess.commit()
    return jsonify({"meta": {}, "response": {"id": cid}})


@web_bp.route("/api/client/invite", methods=["POST"])
@login_required
def send_client_invite():
    """POST /api/client/invite - OEM sends a branded subscription invitation email to a prospective client.

    Body: { "email": "...", "company_name": "..." (optional) }
    Sends a branded email with a link to the Synerex registration page pre-tagged with the OEM's org_id.
    Payment goes to Synerex; the OEM's brand appears on the registration page.
    """
    role = getattr(current_user, "role", None)
    if role not in (8, 9):
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json() or {}
    to_email = (data.get("email") or "").strip()
    company_name = (data.get("company_name") or "").strip()
    if not to_email or "@" not in to_email:
        return jsonify({"error": "A valid email address is required"}), 400

    # Resolve OEM org_id and branding
    sess = get_session()
    user = sess.query(User).get(current_user.id)
    oem_org_id = _get_oem_org_id(sess, user) if role == 9 else None

    try:
        from app.api.phase6_routes import _get_oem_smtp_for_current_user, _send_email_via_smtp
        smtp_cfg = _get_oem_smtp_for_current_user()
    except Exception as e:
        return jsonify({"error": f"Email configuration error: {e}"}), 500

    if not smtp_cfg.get("server") or not smtp_cfg.get("username"):
        return jsonify({"error": "No SMTP configured. Add email settings in Branding > Email Settings."}), 400

    brand_name    = smtp_cfg.get("brand_name") or "Synerex"
    logo_url      = smtp_cfg.get("logo_url") or ""
    primary_color = smtp_cfg.get("primary_color") or "#1a73e8"
    support_email = smtp_cfg.get("support_email") or smtp_cfg.get("from_address") or ""

    # Build the registration link - always points to Synerex License Service
    license_public_url = (
        current_app.config.get("LICENSE_SERVICE_PUBLIC_URL")
        or current_app.config.get("LICENSE_SERVICE_URL", "")
    ).rstrip("/")
    # Replace internal hostnames with public-facing URL
    for _internal in ("license-service", "localhost:8000"):
        if _internal in license_public_url:
            scheme = request.headers.get("X-Forwarded-Proto", request.scheme) or "http"
            host = request.headers.get("X-Forwarded-Host", request.host) or request.host
            license_public_url = f"{scheme}://{host}/license"
            break

    reg_link = f"{license_public_url}/register/?program=tracking"
    if oem_org_id:
        reg_link += f"&oem={oem_org_id}"

    greeting = f"Dear {company_name} Team," if company_name else "Hello,"
    subject = f"You're invited to {brand_name} — Energy Monitoring Portal"

    logo_html = (
        f'<img src="{logo_url}" alt="{brand_name}" '
        f'style="max-height:60px; max-width:220px; display:block; margin:0 auto 16px auto;">'
        if logo_url else
        f'<div style="font-size:1.4em; font-weight:bold; color:white; text-align:center; padding:8px 0;">{brand_name}</div>'
    )

    text_body = (
        f"{greeting}\n\n"
        f"You have been invited to subscribe to the {brand_name} Energy Monitoring & Verification portal.\n\n"
        f"Click the link below to create your account and choose a subscription plan:\n\n"
        f"{reg_link}\n\n"
        f"Once subscribed, you'll have access to real-time energy tracking, savings reports, and more — "
        f"all under the {brand_name} platform.\n\n"
        f"If you have any questions, contact us at {support_email}.\n\n"
        f"— The {brand_name} Team"
    )

    html_body = f"""<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:{primary_color};padding:28px 32px;text-align:center;">
            {logo_html}
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px;">
            <p style="color:#444;font-size:1em;margin:0 0 12px 0;">{greeting}</p>
            <h2 style="margin:0 0 16px 0;color:#222;">You're Invited to {brand_name}</h2>
            <p style="color:#444;line-height:1.6;margin:0 0 20px 0;">
              You have been invited to subscribe to the <strong>{brand_name}</strong> Energy Monitoring &amp;
              Verification portal — your all-in-one platform for real-time energy tracking, savings reports,
              and data-driven insights.
            </p>
            <p style="color:#444;line-height:1.6;margin:0 0 28px 0;">
              Click the button below to create your account and choose a subscription plan.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px auto;">
              <tr>
                <td style="background:{primary_color};border-radius:6px;padding:14px 32px;text-align:center;">
                  <a href="{reg_link}" style="color:white;text-decoration:none;font-size:1em;font-weight:bold;">
                    Subscribe Now &rarr;
                  </a>
                </td>
              </tr>
            </table>
            <p style="color:#777;font-size:0.85em;line-height:1.5;">
              Or copy this link into your browser:<br/>
              <a href="{reg_link}" style="color:{primary_color};word-break:break-all;">{reg_link}</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f8f8f8;padding:16px 40px;text-align:center;border-top:1px solid #eee;color:#aaa;font-size:0.8em;">
            Questions? Contact us at <a href="mailto:{support_email}" style="color:#aaa;">{support_email}</a><br/>
            &copy; {brand_name}. All rights reserved.
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""

    try:
        _send_email_via_smtp(
            smtp_cfg=smtp_cfg,
            to_address=to_email,
            subject=subject,
            body_text=text_body,
            body_html=html_body,
        )
    except Exception as e:
        current_app.logger.error("[invite] Email send failed to %s: %s", to_email, e)
        return jsonify({"error": f"Failed to send email: {e}"}), 500

    current_app.logger.info("[invite] Invitation sent by user=%s to %s (oem=%s)", current_user.id, to_email, oem_org_id)
    return jsonify({"meta": {}, "response": {"sent": True, "to": to_email}})


@web_bp.route("/api/client/<int:cid>/upload-logo", methods=["POST"])
@login_required
@license_required
def upload_client_logo(cid):
    """POST /api/client/:id/upload-logo - multipart form with logo file."""
    sess = get_session()
    c = sess.query(Client).filter_by(id=cid, isDeleted=False).first()
    if not c:
        return jsonify({"error": "Not found"}), 404
    user = sess.query(User).get(current_user.id)
    if not _oem_can_access_client(sess, user, c):
        return jsonify({"error": "Forbidden"}), 403

    logo = request.files.get("logo")
    if not logo or not logo.filename:
        return jsonify({"error": "logo file required"}), 400

    storage = Path(current_app.config.get("STORAGE_LOCAL_PATH", ""))
    if not storage:
        return jsonify({"error": "Storage not configured"}), 500

    upload_dir = storage / "images" / "client_company_logo"
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Frontend expects /tracking-images/client_company_logo/{id}-client-logo (no ext)
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
    """GET /api/whitelabel/brand-name - returns brand name for logged-in user's OEM org.
    For OEM users: looks up their own org branding.
    For Client users: looks up their sponsor OEM's branding via client.sponsor_org_id.
    Falls back to hostname-based whitelabel, then 'Synerex'."""
    from flask_login import current_user
    from app.models.oem_branding import OemBranding
    from app.db.request_session import get_session as _gs
    from app.models.client import Client as _Client

    def _brand_name_for_org(oid):
        """Return brand_name from OemBranding for the given org_id, or None."""
        if not oid:
            return None
        try:
            b = _gs().query(OemBranding).filter_by(org_id=oid).first()
            return b.brand_name if b and b.brand_name else None
        except Exception:
            return None

    # 1. Resolve the user's own org_id
    org_id = None
    if current_user and current_user.is_authenticated:
        org_id = session.get("orgId") or (session.get("user") or {}).get("orgId")
        if not org_id:
            org_id = getattr(current_user, 'org_id', None)
        if not org_id and current_user.client:
            try:
                _c = _gs().query(_Client).get(current_user.client)
                if _c:
                    org_id = getattr(_c, "org_id", None)
            except Exception:
                pass

    if org_id:
        # 2a. Direct OEM branding lookup (works for OEM users, role 9/10)
        name = _brand_name_for_org(org_id)
        if name:
            return jsonify({"brandName": name, "response": name})

        # 2b. Client user: find their sponsor OEM via the Client record matching org_id
        try:
            _client_rec = _gs().query(_Client).filter_by(org_id=org_id).first()
            if _client_rec:
                sponsor_org_id = getattr(_client_rec, "sponsor_org_id", None)
                name = _brand_name_for_org(sponsor_org_id)
                if name:
                    return jsonify({"brandName": name, "response": name})
        except Exception:
            pass

    # 3. Fallback: hostname-based whitelabel file
    hostname = request.host or ""
    base_path = Path(current_app.config.get("WHITELABEL_BASE_PATH", ""))
    if base_path.exists():
        parts = hostname.split(".")
        subdomain = parts[0].lower() if parts else ""
        if subdomain not in ("", "www", "portal"):
            brand_file = base_path / subdomain / "brandname.txt"
            if brand_file.exists():
                try:
                    name = brand_file.read_text().strip()
                    if name:
                        return jsonify({"brandName": name, "response": name})
                except Exception:
                    pass
    return jsonify({"brandName": "Synerex", "response": "Synerex"})


@web_bp.route("/api/whitelabel/oem-branding", methods=["GET"])
@login_required
def get_oem_branding():
    """GET /api/whitelabel/oem-branding - get full branding for logged-in OEM user."""
    org_id = session.get("orgId") or (session.get("user") or {}).get("orgId")
    if not org_id:
        org_id = getattr(current_user, "org_id", None)
    if not org_id and current_user.client:
        try:
            from app.models.client import Client as _Client
            _c = get_session().query(_Client).get(current_user.client)
            if _c:
                org_id = getattr(_c, "org_id", None)
        except Exception:
            pass
    if not org_id:
        return jsonify({"response": {}}), 200
    try:
        from app.models.oem_branding import OemBranding
        b = get_session().query(OemBranding).filter_by(org_id=org_id).first()
        if b:
            safe_org = "".join(c if c.isalnum() or c in "-_" else "_" for c in org_id)
            app_root = current_app.config.get("APPLICATION_ROOT", "") or ""
            return jsonify({"response": {
                "org_id": b.org_id,
                "brand_name": b.brand_name,
                "logo_url": f"{app_root}/tracking-images/oem_logo/{safe_org}" if b.logo_path else None,
                "white_logo_url": f"{app_root}/tracking-images/oem_logo/{safe_org}_white" if b.white_logo_path else None,
                "primary_color": b.primary_color,
                "secondary_color": b.secondary_color,
                "support_email": b.support_email,
                "website_url": b.website_url,
                "portal_title": b.portal_title,
                "smtp_server": b.smtp_server,
                "smtp_port": b.smtp_port,
                "smtp_use_tls": b.smtp_use_tls if b.smtp_use_tls is not None else True,
                "smtp_username": b.smtp_username,
                # Never return the password — only indicate whether one is stored
                "smtp_password_set": bool(b.smtp_password),
                "smtp_from_address": b.smtp_from_address,
                "smtp_from_name": b.smtp_from_name,
            }})
        return jsonify({"response": {"org_id": org_id}})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@web_bp.route("/api/whitelabel/oem-branding", methods=["POST", "PUT"])
@login_required
def save_oem_branding():
    """POST/PUT /api/whitelabel/oem-branding - save OEM branding settings."""
    role = getattr(current_user, "role", None)
    if role not in (8, 9, 10):
        return jsonify({"error": "Forbidden"}), 403
    org_id = session.get("orgId") or (session.get("user") or {}).get("orgId")
    if not org_id:
        org_id = getattr(current_user, "org_id", None)
    if not org_id and current_user.client:
        try:
            from app.models.client import Client as _Client
            _c = get_session().query(_Client).get(current_user.client)
            if _c:
                org_id = getattr(_c, "org_id", None)
        except Exception:
            pass
    if not org_id:
        return jsonify({"error": "No org_id"}), 400
    data = request.get_json(silent=True) or {}
    try:
        from app.models.oem_branding import OemBranding
        sess = get_session()
        b = sess.query(OemBranding).filter_by(org_id=org_id).first()
        if not b:
            b = OemBranding(org_id=org_id)
            sess.add(b)
        if "brand_name" in data:
            b.brand_name = data["brand_name"]
        if "primary_color" in data:
            b.primary_color = data["primary_color"]
        if "secondary_color" in data:
            b.secondary_color = data["secondary_color"]
        if "support_email" in data:
            b.support_email = data["support_email"]
        if "website_url" in data:
            b.website_url = data["website_url"]
        if "portal_title" in data:
            b.portal_title = data["portal_title"]
        # SMTP fields — password only updated when explicitly provided (non-empty)
        if "smtp_server" in data:
            b.smtp_server = data["smtp_server"] or None
        if "smtp_port" in data:
            try:
                b.smtp_port = int(data["smtp_port"]) if data["smtp_port"] else None
            except (ValueError, TypeError):
                pass
        if "smtp_use_tls" in data:
            b.smtp_use_tls = bool(data["smtp_use_tls"])
        if "smtp_username" in data:
            b.smtp_username = data["smtp_username"] or None
        if data.get("smtp_password"):
            b.smtp_password = data["smtp_password"]
        if "smtp_from_address" in data:
            b.smtp_from_address = data["smtp_from_address"] or None
        if "smtp_from_name" in data:
            b.smtp_from_name = data["smtp_from_name"] or None
        sess.commit()
        return jsonify({"response": "saved"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@web_bp.route("/api/whitelabel/oem-branding-test-email", methods=["POST"])
@login_required
def test_oem_branding_email():
    """POST /api/whitelabel/oem-branding-test-email - send a branded test email to the logged-in user.

    Uses the OEM's own SMTP if configured, otherwise the platform SMTP.
    Either way the email is fully branded with the OEM's logo and colors.
    """
    role = getattr(current_user, "role", None)
    if role not in (8, 9, 10):
        return jsonify({"error": "Forbidden"}), 403
    try:
        from app.api.phase6_routes import _get_oem_smtp_for_current_user, _send_email_via_smtp
        smtp_cfg = _get_oem_smtp_for_current_user()
    except Exception as e:
        return jsonify({"error": f"Could not resolve email config: {e}"}), 500

    if not smtp_cfg.get("server") or not smtp_cfg.get("username"):
        return jsonify({"error": "No SMTP server configured. Add MAIL_SERVER and MAIL_USERNAME to the platform environment, or enter your own SMTP credentials in Email Settings."}), 400

    brand_name    = smtp_cfg.get("brand_name") or "Synerex"
    logo_url      = smtp_cfg.get("logo_url") or ""
    primary_color = smtp_cfg.get("primary_color") or "#1a73e8"
    from_addr     = smtp_cfg.get("from_address") or smtp_cfg.get("username", "")

    logo_html = (
        f'<img src="{logo_url}" alt="{brand_name}" '
        f'style="max-height:60px; max-width:220px; display:block; margin:0 auto 16px auto;">'
        if logo_url else
        f'<div style="font-size:1.4em; font-weight:bold; color:white; '
        f'text-align:center; padding:8px 0;">{brand_name}</div>'
    )

    text_body = (
        f"Hi,\n\nThis is a test confirming {brand_name}'s email is working.\n\n"
        f"Your clients will receive branded emails from: {from_addr}\n\n"
        f"— The {brand_name} Team"
    )
    html_body = f"""<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0; padding:0; background:#f4f4f4; font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4; padding:30px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:{primary_color}; padding:28px 32px; text-align:center;">
            {logo_html}
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px;">
            <h2 style="margin:0 0 16px 0; color:#222;">Email Test — Looks Good!</h2>
            <p style="color:#444; line-height:1.6;">
              This is a test confirming that <strong>{brand_name}</strong>'s email delivery is
              working correctly. Your clients will receive beautifully branded emails that look
              just like this — with your logo and colors.
            </p>
            <p style="color:#555; font-size:0.9em; margin-top:20px;">
              Emails are sent from: <strong>{from_addr}</strong>
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f8f8f8; padding:16px 40px; text-align:center;
                     border-top:1px solid #eee; color:#aaa; font-size:0.8em;">
            &copy; {brand_name}. All rights reserved.
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""

    try:
        _send_email_via_smtp(
            smtp_cfg=smtp_cfg,
            to_address=current_user.email,
            subject=f"Email test — {brand_name} branding is working!",
            body_text=text_body,
            body_html=html_body,
            log_label=f"OEM test email to {current_user.email}",
        )
        return jsonify({"status": "success"})
    except Exception as e:
        current_app.logger.exception("OEM test email failed: %s", e)
        return jsonify({"error": str(e)}), 500


@web_bp.route("/api/whitelabel/oem-logo", methods=["POST"])
@login_required
def upload_oem_logo():
    """POST /api/whitelabel/oem-logo - upload OEM logo image.
    Optional form field: logo_type = 'color' (default) | 'white'
    """
    role = getattr(current_user, "role", None)
    if role not in (8, 9, 10):
        return jsonify({"error": "Forbidden"}), 403
    org_id = session.get("orgId") or (session.get("user") or {}).get("orgId")
    if not org_id:
        org_id = getattr(current_user, "org_id", None)
    if not org_id and current_user.client:
        try:
            from app.models.client import Client as _Client
            _c = get_session().query(_Client).get(current_user.client)
            if _c:
                org_id = getattr(_c, "org_id", None)
        except Exception:
            pass
    if not org_id:
        return jsonify({"error": "No org_id"}), 400
    logo = request.files.get("logo")
    if not logo or not logo.filename:
        return jsonify({"error": "logo file required"}), 400
    logo_type = request.form.get("logo_type", "color").strip().lower()
    if logo_type not in ("color", "white"):
        logo_type = "color"
    storage = Path(current_app.config.get("STORAGE_LOCAL_PATH", current_app.root_path))
    upload_dir = storage / "images" / "oem_logo"
    upload_dir.mkdir(parents=True, exist_ok=True)
    safe_org = "".join(c if c.isalnum() or c in "-_" else "_" for c in org_id)
    filename = safe_org if logo_type == "color" else f"{safe_org}_white"
    dest = upload_dir / filename
    logo.save(str(dest))
    try:
        from app.models.oem_branding import OemBranding
        sess = get_session()
        b = sess.query(OemBranding).filter_by(org_id=org_id).first()
        if not b:
            b = OemBranding(org_id=org_id)
            sess.add(b)
        if logo_type == "white":
            b.white_logo_path = str(dest)
        else:
            b.logo_path = str(dest)
        sess.commit()
    except Exception:
        pass
    app_root = current_app.config.get("APPLICATION_ROOT", "") or ""
    serve_url = f"{app_root}/tracking-images/oem_logo/{filename}"
    return jsonify({"response": serve_url, "logo_url": serve_url, "logo_type": logo_type})




@web_bp.route("/api/whitelabel/oem-branding-by-org", methods=["GET"])
def get_oem_branding_by_org():
    """
    Public (no auth) endpoint for internal service-to-service use.
    Returns OEM branding for a given org_id or sponsor_org_id.
    Called by the license service to brand the payment page.
    Only accessible from within the Docker network (not exposed publicly via Nginx).
    """
    org_id = request.args.get("org_id", "").strip()
    if not org_id:
        return jsonify({}), 200
    try:
        from app.models.oem_branding import OemBranding
        from app.models.client import Client
        sess = get_session()
        # 1. Direct lookup: org_id is itself an OEM org
        b = sess.query(OemBranding).filter_by(org_id=org_id).first()
        if not b:
            # 2. Client lookup: find the sponsor_org_id for this customer org
            client = sess.query(Client).filter(
                Client.org_id == org_id, Client.isDeleted == False
            ).first()
            sponsor = getattr(client, "sponsor_org_id", None) if client else None
            if sponsor:
                b = sess.query(OemBranding).filter_by(org_id=sponsor).first()
        if b:
            logo_url = None
            if b.logo_path:
                logo_url = f"/tracking-images/oem_logo/{b.org_id}"
            return jsonify({
                "org_id": b.org_id,
                "brand_name": b.brand_name or "",
                "logo_url": logo_url,
                "primary_color": b.primary_color or "",
                "website_url": b.website_url or "",
                "portal_title": b.portal_title or "",
            })
    except Exception:
        pass
    return jsonify({}), 200


@web_bp.route("/api/whitelabel/client-logo-by-org-info", methods=["GET"])
def get_client_logo_by_org_info():
    """
    Internal GET endpoint: returns current client logo URL for a given org_id.
    No auth required (internal Docker network use only).
    """
    org_id = request.args.get("org_id", "").strip()
    if not org_id:
        return jsonify({}), 200
    try:
        from app.models.client import Client
        sess = get_session()
        client = sess.query(Client).filter(
            Client.org_id == org_id, Client.isDeleted == False
        ).first()
        if not client or not getattr(client, "logoImgSrc", None):
            return jsonify({"logo_url": ""}), 200
        logo_url = f"/tracking-images/client_company_logo/{client.logoImgSrc}"
        return jsonify({"logo_url": logo_url}), 200
    except Exception as e:
        return jsonify({}), 200

@web_bp.route("/api/whitelabel/client-logo-by-org", methods=["POST"])
def upload_client_logo_by_org():
    """
    Internal (no auth) endpoint for service-to-service use.
    Accepts org_id + logo file and saves it as the client's logo.
    Only accessible from within the Docker network (not exposed publicly via Nginx).
    """
    org_id = request.form.get("org_id", "").strip()
    if not org_id:
        return jsonify({"error": "org_id required"}), 400

    logo = request.files.get("logo")
    if not logo or not logo.filename:
        return jsonify({"error": "logo file required"}), 400

    try:
        from app.models.client import Client
        sess = get_session()
        client = sess.query(Client).filter(
            Client.org_id == org_id, Client.isDeleted == False
        ).first()
        if not client:
            return jsonify({"error": "Client not found for org_id"}), 404

        storage = Path(current_app.config.get("STORAGE_LOCAL_PATH", current_app.root_path))
        upload_dir = storage / "images" / "client_company_logo"
        upload_dir.mkdir(parents=True, exist_ok=True)

        basename = f"{client.id}-client-logo"
        dest = upload_dir / basename
        logo.save(str(dest))
        client.logoImgSrc = basename
        sess.commit()

        logo_url = f"/tracking-images/client_company_logo/{basename}"
        return jsonify({"message": "Logo uploaded successfully", "logo_url": logo_url})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@web_bp.route("/js/<path:path>")
@web_bp.route("/css/<path:path>")
@web_bp.route("/tracking-images/<path:path>")
@web_bp.route("/images/<path:path>")
@web_bp.route("/fonts/<path:path>")
@web_bp.route("/scripts/<path:path>")
def serve_static(path):
    """Serve static assets. Production: redirect to S3. Images: check whitelabel first."""
    prefix = request.path.split("/", 2)[1]
    if prefix == "tracking-images":
        prefix = "images"
    # S3 redirect in production (skip when test_prod)
    s3_bucket = current_app.config.get("S3_BUCKET_NAME")
    env = current_app.config.get("ENV", "development")
    environment = current_app.config.get("ENVIRONMENT", env)  # test_prod skips S3
    if s3_bucket and env == "production" and environment != "test_prod":
        region = current_app.config.get("S3_REGION", "")
        region_part = f".{region}" if region else ""
        app_ver = current_app.config.get("APP_VERSION", "1.0.0")
        s3_path = request.path.replace("/tracking-images/", "/images/", 1)
        s3_url = f"https://s3{region_part}.amazonaws.com/{s3_bucket}/{app_ver}/static{s3_path}"
        return redirect(s3_url, code=302)
    # Whitelabel image lookup for /images/*
    if prefix == "images":
        # OEM logo: /images/oem_logo/{org_id}
        if path.startswith("oem_logo/"):
            storage = Path(current_app.config.get("STORAGE_LOCAL_PATH", current_app.root_path))
            oem_dir = storage / "images" / "oem_logo"
            oem_file = oem_dir / path[len("oem_logo/"):]
            if oem_file.exists() and oem_file.is_file():
                import imghdr as _imghdr
                detected = _imghdr.what(str(oem_file)) or "png"
                mime = f"image/{detected}"
                from flask import send_file as _send_file
                return _send_file(str(oem_file), mimetype=mime)
        # Client logo: /images/client_company_logo/{id}-client-logo
        if path.startswith("client_company_logo/"):
            storage = Path(current_app.config.get("STORAGE_LOCAL_PATH", current_app.root_path))
            client_dir = storage / "images" / "client_company_logo"
            client_file = client_dir / path[len("client_company_logo/"):]
            if client_file.exists() and client_file.is_file():
                import imghdr as _imghdr
                detected = _imghdr.what(str(client_file)) or "png"
                mime = f"image/{detected}"
                from flask import send_file as _send_file
                return _send_file(str(client_file), mimetype=mime)
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
        resp = send_from_directory(str(folder), path)
        # Prevent aggressive caching of JS/CSS so dev changes are visible
        if prefix in ("js", "css"):
            resp.headers["Cache-Control"] = "no-cache, must-revalidate"
        return resp
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
        return jsonify({"filename": basename, "path": f"/tracking-images/company_logo/{basename}"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@web_bp.route("/files/csv/<filename>")
@login_required
def serve_csv_file(filename):
    """Serve generated CSV reports from .tmp/csv/ (volume-mounted for persistence)."""
    from app.config import _8087_ROOT
    csv_dir = Path(_8087_ROOT) / ".tmp" / "csv"
    safe_name = Path(filename).name
    full = csv_dir / safe_name
    if not full.exists() or not full.is_file():
        return {"error": "Not found"}, 404
    return send_from_directory(str(csv_dir), safe_name, as_attachment=True,
                               download_name=safe_name)


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


# ---------------------------------------------------------------------------
# Subscription management endpoints (proxy to license service)
# ---------------------------------------------------------------------------

@web_bp.route("/api/company-settings", methods=["GET"])
@login_required
def get_company_settings():
    """GET /api/company-settings — return platform company settings (xeco singleton row)."""
    from app.models.xeco import CompanySettings
    sess = get_session()
    row = sess.query(CompanySettings).first()
    if row is None:
        return jsonify({"response": {
            "name": "", "billingEmail": "", "billingPhone": "",
            "address": "", "city": "", "state": "", "zip": "", "country": "",
            "taxId": "", "carbonCreditRate": 0, "managerCostPercent": 0,
        }})
    return jsonify({"response": {
        "name": row.name or "",
        "billingEmail": row.billingEmail or "",
        "billingPhone": row.billingPhone or "",
        "address": row.address or "",
        "city": row.city or "",
        "state": row.state or "",
        "zip": row.zip or "",
        "country": row.country or "",
        "taxId": row.taxId or "",
        "carbonCreditRate": row.carbonCreditRate or 0,
        "managerCostPercent": row.managerCostPercent or 0,
    }})


@web_bp.route("/api/company-settings", methods=["PUT"])
@login_required
def update_company_settings():
    """PUT /api/company-settings — update platform company settings."""
    from app.models.xeco import CompanySettings
    import time
    data = request.get_json(silent=True) or {}
    if not data.get("name", "").strip():
        return jsonify({"error": "Company name is required."}), 400
    sess = get_session()
    row = sess.query(CompanySettings).first()
    now_ms = int(time.time() * 1000)
    if row is None:
        row = CompanySettings(
            name=data.get("name", "").strip(),
            billingEmail=data.get("billingEmail", ""),
            billingPhone=data.get("billingPhone", ""),
            address=data.get("address", ""),
            city=data.get("city", ""),
            state=data.get("state", ""),
            zip=data.get("zip", ""),
            country=data.get("country", ""),
            taxId=data.get("taxId", ""),
            carbonCreditRate=float(data.get("carbonCreditRate") or 0),
            managerCostPercent=float(data.get("managerCostPercent") or 0),
            createdAt=now_ms,
            updatedAt=now_ms,
        )
        sess.add(row)
    else:
        row.name = data.get("name", row.name).strip()
        row.billingEmail = data.get("billingEmail", row.billingEmail)
        row.billingPhone = data.get("billingPhone", row.billingPhone)
        row.address = data.get("address", row.address)
        row.city = data.get("city", row.city)
        row.state = data.get("state", row.state)
        row.zip = data.get("zip", row.zip)
        row.country = data.get("country", row.country)
        row.taxId = data.get("taxId", row.taxId)
        row.carbonCreditRate = float(data.get("carbonCreditRate") or row.carbonCreditRate or 0)
        row.managerCostPercent = float(data.get("managerCostPercent") or row.managerCostPercent or 0)
        row.updatedAt = now_ms
    sess.commit()
    return jsonify({"ok": True})


@web_bp.route("/api/subscription", methods=["GET"])
@login_required
@license_required
def get_subscription():
    """
    Return current subscription info for the logged-in user's org.
    Proxies GET /register/api/subscription from the license service.
    Client Admins (role 2) and OEM Admins (role 9) can view this.
    """
    import urllib.request as _ur
    import urllib.error as _ue

    user = get_session().query(User).get(current_user.id)
    if not user:
        return jsonify({"error": "Not found"}), 404

    role = int(user.role) if user.role is not None else 0
    # Determine the org_id to check
    if role in (9, 10):
        org_id = _get_oem_org_id(get_session(), user)
    else:
        org_id = session.get("orgId") or (session.get("user") or {}).get("orgId")
        if not org_id and user.client:
            from app.models.client import Client as _Client
            c = get_session().query(_Client).get(user.client)
            org_id = getattr(c, "org_id", None) if c else None

    if not org_id:
        return jsonify({"error": "No org found"}), 404

    license_url = current_app.config.get("LICENSE_SERVICE_URL", "http://license-service:8000")
    url = f"{license_url.rstrip('/')}/register/api/subscription?org_id={org_id}&program_id=tracking"
    try:
        req = _ur.Request(url)
        with _ur.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode())
        return jsonify(data)
    except _ue.HTTPError as e:
        return jsonify({"error": f"License service error {e.code}"}), e.code
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@web_bp.route("/api/subscription/upgrade", methods=["POST"])
@login_required
@license_required
def upgrade_subscription():
    """
    Create an upgrade billing order and return the payment URL.
    Proxies POST /register/api/upgrade from the license service.
    Only Client Admins (role 2) and OEM Admins (role 9) can upgrade.
    """
    import urllib.request as _ur
    import urllib.parse as _up
    import urllib.error as _ue

    user = get_session().query(User).get(current_user.id)
    if not user:
        return jsonify({"error": "Not found"}), 404

    role = int(user.role) if user.role is not None else 0
    if role not in (2, 9):
        return jsonify({"error": "Only Client Admins or OEM Admins can upgrade"}), 403

    data = request.get_json(silent=True) or {}
    new_plan = data.get("new_plan")
    meter_count = int(data.get("meter_count") or 0)
    return_url = data.get("return_url") or ""

    if not new_plan:
        return jsonify({"error": "new_plan required"}), 400

    # Determine org_id
    if role == 9:
        org_id = _get_oem_org_id(get_session(), user)
    else:
        org_id = session.get("orgId") or (session.get("user") or {}).get("orgId")
        if not org_id and user.client:
            from app.models.client import Client as _Client
            c = get_session().query(_Client).get(user.client)
            org_id = getattr(c, "org_id", None) if c else None

    if not org_id:
        return jsonify({"error": "No org found"}), 404

    license_url = current_app.config.get("LICENSE_SERVICE_URL", "http://license-service:8000")
    url = f"{license_url.rstrip('/')}/register/api/upgrade"
    form_data = _up.urlencode({
        "org_id": org_id,
        "program_id": "tracking",
        "new_plan": new_plan,
        "meter_count": meter_count,
        "return_url": return_url,
    }).encode()
    req = _ur.Request(url, data=form_data, method="POST",
                      headers={"Content-Type": "application/x-www-form-urlencoded"})
    try:
        with _ur.urlopen(req, timeout=5) as resp:
            result = json.loads(resp.read().decode())
        return jsonify(result)
    except _ue.HTTPError as e:
        body = e.read().decode()
        return jsonify({"error": body}), e.code
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@web_bp.route("/<path:path>")
def serve_spa_catchall(path):
    """SPA catch-all: serve static assets without auth; protect SPA routes with login+license.
    Must be registered last so API routes (POST, PUT, etc.) match first."""
    from app.config import _8087_ROOT
    # Serve real static files (JS, CSS, fonts, images) without requiring authentication
    public_dir = _8087_ROOT / ".tmp" / "public"
    # When accessed directly on port 8087 (not via proxy), the webpack publicPath prefix
    # ("/tracking/") is included in the request path but hasn't been stripped.
    # Strip it so chunk files resolve correctly in both direct and proxied access.
    lookup_path = path
    app_root = current_app.config.get("APPLICATION_ROOT", "").strip("/")
    if app_root and lookup_path.startswith(app_root + "/"):
        lookup_path = lookup_path[len(app_root) + 1:]
    for try_path in ([lookup_path] if lookup_path == path else [lookup_path, path]):
        candidate = public_dir / try_path
        try:
            candidate_resolved = candidate.resolve()
            public_resolved = public_dir.resolve()
            if candidate_resolved.is_file() and str(candidate_resolved).startswith(str(public_resolved)):
                from flask import send_from_directory
                return send_from_directory(str(public_resolved), try_path)
        except Exception:
            pass
    # Not a static file — protect with login + license
    if not current_user.is_authenticated:
        return redirect(_login_url())
    return _serve_spa_licensed()
