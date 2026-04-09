"""JWT token generation and validation for session tokens."""
import jwt
import time
from typing import Dict, Any, Optional
from ..config import settings

# JWT secret key - in production, this should be a secure random string
JWT_SECRET = getattr(settings, 'jwt_secret', 'CHANGE_ME_JWT_SECRET')
JWT_ALGORITHM = 'HS256'
JWT_TTL_SECONDS = 900       # 15 minutes  — program session tokens
JWT_USER_TTL_SECONDS = 3600  # 60 minutes — user SSO tokens
USER_JWT_TTL_SECONDS = 3600  # alias kept for backward compat


def generate_session_token(
    license_id: str,
    program_id: str,
    org_id: str,
    roles: Optional[list] = None,
    features: Optional[list] = None,
) -> str:
    """Generate a short-lived JWT session token for program access (license-based)."""
    now = int(time.time())
    claims = {
        "sub": org_id,
        "license_id": license_id,
        "program_id": program_id,
        "roles": roles or [],
        "features": features or [],
        "verified_at": now,
        "iat": now,
        "exp": now + JWT_TTL_SECONDS,
    }
    return jwt.encode(claims, JWT_SECRET, algorithm=JWT_ALGORITHM)


def generate_user_token(
    username: str,
    org_id: str,
    roles: Optional[list] = None,
    email: Optional[str] = None,
    org_type: Optional[str] = None,
    user_role: Optional[str] = None,
) -> str:
    """Generate a short-lived JWT for user SSO across EM&V, Tracking, and Website."""
    now = int(time.time())
    claims = {
        "sub": org_id,
        "username": username,
        "roles": roles or [],
        "typ": "user",
        "iat": now,
        "exp": now + USER_JWT_TTL_SECONDS,
    }
    if email:
        claims["email"] = email
    if org_type:
        claims["org_type"] = org_type
    if user_role is not None:
        claims["user_role"] = user_role
    return jwt.encode(claims, JWT_SECRET, algorithm=JWT_ALGORITHM)


def validate_session_token(token: str) -> Dict[str, Any]:
    """Validate a program session JWT and return its claims."""
    try:
        claims = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return claims
    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired")
    except jwt.InvalidTokenError as e:
        raise ValueError(f"Invalid token: {str(e)}")


def validate_user_token(token: str) -> Dict[str, Any]:
    """Validate a user SSO JWT and return its claims."""
    try:
        claims = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if claims.get("typ") != "user":
            raise ValueError("Invalid token type")
        return claims
    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired")
    except jwt.InvalidTokenError as e:
        raise ValueError(f"Invalid token: {str(e)}")


def is_token_expired(token: str) -> bool:
    """Return True if the token is expired or invalid, False otherwise."""
    try:
        validate_session_token(token)
        return False
    except ValueError:
        return True
