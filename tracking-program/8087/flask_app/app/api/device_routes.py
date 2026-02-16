"""
Device APIs: Meter, Gateway, Repeater, Switch.
Ported from api/controllers/web/meter/, gateway/, repeater/, switch/.
"""
from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required

from app.extensions import db
from app.helpers.decorators import license_required
from app.models.gateway import Gateway
from app.models.meter import Meter
from app.models.project import project_user
from app.models.report_data import ReportData
from app.models.repeater import Repeater
from app.models.switch import Switch
from app.models.user import User

device_bp = Blueprint("device", __name__, url_prefix="")


def _user_has_project_access(project_id):
    """Check if current user has access to project. XECO_ADMIN (8) has access to all."""
    user = User.query.get(current_user.id) if current_user.is_authenticated else None
    if not user:
        return False
    if user.role == 8:  # XECO_ADMIN
        return True
    row = db.session.query(project_user).filter(
        project_user.c.project_users == project_id,
        project_user.c.user_projects == user.id,
    ).first()
    return row is not None


def _meter_report_data_records(project_id, meter_id):
    """ReportData records to create for a new meter (from meter/create.js)."""
    return [
        ("week", "kwh", "weeklykwh"),
        ("today", "kwh", "today kwh"),
        ("month", "avgKva", ""),
        ("month", "kwh", ""),
        ("month", "peak", ""),
        ("lastMonth", "kwh", ""),
        ("lastMonth", "peak", ""),
        ("lastMonth", "totalCost", ""),
        ("lastMonth", "totalSavings", ""),
        ("year", "totalSavings", ""),
        ("lastYear", "totalSavings", ""),
        ("allTime", "totalSavings", ""),
        ("today", "I2RLossSavings", ""),
        ("week", "I2RLossSavings", ""),
        ("month", "I2RLossSavings", ""),
        ("lastMonth", "I2RLossSavings", ""),
        ("year", "I2RLossSavings", ""),
        ("lastYear", "I2RLossSavings", ""),
        ("allTime", "I2RLossSavings", ""),
    ]


# ---- METER ----

@device_bp.route("/api/meter", methods=["GET"])
@login_required
@license_required
def list_meters():
    """GET /api/meter?project=1 - list meters for project (paginated)."""
    project = request.args.get("project", type=int)
    if not project:
        return jsonify({"error": "project required"}), 400
    if not _user_has_project_access(project):
        return jsonify({"error": "Unauthorized"}), 404

    page = request.args.get("page", 1, type=int)
    page_size = request.args.get("pageSize", 10, type=int)
    page_size = min(page_size, 500)
    name = request.args.get("name", "").strip()
    order_by = request.args.get("orderBy", "name")
    order_dir = request.args.get("orderDirection", "ASC")

    q = Meter.query.filter_by(project=project, isDeleted=False)
    if name:
        q = q.filter(Meter.name.ilike(f"%{name}%"))
    if order_dir.upper() == "DESC":
        q = q.order_by(getattr(Meter, order_by, Meter.name).desc())
    else:
        q = q.order_by(getattr(Meter, order_by, Meter.name).asc())

    total = q.count()
    items = q.offset((page - 1) * page_size).limit(page_size).all()
    rows = [{"id": m.id, "name": m.name, "gateway": m.gateway, "meshIp": m.meshIp} for m in items]
    return jsonify({"meta": {"page": page, "total": total}, "response": rows})


@device_bp.route("/api/meter/<int:mid>", methods=["GET"])
@login_required
@license_required
def get_meter(mid):
    """GET /api/meter/:id"""
    m = Meter.query.filter_by(id=mid, isDeleted=False).first()
    if not m:
        return jsonify({"error": "Not found"}), 404
    if not _user_has_project_access(m.project):
        return jsonify({"error": "Unauthorized"}), 404
    row = {c.name: getattr(m, c.name) for c in m.__table__.columns}
    return jsonify({"meta": {}, "response": row})


@device_bp.route("/api/meter", methods=["POST"])
@login_required
@license_required
def create_meter():
    """POST /api/meter - create meter (valuesToSet)."""
    data = request.get_json() or {}
    vals = data.get("valuesToSet") or {}
    if not vals.get("deviceId") or not vals.get("project"):
        return jsonify({"error": "deviceId and project required"}), 400
    if not _user_has_project_access(vals["project"]):
        return jsonify({"error": "Unauthorized"}), 404

    device_id = str(vals["deviceId"]).strip().upper()
    if Meter.query.filter_by(deviceId=device_id, isDeleted=False).first():
        return jsonify({"error": "A meter already exists with this device ID"}), 409

    m = Meter(deviceId=device_id, project=vals["project"], isDeleted=False)
    for k in ("name", "meshId", "meshIp", "meterSerialNumber", "gateway", "isReporting", "multiplier",
              "isSub", "isMain", "isFilter"):
        if k in vals and vals[k] is not None:
            setattr(m, k, vals[k])

    db.session.add(m)
    db.session.flush()

    for period, value_type, desc in _meter_report_data_records(m.project, m.id):
        rd = ReportData(type="meter", typeId=m.id, project=m.project, period=period,
                       valueType=value_type, description=desc or "", value=0)
        db.session.add(rd)
    db.session.commit()
    return jsonify({"meta": {}, "response": {"id": m.id}})


@device_bp.route("/api/meter/<int:mid>", methods=["PUT"])
@login_required
@license_required
def update_meter(mid):
    """PUT /api/meter/:id - update meter (valuesToSet)."""
    m = Meter.query.filter_by(id=mid, isDeleted=False).first()
    if not m:
        return jsonify({"error": "Not found"}), 404
    if not _user_has_project_access(m.project):
        return jsonify({"error": "Unauthorized"}), 404

    data = request.get_json() or {}
    vals = data.get("valuesToSet") or {}
    for k in ("id", "createdAt", "updatedAt", "isDeleted"):
        vals.pop(k, None)

    if "deviceId" in vals:
        device_id = str(vals["deviceId"]).strip().upper()
        other = Meter.query.filter(Meter.deviceId == device_id, Meter.id != mid, Meter.isDeleted == False).first()
        if other:
            return jsonify({"error": "A meter already exists with this device ID"}), 409
        vals["deviceId"] = device_id
    if "name" in vals:
        name = str(vals["name"]).strip()
        other = Meter.query.filter(Meter.name == name, Meter.id != mid, Meter.isDeleted == False).first()
        if other:
            return jsonify({"error": "A meter already exists with this name"}), 409

    for k, v in vals.items():
        if hasattr(m, k):
            setattr(m, k, v)
    db.session.commit()
    return jsonify({"meta": {}, "response": {"id": m.id}})


@device_bp.route("/api/meter/<int:mid>", methods=["DELETE"])
@login_required
@license_required
def destroy_meter(mid):
    """DELETE /api/meter/:id - soft delete."""
    m = Meter.query.filter_by(id=mid, isDeleted=False).first()
    if not m:
        return jsonify({"error": "Not found"}), 404
    if not _user_has_project_access(m.project):
        return jsonify({"error": "Unauthorized"}), 404
    m.isDeleted = True
    db.session.commit()
    return jsonify({"meta": {}, "response": {"id": mid}})


def _meter_to_data_row(m):
    """Serialize meter to dict for /api/meter/data response."""
    return {c.name: getattr(m, c.name) for c in m.__table__.columns if hasattr(m, c.name)}


@device_bp.route("/api/meter/data", methods=["GET"])
@login_required
@license_required
def get_meter_data():
    """GET /api/meter/data - recent readings for each meter (device list with live data)."""
    project = request.args.get("project", type=int)
    if not project:
        return jsonify({"error": "project required"}), 400
    if not _user_has_project_access(project):
        return jsonify({"error": "Unauthorized"}), 404

    page = request.args.get("page", 1, type=int)
    page_size = min(request.args.get("pageSize", request.args.get("limit", 1000), type=int), 1000)
    name = request.args.get("name", "").strip()
    order_by = request.args.get("orderBy", "name")
    order_dir = request.args.get("orderDirection", "ASC")

    q = Meter.query.filter_by(project=project, isDeleted=False)
    if name:
        q = q.filter(Meter.name.ilike(f"%{name}%"))
    ord_col = getattr(Meter, order_by, Meter.name)
    q = q.order_by(ord_col.desc() if str(order_dir).upper() == "DESC" else ord_col.asc())

    total = q.count()
    items = q.offset((page - 1) * page_size).limit(page_size).all()
    rows = [_meter_to_data_row(m) for m in items]
    return jsonify({"meta": {"page": page, "total": total}, "response": rows})


@device_bp.route("/api/meter/data/export", methods=["GET"])
@login_required
@license_required
def export_meter_data():
    """GET /api/meter/data/export - same as /data, for CSV export (returns JSON)."""
    return get_meter_data()


@device_bp.route("/api/meter/period", methods=["GET"])
@login_required
@license_required
def get_meter_period():
    """GET /api/meter/period - aggregated meter data for date range."""
    from datetime import datetime
    from zoneinfo import ZoneInfo
    from app.models.project import Project
    from app.models.meter_data_aggregate import MeterDataAggregate
    from app.services.test_calculation_service import calculate_test_results

    project_id = request.args.get("project", type=int)
    from_date = request.args.get("fromDate", type=int)
    to_date = request.args.get("toDate", type=int)
    if not project_id:
        return jsonify({"error": "project required"}), 400
    if not _user_has_project_access(project_id):
        return jsonify({"error": "Unauthorized"}), 404
    if not from_date:
        return jsonify({"error": "fromDate required"}), 400
    to_date = to_date or from_date
    now_ms = int(datetime.utcnow().timestamp() * 1000)
    if from_date > now_ms or from_date > to_date:
        return jsonify({"error": "Invalid date range"}), 400

    project = Project.query.get(project_id)
    if not project:
        return jsonify({"error": "Not found"}), 404

    try:
        tz = ZoneInfo(project.timeZoneId or "UTC")
    except Exception:
        tz = ZoneInfo("UTC")

    meters = Meter.query.filter_by(project=project_id, isDeleted=False).all()
    meter_ids = [str(m.id) for m in meters] if meters else []
    meter_input = ",".join(meter_ids) if meter_ids else "0"

    test_result = None
    if project.selectedTest:
        try:
            test_result = calculate_test_results(project.selectedTest, meter_input)
        except Exception:
            pass

    start_dt = datetime.fromtimestamp(from_date / 1000, tz=tz).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    end_dt = datetime.fromtimestamp(to_date / 1000, tz=tz)
    start_day = start_dt.strftime("%Y-%m-%d")
    end_day = end_dt.strftime("%Y-%m-%d")
    current_day = datetime.now(tz).strftime("%Y-%m-%d")

    rows = MeterDataAggregate.query.filter(
        MeterDataAggregate.project == project_id,
        MeterDataAggregate.day >= start_day,
        MeterDataAggregate.day <= end_day,
        MeterDataAggregate.intervalId != "",
    ).order_by(MeterDataAggregate.intervalStartTime.asc()).all()

    def _avg(attr):
        vals = [getattr(r, attr) for r in rows if getattr(r, attr) is not None]
        return sum(vals) / len(vals) if vals else 0

    def _get_kwh():
        total_kwh = 0
        this_kwh = 0
        idx = 0
        for r in rows:
            if idx < 4:
                this_kwh += float(r.avgKva or 0)
                idx += 1
            else:
                total_kwh += this_kwh / 4
                this_kwh = float(r.avgKva or 0)
                idx = 1
        return total_kwh

    kwh = _get_kwh() * float(project.multiplier or 1)
    peak_vals = [float(r.avgKva or 0) for r in rows]
    kw_vals = [float(r.avgKw or 0) for r in rows]
    kva_peak = max(peak_vals) * float(project.peakMultiplier or 1) if peak_vals else 0
    kw_peak = max(kw_vals) if kw_vals else 0

    totals = test_result.get("totals", {}) if test_result else {}
    xeco_off = totals.get("xecoOff", {})
    xeco_on = totals.get("xecoOn", {})
    pct = test_result.get("percentSaved", {}) if test_result else {}

    output = {
        "kvaPeak": kva_peak,
        "kwPeak": kw_peak,
        "kwh": kwh,
        "avgKva": _avg("avgKva"),
        "carbonEmission": 0.0007054 * kwh,
        "avgKvar": _avg("avgKvar"),
        "afterPf": round(_avg("avgPf"), 2),
        "xecoOffKvar": xeco_off.get("kvar", 0),
        "xecoOnKvar": xeco_on.get("kvar", 0),
        "kvarSavingsPercent": float(pct.get("kvar", 0)),
        "pfSavingsPercent": float(pct.get("powerFactor", 0)),
        "xecoOffPf": xeco_off.get("powerFactor", 0),
        "xecoOnPf": xeco_on.get("powerFactor", 0),
    }
    return jsonify({"meta": {}, "response": output})


@device_bp.route("/api/meter/daily", methods=["GET"])
@login_required
@license_required
def get_meter_daily():
    """GET /api/meter/daily - daily rolled-up data for project."""
    from datetime import datetime, timedelta
    from zoneinfo import ZoneInfo
    from app.models.project import Project
    from app.models.meter_data_aggregate import MeterDataAggregate

    project_id = request.args.get("project", type=int)
    from_date = request.args.get("fromDate", type=int)
    to_date = request.args.get("toDate", type=int)
    if not project_id:
        return jsonify({"error": "project required"}), 400
    if not _user_has_project_access(project_id):
        return jsonify({"error": "Unauthorized"}), 404
    if not from_date or not to_date or to_date <= from_date:
        return jsonify({"error": "fromDate and toDate required, toDate > fromDate"}), 400

    project = Project.query.get(project_id)
    if not project:
        return jsonify({"error": "Not found"}), 404
    try:
        tz = ZoneInfo(project.timeZoneId or "UTC")
    except Exception:
        tz = ZoneInfo("UTC")

    start_dt = datetime.fromtimestamp(from_date / 1000, tz=tz)
    end_dt = datetime.fromtimestamp(to_date / 1000, tz=tz)
    start_day = start_dt.replace(day=1).strftime("%Y-%m-%d")
    next_month = (end_dt.replace(day=28) + timedelta(days=4)).replace(day=1)
    end_day = (next_month - timedelta(days=1)).strftime("%Y-%m-%d")

    rows = MeterDataAggregate.query.filter(
        MeterDataAggregate.project == project_id,
        MeterDataAggregate.intervalId == "",
        MeterDataAggregate.day >= start_day,
        MeterDataAggregate.day <= end_day,
    ).all()

    data = [
        {
            "date": r.day,
            "kwh": float(r.avgKva or 0) * 24,
            "kvap": float(r.peakKva or 0),
            "kwp": float(r.peakKw or 0),
            "multiplier": float(r.multiplier or 1),
        }
        for r in rows
    ]
    return jsonify({"meta": {"total": len(data)}, "response": data})


@device_bp.route("/api/meter/monthly", methods=["GET"])
@login_required
@license_required
def get_meter_monthly():
    """GET /api/meter/monthly - monthly rolled-up data for project."""
    from datetime import datetime, timedelta
    from zoneinfo import ZoneInfo
    from app.models.project import Project
    from sqlalchemy import text

    project_id = request.args.get("project", type=int)
    from_date = request.args.get("fromDate", type=int)
    to_date = request.args.get("toDate", type=int)
    if not project_id:
        return jsonify({"error": "project required"}), 400
    if not _user_has_project_access(project_id):
        return jsonify({"error": "Unauthorized"}), 404
    if not from_date or not to_date or to_date <= from_date:
        return jsonify({"error": "fromDate and toDate required, toDate > fromDate"}), 400

    project = Project.query.get(project_id)
    if not project:
        return jsonify({"error": "Not found"}), 404
    try:
        tz = ZoneInfo(project.timeZoneId or "UTC")
    except Exception:
        tz = ZoneInfo("UTC")

    start_dt = datetime.fromtimestamp(from_date / 1000, tz=tz)
    end_dt = datetime.fromtimestamp(to_date / 1000, tz=tz)
    start_day = start_dt.replace(day=1).strftime("%Y-%m-%d")
    end_day = (end_dt.replace(day=28) + timedelta(days=4)).replace(day=1) - timedelta(days=1)
    end_day = end_day.strftime("%Y-%m-%d")

    sql = """
        SELECT AVG(avgKva) as avgKva, AVG(avgKw) as avgKw, MAX(peakKw) as peakKw,
               MAX(peakKva) as peakKva, SUBSTRING(day, 1, 7) as month
        FROM meterdataaggregate
        WHERE project = :pid AND day >= :sday AND day <= :eday
        GROUP BY month ORDER BY month
    """
    result = db.session.execute(
        text(sql),
        {"pid": project_id, "sday": start_day, "eday": end_day}
    )
    rows = result.fetchall()

    data = []
    for row in rows:
        month = row.month
        first = datetime.strptime(month + "-01", "%Y-%m-%d")
        next_mo = (first.replace(day=28) + timedelta(days=4)).replace(day=1)
        last = next_mo - timedelta(days=1)
        hours = (last - first).days * 24 + 24
        kwh = float(row.avgKva or 0) * hours
        data.append({
            "date": month,
            "kwh": kwh,
            "kwp": float(row.peakKva or 0),
        })
    return jsonify({"meta": {"total": len(data)}, "response": data})


# ---- GATEWAY ----

@device_bp.route("/api/gateway", methods=["GET"])
@login_required
@license_required
def list_gateways():
    """GET /api/gateway?project=1 - list gateways for project."""
    project = request.args.get("project", type=int)
    if not project:
        return jsonify({"error": "project required"}), 400
    if not _user_has_project_access(project):
        return jsonify({"error": "Unauthorized"}), 404

    page = request.args.get("page", 1, type=int)
    page_size = request.args.get("pageSize", 10, type=int)
    page_size = min(page_size, 500)
    name = request.args.get("name", "").strip()
    order_by = request.args.get("orderBy", "name")
    order_dir = request.args.get("orderDirection", "ASC")

    q = Gateway.query.filter_by(project=project, isDeleted=False)
    if name:
        q = q.filter(Gateway.name.ilike(f"%{name}%"))
    if order_dir.upper() == "DESC":
        q = q.order_by(getattr(Gateway, order_by, Gateway.name).desc())
    else:
        q = q.order_by(getattr(Gateway, order_by, Gateway.name).asc())

    total = q.count()
    items = q.offset((page - 1) * page_size).limit(page_size).all()
    rows = [{"id": g.id, "name": g.name, "deviceId": g.deviceId, "softwareVersion": g.softwareVersion,
             "lastCommunicatedAt": g.lastCommunicatedAt} for g in items]
    return jsonify({"meta": {"page": page, "total": total}, "response": rows})


@device_bp.route("/api/gateway/<int:gid>", methods=["GET"])
@login_required
@license_required
def get_gateway(gid):
    """GET /api/gateway/:id"""
    g = Gateway.query.filter_by(id=gid, isDeleted=False).first()
    if not g:
        return jsonify({"error": "Not found"}), 404
    if not _user_has_project_access(g.project):
        return jsonify({"error": "Unauthorized"}), 404
    row = {c.name: getattr(g, c.name) for c in g.__table__.columns}
    return jsonify({"meta": {}, "response": row})


@device_bp.route("/api/gateway", methods=["POST"])
@login_required
@license_required
def create_gateway():
    """POST /api/gateway - create gateway (valuesToSet)."""
    data = request.get_json() or {}
    vals = data.get("valuesToSet") or {}
    if not vals.get("deviceId") or not vals.get("name") or not vals.get("project"):
        return jsonify({"error": "deviceId, name, and project required"}), 400
    if not _user_has_project_access(vals["project"]):
        return jsonify({"error": "Unauthorized"}), 404

    device_id = str(vals["deviceId"]).strip().upper()
    if Gateway.query.filter_by(deviceId=device_id, isDeleted=False).first():
        return jsonify({"error": "A gateway already exists with this device ID"}), 409

    g = Gateway(deviceId=device_id, name=vals["name"], project=vals["project"], isDeleted=False)
    for k in ("meshId", "meshIp", "softwareVersion"):
        if k in vals and vals[k] is not None:
            setattr(g, k, vals[k])
    db.session.add(g)
    db.session.commit()
    return jsonify({"meta": {}, "response": {"id": g.id}})


@device_bp.route("/api/gateway/<int:gid>", methods=["PUT"])
@login_required
@license_required
def update_gateway(gid):
    """PUT /api/gateway/:id"""
    g = Gateway.query.filter_by(id=gid, isDeleted=False).first()
    if not g:
        return jsonify({"error": "Not found"}), 404
    if not _user_has_project_access(g.project):
        return jsonify({"error": "Unauthorized"}), 404

    data = request.get_json() or {}
    vals = data.get("valuesToSet") or {}
    for k in ("id", "createdAt", "updatedAt", "isDeleted"):
        vals.pop(k, None)
    if "deviceId" in vals:
        vals["deviceId"] = str(vals["deviceId"]).strip().upper()
        other = Gateway.query.filter(Gateway.deviceId == vals["deviceId"], Gateway.id != gid, Gateway.isDeleted == False).first()
        if other:
            return jsonify({"error": "A gateway already exists with this device ID"}), 409

    for k, v in vals.items():
        if hasattr(g, k):
            setattr(g, k, v)
    db.session.commit()
    return jsonify({"meta": {}, "response": {"id": g.id}})


@device_bp.route("/api/gateway/<int:gid>", methods=["DELETE"])
@login_required
@license_required
def destroy_gateway(gid):
    """DELETE /api/gateway/:id"""
    g = Gateway.query.filter_by(id=gid, isDeleted=False).first()
    if not g:
        return jsonify({"error": "Not found"}), 404
    if not _user_has_project_access(g.project):
        return jsonify({"error": "Unauthorized"}), 404
    g.isDeleted = True
    db.session.commit()
    return jsonify({"meta": {}, "response": {"id": gid}})


# ---- REPEATER ----

@device_bp.route("/api/repeater", methods=["GET"])
@login_required
@license_required
def list_repeaters():
    """GET /api/repeater?project=1"""
    project = request.args.get("project", type=int)
    if not project:
        return jsonify({"error": "project required"}), 400
    if not _user_has_project_access(project):
        return jsonify({"error": "Unauthorized"}), 404

    page = request.args.get("page", 1, type=int)
    name = request.args.get("name", "").strip()
    order_by = request.args.get("orderBy", "name")
    order_dir = request.args.get("orderDirection", "ASC")

    q = Repeater.query.filter_by(project=project, isDeleted=False)
    if name:
        q = q.filter(Repeater.name.ilike(f"%{name}%"))
    if order_dir.upper() == "DESC":
        q = q.order_by(getattr(Repeater, order_by, Repeater.name).desc())
    else:
        q = q.order_by(getattr(Repeater, order_by, Repeater.name).asc())

    total = q.count()
    items = q.offset((page - 1) * 10).limit(10).all()
    rows = [{"id": r.id, "name": r.name, "lastCommunicatedAt": r.lastCommunicatedAt, "gateway": r.gateway} for r in items]
    return jsonify({"meta": {"page": page, "total": total}, "response": rows})


@device_bp.route("/api/repeater/<int:rid>", methods=["GET"])
@login_required
@license_required
def get_repeater(rid):
    """GET /api/repeater/:id"""
    r = Repeater.query.filter_by(id=rid, isDeleted=False).first()
    if not r:
        return jsonify({"error": "Not found"}), 404
    if not _user_has_project_access(r.project):
        return jsonify({"error": "Unauthorized"}), 404
    row = {c.name: getattr(r, c.name) for c in r.__table__.columns}
    return jsonify({"meta": {}, "response": row})


@device_bp.route("/api/repeater", methods=["POST"])
@login_required
@license_required
def create_repeater():
    """POST /api/repeater"""
    data = request.get_json() or {}
    vals = data.get("valuesToSet") or {}
    if not vals.get("deviceId") or not vals.get("name") or not vals.get("project"):
        return jsonify({"error": "deviceId, name, and project required"}), 400
    if not _user_has_project_access(vals["project"]):
        return jsonify({"error": "Unauthorized"}), 404

    device_id = str(vals["deviceId"]).strip().upper()
    if Repeater.query.filter_by(deviceId=device_id, isDeleted=False).first():
        return jsonify({"error": "A repeater already exists with this device ID"}), 409

    r = Repeater(deviceId=device_id, name=vals["name"], project=vals["project"], isDeleted=False)
    for k in ("meshId", "meshIp", "gateway"):
        if k in vals and vals[k] is not None:
            setattr(r, k, vals[k])
    db.session.add(r)
    db.session.commit()
    return jsonify({"meta": {}, "response": {"id": r.id}})


@device_bp.route("/api/repeater/<int:rid>", methods=["PUT"])
@login_required
@license_required
def update_repeater(rid):
    """PUT /api/repeater/:id"""
    r = Repeater.query.filter_by(id=rid, isDeleted=False).first()
    if not r:
        return jsonify({"error": "Not found"}), 404
    if not _user_has_project_access(r.project):
        return jsonify({"error": "Unauthorized"}), 404

    data = request.get_json() or {}
    vals = data.get("valuesToSet") or {}
    for k in ("id", "createdAt", "updatedAt", "isDeleted"):
        vals.pop(k, None)
    if "deviceId" in vals:
        vals["deviceId"] = str(vals["deviceId"]).strip().upper()
    for k, v in vals.items():
        if hasattr(r, k):
            setattr(r, k, v)
    db.session.commit()
    return jsonify({"meta": {}, "response": {"id": rid}})


@device_bp.route("/api/repeater/<int:rid>", methods=["DELETE"])
@login_required
@license_required
def destroy_repeater(rid):
    """DELETE /api/repeater/:id"""
    r = Repeater.query.filter_by(id=rid, isDeleted=False).first()
    if not r:
        return jsonify({"error": "Not found"}), 404
    if not _user_has_project_access(r.project):
        return jsonify({"error": "Unauthorized"}), 404
    r.isDeleted = True
    db.session.commit()
    return jsonify({"meta": {}, "response": {"id": rid}})


# ---- SWITCH ----

@device_bp.route("/api/switch", methods=["GET"])
@login_required
@license_required
def list_switches():
    """GET /api/switch?project=1 - list switches. Simplified (no PiBoard/Test status logic)."""
    project = request.args.get("project", type=int)
    if not project:
        return jsonify({"error": "project required"}), 400
    if not _user_has_project_access(project):
        return jsonify({"error": "Unauthorized"}), 404

    page = request.args.get("page", 1, type=int)
    page_size = request.args.get("pageSize", 10, type=int)
    page_size = min(page_size, 500)
    name = request.args.get("name", "").strip()
    device_type = request.args.get("deviceType", type=int)
    order_by = request.args.get("orderBy", "name")
    order_dir = request.args.get("orderDirection", "ASC")

    q = Switch.query.filter_by(project=project, isDeleted=False)
    if name:
        q = q.filter(Switch.name.ilike(f"%{name}%"))
    if device_type is not None:
        q = q.filter(Switch.deviceType == device_type)
    if order_dir.upper() == "DESC":
        q = q.order_by(getattr(Switch, order_by, Switch.name).desc())
    else:
        q = q.order_by(getattr(Switch, order_by, Switch.name).asc())

    total = q.count()
    items = q.offset((page - 1) * page_size).limit(page_size).all()
    from app.models.pi_board import PiBoard
    import time

    device_ids = [s.deviceId for s in items if s.deviceId]
    piboards = {}
    if device_ids:
        for pb in PiBoard.query.filter(PiBoard.deviceId.in_(device_ids)).all():
            piboards[pb.deviceId] = pb
    cur_time_ms = int(time.time() * 1000)
    rows = []
    for s in items:
        status_list = []
        piboard = piboards.get(s.deviceId) if s.deviceId else None
        if piboard:
            status_list.append("Off" if piboard.switchState else "On")
        else:
            status_list.append("Undefined")
        if (s.meshLastCommunicatedAt or 0) < cur_time_ms - 3 * 60 * 1000:
            status_list = ["Poweroff"]
        elif s.hasSchedule:
            status_list.append("Scheduled")
        row = {
            "id": s.id, "name": s.name, "lastCommunicatedAt": s.lastCommunicatedAt,
            "meshLastCommunicatedAt": s.meshLastCommunicatedAt, "hasSchedule": s.hasSchedule or False,
            "gateway": s.gateway, "meshIp": s.meshIp, "deviceType": s.deviceType,
            "status": status_list,
        }
        rows.append(row)
    return jsonify({"meta": {"page": page, "total": total}, "response": rows})


@device_bp.route("/api/switch/<int:sid>", methods=["GET"])
@login_required
@license_required
def get_switch(sid):
    """GET /api/switch/:id"""
    s = Switch.query.filter_by(id=sid, isDeleted=False).first()
    if not s:
        return jsonify({"error": "Not found"}), 404
    if not _user_has_project_access(s.project):
        return jsonify({"error": "Unauthorized"}), 404
    row = {c.name: getattr(s, c.name) for c in s.__table__.columns}
    return jsonify({"meta": {}, "response": row})


@device_bp.route("/api/switch", methods=["POST"])
@login_required
@license_required
def create_switch():
    """POST /api/switch"""
    data = request.get_json() or {}
    vals = data.get("valuesToSet") or {}
    if not vals.get("deviceId") or not vals.get("name") or not vals.get("project") or vals.get("deviceType") is None:
        return jsonify({"error": "deviceId, name, project, and deviceType required"}), 400
    if not _user_has_project_access(vals["project"]):
        return jsonify({"error": "Unauthorized"}), 404

    device_id = str(vals["deviceId"]).strip().upper()
    if Switch.query.filter_by(deviceId=device_id, isDeleted=False).first():
        return jsonify({"error": "A switch already exists with this device ID"}), 409

    s = Switch(deviceId=device_id, name=vals["name"], project=vals["project"], deviceType=vals["deviceType"], isDeleted=False)
    for k in ("meshId", "meshIp", "gateway", "ampLoad", "voltage", "pf", "originalHours", "hasSchedule"):
        if k in vals and vals[k] is not None:
            setattr(s, k, vals[k])
    db.session.add(s)
    db.session.commit()
    return jsonify({"meta": {}, "response": {"id": s.id}})


@device_bp.route("/api/switch/<int:sid>", methods=["PUT"])
@login_required
@license_required
def update_switch(sid):
    """PUT /api/switch/:id"""
    s = Switch.query.filter_by(id=sid, isDeleted=False).first()
    if not s:
        return jsonify({"error": "Not found"}), 404
    if not _user_has_project_access(s.project):
        return jsonify({"error": "Unauthorized"}), 404

    data = request.get_json() or {}
    vals = data.get("valuesToSet") or {}
    for k in ("id", "createdAt", "updatedAt", "isDeleted"):
        vals.pop(k, None)
    if "deviceId" in vals:
        vals["deviceId"] = str(vals["deviceId"]).strip().upper()
    for k, v in vals.items():
        if hasattr(s, k):
            setattr(s, k, v)
    db.session.commit()
    return jsonify({"meta": {}, "response": {"id": sid}})


@device_bp.route("/api/switch/<int:sid>", methods=["DELETE"])
@login_required
@license_required
def destroy_switch(sid):
    """DELETE /api/switch/:id"""
    s = Switch.query.filter_by(id=sid, isDeleted=False).first()
    if not s:
        return jsonify({"error": "Not found"}), 404
    if not _user_has_project_access(s.project):
        return jsonify({"error": "Unauthorized"}), 404
    s.isDeleted = True
    db.session.commit()
    return jsonify({"meta": {}, "response": {"id": sid}})
