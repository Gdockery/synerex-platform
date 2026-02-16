"""
License Service integration - JWT verification via Synerex License Service.
Ported from api/controllers/auth/verify-jwt.js, sso-login.js, api/policies/isLoggedIn.js
"""
import json
import urllib.request
import urllib.error
from typing import Optional


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
