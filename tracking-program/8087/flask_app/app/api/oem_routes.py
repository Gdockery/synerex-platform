"""
OEM management routes — Phase 1.

CRUD for the oem table.  Only Synerex Super Admin (role 8) can write;
OEM Admins (role 9) can read their own record.

Blueprints prefix: /api/oem
"""

from flask import Blueprint, request
from flask_login import login_required, current_user

from app.db import get_session
from app.models.oem import Oem
from app.services.audit import audit
from app.helpers.time_utils import now_ms as _now

oem_bp = Blueprint("oem", __name__, url_prefix="/api/oem")


def _require_super_admin():
    if not current_user.is_authenticated or getattr(current_user, "role", 0) != 8:
        return {"error": "Forbidden"}, 403
    return None


def _oem_dict(o: Oem) -> dict:
    return {
        "id":            o.id,
        "org_id":        o.org_id,
        "name":          o.name,
        "slug":          o.slug,
        "domain":        o.domain,
        "is_active":     o.is_active,
        "contact_email": o.contact_email,
        "notes":         o.notes,
        "createdAt":     o.createdAt,
        "updatedAt":     o.updatedAt,
    }


@oem_bp.route("/", methods=["GET"])
@login_required
def list_oems():
    """List all OEMs.  Super admin sees all; OEM admin sees their own."""
    sess = get_session()
    role = getattr(current_user, "role", 0)
    if role == 8:
        rows = sess.query(Oem).order_by(Oem.name).all()
    elif role == 9:
        org_id = getattr(current_user, "org_id", None)
        rows = sess.query(Oem).filter_by(org_id=org_id).all() if org_id else []
    else:
        return {"error": "Forbidden"}, 403
    return {"data": [_oem_dict(r) for r in rows]}


@oem_bp.route("/", methods=["POST"])
@login_required
def create_oem():
    """Create a new OEM record. Super admin only."""
    err = _require_super_admin()
    if err:
        return err
    body = request.get_json(force=True, silent=True) or {}
    if not body.get("org_id") or not body.get("name"):
        return {"error": "org_id and name are required"}, 400

    sess = get_session()
    if sess.query(Oem).filter_by(org_id=body["org_id"]).first():
        return {"error": f"org_id '{body['org_id']}' already exists"}, 409

    now = _now()
    oem = Oem(
        org_id        = body["org_id"],
        name          = body["name"],
        slug          = body.get("slug"),
        domain        = body.get("domain"),
        is_active     = body.get("is_active", True),
        contact_email = body.get("contact_email"),
        notes         = body.get("notes"),
        createdAt     = now,
        updatedAt     = now,
    )
    sess.add(oem)
    sess.commit()
    audit("oem.created", user_id=current_user.id, entity_type="oem", entity_id=oem.id,
          detail={"org_id": oem.org_id})
    return {"data": _oem_dict(oem)}, 201


@oem_bp.route("/<int:oem_id>", methods=["GET"])
@login_required
def get_oem(oem_id: int):
    sess = get_session()
    oem = sess.query(Oem).filter_by(id=oem_id).first()
    if not oem:
        return {"error": "Not found"}, 404
    role = getattr(current_user, "role", 0)
    if role == 8:
        pass  # super admin sees all
    elif role == 9 and oem.org_id == getattr(current_user, "org_id", None):
        pass  # OEM admin sees their own
    else:
        return {"error": "Forbidden"}, 403
    return {"data": _oem_dict(oem)}


@oem_bp.route("/<int:oem_id>", methods=["PATCH"])
@login_required
def update_oem(oem_id: int):
    err = _require_super_admin()
    if err:
        return err
    sess = get_session()
    oem = sess.query(Oem).filter_by(id=oem_id).first()
    if not oem:
        return {"error": "Not found"}, 404

    body = request.get_json(force=True, silent=True) or {}
    _EDITABLE = ("name", "slug", "domain", "is_active", "contact_email", "notes")
    for k in _EDITABLE:
        if k in body:
            setattr(oem, k, body[k])
    oem.updatedAt = _now()
    sess.commit()
    audit("oem.updated", user_id=current_user.id, entity_type="oem", entity_id=oem.id)
    return {"data": _oem_dict(oem)}


@oem_bp.route("/<int:oem_id>", methods=["DELETE"])
@login_required
def delete_oem(oem_id: int):
    """Soft-delete via is_active=False. Super admin only."""
    err = _require_super_admin()
    if err:
        return err
    sess = get_session()
    oem = sess.query(Oem).filter_by(id=oem_id).first()
    if not oem:
        return {"error": "Not found"}, 404
    oem.is_active = False
    oem.updatedAt = _now()
    sess.commit()
    audit("oem.deactivated", user_id=current_user.id, entity_type="oem", entity_id=oem_id)
    return {"data": {"id": oem_id, "is_active": False}}
