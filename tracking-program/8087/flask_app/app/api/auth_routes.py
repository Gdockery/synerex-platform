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
from app.services.license_service import verify_jwt

auth_bp = Blueprint("auth", __name__, url_prefix="", template_folder="../templates")


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
    role = (request.args.get("role") or "").lower()
    is_admin = role == "admin"
    login_label = (
        "Tracking Admin Sign In"
        if is_admin
        else ("Tracking User Sign In" if role == "user" else "Tracking Sign In")
    )
    base_path = current_app.config.get("APPLICATION_ROOT", "") or ""
    return render_template("auth/login.html", login_label=login_label, brand_name=_get_brand_name(), base_path=base_path)


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
    if not user or not user.hashedPassword:
        return _login_fail()
    try:
        if not bcrypt.checkpw(password.encode("utf-8"), user.hashedPassword.encode("utf-8")):
            return _login_fail()
    except (ValueError, TypeError):
        return _login_fail()

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

    if _wants_json_response():
        return {"status": "success"}
    base = current_app.config.get("APPLICATION_ROOT", "") or ""
    return redirect(request.args.get("next") or f"{base}/welcome#loaded")


def _login_fail():
    if _wants_json_response():
        return {"status": "error", "error": "Invalid credentials"}, 404
    base = current_app.config.get("APPLICATION_ROOT", "") or ""
    return redirect(f"{base}/login?error=1")


def _set_org_id_in_session(user):
    """Set session['orgId'] and session['user']['orgId'] from user's client.org_id when available."""
    if not user or not user.client:
        logger.debug("org_id: user has no client, skipping session orgId")
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
    logout_user()
    session.clear()
    # Session expired: redirect to login with message (avoid cross-origin redirect to 5173)
    if request.args.get("expired"):
        return redirect(url_for("auth.show_login_page") + "?expired=1")
    # Redirect to Synerex home (5173 or proxy) - use public URL when config has Docker hostnames
    website_url = current_app.config.get("WEBSITE_URL") or current_app.config.get("MY_ACCOUNT_URL", "")
    public_url = current_app.config.get("TRACKING_PUBLIC_WEBSITE_URL", "").rstrip("/").replace("/my-account", "")
    if public_url:
        return redirect(public_url + "/" if public_url else url_for("auth.show_login_page"))
    if website_url and not any(h in website_url.lower() for h in ("website", "license-service", "proxy")):
        home = website_url.rstrip("/").replace("/my-account", "")
        return redirect(home + "/" if home else url_for("auth.show_login_page"))
    return redirect(url_for("auth.show_login_page"))


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
        return redirect(url_for("auth.show_login_page"))

    license_url = current_app.config.get("LICENSE_SERVICE_URL")
    if not license_url:
        current_app.logger.warning("sso-login: LICENSE_SERVICE_URL not set")
        return redirect(url_for("auth.show_login_page"))

    claims = verify_jwt(token, license_url)
    if not claims:
        return redirect(url_for("auth.show_login_page"))

    email = claims.get("email")
    org_id = claims.get("sub")
    if not email:
        return redirect(url_for("auth.show_login_page"))

    if use_per_org_db() and org_id:
        ensure_org_db(org_id)
        sess = get_org_session(org_id)
        user = sess.query(User).filter_by(email=email, isDeleted=False).first()
        sess.close()
    else:
        user = get_session().query(User).filter_by(email=email, isDeleted=False).first()
    if not user:
        return redirect(url_for("auth.show_login_page"))

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
    session["userRole"] = user.role
    session["orgId"] = org_id
    if session["orgId"]:
        session.setdefault("user", {})["orgId"] = session["orgId"]

    return redirect("/")


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

    base_url = current_app.config.get("TRACKING_BASE_URL", "http://localhost:8087")
    reset_link = f"{base_url}/reset-password?t={token}"

    mail_server = current_app.config.get("MAIL_SERVER")
    if mail_server and current_app.config.get("MAIL_USERNAME"):
        try:
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart

            msg = MIMEMultipart("alternative")
            msg["Subject"] = "Reset your password"
            msg["From"] = current_app.config.get("MAIL_FROM", "noreply@tracking.local")
            msg["To"] = email
            text = f"Click the link below to reset your password:\n\n{reset_link}\n\nIf you did not request this, please ignore this email."
            html = f"<p>Click the link below to reset your password:</p><p><a href=\"{reset_link}\">{reset_link}</a></p><p>If you did not request this, please ignore this email.</p>"
            msg.attach(MIMEText(text, "plain"))
            msg.attach(MIMEText(html, "html"))

            port = current_app.config.get("MAIL_PORT", 587)
            use_tls = current_app.config.get("MAIL_USE_TLS", True)
            with smtplib.SMTP(mail_server, port) as server:
                if use_tls:
                    server.starttls()
                if current_app.config.get("MAIL_USERNAME") and current_app.config.get("MAIL_PASSWORD"):
                    server.login(current_app.config["MAIL_USERNAME"], current_app.config["MAIL_PASSWORD"])
                server.sendmail(msg["From"], email, msg.as_string())
            current_app.logger.info("Password reset email sent to %s", email)
        except Exception as e:
            current_app.logger.exception("Failed to send password reset email: %s", e)
            if current_app.config.get("ENV") == "development":
                current_app.logger.info("RESET PASSWORD LINK (fallback): %s", reset_link)
    elif current_app.config.get("ENV") == "development":
        current_app.logger.info("RESET PASSWORD LINK (no mail config): %s", reset_link)

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
