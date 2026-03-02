"""
Policy decorators - ported from config/policies.js and api/policies/
"""
import logging
import os
import time
import urllib.request
import urllib.error
import json
from functools import wraps

from flask import current_app, jsonify, redirect, request, session
from flask_login import current_user, login_required as flask_login_required

from app.services.license_service import verify_jwt

logger = logging.getLogger(__name__)

# In-memory cache for license validity: key -> (valid: bool, expires_at: float)
# TTL 120 seconds to reduce License Service calls while keeping reasonable freshness
_LICENSE_CACHE = {}
_LICENSE_CACHE_TTL = 120


def _license_cache_get(org_id):
    """Return cached validity (True/False) or None if miss/expired."""
    key = f"license:{org_id}"
    if key in _LICENSE_CACHE:
        valid, expires = _LICENSE_CACHE[key]
        if time.time() < expires:
            return valid
        del _LICENSE_CACHE[key]
    return None


def _license_cache_set(org_id, valid):
    """Cache license validity for TTL seconds."""
    _LICENSE_CACHE[f"license:{org_id}"] = (valid, time.time() + _LICENSE_CACHE_TTL)


def license_required(f):
    """
    Require valid license for route. Ported from api/policies/hasValidLicense.js.
    Fails open on License Service errors (availability). Admins bypass.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        if not current_user.is_authenticated:
            if (request.headers.get("Accept") or "").startswith("application/json"):
                return jsonify({"error": "Login required", "code": "LOGIN_REQUIRED"}), 403
            return redirect(current_app.config.get("LOGIN_VIEW", "/login") or "/login")

        # Admin bypass (XECO_ADMIN=8 per config constants)
        role = getattr(current_user, "role", None)
        user_role = session.get("userRole") or role
        if user_role in ("admin", "administrator", "superadmin") or role == 8:
            return f(*args, **kwargs)

        org_id = request.headers.get("x-org-id")
        if not org_id and current_user.is_authenticated:
            # Try Bearer token - verify via License Service
            auth = request.headers.get("Authorization")
            if auth and auth.startswith("Bearer "):
                token = auth[7:]
                license_url = current_app.config.get("LICENSE_SERVICE_URL")
                if license_url:
                    claims = verify_jwt(token, license_url)
                    if claims:
                        org_id = claims.get("sub")
                        if org_id:
                            session["orgId"] = org_id
                            return f(*args, **kwargs)

        if not org_id:
            u = session.get("user") or {}
            org_id = session.get("orgId") or u.get("orgId") or u.get("org_id") or u.get("clientId")
            if org_id:
                logger.debug("license_required: org_id=%s from session", org_id)

        if not org_id:
            license_url = current_app.config.get("LICENSE_SERVICE_URL")
            if (request.headers.get("Accept") or "").startswith("application/json"):
                return jsonify({
                    "error": "No org_id",
                    "code": "LICENSE_REQUIRED",
                    "program_id": "tracking",
                    "purchase_url": f"{license_url}/register/?program=tracking",
                    "message": "A valid Tracking Program license is required.",
                }), 403
            return redirect(f"{license_url}/register/?program=tracking")

        # Check license via License Service (with cache to reduce HTTP calls)
        license_url = current_app.config.get("LICENSE_SERVICE_URL")
        if not license_url:
            return f(*args, **kwargs)  # Fail open

        cached = _license_cache_get(org_id)
        if cached is True:
            return f(*args, **kwargs)
        if cached is False:
            reason = "No valid license found"
            if (request.headers.get("Accept") or "").startswith("application/json"):
                return jsonify({
                    "error": reason,
                    "code": "LICENSE_REQUIRED",
                    "program_id": "tracking",
                    "purchase_url": f"{license_url}/register/?program=tracking",
                    "message": "A valid Tracking Program license is required.",
                }), 403
            return redirect(f"{license_url}/register/?program=tracking")

        check_url = f"{license_url.rstrip('/')}/api/licenses/check?org_id={org_id}&program_id=tracking"
        try:
            with urllib.request.urlopen(check_url, timeout=5) as resp:
                if resp.status != 200:
                    _license_cache_set(org_id, True)  # Fail open: cache as valid
                    return f(*args, **kwargs)
                body = json.loads(resp.read().decode())
                valid = bool(body.get("valid"))
                _license_cache_set(org_id, valid)
                if valid:
                    logger.debug("license_required: org_id=%s valid", org_id)
                    return f(*args, **kwargs)
        except Exception as e:
            current_app.logger.warning("license_required: License check failed (%s), allowing (fail open)", e)
            _license_cache_set(org_id, True)  # Fail open: cache as valid
            return f(*args, **kwargs)

        reason = "No valid license found"
        if (request.headers.get("Accept") or "").startswith("application/json"):
            return jsonify({
                "error": reason,
                "code": "LICENSE_REQUIRED",
                "program_id": "tracking",
                "purchase_url": f"{license_url}/register/?program=tracking",
                "message": "A valid Tracking Program license is required.",
            }), 403
        return redirect(f"{license_url}/register/?program=tracking")

    return decorated


def remote_maintainer(f):
    """
    Require remote maintainer access. Ported from isRemoteMaintainer policy.
    Allows if: (1) X-Maintenance-Secret header or body 'secret' matches MAINTENANCE_SECRET,
    or (2) body 'key' is GPG-encrypted JSON with secret matching ~/.xeco-maintenance or MAINTENANCE_SECRET.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        secret = current_app.config.get("MAINTENANCE_SECRET")
        provided = (
            request.headers.get("X-Maintenance-Secret")
            or (request.get_json(silent=True) or {}).get("secret")
            or (request.form or {}).get("secret")
        )
        if secret and provided == secret:
            return f(*args, **kwargs)
        key_enc = (request.get_json(silent=True) or {}).get("key") or (request.form or {}).get("key")
        if key_enc:
            try:
                from app.services.maintenance_service import decrypt
                dec = decrypt(current_app, key_enc)
                if dec:
                    import json as _json
                    key = _json.loads(dec)
                    expected = secret
                    if not expected:
                        try:
                            with open(os.path.expanduser("~/.xeco-maintenance")) as f:
                                expected = f.read().strip()
                        except Exception:
                            pass
                    if expected and key.get("secret") == expected and key.get("salt"):
                        return f(*args, **kwargs)
            except Exception:
                pass
        return jsonify({"error": "Forbidden"}), 403

    return decorated


def emv_api_key_or_login(f):
    """
    For EMV integration routes: allow if X-EMV-API-Key matches EMV_API_KEY (service-to-service),
    otherwise require login and license.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        api_key = current_app.config.get("EMV_API_KEY")
        provided = request.headers.get("X-EMV-API-Key")
        if api_key and provided and api_key == provided:
            return f(*args, **kwargs)
        # Fall through to login then license (same order as @login_required @license_required)
        chained = flask_login_required(license_required(f))
        return chained(*args, **kwargs)
    return decorated


def internal_or_cron(f):
    """
    Allow cron / EB app callers. Requires CRON_SECRET header or localhost.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        secret = current_app.config.get("CRON_SECRET")
        provided = request.headers.get("X-Cron-Secret")
        is_local = request.remote_addr in ("127.0.0.1", "::1", "localhost")
        if is_local and not secret:
            return f(*args, **kwargs)
        if secret and provided == secret:
            return f(*args, **kwargs)
        return jsonify({"error": "Forbidden"}), 403

    return decorated
