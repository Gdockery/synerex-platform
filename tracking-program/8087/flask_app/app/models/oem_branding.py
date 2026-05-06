"""
OEM Branding model - stores per-OEM white-label settings.
Keyed by org_id (e.g. OEM-ACME) so branding is resolved from the
logged-in user's org, not from hostname.
"""
from app.extensions import db
from app.models.base import BaseModel


class OemBranding(BaseModel):
    __tablename__ = "oem_branding"

    org_id = db.Column(db.String(255), nullable=False, unique=True, index=True)
    brand_name = db.Column(db.String(255), nullable=True)       # e.g. "Acme Energy"
    logo_path = db.Column(db.String(512), nullable=True)        # color logo — served at /tracking-images/oem_logo/{org_id}
    white_logo_path = db.Column(db.String(512), nullable=True)  # white logo — served at /tracking-images/oem_logo/{org_id}_white
    primary_color = db.Column(db.String(32), nullable=True)     # hex e.g. "#1a73e8"
    secondary_color = db.Column(db.String(32), nullable=True)
    support_email = db.Column(db.String(255), nullable=True)
    website_url = db.Column(db.String(512), nullable=True)
    portal_title = db.Column(db.String(255), nullable=True)     # Browser tab / page title

    # Per-OEM SMTP settings — if set, all emails to this OEM's clients use these credentials
    # so the sending address shows the OEM's brand, not Synerex.
    smtp_server = db.Column(db.String(255), nullable=True)      # e.g. "smtp.gmail.com"
    smtp_port = db.Column(db.Integer, nullable=True)            # e.g. 587
    smtp_username = db.Column(db.String(255), nullable=True)    # e.g. "noreply@acmeenergy.com"
    smtp_password = db.Column(db.String(512), nullable=True)    # stored as-is; rotate before production
    smtp_from_address = db.Column(db.String(255), nullable=True)  # "From" address, defaults to smtp_username
    smtp_from_name = db.Column(db.String(255), nullable=True)   # "From" display name, defaults to brand_name
    smtp_use_tls = db.Column(db.Boolean, nullable=True, default=True)
    insurance_policy = db.Column(db.Text, nullable=True)  # e.g. "General liability and E&O — Policy #ABC123"
