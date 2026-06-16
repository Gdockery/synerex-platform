"""
Site management routes — Phase 2.

GET    /api/site/                  list sites for current org
POST   /api/site/                  create site
GET    /api/site/<id>              get one
PATCH  /api/site/<id>              update
DELETE /api/site/<id>              soft-delete

POST   /api/site/from-project/<project_id>
    Convenience: create a Site seeded from an existing Project record.
    Returns existing site_id if the project already has one.
"""
from time import time

from flask import Blueprint, request
from flask_login import login_required, current_user

from app.db import get_session
from app.models.site import Site, SITE_STATUSES
from app.models.project import Project
from app.services.audit import audit

site_bp = Blueprint("site", __name__, url_prefix="/api/site")


def _now():
    return int(time() * 1000)


def _org_id():
    return getattr(current_user, "org_id", None)


def _site_dict(s: Site) -> dict:
    return {
        "id":          s.id,
        "org_id":      s.org_id,
        "client_id":   s.client_id,
        "project_id":  s.project_id,
        "name":        s.name,
        "site_number": s.site_number,
        "address":     s.address,
        "city":        s.city,
        "state":       s.state,
        "zip":         s.zip,
        "country":     s.country,
        "timezone":    s.timezone,
        "utility":     s.utility,
        "status":      s.status,
        "notes":       s.notes,
        "createdAt":   s.createdAt,
        "updatedAt":   s.updatedAt,
    }


def _scoped_query(sess):
    """Return a query scoped to the current user's org (super admin sees all)."""
    q = sess.query(Site).filter_by(is_deleted=False)
    role = getattr(current_user, "role", 0)
    if role == 8:
        return q   # super admin: all orgs
    org = _org_id()
    if org:
        return q.filter(Site.org_id == org)
    # Client-level user: scope to their client_id
    client_id = getattr(current_user, "client", None)
    if client_id:
        return q.filter(Site.client_id == client_id)
    return q.filter(Site.id == -1)  # no access


@site_bp.route("/", methods=["GET"])
@login_required
def list_sites():
    sess = get_session()
    rows = _scoped_query(sess).order_by(Site.name).all()
    return {"data": [_site_dict(r) for r in rows]}


@site_bp.route("/", methods=["POST"])
@login_required
def create_site():
    body = request.get_json(force=True) or {}
    if not body.get("name"):
        return {"error": "name is required"}, 400

    sess = get_session()
    now  = _now()
    site = Site(
        org_id      = body.get("org_id") or _org_id(),
        client_id   = body.get("client_id"),
        project_id  = body.get("project_id"),
        name        = body["name"],
        site_number = body.get("site_number"),
        address     = body.get("address"),
        city        = body.get("city"),
        state       = body.get("state"),
        zip         = body.get("zip"),
        country     = body.get("country", "US"),
        timezone    = body.get("timezone"),
        utility     = body.get("utility"),
        status      = body.get("status", "active"),
        notes       = body.get("notes"),
        createdAt   = now,
        updatedAt   = now,
    )
    if site.status not in SITE_STATUSES:
        return {"error": f"status must be one of {SITE_STATUSES}"}, 400

    sess.add(site)
    sess.commit()
    audit("site.created", user_id=current_user.id, org_id=site.org_id,
          entity_type="site", entity_id=site.id, detail={"name": site.name})
    return {"data": _site_dict(site)}, 201


@site_bp.route("/<int:site_id>", methods=["GET"])
@login_required
def get_site(site_id: int):
    sess = get_session()
    site = _scoped_query(sess).filter(Site.id == site_id).first()
    if not site:
        return {"error": "Not found"}, 404
    return {"data": _site_dict(site)}


@site_bp.route("/<int:site_id>", methods=["PATCH"])
@login_required
def update_site(site_id: int):
    sess = get_session()
    site = _scoped_query(sess).filter(Site.id == site_id).first()
    if not site:
        return {"error": "Not found"}, 404

    body = request.get_json(force=True) or {}
    _EDITABLE = ("name", "site_number", "address", "city", "state", "zip",
                 "country", "timezone", "utility", "status", "notes")
    for k in _EDITABLE:
        if k in body:
            setattr(site, k, body[k])
    site.updatedAt = _now()
    sess.commit()
    audit("site.updated", user_id=current_user.id, org_id=site.org_id,
          entity_type="site", entity_id=site_id)
    return {"data": _site_dict(site)}


@site_bp.route("/<int:site_id>", methods=["DELETE"])
@login_required
def delete_site(site_id: int):
    sess = get_session()
    site = _scoped_query(sess).filter(Site.id == site_id).first()
    if not site:
        return {"error": "Not found"}, 404
    site.is_deleted = True
    site.updatedAt  = _now()
    sess.commit()
    audit("site.deleted", user_id=current_user.id, entity_type="site", entity_id=site_id)
    return {"data": {"id": site_id, "is_deleted": True}}


@site_bp.route("/from-project/<int:project_id>", methods=["POST"])
@login_required
def site_from_project(project_id: int):
    """Create (or return existing) a Site seeded from a Project record."""
    sess = get_session()

    # Return existing if already linked
    existing = sess.query(Site).filter_by(project_id=project_id, is_deleted=False).first()
    if existing:
        return {"data": _site_dict(existing), "created": False}

    proj = sess.query(Project).filter_by(id=project_id, isDeleted=False).first()
    if not proj:
        return {"error": "Project not found"}, 404

    # Pull address from proposalData if present, fall back to project.location
    pd     = proj.proposalData or {}
    now    = _now()
    site   = Site(
        org_id      = proj.org_id,
        client_id   = proj.client,
        project_id  = proj.id,
        name        = pd.get("facility_name") or proj.name,
        address     = pd.get("facility_address") or pd.get("addressStreet") or proj.location,
        city        = pd.get("facility_city")    or pd.get("addressCity"),
        state       = pd.get("facility_state"),
        zip         = pd.get("facility_zip"),
        timezone    = proj.timeZoneId,
        utility     = pd.get("utility_name")    or pd.get("utilityName"),
        status      = "active",
        createdAt   = now,
        updatedAt   = now,
    )
    sess.add(site)
    sess.commit()
    audit("site.created_from_project", user_id=current_user.id, org_id=site.org_id,
          entity_type="site", entity_id=site.id, detail={"project_id": project_id})
    return {"data": _site_dict(site), "created": True}, 201
