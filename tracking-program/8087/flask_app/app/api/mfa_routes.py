"""
MFA routes — Phase 1: TOTP setup, challenge, and disable.

Flow for a new MFA enrollment:
  1. GET  /api/mfa/setup   → returns provisioning URI + QR data URL
  2. POST /api/mfa/setup   { "code": "123456" } → verifies and enables
  3. POST /api/mfa/verify  { "code": "123456" } → used at login when mfa_pending=1

[COMPAT] The login challenge check (mfa_pending flag) is wired in but the
         Angular login screen does not yet show the TOTP field.  The flag is
         set/cleared so the backend is ready; enforcement is a no-op until the
         frontend MFA screen is shipped.

Requires: pyotp  (pip install pyotp)
"""
import secrets

from flask import Blueprint, request, session
from flask_login import login_required, current_user

from app.db import get_session
from app.models.user_mfa import UserMfa, MFA_REQUIRED_ROLES
from app.services.audit import audit
from app.helpers.time_utils import now_ms as _now

mfa_bp = Blueprint("mfa", __name__, url_prefix="/api/mfa")


def _get_or_create_mfa_row(sess, user_id: int) -> UserMfa:
    row = sess.query(UserMfa).filter_by(user_id=user_id).first()
    if not row:
        now = _now()
        row = UserMfa(user_id=user_id, enabled=False, createdAt=now, updatedAt=now)
        sess.add(row)
        sess.flush()
    return row


@mfa_bp.route("/setup", methods=["GET"])
@login_required
def mfa_setup_get():
    """Return a new TOTP provisioning URI for the current user."""
    try:
        import pyotp
    except ImportError:
        return {"error": "pyotp not installed on server"}, 500

    sess = get_session()
    row = _get_or_create_mfa_row(sess, current_user.id)

    if not row.totp_secret:
        row.totp_secret = pyotp.random_base32()
        row.updatedAt = _now()
        sess.commit()

    totp = pyotp.TOTP(row.totp_secret)
    issuer = "Synerex"
    uri = totp.provisioning_uri(name=current_user.email, issuer_name=issuer)

    try:
        import qrcode, io, base64
        qr = qrcode.make(uri)
        buf = io.BytesIO()
        qr.save(buf, format="PNG")
        qr_data = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()
    except ImportError:
        qr_data = None  # frontend can use a JS QR library with the URI directly

    return {
        "data": {
            "uri":     uri,
            "secret":  row.totp_secret,  # shown once for manual entry
            "enabled": row.enabled,
            "qr":      qr_data,
        }
    }


@mfa_bp.route("/setup", methods=["POST"])
@login_required
def mfa_setup_post():
    """Verify a TOTP code and enable MFA for the current user."""
    try:
        import pyotp
    except ImportError:
        return {"error": "pyotp not installed on server"}, 500

    body = request.get_json(force=True, silent=True) or {}
    code = str(body.get("code", "")).strip()
    if not code:
        return {"error": "code required"}, 400

    sess = get_session()
    row = _get_or_create_mfa_row(sess, current_user.id)
    if not row.totp_secret:
        return {"error": "Run GET /api/mfa/setup first to generate a secret"}, 400

    totp = pyotp.TOTP(row.totp_secret)
    if not totp.verify(code, valid_window=1):
        audit("mfa.setup_failed", user_id=current_user.id,
              org_id=getattr(current_user, "org_id", None))
        return {"error": "Invalid or expired code"}, 400

    # Generate backup codes (10 × 8-char hex)
    backup_codes = [secrets.token_hex(4) for _ in range(10)]
    row.enabled      = True
    row.backup_codes = backup_codes
    row.last_used_at = _now()
    row.updatedAt    = _now()
    sess.commit()

    audit("mfa.enabled", user_id=current_user.id,
          org_id=getattr(current_user, "org_id", None))
    return {"data": {"enabled": True, "backup_codes": backup_codes}}, 200


@mfa_bp.route("/verify", methods=["POST"])
def mfa_verify():
    """
    Verify a TOTP code during login (mfa_pending session state).

    [COMPAT] Called by the MFA challenge screen (not yet in Angular).
             Clears mfa_pending on success so the user is fully logged in.
    """
    try:
        import pyotp
    except ImportError:
        return {"error": "pyotp not installed on server"}, 500

    if not session.get("mfa_pending_user_id"):
        return {"error": "No MFA challenge in progress"}, 400

    body = request.get_json(force=True, silent=True) or {}
    code = str(body.get("code", "")).strip()
    if not code:
        return {"error": "code required"}, 400

    user_id = session["mfa_pending_user_id"]
    sess = get_session()
    row = sess.query(UserMfa).filter_by(user_id=user_id).first()
    if not row or not row.enabled:
        return {"error": "MFA not configured for this account"}, 400

    totp = pyotp.TOTP(row.totp_secret)
    backup_match = code in (row.backup_codes or [])

    if not totp.verify(code, valid_window=1) and not backup_match:
        audit("mfa.challenge_failed", user_id=user_id)
        return {"error": "Invalid or expired code"}, 400

    if backup_match:
        codes = [c for c in row.backup_codes if c != code]
        row.backup_codes = codes

    row.last_used_at = _now()
    row.updatedAt    = _now()
    sess.commit()

    session.pop("mfa_pending_user_id", None)
    audit("mfa.challenge_passed", user_id=user_id)
    return {"status": "success"}


@mfa_bp.route("/disable", methods=["POST"])
@login_required
def mfa_disable():
    """Disable MFA for the current user. Super admin can pass user_id to disable for others."""
    role     = getattr(current_user, "role", 0)
    body     = request.get_json(force=True, silent=True) or {}
    user_id  = body.get("user_id", current_user.id)

    if user_id != current_user.id and role != 8:
        return {"error": "Forbidden"}, 403

    sess = get_session()
    row = sess.query(UserMfa).filter_by(user_id=user_id).first()
    if not row:
        return {"data": {"enabled": False}}

    row.enabled      = False
    row.totp_secret  = None
    row.backup_codes = None
    row.updatedAt    = _now()
    sess.commit()
    audit("mfa.disabled", user_id=current_user.id,
          org_id=getattr(current_user, "org_id", None),
          detail={"target_user_id": user_id})
    return {"data": {"enabled": False}}


@mfa_bp.route("/status", methods=["GET"])
@login_required
def mfa_status():
    """Return MFA enrollment status for the current user."""
    sess = get_session()
    row = sess.query(UserMfa).filter_by(user_id=current_user.id).first()
    enabled  = row.enabled if row else False
    required = getattr(current_user, "role", 0) in MFA_REQUIRED_ROLES
    return {"data": {"enabled": enabled, "required": required,
                     "backup_codes_remaining": len(row.backup_codes or []) if row else 0}}
