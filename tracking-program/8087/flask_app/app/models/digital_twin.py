"""
DigitalTwin + DigitalTwinVersion models — Phase 2.

DigitalTwin is the versioned engineering model of a site's electrical network.
It is the source of truth consumed by:
  - Electrical Network engine
  - Current Balance Intelligence
  - Capacity Intelligence
  - Deployment Management

Lifecycle:
  draft → field_verified → engineering_review → approved → locked → archived

Only one twin can be in 'approved' or 'locked' state per site at a time.
Previous approved twins are automatically moved to 'archived' when a new one
is approved.

DigitalTwinVersion is a point-in-time snapshot of the asset graph. Every time
the twin is saved, a new version row is written containing the full JSON
snapshot of assets + relationships at that moment.
"""
from app.extensions import db
from app.models.base import BaseModel

TWIN_STATUSES = (
    "draft",
    "field_verified",
    "engineering_review",
    "needs_revision",
    "approved",
    "locked",
    "archived",
)


class DigitalTwin(BaseModel):
    __tablename__ = "digital_twin"

    site_id         = db.Column(db.Integer, db.ForeignKey("site.id"), nullable=False, index=True)
    org_id          = db.Column(db.String(255), nullable=True, index=True)
    # [COMPAT] project_id for backward-linking until project→site migration is done
    project_id      = db.Column(db.Integer, db.ForeignKey("project.id"), nullable=True, index=True)

    status          = db.Column(db.String(30), nullable=False, default="draft", index=True)
    version_number  = db.Column(db.Integer,  nullable=False, default=1)
    label           = db.Column(db.String(255), nullable=True)   # e.g. "v1 — post-SLD import"

    # Workflow audit fields
    submitted_by    = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)
    reviewed_by     = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)
    approved_by     = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)
    submitted_at    = db.Column(db.BigInteger, nullable=True)
    reviewed_at     = db.Column(db.BigInteger, nullable=True)
    approved_at     = db.Column(db.BigInteger, nullable=True)

    # Source of initial draft
    source          = db.Column(db.String(50), nullable=True)   # "sld_import" | "manual" | "topo_seed"
    notes           = db.Column(db.Text, nullable=True)
    review_notes    = db.Column(db.Text, nullable=True)         # reviewer feedback
    is_deleted      = db.Column(db.Boolean, default=False, nullable=False)


class DigitalTwinVersion(BaseModel):
    """Immutable snapshot of the asset graph. Never deleted."""
    __tablename__ = "digital_twin_version"

    digital_twin_id = db.Column(db.Integer, db.ForeignKey("digital_twin.id"),
                                 nullable=False, index=True)
    version_number  = db.Column(db.Integer, nullable=False)
    saved_by        = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)
    label           = db.Column(db.String(255), nullable=True)
    # Full JSON snapshot of {assets: [...], relationships: [...]} at save time
    snapshot        = db.Column(db.JSON, nullable=False)
    change_summary  = db.Column(db.Text, nullable=True)   # human-readable diff description
