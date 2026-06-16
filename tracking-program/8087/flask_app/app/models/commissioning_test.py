"""
CommissioningTest model — Phase 3: APF Commissioning & CT Verification.

Records the required commissioning inputs and test outcomes for each device.
One row per commissioning attempt; devices may be re-commissioned.

Required fields (from spec):
  APF Model, APF Serial Number, CT Amp Rating, CT Ratio,
  CT Orientation (Yes/No), Phase Rotation Verification

Test outcomes:
  Voltage Verification, Current Verification,
  Communication Verification, Data Verification
"""
from app.extensions import db
from app.models.base import BaseModel

COMMISSIONING_OUTCOMES = ("pass", "fail", "pending")


class CommissioningTest(BaseModel):
    __tablename__ = "commissioning_test"

    device_id       = db.Column(db.Integer, db.ForeignKey("device_registry.id"),
                                 nullable=False, index=True)
    site_id         = db.Column(db.Integer, db.ForeignKey("site.id"), nullable=True)
    performed_by    = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)
    reviewed_by     = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)

    # APF commissioning inputs
    apf_model       = db.Column(db.String(100), nullable=True)
    apf_serial      = db.Column(db.String(100), nullable=True)
    ct_amp_rating   = db.Column(db.Float, nullable=True)
    ct_ratio        = db.Column(db.String(50), nullable=True)   # e.g. "400:5"
    ct_orientation  = db.Column(db.Boolean, nullable=True)       # True=correct, False=reversed
    phase_rotation_verified = db.Column(db.Boolean, nullable=True)

    # Test results
    voltage_verified       = db.Column(db.Boolean, nullable=True)
    current_verified       = db.Column(db.Boolean, nullable=True)
    communication_verified = db.Column(db.Boolean, nullable=True)
    data_verified          = db.Column(db.Boolean, nullable=True)

    # Overall outcome
    outcome         = db.Column(db.String(20), nullable=False, default="pending")
    failure_reason  = db.Column(db.Text, nullable=True)
    notes           = db.Column(db.Text, nullable=True)
    performed_at    = db.Column(db.BigInteger, nullable=True)  # JS timestamp
