"""
MeterLicense model — Phase 1: Meter Licensing.

Per-meter license state as defined in the ECBS OS spec.
One row per physical PQ meter.

States:
  pending   — meter installed, license not yet activated
  active    — license active, analytics enabled
  grace     — license expired but within grace period (analytics still enabled)
  suspended — manually suspended by Synerex or OEM admin
  expired   — grace period elapsed, analytics disabled

[COMPAT] oem_org_id is a string matching the existing org_id system.
         In the consolidation pass this will become an integer FK to oem.id.
[COMPAT] Analytics are not yet gated by license state (enforcement added in Phase 13).
"""
from app.extensions import db
from app.models.base import BaseModel


LICENSE_STATES = ("pending", "active", "grace", "suspended", "expired")


class MeterLicense(BaseModel):
    __tablename__ = "meter_license"

    meter_id      = db.Column(db.Integer, db.ForeignKey("meter.id"),
                               nullable=False, unique=True, index=True)
    oem_org_id    = db.Column(db.String(255), nullable=True, index=True)  # [COMPAT] string org_id
    state         = db.Column(db.String(20), nullable=False, default="pending")
    activated_at  = db.Column(db.BigInteger, nullable=True)   # JS timestamp
    expires_at    = db.Column(db.BigInteger, nullable=True)   # JS timestamp; NULL = no expiry
    grace_ends_at = db.Column(db.BigInteger, nullable=True)   # JS timestamp
    suspended_at  = db.Column(db.BigInteger, nullable=True)
    suspended_by  = db.Column(db.Integer, nullable=True)      # user.id who suspended
    notes         = db.Column(db.Text, nullable=True)
