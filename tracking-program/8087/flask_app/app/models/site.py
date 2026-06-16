"""
Site model — Phase 2: Asset Management & Digital Twin Foundation.

A Site is the physical facility — the canonical location record used by
Digital Twins, Assets, and Device deployments.

Hierarchy:
  Synerex → OEM (org_id) → Customer (client) → Site → Asset → Device → Meter

[COMPAT] The existing `project` table remains unchanged. A project is linked
         to a site via the optional `project_id` FK below. Angular continues to
         work with projects as before; site is a new layer used by the Digital
         Twin engine. At end of all phases, project commercial data and site
         physical data will be fully separated — noted for future cleanup.
"""
from app.extensions import db
from app.models.base import BaseModel

SITE_STATUSES = ("active", "in_deployment", "commissioning", "offline", "archived")


class Site(BaseModel):
    __tablename__ = "site"

    org_id      = db.Column(db.String(255), nullable=True, index=True)   # OEM context
    client_id   = db.Column(db.Integer, db.ForeignKey("client.id"), nullable=True, index=True)
    # [COMPAT] nullable FK to project; removed when project→site migration completes
    project_id  = db.Column(db.Integer, db.ForeignKey("project.id"), nullable=True, index=True)

    name        = db.Column(db.String(255), nullable=False)
    site_number = db.Column(db.String(100), nullable=True)    # e.g. "SITE-FLEX-TJ-001"
    address     = db.Column(db.String(255), nullable=True)
    city        = db.Column(db.String(100), nullable=True)
    state       = db.Column(db.String(50),  nullable=True)
    zip         = db.Column(db.String(20),  nullable=True)
    country     = db.Column(db.String(50),  nullable=True, default="US")
    timezone    = db.Column(db.String(100), nullable=True)    # e.g. "America/Chicago"
    utility     = db.Column(db.String(255), nullable=True)
    status      = db.Column(db.String(30),  nullable=False, default="active")
    notes       = db.Column(db.Text, nullable=True)
    is_deleted  = db.Column(db.Boolean, default=False, nullable=False)
