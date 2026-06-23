"""
Deployment model — Phase 4: Deployment Management System.

One deployment record is created per project when it is released to the field.
Tracks the full install lifecycle from scheduling through All Checks Clear™
activation.

Status lifecycle (spec §Phase 4):
  not_started → scheduled → installing → commissioning →
  awaiting_approval → activated → on_hold

[COMPAT] FK to project.id and site.id.  The existing project.release_status
         field continues to gate the SYNEREX Deploy app; the Deployment record
         adds per-deployment workflow tracking on top of that.
         Consolidated with Deploy app at end of all phases.
"""
from app.extensions import db
from app.models.base import BaseModel

DEPLOYMENT_STATUSES = (
    "not_started",
    "scheduled",
    "installing",
    "commissioning",
    "awaiting_approval",
    "activated",
    "on_hold",
)

# Step names for the field-entry stepper (Figure A-25)
DEPLOYMENT_STEPS = (
    "site_details",
    "equipment_inventory",
    "pre_install_readings",
    "ct_details",
    "voltage_connections",
    "gateway_config",
    "photos_docs",
    "complete",
)


class Deployment(BaseModel):
    __tablename__ = "deployment"

    # Scope
    project_id  = db.Column(db.Integer, db.ForeignKey("project.id"), nullable=False, index=True)
    site_id     = db.Column(db.Integer, db.ForeignKey("site.id"),    nullable=True,  index=True)
    org_id      = db.Column(db.String(255), nullable=True, index=True)

    # Status
    status      = db.Column(db.String(30), nullable=False, default="not_started", index=True)
    current_step = db.Column(db.String(50), nullable=True)  # field-entry stepper position

    # Scheduling
    scheduled_date  = db.Column(db.String(50), nullable=True)
    installer_id    = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)
    lead_engineer_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)

    # Timestamps
    started_at      = db.Column(db.BigInteger, nullable=True)
    completed_at    = db.Column(db.BigInteger, nullable=True)
    activated_at    = db.Column(db.BigInteger, nullable=True)

    # Field entry data (stored as JSON string)
    field_entry_data = db.Column(db.JSON, nullable=True)

    notes       = db.Column(db.Text, nullable=True)
    is_deleted  = db.Column(db.Boolean, default=False, nullable=False)
