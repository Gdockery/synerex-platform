"""
DeviceRegistry model — Phase 3: Device Management Platform.

Unified device record covering all ECBS hardware types with a spec-compliant
status lifecycle. Runs alongside the existing meter/gateway/switch/repeater
tables without modifying them.

Device types (from spec):
  pq_meter, apf, gateway, controller, filter, rack, booster, ct_set

Status lifecycle:
  planned → assigned → installed → commissioned → active → warning → fault → retired

[COMPAT] Legacy tables (meter, gateway, switch, repeater) stay untouched.
         Optional FKs allow cross-referencing existing records. At end of all
         phases, existing table data migrates here and old tables are retired.
"""
from app.extensions import db
from app.models.base import BaseModel

DEVICE_TYPES = (
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

DEVICE_STATUSES = (
    "planned",
    "assigned",
    "installed",
    "commissioned",
    "active",
    "warning",
    "fault",
    "retired",
)


class DeviceRegistry(BaseModel):
    __tablename__ = "device_registry"

    # Org / site scoping
    org_id     = db.Column(db.String(255), nullable=True, index=True)
    site_id    = db.Column(db.Integer, db.ForeignKey("site.id"), nullable=True, index=True)
    asset_id   = db.Column(db.Integer, db.ForeignKey("asset.id"), nullable=True)  # Phase 2 asset link

    # Device identity
    device_type    = db.Column(db.String(30),  nullable=False, index=True)
    name           = db.Column(db.String(255), nullable=True)
    serial_number  = db.Column(db.String(255), nullable=True, index=True)
    barcode        = db.Column(db.String(255), nullable=True, index=True)  # may differ from serial
    manufacturer   = db.Column(db.String(255), nullable=True)
    model_number   = db.Column(db.String(255), nullable=True)
    firmware_version = db.Column(db.String(100), nullable=True)

    # Status lifecycle
    status         = db.Column(db.String(30), nullable=False, default="planned", index=True)
    status_changed_at = db.Column(db.BigInteger, nullable=True)
    status_changed_by = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)

    # Assignment
    assigned_to_project = db.Column(db.Integer, db.ForeignKey("project.id"), nullable=True)  # [COMPAT]
    install_date    = db.Column(db.String(50), nullable=True)

    # [COMPAT] cross-reference to legacy device tables (nullable, removed at end of phases)
    legacy_meter_id    = db.Column(db.Integer, db.ForeignKey("meter.id"),   nullable=True)
    legacy_gateway_id  = db.Column(db.Integer, db.ForeignKey("gateway.id"), nullable=True)
    legacy_switch_id   = db.Column(db.Integer, db.ForeignKey("switch.id"),  nullable=True)
    legacy_repeater_id = db.Column(db.Integer, db.ForeignKey("repeater.id"), nullable=True)

    notes          = db.Column(db.Text, nullable=True)
    is_deleted     = db.Column(db.Boolean, default=False, nullable=False)
