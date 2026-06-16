"""
Asset management routes — Phase 2.

GET    /api/asset/?site_id=<id>         list assets for a site
POST   /api/asset/                      create asset
GET    /api/asset/<id>                  get one
PATCH  /api/asset/<id>                  update
DELETE /api/asset/<id>                  soft-delete

GET    /api/asset/<id>/relationships    get edges (parent + child)
POST   /api/asset/relationship          add relationship edge
DELETE /api/asset/relationship/<rel_id> remove edge
"""
from time import time

from flask import Blueprint, request
from flask_login import login_required, current_user

from app.db import get_session
from app.models.asset import Asset, ASSET_TYPES, ASSET_STATUSES
from app.models.asset_relationship import AssetRelationship, RELATIONSHIP_TYPES
from app.models.site import Site
from app.services.audit import audit

asset_bp = Blueprint("asset", __name__, url_prefix="/api/asset")


def _now():
    return int(time() * 1000)


def _asset_dict(a: Asset) -> dict:
    return {
        "id":               a.id,
        "site_id":          a.site_id,
        "org_id":           a.org_id,
        "digital_twin_id":  a.digital_twin_id,
        "asset_type":       a.asset_type,
        "name":             a.name,
        "asset_uid":        a.asset_uid,
        "manufacturer":     a.manufacturer,
        "model_number":     a.model_number,
        "serial_number":    a.serial_number,
        "install_date":     a.install_date,
        "kva_rating":       a.kva_rating,
        "voltage_primary":  a.voltage_primary,
        "voltage_secondary":a.voltage_secondary,
        "amp_rating":       a.amp_rating,
        "phases":           a.phases,
        "bus_id":           a.bus_id,
        "drawing_ref":      a.drawing_ref,
        "meter_id":         a.meter_id,
        "status":           a.status,
        "notes":            a.notes,
        "extra":            a.extra,
        "createdAt":        a.createdAt,
        "updatedAt":        a.updatedAt,
    }


def _rel_dict(r: AssetRelationship) -> dict:
    return {
        "id":                r.id,
        "digital_twin_id":   r.digital_twin_id,
        "parent_asset_id":   r.parent_asset_id,
        "child_asset_id":    r.child_asset_id,
        "relationship_type": r.relationship_type,
        "notes":             r.notes,
        "createdAt":         r.createdAt,
    }


def _can_access_site(sess, site_id: int) -> bool:
    site = sess.query(Site).filter_by(id=site_id, is_deleted=False).first()
    if not site:
        return False
    role = getattr(current_user, "role", 0)
    if role == 8:
        return True
    org = getattr(current_user, "org_id", None)
    if org and site.org_id == org:
        return True
    client = getattr(current_user, "client", None)
    if client and site.client_id == client:
        return True
    return False


@asset_bp.route("/", methods=["GET"])
@login_required
def list_assets():
    site_id = request.args.get("site_id", type=int)
    if not site_id:
        return {"error": "site_id query param required"}, 400
    sess = get_session()
    if not _can_access_site(sess, site_id):
        return {"error": "Forbidden or site not found"}, 403
    twin_id = request.args.get("digital_twin_id", type=int)
    q = sess.query(Asset).filter_by(site_id=site_id, is_deleted=False)
    if twin_id:
        q = q.filter_by(digital_twin_id=twin_id)
    rows = q.order_by(Asset.asset_type, Asset.name).all()
    return {"data": [_asset_dict(r) for r in rows]}


@asset_bp.route("/", methods=["POST"])
@login_required
def create_asset():
    body = request.get_json(force=True) or {}
    if not body.get("site_id"):
        return {"error": "site_id required"}, 400
    if not body.get("asset_type"):
        return {"error": "asset_type required"}, 400
    if body["asset_type"] not in ASSET_TYPES:
        return {"error": f"asset_type must be one of {ASSET_TYPES}"}, 400
    if not body.get("name"):
        return {"error": "name required"}, 400

    sess = get_session()
    if not _can_access_site(sess, body["site_id"]):
        return {"error": "Forbidden or site not found"}, 403

    now   = _now()
    asset = Asset(
        site_id          = body["site_id"],
        org_id           = body.get("org_id") or getattr(current_user, "org_id", None),
        digital_twin_id  = body.get("digital_twin_id"),
        asset_type       = body["asset_type"],
        name             = body["name"],
        asset_uid        = body.get("asset_uid"),
        manufacturer     = body.get("manufacturer"),
        model_number     = body.get("model_number"),
        serial_number    = body.get("serial_number"),
        install_date     = body.get("install_date"),
        kva_rating       = body.get("kva_rating"),
        voltage_primary  = body.get("voltage_primary"),
        voltage_secondary= body.get("voltage_secondary"),
        amp_rating       = body.get("amp_rating"),
        phases           = body.get("phases"),
        bus_id           = body.get("bus_id"),
        drawing_ref      = body.get("drawing_ref"),
        meter_id         = body.get("meter_id"),
        status           = body.get("status", "planned"),
        notes            = body.get("notes"),
        extra            = body.get("extra"),
        createdAt        = now,
        updatedAt        = now,
    )
    sess.add(asset)
    sess.commit()
    audit("asset.created", user_id=current_user.id, entity_type="asset", entity_id=asset.id,
          detail={"asset_type": asset.asset_type, "site_id": asset.site_id})
    return {"data": _asset_dict(asset)}, 201


@asset_bp.route("/<int:asset_id>", methods=["GET"])
@login_required
def get_asset(asset_id: int):
    sess = get_session()
    a = sess.query(Asset).filter_by(id=asset_id, is_deleted=False).first()
    if not a:
        return {"error": "Not found"}, 404
    if not _can_access_site(sess, a.site_id):
        return {"error": "Forbidden"}, 403
    return {"data": _asset_dict(a)}


@asset_bp.route("/<int:asset_id>", methods=["PATCH"])
@login_required
def update_asset(asset_id: int):
    sess = get_session()
    a = sess.query(Asset).filter_by(id=asset_id, is_deleted=False).first()
    if not a:
        return {"error": "Not found"}, 404
    if not _can_access_site(sess, a.site_id):
        return {"error": "Forbidden"}, 403

    body = request.get_json(force=True) or {}
    _EDITABLE = ("name", "asset_uid", "manufacturer", "model_number", "serial_number",
                 "install_date", "kva_rating", "voltage_primary", "voltage_secondary",
                 "amp_rating", "phases", "bus_id", "drawing_ref", "status", "notes",
                 "extra", "digital_twin_id", "meter_id")
    for k in _EDITABLE:
        if k in body:
            setattr(a, k, body[k])
    a.updatedAt = _now()
    sess.commit()
    audit("asset.updated", user_id=current_user.id, entity_type="asset", entity_id=asset_id)
    return {"data": _asset_dict(a)}


@asset_bp.route("/<int:asset_id>", methods=["DELETE"])
@login_required
def delete_asset(asset_id: int):
    sess = get_session()
    a = sess.query(Asset).filter_by(id=asset_id, is_deleted=False).first()
    if not a:
        return {"error": "Not found"}, 404
    if not _can_access_site(sess, a.site_id):
        return {"error": "Forbidden"}, 403
    a.is_deleted = True
    a.updatedAt  = _now()
    sess.commit()
    audit("asset.deleted", user_id=current_user.id, entity_type="asset", entity_id=asset_id)
    return {"data": {"id": asset_id, "is_deleted": True}}


# ─── Relationship edges ───────────────────────────────────────────────────────

@asset_bp.route("/<int:asset_id>/relationships", methods=["GET"])
@login_required
def get_relationships(asset_id: int):
    sess = get_session()
    a = sess.query(Asset).filter_by(id=asset_id, is_deleted=False).first()
    if not a:
        return {"error": "Not found"}, 404
    if not _can_access_site(sess, a.site_id):
        return {"error": "Forbidden"}, 403

    as_parent = sess.query(AssetRelationship).filter_by(parent_asset_id=asset_id).all()
    as_child  = sess.query(AssetRelationship).filter_by(child_asset_id=asset_id).all()
    return {
        "data": {
            "as_parent": [_rel_dict(r) for r in as_parent],
            "as_child":  [_rel_dict(r) for r in as_child],
        }
    }


@asset_bp.route("/relationship", methods=["POST"])
@login_required
def create_relationship():
    body = request.get_json(force=True) or {}
    required = ("digital_twin_id", "parent_asset_id", "child_asset_id", "relationship_type")
    missing  = [k for k in required if not body.get(k)]
    if missing:
        return {"error": f"Missing: {missing}"}, 400
    if body["relationship_type"] not in RELATIONSHIP_TYPES:
        return {"error": f"relationship_type must be one of {RELATIONSHIP_TYPES}"}, 400

    sess = get_session()
    now  = _now()
    rel  = AssetRelationship(
        digital_twin_id   = body["digital_twin_id"],
        parent_asset_id   = body["parent_asset_id"],
        child_asset_id    = body["child_asset_id"],
        relationship_type = body["relationship_type"],
        notes             = body.get("notes"),
        createdAt         = now,
        updatedAt         = now,
    )
    sess.add(rel)
    sess.commit()
    return {"data": _rel_dict(rel)}, 201


@asset_bp.route("/relationship/<int:rel_id>", methods=["DELETE"])
@login_required
def delete_relationship(rel_id: int):
    sess = get_session()
    rel = sess.query(AssetRelationship).filter_by(id=rel_id).first()
    if not rel:
        return {"error": "Not found"}, 404
    sess.delete(rel)
    sess.commit()
    return {"data": {"id": rel_id, "deleted": True}}
