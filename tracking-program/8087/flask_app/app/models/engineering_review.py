"""
EngineeringReview — Phase 4: Engineering Approval module.

An engineer reviews the site discovery data and field commissioning
packets before activation is allowed.

Decision values: pending → approved | rejected | needs_info
"""
from app.extensions import db
from app.models.base import BaseModel

REVIEW_DECISIONS = ("pending", "approved", "rejected", "needs_info")


class EngineeringReview(BaseModel):
    __tablename__ = "engineering_review"

    deployment_id = db.Column(db.Integer, db.ForeignKey("deployment.id"), nullable=False, index=True)

    # Who reviews
    reviewer_id   = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)
    reviewed_at   = db.Column(db.BigInteger, nullable=True)

    decision      = db.Column(db.String(20), nullable=False, default="pending", index=True)
    reviewer_notes = db.Column(db.Text, nullable=True)

    # Checklist (stored as JSON: {item_key: bool})
    checklist     = db.Column(db.JSON, nullable=True)

    # Revision loop
    revision_round = db.Column(db.Integer, default=1, nullable=False)
