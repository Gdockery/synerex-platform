"""
Calculate savings service - ports api/controllers/web/project/calculate-savings.js
and calculate-project-savings.js. Runs meter-level and project-level savings computation.
Designed to run in a background thread (long-running).
"""
import logging
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy import text

from app.extensions import db
from app.models.meter import Meter
from app.models.project import Project
from app.models.report_data import ReportData
from app.services.test_calculation_service import calculate_test_results

logger = logging.getLogger(__name__)


def _upsert_report_data(project_id, type_name, type_id, period, value_type, value, description=""):
    """Update or create ReportData record."""
    existing = ReportData.query.filter_by(
        project=project_id, type=type_name, typeId=type_id, period=period, valueType=value_type
    ).first()
    if existing:
        existing.value = value
        existing.description = description or existing.description
    else:
        r = ReportData(
            project=project_id, type=type_name, typeId=type_id, period=period,
            valueType=value_type, value=value, description=description,
        )
        db.session.add(r)


def run_calculate_savings():
    """
    Per-meter savings calculation. Ported from calculate-savings.js.
    Iterates projects and main meters, computes ReportData from permeterdataaggregate and test results.
    """
    projects = Project.query.filter_by(isDeleted=False).all()
    logger.info("[calculate-savings] started, %d projects", len(projects))
    for project in projects:
        try:
            _run_calculate_savings_project(project)
            db.session.commit()
        except Exception as e:
            logger.exception("[calculate-savings] project %s: %s", project.id, e)
            db.session.rollback()
    logger.info("[calculate-savings] done")


def _run_calculate_savings_project(project):
    """Process one project for meter savings."""
    try:
        tz = ZoneInfo(project.timeZoneId or "UTC")
    except Exception:
        tz = ZoneInfo("UTC")
    now = datetime.now(tz)
    this_month = now.strftime("%m")
    last_month_dt = (now.replace(day=1) - timedelta(days=1))
    last_month = last_month_dt.strftime("%m")
    last_month_year = last_month_dt.strftime("%Y")
    current_year = now.strftime("%Y")
    last_year = str(now.year - 1)
    today = now.strftime("%Y-%m-%d")
    day_of_week = now.weekday()  # Monday=0, Sunday=6
    days_to_sunday = (day_of_week + 1) % 7  # Days back to reach Sunday (week start)
    week_start_dt = now - timedelta(days=days_to_sunday)
    week_start = week_start_dt.strftime("%Y-%m-%d")
    week_end_dt = now + timedelta(days=6 - day_of_week)
    week_end = week_end_dt.strftime("%Y-%m-%d")
    month_start = now.replace(day=1).strftime("%Y-%m-%d")
    month_end = (now.replace(day=28) + timedelta(days=4)).replace(day=1) - timedelta(days=1)
    month_end = month_end.strftime("%Y-%m-%d")
    week_diff = (now - week_start_dt.replace(hour=0, minute=0, second=0, microsecond=0)).total_seconds() / 3600
    month_diff = (now - now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)).total_seconds() / 3600
    day_diff = (now - now.replace(hour=0, minute=0, second=0, microsecond=0)).total_seconds() / 3600
    start_date_filter = f" AND day >= '{project.startDate}'" if project.startDate else ""

    meters = Meter.query.filter_by(
        project=project.id, isDeleted=False, isMain=True
    ).filter(Meter.lastCommunicatedAt > 0).all()
    if not meters:
        return
    for meter in meters:
        try:
            results = None
            if project.selectedTest:
                try:
                    results = calculate_test_results(project.selectedTest, str(meter.id))
                except Exception:
                    pass
            kw_peak_savings = kwh_savings = 0.0
            if results and results.get("percentSaved"):
                ps = results["percentSaved"]
                kw_peak_savings = 0 if ps.get("kwPeak") == 1 else (ps.get("kwPeak") or 0) / (1 - (ps.get("kwPeak") or 0))
                kwh_savings = 0 if ps.get("kwh") == 1 else (ps.get("kwh") or 0) / (1 - (ps.get("kwh") or 0))

            week_sql = f"SELECT AVG(avgKw) AS weekAvgKw FROM permeterdataaggregate WHERE meter = {meter.id} AND day >= '{week_start}' AND day <= '{week_end}'"
            week_row = db.session.execute(text(week_sql)).fetchone()
            week_avg_kw = float(week_row._mapping["weekAvgKw"]) if week_row else 0

            sql2 = (
                f"SELECT YEAR(day) as year, MONTH(day) as month, AVG(metersum.sumKva) as avgKva, MAX(metersum.sumKva) as peak FROM "
                f"(SELECT AVG(avgKva) as sumKva, intervalId, day FROM permeterdataaggregate WHERE meter = {meter.id}{start_date_filter} GROUP BY intervalId, day) as metersum "
                "GROUP BY year, month ORDER BY year DESC, month DESC"
            )
            rows2 = db.session.execute(text(sql2)).fetchall()
            if not rows2:
                continue
            all_peaks = [list(r._mapping[k] for r in rows2) for k in ("year", "month", "peak", "avgKva")]
            current_month_peak = current_month_kwh = current_month_avg_kw = 0.0
            last_month_peak = last_month_kwh = last_month_avg_kw = 0.0
            year_total_peaks = year_total_kwh = 0.0
            last_year_peaks = last_year_kwh = 0.0
            remaining_peaks = remaining_kwh = 0.0
            for i in range(len(all_peaks[0])):
                yr, mo = int(all_peaks[0][i] or 0), int(all_peaks[1][i] or 0)
                peak = float(all_peaks[2][i] or 0)
                avg_kva = float(all_peaks[3][i] or 0)
                hours_in_month = 28 if mo == 2 else (30 if mo in (4, 6, 9, 11) else 31) * 24
                kwh = avg_kva * hours_in_month
                if mo == int(this_month) and yr == int(current_year):
                    current_month_peak = peak
                    current_month_kwh = avg_kva * month_diff
                    current_month_avg_kw = avg_kva
                elif mo == int(last_month) and yr == int(last_month_year):
                    last_month_peak = peak
                    last_month_kwh = avg_kva * hours_in_month
                    last_month_avg_kw = avg_kva
                if project.startDate:
                    from datetime import datetime as dt
                    month_str = f"{yr}-{mo:02d}-01"
                    try:
                        if dt.strptime(month_str, "%Y-%m-%d") < dt.strptime(project.startDate[:10], "%Y-%m-%d"):
                            continue
                    except Exception:
                        pass
                if yr == int(current_year):
                    year_total_peaks += peak
                    year_total_kwh += kwh
                elif yr == int(last_year):
                    last_year_peaks += peak
                    last_year_kwh += kwh
                else:
                    remaining_peaks += peak
                    remaining_kwh += kwh
            year_total_peaks -= current_month_peak
            year_total_kwh -= current_month_kwh
            project_total_peaks = year_total_peaks + last_year_peaks + remaining_peaks
            project_total_kwh = year_total_kwh + last_year_kwh + remaining_kwh

            today_sql = f"SELECT AVG(avgKva) as avgKva FROM permeterdataaggregate WHERE meter = {meter.id} AND day = '{today}'"
            today_row = db.session.execute(text(today_sql)).fetchone()
            today_kw = float(today_row._mapping["avgKva"]) if today_row else 0
            current_month_peak_time = "No data for this month, peak for last month"
            peak_row = None
            if current_month_peak and current_month_peak > 0:
                peak_sql = (
                    f"SELECT intervalStartTime FROM (SELECT SUM(avgKva) as sumKva, MAX(intervalStartTime) as intervalStartTime "
                    f"FROM permeterdataaggregate WHERE meter = {meter.id} AND day >= '{month_start}' AND day <= '{month_end}' GROUP BY intervalId, day) as metersum "
                    f"WHERE metersum.sumKva = {current_month_peak} LIMIT 1"
                )
                peak_row = db.session.execute(text(peak_sql)).fetchone()
            if peak_row and peak_row._mapping.get("intervalStartTime"):
                ts_ms = peak_row._mapping["intervalStartTime"]
                current_month_peak_time = datetime.fromtimestamp(ts_ms / 1000, tz=tz).strftime("%Y/%m/%d %I:%M:%S %p")
            pf_ratio = (project.initialPf or 100) / (meter.lastTotalPf or 1)
            i2r_loss_ratio = ((pf_ratio * pf_ratio - 1) * -1) * 0.05
            last_month_total_cost = 0 if results is None else (
                last_month_kwh * project.kwhRate * (1 / (1 - results.get("percentSaved", {}).get("kwh", 0) or 0.001)) * (1 + (project.taxRate or 0))
                + last_month_peak * (1 / (1 - results.get("percentSaved", {}).get("kwPeak", 0) or 0.001)) * project.kwRate
            )
            _upsert_report_data(project.id, "meter", meter.id, "week", "kwh", week_avg_kw * week_diff, "")
            _upsert_report_data(project.id, "meter", meter.id, "today", "kwh", today_kw * day_diff, "")
            _upsert_report_data(project.id, "meter", meter.id, "month", "avgKva", current_month_avg_kw, "")
            _upsert_report_data(project.id, "meter", meter.id, "month", "kwh", current_month_kwh, "")
            _upsert_report_data(project.id, "meter", meter.id, "month", "peak", current_month_peak, current_month_peak_time)
            _upsert_report_data(project.id, "meter", meter.id, "lastMonth", "kwh", last_month_kwh, "")
            _upsert_report_data(project.id, "meter", meter.id, "lastMonth", "peak", last_month_peak, "")
            _upsert_report_data(project.id, "meter", meter.id, "lastMonth", "totalCost", last_month_total_cost, "")
            _upsert_report_data(project.id, "meter", meter.id, "lastMonth", "totalSavings", last_month_kwh * project.kwhRate * kwh_savings * (1 + (project.taxRate or 0)) + last_month_peak * kw_peak_savings * project.kwRate, "")
            _upsert_report_data(project.id, "meter", meter.id, "year", "totalSavings", year_total_kwh * project.kwhRate * kwh_savings * (1 + (project.taxRate or 0)) + year_total_peaks * kw_peak_savings * project.kwRate, "")
            _upsert_report_data(project.id, "meter", meter.id, "lastYear", "totalSavings", last_year_kwh * project.kwhRate * kwh_savings * (1 + (project.taxRate or 0)) + last_year_peaks * kw_peak_savings * project.kwRate, "")
            _upsert_report_data(project.id, "meter", meter.id, "allTime", "totalSavings", project_total_kwh * project.kwhRate * kwh_savings * (1 + (project.taxRate or 0)) + project_total_peaks * kw_peak_savings * project.kwRate, "")
            _upsert_report_data(project.id, "meter", meter.id, "today", "I2RLossSavings", today_kw * day_diff * kwh_savings * i2r_loss_ratio * project.kwhRate, "")
            _upsert_report_data(project.id, "meter", meter.id, "week", "I2RLossSavings", week_avg_kw * week_diff * kwh_savings * i2r_loss_ratio * project.kwhRate, "")
            _upsert_report_data(project.id, "meter", meter.id, "month", "I2RLossSavings", current_month_kwh * kwh_savings * i2r_loss_ratio * project.kwhRate, "")
            _upsert_report_data(project.id, "meter", meter.id, "lastMonth", "I2RLossSavings", last_month_kwh * kwh_savings * i2r_loss_ratio * project.kwhRate, "")
            _upsert_report_data(project.id, "meter", meter.id, "year", "I2RLossSavings", year_total_kwh * kwh_savings * i2r_loss_ratio * project.kwhRate, "")
            _upsert_report_data(project.id, "meter", meter.id, "lastYear", "I2RLossSavings", last_year_kwh * kwh_savings * i2r_loss_ratio * project.kwhRate, "")
            _upsert_report_data(project.id, "meter", meter.id, "allTime", "I2RLossSavings", project_total_kwh * kwh_savings * i2r_loss_ratio * project.kwhRate, "")
            if results and results.get("percentSaved"):
                meter.kwPeakSavings = results["percentSaved"].get("kwPeak", 0)
                meter.kwhSavings = results["percentSaved"].get("kwh", 0)
        except Exception as e:
            logger.exception("[calculate-savings] meter %s: %s", meter.id, e)


def run_calculate_project_savings():
    """
    Project-level savings calculation. Ported from calculate-project-savings.js.
    Uses meterdataaggregate (project-level) and ReportData.
    """
    projects = Project.query.filter_by(isDeleted=False).all()
    logger.info("[calculate-project-savings] started, %d projects", len(projects))
    for project in projects:
        try:
            _run_calculate_project_savings_one(project)
            db.session.commit()
        except Exception as e:
            logger.exception("[calculate-project-savings] project %s: %s", project.id, e)
            db.session.rollback()
    logger.info("[calculate-project-savings] done")


def _run_calculate_project_savings_one(project):
    """Process one project for project-level savings."""
    try:
        tz = ZoneInfo(project.timeZoneId or "UTC")
    except Exception:
        tz = ZoneInfo("UTC")
    now = datetime.now(tz)
    this_month = now.strftime("%m")
    last_month_dt = (now.replace(day=1) - timedelta(days=1))
    last_month = last_month_dt.strftime("%m")
    last_month_year = last_month_dt.strftime("%Y")
    current_year = now.strftime("%Y")
    last_year = str(now.year - 1)
    today = now.strftime("%Y-%m-%d")
    day_of_week = now.weekday()  # Monday=0, Sunday=6
    days_to_sunday = (day_of_week + 1) % 7
    week_start_dt = now - timedelta(days=days_to_sunday)
    week_start = week_start_dt.strftime("%Y-%m-%d")
    week_end = (week_start_dt + timedelta(days=6)).strftime("%Y-%m-%d")
    month_start = now.replace(day=1).strftime("%Y-%m-%d")
    month_end = (now.replace(day=28) + timedelta(days=4)).replace(day=1) - timedelta(days=1)
    month_end = month_end.strftime("%Y-%m-%d")
    start_date_filter = f" AND day >= '{project.startDate}'" if project.startDate else ""
    week_diff = (now - week_start_dt.replace(hour=0, minute=0, second=0, microsecond=0)).total_seconds() / 3600
    month_diff = (now - now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)).total_seconds() / 3600
    day_diff = (now - now.replace(hour=0, minute=0, second=0, microsecond=0)).total_seconds() / 3600

    week_sql = f"SELECT AVG(avgKva) AS weekAvgKw FROM meterdataaggregate WHERE project = {project.id} AND day >= '{week_start}' AND day <= '{week_end}'"
    week_row = db.session.execute(text(week_sql)).fetchone()
    week_avg_kw = float(week_row._mapping["weekAvgKw"]) if week_row else 0
    sql2 = (
        f"SELECT YEAR(day) as year, MONTH(day) as month, AVG(avgKva) as avgKva, MAX(avgKva) as peak "
        f"FROM meterdataaggregate WHERE project = {project.id}{start_date_filter} GROUP BY year, month ORDER BY year DESC, month DESC"
    )
    rows2 = db.session.execute(text(sql2)).fetchall()
    if not rows2:
        return
    all_peaks = [list(r._mapping[k] for r in rows2) for k in ("year", "month", "peak", "avgKva")]
    current_month_peak = current_month_kwh = current_month_avg_kw = 0.0
    last_month_peak = last_month_kwh = last_month_avg_kw = 0.0
    year_total_peaks = year_total_kwh = 0.0
    last_year_peaks = last_year_kwh = 0.0
    remaining_peaks = remaining_kwh = 0.0
    for i in range(len(all_peaks[0])):
        yr, mo = int(all_peaks[0][i] or 0), int(all_peaks[1][i] or 0)
        peak = float(all_peaks[2][i] or 0)
        avg_kva = float(all_peaks[3][i] or 0)
        hours_in_month = 28 if mo == 2 else (30 if mo in (4, 6, 9, 11) else 31) * 24
        kwh = avg_kva * hours_in_month
        if mo == int(this_month) and yr == int(current_year):
            current_month_peak = peak
            current_month_kwh = avg_kva * month_diff
            current_month_avg_kw = avg_kva
            year_total_peaks += peak
            year_total_kwh += kwh
        elif mo == int(last_month) and yr == int(last_month_year):
            last_month_peak = peak
            last_month_kwh = avg_kva * hours_in_month
            last_month_avg_kw = avg_kva
            if yr == int(current_year):
                year_total_peaks += peak
                year_total_kwh += kwh
            else:
                last_year_peaks += peak
                last_year_kwh += kwh
        elif project.startDate:
            try:
                month_str = f"{yr}-{mo:02d}-01"
                if datetime.strptime(month_str, "%Y-%m-%d") >= datetime.strptime(project.startDate[:10], "%Y-%m-%d"):
                    if yr == int(current_year):
                        year_total_peaks += peak
                        year_total_kwh += kwh
                    elif yr == int(last_year):
                        last_year_peaks += peak
                        last_year_kwh += kwh
                    else:
                        remaining_peaks += peak
                        remaining_kwh += kwh
            except Exception:
                pass
        else:
            if yr == int(current_year):
                year_total_peaks += peak
                year_total_kwh += kwh
            elif yr == int(last_year):
                last_year_peaks += peak
                last_year_kwh += kwh
            else:
                remaining_peaks += peak
                remaining_kwh += kwh
    project_total_peaks = year_total_peaks + last_year_peaks + remaining_peaks
    project_total_kwh = year_total_kwh + last_year_kwh + remaining_kwh
    kwh_savings = (project.kwhSavings or 0) / (1 - (project.kwhSavings or 0.001))
    kw_peak_savings = (project.kwPeakSavings or 0) / (1 - (project.kwPeakSavings or 0.001))
    pf_ratio = (project.initialPf or 100) / (project.lastTotalPf or 1)
    i2r_loss_ratio = ((pf_ratio * pf_ratio - 1) * -1) * 0.05
    today_sql = f"SELECT AVG(avgKva) as avgKva FROM meterdataaggregate WHERE project = {project.id} AND day = '{today}'"
    today_row = db.session.execute(text(today_sql)).fetchone()
    today_kw = float(today_row._mapping["avgKva"]) if today_row else 0
    kwh_mult = project.multiplier or 1
    _upsert_report_data(project.id, "project", project.id, "week", "kwh", week_avg_kw * week_diff * kwh_mult, "weeklykwh")
    _upsert_report_data(project.id, "project", project.id, "today", "kwh", today_kw * day_diff * kwh_mult, "todaykwh")
    _upsert_report_data(project.id, "project", project.id, "month", "avgKva", current_month_avg_kw, "")
    _upsert_report_data(project.id, "project", project.id, "month", "kwh", current_month_kwh * kwh_mult, "")
    _upsert_report_data(project.id, "project", project.id, "month", "peak", current_month_peak, "")
    _upsert_report_data(project.id, "project", project.id, "lastMonth", "kwh", last_month_kwh * kwh_mult, "")
    _upsert_report_data(project.id, "project", project.id, "lastMonth", "peak", last_month_peak, "")
    _upsert_report_data(project.id, "project", project.id, "lastMonth", "totalCost", last_month_kwh / (1 - project.kwhSavings or 0.001) * kwh_mult * project.kwhRate * (1 + (project.taxRate or 0)) + (last_month_peak * (project.multiplier or 1) / (1 - project.kwPeakSavings or 0.001) * project.kwRate), "")
    _upsert_report_data(project.id, "project", project.id, "lastMonth", "totalSavings", last_month_kwh * kwh_mult * project.kwhRate * kwh_savings * (1 + (project.taxRate or 0)) + last_month_peak * (project.multiplier or 1) * kw_peak_savings * project.kwRate, "")
    _upsert_report_data(project.id, "project", project.id, "year", "totalSavings", year_total_kwh * kwh_mult * project.kwhRate * kwh_savings * (1 + (project.taxRate or 0)) + year_total_peaks * (project.multiplier or 1) * kw_peak_savings * project.kwRate, "")
    _upsert_report_data(project.id, "project", project.id, "lastYear", "totalSavings", last_year_kwh * kwh_mult * project.kwhRate * kwh_savings * (1 + (project.taxRate or 0)) + last_year_peaks * (project.multiplier or 1) * kw_peak_savings * project.kwRate, "")
    _upsert_report_data(project.id, "project", project.id, "allTime", "totalSavings", project_total_kwh * kwh_mult * project.kwhRate * kwh_savings * (1 + (project.taxRate or 0)) + project_total_peaks * (project.multiplier or 1) * kw_peak_savings * project.kwRate, "")
    _upsert_report_data(project.id, "project", project.id, "today", "I2RLossSavings", today_kw * day_diff * kwh_mult * kwh_savings * i2r_loss_ratio * project.kwhRate, "")
    _upsert_report_data(project.id, "project", project.id, "week", "I2RLossSavings", week_avg_kw * week_diff * kwh_mult * kwh_savings * i2r_loss_ratio * project.kwhRate, "")
    _upsert_report_data(project.id, "project", project.id, "month", "I2RLossSavings", current_month_kwh * kwh_mult * kwh_savings * i2r_loss_ratio * project.kwhRate, "")
    _upsert_report_data(project.id, "project", project.id, "lastMonth", "I2RLossSavings", last_month_kwh * kwh_mult * kwh_savings * i2r_loss_ratio * project.kwhRate, "")
    _upsert_report_data(project.id, "project", project.id, "year", "I2RLossSavings", year_total_kwh * kwh_mult * kwh_savings * i2r_loss_ratio * project.kwhRate, "")
    _upsert_report_data(project.id, "project", project.id, "lastYear", "I2RLossSavings", last_year_kwh * kwh_mult * kwh_savings * i2r_loss_ratio * project.kwhRate, "")
    _upsert_report_data(project.id, "project", project.id, "allTime", "I2RLossSavings", project_total_kwh * kwh_mult * kwh_savings * i2r_loss_ratio * project.kwhRate, "")


def run_calculate_week_savings():
    """Trigger weekly savings update - runs accumulate_savings (resets week counters)."""
    from app.services.rollup_errands import run_accumulate_savings
    run_accumulate_savings()
