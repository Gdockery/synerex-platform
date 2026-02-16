"""Store and verify admin session tokens for SSO (Tracking, EMV, etc.)."""
import time
from typing import Optional

# In-memory store: token -> expiry timestamp. Tokens expire after 24h.
_admin_tokens: dict[str, float] = {}
_TTL = 24 * 3600


def store_admin_token(token: str) -> None:
    _admin_tokens[token] = time.time() + _TTL


def verify_admin_token(token: str) -> bool:
    if not token:
        return False
    expiry = _admin_tokens.get(token)
    if expiry is None:
        return False
    if time.time() > expiry:
        del _admin_tokens[token]
        return False
    return True


def revoke_admin_token(token: str) -> None:
    _admin_tokens.pop(token, None)
