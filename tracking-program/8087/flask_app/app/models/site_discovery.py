"""
SiteDiscovery — Phase 4.

Records pre-install site assessment and discovery data collected via the
Installer Mobile Application.  Contains structured survey data plus free-form
notes captured before or during deployment.
"""
from app.extensions import db
from app.models.base import BaseModel


class SiteDiscovery(BaseModel):
    __tablename__ = "site_discovery"

    deployment_id = db.Column(db.Integer, db.ForeignKey("deployment.id"), nullable=False, index=True)
    site_id       = db.Column(db.Integer, db.ForeignKey("site.id"), nullable=True)

    # Collected by
    collected_by  = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)
    collected_at  = db.Column(db.BigInteger, nullable=True)

    # Site electrical basics
    utility_name       = db.Column(db.String(255), nullable=True)
    utility_account_no = db.Column(db.String(255), nullable=True)
    service_voltage    = db.Column(db.String(50), nullable=True)   # e.g. "480/277V 3Ø"
    service_amperage   = db.Column(db.String(50), nullable=True)
    panel_brand        = db.Column(db.String(255), nullable=True)
    panel_type         = db.Column(db.String(255), nullable=True)
    panel_age_years    = db.Column(db.Integer, nullable=True)

    # Physical access
    access_notes       = db.Column(db.Text, nullable=True)
    contact_onsite     = db.Column(db.String(255), nullable=True)

    # Equipment discovered
    equipment_notes    = db.Column(db.JSON, nullable=True)   # list of {label, type, amp_rating}

    notes              = db.Column(db.Text, nullable=True)
