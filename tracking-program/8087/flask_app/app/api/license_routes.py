"""
Meter license management routes — Phase 1.

[COMPAT] Analytics are not yet gated by license state.
         The state column is populated but enforcement is a Phase 13 item.

Endpoints:
  GET  /api/meter-license/          list all (super admin) or org's (OEM admin)
  GET  /api/meter-license/<id>      get one
  POST /api/meter-license/          create (super admin / OEM admin)
  PATCH /api/meter-license/<id>     update state / notes (super admin / OEM admin)
  POST /api/meter-license/<id>/activate    → state=active, activated_at=now
  POST /api/meter-license/<id>/suspend     → state=suspended, suspended_at=now
  POST /api/meter-license/<id>/reactivate  → state=active
"""
from time import time

from flask import Blueprint, request
from flask_login import login_required, current_user

from app.db import get_session
from app.models.meter_license import MeterLicense, LICENSE_STATES
from app.services.audit import audit

license_bp = Blueprint("meter_license", __name__, url_prefix="/api/meter-license")


def _now():
    return int(time() * 1000)


def _require_admin():
    """Allow super admin (8) or OEM admin (9).  Returns error tuple or None."""
    role = getattr(current_user, "role", 0)
    if role not in (8, 9):
        return {"error": "Forbidden"}, 403
    return None


def _lic_dict(l: MeterLicense) -> dict:
    return {
        "id":           l.id,
        "meter_id":     l.meter_id,
        "oem_org_id":   l.oem_org_id,
        "state":        l.state,
        "activated_at": l.activated_at,
        "expires_at":   l.expires_at,
        "grace_ends_at":l.grace_ends_at,
        "suspended_at": l.suspended_at,
        "suspended_by": l.suspended_by,
        "notes":        l.notes,
        "createdAt":    l.createdAt,
        "updatedAt":    l.updatedAt,
    }


@license_bp.route("/", methods=["GET"])
@login_required
def list_licenses():
    err = _require_admin()
    if err:
        return err
    sess = get_session()
    role   = getattr(current_user, "role", 0)
    org_id = getattr(current_user, "org_id", None)
    q = sess.query(MeterLicense)
    if role == 9 and org_id:
        q = q.filter_by(oem_org_id=org_id)
    rows = q.order_by(MeterLicense.id.desc()).all()
    return {"data": [_lic_dict(r) for r in rows]}


@license_bp.route("/", methods=["POST"])
@login_required
def create_license():
    err = _require_admin()
    if err:
        return err
    body = request.get_json(force=True) or {}
    if not body.get("meter_id"):
        return {"error": "meter_id required"}, 400

    sess = get_session()
    existing = sess.query(MeterLicense).filter_by(meter_id=body["meter_id"]).first()
    if existing:
        return {"error": "A license already exists for this meter", "id": existing.id}, 409

    now  = _now()
    role = getattr(current_user, "role", 0)
    lic  = MeterLicense(
        meter_id    = body["meter_id"],
        oem_org_id  = body.get("oem_org_id") or (getattr(current_user, "org_id", None) if role == 9 else None),
        state       = body.get("state", "pending"),
        expires_at  = body.get("expires_at"),
        notes       = body.get("notes"),
        createdAt   = now,
        updatedAt   = now,
    )
    if lic.state not in LICENSE_STATES:
        return {"error": f"state must be one of {LICENSE_STATES}"}, 400

    sess.add(lic)
    sess.commit()
    audit("license.created", user_id=current_user.id, entity_type="meter_license",
          entity_id=lic.id, detail={"meter_id": lic.meter_id, "state": lic.state})
    return {"data": _lic_dict(lic)}, 201


@license_bp.route("/<int:lic_id>", methods=["GET"])
@login_required
def get_license(lic_id: int):
    err = _require_admin()
    if err:
        return err
    sess = get_session()
    lic = sess.query(MeterLicense).filter_by(id=lic_id).first()
    if not lic:
        return {"error": "Not found"}, 404
    if getattr(current_user, "role", 0) == 9:
        org_id = getattr(current_user, "org_id", None)
        if lic.oem_org_id != org_id:
            return {"error": "Forbidden"}, 403
    return {"data": _lic_dict(lic)}


@license_bp.route("/<int:lic_id>", methods=["PATCH"])
@login_required
def update_license(lic_id: int):
    err = _require_admin()
    if err:
        return err
    sess = get_session()
    lic = sess.query(MeterLicense).filter_by(id=lic_id).first()
    if not lic:
        return {"error": "Not found"}, 404

    body = request.get_json(force=True) or {}
    if "state" in body:
        if body["state"] not in LICENSE_STATES:
            return {"error": f"state must be one of {LICENSE_STATES}"}, 400
        lic.state = body["state"]
    if "expires_at"   in body: lic.expires_at   = body["expires_at"]
    if "grace_ends_at" in body: lic.grace_ends_at = body["grace_ends_at"]
    if "notes"        in body: lic.notes        = body["notes"]
    lic.updatedAt = _now()
    sess.commit()
    audit("license.updated", user_id=current_user.id, entity_type="meter_license",
          entity_id=lic_id, detail={"state": lic.state})
    return {"data": _lic_dict(lic)}


@license_bp.route("/<int:lic_id>/activate", methods=["POST"])
@login_required
def activate_license(lic_id: int):
    err = _require_admin()
    if err:
        return err
    sess = get_session()
    lic = sess.query(MeterLicense).filter_by(id=lic_id).first()
    if not lic:
        return {"error": "Not found"}, 404

    body = request.get_json(force=True) or {}
    now  = _now()
    lic.state        = "active"
    lic.activated_at = now
    if body.get("expires_at"):
        lic.expires_at = body["expires_at"]
    lic.suspended_at = None
    lic.suspended_by = None
    lic.updatedAt    = now
    sess.commit()
    audit("license.activated", user_id=current_user.id, entity_type="meter_license",
          entity_id=lic_id, detail={"meter_id": lic.meter_id})
    return {"data": _lic_dict(lic)}


@license_bp.route("/<int:lic_id>/suspend", methods=["POST"])
@login_required
def suspend_license(lic_id: int):
    err = _require_admin()
    if err:
        return err
    sess = get_session()
    lic = sess.query(MeterLicense).filter_by(id=lic_id).first()
    if not lic:
        return {"error": "Not found"}, 404

    now  = _now()
    body = request.get_json(force=True) or {}
    lic.state        = "suspended"
    lic.suspended_at = now
    lic.suspended_by = current_user.id
    if body.get("notes"):
        lic.notes    = body["notes"]
    lic.updatedAt    = now
    sess.commit()
    audit("license.suspended", user_id=current_user.id, entity_type="meter_license",
          entity_id=lic_id, detail={"meter_id": lic.meter_id, "notes": lic.notes})
    return {"data": _lic_dict(lic)}


@license_bp.route("/<int:lic_id>/reactivate", methods=["POST"])
@login_required
def reactivate_license(lic_id: int):
    err = _require_admin()
    if err:
        return err
    sess = get_session()
    lic = sess.query(MeterLicense).filter_by(id=lic_id).first()
    if not lic:
        return {"error": "Not found"}, 404

    now  = _now()
    lic.state        = "active"
    lic.suspended_at = None
    lic.suspended_by = None
    lic.updatedAt    = now
    sess.commit()
    audit("license.reactivated", user_id=current_user.id, entity_type="meter_license",
          entity_id=lic_id, detail={"meter_id": lic.meter_id})
    return {"data": _lic_dict(lic)}
