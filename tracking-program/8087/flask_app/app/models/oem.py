"""
Oem model — Phase 1: Core Platform Foundation.

Formalises the existing org_id string into a proper table.
[COMPAT] org_id strings on user/project/client remain as-is until the
         consolidation pass at the end of all phases, at which point those
         columns will be migrated to integer oem_id FKs.
"""
from app.extensions import db
from app.models.base import BaseModel


class Oem(BaseModel):
    __tablename__ = "oem"

    # String slug that matches the existing org_id strings throughout the system
    # e.g. "OEM-XCT", "OEM-SNX". Unique, indexed.
    org_id      = db.Column(db.String(255), nullable=False, unique=True, index=True)
    name        = db.Column(db.String(255), nullable=False)   # Display name, e.g. "XECO Energy"
    slug        = db.Column(db.String(100), nullable=True)    # URL-safe slug, e.g. "xeco"
    domain      = db.Column(db.String(255), nullable=True)    # Portal domain, e.g. "portal.xecoenergy.com"
    is_active   = db.Column(db.Boolean, default=True, nullable=False)
    contact_email = db.Column(db.String(255), nullable=True)  # Primary contact
    notes       = db.Column(db.Text, nullable=True)           # Internal notes
