"""
AuditLog model — Phase 1: Core Platform Foundation.

Every significant action in the platform is recorded here.
Rows are append-only and must never be deleted.
"""
from app.extensions import db
from app.models.base import BaseModel


class AuditLog(BaseModel):
    __tablename__ = "audit_log"

    user_id     = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True, index=True)
    org_id      = db.Column(db.String(255), nullable=True, index=True)  # OEM context
    action      = db.Column(db.String(100), nullable=False, index=True)
    # e.g. "user.login", "user.logout", "user.login_failed",
    #       "license.activated", "license.suspended",
    #       "project.created", "report.generated",
    #       "mfa.enabled", "mfa.challenge_failed",
    #       "password.reset_requested", "password.reset_completed"
    entity_type = db.Column(db.String(50), nullable=True)   # e.g. "user", "project", "meter"
    entity_id   = db.Column(db.Integer, nullable=True)       # PK of the affected record
    ip_address  = db.Column(db.String(45), nullable=True)    # IPv4 or IPv6
    user_agent  = db.Column(db.String(512), nullable=True)
    detail      = db.Column(db.JSON, nullable=True)          # Extra context (never include passwords)
