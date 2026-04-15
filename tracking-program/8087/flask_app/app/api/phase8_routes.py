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

import math

from app.extensions import db
from app.helpers.decorators import license_required
from app.models.emv_analysis import EmvAnalysis
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
    # OEM users (role 9/10): grant access if the project belongs to a client they sponsor/own
    if user.role in (9, 10) and getattr(user, "org_id", None):
        try:
            from app.models.client import Client
            p = Project.query.filter_by(id=project_id, isDeleted=False).first()
            if p and p.client:
                cli = Client.query.filter_by(id=p.client, isDeleted=False).first()
                if cli and (getattr(cli, "org_id", None) == user.org_id or
                            getattr(cli, "sponsor_org_id", None) == user.org_id):
                    return True
        except Exception:
            pass
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

    v1, v2, v3 = md.l1Volt or 0, md.l2Volt or 0, md.l3Volt or 0
    a1, a2, a3 = md.l1Amp or 0, md.l2Amp or 0, md.l3Amp or 0
    thd1, thd2, thd3 = md.l1THD or 0, md.l2THD or 0, md.l3THD or 0
    pf1, pf2, pf3 = md.l1Pf or 0, md.l2Pf or 0, md.l3Pf or 0

    return jsonify(
        {
            "meta": {},
            "response": {
                "ampLoad1": a1,
                "ampLoad2": a2,
                "ampLoad3": a3,
                "powerFactor1": pf1,
                "powerFactor2": pf2,
                "powerFactor3": pf3,
                "kvar1": md.l1Kvar or 0,
                "kvar2": md.l2Kvar or 0,
                "kvar3": md.l3Kvar or 0,
                "voltage1": v1,
                "voltage2": v2,
                "voltage3": v3,
                "kw1": md.l1Kw or 0,
                "kw2": md.l2Kw or 0,
                "kw3": md.l3Kw or 0,
                "kva1": md.l1Kva or 0,
                "kva2": md.l2Kva or 0,
                "kva3": md.l3Kva or 0,
                "thd1": thd1,
                "thd2": thd2,
                "thd3": thd3,
                "totalThd": md.totalTHD or 0,
                "voltImbalance": _pct_imbalance(v1, v2, v3),
                "ampImbalance": _pct_imbalance(a1, a2, a3),
                "truePf1": _true_pf(pf1, thd1),
                "truePf2": _true_pf(pf2, thd2),
                "truePf3": _true_pf(pf3, thd3),
            },
        }
    )


def _pct_imbalance(v1, v2, v3):
    """NEMA MG1 voltage/current imbalance: max deviation from avg / avg * 100."""
    vals = [v for v in [v1, v2, v3] if v and v > 0]
    if len(vals) < 2:
        return 0.0
    avg = sum(vals) / len(vals)
    if avg == 0:
        return 0.0
    return round(max(abs(v - avg) for v in vals) / avg * 100, 2)


def _true_pf(disp_pf, thd_pct):
    """True PF = Displacement PF / sqrt(1 + (THD_I/100)^2). Accounts for harmonic distortion."""
    if not disp_pf:
        return 0.0
    thd_pu = (thd_pct or 0) / 100.0
    return round(disp_pf / math.sqrt(1 + thd_pu ** 2), 4)


def _empty_quality():
    return {
        "ampLoad1": 0, "ampLoad2": 0, "ampLoad3": 0,
        "powerFactor1": 0, "powerFactor2": 0, "powerFactor3": 0,
        "kvar1": 0, "kvar2": 0, "kvar3": 0,
        "voltage1": 0, "voltage2": 0, "voltage3": 0,
        "kw1": 0, "kw2": 0, "kw3": 0,
        "kva1": 0, "kva2": 0, "kva3": 0,
        "thd1": 0, "thd2": 0, "thd3": 0, "totalThd": 0,
        "voltImbalance": 0, "ampImbalance": 0,
        "truePf1": 0, "truePf2": 0, "truePf3": 0,
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
    "ampthd": ("l1THD", "l2THD", "l3THD"),
    # Individual harmonic trend types (H3–H21 for current and voltage per phase)
    **{f"ampH{h}":  (f"l1AmpH{h}",  f"l2AmpH{h}",  f"l3AmpH{h}")  for h in [3,5,7,9,11,13,15,17,19,21]},
    **{f"voltH{h}": (f"l1VoltH{h}", f"l2VoltH{h}", f"l3VoltH{h}") for h in [3,5,7,9,11,13,15,17,19,21]},
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
            # Top-level aliases so Angular charting component can access result.p1Data directly
            "p1Data": p1_data,
            "p2Data": p2_data,
            "p3Data": p3_data,
            "timeLabels": time_labels,
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


# ----- IEEE 519-2022 INDIVIDUAL HARMONIC LIMITS -----

def _get_ieee519_limits(isc_il_ratio: float) -> dict:
    """
    Return IEEE 519-2022 Table 2 individual harmonic limits (%) for a given ISC/IL ratio.
    Odd harmonics H3–H21. Even harmonics are 25% of odd limits; not separately enforced here.
    """
    if isc_il_ratio < 20:
        return {"H3":4.0,"H5":4.0,"H7":4.0,"H9":4.0,"H11":2.0,"H13":2.0,"H15":1.5,"H17":1.5,"H19":1.5,"H21":1.5,"tdd":5.0}
    elif isc_il_ratio < 50:
        return {"H3":7.0,"H5":7.0,"H7":7.0,"H9":7.0,"H11":3.5,"H13":3.5,"H15":2.5,"H17":2.5,"H19":2.5,"H21":2.5,"tdd":8.0}
    elif isc_il_ratio < 100:
        return {"H3":10.0,"H5":10.0,"H7":10.0,"H9":10.0,"H11":4.5,"H13":4.5,"H15":4.0,"H17":4.0,"H19":4.0,"H21":4.0,"tdd":12.0}
    elif isc_il_ratio < 1000:
        return {"H3":12.0,"H5":12.0,"H7":12.0,"H9":12.0,"H11":5.5,"H13":5.5,"H15":5.0,"H17":5.0,"H19":5.0,"H21":5.0,"tdd":15.0}
    else:
        return {"H3":15.0,"H5":15.0,"H7":15.0,"H9":15.0,"H11":7.0,"H13":7.0,"H15":6.0,"H17":6.0,"H19":6.0,"H21":6.0,"tdd":20.0}


def _k_factor(amp_harmonics: dict, i_fund: float) -> float:
    """
    K-Factor per IEEE C57.110: K = sum(h^2 * Ih_pu^2) where Ih_pu = (H_pct/100) * I_fund.
    amp_harmonics: dict of {"H3": pct, "H5": pct, ...}
    i_fund: fundamental current (A)
    """
    if not i_fund or i_fund <= 0:
        return 0.0
    total = 0.0
    for order_key, pct in amp_harmonics.items():
        try:
            h = int(order_key.replace("H", ""))
            ih_pu = (pct / 100.0) * i_fund
            total += (h ** 2) * (ih_pu ** 2)
        except (ValueError, TypeError):
            pass
    ih_sq_sum = sum(((pct / 100.0) * i_fund) ** 2 for pct in amp_harmonics.values() if pct)
    if ih_sq_sum == 0:
        return 0.0
    return round(total / ih_sq_sum, 2) if ih_sq_sum else 0.0


def _neutral_current_est(phase_amp_harmonics: list, i_funds: list) -> float:
    """
    Estimate neutral current from triplen harmonics (H3, H9, H15, H21).
    I_neutral ≈ 3 * sqrt(sum(Ih_triplen_per_phase^2)) simplified.
    """
    TRIPLENS = ["H3", "H9", "H15", "H21"]
    sq_sum = 0.0
    for harmonics, i_fund in zip(phase_amp_harmonics, i_funds):
        if not i_fund:
            continue
        for h_key in TRIPLENS:
            pct = harmonics.get(h_key, 0) or 0
            ih = (pct / 100.0) * i_fund
            sq_sum += ih ** 2
    return round(3.0 * math.sqrt(sq_sum), 2) if sq_sum > 0 else 0.0


def _k_factor_label(k: float) -> str:
    """Map K-Factor value to transformer K-rating recommendation."""
    if k <= 1.0:
        return "Standard K-1 transformer suitable"
    elif k <= 4.0:
        return "Recommend K-4 rated transformer (K-1 derate to ~80%)"
    elif k <= 13.0:
        return "Recommend K-13 rated transformer"
    else:
        return "Recommend K-20 rated transformer"


# ----- METER HARMONICS -----


@phase8_bp.route("/api/meter/harmonics", methods=["GET"])
@login_required
@license_required
def get_meter_harmonics():
    """
    GET /api/meter/harmonics?project=X&meter=Y&isc_il_ratio=20
    Returns latest harmonic snapshot (H3-H21) per phase + K-Factor, neutral current,
    IEEE 519 compliance, and EMV baseline from active EmvAnalysis.
    """
    project_id = request.args.get("project", type=int)
    meter_id   = request.args.get("meter",   type=int)
    isc_il     = request.args.get("isc_il_ratio", default=20, type=float)

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

    ORDERS = [3, 5, 7, 9, 11, 13, 15, 17, 19, 21]
    limits = _get_ieee519_limits(isc_il)

    if not md:
        return jsonify({"meta": {}, "response": {
            "hasHarmonicData": False,
            "timestamp": None,
            "baseline": {"hasBaseline": False},
        }})

    def _phase_harmonics(phase_prefix):
        amp  = {f"H{h}": getattr(md, f"{phase_prefix}AmpH{h}",  None) for h in ORDERS}
        volt = {f"H{h}": getattr(md, f"{phase_prefix}VoltH{h}", None) for h in ORDERS}
        amp  = {k: round(v, 3) for k, v in amp.items()  if v is not None}
        volt = {k: round(v, 3) for k, v in volt.items() if v is not None}
        return {"amp": amp, "volt": volt}

    l1 = _phase_harmonics("l1")
    l2 = _phase_harmonics("l2")
    l3 = _phase_harmonics("l3")

    has_individual = bool(l1["amp"] or l2["amp"] or l3["amp"])

    # Derived metrics
    i_funds = [md.l1Amp or 0, md.l2Amp or 0, md.l3Amp or 0]
    k_factors = {
        "l1": _k_factor(l1["amp"], i_funds[0]),
        "l2": _k_factor(l2["amp"], i_funds[1]),
        "l3": _k_factor(l3["amp"], i_funds[2]),
    }
    neutral_est = _neutral_current_est([l1["amp"], l2["amp"], l3["amp"]], i_funds)

    # IEEE 519 compliance per harmonic
    def _compliance(phase_harmonics):
        result = {}
        for order_key, measured in phase_harmonics["amp"].items():
            limit = limits.get(order_key)
            result[order_key] = {
                "measured": measured,
                "limit": limit,
                "pass": (measured <= limit) if limit is not None else None,
            }
        return result

    ieee519 = {
        "iscIlRatio": isc_il,
        "tddLimit": limits["tdd"],
        "individualLimits": {k: v for k, v in limits.items() if k != "tdd"},
        "l1Compliance": _compliance(l1),
        "l2Compliance": _compliance(l2),
        "l3Compliance": _compliance(l3),
    }

    # Overall compliance — False if any harmonic exceeds limit
    all_compliance = []
    for comp in [ieee519["l1Compliance"], ieee519["l2Compliance"], ieee519["l3Compliance"]]:
        for order_data in comp.values():
            if order_data["pass"] is not None:
                all_compliance.append(order_data["pass"])
    if not all_compliance:
        overall_compliant = None  # insufficient data
    else:
        overall_compliant = all(all_compliance)

    # EMV baseline from active EmvAnalysis
    emv_baseline = {"hasBaseline": False}
    proj = Project.query.get(project_id)
    if proj and proj.active_emv_analysis_id:
        emv = EmvAnalysis.query.get(proj.active_emv_analysis_id)
        if emv and emv.harmonic_baseline:
            emv_baseline = {
                "hasBaseline": True,
                "source": "emv_analysis",
                "emvAnalysisId": emv.id,
                "analysisDate": emv.analysis_date,
                "offPeriodStart": emv.off_period_start,
                "offPeriodEnd": emv.off_period_end,
                "snapshot": emv.harmonic_baseline,
            }

    ts = None
    if md.recordedAt:
        try:
            ts = datetime.fromtimestamp(md.recordedAt / 1000).isoformat()
        except Exception:
            ts = str(md.recordedAt)

    response = {
        "hasHarmonicData": has_individual,
        "timestamp": ts,
        "l1": l1, "l2": l2, "l3": l3,
        "kFactor": k_factors,
        "kFactorLabel": {p: _k_factor_label(v) for p, v in k_factors.items()},
        "neutralCurrentEst": neutral_est,
        "ieee519": ieee519,
        "overallCompliant": overall_compliant,
        "baseline": emv_baseline,
    }

    return jsonify({"meta": {}, "response": response})
