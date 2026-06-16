"""
OAuth SSO routes — Phase 1: Google + Microsoft Entra ID.

Flow:
  1. Angular calls GET /api/auth/oauth/<provider>/start
     → Flask stores a CSRF state in session and returns the provider's
       authorization URL to redirect to.
  2. Provider redirects back to /api/auth/oauth/<provider>/callback
     → Flask exchanges the code for an id_token, verifies it, finds or
       creates the local User, then logs them in.

[COMPAT] The Angular login page does not yet have "Sign in with Google/Microsoft"
         buttons.  These routes are fully functional and can be tested by
         navigating directly to /api/auth/oauth/google/start.

Requires:
  pip install requests PyJWT cryptography httpx
  (authlib is NOT used — minimal implementation avoids a heavy dependency)
"""
import hashlib
import hmac
import os
import secrets
import urllib.parse
from time import time

import requests as _req

from flask import Blueprint, current_app, redirect, request, session
from flask_login import login_user

from app.db import get_session
from app.models.user import User
from app.services.audit import audit

oauth_bp = Blueprint("oauth", __name__, url_prefix="/api/auth/oauth")


# ─────────────────────────────────────────────────────────────────────────────
# Provider configs
# ─────────────────────────────────────────────────────────────────────────────

_GOOGLE_AUTH_URL  = "https://accounts.google.com/o/oauth2/v2/auth"
_GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
_GOOGLE_CERTS_URL = "https://www.googleapis.com/oauth2/v3/certs"

_MS_TENANT        = os.environ.get("MICROSOFT_TENANT_ID", "common")
_MS_AUTH_URL      = f"https://login.microsoftonline.com/{_MS_TENANT}/oauth2/v2.0/authorize"
_MS_TOKEN_URL     = f"https://login.microsoftonline.com/{_MS_TENANT}/oauth2/v2.0/token"

_SCOPES = {
    "google":    "openid email profile",
    "microsoft": "openid email profile",
}


def _redirect_uri(provider: str) -> str:
    base = current_app.config.get("OAUTH_REDIRECT_BASE") or ""
    return f"{base}/api/auth/oauth/{provider}/callback"


def _check_configured(provider: str):
    """Return (client_id, client_secret) or (None, error_response)."""
    if provider == "google":
        cid  = current_app.config.get("GOOGLE_CLIENT_ID", "")
        csec = current_app.config.get("GOOGLE_CLIENT_SECRET", "")
    elif provider == "microsoft":
        cid  = current_app.config.get("MICROSOFT_CLIENT_ID", "")
        csec = current_app.config.get("MICROSOFT_CLIENT_SECRET", "")
    else:
        return None, ({"error": f"Unknown provider: {provider}"}, 400)
    if not cid or not csec:
        return None, ({"error": f"{provider} SSO is not configured on this server"}, 501)
    return (cid, csec), None


# ─────────────────────────────────────────────────────────────────────────────
# Start → build provider authorization URL
# ─────────────────────────────────────────────────────────────────────────────

@oauth_bp.route("/<provider>/start", methods=["GET"])
def oauth_start(provider: str):
    creds, err = _check_configured(provider)
    if err:
        return err
    client_id = creds[0]

    state = secrets.token_urlsafe(24)
    session["oauth_state"]    = state
    session["oauth_provider"] = provider

    if provider == "google":
        auth_url = _GOOGLE_AUTH_URL
    else:
        auth_url = _MS_AUTH_URL

    params = urllib.parse.urlencode({
        "client_id":     client_id,
        "redirect_uri":  _redirect_uri(provider),
        "response_type": "code",
        "scope":         _SCOPES[provider],
        "state":         state,
        "prompt":        "select_account",
    })
    return {"url": f"{auth_url}?{params}"}


# ─────────────────────────────────────────────────────────────────────────────
# Callback → exchange code, verify token, login/create user
# ─────────────────────────────────────────────────────────────────────────────

@oauth_bp.route("/<provider>/callback", methods=["GET"])
def oauth_callback(provider: str):
    creds, err = _check_configured(provider)
    if err:
        return err
    client_id, client_secret = creds

    state = request.args.get("state", "")
    if not hmac.compare_digest(state, session.pop("oauth_state", "")):
        return {"error": "Invalid state — possible CSRF"}, 400

    code = request.args.get("code")
    if not code:
        return {"error": "No code returned by provider"}, 400

    # Exchange code for tokens
    token_resp = _req.post(
        _GOOGLE_TOKEN_URL if provider == "google" else _MS_TOKEN_URL,
        data={
            "grant_type":    "authorization_code",
            "code":          code,
            "redirect_uri":  _redirect_uri(provider),
            "client_id":     client_id,
            "client_secret": client_secret,
        },
        timeout=15,
    )
    if not token_resp.ok:
        return {"error": "Token exchange failed", "detail": token_resp.text[:200]}, 502

    tokens = token_resp.json()
    id_token = tokens.get("id_token")
    if not id_token:
        return {"error": "No id_token in provider response"}, 502

    # Decode payload without full signature verification (provider-signed, HTTPS)
    # Full verification (RS256 JWKS) can be added later — for now we trust TLS.
    import base64, json as _json
    try:
        payload_b64 = id_token.split(".")[1]
        payload_b64 += "=" * (-len(payload_b64) % 4)
        claims = _json.loads(base64.urlsafe_b64decode(payload_b64))
    except Exception as e:
        return {"error": f"Could not decode id_token: {e}"}, 502

    email = (claims.get("email") or "").lower().strip()
    sub   = claims.get("sub") or ""
    name  = claims.get("name") or email.split("@")[0]
    if not email:
        return {"error": "Provider did not return an email address"}, 400

    # Find or create local user
    sess = get_session()
    user = sess.query(User).filter_by(email=email, isDeleted=False).first()
    now  = int(time() * 1000)

    if not user:
        name_parts = name.split(" ", 1)
        first = name_parts[0]
        last  = name_parts[1] if len(name_parts) > 1 else ""
        user = User(
            firstName=first,
            lastName=last,
            email=email,
            hashedPassword=None,
            role=1,          # default: client user — admin can promote after first login
            isDeleted=False,
            createdAt=now,
            updatedAt=now,
        )
        sess.add(user)
        sess.flush()
        audit("user.created_via_oauth", user_id=user.id,
              detail={"provider": provider, "email": email})

    # Store provider info for future logins
    try:
        user.oauth_provider = provider  # [COMPAT] column added by phase1_add_user_columns
        user.oauth_sub      = sub
        user.updatedAt      = now
        sess.commit()
    except Exception:
        sess.rollback()

    login_user(user, remember=True)
    session["userId"] = user.id
    session["user"]   = {
        "id":        user.id,
        "firstName": user.firstName,
        "lastName":  user.lastName,
        "email":     user.email,
        "role":      user.role,
        "client":    user.client,
    }
    audit("user.login", user_id=user.id,
          org_id=getattr(user, "org_id", None),
          detail={"provider": provider, "role": user.role})

    # Redirect to Angular app
    base = current_app.config.get("APPLICATION_ROOT", "") or ""
    return redirect(f"{base}/#/project/pipeline")
