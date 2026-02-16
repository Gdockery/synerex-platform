"""
Phase 8: Sockets - project ticker, close-ticker-sockets, meter quality.
Ported from api/controllers/web/project/ticker, close-ticker-sockets,
api/controllers/web/meter/get-recent-power-quality,
api/controllers/web/project/get-power-quality-chart.
"""
from datetime import datetime
from zoneinfo import ZoneInfo

from flask import Blueprint, jsonify, request
from flask_login import current_user, login_required
from sqlalchemy import text

from app.extensions import db
from app.helpers.decorators import license_required
from app.models.meter import Meter
from app.models.meter_data import MeterData
from app.models.project import Project, project_user
from app.models.report_data import ReportData
from app.models.user import User

phase8_bp = Blueprint("phase8", __name__, url_prefix="")


def _user_has_project_access(project_id):
    if not current_user.is_authenticated:
        return False
    user = User.query.get(current_user.id)
    if not user:
        return False
    if user.role == 8:
        return True
    row = db.session.query(project_user).filter(
        project_user.c.project_users == project_id,
        project_user.c.user_projects == user.id,
    ).first()
    return row is not None


def _get_report_value(report_data, value_type, default=0):
    for item in report_data:
        if getattr(item, "valueType", None) == value_type:
            return item.value if item.value is not None else default
    return default


# ----- TICKER -----


@phase8_bp.route("/api/project/ticker", methods=["GET"])
@login_required
@license_required
def get_project_ticker():
    """
    GET /api/project/ticker?project=X
    Returns power quality / savings metrics for a project from ReportData.
    Client can then join socket room for live updates.
    """
    project_id = request.args.get("project", type=int)
    if not project_id:
        return jsonify({"error": "project required"}), 400
    if not _user_has_project_access(project_id):
        return jsonify({"error": "Unauthorized"}), 404

    project = Project.query.get(project_id)
    if not project or project.selectedTest is None:
        return jsonify({"error": "Project not found or no selected test"}), 404

    report_data = ReportData.query.filter_by(
        project=project_id, type="project", period="allTime"
    ).all()

    kwh_savings = _get_report_value(report_data, "kwhSavingsAmount")
    peak_savings = _get_report_value(report_data, "peakSavingsAmount")
    carbon_savings = _get_report_value(report_data, "carbonSavingsAmount")
    i2r_loss_savings = _get_report_value(report_data, "I2RLossSavingsAmount")
    peak_val = _get_report_value(report_data, "peakSavings")
    pfc = _get_report_value(report_data, "pfc")
    kwh_val = _get_report_value(report_data, "kwhSavings")
    carbon_val = _get_report_value(report_data, "carbonSavings")
    i2r_val = _get_report_value(report_data, "I2RLossSavings")
    total_savings = _get_report_value(report_data, "totalSavings")

    response = {
        "project": project_id,
        "kwhSavings": kwh_savings,
        "peakSavings": peak_savings,
        "carbonSavings": carbon_savings,
        "I2RLossSavings": i2r_loss_savings,
        "peakSavingsAmount": peak_val + pfc,
        "kwhSavingsAmount": kwh_val,
        "carbonSavingsAmount": carbon_val,
        "I2RLossSavingsAmount": i2r_val,
        "projectSavings": total_savings + pfc + i2r_val + carbon_val,
    }
    return jsonify({"meta": {}, "response": response})


@phase8_bp.route("/api/project/close-ticker-sockets", methods=["GET"])
@login_required
@license_required
def close_ticker_sockets():
    """
    GET /api/project/close-ticker-sockets?project=X
    Leave project ticker room. Client should also emit leave_project via socket.
    This REST endpoint returns success for HTTP clients.
    """
    project_id = request.args.get("project", type=int)
    if not project_id:
        return jsonify({"error": "project required"}), 400
    if not _user_has_project_access(project_id):
        return jsonify({"error": "Unauthorized"}), 404
    return jsonify({"meta": {}, "response": {}})


# ----- METER QUALITY -----


@phase8_bp.route("/api/meter/quality", methods=["GET"])
@login_required
@license_required
def get_meter_quality():
    """
    GET /api/meter/quality?project=X&meter=Y
    Returns recent power quality data for a meter from MeterData.
    """
    project_id = request.args.get("project", type=int)
    meter_id = request.args.get("meter", type=int)
    if not project_id:
        return jsonify({"error": "project required"}), 400
    if not meter_id:
        return jsonify({"error": "meter required"}), 400
    if not _user_has_project_access(project_id):
        return jsonify({"error": "Unauthorized"}), 404

    meter = Meter.query.get(meter_id)
    if not meter or meter.project != project_id:
        return jsonify({"error": "Meter not found"}), 404

    md = (
        MeterData.query.filter_by(meter=meter_id)
        .order_by(MeterData.recordedAt.desc())
        .first()
    )
    if not md:
        return jsonify({"meta": {}, "response": _empty_quality()})
    return jsonify(
        {
            "meta": {},
            "response": {
                "ampLoad1": md.l1Amp or 0,
                "ampLoad2": md.l2Amp or 0,
                "ampLoad3": md.l3Amp or 0,
                "powerFactor1": md.l1Pf or 0,
                "powerFactor2": md.l2Pf or 0,
                "powerFactor3": md.l3Pf or 0,
                "kvar1": md.l1Kvar or 0,
                "kvar2": md.l2Kvar or 0,
                "kvar3": md.l3Kvar or 0,
                "voltage1": md.l1Volt or 0,
                "voltage2": md.l2Volt or 0,
                "voltage3": md.l3Volt or 0,
            },
        }
    )


def _empty_quality():
    return {
        "ampLoad1": 0,
        "ampLoad2": 0,
        "ampLoad3": 0,
        "powerFactor1": 0,
        "powerFactor2": 0,
        "powerFactor3": 0,
        "kvar1": 0,
        "kvar2": 0,
        "kvar3": 0,
        "voltage1": 0,
        "voltage2": 0,
        "voltage3": 0,
    }


# ----- METER QUALITY CHART -----

TYPE_TO_COLUMNS = {
    "kw": ("l1Kw", "l2Kw", "l3Kw"),
    "kva": ("l1Kva", "l2Kva", "l3Kva"),
    "voltage": ("l1Volt", "l2Volt", "l3Volt"),
    "amperage": ("l1Amp", "l2Amp", "l3Amp"),
    "kvar": ("l1Kvar", "l2Kvar", "l3Kvar"),
    "pf": ("l1Pf", "l2Pf", "l3Pf"),
    "voltthd": ("l1THD", "l2THD", "l3THD"),
    "ampthd": ("l1THD", "l2THD", "l3THD"),  # MeterData has THD per phase, use same cols
}


@phase8_bp.route("/api/meter/quality-chart", methods=["GET"])
@login_required
@license_required
def get_meter_quality_chart():
    """
    GET /api/meter/quality-chart?project=X&meter=Y&type=kw&period=hour&fromDate=&toDate=
    Returns aggregate meter data for chart: p1Data, p2Data, p3Data, timeLabels.
    """
    project_id = request.args.get("project", type=int)
    meter_id = request.args.get("meter", type=int)
    type_param = request.args.get("type", "kw")
    period = request.args.get("period", "hour")
    from_ts = request.args.get("fromDate", type=int)
    to_ts = request.args.get("toDate", type=int)

    if not project_id:
        return jsonify({"error": "project required"}), 400
    if not meter_id:
        return jsonify({"error": "meter required"}), 400
    if not _user_has_project_access(project_id):
        return jsonify({"error": "Unauthorized"}), 404
    if type_param not in TYPE_TO_COLUMNS:
        return jsonify({"error": "Invalid type"}), 400
    if period not in ("minute", "hour"):
        return jsonify({"error": "period must be minute or hour"}), 400

    now_ms = int(datetime.now().timestamp() * 1000)
    from_ts = from_ts or now_ms
    to_ts = to_ts or now_ms

    if from_ts > now_ms:
        return jsonify({"error": "fromDate cannot be in the future"}), 400
    if from_ts > to_ts:
        return jsonify({"error": "fromDate must be <= toDate"}), 400

    project = Project.query.get(project_id)
    if not project:
        return jsonify({"error": "Project not found"}), 404

    meter = Meter.query.get(meter_id)
    if not meter or meter.project != project_id:
        return jsonify({"error": "Meter not found"}), 404

    try:
        tz = ZoneInfo(project.timeZoneId) if project.timeZoneId else ZoneInfo("UTC")
    except Exception:
        tz = ZoneInfo("UTC")
    start_dt = datetime.fromtimestamp(from_ts / 1000, tz=tz).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    end_dt = datetime.fromtimestamp(to_ts / 1000, tz=tz).replace(
        hour=23, minute=59, second=59, microsecond=999999
    )
    start_day = start_dt.strftime("%Y-%m-%d")
    end_day = end_dt.strftime("%Y-%m-%d")

    now_in_tz = datetime.now(tz)
    hours = now_in_tz.strftime("%H")
    minutes = now_in_tz.strftime("%M")

    sql = text("""
        SELECT MAX(recordedAt) as recordedAt,
               AVG(l1Kw) as l1Kw, AVG(l2Kw) as l2Kw, AVG(l3Kw) as l3Kw,
               AVG(l1Kva) as l1Kva, AVG(l2Kva) as l2Kva, AVG(l3Kva) as l3Kva,
               AVG(l1Volt) as l1Volt, AVG(l2Volt) as l2Volt, AVG(l3Volt) as l3Volt,
               AVG(l1Amp) as l1Amp, AVG(l2Amp) as l2Amp, AVG(l3Amp) as l3Amp,
               AVG(l1Kvar) as l1Kvar, AVG(l2Kvar) as l2Kvar, AVG(l3Kvar) as l3Kvar,
               AVG(ABS(l1Pf)) as l1Pf, AVG(ABS(l2Pf)) as l2Pf, AVG(ABS(l3Pf)) as l3Pf,
               AVG(l1THD) as l1THD, AVG(l2THD) as l2THD, AVG(l3THD) as l3THD
        FROM meterdata
        WHERE meter = :meter_id AND day >= :start_day AND day <= :end_day
        GROUP BY `minute`, intervalId, day
        ORDER BY recordedAt ASC
    """)
    result = db.session.execute(
        sql, {"meter_id": meter_id, "start_day": start_day, "end_day": end_day}
    )
    rows = result.fetchall()

    col1, col2, col3 = TYPE_TO_COLUMNS[type_param]
    p1_temp = [_val(row, col1) for row in rows]
    p2_temp = [_val(row, col2) for row in rows]
    p3_temp = [_val(row, col3) for row in rows]
    timestamps = [_timestamp(row) for row in rows]

    time_labels = []
    p1_data = []
    p2_data = []
    p3_data = []

    if period == "hour":
        if not timestamps:
            pass
        elif len(timestamps) == 1:
            p1_data.append(round(p1_temp[0], 2) if p1_temp[0] is not None else 0)
            p2_data.append(round(p2_temp[0], 2) if p2_temp[0] is not None else 0)
            p3_data.append(round(p3_temp[0], 2) if p3_temp[0] is not None else 0)
            ts_val = timestamps[0]
            ts = (
                datetime.fromtimestamp(ts_val / 1000, tz)
                if isinstance(ts_val, (int, float))
                else datetime.now(tz)
            )
            time_labels.append(ts.strftime("%b-%d %I:00 %p"))
        else:
            p1_hour_total = p1_temp[0] or 0
            p2_hour_total = p2_temp[0] or 0
            p3_hour_total = p3_temp[0] or 0
            count = 1
            for i in range(1, len(timestamps)):
                ts_curr = datetime.fromtimestamp(timestamps[i] / 1000, tz) if isinstance(timestamps[i], (int, float)) else timestamps[i]
                ts_prev = datetime.fromtimestamp(timestamps[i - 1] / 1000, tz) if isinstance(timestamps[i - 1], (int, float)) else timestamps[i - 1]
                hr_curr = ts_curr.hour
                hr_prev = ts_prev.hour
                if hr_curr == hr_prev:
                    if i == 1:
                        p1_hour_total += p1_temp[i - 1] or 0
                        p2_hour_total += p2_temp[i - 1] or 0
                        p3_hour_total += p3_temp[i - 1] or 0
                    else:
                        p1_hour_total += p1_temp[i] or 0
                        p2_hour_total += p2_temp[i] or 0
                        p3_hour_total += p3_temp[i] or 0
                        count += 1
                else:
                    p1_data.append(round(p1_hour_total / count, 2))
                    p2_data.append(round(p2_hour_total / count, 2))
                    p3_data.append(round(p3_hour_total / count, 2))
                    time_labels.append(ts_prev.strftime("%b-%d %I:00 %p"))
                    count = 1
                    p1_hour_total = p1_temp[i] or 0
                    p2_hour_total = p2_temp[i] or 0
                    p3_hour_total = p3_temp[i] or 0
            # Push last hour for correctness
            p1_data.append(round(p1_hour_total / count, 2))
            p2_data.append(round(p2_hour_total / count, 2))
            p3_data.append(round(p3_hour_total / count, 2))
            last_ts = timestamps[-1] if timestamps else 0
            last_dt = (
                datetime.fromtimestamp(last_ts / 1000, tz)
                if isinstance(last_ts, (int, float))
                else datetime.now(tz)
            )
            time_labels.append(last_dt.strftime("%b-%d %I:00 %p"))
    else:
        for ts in timestamps:
            dt = datetime.fromtimestamp(ts / 1000, tz) if isinstance(ts, (int, float)) else ts
            time_labels.append(dt.strftime("%b-%d %I:%M %p"))
        p1_data = [round(v, 2) if v is not None else 0 for v in p1_temp]
        p2_data = [round(v, 2) if v is not None else 0 for v in p2_temp]
        p3_data = [round(v, 2) if v is not None else 0 for v in p3_temp]

    return jsonify(
        {
            "meta": {},
            "response": {
                "hours": hours,
                "minutes": minutes,
                "p1Data": p1_data,
                "p2Data": p2_data,
                "p3Data": p3_data,
                "timeLabels": time_labels,
            },
        }
    )


def _val(row, col):
    """Get column value from row; row may be Row or tuple."""
    if hasattr(row, col):
        return getattr(row, col)
    if hasattr(row, "_mapping"):
        return row._mapping.get(col)
    return None


def _timestamp(row):
    """Get recordedAt as ms timestamp from SQL result row."""
    v = _val(row, "recordedAt")
    if v is None:
        return 0
    if hasattr(v, "timestamp"):  # datetime
        return int(v.timestamp() * 1000)
    return int(v)
