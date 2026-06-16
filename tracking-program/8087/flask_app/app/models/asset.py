"""
Asset model — Phase 2: Asset Management & Digital Twin Foundation.

An Asset is any physical electrical object in the facility hierarchy:
  Utility Service → Transformer → Switchgear → MCC → Panel → Feeder → Load → Device

Relationships between assets are stored in the separate asset_relationship table.

[COMPAT] The existing `meter` table is NOT altered. Where an asset represents a
         PQ meter, meter_id is set to the corresponding meter.id row. At end of
         all phases, meter becomes a first-class asset subtype — noted for cleanup.
"""
from app.extensions import db
from app.models.base import BaseModel

ASSET_TYPES = (
    "utility_service",
    "transformer",
    "switchgear",
    "mcc",
    "panel",
    "feeder",
    "load",
    "pq_meter",
    "apf",
    "gateway",
    "controller",
    "filter",
    "rack",
    "booster",
    "ct_set",
    "other",
)

ASSET_STATUSES = ("planned", "installed", "commissioned", "active", "warning", "fault", "retired")


class Asset(BaseModel):
    __tablename__ = "asset"

    site_id         = db.Column(db.Integer, db.ForeignKey("site.id"), nullable=False, index=True)
    org_id          = db.Column(db.String(255), nullable=True, index=True)
    digital_twin_id = db.Column(db.Integer, nullable=True, index=True)  # FK set after digital_twin created

    asset_type      = db.Column(db.String(50),  nullable=False, index=True)
    name            = db.Column(db.String(255), nullable=False)
    asset_uid       = db.Column(db.String(100), nullable=True)   # e.g. "XFMR-001", "SWGR-002"
    manufacturer    = db.Column(db.String(255), nullable=True)
    model_number    = db.Column(db.String(255), nullable=True)
    serial_number   = db.Column(db.String(255), nullable=True)
    install_date    = db.Column(db.String(50),  nullable=True)   # ISO date string

    # Electrical ratings (asset_type-specific fields, nullable on non-applicable types)
    kva_rating      = db.Column(db.Float, nullable=True)          # transformers, panels
    voltage_primary = db.Column(db.Float, nullable=True)          # transformers (V)
    voltage_secondary = db.Column(db.Float, nullable=True)        # transformers (V)
    amp_rating      = db.Column(db.Float, nullable=True)          # breakers, feeders, MCCs
    phases          = db.Column(db.Integer, nullable=True)        # 1 or 3
    bus_id          = db.Column(db.String(100), nullable=True)    # bus label from SLD
    drawing_ref     = db.Column(db.String(100), nullable=True)    # SLD drawing reference

    # [COMPAT] optional FK to existing meter.id when asset_type = 'pq_meter'
    meter_id        = db.Column(db.Integer, db.ForeignKey("meter.id"), nullable=True)

    status          = db.Column(db.String(30), nullable=False, default="planned")
    notes           = db.Column(db.Text, nullable=True)
    extra           = db.Column(db.JSON, nullable=True)    # overflow for future fields
    is_deleted      = db.Column(db.Boolean, default=False, nullable=False)
