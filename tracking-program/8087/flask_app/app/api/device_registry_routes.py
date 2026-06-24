"""
Device Registry routes — Phase 3: Device Management Platform.

GET    /api/device-registry/                    list (scoped to org/site)
POST   /api/device-registry/                    create device record
GET    /api/device-registry/<id>                get one
PATCH  /api/device-registry/<id>                update
DELETE /api/device-registry/<id>                soft-delete

POST   /api/device-registry/<id>/status         advance / change status
POST   /api/device-registry/verify-barcode      validate barcode or serial number

GET    /api/device-registry/<id>/commissioning          list commissioning tests
POST   /api/device-registry/<id>/commissioning          create commissioning test
PATCH  /api/device-registry/<id>/commissioning/<test_id> update test outcome

NOTE: Does NOT touch /api/meter, /api/gateway, /api/switch, /api/repeater.
      Those routes and tables remain unchanged (Angular depends on them).
"""

from flask import Blueprint, request
from flask_login import login_required, current_user

from app.db import get_session
from app.models.device_registry import DeviceRegistry, DEVICE_TYPES, DEVICE_STATUSES
from app.models.commissioning_test import CommissioningTest, COMMISSIONING_OUTCOMES
from app.services.audit import audit
from app.helpers.time_utils import now_ms as _now
from app.helpers.roles import (
    WRITE_ROLES, ENGINEERING_ROLES, DEPLOYMENT_ROLES, ADMIN_ROLES, require_roles
)

device_reg_bp = Blueprint("device_registry", __name__, url_prefix="/api/device-registry")


def _dev_dict(d: DeviceRegistry) -> dict:
    return {
        "id":                 d.id,
        "org_id":             d.org_id,
        "site_id":            d.site_id,
        "asset_id":           d.asset_id,
        "device_type":        d.device_type,
        "name":               d.name,
        "serial_number":      d.serial_number,
        "barcode":            d.barcode,
        "manufacturer":       d.manufacturer,
        "model_number":       d.model_number,
        "firmware_version":   d.firmware_version,
        "status":             d.status,
        "status_changed_at":  d.status_changed_at,
        "status_changed_by":  d.status_changed_by,
        "assigned_to_project":d.assigned_to_project,
        "install_date":       d.install_date,
        "legacy_meter_id":    d.legacy_meter_id,
        "legacy_gateway_id":  d.legacy_gateway_id,
        "legacy_switch_id":   d.legacy_switch_id,
        "legacy_repeater_id": d.legacy_repeater_id,
        "notes":              d.notes,
        "createdAt":          d.createdAt,
        "updatedAt":          d.updatedAt,
    }


def _test_dict(t: CommissioningTest) -> dict:
    return {
        "id":                       t.id,
        "device_id":                t.device_id,
        "site_id":                  t.site_id,
        "performed_by":             t.performed_by,
        "reviewed_by":              t.reviewed_by,
        "apf_model":                t.apf_model,
        "apf_serial":               t.apf_serial,
        "ct_amp_rating":            t.ct_amp_rating,
        "ct_ratio":                 t.ct_ratio,
        "ct_orientation":           t.ct_orientation,
        "phase_rotation_verified":  t.phase_rotation_verified,
        "voltage_verified":         t.voltage_verified,
        "current_verified":         t.current_verified,
        "communication_verified":   t.communication_verified,
        "data_verified":            t.data_verified,
        "outcome":                  t.outcome,
        "failure_reason":           t.failure_reason,
        "notes":                    t.notes,
        "performed_at":             t.performed_at,
        "createdAt":                t.createdAt,
        "updatedAt":                t.updatedAt,
    }


def _scoped_q(sess):
    q = sess.query(DeviceRegistry).filter_by(is_deleted=False)
    role = getattr(current_user, "role", 0)
    if role == 8:
        return q
    org = getattr(current_user, "org_id", None)
    if org:
        return q.filter(DeviceRegistry.org_id == org)
    return q.filter(DeviceRegistry.id == -1)


# ─── CRUD ────────────────────────────────────────────────────────────────────

@device_reg_bp.route("/", methods=["GET"])
@login_required
def list_devices():
    sess = get_session()
    q    = _scoped_q(sess)
    site_id = request.args.get("site_id", type=int)
    if site_id:
        q = q.filter(DeviceRegistry.site_id == site_id)
    dtype = request.args.get("device_type")
    if dtype:
        q = q.filter(DeviceRegistry.device_type == dtype)
    status = request.args.get("status")
    if status:
        q = q.filter(DeviceRegistry.status == status)
    rows = q.order_by(DeviceRegistry.device_type, DeviceRegistry.name).all()
    return {"data": [_dev_dict(r) for r in rows]}


@device_reg_bp.route("/", methods=["POST"])
@login_required
@require_roles(WRITE_ROLES)
def create_device():
    body = request.get_json(force=True, silent=True) or {}
    if not body.get("device_type"):
        return {"error": "device_type required"}, 400
    if body["device_type"] not in DEVICE_TYPES:
        return {"error": f"device_type must be one of {DEVICE_TYPES}"}, 400

    sess = get_session()
    now  = _now()
    dev  = DeviceRegistry(
        org_id              = body.get("org_id") or getattr(current_user, "org_id", None),
        site_id             = body.get("site_id"),
        asset_id            = body.get("asset_id"),
        device_type         = body["device_type"],
        name                = body.get("name"),
        serial_number       = body.get("serial_number"),
        barcode             = body.get("barcode") or body.get("serial_number"),
        manufacturer        = body.get("manufacturer"),
        model_number        = body.get("model_number"),
        firmware_version    = body.get("firmware_version"),
        status              = body.get("status", "planned"),
        assigned_to_project = body.get("assigned_to_project"),
        install_date        = body.get("install_date"),
        legacy_meter_id     = body.get("legacy_meter_id"),
        legacy_gateway_id   = body.get("legacy_gateway_id"),
        legacy_switch_id    = body.get("legacy_switch_id"),
        legacy_repeater_id  = body.get("legacy_repeater_id"),
        notes               = body.get("notes"),
        createdAt           = now,
        updatedAt           = now,
    )
    if dev.status not in DEVICE_STATUSES:
        return {"error": f"status must be one of {DEVICE_STATUSES}"}, 400

    sess.add(dev)
    sess.commit()
    audit("device.created", user_id=current_user.id, entity_type="device_registry",
          entity_id=dev.id, detail={"device_type": dev.device_type, "serial": dev.serial_number})
    return {"data": _dev_dict(dev)}, 201


@device_reg_bp.route("/<int:dev_id>", methods=["GET"])
@login_required
def get_device(dev_id: int):
    sess = get_session()
    dev  = _scoped_q(sess).filter(DeviceRegistry.id == dev_id).first()
    if not dev:
        return {"error": "Not found"}, 404
    return {"data": _dev_dict(dev)}


@device_reg_bp.route("/<int:dev_id>", methods=["PATCH"])
@login_required
@require_roles(WRITE_ROLES)
def update_device(dev_id: int):
    sess = get_session()
    dev  = _scoped_q(sess).filter(DeviceRegistry.id == dev_id).first()
    if not dev:
        return {"error": "Not found"}, 404

    body = request.get_json(force=True, silent=True) or {}
    _EDITABLE = ("name", "serial_number", "barcode", "manufacturer", "model_number",
                 "firmware_version", "install_date", "notes", "site_id", "asset_id",
                 "assigned_to_project")
    for k in _EDITABLE:
        if k in body:
            setattr(dev, k, body[k])
    dev.updatedAt = _now()
    sess.commit()
    audit("device.updated", user_id=current_user.id, entity_type="device_registry", entity_id=dev_id)
    return {"data": _dev_dict(dev)}


@device_reg_bp.route("/<int:dev_id>", methods=["DELETE"])
@login_required
@require_roles(ADMIN_ROLES)
def delete_device(dev_id: int):
    sess = get_session()
    dev  = _scoped_q(sess).filter(DeviceRegistry.id == dev_id).first()
    if not dev:
        return {"error": "Not found"}, 404
    dev.is_deleted = True
    dev.updatedAt  = _now()
    sess.commit()
    audit("device.deleted", user_id=current_user.id, entity_type="device_registry", entity_id=dev_id)
    return {"data": {"id": dev_id, "is_deleted": True}}


# ─── Status lifecycle ─────────────────────────────────────────────────────────

# Valid forward transitions
_TRANSITIONS = {
    "planned":      ("assigned",),
    "assigned":     ("installed", "planned"),
    "installed":    ("commissioned", "assigned"),
    "commissioned": ("active", "installed"),
    "active":       ("warning", "fault", "retired"),
    "warning":      ("active", "fault", "retired"),
    "fault":        ("active", "retired"),
    "retired":      (),
}


@device_reg_bp.route("/<int:dev_id>/status", methods=["POST"])
@login_required
@require_roles(DEPLOYMENT_ROLES)
def change_status(dev_id: int):
    sess = get_session()
    dev  = _scoped_q(sess).filter(DeviceRegistry.id == dev_id).first()
    if not dev:
        return {"error": "Not found"}, 404

    body       = request.get_json(force=True, silent=True) or {}
    new_status = body.get("status", "")
    if new_status not in DEVICE_STATUSES:
        return {"error": f"status must be one of {DEVICE_STATUSES}"}, 400

    allowed = _TRANSITIONS.get(dev.status, ())
    if new_status not in allowed:
        return {"error": f"Cannot transition from '{dev.status}' to '{new_status}'. "
                         f"Allowed: {allowed}"}, 400

    now = _now()
    dev.status            = new_status
    dev.status_changed_at = now
    dev.status_changed_by = current_user.id
    dev.updatedAt         = now
    sess.commit()
    audit(f"device.status.{new_status}", user_id=current_user.id,
          entity_type="device_registry", entity_id=dev_id,
          detail={"previous_status": dev.status, "new_status": new_status})
    return {"data": _dev_dict(dev)}


# ─── Barcode / serial verification ───────────────────────────────────────────

@device_reg_bp.route("/verify-barcode", methods=["POST"])
@login_required
def verify_barcode():
    """
    Validate a scanned barcode or serial number.

    Request body:
      { "barcode": "SN-12345", "site_id": 7 }   (site_id optional)

    Returns:
      { "found": true, "device": {...}, "valid_for_site": true/false }
    or
      { "found": false }

    Used by the Installer mobile workflow to verify a device before marking
    it as installed. Checks barcode AND serial_number columns.
    """
    body    = request.get_json(force=True, silent=True) or {}
    code    = (body.get("barcode") or body.get("serial_number") or "").strip()
    site_id = body.get("site_id")

    if not code:
        return {"error": "barcode or serial_number required"}, 400

    sess = get_session()
    dev  = (sess.query(DeviceRegistry)
            .filter(
                DeviceRegistry.is_deleted == False,
                (DeviceRegistry.barcode == code) | (DeviceRegistry.serial_number == code)
            )
            .first())

    if not dev:
        audit("device.barcode_scan_not_found", user_id=current_user.id,
              detail={"barcode": code})
        return {"found": False, "barcode": code}

    valid_for_site = True
    if site_id and dev.site_id and dev.site_id != site_id:
        valid_for_site = False

    audit("device.barcode_scan", user_id=current_user.id,
          entity_type="device_registry", entity_id=dev.id,
          detail={"barcode": code, "valid_for_site": valid_for_site})

    return {
        "found":         True,
        "valid_for_site": valid_for_site,
        "device":        _dev_dict(dev),
    }


# ─── Server-side barcode image decode ────────────────────────────────────────

@device_reg_bp.route("/scan-barcode", methods=["POST"])
@login_required
def scan_barcode_image():
    """
    POST /api/device-registry/scan-barcode

    Accepts multipart/form-data with field ``image`` (JPEG/PNG/WEBP).
    Decodes barcodes and QR codes server-side using pyzbar + Pillow.

    Falls back gracefully when libzbar0 / pyzbar are not installed in the
    container — returns a clear 503 instead of a 500 so Angular can display
    a helpful message and suggest manual entry.

    Response (success):
      { "barcode": "SN-12345", "format": "CODE_128", "found": true }
    Response (not found):
      { "found": false }
    Response (library unavailable):
      { "error": "...", "code": "PYZBAR_UNAVAILABLE" }  HTTP 503
    """
    try:
        from pyzbar.pyzbar import decode as pyzbar_decode
        from PIL import Image
    except ImportError:
        return {
            "error": (
                "Server-side barcode decoding is not available on this host. "
                "Please use live camera scan or manual entry."
            ),
            "code": "PYZBAR_UNAVAILABLE",
        }, 503

    if "image" not in request.files:
        return {"error": "image file required"}, 400

    img_file = request.files["image"]
    _ALLOWED = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if img_file.mimetype and img_file.mimetype.lower() not in _ALLOWED:
        return {"error": "unsupported image type"}, 415

    try:
        img = Image.open(img_file.stream).convert("RGB")
    except Exception as e:
        return {"error": f"Could not read image: {e}"}, 400

    try:
        decoded = pyzbar_decode(img)
    except Exception as e:
        return {"error": f"Decode error: {e}"}, 500

    if not decoded:
        audit("device.scan_barcode_not_found", user_id=current_user.id)
        return {"found": False}

    best = decoded[0]
    barcode_value = best.data.decode("utf-8", errors="replace").strip()
    barcode_format = best.type  # e.g. "QRCODE", "CODE128"

    audit("device.scan_barcode_image", user_id=current_user.id,
          detail={"barcode": barcode_value, "format": barcode_format})

    return {
        "found":   True,
        "barcode": barcode_value,
        "format":  barcode_format,
    }


# ─── Commissioning tests ──────────────────────────────────────────────────────

@device_reg_bp.route("/<int:dev_id>/commissioning", methods=["GET"])
@login_required
def list_commissioning(dev_id: int):
    sess = get_session()
    if not _scoped_q(sess).filter(DeviceRegistry.id == dev_id).first():
        return {"error": "Not found"}, 404
    tests = (sess.query(CommissioningTest)
             .filter_by(device_id=dev_id)
             .order_by(CommissioningTest.createdAt.desc())
             .all())
    return {"data": [_test_dict(t) for t in tests]}


@device_reg_bp.route("/<int:dev_id>/commissioning", methods=["POST"])
@login_required
@require_roles(DEPLOYMENT_ROLES)
def create_commissioning(dev_id: int):
    sess = get_session()
    dev  = _scoped_q(sess).filter(DeviceRegistry.id == dev_id).first()
    if not dev:
        return {"error": "Not found"}, 404

    body = request.get_json(force=True, silent=True) or {}
    now  = _now()

    ct_orientation = body.get("ct_orientation")
    if isinstance(ct_orientation, str):
        ct_orientation = ct_orientation.lower() in ("yes", "true", "1")

    phase_ok = body.get("phase_rotation_verified")
    if isinstance(phase_ok, str):
        phase_ok = phase_ok.lower() in ("yes", "true", "1")

    # Auto-fail if CT orientation is wrong
    outcome = "pending"
    failure_reason = None
    if ct_orientation is False:
        outcome = "fail"
        failure_reason = "CT orientation incorrect — commissioning failed per spec"

    test = CommissioningTest(
        device_id               = dev_id,
        site_id                 = dev.site_id,
        performed_by            = current_user.id,
        apf_model               = body.get("apf_model"),
        apf_serial              = body.get("apf_serial"),
        ct_amp_rating           = body.get("ct_amp_rating"),
        ct_ratio                = body.get("ct_ratio"),
        ct_orientation          = ct_orientation,
        phase_rotation_verified = phase_ok,
        voltage_verified        = body.get("voltage_verified"),
        current_verified        = body.get("current_verified"),
        communication_verified  = body.get("communication_verified"),
        data_verified           = body.get("data_verified"),
        outcome                 = body.get("outcome", outcome),
        failure_reason          = body.get("failure_reason", failure_reason),
        notes                   = body.get("notes"),
        performed_at            = body.get("performed_at", now),
        createdAt               = now,
        updatedAt               = now,
    )
    sess.add(test)

    # If all checks pass, auto-advance device to commissioned
    all_pass = all([
        ct_orientation,
        phase_ok,
        body.get("voltage_verified"),
        body.get("current_verified"),
        body.get("communication_verified"),
        body.get("data_verified"),
    ])
    if all_pass and test.outcome != "fail":
        test.outcome = "pass"
        if dev.status in ("installed",):
            dev.status            = "commissioned"
            dev.status_changed_at = now
            dev.status_changed_by = current_user.id
            dev.updatedAt         = now

    sess.commit()
    audit("device.commissioned", user_id=current_user.id,
          entity_type="device_registry", entity_id=dev_id,
          detail={"outcome": test.outcome})
    return {"data": _test_dict(test)}, 201


@device_reg_bp.route("/<int:dev_id>/commissioning/<int:test_id>", methods=["PATCH"])
@login_required
@require_roles(ENGINEERING_ROLES)
def update_commissioning(dev_id: int, test_id: int):
    sess = get_session()
    test = sess.query(CommissioningTest).filter_by(id=test_id, device_id=dev_id).first()
    if not test:
        return {"error": "Not found"}, 404

    body = request.get_json(force=True, silent=True) or {}
    _EDITABLE = ("outcome", "failure_reason", "notes", "reviewed_by",
                 "voltage_verified", "current_verified",
                 "communication_verified", "data_verified")
    for k in _EDITABLE:
        if k in body:
            setattr(test, k, body[k])
    test.updatedAt = _now()
    sess.commit()
    return {"data": _test_dict(test)}
