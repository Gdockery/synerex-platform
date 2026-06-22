"""
Auth routes - ported from api/hooks/auth/, api/controllers/auth/
"""
import logging
import os
import secrets

import bcrypt

logger = logging.getLogger(__name__)
from flask import Blueprint, current_app, redirect, render_template, request, session, url_for
from flask_login import login_required, login_user, logout_user

from app.extensions import db, login_manager
from app.db.request_session import get_session
from app.db.org_db import get_org_session, ensure_org_db, use_per_org_db
from app.helpers.auth import validate_password
from app.models.client import Client
from app.models.user import User
from app.services.license_service import verify_jwt, verify_credentials


def _get_client_name(user):
    """Return the client company name for the given user, or None."""
    if not user or not user.client:
        return None
    try:
        client = get_session().query(Client).get(user.client)
        return client.name if client else None
    except Exception:
        return None

auth_bp = Blueprint("auth", __name__, url_prefix="", template_folder="../templates")


def _login_url(query=""):
    """Login URL with application root when behind proxy."""
    base = current_app.config.get("APPLICATION_ROOT", "") or ""
    path = f"{base}/login" if base else "/login"
    return f"{path}{query}" if query else path


@login_manager.user_loader
def load_user(user_id):
    try:
        sess = get_session()
        return sess.query(User).get(int(user_id))
    except (ValueError, TypeError):
        return None


@auth_bp.route("/login", methods=["GET"])
def show_login_page():
    from app.api.web_routes import _get_brand_name
    from flask_login import logout_user
    # Always clear any existing session when landing on the login page
    logout_user()
    session.clear()
    role = (request.args.get("role") or "").lower()
    is_admin = role == "admin"
    login_label = (
        "Tracking Admin Sign In"
        if is_admin
        else ("Tracking User Sign In" if role == "user" else "Tracking Sign In")
    )
    base_path = current_app.config.get("APPLICATION_ROOT", "") or ""
    # Load OEM branding if a sponsor token is present (e.g. ?oem=OEM-ACME)
    oem_logo_url = None
    oem_primary_color = None
    portal_title = None
    brand_name = _get_brand_name()
    oem_ref = request.args.get("oem") or request.args.get("ref")
    if oem_ref:
        try:
            from app.models.oem_branding import OemBranding
            from app.db.request_session import get_session as _gs
            b = _gs().query(OemBranding).filter_by(org_id=oem_ref).first()
            if b:
                if b.brand_name:
                    brand_name = b.brand_name
                if b.logo_path:
                    safe_org = "".join(c if c.isalnum() or c in "-_" else "_" for c in oem_ref)
                    oem_logo_url = f"{base_path}/tracking-images/oem_logo/{safe_org}"
                oem_primary_color = b.primary_color
                portal_title = b.portal_title
        except Exception:
            pass
    return render_template(
        "auth/login.html",
        login_label=login_label,
        brand_name=brand_name,
        base_path=base_path,
        oem_logo_url=oem_logo_url,
        oem_primary_color=oem_primary_color,
        portal_title=portal_title,
    )


def _wants_json_response():
    """True if client expects JSON (AJAX, API). Avoids redirect loop with jQuery $.post."""
    return (
        request.is_json
        or request.headers.get("Accept", "").startswith("application/json")
        or request.headers.get("X-Requested-With") == "XMLHttpRequest"
    )


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}
    email = request.form.get("email") or data.get("email")
    password = request.form.get("password") or data.get("password")
    terms = request.form.get("terms") or data.get("terms")

    if not email or not password:
        if _wants_json_response():
            return {"status": "error", "error": "Email and password required"}, 400
        base = current_app.config.get("APPLICATION_ROOT", "") or ""
        return redirect(f"{base}/login")

    # Require terms acceptance for form submissions (not required for JSON API clients)
    if request.form and terms != "accept":
        if _wants_json_response():
            return {"status": "error", "error": "Please accept the terms and conditions"}, 400
        base = current_app.config.get("APPLICATION_ROOT", "") or ""
        return redirect(f"{base}/login?error=terms")

    sess = get_session()
    user = sess.query(User).filter_by(email=email, isDeleted=False).first()

    # Try local password first; fall back to License Service credential verification
    local_ok = False
    if user and user.hashedPassword:
        try:
            local_ok = bcrypt.checkpw(password.encode("utf-8"), user.hashedPassword.encode("utf-8"))
        except (ValueError, TypeError):
            local_ok = False

    claims = None
    if not local_ok:
        license_url = current_app.config.get("LICENSE_SERVICE_URL")
        claims = verify_credentials(email, password, license_service_url=license_url) if license_url else None
        if not claims:
            return _login_fail()
        # If no local Tracking user, auto-provision one (just-in-time provisioning)
        if not user:
            org_type = claims.get("org_type") or (claims.get("roles") or [None])[0] or ""
            license_role = claims.get("user_role") or claims.get("role") or ""
            if org_type in ("oem", "admin", "customer"):
                try:
                    org_name = claims.get("org_name") or email.split("@")[0]
                    name_parts = (claims.get("name") or org_name).split(" ", 1)
                    first = name_parts[0]
                    last = name_parts[1] if len(name_parts) > 1 else ""
                    # Map License Service org_type/user_role to Tracking role number
                    if org_type == "admin":
                        tracking_role = 8
                    elif org_type == "oem":
                        tracking_role = 9 if license_role in ("oem_admin",) else 10
                    elif license_role == "customer_admin":
                        tracking_role = 2   # Client Admin
                    else:
                        tracking_role = 1   # Client User
                    new_user = User(
                        firstName=first,
                        lastName=last,
                        email=email,
                        hashedPassword=None,
                        role=tracking_role,
                        isDeleted=False,
                        client=None,
                        org_id=claims.get("org_id"),
                    )
                    sess.add(new_user)
                    sess.commit()
                    sess.refresh(new_user)
                    # For client roles (1, 2), resolve and set user.client from org_id
                    if tracking_role in (1, 2) and new_user.org_id:
                        try:
                            from app.models.client import Client as _Client
                            client_rec = sess.query(_Client).filter(
                                _Client.org_id == new_user.org_id,
                                _Client.isDeleted == False,
                            ).first()
                            if client_rec:
                                new_user.client = client_rec.id
                                sess.commit()
                                current_app.logger.info(
                                    "JIT: linked user %s to client id=%s (org_id=%s)",
                                    email, client_rec.id, new_user.org_id,
                                )
                        except Exception as _ce:
                            current_app.logger.warning("JIT client lookup failed for %s: %s", email, _ce)
                    user = new_user
                    current_app.logger.info(
                        "JIT provisioned Tracking user %s (org_type=%s, role=%s)",
                        email, org_type, tracking_role
                    )
                except Exception as _jit_err:
                    sess.rollback()
                    current_app.logger.error("JIT provisioning failed for %s: %s", email, _jit_err)
                    return _login_fail()
            else:
                return _login_fail()
        # For existing OEM users whose org_id may not be stored yet, persist it now
        elif claims.get("org_id") and not getattr(user, "org_id", None):
            try:
                user.org_id = claims["org_id"]
                sess.commit()
                current_app.logger.info("Backfilled org_id=%s for existing user %s", claims["org_id"], email)
            except Exception:
                sess.rollback()

        # For existing client users (role 1, 2) whose user.client was never set, resolve it now
        if getattr(user, "role", None) in (1, 2) and not user.client:
            _org_id = getattr(user, "org_id", None) or (claims.get("org_id") if claims else None)
            if _org_id:
                try:
                    from app.models.client import Client as _Client
                    _client_rec = sess.query(_Client).filter(
                        _Client.org_id == _org_id,
                        _Client.isDeleted == False,
                    ).first()
                    if _client_rec:
                        user.client = _client_rec.id
                        sess.commit()
                        current_app.logger.info(
                            "Backfilled client=%s for existing user %s (org_id=%s)",
                            _client_rec.id, email, _org_id,
                        )
                except Exception as _bce:
                    sess.rollback()
                    current_app.logger.warning("Client backfill failed for %s: %s", email, _bce)

    login_user(user, remember=True)
    try:
        from app.services.audit import audit as _audit
        _audit("user.login", user_id=user.id,
               org_id=getattr(user, "org_id", None),
               detail={"role": user.role})
    except Exception:
        pass
    session["userId"] = user.id
    session["user"] = {
        "id": user.id,
        "firstName": user.firstName,
        "lastName": user.lastName,
        "email": user.email,
        "role": user.role,
        "client": user.client,
        "clientName": _get_client_name(user),
    }
    _set_org_id_in_session(user)
    # For OEM users (client=None), inject org_id from user record or License Service claims
    if not session.get("orgId"):
        oem_org = getattr(user, "org_id", None) or (claims.get("org_id") if claims else None)
        if oem_org:
            session["orgId"] = oem_org
            session.setdefault("user", {})["orgId"] = oem_org
    # Store org_type and sponsor_org_id from License Service claims (or derive from role)
    if claims:
        session["orgType"] = (
            claims.get("org_type")
            or (claims.get("roles") or [None])[0]
            or ("admin" if user.role == 8 else "oem" if user.role in (9, 10) else "customer")
        )
        session["sponsorOrgId"] = claims.get("sponsor_org_id")
    else:
        session["orgType"] = "admin" if user.role == 8 else "oem" if user.role in (9, 10) else "customer"
        session["sponsorOrgId"] = None

    # Enforce seat limit — non-admin users consume a seat on the org's active license
    if getattr(user, "role", None) != 8:
        try:
            from app.services.license_service import check_seat_available, assign_seat
            org_id = session.get("orgId") or (session.get("user") or {}).get("orgId")
            if org_id:
                available, license_id, seat_err = check_seat_available(org_id, "tracking")
                if not available:
                    logout_user()
                    if _wants_json_response():
                        return {"status": "error", "error": seat_err or "Seat limit reached. Please contact your administrator."}, 403
                    base = current_app.config.get("APPLICATION_ROOT", "") or ""
                    return redirect(f"{base}/login?error=seat_limit")
                if license_id:
                    assign_seat(license_id, str(user.id))
        except Exception as _seat_ex:
            current_app.logger.warning("Seat check failed at login (fail open): %s", _seat_ex)

    # Enforce seat limit — check and assign seat for non-admin users
    if getattr(user, "role", None) != 8:
        org_id = session.get("orgId") or (session.get("user") or {}).get("orgId")
        if org_id:
            from app.services.license_service import check_seat_available, assign_seat, get_license_for_org
            available, license_id, seat_error = check_seat_available(org_id, "tracking")
            if not available:
                from flask_login import logout_user
                logout_user()
                if _wants_json_response():
                    return {"status": "error", "error": seat_error, "code": "SEAT_LIMIT_EXCEEDED"}, 403
                base = current_app.config.get("APPLICATION_ROOT", "") or ""
                return redirect(f"{base}/login?error=seat_limit")
            if license_id:
                assign_seat(license_id, str(user.id))  # best-effort, non-blocking

    # Enforce license expiry for non-admin users with an OEM-managed org
    if getattr(user, "role", None) not in (8, 9):
        org_id = session.get("orgId") or (session.get("user") or {}).get("orgId")
        if org_id:
            try:
                from app.services.license_service import get_license_for_org
                lic = get_license_for_org(org_id, "tracking")
                if lic and lic.get("suspended"):
                    from flask_login import logout_user
                    logout_user()
                    license_service_url = current_app.config.get("LICENSE_SERVICE_URL", "http://localhost:8080").rstrip("/")
                    renewal_url = f"{license_service_url}/license/register/renew?org_id={org_id}"
                    if _wants_json_response():
                        return {"status": "error", "error": "Your subscription has expired. Please renew to continue.", "renewal_url": renewal_url, "code": "LICENSE_EXPIRED"}, 403
                    base = current_app.config.get("APPLICATION_ROOT", "") or ""
                    return redirect(f"{base}/login?error=license_expired")
            except Exception as _exp_ex:
                current_app.logger.warning("License expiry check failed at login (fail open): %s", _exp_ex)

    if _wants_json_response():
        return {"status": "success"}
    base = current_app.config.get("APPLICATION_ROOT", "") or ""
    # Admin-level roles (2, 8, 9, 10): redirect to /#/project/pipeline so deselectProject()
    # is called on init, clearing any stale localStorage project selection.
    if getattr(user, "role", None) in (2, 8, 9, 10):
        return redirect(f"{base}/#/project/pipeline" if base else "/#/project/pipeline")
    return redirect(request.args.get("next") or f"{base}/")


def _login_fail(email: str = ""):
    try:
        from app.services.audit import audit as _audit
        _audit("user.login_failed", detail={"email": email} if email else None)
    except Exception:
        pass
    if _wants_json_response():
        return {"status": "error", "error": "Invalid credentials"}, 404
    base = current_app.config.get("APPLICATION_ROOT", "") or ""
    return redirect(f"{base}/login?error=1")


def _set_org_id_in_session(user):
    """Set session['orgId'] and session['user']['orgId'] from user record or client.org_id."""
    if not user:
        return
    # First: use org_id stored directly on the user (OEM/JIT users have no client)
    org_id = getattr(user, "org_id", None)
    if org_id:
        session["orgId"] = org_id
        session.setdefault("user", {})["orgId"] = org_id
        logger.info("org_id: set session orgId=%s from user.org_id for user=%s", org_id, user.id)
        return
    # Fallback: derive from client record (local client-linked users)
    if not user.client:
        logger.debug("org_id: user has no client or org_id, skipping session orgId")
        return
    sess = get_session()
    client = sess.query(Client).get(user.client)
    if not client:
        logger.debug("org_id: client id=%s not found", user.client)
        return
    org_id = getattr(client, "org_id", None)
    if org_id:
        session["orgId"] = org_id
        session.setdefault("user", {})["orgId"] = org_id
        logger.info("org_id: set session orgId=%s for user=%s client=%s", org_id, user.id, user.client)
    else:
        logger.debug("org_id: client id=%s has no org_id", user.client)


@auth_bp.route("/logout")
def logout():
    # Capture role BEFORE clearing session
    from flask_login import current_user as _cu
    user_role = getattr(_cu, "role", None) if _cu.is_authenticated else None
    _logout_uid = _cu.id if _cu.is_authenticated else None
    _logout_org  = getattr(_cu, "org_id", None) if _cu.is_authenticated else None

    logout_user()
    session.clear()

    try:
        from app.services.audit import audit as _audit
        _audit("user.logout", user_id=_logout_uid, org_id=_logout_org)
    except Exception:
        pass

    # Session expired: redirect to tracking login with message
    if request.args.get("expired"):
        return redirect(_login_url("?expired=1"))

    # Client-level users (roles 1-4) -> redirect to License Service client portal login
    if user_role in (1, 2, 3, 4):
        license_public_url = current_app.config.get("LICENSE_SERVICE_PUBLIC_URL", "").rstrip("/")
        if license_public_url:
            return redirect(license_public_url + "/auth/login")

    # All others -> redirect to Synerex homepage
    website_url = current_app.config.get("WEBSITE_URL") or current_app.config.get("MY_ACCOUNT_URL", "")
    public_url = current_app.config.get("TRACKING_PUBLIC_WEBSITE_URL", "").rstrip("/").replace("/my-account", "")
    if public_url:
        return redirect(public_url + "/" if public_url else _login_url())
    if website_url and not any(h in website_url.lower() for h in ("website", "license-service", "proxy")):
        home = website_url.rstrip("/").replace("/my-account", "")
        return redirect(home + "/" if home else _login_url())
    return redirect(_login_url())


@auth_bp.route("/api/auth/verify-jwt", methods=["POST"])
def verify_jwt_route():
    """POST /api/auth/verify-jwt - JWT validation via License Service. Used by Angular."""
    data = request.get_json() or {}
    token = data.get("token")
    if not token:
        return {"status": "error", "error": "Missing token"}, 400

    license_url = current_app.config.get("LICENSE_SERVICE_URL")
    if not license_url:
        return {"status": "error", "error": "License Service URL not configured"}, 500

    claims = verify_jwt(token, license_url)
    if not claims:
        return {"status": "error", "error": "Invalid or expired token"}, 401

    return {"status": "success", "claims": claims}


@auth_bp.route("/sso", methods=["GET"])
def sso_login():
    """GET /sso?token=... - SSO login via JWT from License Service."""
    token = request.args.get("token")
    if not token:
        return redirect(_login_url())

    license_url = current_app.config.get("LICENSE_SERVICE_URL")
    if not license_url:
        current_app.logger.warning("sso-login: LICENSE_SERVICE_URL not set")
        return redirect(_login_url())

    claims = verify_jwt(token, license_url)
    if not claims:
        return redirect(_login_url())

    email = claims.get("email")
    org_id = claims.get("sub")
    if not email:
        return redirect(_login_url())

    if use_per_org_db() and org_id:
        ensure_org_db(org_id)
        sess = get_org_session(org_id)
        user = sess.query(User).filter_by(email=email, isDeleted=False).first()
        sess.close()
    else:
        user = get_session().query(User).filter_by(email=email, isDeleted=False).first()

    # JIT provisioning for users who exist in License Service but not in Tracking
    if not user:
        # org_type may be in the dedicated field or inside the roles list
        org_type = claims.get("org_type") or (claims.get("roles") or [None])[0] or ""
        license_role = claims.get("user_role") or claims.get("role") or ""
        if org_type in ("oem", "admin", "customer"):
            try:
                org_name = claims.get("org_name") or email.split("@")[0]
                name_parts = (claims.get("name") or org_name).split(" ", 1)
                first = name_parts[0]
                last = name_parts[1] if len(name_parts) > 1 else ""
                # Map License Service org_type/user_role to Tracking role number
                if org_type == "admin":
                    tracking_role = 8
                elif org_type == "oem":
                    tracking_role = 9 if license_role in ("oem_admin",) else 10
                elif license_role == "customer_admin":
                    tracking_role = 2   # Client Admin
                else:
                    tracking_role = 1   # Client User
                sess_w = get_session()
                new_user = User(
                    firstName=first,
                    lastName=last,
                    email=email,
                    hashedPassword=None,
                    role=tracking_role,
                    isDeleted=False,
                    client=None,
                    org_id=org_id,
                )
                sess_w.add(new_user)
                sess_w.commit()
                sess_w.refresh(new_user)
                # For client roles (1, 2), resolve and set user.client from org_id
                if tracking_role in (1, 2) and org_id:
                    try:
                        from app.models.client import Client as _Client
                        _cr = sess_w.query(_Client).filter(
                            _Client.org_id == org_id,
                            _Client.isDeleted == False,
                        ).first()
                        if _cr:
                            new_user.client = _cr.id
                            sess_w.commit()
                            current_app.logger.info(
                                "SSO JIT: linked user %s to client id=%s (org_id=%s)",
                                email, _cr.id, org_id,
                            )
                    except Exception as _ce:
                        current_app.logger.warning("SSO JIT client lookup failed for %s: %s", email, _ce)
                user = new_user
                current_app.logger.info(
                    "SSO JIT provisioned Tracking user %s (org_type=%s, role=%s)",
                    email, org_type, tracking_role
                )
            except Exception as _jit_err:
                sess_w.rollback()
                current_app.logger.error("SSO JIT provisioning failed for %s: %s", email, _jit_err)
                return redirect(_login_url())
        else:
            return redirect(_login_url())

    # Backfill user.client for existing client users whose client was never set
    if getattr(user, "role", None) in (1, 2) and not user.client and org_id:
        try:
            from app.models.client import Client as _Client
            _cr = get_session().query(_Client).filter(
                _Client.org_id == org_id,
                _Client.isDeleted == False,
            ).first()
            if _cr:
                user.client = _cr.id
                get_session().commit()
                current_app.logger.info(
                    "SSO: backfilled client=%s for user %s (org_id=%s)",
                    _cr.id, email, org_id,
                )
        except Exception as _bce:
            current_app.logger.warning("SSO client backfill failed for %s: %s", email, _bce)

    login_user(user, remember=True)
    session["userId"] = user.id
    # Derive org_type from JWT claims (preferred) or fall back to role mapping
    sso_org_type = (
        claims.get("org_type")
        or (claims.get("roles") or [None])[0]
        or ("admin" if user.role == 8 else "oem" if user.role in (9, 10) else "customer")
    )
    session["user"] = {
        "id": user.id,
        "firstName": user.firstName,
        "lastName": user.lastName,
        "email": user.email,
        "role": user.role,
        "client": user.client,
        "clientName": _get_client_name(user),
    }
    session["userRole"] = user.role
    session["orgId"] = org_id
    session["orgType"] = sso_org_type
    session["sponsorOrgId"] = claims.get("sponsor_org_id")
    if session["orgId"]:
        session.setdefault("user", {})["orgId"] = session["orgId"]
    else:
        # JWT had no org_id (sub) - fall back to user's client.org_id for OEM
        _set_org_id_in_session(user)

    base = current_app.config.get("APPLICATION_ROOT", "") or ""
    # For OEM Admin (9), OEM User (10), and Synerex Admin (8), redirect to /#/project/pipeline
    # (hash-based routing) which calls deselectProject() on init — clears any stale
    # localStorage project selection so they land on the admin nav view, not a project view.
    if user.role in (2, 8, 9, 10):
        return redirect(f"{base}/#/project/pipeline" if base else "/#/project/pipeline")
    return redirect(f"{base}/" if base else "/")


@auth_bp.route("/forgot-password", methods=["GET"])
def show_forgot_password_page():
    return render_template("auth/forgot-password.html")


@auth_bp.route("/reset-password-email", methods=["POST"])
def send_password_reset_email():
    email = request.form.get("email") or (request.get_json() or {}).get("email")
    if not email:
        return {"status": "error", "error": "Email required"}, 400

    sess = get_session()
    user = sess.query(User).filter_by(email=email).first()
    if not user:
        return {"status": "success"}  # Don't reveal if user exists

    token = secrets.token_urlsafe(24)
    user.resetPasswordToken = token
    sess.commit()

    # Use public website URL if available; fall back to the configured base URL
    base_url = (
        current_app.config.get("TRACKING_PUBLIC_WEBSITE_URL")
        or current_app.config.get("TRACKING_BASE_URL", "http://localhost:8087")
    )
    app_root = current_app.config.get("APPLICATION_ROOT", "")
    if app_root and not base_url.rstrip("/").endswith(app_root.rstrip("/")):
        base_url = base_url.rstrip("/") + app_root
    reset_link = f"{base_url}/reset-password?t={token}"

    # Resolve OEM branding + SMTP config (falls back to platform SMTP if OEM SMTP not set)
    try:
        from app.api.phase6_routes import _get_oem_smtp_for_current_user, _send_email_via_smtp
        smtp_cfg = _get_oem_smtp_for_current_user()
    except Exception:
        smtp_cfg = {
            "server": current_app.config.get("MAIL_SERVER", ""),
            "port": current_app.config.get("MAIL_PORT", 587),
            "use_tls": current_app.config.get("MAIL_USE_TLS", True),
            "username": current_app.config.get("MAIL_USERNAME", ""),
            "password": current_app.config.get("MAIL_PASSWORD", ""),
            "from_address": current_app.config.get("MAIL_FROM", "noreply@tracking.local"),
            "from_name": None,
            "brand_name": "Synerex",
            "logo_url": "",
            "primary_color": "#1a73e8",
            "support_email": "",
        }
        from app.api.phase6_routes import _send_email_via_smtp

    brand_name = smtp_cfg.get("brand_name") or "Synerex"
    logo_url = smtp_cfg.get("logo_url") or ""
    primary_color = smtp_cfg.get("primary_color") or "#1a73e8"

    text = (
        f"Hi,\n\nClick the link below to reset your {brand_name} portal password:\n\n"
        f"{reset_link}\n\nIf you did not request this, please ignore this email.\n\n"
        f"— The {brand_name} Team"
    )

    logo_html = (
        f'<img src="{logo_url}" alt="{brand_name}" '
        f'style="max-height:60px; max-width:220px; display:block; margin:0 auto 16px auto;">'
        if logo_url else
        f'<div style="font-size:1.4em; font-weight:bold; color:white; '
        f'text-align:center; padding:8px 0;">{brand_name}</div>'
    )
    html = f"""<!DOCTYPE html>
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
            <h2 style="margin:0 0 16px 0; color:#222; font-size:1.3em;">Reset Your Password</h2>
            <p style="color:#444; line-height:1.6;">
              We received a request to reset your <strong>{brand_name}</strong> portal password.
              Click the button below to choose a new password.
            </p>
            <div style="text-align:center; margin:28px 0;">
              <a href="{reset_link}"
                 style="background:{primary_color}; color:#ffffff; text-decoration:none;
                        padding:14px 32px; border-radius:6px; font-size:1em;
                        font-weight:bold; display:inline-block;">
                Reset My Password
              </a>
            </div>
            <p style="color:#888; font-size:0.85em; line-height:1.5;">
              Or copy and paste this link:<br>
              <a href="{reset_link}" style="color:{primary_color}; word-break:break-all;">{reset_link}</a>
            </p>
            <p style="color:#aaa; font-size:0.82em;">
              If you did not request a password reset, you can safely ignore this email.
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

    _send_email_via_smtp(
        smtp_cfg=smtp_cfg,
        to_address=email,
        subject=f"Reset your {brand_name} portal password",
        body_text=text,
        body_html=html,
        log_label=f"Password reset email to {email}",
        fallback_invite_link=reset_link,
    )

    return {"status": "success"}


@auth_bp.route("/reset-password", methods=["GET"])
def show_reset_password_page():
    token = request.args.get("t") or request.args.get("token")
    return render_template("auth/reset-password.html", token=token or "")


@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.form or (request.get_json() or {})
    token = data.get("token")
    password = data.get("password")
    if not token or not password:
        if request.is_json:
            return {"status": "error", "error": "Token and password required"}, 400
        return redirect(url_for("auth.show_reset_password_page"))

    valid, msg = validate_password(password)
    if not valid:
        if request.is_json:
            return {"status": "error", "error": msg}, 400
        return redirect(url_for("auth.show_reset_password_page") + f"?error={msg}")

    sess = get_session()
    user = sess.query(User).filter_by(resetPasswordToken=token).first()
    if not user:
        if request.is_json:
            return {"status": "error", "error": "Invalid or expired token"}, 404
        return redirect(url_for("auth.show_reset_password_page") + "?error=invalid")

    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=8))
    user.hashedPassword = hashed.decode("utf-8")
    user.resetPasswordToken = ""
    sess.commit()

    login_user(user, remember=True)
    session["userId"] = user.id
    session["user"] = {
        "id": user.id,
        "firstName": user.firstName,
        "lastName": user.lastName,
        "email": user.email,
        "role": user.role,
        "client": user.client,
    }
    _set_org_id_in_session(user)

    if request.is_json:
        return {"status": "success"}
    return redirect("/")


@auth_bp.route("/api/roles", methods=["GET"])
@login_required
def list_roles():
    """GET /api/roles — returns all ECBS OS role definitions for UI dropdowns."""
    from app.helpers.roles import roles_for_api
    return {"meta": {}, "response": roles_for_api()}
