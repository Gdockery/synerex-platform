"""
Phase 7: Project extensions - savings reports, budget, files, electric bill, equipment.
Ported from api/controllers/web/project/
"""
import re
from datetime import datetime
from pathlib import Path

from flask import Blueprint, jsonify, request, send_file
from flask_login import current_user, login_required

from app.extensions import db
from app.helpers.decorators import license_required
from app.models.file import File
from app.models.project import Project, project_user
from app.models.report_data import ReportData
from app.models.savings_report import SavingsReport
from app.models.user import User
from app.helpers.project_access import user_has_project_access as _user_has_project_access

phase7_bp = Blueprint("phase7", __name__, url_prefix="")




def _get_report_value(report_data, period, value_type, type_name="project"):
    for item in report_data:
        if getattr(item, "period", None) == period and getattr(item, "valueType", None) == value_type and getattr(item, "type", None) == type_name:
            return item.value if hasattr(item, "value") else 0
    return 0


# ----- SAVINGS REPORTS -----

@phase7_bp.route("/api/project/<int:project_id>/savings-report", methods=["GET"])
@login_required
@license_required
def list_savings_reports(project_id):
    """GET /api/project/:project/savings-report"""
    if not _user_has_project_access(project_id):
        return jsonify({"error": "Unauthorized"}), 404
    page = request.args.get("page", 1, type=int)
    page_size = request.args.get("pageSize", 10, type=int)
    page_size = min(page_size, 500)
    from_date = request.args.get("fromDate", type=int)
    to_date = request.args.get("toDate", type=int)
    order_by = request.args.get("orderBy", "createdAt")
    order_dir = request.args.get("orderDirection", "DESC")

    q = SavingsReport.query.filter_by(project=project_id)
    if from_date:
        from_str = datetime.fromtimestamp(from_date / 1000).strftime("%Y-%m")
        q = q.filter(SavingsReport.month >= from_str)
    if to_date:
        to_str = datetime.fromtimestamp(to_date / 1000).strftime("%Y-%m")
        q = q.filter(SavingsReport.month <= to_str)
    col = getattr(SavingsReport, order_by, SavingsReport.createdAt)
    q = q.order_by(col.desc() if order_dir == "DESC" else col.asc())
    total = q.count()
    items = q.offset((page - 1) * page_size).limit(page_size).all()

    project = Project.query.get(project_id)
    from flask import current_app
    storage = Path(current_app.config.get("STORAGE_LOCAL_PATH", ""))
    out = []
    for r in items:
        row = {"month": r.month, "createdAt": r.createdAt, "reportData": r.reportData or {}}
        bill_path = storage / "bills" / f"bill-{project_id}-{r.month}.pdf" if project_id and storage else None
        # Return web URL for "open PDF" / download - not filesystem path
        row["billURL"] = f"/api/project/{project_id}/savings-report/{r.month}/bill" if bill_path and bill_path.exists() else ""
        out.append(row)
    return jsonify({"meta": {"page": page, "total": total}, "response": out})


@phase7_bp.route("/api/project/<int:project_id>/savings-report/<month>", methods=["GET"])
@login_required
@license_required
def get_savings_report_details(project_id, month):
    """GET /api/project/:project/savings-report/:month"""
    if not _user_has_project_access(project_id):
        return jsonify({"error": "Unauthorized"}), 404
    r = SavingsReport.query.filter_by(project=project_id, month=month).first()
    if not r:
        return jsonify({"error": "Not found"}), 404
    return jsonify({"meta": {}, "response": {"month": r.month, "createdAt": r.createdAt, "reportData": r.reportData or {}}})


@phase7_bp.route("/api/project/<int:project_id>/savings-report", methods=["POST"])
@login_required
@license_required
def create_savings_report(project_id):
    """POST /api/project/:project/savings-report"""
    if not _user_has_project_access(project_id):
        return jsonify({"error": "Unauthorized"}), 404
    data = request.get_json() or {}
    from_date = data.get("fromDate")
    to_date = data.get("toDate")
    report_data = data.get("reportData") or {}
    if from_date is None or to_date is None:
        return jsonify({"error": "fromDate and toDate required"}), 400
    for k in ("project", "fromDate", "toDate"):
        if k in report_data:
            return jsonify({"error": f"reportData must not contain {k}"}), 400

    project = Project.query.get(project_id)
    if not project:
        return jsonify({"error": "Project not found"}), 400

    from datetime import timezone
    try:
        from_moment = datetime.fromtimestamp(from_date / 1000) if from_date > 1e12 else datetime.fromtimestamp(from_date)
        month_num = from_moment.month
        year = from_moment.year
        if from_moment.day > 15:
            month_num = (month_num % 12) + 1
            if month_num == 1:
                year += 1
        month = f"{year:04d}-{month_num:02d}"
    except Exception:
        month = datetime.now().strftime("%Y-%m")

    if SavingsReport.query.filter_by(project=project_id, month=month).first():
        return jsonify({"code": "E_CONFLICT", "message": "Report for that month already exists"}), 409

    to_ts = to_date
    if to_date and to_date < 1e12:
        to_ts = to_date * 1000
    r = SavingsReport(project=project_id, month=month, fromDate=from_date, toDate=to_ts or from_date, reportData=report_data)
    db.session.add(r)
    db.session.commit()
    return jsonify({"meta": {}, "response": {"id": r.id, "month": r.month}})


@phase7_bp.route("/api/project/<int:project_id>/savings-report/<month>", methods=["PUT"])
@login_required
@license_required
def update_savings_report_details(project_id, month):
    """PUT /api/project/:project/savings-report/:month"""
    if not _user_has_project_access(project_id):
        return jsonify({"error": "Unauthorized"}), 404
    r = SavingsReport.query.filter_by(project=project_id, month=month).first()
    if not r:
        return jsonify({"error": "Not found"}), 404
    data = request.get_json() or {}
    report_data = data.get("reportData")
    if report_data is not None:
        r.reportData = report_data
    db.session.commit()
    return jsonify({"meta": {}, "response": {"id": r.id}})


@phase7_bp.route("/api/project/<int:project_id>/savings-report/<month>/bill", methods=["GET"])
@login_required
@license_required
def download_savings_report_bill(project_id, month):
    """GET /api/project/:project/savings-report/:month/bill - download/open the uploaded bill PDF."""
    if not _user_has_project_access(project_id):
        return jsonify({"error": "Unauthorized"}), 404
    r = SavingsReport.query.filter_by(project=project_id, month=month).first()
    if not r:
        return jsonify({"error": "Not found"}), 404
    from flask import current_app
    storage = Path(current_app.config.get("STORAGE_LOCAL_PATH", ""))
    if not storage:
        return jsonify({"error": "Storage not configured"}), 500
    safe_month = re.sub(r"[^\w\-]", "-", month)
    bill_path = storage / "bills" / f"bill-{project_id}-{safe_month}.pdf"
    if not bill_path.exists():
        return jsonify({"error": "Bill PDF not found"}), 404
    return send_file(str(bill_path), mimetype="application/pdf", as_attachment=False, download_name=f"bill-{month}.pdf")


@phase7_bp.route("/api/project/<int:project_id>/savings-report/<month>/bill", methods=["POST"])
@login_required
@license_required
def upload_savings_report_bill(project_id, month):
    """POST /api/project/:project/savings-report/:month/bill"""
    if not _user_has_project_access(project_id):
        return jsonify({"error": "Unauthorized"}), 404
    bill = request.files.get("bill")
    if not bill or not bill.filename:
        return jsonify({"error": "bill file required"}), 400
    from flask import current_app
    storage = Path(current_app.config.get("STORAGE_LOCAL_PATH", ""))
    if not storage:
        return jsonify({"error": "Storage not configured"}), 500
    bills_dir = storage / "bills"
    bills_dir.mkdir(parents=True, exist_ok=True)
    safe_month = re.sub(r"[^\w\-]", "-", month)
    dest = bills_dir / f"bill-{project_id}-{safe_month}.pdf"
    try:
        bill.save(str(dest))
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    return jsonify({"message": "1 file(s) uploaded successfully!"})


@phase7_bp.route("/api/project/<int:project_id>/savings-report/<month>/bill", methods=["DELETE"])
@login_required
@license_required
def remove_savings_report_bill(project_id, month):
    """DELETE /api/project/:project/savings-report/:month/bill"""
    if not _user_has_project_access(project_id):
        return jsonify({"error": "Unauthorized"}), 404
    from flask import current_app
    storage = Path(current_app.config.get("STORAGE_LOCAL_PATH", ""))
    if storage:
        safe_month = re.sub(r"[^\w\-]", "-", month)
        bill_path = storage / "bills" / f"bill-{project_id}-{safe_month}.pdf"
        if bill_path.exists():
            try:
                bill_path.unlink()
            except Exception:
                pass
    return jsonify({"meta": {}, "response": {}})


@phase7_bp.route("/api/project/<int:project_id>/savings-report/<month>", methods=["DELETE"])
@login_required
@license_required
def destroy_savings_report(project_id, month):
    """DELETE /api/project/:project/savings-report/:month"""
    if not _user_has_project_access(project_id):
        return jsonify({"error": "Unauthorized"}), 404
    r = SavingsReport.query.filter_by(project=project_id, month=month).first()
    if not r:
        return jsonify({"error": "Not found"}), 404
    db.session.delete(r)
    db.session.commit()
    return jsonify({"meta": {}, "response": {}})


# ----- BUDGET -----

@phase7_bp.route("/api/project/<int:project_id>/budget", methods=["GET"])
@login_required
@license_required
def get_budget(project_id):
    """GET /api/project/:project/budget - simplified."""
    if not _user_has_project_access(project_id):
        return jsonify({"error": "Unauthorized"}), 404
    p = Project.query.get(project_id)
    if not p:
        return jsonify({"error": "Not found"}), 404
    budget = p.lastBudget or {}
    return jsonify({"meta": {}, "response": budget})


@phase7_bp.route("/api/project/<int:project_id>/update-budget", methods=["PUT"])
@login_required
@license_required
def update_budget(project_id):
    """PUT /api/project/:project/update-budget"""
    if not _user_has_project_access(project_id):
        return jsonify({"error": "Unauthorized"}), 404
    p = Project.query.get(project_id)
    if not p:
        return jsonify({"error": "Not found"}), 404
    data = request.get_json() or {}
    p.lastBudget = dict(p.lastBudget or {}, **data)
    db.session.commit()
    return jsonify({"meta": {}, "response": p.lastBudget})


# ----- ELECTRIC BILL ANALYSIS, EQUIPMENT INFO -----

@phase7_bp.route("/api/project/<int:project_id>/electric-bill-analysis", methods=["PUT"])
@login_required
@license_required
def set_electric_bill_analysis(project_id):
    """PUT /api/project/:project/electric-bill-analysis"""
    if not _user_has_project_access(project_id):
        return jsonify({"error": "Unauthorized"}), 404
    p = Project.query.get(project_id)
    if not p:
        return jsonify({"error": "Not found"}), 404
    data = request.get_json() or {}
    analysis = data.get("electricBillAnalysis")
    if analysis is None:
        return jsonify({"error": "electricBillAnalysis required"}), 400
    import time
    # Merge into existing so fields like gpuJobId are not lost
    merged = dict(p.electricBillAnalysis or {})
    merged.update(analysis)
    p.electricBillAnalysis = merged
    p.electricBillAnalysisUpdatedAt = int(time.time() * 1000)
    db.session.commit()
    return jsonify({"meta": {}, "response": merged})


@phase7_bp.route("/api/project/<int:project_id>/equipment-info", methods=["PUT"])
@login_required
@license_required
def set_equipment_info(project_id):
    """PUT /api/project/:project/equipment-info"""
    if not _user_has_project_access(project_id):
        return jsonify({"error": "Unauthorized"}), 404
    p = Project.query.get(project_id)
    if not p:
        return jsonify({"error": "Not found"}), 404
    data = request.get_json() or {}
    equipment = data.get("equipmentInfo")
    if equipment is None:
        return jsonify({"error": "equipmentInfo required"}), 400
    meter_number = data.get("meterNumber")
    existing = p.equipmentInfo or {}
    meter_equipment = list(existing.get("meterEquipment") or [])
    if meter_number:
        meter_equipment = [m for m in meter_equipment if m.get("meterNumber") != meter_number]
        equipment["meterNumber"] = meter_number
        meter_equipment.append(equipment)
        equipment = dict(existing, meterEquipment=meter_equipment)
    else:
        equipment["meterEquipment"] = meter_equipment
    p.equipmentInfo = equipment
    db.session.commit()
    return jsonify({"meta": {}, "response": equipment})


# ----- FILES -----

@phase7_bp.route("/api/project/list-files", methods=["GET"])
@login_required
@license_required
def list_files():
    """GET /api/project/list-files?project=1"""
    project_id = request.args.get("project", type=int)
    page = request.args.get("page", 1, type=int)
    page_size = request.args.get("pageSize", 10, type=int)
    if project_id and not _user_has_project_access(project_id):
        return jsonify({"error": "Unauthorized"}), 404
    q = File.query
    if project_id:
        q = q.filter_by(project=project_id)
    q = q.order_by(File.createdAt.desc())
    total = q.count()
    items = q.offset((page - 1) * page_size).limit(page_size).all()
    out = [{"id": f.id, "name": f.name, "description": f.description, "url": f.url} for f in items]
    return jsonify({"meta": {"page": page, "total": total}, "response": out})


@phase7_bp.route("/api/project/<int:project_id>/upload-file/<path:name>/<path:description>", methods=["POST"])
@login_required
@license_required
def upload_file_with_project(project_id, name, description):
    """POST /api/project/:project/upload-file/:name/:description"""
    return _do_upload_file(project_id, name, description)


@phase7_bp.route("/api/project/upload-file/<path:name>/<path:description>", methods=["POST"])
@login_required
@license_required
def upload_file_no_project(name, description):
    """POST /api/project/upload-file/:name/:description"""
    project_id = request.args.get("project") or request.form.get("project")
    try:
        project_id = int(project_id) if project_id else None
    except (TypeError, ValueError):
        project_id = None
    return _do_upload_file(project_id, name, description)


def _do_upload_file(project_id, name, description):
    if project_id and not _user_has_project_access(project_id):
        return jsonify({"error": "Unauthorized"}), 404
    bill = request.files.get("bill")
    if not bill or not bill.filename:
        return jsonify({"error": "bill file required"}), 400
    from flask import current_app
    storage = Path(current_app.config.get("STORAGE_LOCAL_PATH", ""))
    if not storage:
        return jsonify({"error": "Storage not configured"}), 500
    bills_dir = storage / "bills"
    bills_dir.mkdir(parents=True, exist_ok=True)
    safe_name = re.sub(r"[^\w\-.]", "-", (name or "file"))
    if not safe_name.lower().endswith(".pdf"):
        safe_name += ".pdf"
    dest = bills_dir / safe_name
    try:
        bill.save(str(dest))
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    f = File(name=name or "file", description=description or "", url=safe_name, project=project_id)
    db.session.add(f)
    db.session.commit()
    return jsonify({"message": "1 file(s) uploaded successfully!", "response": {"id": f.id}})




@phase7_bp.route("/api/project/delete-file/<file_name>/<int:file_id>", methods=["DELETE"])
@login_required
@license_required
def destroy_file(file_name, file_id):
    """DELETE /api/project/delete-file/:fileName/:fileId"""
    f = File.query.get(file_id)
    if not f:
        return jsonify({"error": "Not found"}), 404
    if f.project and not _user_has_project_access(f.project):
        return jsonify({"error": "Unauthorized"}), 404
    from flask import current_app
    storage = Path(current_app.config.get("STORAGE_LOCAL_PATH", ""))
    if storage:
        bill_path = storage / "bills" / (file_name.replace(" ", "-") + ("" if file_name.endswith(".pdf") else ".pdf"))
        if bill_path.exists():
            try:
                bill_path.unlink()
            except Exception:
                pass
    db.session.delete(f)
    db.session.commit()
    return jsonify({"meta": {}, "response": {}})


# ----- CURRENT SAVINGS (simplified - returns structure from ReportData) -----

@phase7_bp.route("/api/project/<int:project_id>/current-savings", methods=["GET"])
@login_required
@license_required
def get_current_savings(project_id):
    """GET /api/project/:project/current-savings - simplified."""
    if not _user_has_project_access(project_id):
        return jsonify({"error": "Unauthorized"}), 404
    p = Project.query.get(project_id)
    if not p:
        return jsonify({"error": "Not found"}), 404
    report_data = ReportData.query.filter_by(project=project_id).all()
    rd_list = [(r.period, r.valueType, getattr(r, "type", "project"), r.value) for r in report_data]

    def gv(period, value_type, t="project"):
        for pr, vt, ty, v in rd_list:
            if pr == period and vt == value_type and ty == t:
                return float(v or 0)
        return 0.0

    # Energy Dashboard must not display savings until the EM&V report has been
    # submitted and pushed back. Without a verified analysis, kwhSavings and
    # kwPeakSavings are only pre-installation estimates and must not be used.
    if not getattr(p, "active_emv_analysis_id", None):
        now = datetime.now()
        return jsonify({"meta": {}, "response": {
            "emvRequired": True,
            "todayKwh": round(gv("today", "kwh") * (p.multiplier or 1), 2),
            "hours": now.strftime("%H"),
            "minutes": now.strftime("%M"),
            "todayAvgKw": round(p.avg15MinuteKva or 0, 2),
            "kwPeakPercentSaving": 0,
            "billingRate": round(float(p.kwRate or 0), 2),
            "avgRate": round(float(p.kwhRate or 0), 5),
            "todayKwhSaving": 0,
            "totalMonthSaving": 0,
            "totalLastMonthSaving": 0,
            "totalYearSaving": 0,
            "totalAllTimeSaving": 0,
            "currentMonthKwh": round(gv("month", "kwh") * (p.multiplier or 1), 2),
            "daysOfMonthRecorded": now.day,
            "monthPeakTime": "",
            "projectMonths": 0,
            "beforePf": round(p.initialPf or 100, 2),
            "afterPf": round(p.lastTotalPf or 100, 2),
            "balance": 0,
            "remainingROI": 0,
            "altEnergy": 0,
            "hasAltEnergy": False,
        }})

    now = datetime.now()
    billing_rate = float(p.kwRate or 0)
    avg_rate = float(p.kwhRate or 0)
    today_kwh = gv("today", "kwh") * (p.multiplier or 1)
    month_kwh = gv("month", "kwh") * (p.multiplier or 1)
    month_peak = gv("month", "peak") * (p.multiplier or 1)
    last_month_savings = gv("lastMonth", "totalSavings") * (p.multiplier or 1)
    year_savings = gv("year", "totalSavings") * (p.multiplier or 1)
    all_time_savings = gv("allTime", "totalSavings") * (p.multiplier or 1)
    kwh_savings_pct = float(p.kwhSavings or 0)
    kw_savings_pct = float(p.kwPeakSavings or 0)

    data = {
        "emvRequired": False,
        "todayKwh": round(today_kwh, 2),
        "hours": now.strftime("%H"),
        "minutes": now.strftime("%M"),
        "todayAvgKw": round(p.avg15MinuteKva or 0, 2),
        "kwPeakPercentSaving": kw_savings_pct,
        "billingRate": round(billing_rate, 2),
        "avgRate": round(avg_rate, 5),
        "todayKwhSaving": round(today_kwh * avg_rate * kwh_savings_pct, 2),
        "totalMonthSaving": round(month_kwh * avg_rate * kwh_savings_pct + month_peak * billing_rate * kw_savings_pct, 2),
        "totalLastMonthSaving": round(last_month_savings, 2),
        "totalYearSaving": round(year_savings, 2),
        "totalAllTimeSaving": round(all_time_savings, 2),
        "currentMonthKwh": month_kwh,
        "daysOfMonthRecorded": now.day,
        "monthPeakTime": "",
        "projectMonths": 0,
        "beforePf": round(p.initialPf or 100, 2),
        "afterPf": round(p.lastTotalPf or 100, 2),
        "balance": 0,
        "remainingROI": 0,
        "altEnergy": 0,
        "hasAltEnergy": False,
    }
    return jsonify({"meta": {}, "response": data})


# ----- CARBON SAVINGS (simplified) -----

@phase7_bp.route("/api/project/<int:project_id>/carbon-savings", methods=["GET"])
@login_required
@license_required
def get_carbon_savings(project_id):
    """GET /api/project/:project/carbon-savings"""
    if not _user_has_project_access(project_id):
        return jsonify({"error": "Unauthorized"}), 404
    p = Project.query.get(project_id)
    if not p:
        return jsonify({"error": "Not found"}), 404
    report_data = ReportData.query.filter_by(project=project_id).all()
    rd = {(r.period, r.valueType): r.value for r in report_data}

    def gv(pd, vt):
        return float(rd.get((pd, vt), 0) or 0)

    carbon_ratio = 0.0007054
    today_kwh = gv("today", "kwh")
    week_kwh = gv("week", "kwh")
    month_kwh = gv("month", "kwh")
    carbon_rate = float(p.carbonCreditRate or 0)

    # Do not apply savings multipliers until the EM&V report has been verified
    if not getattr(p, "active_emv_analysis_id", None):
        data = {
            "emvRequired": True,
            "co2Today": round(carbon_ratio * today_kwh, 2),
            "co2TodayBefore": 0,
            "co2TodayDiff": 0,
            "carbonCreditRate": carbon_rate,
            "ccValueToday": 0,
            "ccValueWeek": 0,
            "ccValueMonth": 0,
            "ccValueYear": 0,
            "ccValueProject": 0,
            "passengerVehicles": 0,
            "gallonsOfGasoline": 0,
        }
        return jsonify({"meta": {}, "response": data})

    kwh_saved_pct = float(p.kwhSavings or 0)
    data = {
        "emvRequired": False,
        "co2Today": round(carbon_ratio * today_kwh, 2),
        "co2TodayBefore": round(carbon_ratio * today_kwh / (1 - kwh_saved_pct) if kwh_saved_pct < 1 else 0, 2),
        "co2TodayDiff": round(carbon_ratio * today_kwh * kwh_saved_pct, 2),
        "carbonCreditRate": carbon_rate,
        "ccValueToday": round(carbon_ratio * today_kwh * kwh_saved_pct * carbon_rate, 2),
        "ccValueWeek": round(carbon_ratio * week_kwh * kwh_saved_pct * carbon_rate, 2),
        "ccValueMonth": round(carbon_ratio * month_kwh * kwh_saved_pct * carbon_rate, 2),
        "ccValueYear": round(gv("year", "carbonSavings"), 2),
        "ccValueProject": round(gv("allTime", "carbonSavings"), 2),
        "passengerVehicles": 0,
        "gallonsOfGasoline": 0,
    }
    return jsonify({"meta": {}, "response": data})


# ----- CHARTS, METER DATA, EQUIPMENT -----

@phase7_bp.route("/api/project/<int:project_id>/line-chart-data", methods=["GET"])
@login_required
@license_required
def get_line_chart_data(project_id):
    """GET /api/project/:project/line-chart-data?meters=1,2,3 - ported from get-line-chart-data.js"""
    if not _user_has_project_access(project_id):
        return jsonify({"error": "Unauthorized"}), 404
    meters_param = request.args.get("meters", "")
    if not meters_param:
        return jsonify({"meta": {}, "response": {"chartData": {"kwCurrent": [], "kwBefore": [], "chartLabel": []}}})
    from app.models.project import Project
    from app.models.per_meter_data_aggregate import PerMeterDataAggregate
    from sqlalchemy import text

    project = Project.query.get(project_id)
    if not project:
        return jsonify({"error": "Not found"}), 404
    # Chart data showing a "before" line requires verified EM&V savings percentages.
    # Return an empty chart with the emvRequired flag until an analysis is pushed.
    if not getattr(project, "active_emv_analysis_id", None):
        return jsonify({"meta": {}, "response": {
            "emvRequired": True,
            "chartData": {"kwCurrent": [], "kwBefore": [], "chartLabel": []},
        }})
    meter_ids = [m.strip() for m in meters_param.split(",") if m.strip()]
    if not meter_ids:
        return jsonify({"meta": {}, "response": {"chartData": {"kwCurrent": [], "kwBefore": [], "chartLabel": []}}})
    meter_ids_in = "(" + ",".join(m.strip() for m in meter_ids) + ")"
    try:
        tz = __import__("zoneinfo").ZoneInfo(project.timeZoneId or "UTC")
    except Exception:
        tz = __import__("zoneinfo").ZoneInfo("UTC")
    now = datetime.now(tz)
    day_start = now.strftime("%Y-%m-%d")
    kw_percent_saved = float(project.kwhSavings or 0) if project.kwhSavings else 0
    sql = (
        f"SELECT intervalStartTime, SUM(avgKw) as avgKw, intervalId, day FROM permeterdataaggregate "
        f"WHERE meter IN {meter_ids_in} AND day = :day "
        "GROUP BY intervalId, intervalStartTime ORDER BY intervalStartTime ASC"
    )
    rows = db.session.execute(text(sql), {"day": day_start}).fetchall()
    kw_data = []
    kw_before = []
    time_labels = []
    for row in rows:
        avg_kw = float(row._mapping.get("avgKw") or 0)
        kw_data.append(round(avg_kw, 2))
        kw_before.append(round(avg_kw * (1 + kw_percent_saved), 2))
        ts = row._mapping.get("intervalStartTime")
        if ts:
            time_labels.append(datetime.fromtimestamp(ts / 1000, tz=tz).strftime("%I:%M %p"))
    chart = {"kwCurrent": kw_data, "kwBefore": kw_before, "chartLabel": time_labels}
    return jsonify({"meta": {}, "response": {"chartData": chart}})


@phase7_bp.route("/api/project/<int:project_id>/carbon-chart", methods=["GET"])
@login_required
@license_required
def get_carbon_chart(project_id):
    """GET /api/project/:project/carbon-chart - ported from get-carbon-chart.js"""
    if not _user_has_project_access(project_id):
        return jsonify({"error": "Unauthorized"}), 404
    from app.models.project import Project
    from app.models.meter_data_aggregate import MeterDataAggregate
    from sqlalchemy import text

    project = Project.query.get(project_id)
    if not project:
        return jsonify({"error": "Not found"}), 404
    try:
        tz = __import__("zoneinfo").ZoneInfo(project.timeZoneId or "UTC")
    except Exception:
        tz = __import__("zoneinfo").ZoneInfo("UTC")
    now = datetime.now(tz)
    day_start = now.strftime("%Y-%m-%d")
    kw_percent_saved = float(project.kvaSavings or 0) if project.kvaSavings else 0
    rows = MeterDataAggregate.query.filter_by(
        project=project_id, day=day_start
    ).order_by(MeterDataAggregate.intervalStartTime.asc()).all()
    if not rows:
        return jsonify({"meta": {}, "response": {"chartData": {"carbonCurrent": [], "carbonBefore": [], "chartLabel": []}}})
    from collections import defaultdict
    by_hour = defaultdict(list)
    for r in rows:
        ts = r.intervalStartTime or 0
        hr = int(datetime.fromtimestamp(ts / 1000, tz=tz).strftime("%H"))
        kw = float(r.avgKw or 0)
        by_hour[hr].append((ts, kw))
    carbon_current = []
    carbon_before = []
    time_labels = []
    for hr in sorted(by_hour.keys()):
        vals = by_hour[hr]
        avg_kw = sum(k for _, k in vals) / len(vals) if vals else 0
        avg_val = avg_kw * (0.7054 / 1000)
        carbon_current.append(round(avg_val, 2))
        carbon_before.append(round(avg_val * (1 + kw_percent_saved), 2))
        ts0 = vals[0][0] if vals else 0
        time_labels.append(datetime.fromtimestamp(ts0 / 1000, tz=tz).strftime("%I:00 %p"))
    chart = {"carbonCurrent": carbon_current, "carbonBefore": carbon_before, "chartLabel": time_labels}
    return jsonify({"meta": {}, "response": {"chartData": chart}})


@phase7_bp.route("/api/project/<int:project_id>/meterdata-detail", methods=["GET"])
@login_required
@license_required
def get_meterdata_detail(project_id):
    """GET /api/project/:project/meterdata-detail?meters=1,2,3 - ported from get-meterdata-detail.js"""
    if not _user_has_project_access(project_id):
        return jsonify({"error": "Unauthorized"}), 404
    meters_param = request.args.get("meters", "")
    if not meters_param:
        return jsonify({"meta": {}, "response": {}})
    from app.models.project import Project
    from app.models.meter import Meter
    from app.services.test_calculation_service import calculate_test_results

    project = Project.query.get(project_id)
    if not project:
        return jsonify({"error": "Not found"}), 404
    meter_ids = [m.strip() for m in meters_param.split(",") if m.strip()]
    if not meter_ids:
        return jsonify({"meta": {}, "response": {}})
    meters_str = ",".join(meter_ids)
    test_id = project.selectedTest
    if not test_id:
        return jsonify({"meta": {}, "response": {"p1Kvar": 0, "p2Kvar": 0, "p3Kvar": 0, "p1Volt": 0, "p2Volt": 0, "p3Volt": 0, "amp": 0, "beforeAmp": 0, "ampPercent": 0, "pf": 0, "beforePf": 0}})
    try:
        _ = calculate_test_results(test_id, meters_str)
    except Exception:
        pass
    meters_q = Meter.query.filter(
        Meter.id.in_([int(m) for m in meter_ids if str(m).isdigit()]),
        Meter.isDeleted == False,
        Meter.lastL1Kw > 0,
    ).all()
    if not meters_q:
        return jsonify({"meta": {}, "response": {"p1Kvar": 0, "p2Kvar": 0, "p3Kvar": 0, "p1Volt": 0, "p2Volt": 0, "p3Volt": 0, "amp": 0, "beforeAmp": 0, "ampPercent": 0, "pf": 0, "beforePf": 0}})
    l1_volts = [m.lastL1Volt or 0 for m in meters_q]
    l2_volts = [m.lastL2Volt or 0 for m in meters_q]
    l3_volts = [m.lastL3Volt or 0 for m in meters_q]
    l1_kvars = [m.lastL1Kvar or 0 for m in meters_q]
    l2_kvars = [m.lastL2Kvar or 0 for m in meters_q]
    l3_kvars = [m.lastL3Kvar or 0 for m in meters_q]
    total_amps = sum(m.lastTotalAmp or 0 for m in meters_q)
    total_pf = [m.lastTotalPf or 100 for m in meters_q]
    pf_vals = [100 if p <= 70 else p for p in total_pf]
    n = len(meters_q)
    avgl1_volt = sum(l1_volts) / n
    avgl2_volt = sum(l2_volts) / n
    avgl3_volt = sum(l3_volts) / n
    avgl1_kvar = sum(l1_kvars) / n
    avgl2_kvar = sum(l2_kvars) / n
    avgl3_kvar = sum(l3_kvars) / n
    pf_avg = sum(pf_vals) / n
    pf_savings = float(project.pfSavings or 0)
    kwh_savings = float(project.kwhSavings or 0)
    kvar_savings = float(project.kvarSavings or 0)
    before_pf = pf_avg / (1 - pf_savings) if pf_savings else pf_avg
    before_amp = total_amps / (1 - kwh_savings) if kwh_savings else total_amps
    def mag(v):
        return abs(v) / (1 - kvar_savings) if kvar_savings else abs(v)
    before_p1 = mag(avgl1_kvar)
    before_p2 = mag(avgl2_kvar)
    before_p3 = mag(avgl3_kvar)
    p1_kvar_red = before_p1 - avgl1_kvar
    p2_kvar_red = before_p2 - avgl2_kvar
    p3_kvar_red = before_p3 - avgl3_kvar
    data = {
        "p1Kvar": round(p1_kvar_red, 1),
        "p2Kvar": round(p2_kvar_red, 1),
        "p3Kvar": round(p3_kvar_red, 1),
        "p1Volt": round(avgl1_volt, 1),
        "p2Volt": round(avgl2_volt, 1),
        "p3Volt": round(avgl3_volt, 1),
        "amp": round(total_amps, 2),
        "beforeAmp": round(before_amp, 2),
        "ampPercent": round((total_amps / 600) * 100),
        "pf": pf_avg,
        "beforePf": round(before_pf, 2),
    }
    return jsonify({"meta": {}, "response": data})


@phase7_bp.route("/api/project/all-equipment-savings", methods=["GET"])
@login_required
@license_required
def get_all_equipment_savings():
    """GET /api/project/all-equipment-savings?project=X - ported from get-all-equipment-savings.js"""
    project_id = request.args.get("project", type=int)
    if not project_id or not _user_has_project_access(project_id):
        return jsonify({"error": "Unauthorized"}), 404
    from app.models.schedule import Schedule
    from app.models.switch import Switch
    from zoneinfo import ZoneInfo

    project = Project.query.get(project_id)
    if not project:
        return jsonify({"error": "Not found"}), 404
    try:
        tz = ZoneInfo(project.timeZoneId or "UTC")
    except Exception:
        tz = ZoneInfo("UTC")
    now = datetime.now(tz)
    try:
        from datetime import datetime as dt
        proj_start = dt.strptime(str(project.startDate or "2000-01-01")[:10], "%Y-%m-%d").replace(tzinfo=tz)
        project_months = max(0, (now - proj_start).days / 30.44)
    except Exception:
        project_months = 12
    avg_rate = float(project.kwhRate or 0)
    daily_before = daily_after = daily_kwh_saving = daily_saving = 0.0
    weekly_saving = monthly_saving = yearly_saving = all_time_saving = 0.0
    schedules = Schedule.query.filter_by(
        project=project_id, isCompleted=False, isDeleted=False
    ).all()
    scheduler_ids = set()
    for s in schedules:
        for sw in (s.switches or []):
            if sw is not None:
                scheduler_ids.add(int(sw))
    if not scheduler_ids:
        return jsonify({"meta": {}, "response": {
            "dailyBeforeKwh": 0, "dailyAfterKwh": 0, "dailyKwhSaving": 0,
            "dailySaving": 0, "weeklySaving": 0, "monthlySaving": 0,
            "yearlySaving": 0, "allTimeSaving": 0,
        }})
    schedulers = Switch.query.filter(
        Switch.id.in_(scheduler_ids),
        Switch.deviceType == 2,
        Switch.isDeleted == False,
        Switch.project == project_id,
    ).all()
    sched_by_id = {s.id: s for s in schedulers}
    for sched in schedules:
        for sw_id in (sched.switches or []):
            sched_sw = sched_by_id.get(sw_id)
            if not sched_sw:
                continue
            hours_off = float(sched.totalHoursOff or 0)
            vol = float(sched_sw.voltage or 0)
            amp = float(sched_sw.ampLoad or 0)
            pf_val = sched_sw.pf or 1
            pf = (float(pf_val) / 100.0) if (pf_val or 0) > 1 else float(pf_val or 1)
            orig = float(sched_sw.originalHours or 24)
            x = (vol * amp / 1000) * pf if vol and amp else 0
            if not x:
                continue
            days = len(sched.daysOfWeek or []) or 5
            daily_before += x * orig
            daily_after += x * (orig - hours_off)
            daily_kwh_saving += x * hours_off
            daily_saving += x * hours_off * avg_rate
            weekly_saving += x * hours_off * days * avg_rate
            monthly_saving += x * hours_off * days * 4 * avg_rate
            y_factor = 12 if project_months >= 12 else project_months
            yearly_saving += x * hours_off * days * 4 * avg_rate * y_factor
            all_time_saving += x * hours_off * days * 4 * avg_rate * project_months
    return jsonify({"meta": {}, "response": {
        "dailyBeforeKwh": daily_before,
        "dailyAfterKwh": daily_after,
        "dailyKwhSaving": daily_kwh_saving,
        "dailySaving": daily_saving,
        "weeklySaving": weekly_saving,
        "monthlySaving": monthly_saving,
        "yearlySaving": yearly_saving,
        "allTimeSaving": all_time_saving,
    }})


@phase7_bp.route("/api/switch/equipment/get-usage", methods=["GET"])
@login_required
@license_required
def get_equipment_usage():
    """GET /api/switch/equipment/get-usage?project=X&switch=Y - ported from get-equipment-usage.js"""
    project_id = request.args.get("project", type=int)
    switch_id = request.args.get("switch", type=int)
    if not project_id or not switch_id or not _user_has_project_access(project_id):
        return jsonify({"error": "Unauthorized"}), 404
    from app.models.switch import Switch
    from app.models.equipment_data import EquipmentData
    from sqlalchemy import text
    from zoneinfo import ZoneInfo

    project = Project.query.get(project_id)
    if not project:
        return jsonify({"error": "Not found"}), 404
    scheduler = Switch.query.filter_by(
        id=switch_id, project=project_id, isDeleted=False
    ).first()
    if not scheduler:
        return jsonify({"error": "Not found"}), 404
    try:
        tz = ZoneInfo(project.timeZoneId or "UTC")
    except Exception:
        tz = ZoneInfo("UTC")
    now = datetime.now(tz)
    last_month_dt = (now.replace(day=1) - __import__("datetime").timedelta(days=1))
    this_month = now.strftime("%m")
    last_month = last_month_dt.strftime("%m")
    last_month_year = last_month_dt.strftime("%Y")
    current_year = now.strftime("%Y")
    last_year = str(now.year - 1)
    sql = (
        "SELECT YEAR(day) as year, MONTH(day) as month, AVG(totalKva) as avgKva, MAX(totalKva) as peak "
        "FROM equipmentdata WHERE switch = :sw GROUP BY year, month ORDER BY year DESC, month DESC"
    )
    rows = db.session.execute(text(sql), {"sw": switch_id}).fetchall()
    project_total = year_total = year_peaks = 0.0
    current_month_kwh = last_month_kwh = last_month_peak = 0.0
    last_year_total = last_year_peaks = 0.0
    remaining_kwh = remaining_peaks = 0.0
    if rows:
        for row in rows:
            yr, mo = str(row._mapping.get("year") or ""), int(row._mapping.get("month") or 0)
            peak = float(row._mapping.get("peak") or 0)
            avg_kva = float(row._mapping.get("avgKva") or 0)
            days_in_month = 28 if mo == 2 else (30 if mo in (4, 6, 9, 11) else 31)
            hrs = days_in_month * 24
            kwh = avg_kva * hrs
            if mo == int(this_month) and yr == current_year:
                current_month_kwh = kwh
            elif mo == int(last_month) and yr == last_month_year:
                last_month_kwh = kwh
                last_month_peak = peak
            if yr == current_year:
                year_total += kwh
                year_peaks += peak
            elif yr == last_year:
                last_year_total += kwh
                last_year_peaks += peak
            else:
                remaining_kwh += kwh
                remaining_peaks += peak
            project_total += kwh
    project_total = year_total + last_year_total + remaining_kwh
    output = {
        "totalKwh": project_total,
        "totalCost": project_total * float(project.kwhRate or 0),
        "scheduler": {
            "ampLoad": scheduler.ampLoad,
            "voltage": scheduler.voltage,
            "pf": scheduler.pf,
            "OriginalHours": scheduler.originalHours,
            "hasSchedule": scheduler.hasSchedule,
        },
        "monthCost": round(last_month_kwh * float(project.kwhRate or 0), 2),
        "yearCost": round(year_total * float(project.kwhRate or 0), 2),
    }
    return jsonify({"meta": {}, "response": output})


@phase7_bp.route("/api/switch/equipment/get-detail", methods=["GET"])
@login_required
@license_required
def get_equipment_detail():
    """GET /api/switch/equipment/get-detail - ported from get-scheduler-detail.js. Params: project, meter, fromDate, toDate, type, period, equipment"""
    project_id = request.args.get("project", type=int)
    meter_id = request.args.get("meter", type=int)
    from_date = request.args.get("fromDate", type=int)
    to_date = request.args.get("toDate", type=int)
    data_type = request.args.get("type", "kw")
    period = request.args.get("period", "hour")
    equipment = request.args.get("equipment", "").lower() in ("1", "true", "yes")
    if not project_id or not meter_id or not _user_has_project_access(project_id):
        return jsonify({"error": "Unauthorized"}), 404
    from app.models.switch import Switch
    from app.models.equipment_data import EquipmentData
    from app.models.meter_data import MeterData
    from app.models.pi_board import PiBoard
    from sqlalchemy import text
    from zoneinfo import ZoneInfo

    now_ms = int(datetime.utcnow().timestamp() * 1000)
    from_date = from_date or now_ms
    to_date = to_date or now_ms
    if from_date > now_ms or from_date > to_date:
        return jsonify({"error": "Invalid date range"}), 400
    project = Project.query.get(project_id)
    if not project:
        return jsonify({"error": "Not found"}), 404
    try:
        tz = ZoneInfo(project.timeZoneId or "UTC")
    except Exception:
        tz = ZoneInfo("UTC")
    scheduler = Switch.query.filter_by(id=meter_id, project=project_id, deviceType=2).first()
    if not scheduler:
        return jsonify({"error": "Not found"}), 404
    start_dt = datetime.fromtimestamp(from_date / 1000, tz=tz).replace(hour=0, minute=0, second=0, microsecond=0)
    end_dt = datetime.fromtimestamp(to_date / 1000, tz=tz)
    start_day = start_dt.strftime("%Y-%m-%d")
    end_day = end_dt.strftime("%Y-%m-%d")
    report_data = ReportData.query.filter_by(
        project=project_id, type="scheduler", typeId=meter_id
    ).all()
    rd_by_key = {}
    for r in report_data:
        key = (r.period or "", r.valueType or "")
        rd_by_key[key] = r.value or 0
    def _rd(p, v):
        return rd_by_key.get((p, v), 0)
    if equipment:
        sql = (
            "SELECT recordedAt, l1Kw, l2Kw, l3Kw, l1Kva, l2Kva, l3Kva, l1Volt, l2Volt, l3Volt, "
            "l1Amp, l2Amp, l3Amp, l1Kvar, l2Kvar, l3Kvar, l1Pf, l2Pf, l3Pf, "
            "l1VoltTHD, l2VoltTHD, l3VoltTHD, l1AmpTHD, l2AmpTHD, l3AmpTHD, "
            "totalVoltTHD, totalAmpTHD, totalAmp, totalVolt, totalKva "
            "FROM equipmentdata WHERE switch = :sw AND day >= :sday AND day <= :eday ORDER BY recordedAt ASC"
        )
        try:
            rows = db.session.execute(text(sql), {"sw": meter_id, "sday": start_day, "eday": end_day}).fetchall()
        except Exception:
            sql = (
                "SELECT recordedAt, l1Kw, l2Kw, l3Kw, l1Kva, l2Kva, l3Kva, l1Volt, l2Volt, l3Volt, "
                "l1Amp, l2Amp, l3Amp, l1Kvar, l2Kvar, l3Kvar, l1Pf, l2Pf, l3Pf, "
                "totalAmp, totalVolt, totalKva FROM equipmentdata "
                "WHERE switch = :sw AND day >= :sday AND day <= :eday ORDER BY recordedAt ASC"
            )
            rows = db.session.execute(text(sql), {"sw": meter_id, "sday": start_day, "eday": end_day}).fetchall()
    else:
        sql = (
            "SELECT MAX(recordedAt) as recordedAt, SUM(l1Kw) as l1Kw, SUM(l2Kw) as l2Kw, SUM(l3Kw) as l3Kw, "
            "SUM(l1Kva) as l1Kva, SUM(l2Kva) as l2Kva, SUM(l3Kva) as l3Kva, "
            "SUM(l1Volt) as l1Volt, SUM(l2Volt) as l2Volt, SUM(l3Volt) as l3Volt, "
            "SUM(l1Amp) as l1Amp, SUM(l2Amp) as l2Amp, SUM(l3Amp) as l3Amp, "
            "SUM(l1Kvar) as l1Kvar, SUM(l2Kvar) as l2Kvar, SUM(l3Kvar) as l3Kvar, "
            "AVG(l1Pf) as l1Pf, AVG(l2Pf) as l2Pf, AVG(l3Pf) as l3Pf "
            "FROM meterdata WHERE meter = :m AND day >= :sday AND day <= :eday GROUP BY minute, intervalId, day ORDER BY recordedAt ASC"
        )
        rows = db.session.execute(text(sql), {"m": meter_id, "sday": start_day, "eday": end_day}).fetchall()
        if not rows:
            sql = (
                "SELECT recordedAt, l1Kw, l2Kw, l3Kw, l1Kva, l2Kva, l3Kva, l1Volt, l2Volt, l3Volt, "
                "l1Amp, l2Amp, l3Amp, l1Kvar, l2Kvar, l3Kvar, l1Pf, l2Pf, l3Pf, "
                "totalAmp, totalVolt, totalKva FROM equipmentdata "
                "WHERE switch = :sw AND day >= :sday AND day <= :eday ORDER BY recordedAt ASC"
            )
            try:
                rows = db.session.execute(text(sql), {"sw": meter_id, "sday": start_day, "eday": end_day}).fetchall()
            except Exception:
                sql = (
                    "SELECT recordedAt, l1Kw, l2Kw, l3Kw, l1Kva, l2Kva, l3Kva, l1Volt, l2Volt, l3Volt, "
                    "l1Amp, l2Amp, l3Amp, l1Kvar, l2Kvar, l3Kvar, l1Pf, l2Pf, l3Pf, "
                    "l1VoltTHD, l2VoltTHD, l3VoltTHD, l1AmpTHD, l2AmpTHD, l3AmpTHD, "
                    "totalVoltTHD, totalAmpTHD, totalAmp, totalVolt, totalKva "
                    "FROM equipmentdata WHERE switch = :sw AND day >= :sday AND day <= :eday ORDER BY recordedAt ASC"
                )
                rows = db.session.execute(text(sql), {"sw": meter_id, "sday": start_day, "eday": end_day}).fetchall()
    p1_data, p2_data, p3_data, time_labels, volt_data, current_data = [], [], [], [], [], []
    phase_map = {"kw": ("l1Kw", "l2Kw", "l3Kw"), "kva": ("l1Kva", "l2Kva", "l3Kva"), "voltage": ("l1Volt", "l2Volt", "l3Volt"),
                 "amperage": ("l1Amp", "l2Amp", "l3Amp"), "kvar": ("l1Kvar", "l2Kvar", "l3Kvar"), "pf": ("l1Pf", "l2Pf", "l3Pf"),
                 "voltthd": ("l1VoltTHD", "l2VoltTHD", "l3VoltTHD"), "ampthd": ("l1AmpTHD", "l2AmpTHD", "l3AmpTHD")}
    phase_cols = phase_map.get(data_type, ("l1Kw", "l2Kw", "l3Kw"))
    current_minute = {"totalVolt": 0, "totalAmp": 0, "totalKva": 0, "totalKvar": 0, "totalPf": 0, "totalVoltTHD": 0, "totalAmpTHD": 0,
                      "l1Volt": 0, "l2Volt": 0, "l3Volt": 0, "l1Amp": 0, "l2Amp": 0, "l3Amp": 0, "l1Kw": 0, "l2Kw": 0, "l3Kw": 0,
                      "l1Kva": 0, "l2Kva": 0, "l3Kva": 0, "l1Kvar": 0, "l2Kvar": 0, "l3Kvar": 0,
                      "l1Pf": 0, "l2Pf": 0, "l3Pf": 0, "l1VoltTHD": 0, "l2VoltTHD": 0, "l3VoltTHD": 0, "l1AmpTHD": 0, "l2AmpTHD": 0, "l3AmpTHD": 0}
    volt_thd = amp_thd = 0.0
    danger = False
    if rows:
        last = rows[-1]
        m = last._mapping if hasattr(last, "_mapping") else {}
        for k in current_minute:
            current_minute[k] = float(m.get(k, 0) or 0)
        if data_type == "current&voltage" and rows:
            volt_tmp = [float(r._mapping.get("totalVolt", 0) or 0) for r in rows]
            curr_tmp = [float(r._mapping.get("totalAmp", 0) or 0) for r in rows]
            timestamps = [r._mapping.get("recordedAt") for r in rows]
            prev_hr = None
            vh, ch, cnt = 0, 0, 1
            for i in range(1, len(timestamps)):
                hr = int(datetime.fromtimestamp((timestamps[i] or 0) / 1000, tz=tz).strftime("%H"))
                if prev_hr is not None and hr != prev_hr:
                    volt_data.append(round(vh / cnt))
                    current_data.append(round(ch / cnt))
                    time_labels.append(datetime.fromtimestamp((timestamps[i - 1] or 0) / 1000, tz=tz).strftime("%b-%d %I:00 %p"))
                    vh, ch, cnt = volt_tmp[i], curr_tmp[i], 1
                else:
                    vh += volt_tmp[i] if i > 1 else volt_tmp[i - 1]
                    ch += curr_tmp[i] if i > 1 else curr_tmp[i - 1]
                    cnt += 1
                prev_hr = hr
        elif data_type != "current&voltage" and rows:
            p1_col, p2_col, p3_col = phase_cols[0], phase_cols[1], phase_cols[2]
            p1_tmp = [float(r._mapping.get(p1_col, 0) or 0) for r in rows]
            p2_tmp = [float(r._mapping.get(p2_col, 0) or 0) for r in rows]
            p3_tmp = [float(r._mapping.get(p3_col, 0) or 0) for r in rows]
            timestamps = [r._mapping.get("recordedAt") for r in rows]
            if period == "hour":
                prev_hr, ph1, ph2, ph3, cnt = None, 0, 0, 0, 1
                for i in range(1, len(timestamps)):
                    hr = int(datetime.fromtimestamp((timestamps[i] or 0) / 1000, tz=tz).strftime("%H"))
                    if prev_hr is not None and hr != prev_hr:
                        p1_data.append(round(ph1 / cnt))
                        p2_data.append(round(ph2 / cnt))
                        p3_data.append(round(ph3 / cnt))
                        time_labels.append(datetime.fromtimestamp((timestamps[i - 1] or 0) / 1000, tz=tz).strftime("%b-%d %I:00 %p"))
                        ph1, ph2, ph3, cnt = p1_tmp[i], p2_tmp[i], p3_tmp[i], 1
                    else:
                        ph1 += p1_tmp[i] if i > 1 else p1_tmp[i - 1]
                        ph2 += p2_tmp[i] if i > 1 else p2_tmp[i - 1]
                        ph3 += p3_tmp[i] if i > 1 else p3_tmp[i - 1]
                        cnt += 1
                    prev_hr = hr
            else:
                for r in rows:
                    time_labels.append(datetime.fromtimestamp((r._mapping.get("recordedAt") or 0) / 1000, tz=tz).strftime("%b-%d %I:%M %p"))
                p1_data = [round(float(r._mapping.get(p1_col, 0) or 0), 2) for r in rows]
                p2_data = [round(float(r._mapping.get(p2_col, 0) or 0), 2) for r in rows]
                p3_data = [round(float(r._mapping.get(p3_col, 0) or 0), 2) for r in rows]
        last = rows[-1]._mapping if rows and hasattr(rows[-1], "_mapping") else {}
        volt_thd = float(last.get("totalVoltTHD", 0) or 0)
        amp_thd = float(last.get("totalAmpTHD", 0) or 0)
        danger = volt_thd > 8 or amp_thd > 15
    piboard = PiBoard.query.filter_by(deviceId=scheduler.deviceId).first()
    status_list = []
    if piboard:
        status_list.append("Off" if piboard.switchState else "On")
    else:
        status_list.append("Undefined")
    cur_time = int(datetime.utcnow().timestamp() * 1000)
    if (scheduler.meshLastCommunicatedAt or 0) < cur_time - 3 * 60 * 1000:
        status_list = ["Poweroff"]
    if scheduler.hasSchedule:
        status_list.append("Scheduled")
    sched_dict = {c: getattr(scheduler, c) for c in ["id", "name", "ampLoad", "voltage", "pf", "originalHours", "hasSchedule"]}
    sched_dict["status"] = status_list
    output = {
        "hours": datetime.now(tz).strftime("%H"),
        "minutes": datetime.now(tz).strftime("%M"),
        "totalVoltTHD": round(volt_thd, 1),
        "totalAmpTHD": round(amp_thd, 1),
        "p1Data": p1_data,
        "p2Data": p2_data,
        "p3Data": p3_data,
        "timeLabels": time_labels,
        "voltData": volt_data,
        "currentData": current_data,
        "volt": {"p1": round(current_minute.get("l1Volt", 0), 0), "p2": round(current_minute.get("l2Volt", 0), 0), "p3": round(current_minute.get("l3Volt", 0), 0)},
        "amp": {"p1": round(current_minute.get("l1Amp", 0), 2), "p2": round(current_minute.get("l2Amp", 0), 2), "p3": round(current_minute.get("l3Amp", 0), 2)},
        "kva": {"p1": round(current_minute.get("l1Kva", 0), 2), "p2": round(current_minute.get("l2Kva", 0), 2), "p3": round(current_minute.get("l3Kva", 0), 2)},
        "kw": {"p1": round(current_minute.get("l1Kw", 0), 2), "p2": round(current_minute.get("l2Kw", 0), 2), "p3": round(current_minute.get("l3Kw", 0), 2)},
        "kvar": {"p1": round(current_minute.get("l1Kvar", 0), 2), "p2": round(current_minute.get("l2Kvar", 0), 2), "p3": round(current_minute.get("l3Kvar", 0), 2)},
        "pf": {"p1": round(1 - current_minute.get("l1Pf", 0), 2), "p2": round(1 - current_minute.get("l2Pf", 0), 2), "p3": round(1 - current_minute.get("l3Pf", 0), 2)},
        "voltTHD": {"p1": round(current_minute.get("l1VoltTHD", 0), 2), "p2": round(current_minute.get("l2VoltTHD", 0), 2), "p3": round(current_minute.get("l3VoltTHD", 0), 2)},
        "ampTHD": {"p1": round(current_minute.get("l1AmpTHD", 0), 2), "p2": round(current_minute.get("l2AmpTHD", 0), 2), "p3": round(current_minute.get("l3AmpTHD", 0), 2)},
        "powerFactor": round((1 - current_minute.get("totalPf", 0)) * 100, 2),
        "danger": danger,
        "todayKwh": _rd("today", "kwh"),
        "todayCost": _rd("today", "totalCost"),
        "weekCost": _rd("week", "totalCost"),
        "monthCost": _rd("month", "totalCost"),
        "yearCost": _rd("year", "totalCost"),
        "projectCost": _rd("allTime", "totalCost"),
        "scheduler": sched_dict,
    }
    return jsonify({"meta": {}, "response": output})


# ----- CALCULATE SAVINGS (background execution) -----

def _run_in_background(target):
    """Start target in a background thread with Flask app context. Returns immediately."""
    import threading
    from flask import current_app
    app = current_app._get_current_object()

    def _run():
        with app.app_context():
            try:
                target()
            except Exception as e:
                import logging
                logging.getLogger(__name__).exception("Background task failed: %s", e)

    t = threading.Thread(target=_run)
    t.daemon = True
    t.start()


@phase7_bp.route("/api/project/calculate-savings", methods=["PUT"])
@login_required
@license_required
def calculate_savings():
    """PUT /api/project/calculate-savings - queues per-meter savings calculation in background."""
    from app.services.calculate_savings_service import run_calculate_savings
    _run_in_background(run_calculate_savings)
    return jsonify({"meta": {}, "response": {"message": "Queued"}})


@phase7_bp.route("/api/project/calculate-project-savings", methods=["PUT"])
@login_required
@license_required
def calculate_project_savings():
    """PUT /api/project/calculate-project-savings - queues project-level savings calculation in background."""
    from app.services.calculate_savings_service import run_calculate_project_savings
    _run_in_background(run_calculate_project_savings)
    return jsonify({"meta": {}, "response": {"message": "Queued"}})


@phase7_bp.route("/api/project/calculate-week-savings", methods=["PUT"])
@login_required
@license_required
def calculate_week_savings():
    """PUT /api/project/calculate-week-savings - queues weekly savings update in background."""
    from app.services.calculate_savings_service import run_calculate_week_savings
    _run_in_background(run_calculate_week_savings)
    return jsonify({"meta": {}, "response": {"message": "Queued"}})
