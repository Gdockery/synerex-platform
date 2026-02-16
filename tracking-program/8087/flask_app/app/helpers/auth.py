"""
Auth helpers - ported from api/helpers/web/auth/validate-user-password.js
"""


def validate_password(password: str) -> tuple[bool, str]:
    """
    Validate password. Returns (valid, error_message).
    Password must be 7-72 chars (bcrypt limit).
    """
    if len(password) < 7:
        return False, "Password must consist of at least 7 characters."
    if len(password) > 72:
        return False, "Password must not contain more than 72 characters."
    return True, ""
