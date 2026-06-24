"""
License Service integration - JWT verification via Synerex License Service.
Ported from api/controllers/auth/verify-jwt.js, sso-login.js, api/policies/isLoggedIn.js
"""
import json
import logging
import urllib.request
import urllib.error
from typing import Optional

logger = logging.getLogger(__name__)


def verify_jwt(token: str, license_service_url: str) -> Optional[dict]:
    """
    Verify JWT via License Service POST /auth/api/verify-jwt.
    Returns claims dict if valid, None otherwise.
    """
    if not token or not license_service_url:
        return None

    url = f"{license_service_url.rstrip('/')}/auth/api/verify-jwt"
    payload = json.dumps({"token": token}).encode()
    req = urllib.request.Request(
        url,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            if resp.status != 200:
                return None
            body = json.loads(resp.read().decode())
            return body.get("claims") if body else None
    except (urllib.error.URLError, urllib.error.HTTPError, json.JSONDecodeError):
        return None


def _call_license_api(method: str, path: str, body: dict = None, license_service_url: str = None) -> Optional[dict]:
    """Internal helper to call the license service API."""
    if not license_service_url:
        from flask import current_app
        license_service_url = current_app.config.get("LICENSE_SERVICE_URL", "http://license-service:8000")
    url = f"{license_service_url.rstrip('/')}{path}"
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, method=method,
                                  headers={"Content-Type": "application/json"} if data else {})
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        logger.warning("license_api %s %s -> HTTP %s", method, path, e.code)
        return {"_http_error": e.code, "_body": e.read().decode()}
    except (urllib.error.URLError, json.JSONDecodeError) as e:
        logger.warning("license_api %s %s -> error: %s", method, path, e)
        return None


def verify_credentials(email: str, password: str, license_service_url: str = None) -> Optional[dict]:
    """
    Verify email+password against the License Service.
    Returns user info dict (with org_id, org_type, etc.) if valid, None otherwise.
    """
    if not email or not password:
        return None
    result = _call_license_api(
        "POST",
        "/auth/api/verify-credentials",
        body={"email": email, "password": password},
        license_service_url=license_service_url,
    )
    if not result or "_http_error" in result:
        return None
    return result if result.get("valid") else None


def get_license_for_org(org_id: str, program_id: str = "tracking") -> Optional[dict]:
    """
    Get the active license for an org from the license service.
    Returns license dict with seat_limit, meter_limit etc., or None.
    """
    if not org_id:
        return None
    result = _call_license_api("GET", f"/api/licenses?org_id={org_id}&program_id={program_id}&status=active")
    if not result:
        return None
    licenses = result.get("licenses") or result.get("items") or (result if isinstance(result, list) else [])
    return licenses[0] if licenses else None


def get_seat_usage(license_id: str) -> int:
    """Return count of active seat assignments for a license."""
    result = _call_license_api("GET", f"/api/licenses/{license_id}/seats")
    if not result:
        return 0
    seats = result.get("active_seats") or []
    return len(seats)


def assign_seat(license_id: str, user_id: str) -> tuple:
    """
    Assign a seat to a user on a license.
    Returns (success: bool, error_message: str or None).
    """
    result = _call_license_api("POST", f"/api/licenses/{license_id}/seats/assign",
                                body={"user_id": str(user_id)})
    if result is None:
        return False, "Could not reach license service"
    if "_http_error" in result:
        code = result["_http_error"]
        body = result.get("_body", "")
        if code == 409 and "seat_limit_exceeded" in body:
            return False, "seat_limit_exceeded"
        if code == 403:
            return False, "seat_limit not enabled"
        return False, f"license service error {code}"
    return True, None


def check_seat_available(org_id: str, program_id: str = "tracking") -> tuple:
    """
    Check whether a new user seat is available for an org.
    Returns (available: bool, license_id: str or None, error: str or None).
    """
    license = get_license_for_org(org_id, program_id)
    if not license:
        return True, None, None  # No license found — don't block (license_required handles that)
    license_id = license.get("license_id") or license.get("id")
    seat_limit = int((license.get("entitlements") or {}).get("limits", {}).get("seat_limit", 0) or 0)
    if seat_limit <= 0:
        return True, license_id, None  # No seat limit configured — allow
    used = get_seat_usage(license_id)
    if used >= seat_limit:
        return False, license_id, f"Seat limit reached ({used}/{seat_limit}). Please upgrade your subscription."
    return True, license_id, None


def get_license_entitlements(org_id: str, program_id: str = "tracking") -> dict:
    """
    Fetch full entitlements for an org's active license.
    Returns entitlements dict (features list + limits dict), or empty dict if none.
    """
    if not org_id:
        return {}
    result = _call_license_api("GET", f"/api/licenses/check-feature?org_id={org_id}&program_id={program_id}")
    if not result or not result.get("valid"):
        return {}
    return result.get("entitlements") or {}


def has_feature(org_id: str, feature: str, program_id: str = "tracking") -> bool:
    """
    Return True if the org's active license includes the given feature.
    Fails open (returns True) if the License Service is unreachable.
    """
    if not org_id or not feature:
        return True  # fail open
    result = _call_license_api(
        "GET",
        f"/api/licenses/check-feature?org_id={org_id}&program_id={program_id}&feature={feature}"
    )
    if result is None:
        return True  # fail open — license service unreachable
    if not result.get("valid"):
        return False  # no active license
    return bool(result.get("has_feature", True))


def get_limit(org_id: str, limit_name: str, program_id: str = "tracking") -> Optional[int]:
    """
    Return a numeric limit from the org's active license entitlements, or None if not set.
    e.g. get_limit(org_id, 'meter_limit'), get_limit(org_id, 'project_limit')
    """
    if not org_id or not limit_name:
        return None
    result = _call_license_api(
        "GET",
        f"/api/licenses/check-feature?org_id={org_id}&program_id={program_id}&limit={limit_name}"
    )
    if not result or not result.get("valid"):
        return None
    val = result.get("limit_value")
    if val is None:
        return None
    try:
        return int(val)
    except (TypeError, ValueError):
        return None

# Alias for backwards compatibility
check_feature = has_feature
