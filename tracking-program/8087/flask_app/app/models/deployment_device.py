"""
DeploymentDevice — Phase 4.

Links a DeviceRegistry record to a Deployment, tracking per-device
install progress and assignment within a deployment.
"""
from app.extensions import db
from app.models.base import BaseModel


class DeploymentDevice(BaseModel):
    __tablename__ = "deployment_device"

    deployment_id     = db.Column(db.Integer, db.ForeignKey("deployment.id"), nullable=False, index=True)
    device_registry_id = db.Column(db.Integer, db.ForeignKey("device_registry.id"), nullable=True)

    # Identity when device hasn't been scanned yet
    device_type   = db.Column(db.String(30),  nullable=True)
    planned_label = db.Column(db.String(255), nullable=True)  # e.g. "APF-1 at MDP-A"

    # Install progress
    install_step   = db.Column(db.String(50), nullable=True)
    scanned_at     = db.Column(db.BigInteger, nullable=True)
    scanned_by     = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)
    installed_at   = db.Column(db.BigInteger, nullable=True)

    # CT / APF commissioning specifics (spec Figure A-25)
    ct_amp_rating  = db.Column(db.String(50), nullable=True)
    ct_ratio       = db.Column(db.String(50), nullable=True)
    ct_orientation = db.Column(db.Boolean, nullable=True)    # True = correct
    phase_rotation_ok = db.Column(db.Boolean, nullable=True)

    notes = db.Column(db.Text, nullable=True)
