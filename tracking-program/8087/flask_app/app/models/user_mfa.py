"""
UserMfa model — Phase 1: MFA (TOTP).

One row per user. TOTP secret is stored encrypted in production;
for now stored as base32 plaintext (rotate before wider rollout).
Required for roles: Synerex Super Admin (8), OEM Admin (9), Enterprise Admin (3).
"""
from app.extensions import db
from app.models.base import BaseModel


# Roles that MUST complete MFA challenge after password login
MFA_REQUIRED_ROLES = {3, 8, 9}


class UserMfa(BaseModel):
    __tablename__ = "user_mfa"

    user_id      = db.Column(db.Integer, db.ForeignKey("user.id"),
                             nullable=False, unique=True, index=True)
    totp_secret  = db.Column(db.String(64), nullable=True)   # base32 TOTP secret
    enabled      = db.Column(db.Boolean, default=False, nullable=False)
    backup_codes = db.Column(db.JSON, nullable=True)          # list of one-time 8-char codes
    last_used_at = db.Column(db.BigInteger, nullable=True)    # JS timestamp of last successful TOTP
