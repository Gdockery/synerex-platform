"""
SiteActivation — Phase 4: All Checks Clear™ Certification.

The terminal step before a site goes live.  Created automatically when a
deployment reaches `awaiting_approval` and all engineering reviews are
approved.  Carries the final certification and operator signature.
"""
from app.extensions import db
from app.models.base import BaseModel

ACTIVATION_STATUSES = ("pending", "certified", "revoked")


class SiteActivation(BaseModel):
    __tablename__ = "site_activation"

    deployment_id    = db.Column(db.Integer, db.ForeignKey("deployment.id"), nullable=False, unique=True)
    site_id          = db.Column(db.Integer, db.ForeignKey("site.id"), nullable=True)

    status           = db.Column(db.String(20), nullable=False, default="pending", index=True)

    # Certification
    certified_by     = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)
    certified_at     = db.Column(db.BigInteger, nullable=True)
    certification_code = db.Column(db.String(64), nullable=True, unique=True)  # generated token

    # Final checks summary (JSON)
    checks_summary   = db.Column(db.JSON, nullable=True)

    notes            = db.Column(db.Text, nullable=True)
