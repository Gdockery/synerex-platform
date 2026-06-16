"""
Deployment routes — Phase 4: Deployment Management System.

Phase 4b additions:
POST   /api/deployment/<id>/photos          upload a site/installation photo
GET    /api/deployment/<id>/photos          list photos for this deployment

GET    /api/deployment/                         list deployments (scoped)
POST   /api/deployment/                         create deployment
GET    /api/deployment/<id>                     get one
PATCH  /api/deployment/<id>                     update
DELETE /api/deployment/<id>                     soft-delete

POST   /api/deployment/<id>/status              advance status
PATCH  /api/deployment/<id>/field-entry         save field-entry stepper data
POST   /api/deployment/<id>/devices             add device to deployment
PATCH  /api/deployment/<id>/devices/<dd_id>     update deployment-device

GET    /api/deployment/<id>/discovery           get site discovery record
POST   /api/deployment/<id>/discovery           create/update site discovery

GET    /api/deployment/<id>/engineering         list engineering reviews
POST   /api/deployment/<id>/engineering         create review
PATCH  /api/deployment/<id>/engineering/<rev_id> update review decision

GET    /api/deployment/<id>/activation          get All-Checks-Clear record
POST   /api/deployment/<id>/activation          certify (All Checks Clear™)
"""
import os
import secrets
from time import time

from flask import Blueprint, current_app, jsonify, request, send_from_directory
from flask_login import login_required, current_user

from app.db import get_session
from app.models.deployment import Deployment, DEPLOYMENT_STATUSES
from app.models.deployment_device import DeploymentDevice
from app.models.site_discovery import SiteDiscovery
from app.models.engineering_review import EngineeringReview, REVIEW_DECISIONS
from app.models.site_activation import SiteActivation
from app.services.audit import audit

deployment_bp = Blueprint("deployment", __name__, url_prefix="/api/deployment")


def _now():
    return int(time() * 1000)


# ─── Serialisers ─────────────────────────────────────────────────────────────

def _dep_dict(d: Deployment) -> dict:
    return {
        "id":               d.id,
        "project_id":       d.project_id,
        "site_id":          d.site_id,
        "org_id":           d.org_id,
        "status":           d.status,
        "current_step":     d.current_step,
        "scheduled_date":   d.scheduled_date,
        "installer_id":     d.installer_id,
        "lead_engineer_id": d.lead_engineer_id,
        "started_at":       d.started_at,
        "completed_at":     d.completed_at,
        "activated_at":     d.activated_at,
        "field_entry_data": d.field_entry_data,
        "notes":            d.notes,
        "createdAt":        d.createdAt,
        "updatedAt":        d.updatedAt,
    }


def _dd_dict(d: DeploymentDevice) -> dict:
    return {
        "id":                  d.id,
        "deployment_id":       d.deployment_id,
        "device_registry_id":  d.device_registry_id,
        "device_type":         d.device_type,
        "planned_label":       d.planned_label,
        "install_step":        d.install_step,
        "scanned_at":          d.scanned_at,
        "scanned_by":          d.scanned_by,
        "installed_at":        d.installed_at,
        "ct_amp_rating":       d.ct_amp_rating,
        "ct_ratio":            d.ct_ratio,
        "ct_orientation":      d.ct_orientation,
        "phase_rotation_ok":   d.phase_rotation_ok,
        "notes":               d.notes,
        "createdAt":           d.createdAt,
        "updatedAt":           d.updatedAt,
    }


def _disc_dict(s: SiteDiscovery) -> dict:
    return {
        "id":                  s.id,
        "deployment_id":       s.deployment_id,
        "site_id":             s.site_id,
        "collected_by":        s.collected_by,
        "collected_at":        s.collected_at,
        "utility_name":        s.utility_name,
        "utility_account_no":  s.utility_account_no,
        "service_voltage":     s.service_voltage,
        "service_amperage":    s.service_amperage,
        "panel_brand":         s.panel_brand,
        "panel_type":          s.panel_type,
        "panel_age_years":     s.panel_age_years,
        "access_notes":        s.access_notes,
        "contact_onsite":      s.contact_onsite,
        "equipment_notes":     s.equipment_notes,
        "notes":               s.notes,
        "createdAt":           s.createdAt,
        "updatedAt":           s.updatedAt,
    }


def _rev_dict(r: EngineeringReview) -> dict:
    return {
        "id":              r.id,
        "deployment_id":   r.deployment_id,
        "reviewer_id":     r.reviewer_id,
        "reviewed_at":     r.reviewed_at,
        "decision":        r.decision,
        "reviewer_notes":  r.reviewer_notes,
        "checklist":       r.checklist,
        "revision_round":  r.revision_round,
        "createdAt":       r.createdAt,
        "updatedAt":       r.updatedAt,
    }


def _act_dict(a: SiteActivation) -> dict:
    return {
        "id":                   a.id,
        "deployment_id":        a.deployment_id,
        "site_id":              a.site_id,
        "status":               a.status,
        "certified_by":         a.certified_by,
        "certified_at":         a.certified_at,
        "certification_code":   a.certification_code,
        "checks_summary":       a.checks_summary,
        "notes":                a.notes,
        "createdAt":            a.createdAt,
        "updatedAt":            a.updatedAt,
    }


# ─── Scope helper ─────────────────────────────────────────────────────────────

def _dep_q(sess):
    q    = sess.query(Deployment).filter_by(is_deleted=False)
    role = getattr(current_user, "role", 0)
    if role == 8:
        return q
    org = getattr(current_user, "org_id", None)
    if org:
        return q.filter(Deployment.org_id == org)
    return q.filter(Deployment.id == -1)


# ─── CRUD ─────────────────────────────────────────────────────────────────────

@deployment_bp.route("/", methods=["GET"])
@login_required
def list_deployments():
    sess = get_session()
    q    = _dep_q(sess)
    if pid := request.args.get("project_id", type=int):
        q = q.filter(Deployment.project_id == pid)
    if sid := request.args.get("site_id", type=int):
        q = q.filter(Deployment.site_id == sid)
    if st := request.args.get("status"):
        q = q.filter(Deployment.status == st)
    rows = q.order_by(Deployment.createdAt.desc()).all()
    return {"data": [_dep_dict(r) for r in rows]}


@deployment_bp.route("/", methods=["POST"])
@login_required
def create_deployment():
    body = request.get_json(force=True, silent=True) or {}
    if not body.get("project_id"):
        return {"error": "project_id required"}, 400

    sess = get_session()
    now  = _now()
    dep  = Deployment(
        project_id       = body["project_id"],
        site_id          = body.get("site_id"),
        org_id           = body.get("org_id") or getattr(current_user, "org_id", None),
        status           = "not_started",
        current_step     = "site_details",
        scheduled_date   = body.get("scheduled_date"),
        installer_id     = body.get("installer_id"),
        lead_engineer_id = body.get("lead_engineer_id"),
        notes            = body.get("notes"),
        createdAt        = now,
        updatedAt        = now,
    )
    sess.add(dep)
    sess.commit()
    audit("deployment.created", user_id=current_user.id,
          entity_type="deployment", entity_id=dep.id,
          detail={"project_id": dep.project_id})
    return {"data": _dep_dict(dep)}, 201


@deployment_bp.route("/<int:dep_id>", methods=["GET"])
@login_required
def get_deployment(dep_id: int):
    sess = get_session()
    dep  = _dep_q(sess).filter(Deployment.id == dep_id).first()
    if not dep:
        return {"error": "Not found"}, 404
    return {"data": _dep_dict(dep)}


@deployment_bp.route("/<int:dep_id>", methods=["PATCH"])
@login_required
def update_deployment(dep_id: int):
    sess = get_session()
    dep  = _dep_q(sess).filter(Deployment.id == dep_id).first()
    if not dep:
        return {"error": "Not found"}, 404

    body = request.get_json(force=True, silent=True) or {}
    _EDITABLE = ("scheduled_date", "installer_id", "lead_engineer_id",
                 "site_id", "notes", "current_step")
    for k in _EDITABLE:
        if k in body:
            setattr(dep, k, body[k])
    dep.updatedAt = _now()
    sess.commit()
    audit("deployment.updated", user_id=current_user.id,
          entity_type="deployment", entity_id=dep_id)
    return {"data": _dep_dict(dep)}


@deployment_bp.route("/<int:dep_id>", methods=["DELETE"])
@login_required
def delete_deployment(dep_id: int):
    sess = get_session()
    dep  = _dep_q(sess).filter(Deployment.id == dep_id).first()
    if not dep:
        return {"error": "Not found"}, 404
    dep.is_deleted = True
    dep.updatedAt  = _now()
    sess.commit()
    audit("deployment.deleted", user_id=current_user.id,
          entity_type="deployment", entity_id=dep_id)
    return {"data": {"id": dep_id, "is_deleted": True}}


# ─── Status lifecycle ─────────────────────────────────────────────────────────

_DEP_TRANSITIONS = {
    "not_started":      ("scheduled",),
    "scheduled":        ("installing", "not_started"),
    "installing":       ("commissioning", "scheduled"),
    "commissioning":    ("awaiting_approval", "installing"),
    "awaiting_approval": ("activated", "commissioning"),
    "activated":        ("on_hold",),
    "on_hold":          ("activated", "awaiting_approval"),
}


@deployment_bp.route("/<int:dep_id>/status", methods=["POST"])
@login_required
def change_dep_status(dep_id: int):
    sess = get_session()
    dep  = _dep_q(sess).filter(Deployment.id == dep_id).first()
    if not dep:
        return {"error": "Not found"}, 404

    body       = request.get_json(force=True, silent=True) or {}
    new_status = body.get("status", "")
    if new_status not in DEPLOYMENT_STATUSES:
        return {"error": f"status must be one of {DEPLOYMENT_STATUSES}"}, 400

    allowed = _DEP_TRANSITIONS.get(dep.status, ())
    if new_status not in allowed:
        return {"error": f"Cannot transition from '{dep.status}' to '{new_status}'. "
                         f"Allowed: {allowed}"}, 400

    now = _now()
    dep.status    = new_status
    dep.updatedAt = now
    if new_status == "installing" and not dep.started_at:
        dep.started_at = now
    if new_status == "activated":
        dep.activated_at  = now
        dep.completed_at  = now

    # Auto-create SiteActivation record when reaching awaiting_approval
    if new_status == "awaiting_approval":
        existing = sess.query(SiteActivation).filter_by(deployment_id=dep_id).first()
        if not existing:
            act = SiteActivation(
                deployment_id = dep_id,
                site_id       = dep.site_id,
                status        = "pending",
                createdAt     = now,
                updatedAt     = now,
            )
            sess.add(act)

    sess.commit()
    audit(f"deployment.status.{new_status}", user_id=current_user.id,
          entity_type="deployment", entity_id=dep_id)
    return {"data": _dep_dict(dep)}


# ─── Field-entry stepper ──────────────────────────────────────────────────────

@deployment_bp.route("/<int:dep_id>/field-entry", methods=["PATCH"])
@login_required
def save_field_entry(dep_id: int):
    """
    Persist partial or complete field-entry form data for the installer stepper.
    Body is a JSON object; merged into existing field_entry_data on server.
    """
    sess = get_session()
    dep  = _dep_q(sess).filter(Deployment.id == dep_id).first()
    if not dep:
        return {"error": "Not found"}, 404

    body = request.get_json(force=True, silent=True) or {}
    dep.field_entry_data = {**(dep.field_entry_data or {}), **body}

    if step := body.get("current_step"):
        dep.current_step = step

    dep.updatedAt = _now()
    sess.commit()
    audit("deployment.field_entry_saved", user_id=current_user.id,
          entity_type="deployment", entity_id=dep_id)
    return {"data": _dep_dict(dep)}


# ─── Deployment devices ───────────────────────────────────────────────────────

@deployment_bp.route("/<int:dep_id>/devices", methods=["GET"])
@login_required
def list_dep_devices(dep_id: int):
    sess = get_session()
    if not _dep_q(sess).filter(Deployment.id == dep_id).first():
        return {"error": "Not found"}, 404
    rows = (sess.query(DeploymentDevice)
            .filter_by(deployment_id=dep_id)
            .order_by(DeploymentDevice.createdAt)
            .all())
    return {"data": [_dd_dict(r) for r in rows]}


@deployment_bp.route("/<int:dep_id>/devices", methods=["POST"])
@login_required
def add_dep_device(dep_id: int):
    sess = get_session()
    if not _dep_q(sess).filter(Deployment.id == dep_id).first():
        return {"error": "Not found"}, 404

    body = request.get_json(force=True, silent=True) or {}
    now  = _now()
    dd   = DeploymentDevice(
        deployment_id      = dep_id,
        device_registry_id = body.get("device_registry_id"),
        device_type        = body.get("device_type"),
        planned_label      = body.get("planned_label"),
        install_step       = body.get("install_step"),
        ct_amp_rating      = body.get("ct_amp_rating"),
        ct_ratio           = body.get("ct_ratio"),
        notes              = body.get("notes"),
        createdAt          = now,
        updatedAt          = now,
    )
    sess.add(dd)
    sess.commit()
    audit("deployment.device_added", user_id=current_user.id,
          entity_type="deployment_device", entity_id=dd.id,
          detail={"deployment_id": dep_id})
    return {"data": _dd_dict(dd)}, 201


@deployment_bp.route("/<int:dep_id>/devices/<int:dd_id>", methods=["PATCH"])
@login_required
def update_dep_device(dep_id: int, dd_id: int):
    sess = get_session()
    dd   = sess.query(DeploymentDevice).filter_by(id=dd_id, deployment_id=dep_id).first()
    if not dd:
        return {"error": "Not found"}, 404

    body = request.get_json(force=True, silent=True) or {}
    _EDITABLE = ("device_registry_id", "install_step", "ct_amp_rating",
                 "ct_ratio", "ct_orientation", "phase_rotation_ok", "notes",
                 "planned_label")
    for k in _EDITABLE:
        if k in body:
            setattr(dd, k, body[k])

    now = _now()
    if body.get("scanned"):
        dd.scanned_at  = now
        dd.scanned_by  = current_user.id
    if body.get("installed"):
        dd.installed_at = now

    dd.updatedAt = now
    sess.commit()
    return {"data": _dd_dict(dd)}


# ─── Site discovery ───────────────────────────────────────────────────────────

@deployment_bp.route("/<int:dep_id>/discovery", methods=["GET"])
@login_required
def get_discovery(dep_id: int):
    sess = get_session()
    if not _dep_q(sess).filter(Deployment.id == dep_id).first():
        return {"error": "Not found"}, 404
    rec = sess.query(SiteDiscovery).filter_by(deployment_id=dep_id).order_by(
        SiteDiscovery.createdAt.desc()).first()
    if not rec:
        return {"data": None}
    return {"data": _disc_dict(rec)}


@deployment_bp.route("/<int:dep_id>/discovery", methods=["POST"])
@login_required
def upsert_discovery(dep_id: int):
    """Create or replace the site discovery record for this deployment."""
    sess = get_session()
    dep  = _dep_q(sess).filter(Deployment.id == dep_id).first()
    if not dep:
        return {"error": "Not found"}, 404

    body = request.get_json(force=True, silent=True) or {}
    now  = _now()

    # One record per deployment — update in place if it exists
    rec = sess.query(SiteDiscovery).filter_by(deployment_id=dep_id).order_by(
        SiteDiscovery.createdAt.desc()).first()

    _FIELDS = ("utility_name", "utility_account_no", "service_voltage",
               "service_amperage", "panel_brand", "panel_type",
               "panel_age_years", "access_notes", "contact_onsite",
               "equipment_notes", "notes")

    if rec:
        for k in _FIELDS:
            if k in body:
                setattr(rec, k, body[k])
        rec.updatedAt = now
        created = False
    else:
        rec = SiteDiscovery(
            deployment_id   = dep_id,
            site_id         = dep.site_id,
            collected_by    = current_user.id,
            collected_at    = now,
            createdAt       = now,
            updatedAt       = now,
        )
        for k in _FIELDS:
            if k in body:
                setattr(rec, k, body[k])
        sess.add(rec)
        created = True

    sess.commit()
    audit("deployment.discovery_saved", user_id=current_user.id,
          entity_type="site_discovery", entity_id=rec.id,
          detail={"deployment_id": dep_id})
    return {"data": _disc_dict(rec)}, (201 if created else 200)


# ─── Engineering review ───────────────────────────────────────────────────────

@deployment_bp.route("/<int:dep_id>/engineering", methods=["GET"])
@login_required
def list_reviews(dep_id: int):
    sess = get_session()
    if not _dep_q(sess).filter(Deployment.id == dep_id).first():
        return {"error": "Not found"}, 404
    rows = (sess.query(EngineeringReview)
            .filter_by(deployment_id=dep_id)
            .order_by(EngineeringReview.revision_round.desc())
            .all())
    return {"data": [_rev_dict(r) for r in rows]}


@deployment_bp.route("/<int:dep_id>/engineering", methods=["POST"])
@login_required
def create_review(dep_id: int):
    sess = get_session()
    if not _dep_q(sess).filter(Deployment.id == dep_id).first():
        return {"error": "Not found"}, 404

    # Compute next revision round
    last_round = (sess.query(EngineeringReview.revision_round)
                  .filter_by(deployment_id=dep_id)
                  .order_by(EngineeringReview.revision_round.desc())
                  .scalar() or 0)

    body = request.get_json(force=True, silent=True) or {}
    now  = _now()
    rev  = EngineeringReview(
        deployment_id  = dep_id,
        reviewer_id    = current_user.id,
        decision       = "pending",
        checklist      = body.get("checklist"),
        reviewer_notes = body.get("reviewer_notes"),
        revision_round = last_round + 1,
        createdAt      = now,
        updatedAt      = now,
    )
    sess.add(rev)
    sess.commit()
    audit("deployment.review_created", user_id=current_user.id,
          entity_type="engineering_review", entity_id=rev.id,
          detail={"deployment_id": dep_id, "round": rev.revision_round})
    return {"data": _rev_dict(rev)}, 201


@deployment_bp.route("/<int:dep_id>/engineering/<int:rev_id>", methods=["PATCH"])
@login_required
def update_review(dep_id: int, rev_id: int):
    sess = get_session()
    rev  = sess.query(EngineeringReview).filter_by(id=rev_id, deployment_id=dep_id).first()
    if not rev:
        return {"error": "Not found"}, 404

    body = request.get_json(force=True, silent=True) or {}
    decision = body.get("decision")
    if decision and decision not in REVIEW_DECISIONS:
        return {"error": f"decision must be one of {REVIEW_DECISIONS}"}, 400

    if decision:
        rev.decision    = decision
        rev.reviewed_at = _now()
        rev.reviewer_id = current_user.id
    if "reviewer_notes" in body:
        rev.reviewer_notes = body["reviewer_notes"]
    if "checklist" in body:
        rev.checklist = {**(rev.checklist or {}), **body["checklist"]}
    rev.updatedAt = _now()
    sess.commit()

    audit(f"deployment.review.{rev.decision}", user_id=current_user.id,
          entity_type="engineering_review", entity_id=rev_id,
          detail={"deployment_id": dep_id})
    return {"data": _rev_dict(rev)}


# ─── All Checks Clear™ certification ─────────────────────────────────────────

@deployment_bp.route("/<int:dep_id>/activation", methods=["GET"])
@login_required
def get_activation(dep_id: int):
    sess = get_session()
    if not _dep_q(sess).filter(Deployment.id == dep_id).first():
        return {"error": "Not found"}, 404
    act = sess.query(SiteActivation).filter_by(deployment_id=dep_id).first()
    if not act:
        return {"data": None}
    return {"data": _act_dict(act)}


@deployment_bp.route("/<int:dep_id>/activation", methods=["POST"])
@login_required
def certify_activation(dep_id: int):
    """
    Issue All Checks Clear™ certification.
    Requires all engineering reviews to be approved.
    Automatically advances deployment status to 'activated'.
    """
    sess = get_session()
    dep  = _dep_q(sess).filter(Deployment.id == dep_id).first()
    if not dep:
        return {"error": "Not found"}, 404

    # Guard: at least one approved engineering review required
    approved_reviews = (sess.query(EngineeringReview)
                        .filter_by(deployment_id=dep_id, decision="approved")
                        .count())
    if approved_reviews == 0:
        return {"error": "At least one approved engineering review is required "
                         "before All Checks Clear™ certification."}, 422

    # Guard: no open reviews with needs_info / rejected
    blocking = (sess.query(EngineeringReview)
                .filter(EngineeringReview.deployment_id == dep_id,
                        EngineeringReview.decision.in_(("pending", "needs_info", "rejected")))
                .count())
    if blocking > 0:
        return {"error": "All engineering reviews must be approved before certification. "
                         f"{blocking} review(s) still pending/rejected."}, 422

    now  = _now()
    body = request.get_json(force=True, silent=True) or {}

    act = sess.query(SiteActivation).filter_by(deployment_id=dep_id).first()
    if not act:
        act = SiteActivation(
            deployment_id  = dep_id,
            site_id        = dep.site_id,
            createdAt      = now,
            updatedAt      = now,
        )
        sess.add(act)

    act.status              = "certified"
    act.certified_by        = current_user.id
    act.certified_at        = now
    act.certification_code  = secrets.token_hex(16)
    act.checks_summary      = body.get("checks_summary")
    act.notes               = body.get("notes")
    act.updatedAt           = now

    # Advance deployment to activated
    dep.status       = "activated"
    dep.activated_at = now
    dep.completed_at = now
    dep.updatedAt    = now

    sess.commit()
    audit("deployment.all_checks_clear", user_id=current_user.id,
          entity_type="site_activation", entity_id=act.id,
          detail={"deployment_id": dep_id, "certification_code": act.certification_code})
    return {"data": _act_dict(act)}, 201


# ── Photo upload (Phase 4b) ───────────────────────────────────────────────────

_ALLOWED_PHOTO_EXTS = {"jpg", "jpeg", "png", "webp", "heic", "heif"}


def _photo_dir(dep_id: int) -> str:
    base = current_app.config.get("STORAGE_LOCAL_PATH") or "/tmp/deployment_photos"
    path = os.path.join(base, "deployment_photos", str(dep_id))
    os.makedirs(path, exist_ok=True)
    return path


@deployment_bp.route("/<int:dep_id>/photos", methods=["POST"])
@login_required
def upload_photo(dep_id: int):
    """
    POST /api/deployment/<id>/photos
    Multipart form:
      file  — image file (jpg/png/webp/heic)
      label — optional description (max 255 chars)
    """
    sess = get_session()
    dep  = sess.get(Deployment, dep_id)
    if not dep:
        return {"error": "Deployment not found"}, 404

    if "file" not in request.files:
        return {"error": "No file in request"}, 400

    f = request.files["file"]
    if not f.filename:
        return {"error": "Empty filename"}, 400

    ext = (f.filename.rsplit(".", 1)[-1] if "." in f.filename else "").lower()
    if ext not in _ALLOWED_PHOTO_EXTS:
        return {"error": f"File type .{ext} not allowed. Use: {', '.join(_ALLOWED_PHOTO_EXTS)}"}, 400

    token    = secrets.token_hex(12)
    filename = f"{token}.{ext}"
    label    = (request.form.get("label") or "")[:255]

    save_dir  = _photo_dir(dep_id)
    save_path = os.path.join(save_dir, filename)
    f.save(save_path)

    # Store metadata in field_entry_data.photos list (no new table needed)
    photos = list(dep.field_entry_data.get("photos", []) if dep.field_entry_data else [])
    photo_meta = {
        "filename":    filename,
        "label":       label,
        "uploaded_by": current_user.id,
        "uploaded_at": _now(),
        "url":         f"/api/deployment/{dep_id}/photos/{filename}",
    }
    photos.append(photo_meta)
    dep.field_entry_data = {**(dep.field_entry_data or {}), "photos": photos}
    dep.updatedAt = _now()
    sess.commit()

    audit("deployment.photo_uploaded", user_id=current_user.id,
          entity_type="deployment", entity_id=dep_id,
          detail={"filename": filename, "label": label})

    return {"data": photo_meta}, 201


@deployment_bp.route("/<int:dep_id>/photos", methods=["GET"])
@login_required
def list_photos(dep_id: int):
    """GET /api/deployment/<id>/photos — list uploaded photos for this deployment."""
    sess = get_session()
    dep  = sess.get(Deployment, dep_id)
    if not dep:
        return {"error": "Deployment not found"}, 404
    photos = (dep.field_entry_data or {}).get("photos", [])
    return {"data": photos}


@deployment_bp.route("/<int:dep_id>/photos/<filename>", methods=["GET"])
@login_required
def serve_photo(dep_id: int, filename: str):
    """GET /api/deployment/<id>/photos/<filename> — serve a stored photo."""
    photo_dir = _photo_dir(dep_id)
    # Only allow alphanumeric + dots/hyphens/underscores (prevent path traversal)
    safe = all(c.isalnum() or c in "._-" for c in filename)
    if not safe:
        return {"error": "Invalid filename"}, 400
    return send_from_directory(photo_dir, filename)
