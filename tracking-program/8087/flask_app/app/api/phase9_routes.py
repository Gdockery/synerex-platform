"""
Phase 9: Remaining integrations - Payment, DataSync, Maintenance, XECO, Dev.
Ported from api/controllers/web/payment, datasync, web/xeco/
"""
import json
import os
import platform
from pathlib import Path

from flask import Blueprint, current_app, jsonify, request, send_file
from flask_login import current_user, login_required

from app.extensions import db
from app.helpers.decorators import license_required, remote_maintainer
from app.models.project import Project, project_user
from app.models.service_plan import ServicePlan
from app.models.user import User
from app.helpers.project_access import user_has_project_access as _user_has_project_access
from app.models.xeco import CompanySettings

phase9_bp = Blueprint("phase9", __name__, url_prefix="")




# ----- PAYMENT -----


@phase9_bp.route("/api/payment/<action>", methods=["GET", "POST"])
@login_required
@license_required
def payment(action):
    """
    /api/payment/:action - info, delete-subscription, create-subscription
    Params come from query or JSON body.
    """
    if action == "info":
        return _payment_info()
    if action == "delete-subscription":
        return _payment_delete_subscription()
    if action == "create-subscription":
        return _payment_create_subscription()
    return jsonify({"error": "no action"}), 400


def _payment_info():
    """Payment info - project resources and plan names/prices."""
    from sqlalchemy import text

    user = User.query.get(current_user.id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    proj_ids = []
    if user.role == 8:
        projects = Project.query.filter_by(isDeleted=False).all()
        proj_ids = [p.id for p in projects]
    else:
        rows = db.session.query(project_user.c.project_users).filter(
            project_user.c.user_projects == user.id
        ).all()
        proj_ids = [r[0] for r in rows]
        projects = Project.query.filter(Project.id.in_(proj_ids), Project.isDeleted == False).all()

    if not proj_ids:
        return jsonify({
            "projects": [],
            "planNames": _plan_names(),
            "planPrices": _plan_prices(),
        })

    ids_str = ",".join(str(i) for i in proj_ids)
    count_query = f"""
        SELECT project.id AS project,
            gateways.count AS gateways,
            meters.count AS meters,
            switches.count AS switches,
            repeaters.count AS repeaters
        FROM project
        LEFT JOIN (SELECT project, COUNT(*) AS count FROM gateway WHERE isDeleted = 0 GROUP BY project) AS gateways ON project.id = gateways.project
        LEFT JOIN (SELECT project, COUNT(*) AS count FROM meter WHERE isDeleted = 0 GROUP BY project) AS meters ON project.id = meters.project
        LEFT JOIN (SELECT project, COUNT(*) AS count FROM switch WHERE isDeleted = 0 GROUP BY project) AS switches ON project.id = switches.project
        LEFT JOIN (SELECT project, COUNT(*) AS count FROM repeater WHERE isDeleted = 0 GROUP BY project) AS repeaters ON project.id = repeaters.project
        WHERE project.isDeleted = 0 AND project.id IN ({ids_str})
    """
    try:
        result = db.session.execute(text(count_query))
        rows = result.fetchall()
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    proj_map = {p.id: p for p in projects}
    plan_map = {}
    if proj_map:
        plan_ids = [p.servicePlan for p in projects if p.servicePlan]
        if plan_ids:
            plans = ServicePlan.query.filter(ServicePlan.id.in_(plan_ids)).all()
            plan_map = {sp.id: sp for sp in plans}
    for row in rows:
        proj = proj_map.get(row.project)
        if proj:
            sub = None
            if proj.servicePlan and proj.servicePlan in plan_map:
                sub = plan_map[proj.servicePlan].subscription
            proj.resources = {
                "project": row.project,
                "gateways": row.gateways or 0,
                "meters": row.meters or 0,
                "switches": row.switches or 0,
                "repeaters": row.repeaters or 0,
                "server": 1,
                "addlUsers": 0,
                "support": 0,
                "subscription": sub,
            }

    out = []
    for p in projects:
        pd = {"id": p.id, "name": p.name}
        if hasattr(p, "resources"):
            pd["resources"] = p.resources
        out.append(pd)

    return jsonify({
        "projects": out,
        "planNames": _plan_names(),
        "planPrices": _plan_prices(),
    })


def _plan_names():
    from flask import current_app
    return current_app.config.get("SERVICE_PLAN_NAMES", {})


def _plan_prices():
    from flask import current_app
    return current_app.config.get("SERVICE_PLAN_PRICES", {})


def _payment_delete_subscription():
    """Delete subscription and unlink from projects."""
    params = _get_params()
    sub_id = params.get("id")
    if not sub_id:
        return jsonify({"error": "id required"}), 400

    try:
        from app.services.authorizenet_service import delete_subscription
        delete_subscription(sub_id)
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 400

    # Unlink projects from this subscription and delete ServicePlan records
    plans = ServicePlan.query.filter_by(subscription=sub_id).all()
    for plan in plans:
        Project.query.filter_by(servicePlan=plan.id).update({"servicePlan": None})
        db.session.delete(plan)
    db.session.commit()
    return jsonify({})


def _payment_create_subscription():
    """Create subscription and link to projects."""
    params = _get_params()
    required = ["plan", "projectIDs", "firstName", "lastName", "amount", "monthly"]
    for k in required:
        if k not in params:
            return jsonify({"error": f"{k} required"}), 400

    project_ids = params["projectIDs"]
    if not isinstance(project_ids, list):
        project_ids = [project_ids]

    user = User.query.get(current_user.id)
    proj_ids = [r[0] for r in db.session.query(project_user.c.project_users).filter(
        project_user.c.user_projects == user.id
    ).all()] if user.role != 8 else [p.id for p in Project.query.filter_by(isDeleted=False).all()]

    for pid in project_ids:
        if int(pid) not in proj_ids and user.role != 8:
            return jsonify({"error": "Unauthorized project"}), 403

    project_names = {p.id: p.name for p in Project.query.filter(Project.id.in_(project_ids)).all()}
    names = [project_names.get(int(pid), str(pid)) for pid in project_ids]

    project_prices = params.get("projectPrices", [1] * len(project_ids))

    try:
        from app.services.authorizenet_service import create_subscription
        sub_id = create_subscription(
            plan=params["plan"],
            project_names=names,
            first_name=params["firstName"],
            last_name=params["lastName"],
            zip_code=params.get("zip", ""),
            amount=params["amount"],
            monthly=params["monthly"],
            card_number=params.get("cardNumber"),
            card_expiry=params.get("cardExpiry"),
            card_code=params.get("cardCode"),
            routing_number=params.get("routingNumber"),
            account_number=params.get("accountNumber"),
        )
    except RuntimeError as e:
        return jsonify({"error": str(e)}), 400

    for i, pid in enumerate(project_ids):
        plan = ServicePlan(
            type=params["plan"],
            price=float(project_prices[i] if i < len(project_prices) else 1) * (11 if not params["monthly"] else 1),
            subscription=sub_id,
            billingInterval=1 if params["monthly"] else 12,
            paymentMethod="card" if params.get("cardNumber") else "account",
            accountNumber="xxxx" + (params.get("cardNumber") or params.get("accountNumber", ""))[-4:],
        )
        db.session.add(plan)
        db.session.flush()
        proj = Project.query.get(int(pid))
        if proj:
            proj.servicePlan = plan.id
    db.session.commit()
    return jsonify({})


def _get_params():
    """Get params from query or JSON body."""
    if request.is_json:
        return request.get_json() or {}
    params = {}
    for k, v in request.args.items():
        try:
            if v.lower() in ("true", "false"):
                params[k] = v.lower() == "true"
            else:
                params[k] = int(v)
        except ValueError:
            params[k] = v
    return params


# ----- DATASYNC -----


@phase9_bp.route("/api/datasync/<table>", methods=["GET"])
@phase9_bp.route("/api/datasync/<table>/<int:since>", methods=["GET"])
@phase9_bp.route("/api/datasync/<table>/<int:since>/<int:limit>", methods=["GET"])
@phase9_bp.route("/api/datasync/<table>/<int:since>/<int:limit>/<int:ref_id>", methods=["GET"])
def datasync(table, since=None, limit=None, ref_id=None):
    """
    GET /api/datasync/:table/:since?/:limit?/:refId?
    Params from path or query. Export records for sync. Public (no auth).
    """
    from app.services.datasync_service import is_syncable, export_records

    if not is_syncable(table):
        return jsonify({"error": "no table"}), 400

    since = since if since is not None else request.args.get("since", 0, type=int)
    limit = limit if limit is not None else request.args.get("limit", 10000, type=int)
    ref_id = ref_id if ref_id is not None else request.args.get("refId", 0, type=int)
    if limit > 10000:
        limit = 10000

    try:
        records = export_records(table, since, limit, ref_id)
        return jsonify(records)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ----- NODE SYNC -----


@phase9_bp.route("/api/node-sync/<project_xuid>/<int:since>", methods=["GET"])
@phase9_bp.route("/api/node-sync/<project_xuid>", methods=["GET"])
def node_sync(project_xuid, since=0):
    """
    GET /api/node-sync/<project_xuid>/<since_ms>

    Called by field nodes on a polling interval. Returns all switch commands
    and associated join-table rows for the given project that are newer than
    `since` (epoch ms).  No auth required — the project xuid acts as the key.

    Response:
    {
        "switchcommand": [ { xuid, commandType, startAt, project, ... }, ... ],
        "joins":         [ { switchcommand_xuid, switch_xuid }, ... ]
    }
    """
    from sqlalchemy import text
    from app.extensions import db

    since = since or request.args.get("since", 0, type=int)

    try:
        # Resolve project xuid to local id
        proj_row = db.session.execute(
            text("SELECT id FROM project WHERE xuid = :xuid LIMIT 1"),
            {"xuid": project_xuid},
        ).fetchone()
        if not proj_row:
            return jsonify({"error": "project not found"}), 404
        project_id = proj_row[0]

        # Fetch switchcommands for this project newer than since
        sc_rows = db.session.execute(
            text("""
                SELECT sc.xuid, sc.commandType, sc.startAt, sc.isTest,
                       sc.isCancelled, sc.updatedAt, sc.createdAt,
                       p.xuid AS project_xuid
                FROM switchcommand sc
                INNER JOIN project p ON sc.project = p.id
                WHERE sc.project = :pid
                  AND (sc.updatedAt >= :since OR sc.createdAt >= :since)
                ORDER BY COALESCE(sc.updatedAt, sc.createdAt), sc.id
                LIMIT 500
            """),
            {"pid": project_id, "since": since},
        ).fetchall()

        switchcommands = []
        sc_xuids = []
        for row in sc_rows:
            rec = dict(row._mapping) if hasattr(row, "_mapping") else dict(zip(row._fields, row))
            # Rename project_xuid back to project so node resolves it
            rec["project"] = rec.pop("project_xuid", None)
            switchcommands.append(rec)
            if rec.get("xuid"):
                sc_xuids.append(rec["xuid"])

        # Fetch join-table rows for those switchcommands
        joins = []
        if sc_xuids:
            placeholders = ", ".join(f":x{i}" for i in range(len(sc_xuids)))
            params = {f"x{i}": x for i, x in enumerate(sc_xuids)}
            join_rows = db.session.execute(
                text(f"""
                    SELECT sc.xuid AS switchcommand_xuid,
                           sw.xuid AS switch_xuid
                    FROM switch_switches_switch__switchcommand_switches jt
                    INNER JOIN switchcommand sc ON jt.switchcommand_switches = sc.id
                    INNER JOIN switch       sw ON jt.switch_switches_switch  = sw.id
                    WHERE sc.xuid IN ({placeholders})
                """),
                params,
            ).fetchall()
            for row in join_rows:
                joins.append({
                    "switchcommand_xuid": row[0],
                    "switch_xuid": row[1],
                })

        return jsonify({"switchcommand": switchcommands, "joins": joins})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ----- XECO -----


@phase9_bp.route("/api/xeco", methods=["PUT"])
@login_required
@license_required
def xeco_update():
    """PUT /api/xeco - update Xeco singleton. Body: valuesToSet."""
    data = request.get_json() or {}
    values = data.get("valuesToSet", data)
    if not values:
        return jsonify({"error": "valuesToSet required"}), 400

    reserved = {"id", "createdAt", "updatedAt"}
    if set(values.keys()) & reserved:
        return jsonify({"error": "Cannot set reserved keys"}), 400

    xeco_attrs = {"billingEmail", "billingPhone", "address", "city", "state", "zip", "carbonCreditRate", "managerCostPercent"}
    unrecognized = set(values.keys()) - xeco_attrs
    if unrecognized:
        return jsonify({"error": f"Unrecognized properties: {unrecognized}"}), 400

    xeco = Xeco.query.first()
    if not xeco:
        return jsonify({"error": "Xeco not found"}), 404

    for k, v in values.items():
        if hasattr(xeco, k):
            setattr(xeco, k, v)
    db.session.commit()
    return jsonify({})


# ----- MAINTENANCE -----

from app.services.maintenance_service import (
    STATUS_FILE,
    STATE_READY,
    STATE_ERROR,
    STATE_ROLLING_BACK,
    STATE_UPDATING,
    create_file_list_pack,
    request_apply,
    request_rollback,
    RemoteHost,
)


def _maintenance_status():
    """Read maintenance status from file or default."""
    try:
        if Path(STATUS_FILE).exists():
            with open(STATUS_FILE) as f:
                return json.load(f)
    except Exception:
        pass
    return {
        "local": {
            "name": platform.node(),
            "state": STATE_READY,
            "nodeVersion": "n/a",
            "lastCommits": "",
        },
        "remote": {},
    }


def _maintenance_update_status(updates):
    """Update local status in file."""
    status = _maintenance_status()
    for k, v in updates.items():
        status.setdefault("local", {})[k] = v
    try:
        Path(STATUS_FILE).parent.mkdir(parents=True, exist_ok=True)
        with open(STATUS_FILE, "w") as f:
            json.dump(status, f)
    except Exception:
        pass
    return status


@phase9_bp.route("/api/maintenance/status", methods=["POST"])
@remote_maintainer
def maintenance_status():
    """POST /api/maintenance/status - get local status."""
    from datetime import datetime
    _maintenance_update_status({"time": datetime.utcnow().strftime("%a, %d %b %Y %H:%M:%S GMT")})
    return jsonify(_maintenance_status())


@phase9_bp.route("/api/maintenance/files", methods=["POST"])
@remote_maintainer
def maintenance_files():
    """POST /api/maintenance/files - list app files, return encrypted pack as attachment."""
    import tempfile
    import shutil
    from io import BytesIO
    td = None
    try:
        td = tempfile.mkdtemp(prefix="xeco-maint-files-")
        pack_path = os.path.join(td, "pack")
        ok, err = create_file_list_pack(current_app, pack_path)
        if not ok:
            return jsonify({"error": err or "Failed to create file list pack"}), 500
        with open(pack_path, "rb") as f:
            data = f.read()
        return send_file(
            BytesIO(data),
            mimetype="application/octet-stream",
            as_attachment=True,
            download_name="pack",
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        if td:
            try:
                shutil.rmtree(td, ignore_errors=True)
            except Exception:
                pass


@phase9_bp.route("/api/maintenance/update", methods=["POST"])
@remote_maintainer
def maintenance_update():
    """POST /api/maintenance/update - receive update pack, apply via request-apply."""
    pack = request.files.get("pack")
    if not pack:
        return jsonify({"error": "pack file required"}), 400
    status = _maintenance_status()
    local_state = status.get("local", {}).get("state", STATE_READY)
    if local_state not in (STATE_READY, STATE_ERROR):
        return jsonify({"error": "Inappropriate state for update"}), 400
    import tempfile
    path = None
    try:
        _maintenance_update_status({"state": STATE_UPDATING, "error": None})
        fd, path = tempfile.mkstemp(suffix=".pack", prefix="xeco-received-")
        try:
            pack.save(path)
            ok, err = request_apply(current_app, path)
            if not ok:
                _maintenance_update_status({"state": STATE_ERROR, "error": err})
                return jsonify({"error": err or "request-apply failed"}), 500
        finally:
            try:
                os.close(fd)
                if path and os.path.exists(path):
                    os.unlink(path)
            except Exception:
                pass
        return jsonify(_maintenance_status())
    except Exception as e:
        _maintenance_update_status({"state": STATE_ERROR, "error": str(e)})
        return jsonify({"error": str(e)}), 500


@phase9_bp.route("/api/maintenance/rollback", methods=["POST"])
@remote_maintainer
def maintenance_rollback():
    """POST /api/maintenance/rollback - trigger rollback via request-rollback."""
    status = _maintenance_status()
    local_state = status.get("local", {}).get("state", STATE_READY)
    if local_state not in (STATE_READY, STATE_ERROR):
        return jsonify({"error": "Inappropriate state for rollback"}), 400
    _maintenance_update_status({"state": STATE_ROLLING_BACK, "error": None})
    ok, err = request_rollback(current_app)
    if not ok:
        _maintenance_update_status({"state": STATE_ERROR, "error": err})
        return jsonify({"error": err or "request-rollback failed"}), 500
    return jsonify(_maintenance_status())


@phase9_bp.route("/api/maintenance/remote-status", methods=["POST"])
@remote_maintainer
def maintenance_remote_status():
    """POST /api/maintenance/remote-status - fetch status from remote host."""
    data = request.get_json(silent=True) or request.form or {}
    host = data.get("host")
    secret = data.get("secret") or request.headers.get("X-Maintenance-Secret")
    if not host or not secret:
        return jsonify({"error": "host and secret required"}), 400
    remote = RemoteHost(current_app, host, secret)
    try:
        remote.read_status()
    except Exception:
        pass
    return jsonify({
        "local": _maintenance_status().get("local", {}),
        "remote": remote.get_status(),
    })


@phase9_bp.route("/api/maintenance/remote-update", methods=["POST"])
@remote_maintainer
def maintenance_remote_update():
    """POST /api/maintenance/remote-update - trigger update on remote host."""
    data = request.get_json(silent=True) or request.form or {}
    host = data.get("host")
    secret = data.get("secret") or request.headers.get("X-Maintenance-Secret")
    if not host or not secret:
        return jsonify({"error": "host and secret required"}), 400
    remote = RemoteHost(current_app, host, secret)
    remote.set_status({"error": None, "updateStatus": "in progress"})
    try:
        remote.update()
        remote.set_status({"error": None, "updateStatus": "success"})
    except Exception as e:
        remote.set_status({"error": str(e), "updateStatus": "failed"})
    return jsonify(remote.get_status())


@phase9_bp.route("/api/maintenance/remote-rollback", methods=["POST"])
@remote_maintainer
def maintenance_remote_rollback():
    """POST /api/maintenance/remote-rollback - trigger rollback on remote host."""
    data = request.get_json(silent=True) or request.form or {}
    host = data.get("host")
    secret = data.get("secret") or request.headers.get("X-Maintenance-Secret")
    if not host or not secret:
        return jsonify({"error": "host and secret required"}), 400
    remote = RemoteHost(current_app, host, secret)
    remote.set_status({"rollbackError": None, "time": __import__("time").strftime("%a, %d %b %Y %H:%M:%S GMT", __import__("time").gmtime())})
    try:
        remote.rollback()
    except Exception as e:
        remote.set_status({"rollbackError": str(e), "time": __import__("time").strftime("%a, %d %b %Y %H:%M:%S GMT", __import__("time").gmtime())})
    return jsonify(remote.get_status())


# ----- DEV -----


@phase9_bp.route("/api/dev/<command>", methods=["GET"])
def dev_command(command):
    """GET /api/dev/:command - dev helper (reload is no-op for Flask)."""
    if command == "reload":
        return jsonify({"ok": True})
    return jsonify({"error": "unknown command"}), 400
