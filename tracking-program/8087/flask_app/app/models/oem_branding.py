"""
OEM Branding model - stores per-OEM white-label settings.
Keyed by org_id (e.g. OEM-HARMONIQ) so branding is resolved from the
logged-in user's org, not from hostname.
"""
from app.extensions import db
from app.models.base import BaseModel


class OemBranding(BaseModel):
    __tablename__ = "oem_branding"

    org_id = db.Column(db.String(255), nullable=False, unique=True, index=True)
    brand_name = db.Column(db.String(255), nullable=True)       # e.g. "Harmoniq Energy"
    logo_path = db.Column(db.String(512), nullable=True)        # served at /images/oem_logo/{org_id}
    primary_color = db.Column(db.String(32), nullable=True)     # hex e.g. "#1a73e8"
    secondary_color = db.Column(db.String(32), nullable=True)
    support_email = db.Column(db.String(255), nullable=True)
    website_url = db.Column(db.String(512), nullable=True)
    portal_title = db.Column(db.String(255), nullable=True)     # Browser tab / page title
