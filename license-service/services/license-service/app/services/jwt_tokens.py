"""JWT token generation and validation for session tokens."""
import jwt
import time
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from ..config import settings

# JWT secret key - in production, this should be a secure random string
JWT_SECRET = getattr(settings, 'jwt_secret', 'CHANGE_ME_JWT_SECRET')
JWT_ALGORITHM = 'HS256'
JWT_TTL_SECONDS = 900  # 15 minutes
JWT_USER_TTL_SECONDS = 3600  # 60 minutes
USER_JWT_TTL_SECONDS = 3600  # 60 minutes for user SSO tokens

def generate_session_token(
    license_id: str,
    program_id: str,
    org_id: str,
    roles: Optional[list] = None,
    features: Optional[list] = None
) -> str:
    """
    Generate a short-lived JWT session token for program access.
    
    Args:
        license_id: The license serial number
        program_id: The program ID (emv or tracking)
        org_id: The organization ID
        roles: Optional list of user roles
        features: Optional list of features
        
    Returns:
        JWT token string
    """
    now = int(time.time())
    claims = {
        "sub": org_id,
        "license_id": license_id,
        "program_id": program_id,
        "roles": roles or [],
        "features": features or [],
        "verified_at": now,
        "iat": now,
        "exp": now + JWT_TTL_SECONDS
    }
    
    return jwt.encode(claims, JWT_SECRET, algorithm=JWT_ALGORITHM)

def generate_user_token(
    org_id: str,
    username: str,
    email: Optional[str] = None,
    org_type: Optional[str] = None,
    roles: Optional[list] = None,
) -> str:
    """Generate a short-lived JWT for user SSO across services."""
    now = int(time.time())
    claims = {
        "sub": org_id,
        "username": username,
        "email": email,
        "org_type": org_type,
        "roles": roles or [],
        "typ": "user",
        "iat": now,
        "exp": now + JWT_USER_TTL_SECONDS,
    }
    return jwt.encode(claims, JWT_SECRET, algorithm=JWT_ALGORITHM)

def validate_session_token(token: str) -> Dict[str, Any]:
    """
    Validate a JWT session token and return its claims.
    
    Args:
        token: JWT token string
        
    Returns:
        Dictionary containing token claims
        
    Raises:
        jwt.ExpiredSignatureError: If token is expired
        jwt.InvalidTokenError: If token is invalid
    """
    try:
        claims = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return claims
    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired")
    except jwt.InvalidTokenError as e:
        raise ValueError(f"Invalid token: {str(e)}")

def validate_user_token(token: str) -> Dict[str, Any]:
    """Validate a user JWT token and return its claims."""
    claims = validate_session_token(token)
    if claims.get("typ") not in (None, "user"):
        raise ValueError("Invalid token type")
    return claims

def is_token_expired(token: str) -> bool:
    """Check if a token is expired without raising an exception."""
    try:
        validate_session_token(token)
        return False
    except ValueError:
        return True

def generate_user_token(
    username: str,
    org_id: str,
    roles: Optional[list] = None
) -> str:
    """
    Generate a JWT for user SSO across services.
    """
    now = int(time.time())
    claims = {
        "sub": org_id,
        "username": username,
        "roles": roles or [],
        "typ": "user",
        "iat": now,
        "exp": now + USER_JWT_TTL_SECONDS,
    }
    return jwt.encode(claims, JWT_SECRET, algorithm=JWT_ALGORITHM)

def validate_user_token(token: str) -> Dict[str, Any]:
    """
    Validate a user JWT and return claims.
    """
    try:
        claims = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if claims.get("typ") != "user":
            raise ValueError("Invalid token type")
        return claims
    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired")
    except jwt.InvalidTokenError as e:
        raise ValueError(f"Invalid token: {str(e)}")


