"""
internal_routes.py — Machine-to-machine API for the Xeco Deployment Scanner.
All endpoints require X-Internal-Token header matching INTERNAL_API_TOKEN env var.
"""
import os
import time
from datetime import datetime, timezone

from flask import Blueprint, jsonify, request
from app.db.request_session import get_session

internal_bp = Blueprint("internal", __name__)

INTERNAL_TOKEN = os.environ.get("INTERNAL_API_TOKEN", "")
COMM_WINDOW_MS = int(os.environ.get("DEPLOY_COMM_WINDOW_HOURS", 24)) * 3600 * 1000


def _auth():
    """Return 401 if token missing or wrong."""
    token = request.headers.get("X-Internal-Token", "")
    if not INTERNAL_TOKEN or token != INTERNAL_TOKEN:
        return jsonify({"error": "Unauthorized"}), 401
    return None


# ── Register a scanned device into tracking tables ────────────────────────────

@internal_bp.post("/api/internal/devices/register")
def register_device():
    """
    Called by deploy app when crew scans a device barcode on site.
    Inserts into switch + meter tables (or gateway) so tracking starts watching.

    Body:
      project_id  int
      mac_address str   (e.g. "B8:27:EB:74:81:B2")
      name        str   (e.g. "MDP-01 Main Bus")
      device_type int   1 = ECBS/APF switch  (default)
      table       str   "switch_and_meter" | "gateway"  (default: switch_and_meter)
    """
    err = _auth()
    if err:
        return err

    data       = request.get_json(force=True) or {}
    project_id = data.get("project_id")
    mac        = (data.get("mac_address") or "").strip().upper()
    name       = data.get("name") or mac
    dev_type   = int(data.get("device_type") or 1)
    table      = data.get("table", "switch_and_meter")

    if not project_id or not mac:
        return jsonify({"error": "project_id and mac_address required"}), 400

    sess    = get_session()
    result  = {}

    try:
        now_ms = int(time.time() * 1000)

        if table == "gateway":
            from app.models.gateway import Gateway
            existing = sess.query(Gateway).filter_by(
                deviceId=mac, project=project_id, isDeleted=False
            ).first()
            if not existing:
                gw = Gateway(deviceId=mac, name=name, project=project_id)
                sess.add(gw)
                sess.flush()
                result["gateway_id"] = gw.id
            else:
                result["gateway_id"] = existing.id
        else:
            from app.models.switch import Switch
            from app.models.meter import Meter

            existing_sw = sess.query(Switch).filter_by(
                deviceId=mac, project=project_id, isDeleted=False
            ).first()
            if not existing_sw:
                sw = Switch(deviceId=mac, name=name, project=project_id, deviceType=dev_type)
                sess.add(sw)
                sess.flush()
                result["switch_id"] = sw.id
            else:
                result["switch_id"] = existing_sw.id

            existing_m = sess.query(Meter).filter_by(
                deviceId=mac, project=project_id, isDeleted=False
            ).first()
            if not existing_m:
                m = Meter(deviceId=mac, name=name, project=project_id)
                sess.add(m)
                sess.flush()
                result["meter_id"] = m.id
            else:
                result["meter_id"] = existing_m.id

        sess.commit()
        return jsonify({"ok": True, **result})

    except Exception as e:
        sess.rollback()
        return jsonify({"error": str(e)}), 500


# ── Communication status for a project ───────────────────────────────────────

@internal_bp.get("/api/internal/project/<int:project_id>/comm-status")
def comm_status(project_id):
    """
    Returns which MACs belonging to this project have communicated recently.
    Deploy app polls this to show per-device "communicating ✓" badges.
    """
    err = _auth()
    if err:
        return err

    cutoff_ms = int(time.time() * 1000) - COMM_WINDOW_MS
    sess      = get_session()

    from app.models.switch import Switch
    from app.models.meter  import Meter
    from app.models.gateway import Gateway

    devices = []

    for sw in sess.query(Switch).filter_by(project=project_id, isDeleted=False).all():
        comm = sw.lastCommunicatedAt and sw.lastCommunicatedAt > cutoff_ms
        devices.append({
            "mac": sw.deviceId, "name": sw.name or sw.deviceId, "table": "switch", "id": sw.id,
            "communicating": bool(comm),
            "last_seen_ms": sw.lastCommunicatedAt,
        })

    for m in sess.query(Meter).filter_by(project=project_id, isDeleted=False).all():
        comm = m.lastCommunicatedAt and m.lastCommunicatedAt > cutoff_ms
        # Skip if same MAC already listed from switch query
        if not any(d["mac"] == m.deviceId for d in devices):
            devices.append({
                "mac": m.deviceId, "name": m.name or m.deviceId, "table": "meter", "id": m.id,
                "communicating": bool(comm),
                "last_seen_ms": m.lastCommunicatedAt,
            })

    for gw in sess.query(Gateway).filter_by(project=project_id, isDeleted=False).all():
        comm = gw.lastCommunicatedAt and gw.lastCommunicatedAt > (cutoff_ms / 1000)
        devices.append({
            "mac": gw.deviceId, "name": gw.name or gw.deviceId, "table": "gateway", "id": gw.id,
            "communicating": bool(comm),
            "last_seen_ms": int(gw.lastCommunicatedAt * 1000) if gw.lastCommunicatedAt else None,
        })

    total        = len(devices)
    communicating = sum(1 for d in devices if d["communicating"])

    return jsonify({
        "project_id": project_id,
        "total": total,
        "communicating": communicating,
        "all_confirmed": total > 0 and communicating == total,
        "devices": devices,
    })


# ── List projects (for deploy site-linking dropdown) ─────────────────────────

@internal_bp.get("/api/internal/projects")
def list_projects():
    """Returns all active projects so the deploy app can build a link dropdown."""
    err = _auth()
    if err:
        return err

    sess = get_session()
    from app.models.project import Project
    from app.models.client import Client

    rows = (
        sess.query(Project, Client)
        .join(Client, Client.id == Project.client)
        .filter(Project.isDeleted == False)
        .order_by(Project.id)
        .all()
    )
    return jsonify([{
        "id": p.id,
        "name": p.name,
        "location": p.location or "",
        "client": c.name,
        "placements": p.placements,
    } for p, c in rows])


# ── Mark installation confirmed ───────────────────────────────────────────────

@internal_bp.post("/api/internal/project/<int:project_id>/installation-confirmed")
def installation_confirmed(project_id):
    """
    Called by deploy app when ops admin confirms the installation.
    Sets installationConfirmedAt on the tracking project.
    """
    err = _auth()
    if err:
        return err

    sess = get_session()
    from app.models.project import Project

    proj = sess.query(Project).filter_by(id=project_id, isDeleted=False).first()
    if not proj:
        return jsonify({"error": "Project not found"}), 404

    try:
        proj.installationConfirmedAt = int(time.time() * 1000)
        sess.commit()
        return jsonify({"ok": True, "confirmedAt": proj.installationConfirmedAt})
    except Exception as e:
        sess.rollback()
        return jsonify({"error": str(e)}), 500
