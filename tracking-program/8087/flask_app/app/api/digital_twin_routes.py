"""
Digital Twin routes — Phase 2.

GET    /api/digital-twin/?site_id=<id>      list twins for a site
POST   /api/digital-twin/                   create twin (status=draft)
GET    /api/digital-twin/<id>               get twin + latest snapshot
PATCH  /api/digital-twin/<id>               update metadata / status
DELETE /api/digital-twin/<id>               soft-delete (draft only)

POST   /api/digital-twin/<id>/save-version  save current asset graph as a new version
GET    /api/digital-twin/<id>/versions      list version history
GET    /api/digital-twin/<id>/versions/<v>  get specific version snapshot

POST   /api/digital-twin/<id>/submit        → engineering_review
POST   /api/digital-twin/<id>/approve       → approved  (Engineering role)
POST   /api/digital-twin/<id>/reject        → needs_revision
POST   /api/digital-twin/<id>/lock          → locked    (after activation)

POST   /api/digital-twin/from-project/<project_id>
    Seed a Draft twin from a project's topoMeters JSONB. Creates the site if
    needed, then materialises meter → switchgear → bus assets and 'feeds'
    relationships. Idempotent: returns existing twin_id if already seeded.
"""
from time import time

from flask import Blueprint, request
from flask_login import login_required, current_user

from app.db import get_session
from app.models.digital_twin import DigitalTwin, DigitalTwinVersion, TWIN_STATUSES
from app.models.asset import Asset
from app.models.asset_relationship import AssetRelationship
from app.models.site import Site
from app.services.audit import audit

dt_bp = Blueprint("digital_twin", __name__, url_prefix="/api/digital-twin")

# Roles allowed to move a twin to approved/locked
_ENGINEERING_ROLES = {3, 8, 9}


def _now():
    return int(time() * 1000)


def _twin_dict(t: DigitalTwin) -> dict:
    return {
        "id":             t.id,
        "site_id":        t.site_id,
        "org_id":         t.org_id,
        "project_id":     t.project_id,
        "status":         t.status,
        "version_number": t.version_number,
        "label":          t.label,
        "source":         t.source,
        "notes":          t.notes,
        "review_notes":   t.review_notes,
        "submitted_by":   t.submitted_by,
        "reviewed_by":    t.reviewed_by,
        "approved_by":    t.approved_by,
        "submitted_at":   t.submitted_at,
        "reviewed_at":    t.reviewed_at,
        "approved_at":    t.approved_at,
        "createdAt":      t.createdAt,
        "updatedAt":      t.updatedAt,
    }


def _version_dict(v: DigitalTwinVersion) -> dict:
    return {
        "id":              v.id,
        "digital_twin_id": v.digital_twin_id,
        "version_number":  v.version_number,
        "saved_by":        v.saved_by,
        "label":           v.label,
        "change_summary":  v.change_summary,
        "createdAt":       v.createdAt,
        # snapshot omitted in list; included only in single-version fetch
    }


def _build_snapshot(sess, twin_id: int) -> dict:
    assets = sess.query(Asset).filter_by(digital_twin_id=twin_id, is_deleted=False).all()
    rels   = sess.query(AssetRelationship).filter_by(digital_twin_id=twin_id).all()
    return {
        "assets": [
            {k: getattr(a, k) for k in
             ("id", "asset_type", "name", "asset_uid", "kva_rating",
              "voltage_primary", "voltage_secondary", "amp_rating",
              "bus_id", "drawing_ref", "meter_id", "status")}
            for a in assets
        ],
        "relationships": [
            {"id": r.id, "parent_asset_id": r.parent_asset_id,
             "child_asset_id": r.child_asset_id,
             "relationship_type": r.relationship_type}
            for r in rels
        ],
    }


@dt_bp.route("/", methods=["GET"])
@login_required
def list_twins():
    site_id = request.args.get("site_id", type=int)
    if not site_id:
        return {"error": "site_id query param required"}, 400
    sess = get_session()
    q = sess.query(DigitalTwin).filter_by(site_id=site_id, is_deleted=False)
    rows = q.order_by(DigitalTwin.version_number.desc()).all()
    return {"data": [_twin_dict(t) for t in rows]}


@dt_bp.route("/", methods=["POST"])
@login_required
def create_twin():
    body = request.get_json(force=True, silent=True) or {}
    if not body.get("site_id"):
        return {"error": "site_id required"}, 400

    sess = get_session()
    now  = _now()
    twin = DigitalTwin(
        site_id        = body["site_id"],
        org_id         = body.get("org_id") or getattr(current_user, "org_id", None),
        project_id     = body.get("project_id"),
        status         = "draft",
        version_number = 1,
        label          = body.get("label"),
        source         = body.get("source", "manual"),
        notes          = body.get("notes"),
        createdAt      = now,
        updatedAt      = now,
    )
    sess.add(twin)
    sess.commit()
    audit("digital_twin.created", user_id=current_user.id, entity_type="digital_twin",
          entity_id=twin.id, detail={"site_id": twin.site_id})
    return {"data": _twin_dict(twin)}, 201


@dt_bp.route("/<int:twin_id>", methods=["GET"])
@login_required
def get_twin(twin_id: int):
    sess = get_session()
    twin = sess.query(DigitalTwin).filter_by(id=twin_id, is_deleted=False).first()
    if not twin:
        return {"error": "Not found"}, 404
    d = _twin_dict(twin)
    d["snapshot"] = _build_snapshot(sess, twin_id)
    return {"data": d}


@dt_bp.route("/<int:twin_id>", methods=["PATCH"])
@login_required
def update_twin(twin_id: int):
    sess = get_session()
    twin = sess.query(DigitalTwin).filter_by(id=twin_id, is_deleted=False).first()
    if not twin:
        return {"error": "Not found"}, 404
    body = request.get_json(force=True, silent=True) or {}
    for k in ("label", "notes", "source"):
        if k in body:
            setattr(twin, k, body[k])
    twin.updatedAt = _now()
    sess.commit()
    return {"data": _twin_dict(twin)}


@dt_bp.route("/<int:twin_id>", methods=["DELETE"])
@login_required
def delete_twin(twin_id: int):
    sess = get_session()
    twin = sess.query(DigitalTwin).filter_by(id=twin_id, is_deleted=False).first()
    if not twin:
        return {"error": "Not found"}, 404
    if twin.status not in ("draft", "needs_revision"):
        return {"error": "Only draft or needs_revision twins can be deleted"}, 400
    twin.is_deleted = True
    twin.updatedAt  = _now()
    sess.commit()
    return {"data": {"id": twin_id, "is_deleted": True}}


# ─── Version management ───────────────────────────────────────────────────────

@dt_bp.route("/<int:twin_id>/save-version", methods=["POST"])
@login_required
def save_version(twin_id: int):
    sess = get_session()
    twin = sess.query(DigitalTwin).filter_by(id=twin_id, is_deleted=False).first()
    if not twin:
        return {"error": "Not found"}, 404
    if twin.status == "locked":
        return {"error": "Locked twins cannot be modified"}, 400

    body = request.get_json(force=True, silent=True) or {}
    snap = _build_snapshot(sess, twin_id)
    now  = _now()

    # Increment version counter
    twin.version_number += 1
    twin.updatedAt       = now

    ver = DigitalTwinVersion(
        digital_twin_id = twin_id,
        version_number  = twin.version_number,
        saved_by        = current_user.id,
        label           = body.get("label"),
        snapshot        = snap,
        change_summary  = body.get("change_summary"),
        createdAt       = now,
        updatedAt       = now,
    )
    sess.add(ver)
    sess.commit()
    audit("digital_twin.version_saved", user_id=current_user.id,
          entity_type="digital_twin", entity_id=twin_id,
          detail={"version": ver.version_number})
    d = _version_dict(ver)
    d["snapshot"] = snap
    return {"data": d}, 201


@dt_bp.route("/<int:twin_id>/versions", methods=["GET"])
@login_required
def list_versions(twin_id: int):
    sess = get_session()
    if not sess.query(DigitalTwin).filter_by(id=twin_id, is_deleted=False).first():
        return {"error": "Not found"}, 404
    vers = (sess.query(DigitalTwinVersion)
            .filter_by(digital_twin_id=twin_id)
            .order_by(DigitalTwinVersion.version_number.desc())
            .all())
    return {"data": [_version_dict(v) for v in vers]}


@dt_bp.route("/<int:twin_id>/versions/<int:ver_no>", methods=["GET"])
@login_required
def get_version(twin_id: int, ver_no: int):
    sess = get_session()
    ver = sess.query(DigitalTwinVersion).filter_by(
        digital_twin_id=twin_id, version_number=ver_no).first()
    if not ver:
        return {"error": "Not found"}, 404
    d = _version_dict(ver)
    d["snapshot"] = ver.snapshot
    return {"data": d}


# ─── Workflow actions ─────────────────────────────────────────────────────────

def _transition(twin_id: int, new_status: str, extra_fields: dict = None):
    sess = get_session()
    twin = sess.query(DigitalTwin).filter_by(id=twin_id, is_deleted=False).first()
    if not twin:
        return {"error": "Not found"}, 404
    twin.status    = new_status
    twin.updatedAt = _now()
    if extra_fields:
        for k, v in extra_fields.items():
            setattr(twin, k, v)
    sess.commit()
    audit(f"digital_twin.{new_status}", user_id=current_user.id,
          entity_type="digital_twin", entity_id=twin_id)
    return {"data": _twin_dict(twin)}


@dt_bp.route("/<int:twin_id>/submit", methods=["POST"])
@login_required
def submit_for_review(twin_id: int):
    now = _now()
    return _transition(twin_id, "engineering_review",
                       {"submitted_by": current_user.id, "submitted_at": now})


@dt_bp.route("/<int:twin_id>/approve", methods=["POST"])
@login_required
def approve_twin(twin_id: int):
    if getattr(current_user, "role", 0) not in _ENGINEERING_ROLES:
        return {"error": "Engineering role required to approve"}, 403
    now = _now()
    return _transition(twin_id, "approved",
                       {"approved_by": current_user.id, "approved_at": now})


@dt_bp.route("/<int:twin_id>/reject", methods=["POST"])
@login_required
def reject_twin(twin_id: int):
    if getattr(current_user, "role", 0) not in _ENGINEERING_ROLES:
        return {"error": "Engineering role required"}, 403
    body = request.get_json(force=True, silent=True) or {}
    sess = get_session()
    twin = sess.query(DigitalTwin).filter_by(id=twin_id, is_deleted=False).first()
    if not twin:
        return {"error": "Not found"}, 404
    twin.status       = "needs_revision"
    twin.review_notes = body.get("notes", "")
    twin.reviewed_by  = current_user.id
    twin.reviewed_at  = _now()
    twin.updatedAt    = twin.reviewed_at
    sess.commit()
    audit("digital_twin.needs_revision", user_id=current_user.id,
          entity_type="digital_twin", entity_id=twin_id)
    return {"data": _twin_dict(twin)}


@dt_bp.route("/<int:twin_id>/lock", methods=["POST"])
@login_required
def lock_twin(twin_id: int):
    if getattr(current_user, "role", 0) not in _ENGINEERING_ROLES:
        return {"error": "Engineering role required"}, 403
    sess = get_session()
    twin = sess.query(DigitalTwin).filter_by(id=twin_id, is_deleted=False).first()
    if not twin:
        return {"error": "Not found"}, 404
    if twin.status != "approved":
        return {"error": "Only approved twins can be locked"}, 400
    twin.status    = "locked"
    twin.updatedAt = _now()
    sess.commit()
    audit("digital_twin.locked", user_id=current_user.id,
          entity_type="digital_twin", entity_id=twin_id)
    return {"data": _twin_dict(twin)}


# ─── Seed from project topoMeters ─────────────────────────────────────────────

@dt_bp.route("/from-project/<int:project_id>", methods=["POST"])
@login_required
def twin_from_project(project_id: int):
    """
    Seed a Draft Digital Twin from a project's proposalData.topoMeters.

    topoMeters structure (from Angular EM&V page):
    [
      {
        meterNo: "77248797",
        buses: [
          {
            badge: "BUS-1", dwg: "SLD-01", xfKva: "1500", mainA: "2000", pctLoad: "65",
            circuits: [
              { name: "Panel A", amps: "200", nEcbs: 1, nApf50: 0, nApf100: 0 }
            ]
          }
        ]
      }
    ]

    Creates:
      - Site (if not already exists for this project)
      - Digital Twin (draft)
      - One pq_meter asset per meterNo, linked to site
      - One switchgear/bus asset per bus, linked to digital_twin_id
      - 'feeds' relationships: meter → bus, bus → circuit
    Returns existing twin if already seeded.
    """
    sess = get_session()

    # Check if already seeded
    existing_twin = sess.query(DigitalTwin).filter_by(
        project_id=project_id, is_deleted=False).first()
    if existing_twin:
        return {"data": _twin_dict(existing_twin), "created": False}

    from app.models.project import Project
    proj = sess.query(Project).filter_by(id=project_id, isDeleted=False).first()
    if not proj:
        return {"error": "Project not found"}, 404

    topo_meters = (proj.proposalData or {}).get("topoMeters", [])

    # Ensure site exists
    site = sess.query(Site).filter_by(project_id=project_id, is_deleted=False).first()
    if not site:
        pd  = proj.proposalData or {}
        now = _now()
        site = Site(
            org_id    = proj.org_id,
            client_id = proj.client,
            project_id= proj.id,
            name      = pd.get("facility_name") or proj.name,
            address   = pd.get("facility_address") or pd.get("addressStreet") or proj.location,
            city      = pd.get("facility_city") or pd.get("addressCity"),
            state     = pd.get("facility_state"),
            zip       = pd.get("facility_zip"),
            timezone  = proj.timeZoneId,
            utility   = pd.get("utility_name") or pd.get("utilityName"),
            status    = "active",
            createdAt = now,
            updatedAt = now,
        )
        sess.add(site)
        sess.flush()

    now  = _now()
    twin = DigitalTwin(
        site_id        = site.id,
        org_id         = proj.org_id,
        project_id     = project_id,
        status         = "draft",
        version_number = 1,
        source         = "topo_seed",
        label          = "Auto-seeded from EM&V topology",
        createdAt      = now,
        updatedAt      = now,
    )
    sess.add(twin)
    sess.flush()

    _create_assets_from_topo(sess, site.id, twin.id, proj.org_id, topo_meters, now)

    sess.commit()
    audit("digital_twin.seeded_from_project", user_id=current_user.id,
          entity_type="digital_twin", entity_id=twin.id,
          detail={"project_id": project_id, "meters": len(topo_meters)})
    return {"data": _twin_dict(twin), "created": True}, 201


def _create_assets_from_topo(sess, site_id, twin_id, org_id, topo_meters, now):
    """
    Materialise topoMeters JSONB into Asset + AssetRelationship rows.
    One pq_meter per meterNo; one switchgear per bus; one panel per circuit.
    """
    for meter_entry in (topo_meters or []):
        meter_no = str(meter_entry.get("meterNo", "")).strip()
        meter_asset = Asset(
            site_id          = site_id,
            org_id           = org_id,
            digital_twin_id  = twin_id,
            asset_type       = "pq_meter",
            name             = f"Meter {meter_no}" if meter_no else "Utility Meter",
            asset_uid        = f"METER-{meter_no}" if meter_no else None,
            status           = "active",
            createdAt        = now,
            updatedAt        = now,
        )
        sess.add(meter_asset)
        sess.flush()

        for bus in (meter_entry.get("buses") or []):
            badge  = str(bus.get("badge", "")).strip()
            kva    = _safe_float(bus.get("xfKva"))
            main_a = _safe_float(bus.get("mainA"))
            bus_asset = Asset(
                site_id          = site_id,
                org_id           = org_id,
                digital_twin_id  = twin_id,
                asset_type       = "switchgear",
                name             = badge or "Switchgear",
                asset_uid        = badge or None,
                kva_rating       = kva,
                amp_rating       = main_a,
                drawing_ref      = bus.get("dwg"),
                bus_id           = badge,
                status           = "active",
                createdAt        = now,
                updatedAt        = now,
            )
            sess.add(bus_asset)
            sess.flush()

            # meter → bus: feeds
            sess.add(AssetRelationship(
                digital_twin_id   = twin_id,
                parent_asset_id   = meter_asset.id,
                child_asset_id    = bus_asset.id,
                relationship_type = "feeds",
                createdAt         = now,
                updatedAt         = now,
            ))

            for circ in (bus.get("circuits") or []):
                c_name = str(circ.get("name", "")).strip() or "Circuit"
                c_amps = _safe_float(circ.get("amps"))
                circ_asset = Asset(
                    site_id          = site_id,
                    org_id           = org_id,
                    digital_twin_id  = twin_id,
                    asset_type       = "panel",
                    name             = c_name,
                    amp_rating       = c_amps,
                    status           = "active",
                    extra            = {
                        "n_ecbs":   circ.get("nEcbs", 0),
                        "n_apf50":  circ.get("nApf50", 0),
                        "n_apf100": circ.get("nApf100", 0),
                        "note":     circ.get("note", ""),
                    },
                    createdAt        = now,
                    updatedAt        = now,
                )
                sess.add(circ_asset)
                sess.flush()

                sess.add(AssetRelationship(
                    digital_twin_id   = twin_id,
                    parent_asset_id   = bus_asset.id,
                    child_asset_id    = circ_asset.id,
                    relationship_type = "feeds",
                    createdAt         = now,
                    updatedAt         = now,
                ))


def _safe_float(v):
    try:
        return float(v) if v not in (None, "", "N/A") else None
    except (TypeError, ValueError):
        return None
