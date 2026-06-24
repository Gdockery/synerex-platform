"""
dep_routes.py — ECBS Deployment App API
Spec: DEPLOYMENT APP with Screenshots.pdf v4.0

All endpoints are prefixed /api/dep/

Deployments:
  GET    /api/dep/deployments?project=X        list deployments for project
  POST   /api/dep/deployments                  create deployment
  GET    /api/dep/deployments/:id              deployment detail + summary
  PATCH  /api/dep/deployments/:id              update deployment
  PATCH  /api/dep/deployments/:id/status       advance status

Devices:
  GET    /api/dep/deployments/:id/devices      list devices
  POST   /api/dep/deployments/:id/devices      add device
  PATCH  /api/dep/devices/:did                 update device (status, scan, etc.)
  DELETE /api/dep/devices/:did                 remove device

Issues:
  GET    /api/dep/deployments/:id/issues       list issues
  POST   /api/dep/deployments/:id/issues       create issue
  PATCH  /api/dep/issues/:iid                  update issue

Photos:
  GET    /api/dep/deployments/:id/photos       list photos
  POST   /api/dep/deployments/:id/photos       add photo record
  PATCH  /api/dep/photos/:pid                  update photo

CT Verification:
  GET    /api/dep/devices/:did/ct              get CT verification
  POST   /api/dep/devices/:did/ct              create/update CT verification

Commissioning:
  GET    /api/dep/deployments/:id/commissioning list commissioning records
  GET    /api/dep/devices/:did/commissioning   get commissioning for device
  PATCH  /api/dep/commissioning/:cid           update commissioning record

Materials:
  GET    /api/dep/deployments/:id/materials    list materials
  PATCH  /api/dep/materials/:mid               update material

Safety:
  GET    /api/dep/deployments/:id/safety-holds list safety holds
  POST   /api/dep/deployments/:id/safety-holds create safety hold
  PATCH  /api/dep/safety-holds/:sid/release    release hold

Shutdowns:
  GET    /api/dep/deployments/:id/shutdowns    list shutdowns
  POST   /api/dep/deployments/:id/shutdowns    create shutdown
  PATCH  /api/dep/shutdowns/:sid               update shutdown

Closeout:
  GET    /api/dep/deployments/:id/closeout     list closeout requirements
  PATCH  /api/dep/closeout/:cid               update requirement
  POST   /api/dep/deployments/:id/closeout/validate  run validation
  POST   /api/dep/deployments/:id/closeout/approve   approve & release to ops

Events:
  GET    /api/dep/deployments/:id/events       list event log
"""
import os
from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from app.extensions import db
from app.helpers.time_utils import now_ms as _now

dep_bp = Blueprint("dep", __name__, url_prefix="/api/dep")


def _col(tbl):
    """Get column names for raw table."""
    from sqlalchemy import text
    rows = db.session.execute(
        text("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS "
             "WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=:t ORDER BY ORDINAL_POSITION"),
        {"t": tbl}
    ).fetchall()
    return [r[0] for r in rows]


def _row_to_dict(row, keys):
    return dict(zip(keys, row))


def _tbl_list(tbl, where_col, where_val, order="id ASC"):
    from sqlalchemy import text
    cols = _col(tbl)
    rows = db.session.execute(
        text(f"SELECT * FROM `{tbl}` WHERE `{where_col}`=:v ORDER BY {order}"),
        {"v": where_val}
    ).fetchall()
    return [_row_to_dict(r, cols) for r in rows]


def _tbl_get(tbl, row_id):
    from sqlalchemy import text
    cols = _col(tbl)
    row = db.session.execute(
        text(f"SELECT * FROM `{tbl}` WHERE id=:v LIMIT 1"),
        {"v": row_id}
    ).fetchone()
    return _row_to_dict(row, cols) if row else None


def _tbl_patch(tbl, row_id, data, extra=None):
    from sqlalchemy import text
    allowed = set(_col(tbl)) - {"id", "createdAt"}
    updates = {k: v for k, v in data.items() if k in allowed}
    if extra:
        updates.update(extra)
    updates["updatedAt"] = _now()
    if not updates:
        return
    sets = ", ".join([f"`{k}`=:{k}" for k in updates])
    updates["__id"] = row_id
    db.session.execute(text(f"UPDATE `{tbl}` SET {sets} WHERE id=:__id"), updates)
    db.session.commit()


def _tbl_insert(tbl, data):
    from sqlalchemy import text
    allowed = set(_col(tbl)) - {"id"}
    row = {k: v for k, v in data.items() if k in allowed}
    row.setdefault("createdAt", _now())
    row.setdefault("updatedAt", _now())
    cols_str = ", ".join([f"`{k}`" for k in row])
    vals_str = ", ".join([f":{k}" for k in row])
    result = db.session.execute(
        text(f"INSERT INTO `{tbl}` ({cols_str}) VALUES ({vals_str})"),
        row
    )
    db.session.commit()
    return result.lastrowid


def _project_ok(project_id):
    """Check if current user has access to this project."""
    from sqlalchemy import text
    row = db.session.execute(
        text("SELECT id FROM project WHERE id=:pid AND isDeleted=0 LIMIT 1"),
        {"pid": project_id}
    ).fetchone()
    return row is not None


def _dep_summary(dep_id):
    """Build KPI summary for a deployment."""
    from sqlalchemy import text

    devices = db.session.execute(
        text("SELECT id, status, progress_pct, comms_verified, photos_complete, scan_verified, location_verified FROM deployment_device WHERE deployment_id=:d"),
        {"d": dep_id}
    ).fetchall()

    total = len(devices)
    installed = sum(1 for d in devices if d[1] in ("Installed", "CT Verified", "Communications Verified", "Commissioned"))
    commissioned = sum(1 for d in devices if d[1] == "Commissioned")
    in_progress = sum(1 for d in devices if d[1] == "In Progress")
    pending = sum(1 for d in devices if d[1] == "Pending")

    issues = db.session.execute(
        text("SELECT COUNT(*) FROM dep_issue WHERE deployment_id=:d AND status != 'Resolved'"),
        {"d": dep_id}
    ).scalar() or 0

    safety_holds = db.session.execute(
        text("SELECT COUNT(*) FROM dep_safety_hold WHERE deployment_id=:d AND status='Active'"),
        {"d": dep_id}
    ).scalar() or 0

    progress_pct = int((commissioned / total * 100)) if total > 0 else 0

    events = db.session.execute(
        text("SELECT event_type, device_id, user_id, createdAt FROM dep_event WHERE deployment_id=:d ORDER BY createdAt DESC LIMIT 10"),
        {"d": dep_id}
    ).fetchall()

    return {
        "total_devices": total,
        "installed": installed,
        "commissioned": commissioned,
        "in_progress": in_progress,
        "pending": pending,
        "open_issues": issues,
        "safety_holds": safety_holds,
        "progress_pct": progress_pct,
        "recent_events": [
            {"event_type": e[0], "device_id": e[1], "user_id": e[2], "ts": e[3]}
            for e in events
        ],
    }


def _log_event(dep_id, event_type, device_id=None, payload=None):
    from sqlalchemy import text
    db.session.execute(
        text("INSERT INTO dep_event (deployment_id, event_type, device_id, user_id, payload, createdAt) "
             "VALUES (:d, :et, :dev, :u, :p, :ts)"),
        {
            "d": dep_id,
            "et": event_type,
            "dev": device_id,
            "u": current_user.id if current_user.is_authenticated else None,
            "p": str(payload) if payload else None,
            "ts": _now(),
        }
    )
    db.session.commit()


# ─── Deployments ─────────────────────────────────────────────────────────────

@dep_bp.route("/deployments", methods=["GET"])
@login_required
def list_deployments():
    project_id = request.args.get("project", type=int)
    if not project_id:
        return jsonify({"error": "project required"}), 400

    from sqlalchemy import text
    cols = _col("deployment")
    rows = db.session.execute(
        text("SELECT * FROM deployment WHERE project_id=:pid AND is_deleted=0 ORDER BY id DESC"),
        {"pid": project_id}
    ).fetchall()
    items = [_row_to_dict(r, cols) for r in rows]
    return jsonify({"meta": {"total": len(items)}, "response": items})


@dep_bp.route("/deployments", methods=["POST"])
@login_required
def create_deployment():
    data = request.get_json() or {}
    project_id = data.get("project_id")
    if not project_id:
        return jsonify({"error": "project_id required"}), 400
    if not _project_ok(project_id):
        return jsonify({"error": "Not found"}), 404

    from sqlalchemy import text
    count = db.session.execute(
        text("SELECT COUNT(*) FROM deployment WHERE project_id=:p AND is_deleted=0"),
        {"p": project_id}
    ).scalar() or 0
    dep_num = "DEP-{:04d}".format(count + 1)

    row_id = _tbl_insert("deployment", {
        "project_id": project_id,
        "site_id": data.get("site_id"),
        "org_id": data.get("org_id"),
        "deployment_number": dep_num,
        "deployment_name": data.get("deployment_name", ""),
        "status": "not_started",
        "notes": data.get("notes", ""),
        "is_deleted": 0,
    })
    _log_event(row_id, "DEPLOYMENT_CREATED")
    return jsonify({"response": _tbl_get("deployment", row_id)}), 201


@dep_bp.route("/deployments/<int:dep_id>", methods=["GET"])
@login_required
def get_deployment(dep_id):
    from sqlalchemy import text as _text
    dep = _tbl_get("deployment", dep_id)
    if not dep:
        return jsonify({"error": "Not found"}), 404
    dep["summary"] = _dep_summary(dep_id)

    # Enrich with site info
    if dep.get("site_id"):
        site = db.session.execute(
            _text("SELECT name, address, city, state, zip, utility, status FROM site WHERE id=:s AND is_deleted=0 LIMIT 1"),
            {"s": dep["site_id"]}
        ).fetchone()
        if site:
            dep["site_info"] = {
                "name": site[0], "address": site[1], "city": site[2],
                "state": site[3], "zip": site[4], "utility": site[5], "status": site[6],
            }

    # Enrich with project info
    if dep.get("project_id"):
        proj = db.session.execute(
            _text("SELECT name, location, startDate FROM project WHERE id=:p AND isDeleted=0 LIMIT 1"),
            {"p": dep["project_id"]}
        ).fetchone()
        if proj:
            dep["project_info"] = {"name": proj[0], "location": proj[1], "start_date": proj[2]}

    # PM and field lead names
    for uid_key, name_key in [("project_manager_id", "pm_name"), ("field_lead_id", "field_lead_name")]:
        uid = dep.get(uid_key)
        if uid:
            u = db.session.execute(
                _text("SELECT firstName, lastName, email FROM user WHERE id=:u LIMIT 1"),
                {"u": uid}
            ).fetchone()
            if u:
                first, last, email = u[0] or "", u[1] or "", u[2] or ""
                dep[name_key] = f"{first} {last}".strip() or email
        else:
            dep[name_key] = None

    # Photos count
    dep["photos_count"] = db.session.execute(
        _text("SELECT COUNT(*) FROM dep_photo WHERE deployment_id=:d"),
        {"d": dep_id}
    ).scalar() or 0

    return jsonify({"response": dep})


@dep_bp.route("/deployments/<int:dep_id>", methods=["PATCH"])
@login_required
def update_deployment(dep_id):
    dep = _tbl_get("deployment", dep_id)
    if not dep:
        return jsonify({"error": "Not found"}), 404
    data = request.get_json() or {}
    _tbl_patch("deployment", dep_id, data)
    return jsonify({"response": _tbl_get("deployment", dep_id)})


@dep_bp.route("/deployments/<int:dep_id>/status", methods=["PATCH"])
@login_required
def advance_status(dep_id):
    dep = _tbl_get("deployment", dep_id)
    if not dep:
        return jsonify({"error": "Not found"}), 404
    data = request.get_json() or {}
    new_status = data.get("status", "")
    valid = ("not_started", "scheduled", "installing", "commissioning", "awaiting_approval", "activated", "on_hold", "closed")
    if new_status not in valid:
        return jsonify({"error": "Invalid status"}), 400
    extra = {"updatedAt": _now()}
    if new_status == "installing":
        extra["started_at"] = _now()
    elif new_status in ("activated", "closed"):
        extra["completed_at"] = _now()
    _tbl_patch("deployment", dep_id, {"status": new_status}, extra)
    _log_event(dep_id, f"STATUS_CHANGED_{new_status.upper()}")
    return jsonify({"response": _tbl_get("deployment", dep_id)})


# ─── Devices ─────────────────────────────────────────────────────────────────

@dep_bp.route("/deployments/<int:dep_id>/devices", methods=["GET"])
@login_required
def list_dep_devices(dep_id):
    items = _tbl_list("deployment_device", "deployment_id", dep_id)
    return jsonify({"meta": {"total": len(items)}, "response": items})


@dep_bp.route("/deployments/<int:dep_id>/devices", methods=["POST"])
@login_required
def add_dep_device(dep_id):
    data = request.get_json() or {}
    row_id = _tbl_insert("deployment_device", {
        "deployment_id": dep_id,
        "device_name": data.get("device_name", ""),
        "device_type": data.get("device_type", "APF"),
        "planned_label": data.get("planned_label", ""),
        "location": data.get("location", ""),
        "breaker_req": data.get("breaker_req", ""),
        "ct_req": data.get("ct_req"),
        "expected_model": data.get("expected_model", ""),
        "expected_serial": data.get("expected_serial", ""),
        "status": "Pending",
        "progress_pct": 0,
    })
    _log_event(dep_id, "DEVICE_ADDED", row_id)
    return jsonify({"response": _tbl_get("deployment_device", row_id)}), 201


@dep_bp.route("/devices/<int:did>", methods=["PATCH"])
@login_required
def update_dep_device(did):
    dev = _tbl_get("deployment_device", did)
    if not dev:
        return jsonify({"error": "Not found"}), 404
    data = request.get_json() or {}

    extra = {}
    new_status = data.get("status")
    if new_status == "Installed" and not dev.get("installed_at"):
        extra["installed_at"] = _now()
    elif new_status == "Commissioned" and not dev.get("commissioned_at"):
        extra["commissioned_at"] = _now()
        extra["commissioned_by"] = current_user.id if current_user.is_authenticated else None

    _tbl_patch("deployment_device", did, data, extra)

    if new_status:
        _log_event(dev["deployment_id"], f"DEVICE_{new_status.upper().replace(' ', '_')}", did)

    return jsonify({"response": _tbl_get("deployment_device", did)})


@dep_bp.route("/devices/<int:did>", methods=["DELETE"])
@login_required
def delete_dep_device(did):
    from sqlalchemy import text
    db.session.execute(text("DELETE FROM deployment_device WHERE id=:id"), {"id": did})
    db.session.commit()
    return jsonify({"response": {"id": did}})


# ─── Issues ──────────────────────────────────────────────────────────────────

@dep_bp.route("/deployments/<int:dep_id>/issues", methods=["GET"])
@login_required
def list_issues(dep_id):
    items = _tbl_list("dep_issue", "deployment_id", dep_id, order="createdAt DESC")
    return jsonify({"meta": {"total": len(items)}, "response": items})


@dep_bp.route("/deployments/<int:dep_id>/issues", methods=["POST"])
@login_required
def create_issue(dep_id):
    data = request.get_json() or {}
    from sqlalchemy import text
    count = db.session.execute(
        text("SELECT COUNT(*) FROM dep_issue WHERE deployment_id=:d"), {"d": dep_id}
    ).scalar() or 0
    issue_num = "ISS-{:03d}".format(count + 1)
    row_id = _tbl_insert("dep_issue", {
        "deployment_id": dep_id,
        "project_id": data.get("project_id"),
        "device_id": data.get("device_id"),
        "issue_number": issue_num,
        "title": data.get("title", ""),
        "description": data.get("description", ""),
        "priority": data.get("priority", "Medium"),
        "status": "Open",
        "impact_level": data.get("impact_level", "Documentation Only"),
        "created_by": current_user.id if current_user.is_authenticated else None,
    })
    _log_event(dep_id, "ISSUE_CREATED", data.get("device_id"))
    return jsonify({"response": _tbl_get("dep_issue", row_id)}), 201


@dep_bp.route("/issues/<int:iid>", methods=["PATCH"])
@login_required
def update_issue(iid):
    issue = _tbl_get("dep_issue", iid)
    if not issue:
        return jsonify({"error": "Not found"}), 404
    data = request.get_json() or {}
    extra = {}
    if data.get("status") == "Resolved" and not issue.get("resolved_at"):
        extra["resolved_at"] = _now()
    _tbl_patch("dep_issue", iid, data, extra)
    updated = _tbl_get("dep_issue", iid)
    if data.get("status") == "Resolved":
        _log_event(issue["deployment_id"], "ISSUE_RESOLVED", issue.get("device_id"))
    return jsonify({"response": updated})


# ─── Photos ──────────────────────────────────────────────────────────────────

@dep_bp.route("/deployments/<int:dep_id>/photos", methods=["GET"])
@login_required
def list_photos(dep_id):
    device_id = request.args.get("device_id", type=int)
    from sqlalchemy import text
    cols = _col("dep_photo")
    if device_id:
        rows = db.session.execute(
            text("SELECT * FROM dep_photo WHERE deployment_id=:d AND device_id=:dev ORDER BY createdAt DESC"),
            {"d": dep_id, "dev": device_id}
        ).fetchall()
    else:
        rows = db.session.execute(
            text("SELECT * FROM dep_photo WHERE deployment_id=:d ORDER BY createdAt DESC"),
            {"d": dep_id}
        ).fetchall()
    items = [_row_to_dict(r, cols) for r in rows]
    return jsonify({"meta": {"total": len(items)}, "response": items})


@dep_bp.route("/deployments/<int:dep_id>/photos", methods=["POST"])
@login_required
def add_photo(dep_id):
    data = request.get_json() or {}
    row_id = _tbl_insert("dep_photo", {
        "deployment_id": dep_id,
        "project_id": data.get("project_id"),
        "device_id": data.get("device_id"),
        "issue_id": data.get("issue_id"),
        "photo_type": data.get("photo_type", "Installation"),
        "file_url": data.get("file_url", ""),
        "description": data.get("description", ""),
        "uploaded_by": current_user.id if current_user.is_authenticated else None,
        "gps_lat": data.get("gps_lat"),
        "gps_lng": data.get("gps_lng"),
        "status": "Active",
    })
    _log_event(dep_id, "PHOTO_UPLOADED", data.get("device_id"))
    return jsonify({"response": _tbl_get("dep_photo", row_id)}), 201


@dep_bp.route("/photos/<int:pid>", methods=["PATCH"])
@login_required
def update_photo(pid):
    photo = _tbl_get("dep_photo", pid)
    if not photo:
        return jsonify({"error": "Not found"}), 404
    data = request.get_json() or {}
    _tbl_patch("dep_photo", pid, data)
    return jsonify({"response": _tbl_get("dep_photo", pid)})


# ─── CT Verification ─────────────────────────────────────────────────────────

@dep_bp.route("/devices/<int:did>/ct", methods=["GET"])
@login_required
def get_ct(did):
    from sqlalchemy import text
    cols = _col("dep_ct_verification")
    rows = db.session.execute(
        text("SELECT * FROM dep_ct_verification WHERE device_id=:d ORDER BY id DESC"),
        {"d": did}
    ).fetchall()
    items = [_row_to_dict(r, cols) for r in rows]
    return jsonify({"response": items})


@dep_bp.route("/devices/<int:did>/ct", methods=["POST"])
@login_required
def upsert_ct(did):
    data = request.get_json() or {}
    dev = _tbl_get("deployment_device", did)
    dep_id = dev["deployment_id"] if dev else data.get("deployment_id")
    all_verified = (
        data.get("p1_verified") and data.get("p2_verified") and data.get("orientation_verified")
    )
    row_id = _tbl_insert("dep_ct_verification", {
        "deployment_id": dep_id,
        "device_id": did,
        "ct_ratio_eng": data.get("ct_ratio_eng", ""),
        "ct_ratio_installed": data.get("ct_ratio_installed", ""),
        "ct_amp_rating": data.get("ct_amp_rating", ""),
        "phase_assignment": data.get("phase_assignment", ""),
        "p1_verified": 1 if data.get("p1_verified") else 0,
        "p2_verified": 1 if data.get("p2_verified") else 0,
        "orientation_verified": 1 if data.get("orientation_verified") else 0,
        "verified_by": current_user.id if current_user.is_authenticated else None,
        "verified_at": _now() if all_verified else None,
        "status": "Verified" if all_verified else "In Progress",
        "notes": data.get("notes", ""),
    })
    if all_verified and dev:
        _tbl_patch("deployment_device", did, {"status": "CT Verified"})
        _log_event(dep_id, "CT_VERIFIED", did)
    return jsonify({"response": _tbl_get("dep_ct_verification", row_id)}), 201


# ─── Commissioning ───────────────────────────────────────────────────────────

@dep_bp.route("/deployments/<int:dep_id>/commissioning", methods=["GET"])
@login_required
def list_commissioning(dep_id):
    items = _tbl_list("dep_commissioning", "deployment_id", dep_id)
    return jsonify({"meta": {"total": len(items)}, "response": items})


@dep_bp.route("/devices/<int:did>/commissioning", methods=["GET"])
@login_required
def get_commissioning(did):
    from sqlalchemy import text
    cols = _col("dep_commissioning")
    row = db.session.execute(
        text("SELECT * FROM dep_commissioning WHERE device_id=:d ORDER BY id DESC LIMIT 1"),
        {"d": did}
    ).fetchone()
    return jsonify({"response": _row_to_dict(row, cols) if row else None})


@dep_bp.route("/devices/<int:did>/commissioning", methods=["POST"])
@login_required
def start_commissioning(did):
    dev = _tbl_get("deployment_device", did)
    if not dev:
        return jsonify({"error": "Device not found"}), 404
    dep_id = dev["deployment_id"]
    from sqlalchemy import text
    existing = db.session.execute(
        text("SELECT id FROM dep_commissioning WHERE device_id=:d LIMIT 1"), {"d": did}
    ).fetchone()
    if existing:
        return jsonify({"response": _tbl_get("dep_commissioning", existing[0])})
    row_id = _tbl_insert("dep_commissioning", {
        "deployment_id": dep_id,
        "device_id": did,
        "status": "In Progress",
    })
    _tbl_patch("deployment_device", did, {"status": "In Progress"})
    return jsonify({"response": _tbl_get("dep_commissioning", row_id)}), 201


@dep_bp.route("/commissioning/<int:cid>", methods=["PATCH"])
@login_required
def update_commissioning(cid):
    rec = _tbl_get("dep_commissioning", cid)
    if not rec:
        return jsonify({"error": "Not found"}), 404
    data = request.get_json() or {}
    extra = {}
    all_done = (
        data.get("pre_checks_done", rec.get("pre_checks_done")) and
        data.get("power_up_done", rec.get("power_up_done")) and
        data.get("comms_verified", rec.get("comms_verified")) and
        data.get("portal_verified", rec.get("portal_verified")) and
        data.get("no_active_alarms", rec.get("no_active_alarms")) and
        data.get("photos_complete", rec.get("photos_complete")) and
        data.get("docs_complete", rec.get("docs_complete"))
    )
    if all_done or data.get("status") == "Commissioned":
        extra["status"] = "Commissioned"
        extra["commissioned_by"] = current_user.id if current_user.is_authenticated else None
        extra["commissioned_at"] = _now()
    _tbl_patch("dep_commissioning", cid, data, extra)
    if extra.get("status") == "Commissioned":
        _tbl_patch("deployment_device", rec["device_id"], {
            "status": "Commissioned",
            "commissioned_at": _now(),
            "commissioned_by": current_user.id if current_user.is_authenticated else None,
        })
        _log_event(rec["deployment_id"], "COMMISSIONING_COMPLETED", rec["device_id"])
    return jsonify({"response": _tbl_get("dep_commissioning", cid)})


# ─── Materials ───────────────────────────────────────────────────────────────

@dep_bp.route("/deployments/<int:dep_id>/materials", methods=["GET"])
@login_required
def list_materials(dep_id):
    items = _tbl_list("dep_material", "deployment_id", dep_id)
    return jsonify({"meta": {"total": len(items)}, "response": items})


@dep_bp.route("/deployments/<int:dep_id>/materials", methods=["POST"])
@login_required
def add_material(dep_id):
    data = request.get_json() or {}
    row_id = _tbl_insert("dep_material", {
        "deployment_id": dep_id,
        "item_type": data.get("item_type", ""),
        "item_label": data.get("item_label", ""),
        "expected_qty": data.get("expected_qty", 0),
        "delivered_qty": data.get("delivered_qty", 0),
        "installed_qty": data.get("installed_qty", 0),
        "status": "Pending",
    })
    return jsonify({"response": _tbl_get("dep_material", row_id)}), 201


@dep_bp.route("/materials/<int:mid>", methods=["PATCH"])
@login_required
def update_material(mid):
    mat = _tbl_get("dep_material", mid)
    if not mat:
        return jsonify({"error": "Not found"}), 404
    data = request.get_json() or {}
    _tbl_patch("dep_material", mid, data)
    return jsonify({"response": _tbl_get("dep_material", mid)})


# ─── Safety Holds ────────────────────────────────────────────────────────────

@dep_bp.route("/deployments/<int:dep_id>/safety-holds", methods=["GET"])
@login_required
def list_safety_holds(dep_id):
    items = _tbl_list("dep_safety_hold", "deployment_id", dep_id, order="createdAt DESC")
    return jsonify({"meta": {"total": len(items)}, "response": items})


@dep_bp.route("/deployments/<int:dep_id>/safety-holds", methods=["POST"])
@login_required
def create_safety_hold(dep_id):
    data = request.get_json() or {}
    row_id = _tbl_insert("dep_safety_hold", {
        "deployment_id": dep_id,
        "device_id": data.get("device_id"),
        "reason": data.get("reason", ""),
        "description": data.get("description", ""),
        "status": "Active",
        "created_by": current_user.id if current_user.is_authenticated else None,
    })
    _log_event(dep_id, "SAFETY_HOLD_CREATED", data.get("device_id"))
    return jsonify({"response": _tbl_get("dep_safety_hold", row_id)}), 201


@dep_bp.route("/safety-holds/<int:sid>/release", methods=["PATCH"])
@login_required
def release_safety_hold(sid):
    hold = _tbl_get("dep_safety_hold", sid)
    if not hold:
        return jsonify({"error": "Not found"}), 404
    _tbl_patch("dep_safety_hold", sid, {}, {
        "status": "Released",
        "released_by": current_user.id if current_user.is_authenticated else None,
        "released_at": _now(),
    })
    _log_event(hold["deployment_id"], "SAFETY_HOLD_RELEASED")
    return jsonify({"response": _tbl_get("dep_safety_hold", sid)})


# ─── Shutdowns ───────────────────────────────────────────────────────────────

@dep_bp.route("/deployments/<int:dep_id>/shutdowns", methods=["GET"])
@login_required
def list_shutdowns(dep_id):
    items = _tbl_list("dep_shutdown", "deployment_id", dep_id)
    return jsonify({"meta": {"total": len(items)}, "response": items})


@dep_bp.route("/deployments/<int:dep_id>/shutdowns", methods=["POST"])
@login_required
def create_shutdown(dep_id):
    data = request.get_json() or {}
    row_id = _tbl_insert("dep_shutdown", {
        "deployment_id": dep_id,
        "device_id": data.get("device_id"),
        "shutdown_required": 1 if data.get("shutdown_required") else 0,
        "window_start": data.get("window_start", ""),
        "window_end": data.get("window_end", ""),
        "customer_contact": data.get("customer_contact", ""),
        "approval_doc": data.get("approval_doc", ""),
        "status": "Pending",
        "notes": data.get("notes", ""),
    })
    return jsonify({"response": _tbl_get("dep_shutdown", row_id)}), 201


@dep_bp.route("/shutdowns/<int:sid>", methods=["PATCH"])
@login_required
def update_shutdown(sid):
    sd = _tbl_get("dep_shutdown", sid)
    if not sd:
        return jsonify({"error": "Not found"}), 404
    data = request.get_json() or {}
    _tbl_patch("dep_shutdown", sid, data)
    return jsonify({"response": _tbl_get("dep_shutdown", sid)})


# ─── Events ──────────────────────────────────────────────────────────────────

@dep_bp.route("/deployments/<int:dep_id>/events", methods=["GET"])
@login_required
def list_events(dep_id):
    from sqlalchemy import text
    cols = _col("dep_event")
    limit = request.args.get("limit", 50, type=int)
    rows = db.session.execute(
        text("SELECT * FROM dep_event WHERE deployment_id=:d ORDER BY createdAt DESC LIMIT :lim"),
        {"d": dep_id, "lim": limit}
    ).fetchall()
    items = [_row_to_dict(r, cols) for r in rows]
    return jsonify({"meta": {"total": len(items)}, "response": items})


# ─── Closeout ────────────────────────────────────────────────────────────────

@dep_bp.route("/deployments/<int:dep_id>/closeout", methods=["GET"])
@login_required
def list_closeout(dep_id):
    items = _tbl_list("dep_closeout", "deployment_id", dep_id)
    return jsonify({"meta": {"total": len(items)}, "response": items})


@dep_bp.route("/closeout/<int:cid>", methods=["PATCH"])
@login_required
def update_closeout(cid):
    req = _tbl_get("dep_closeout", cid)
    if not req:
        return jsonify({"error": "Not found"}), 404
    data = request.get_json() or {}
    extra = {}
    if data.get("status") == "Complete" and not req.get("completed_at"):
        extra["completed_at"] = _now()
        extra["completed_by"] = current_user.id if current_user.is_authenticated else None
    _tbl_patch("dep_closeout", cid, data, extra)
    return jsonify({"response": _tbl_get("dep_closeout", cid)})


@dep_bp.route("/deployments/<int:dep_id>/closeout/validate", methods=["POST"])
@login_required
def validate_closeout(dep_id):
    from sqlalchemy import text

    blockers = []

    # Check for uncommissioned devices
    uncommissioned = db.session.execute(
        text("SELECT COUNT(*) FROM deployment_device WHERE deployment_id=:d AND status != 'Commissioned'"),
        {"d": dep_id}
    ).scalar() or 0
    if uncommissioned:
        blockers.append({"type": "Uncommissioned Devices", "count": uncommissioned})

    # Check for open issues
    open_issues = db.session.execute(
        text("SELECT COUNT(*) FROM dep_issue WHERE deployment_id=:d AND status NOT IN ('Resolved')"),
        {"d": dep_id}
    ).scalar() or 0
    if open_issues:
        blockers.append({"type": "Open Issues", "count": open_issues})

    # Check for active safety holds
    safety_holds = db.session.execute(
        text("SELECT COUNT(*) FROM dep_safety_hold WHERE deployment_id=:d AND status='Active'"),
        {"d": dep_id}
    ).scalar() or 0
    if safety_holds:
        blockers.append({"type": "Safety Holds Active", "count": safety_holds})

    # Check photos exist
    photo_count = db.session.execute(
        text("SELECT COUNT(*) FROM dep_photo WHERE deployment_id=:d"), {"d": dep_id}
    ).scalar() or 0
    if photo_count == 0:
        blockers.append({"type": "No Photos", "count": 0})

    # Check PM sign-off
    dep = _tbl_get("deployment", dep_id)
    if not (dep and dep.get("pm_signed_at")):
        blockers.append({"type": "PM Sign-Off Required", "count": 0})

    can_close = len(blockers) == 0
    return jsonify({
        "can_close": can_close,
        "blockers": blockers,
        "message": "Ready to close" if can_close else "Blockers must be resolved first",
    })


@dep_bp.route("/deployments/<int:dep_id>/closeout/approve", methods=["POST"])
@login_required
def approve_closeout(dep_id):
    from sqlalchemy import text

    validate = validate_closeout(dep_id)
    result = validate.get_json()
    if not result.get("can_close"):
        return jsonify({"error": "Cannot approve — blockers exist", "blockers": result.get("blockers")}), 400

    _tbl_patch("deployment", dep_id, {"status": "activated"}, {
        "activated_at": _now(),
        "completed_at": _now(),
    })
    _log_event(dep_id, "DEPLOYMENT_RELEASED_TO_OPERATIONS")
    return jsonify({"response": {"message": "Deployment released to operations", "status": "activated"}})


# ─── Project Manager Assignment ──────────────────────────────────────────────

@dep_bp.route("/deployments/<int:dep_id>/assign-pm", methods=["PATCH"])
@login_required
def assign_pm(dep_id):
    """
    Assign a Project Manager to a deployment.
    Restricted to Synerex Admin (8) and OEM Admin (9).
    """
    from app.helpers.roles import ROLE
    user_role = getattr(current_user, "role", None)
    if user_role not in (ROLE.SYNEREX_ADMIN, ROLE.OEM_ADMIN):
        return jsonify({"error": "Only OEM Admins and Platform Admins can assign a Project Manager"}), 403

    dep = _tbl_get("deployment", dep_id)
    if not dep:
        return jsonify({"error": "Not found"}), 404

    data = request.get_json() or {}
    pm_id = data.get("project_manager_id")
    if not pm_id:
        return jsonify({"error": "project_manager_id required"}), 400

    # Verify the user being assigned exists and is role 14 (PM), 9 (OEM Admin), or 8 (Platform Admin)
    from sqlalchemy import text
    pm_user = db.session.execute(
        text("SELECT id, role, email FROM user WHERE id=:uid LIMIT 1"),
        {"uid": pm_id}
    ).fetchone()
    if not pm_user:
        return jsonify({"error": "User not found"}), 404

    allowed_pm_roles = (ROLE.PROJECT_MANAGER, ROLE.SYNEREX_ADMIN, ROLE.OEM_ADMIN, ROLE.ENGINEERING)
    if pm_user[1] not in allowed_pm_roles:
        return jsonify({"error": "User does not have a Project Manager role"}), 400

    _tbl_patch("deployment", dep_id, {"project_manager_id": pm_id})
    _log_event(dep_id, "PM_ASSIGNED", payload={"pm_id": pm_id})
    return jsonify({"response": _tbl_get("deployment", dep_id)})


@dep_bp.route("/deployments/<int:dep_id>/pm-signoff", methods=["POST"])
@login_required
def pm_signoff(dep_id):
    """
    Project Manager digitally signs off on a deployment before Release to Operations.
    Restricted to: Project Manager (14), OEM Admin (9), Synerex Admin (8), Engineering (5).
    """
    from app.helpers.roles import ROLE
    user_role = getattr(current_user, "role", None)
    allowed = (ROLE.PROJECT_MANAGER, ROLE.SYNEREX_ADMIN, ROLE.OEM_ADMIN, ROLE.ENGINEERING)
    if user_role not in allowed:
        return jsonify({"error": "Only Project Managers or Admins can sign off on a deployment"}), 403

    dep = _tbl_get("deployment", dep_id)
    if not dep:
        return jsonify({"error": "Not found"}), 404

    if dep.get("pm_signed_at"):
        return jsonify({"error": "Deployment already has PM sign-off"}), 400

    data = request.get_json() or {}
    notes = data.get("notes", "")
    signature = data.get("signature", "")

    if not signature:
        return jsonify({"error": "signature is required (typed name or PIN)"}), 400

    import hashlib
    sig_hash = hashlib.sha256((str(current_user.id) + signature + str(_now())).encode()).hexdigest()[:32]

    _tbl_patch("deployment", dep_id, {}, {
        "pm_signed_by": current_user.id if current_user.is_authenticated else None,
        "pm_signed_at": _now(),
        "pm_approval_notes": notes,
        "pm_signature": sig_hash,
    })
    _log_event(dep_id, "PM_SIGNED_OFF", payload={"notes": notes})
    return jsonify({"response": _tbl_get("deployment", dep_id)})


@dep_bp.route("/deployments/<int:dep_id>/pm-signoff", methods=["DELETE"])
@login_required
def revoke_pm_signoff(dep_id):
    """Revoke PM sign-off. Synerex Admin only."""
    from app.helpers.roles import ROLE
    if getattr(current_user, "role", None) != ROLE.SYNEREX_ADMIN:
        return jsonify({"error": "Only Platform Admin can revoke PM sign-off"}), 403
    _tbl_patch("deployment", dep_id, {}, {
        "pm_signed_by": None,
        "pm_signed_at": None,
        "pm_approval_notes": None,
        "pm_signature": None,
    })
    _log_event(dep_id, "PM_SIGNOFF_REVOKED")
    return jsonify({"response": _tbl_get("deployment", dep_id)})


@dep_bp.route("/users/pm-eligible", methods=["GET"])
@login_required
def pm_eligible_users():
    """
    Return list of users eligible to be assigned as PM.
    Restricted to OEM Admin and Synerex Admin.
    """
    from app.helpers.roles import ROLE
    user_role = getattr(current_user, "role", None)
    if user_role not in (ROLE.SYNEREX_ADMIN, ROLE.OEM_ADMIN):
        return jsonify({"error": "Insufficient permissions"}), 403

    from sqlalchemy import text
    allowed_roles = (ROLE.PROJECT_MANAGER, ROLE.ENGINEERING, ROLE.OEM_ADMIN, ROLE.SYNEREX_ADMIN)
    placeholders = ",".join([str(r) for r in allowed_roles])
    rows = db.session.execute(
        text("SELECT id, email, firstName, lastName, role FROM user WHERE role IN (" + placeholders + ") AND isDeleted=0 ORDER BY lastName, firstName"),
    ).fetchall()
    users = []
    for r in rows:
        users.append({
            "id": r[0],
            "email": r[1],
            "firstName": r[2],
            "lastName": r[3],
            "role": r[4],
            "name": ((r[2] or "") + " " + (r[3] or "")).strip() or r[1],
        })
    return jsonify({"meta": {"total": len(users)}, "response": users})


# ─── Summary ─────────────────────────────────────────────────────────────────

@dep_bp.route("/deployments/<int:dep_id>/summary", methods=["GET"])
@login_required
def get_summary(dep_id):
    dep = _tbl_get("deployment", dep_id)
    if not dep:
        return jsonify({"error": "Not found"}), 404
    return jsonify({"response": _dep_summary(dep_id)})
