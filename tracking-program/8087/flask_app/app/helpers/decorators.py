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


def _pending_activation_response(license_url):
    """Return a friendly HTML page for client users whose account hasn't been activated yet."""
    from flask import make_response
    my_account_url = (license_url or "").rstrip("/").replace("/license", "") + "/my-account"
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Account Pending Activation</title>
  <style>
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    body {{ font-family: system-ui, sans-serif; background: #f5f7fa; color: #2c3e50; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 2rem; }}
    .card {{ background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); padding: 2.5rem; max-width: 480px; width: 100%; text-align: center; }}
    .icon {{ font-size: 3rem; margin-bottom: 1rem; }}
    h1 {{ font-size: 1.4rem; font-weight: 700; color: #1e3a5f; margin-bottom: 0.75rem; }}
    p {{ color: #64748b; font-size: 0.95rem; line-height: 1.6; margin-bottom: 1rem; }}
    .btn {{ display: inline-block; padding: 0.6rem 1.5rem; background: #0369a1; color: white; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 0.9rem; }}
    .btn:hover {{ background: #075985; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">&#9203;</div>
    <h1>Your Account Is Being Set Up</h1>
    <p>Your organization's Tracking Program subscription is pending activation by your administrator.</p>
    <p>You will receive an email confirmation once your account is ready. If you believe this is an error, please contact your OEM partner or Synerex support.</p>
    <a href="{my_account_url}" class="btn">Back to My Account</a>
  </div>
</body>
</html>"""
    resp = make_response(html, 403)
    resp.headers["Content-Type"] = "text/html"
    return resp


def _license_expired_response(license_url, renewal_url=None):
    """Return a friendly HTML page for client users whose license has expired."""
    from flask import make_response
    my_account_url = (license_url or "").rstrip("/").replace("/license", "") + "/my-account"
    renew_link = f'<a href="{renewal_url}" class="btn">Renew Subscription</a>' if renewal_url else ""
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Subscription Expired</title>
  <style>
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    body {{ font-family: system-ui, sans-serif; background: #f5f7fa; color: #2c3e50; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 2rem; }}
    .card {{ background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); padding: 2.5rem; max-width: 480px; width: 100%; text-align: center; }}
    .icon {{ font-size: 3rem; margin-bottom: 1rem; }}
    h1 {{ font-size: 1.4rem; font-weight: 700; color: #7f1d1d; margin-bottom: 0.75rem; }}
    p {{ color: #64748b; font-size: 0.95rem; line-height: 1.6; margin-bottom: 1.25rem; }}
    .btn {{ display: inline-block; padding: 0.6rem 1.5rem; background: #7c3aed; color: white; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 0.9rem; margin: 0.25rem; }}
    .btn:hover {{ background: #6d28d9; }}
    .btn-sec {{ background: #e2e8f0; color: #374151; }}
    .btn-sec:hover {{ background: #cbd5e0; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">&#128197;</div>
    <h1>Your Subscription Has Expired</h1>
    <p>Your Tracking Program subscription has expired. Renew now to restore access for your team.</p>
    {renew_link}
    <br/>
    <a href="{my_account_url}" class="btn btn-sec" style="margin-top:0.75rem;">Back to My Account</a>
  </div>
</body>
</html>"""
    resp = make_response(html, 403)
    resp.headers["Content-Type"] = "text/html"
    return resp


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

        # OEM Admin bypass (role=9) — OEM partners have direct access; no purchased license needed
        if role == 9:
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

        # Fall back to org_id stored directly on current_user (JIT-provisioned users have no client record)
        if not org_id:
            org_id = getattr(current_user, 'org_id', None)
            if org_id:
                session['orgId'] = org_id
                logger.debug("license_required: org_id=%s from current_user.org_id", org_id)

        # Fall back: look up org_id from user's client record in DB (or directly on user row)
        if not org_id and current_user.is_authenticated:
            try:
                from app.db.request_session import get_session as _get_session
                from app.models.client import Client
                from app.models.user import User as _User
                _sess = _get_session()
                _user = _sess.query(_User).get(current_user.id)
                if _user:
                    # JIT users: org_id may be on the User row directly
                    org_id = getattr(_user, 'org_id', None)
                    if not org_id and _user.client:
                        _client = _sess.query(Client).get(_user.client)
                        if _client:
                            org_id = getattr(_client, 'org_id', None)
                    if org_id:
                        session['orgId'] = org_id
                        session.setdefault('user', {})['orgId'] = org_id
                        logger.info("license_required: resolved org_id=%s from DB for user=%s", org_id, current_user.id)
            except Exception as _e:
                logger.warning("license_required: DB org_id lookup failed: %s", _e)

        if not org_id:
            logger.warning("license_required: NO org_id resolved for user_id=%s role=%s",
                getattr(current_user, 'id', None), getattr(current_user, 'role', None))
            license_url = current_app.config.get("LICENSE_SERVICE_PUBLIC_URL") or current_app.config.get("LICENSE_SERVICE_URL")
            if (request.headers.get("Accept") or "").startswith("application/json"):
                return jsonify({
                    "error": "No org_id",
                    "code": "LICENSE_REQUIRED",
                    "program_id": "tracking",
                    "message": "A valid Tracking Program license is required.",
                }), 403
            if role in (1, 2):
                return _pending_activation_response(license_url)
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
                    "message": "A valid Tracking Program license is required.",
                }), 403
            if role in (1, 2):
                return _pending_activation_response(license_url)
            return redirect(f"{license_url}/register/?program=tracking")

        check_url = f"{license_url.rstrip('/')}/api/licenses/check?org_id={org_id}&program_id=tracking"
        try:
            with urllib.request.urlopen(check_url, timeout=5) as resp:
                if resp.status != 200:
                    _license_cache_set(org_id, True)  # Fail open: cache as valid
                    return f(*args, **kwargs)
                body = json.loads(resp.read().decode())
                valid = bool(body.get("valid"))
                suspended = bool(body.get("suspended"))
                _license_cache_set(org_id, valid)
                if valid:
                    logger.debug("license_required: org_id=%s valid", org_id)
                    return f(*args, **kwargs)
                else:
                    logger.warning("license_required: org_id=%s INVALID - license check returned valid=False body=%s", org_id, body)
        except Exception as e:
            current_app.logger.warning("license_required: License check failed (%s), allowing (fail open)", e)
            _license_cache_set(org_id, True)  # Fail open: cache as valid
            return f(*args, **kwargs)

        reason = "No valid license found"
        purchase_url_base = current_app.config.get("LICENSE_SERVICE_PUBLIC_URL") or license_url
        if (request.headers.get("Accept") or "").startswith("application/json"):
            return jsonify({
                "error": reason,
                "code": "LICENSE_REQUIRED",
                "program_id": "tracking",
                "message": "A valid Tracking Program license is required.",
            }), 403
        if role in (1, 2):
            # Client users whose license expired get sent to the renewal page
            renewal_url = f"{purchase_url_base}/register/renew?org_id={org_id}" if org_id else None
            return _license_expired_response(purchase_url_base, renewal_url)
        return redirect(f"{purchase_url_base}/register/?program=tracking")

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


def feature_required(feature_name: str, program_id: str = "tracking"):
    """
    Require that the logged-in user's org has a specific feature in their active license.
    Usage:
        @feature_required('audit_export')
        def my_route(): ...

    Fails open if License Service is unreachable.
    Admins (role 8) bypass all feature checks.
    """
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            from flask_login import current_user
            from app.services.license_service import has_feature
            from app.db.request_session import get_session
            from app.models.client import Client
            from app.models.user import User as _User

            if not current_user.is_authenticated:
                return jsonify({"error": "Login required", "code": "LOGIN_REQUIRED"}), 403

            role = getattr(current_user, "role", None)
            if role == 8:
                return f(*args, **kwargs)  # Synerex Admin bypass

            # Resolve org_id
            org_id = session.get("orgId") or (session.get("user") or {}).get("orgId")
            if not org_id:
                try:
                    sess = get_session()
                    user = sess.query(_User).get(current_user.id)
                    if user and user.client:
                        client = sess.query(Client).get(user.client)
                        if client:
                            org_id = getattr(client, "org_id", None)
                except Exception:
                    pass

            if not org_id:
                return jsonify({
                    "error": f"Feature '{feature_name}' requires an active license.",
                    "code": "FEATURE_REQUIRED",
                    "feature": feature_name,
                    "program_id": program_id,
                }), 403

            if not has_feature(org_id, feature_name, program_id):
                return jsonify({
                    "error": f"Your current subscription does not include '{feature_name}'. Please upgrade.",
                    "code": "FEATURE_REQUIRED",
                    "feature": feature_name,
                    "program_id": program_id,
                }), 403

            return f(*args, **kwargs)
        return decorated
    return decorator


def require_active_license(f):
    """
    Phase 13 — Meter License Enforcement.

    Gate an analytics API endpoint so that it only responds when the request's
    project has at least one active (or grace-period) licensed meter.

    Resolution order:
      1. Reads project_id from query-string or JSON body.
      2. Looks up Meter rows for that project.
      3. Checks MeterLicense rows for those meters.
      4. If any meter has state in ('active', 'grace') → allow.
      5. If no licensed meters found at all → allow (fail-open for un-licensed
         projects that pre-date Phase 13 deployment, per COMPAT note).
      6. If meters exist but ALL are suspended/expired → return 403.

    Admins (role 8) and OEM admins (role 9) bypass license enforcement.
    Fails open if MeterLicense table does not yet exist.

    Spec: ECBS OS v4 §5 "Licensing Workflow", §40 "License States"
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        if not current_user.is_authenticated:
            return jsonify({"error": "Login required", "code": "LOGIN_REQUIRED"}), 401

        role = getattr(current_user, "role", 0)
        if role in (8, 9):
            return f(*args, **kwargs)

        # Resolve project_id
        project_id = (
            request.args.get("project_id")
            or request.args.get("projectId")
            or (request.get_json(silent=True) or {}).get("project_id")
        )
        if not project_id:
            # No project scope — can't enforce, allow through
            return f(*args, **kwargs)

        try:
            from app.models.meter import Meter
            from app.models.meter_license import MeterLicense

            meter_ids = [
                m.id for m in
                Meter.query.filter_by(project=int(project_id), isDeleted=False).all()
            ]
            if not meter_ids:
                return f(*args, **kwargs)  # no meters, fail-open

            licenses = MeterLicense.query.filter(
                MeterLicense.meter_id.in_(meter_ids)
            ).all()

            if not licenses:
                return f(*args, **kwargs)  # no licenses yet, fail-open (COMPAT)

            active_states = {"active", "grace"}
            if any(lic.state in active_states for lic in licenses):
                return f(*args, **kwargs)

            # All licenses are suspended or expired
            return jsonify({
                "error":      "Meter license is suspended or expired.",
                "code":       "LICENSE_SUSPENDED",
                "message":    "Analytics are unavailable. Contact your OEM administrator.",
                "program_id": "tracking",
            }), 403

        except Exception as exc:
            # Fail open — table may not exist yet or DB is unavailable
            logger.debug("require_active_license: check error (fail-open): %s", exc)
            return f(*args, **kwargs)

    return decorated
