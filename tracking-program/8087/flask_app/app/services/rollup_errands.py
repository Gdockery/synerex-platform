"""
Rollup and errands implementation logic.
Shared by main app (manual trigger) and standalone rollup/errands apps.
"""
import re
import logging
import time
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy import text

from app.extensions import db

logger = logging.getLogger(__name__)

# Simple in-memory cache for rollup deduplication _rollup_cache = {}  # key -> (value, expires_at_ms)
ROLLUP_CACHE_TTL_MS = 600000  # 10 min


def _cache_get(key):
    now = int(time.time() * 1000)
    if key in _rollup_cache:
        _, expires = _rollup_cache[key]
        if now < expires:
            return _rollup_cache[key][0]
        del _rollup_cache[key]
    return None


def _cache_put(key, value, ttl_ms=ROLLUP_CACHE_TTL_MS):
    now = int(time.time() * 1000)
    _rollup_cache[key] = (value, now + ttl_ms)


def _check_amps_and_control_switches(project, meters, per_meter_rows):
    """
    Check main meter amps against thresholds and control switches accordingly.
    Ported from perform-rollup.js checkAmpsAndControlSwitches.
    """
    from app.models.switch import Switch
    from app.models.switch_command import SwitchCommand
    from flask import current_app

    if not project.lowAmpsThreshold and not project.highAmpsThreshold:
        logger.info("Project %s has no amps thresholds configured, skipping switch control", project.id)
        return
    if not project.lowAmpsThreshold or not project.highAmpsThreshold:
        logger.warning(
            "Project %s has only one threshold. Both lowAmpsThreshold and highAmpsThreshold must be set.",
            project.id,
        )
        return

    total_amps = 0
    for meter in meters:
        meter_rows = [r for r in per_meter_rows if r.get("meter") == meter.id]
        if meter_rows:
            latest_amp = meter_rows[0].get("avgAmp")
            if latest_amp is not None and not (isinstance(latest_amp, float) and latest_amp != latest_amp):
                total_amps += float(latest_amp)

    if total_amps == 0:
        logger.warning(
            "No main meter data in perMeterRows for project %s (meters=%d, rows=%d)",
            project.id, len(meters), len(per_meter_rows),
        )
        return

    cmd_types = current_app.config.get("SWITCH_COMMAND_TYPES", {"POWER_ON": 1, "POWER_OFF": 2})
    power_on = cmd_types.get("POWER_ON", 1)
    power_off = cmd_types.get("POWER_OFF", 2)

    desired_state = None
    command_type = None
    if total_amps < project.lowAmpsThreshold:
        desired_state = "off"
        command_type = power_off
    elif total_amps > project.highAmpsThreshold:
        desired_state = "on"
        command_type = power_on
    else:
        return

    if project.lastThresholdSwitchState == desired_state:
        logger.info("Switches already %s, skipping duplicate command", desired_state.upper())
        return

    switches = Switch.query.filter_by(project=project.id, isDeleted=False).all()
    if not switches:
        logger.info("No switches for project %s", project.id)
        return

    switch_ids = [s.id for s in switches]
    current_time = int(time.time() * 1000)

    try:
        sc = SwitchCommand(
            project=project.id,
            commandType=command_type,
            startAt=current_time,
            deviceType=switches[0].deviceType,
        )
        db.session.add(sc)
        db.session.flush()

        # Link switches to command via join table
        for switch_id in switch_ids:
            db.session.execute(
                text(
                    "INSERT INTO switch_switches_switch__switchcommand_switches "
                    "(switchcommand_switches, switch_switches_switch) VALUES (:sc_id, :switch_id)"
                ),
                {"sc_id": sc.id, "switch_id": switch_id},
            )
        db.session.commit()

        from app.services.device_service import send_switch_command, cancel_switch_schedule

        schedule_id = f"x-{sc.id}"
        send_errors = []
        for switch in switches:
            try:
                send_switch_command(
                    project_slug=project.slug,
                    switch_id=switch.id,
                    command=command_type,
                    time_ms=current_time,
                    switch_command_id=sc.id,
                    schedule_id=schedule_id,
                )
                time.sleep(0.05)  # 50ms between commands
            except Exception as e:
                logger.exception("Error sending switch command to switch %s: %s", switch.id, e)
                send_errors.append(e)

        if send_errors:
            try:
                sc.isCancelled = True
                db.session.commit()
                cancel_switch_schedule(project.slug, schedule_id)
            except Exception:
                pass
            return

        project.lastThresholdSwitchState = desired_state
        db.session.commit()
        logger.info("Updated lastThresholdSwitchState to '%s' for project %s", desired_state, project.id)
    except Exception as e:
        logger.exception("checkAmpsAndControlSwitches project %s: %s", project.id, e)
        db.session.rollback()


def run_perform_rollup():
    """Perform 15-min rollup - aggregate meter data, update ReportData, update peaks.
    Ported from api/controllers/rollup/perform-rollup.js
    """
    from app.models.project import Project
    from app.models.meter import Meter
    from app.models.meter_data import MeterData
    from app.models.meter_data_aggregate import MeterDataAggregate
    from app.models.per_meter_data_aggregate import PerMeterDataAggregate
    from app.models.report_data import ReportData
    from app.services.rollup_utils import (
        get_interval_from_moment,
        get_interval_period_from_moment,
        calculate_15_minute_intervals,
    )

    projects = Project.query.filter_by(isDeleted=False).all()
    logger.info("[rollup] perform-rollup started, %d projects", len(projects))

    for project in projects:
        cache_key = f"rollup_perform-rollup_{project.id}"
        if _cache_get(cache_key) is not None:
            logger.info("[rollup] project %s already in queue, skipping", project.id)
            continue
        _cache_put(cache_key, True)

        meters = Meter.query.filter_by(
            project=project.id, isDeleted=False, isMain=True
        ).all()
        if not meters:
            continue

        meter_ids = [m.id for m in meters]
        tz_str = project.timeZoneId or "UTC"
        try:
            tz = ZoneInfo(tz_str)
        except Exception:
            tz = ZoneInfo("UTC")

        now = datetime.now(tz)
        today = now.strftime("%Y-%m-%d")
        interval_id = get_interval_from_moment(now)
        interval_period = get_interval_period_from_moment(today, interval_id, tz_str)
        last_rollup_at = project.lastRollupAt or 0

        # Find intervals with new data since last rollup
        result = db.session.execute(
            text(
                "SELECT DISTINCT day, intervalId FROM meterdata "
                "WHERE meter IS NOT NULL AND createdAt > :last_rollup AND recordedAt < :end_time "
                "ORDER BY day, intervalId"
            ),
            {
                "last_rollup": last_rollup_at,
                "end_time": interval_period["startTime"],
            },
        )
        distinct_rows = result.fetchall()

        if not distinct_rows:
            continue

        def _row_day(r):
            return r.day if hasattr(r, "day") else (r._mapping.get("day") if hasattr(r, "_mapping") else r[0])
        def _row_interval(r):
            return r.intervalId if hasattr(r, "intervalId") else (r._mapping.get("intervalId") if hasattr(r, "_mapping") else r[1])

        interval_periods = [
            get_interval_period_from_moment(
                str(_row_day(row)),
                str(_row_interval(row)),
                tz_str,
            )
            for row in distinct_rows
        ]

        try:
            result_rows = calculate_15_minute_intervals(db, meter_ids, interval_periods)
        except Exception as e:
            logger.exception("[rollup] calculate_15_minute_intervals error: %s", e)
            continue

        all_rows = result_rows.get("all") or []
        per_meter_rows = result_rows.get("perMeter") or []
        if not all_rows and not per_meter_rows:
            continue

        # Add project, interval times to rows
        for row in all_rows:
            row["project"] = project.id
            day_str = str(row.get("day", today))
            interval_id_val = str(row.get("intervalId", ""))
            period = get_interval_period_from_moment(day_str, interval_id_val, tz_str)
            row["intervalStartTime"] = period["startTime"]
            row["intervalEndTime"] = period["endTime"]
            row["createdAt"] = row.get("createdAt") or int(time.time() * 1000)
            row["updatedAt"] = row["createdAt"]

        for row in per_meter_rows:
            row["project"] = project.id
            day_str = str(row.get("day", today))
            interval_id_val = str(row.get("intervalId", ""))
            period = get_interval_period_from_moment(day_str, interval_id_val, tz_str)
            row["intervalStartTime"] = period["startTime"]
            row["intervalEndTime"] = period["endTime"]
            row["createdAt"] = row.get("createdAt") or int(time.time() * 1000)
            row["updatedAt"] = row["createdAt"]

        last_rollup_at_new = max(
            (r.get("createdAt") or 0) for r in all_rows if r.get("createdAt")
        ) if all_rows else int(time.time() * 1000)

        days_to_destroy = {}
        for row in all_rows:
            d = row.get("day")
            iid = row.get("intervalId")
            if iid:
                if d not in days_to_destroy:
                    days_to_destroy[d] = []
                days_to_destroy[d].append(str(iid))

        # Destroy existing aggregates for same day/interval
        for day, interval_ids in days_to_destroy.items():
            valid_ids = [i for i in interval_ids if i]
            if not valid_ids:
                continue
            interval_list = ", ".join(f"'{i}'" for i in valid_ids)
            db.session.execute(
                text(
                    "DELETE FROM meterdataaggregate WHERE project = :proj "
                    "AND day = :day AND intervalId IN (" + interval_list + ")"
                ),
                {"proj": project.id, "day": day},
            )
            db.session.execute(
                text(
                    "DELETE FROM permeterdataaggregate WHERE project = :proj "
                    "AND day = :day AND intervalId IN (" + interval_list + ")"
                ),
                {"proj": project.id, "day": day},
            )

        # Create new aggregates
        for row in all_rows:
            agg = MeterDataAggregate(
                project=row["project"],
                day=str(row["day"]),
                intervalId=str(row.get("intervalId", "")),
                numSamples=int(row.get("numSamples") or 0),
                intervalStartTime=row.get("intervalStartTime"),
                intervalEndTime=row.get("intervalEndTime"),
                avgVolt=row.get("avgVolt"),
                avgAmp=row.get("avgAmp"),
                avgKw=row.get("avgKw"),
                avgKva=row.get("avgKva"),
                avgPf=row.get("avgPf"),
                avgKvar=row.get("avgKvar"),
                createdAt=row.get("createdAt"),
                updatedAt=row.get("updatedAt"),
            )
            db.session.add(agg)

        for row in per_meter_rows:
            agg = PerMeterDataAggregate(
                project=row["project"],
                day=str(row["day"]),
                intervalId=str(row.get("intervalId", "")),
                meter=int(row["meter"]),
                numSamples=int(row.get("numSamples") or 0),
                intervalStartTime=row.get("intervalStartTime"),
                intervalEndTime=row.get("intervalEndTime"),
                avgVolt=row.get("avgVolt"),
                avgAmp=row.get("avgAmp"),
                avgKw=row.get("avgKw"),
                avgKva=row.get("avgKva"),
                avgPf=row.get("avgPf"),
                avgKvar=row.get("avgKvar"),
                createdAt=row.get("createdAt"),
                updatedAt=row.get("updatedAt"),
            )
            db.session.add(agg)

        db.session.flush()

        # Check amps thresholds and control switches (async-style, don't fail rollup)
        _check_amps_and_control_switches(project, meters, per_meter_rows)

        report_data = list(
            ReportData.query.filter_by(project=project.id).all()
        )
        new_peak_time = now.strftime("%Y/%m/%d %I:%M:%S %p")

        for meter in meters:
            meter_data = [r for r in per_meter_rows if r.get("meter") == meter.id]
            if not meter_data:
                continue
            new_meter_peak = max(
                (r.get("avgKva") or 0) for r in meter_data
            )
            current = next(
                (
                    rd
                    for rd in report_data
                    if rd.period == "month"
                    and rd.valueType == "peak"
                    and rd.type == "meter"
                    and rd.typeId == meter.id
                ),
                None,
            )
            if current and new_meter_peak > (current.value or 0):
                ReportData.query.filter_by(
                    type="meter",
                    typeId=meter.id,
                    period="month",
                    valueType="peak",
                ).update({"value": new_meter_peak, "description": new_peak_time})

        new_project_peak = max((r.get("avgKva") or 0) for r in all_rows)
        current_project_peak = next(
            (
                rd
                for rd in report_data
                if rd.period == "month"
                and rd.valueType == "peak"
                and rd.type == "project"
            ),
            None,
        )
        if current_project_peak and new_project_peak > (current_project_peak.value or 0):
            ReportData.query.filter_by(
                type="project",
                typeId=project.id,
                period="month",
                valueType="peak",
            ).update({"value": new_project_peak, "description": new_peak_time})

        avg_15min_kva = (
            sum(r.get("avgKva") or 0 for r in all_rows) / len(all_rows)
            if all_rows
            else 0
        )
        project.lastRollupAt = last_rollup_at_new
        project.avg15MinuteKva = avg_15min_kva
        db.session.commit()

        # Daily rollup for past days (if firstDayRecorded != today)
        first_day = all_rows[-1].get("day") if all_rows else today
        if first_day != today:
            days_to_rollup = list(
                set(r.get("day") for r in all_rows if r.get("day") != today)
            )
            for day_to_rollup in days_to_rollup:
                MeterDataAggregate.query.filter_by(
                    project=project.id, day=day_to_rollup, intervalId=""
                ).delete()
                daily_result = db.session.execute(
                    text(
                        "SELECT SUM(numSamples) as numSamples, AVG(avgVolt) as avgVolt, "
                        "AVG(avgAmp) as avgAmp, AVG(avgKw) as avgKw, AVG(avgKva) as avgKva, "
                        "AVG(avgPf) as avgPf, AVG(avgKvar) as avgKvar "
                        "FROM meterdataaggregate WHERE day = :day AND project = :proj "
                        "GROUP BY day"
                    ),
                    {"day": day_to_rollup, "proj": project.id},
                )
                daily_row = daily_result.fetchone()
                if daily_row:
                    daily_agg = MeterDataAggregate(
                        project=project.id,
                        day=day_to_rollup,
                        intervalId="",
                        numSamples=int(daily_row[0] or 0),
                        avgVolt=float(daily_row[1] or 0),
                        avgAmp=float(daily_row[2] or 0),
                        avgKw=float(daily_row[3] or 0),
                        avgKva=float(daily_row[4] or 0),
                        avgPf=float(daily_row[5] or 0),
                        avgKvar=float(daily_row[6] or 0),
                        createdAt=int(time.time() * 1000),
                        updatedAt=int(time.time() * 1000),
                    )
                    db.session.add(daily_agg)
            db.session.commit()

    logger.info("[rollup] perform-rollup done")


def run_cache_instantaneous_readings():
    """Cache current readings for ticker - update ReportData from meter/scheduler data.
    Ported from api/controllers/rollup/cache-instantaneous-readings.js
    """
    from app.models.project import Project
    from app.models.meter import Meter
    from app.models.report_data import ReportData
    from app.models.meter_data import MeterData
    from app.models.equipment_data import EquipmentData

    from sqlalchemy import text

    projects = Project.query.filter_by(isDeleted=False).all()
    logger.info("[rollup] cache-instantaneous-readings, %d projects", len(projects))

    for project in projects:
        try:
            tz_str = project.timeZoneId or "UTC"
            try:
                tz = ZoneInfo(tz_str)
            except Exception:
                tz = ZoneInfo("UTC")
            now = datetime.now(tz)
            day = now.strftime("%Y-%m-%d")
            minute = now.minute

            meters = Meter.query.filter_by(
                project=project.id,
                isDeleted=False,
                isReporting=True,
                isMain=True,
            ).filter(Meter.lastCommunicatedAt > 0).all()

            report_data = list(ReportData.query.filter_by(project=project.id).all())
            if not report_data:
                continue

            total_kw, total_kva, total_load = 0, 0, 0
            now_ms = int(now.timestamp() * 1000)

            for meter in meters:
                if (
                    (meter.lastTotalKw or 0) > 0
                    and (meter.lastTotalKvar or 0) > 0
                    and (meter.lastTotalKva or 0) > 0
                ):
                    total_kw += float(meter.lastTotalKw or 0)
                    total_kva += float(meter.lastTotalKva or 0)
                    total_load += float(meter.lastTotalAmp or 0)

                last_record = (
                    db.session.execute(
                        text(
                            "SELECT * FROM meterdata WHERE meter = :m "
                            "ORDER BY recordedAt DESC LIMIT 1"
                        ),
                        {"m": meter.id},
                    )
                ).fetchone()
                if last_record and (now_ms - (last_record.recordedAt or 0)) > 59000:
                    rec = dict(last_record._mapping) if hasattr(last_record, "_mapping") else {}
                    rec.pop("id", None)
                    rec.pop("rawData", None)
                    meter_data = MeterData(
                        createdAt=now_ms,
                        updatedAt=now_ms,
                        recordedAt=now_ms,
                        day=day,
                        minute=minute,
                        intervalId=rec.get("intervalId", ""),
                        meter=meter.id,
                        l1Volt=rec.get("l1Volt"),
                        l1Amp=rec.get("l1Amp"),
                        l1Kw=rec.get("l1Kw"),
                        l1Kva=rec.get("l1Kva"),
                        l1Pf=rec.get("l1Pf"),
                        l1Kvar=rec.get("l1Kvar"),
                        l1THD=rec.get("l1THD"),
                        l2Volt=rec.get("l2Volt"),
                        l2Amp=rec.get("l2Amp"),
                        l2Kw=rec.get("l2Kw"),
                        l2Kva=rec.get("l2Kva"),
                        l2Pf=rec.get("l2Pf"),
                        l2Kvar=rec.get("l2Kvar"),
                        l2THD=rec.get("l2THD"),
                        l3Volt=rec.get("l3Volt"),
                        l3Amp=rec.get("l3Amp"),
                        l3Kw=rec.get("l3Kw"),
                        l3Kva=rec.get("l3Kva"),
                        l3Pf=rec.get("l3Pf"),
                        l3Kvar=rec.get("l3Kvar"),
                        l3THD=rec.get("l3THD"),
                        totalVolt=rec.get("totalVolt"),
                        totalAmp=rec.get("totalAmp"),
                        totalKw=rec.get("totalKw"),
                        totalKva=rec.get("totalKva"),
                        totalPf=rec.get("totalPf"),
                        totalKvar=rec.get("totalKvar"),
                        totalTHD=rec.get("totalTHD"),
                        l1THDv=rec.get("l1THDv"),
                        l2THDv=rec.get("l2THDv"),
                        l3THDv=rec.get("l3THDv"),
                        totalTHDv=rec.get("totalTHDv"),
                        frequency=rec.get("frequency"),
                        meshId=rec.get("meshId"),
                    )
                    db.session.add(meter_data)

                kwh_savings = (
                    float(meter.kwhSavings or 0) / (1 - float(meter.kwhSavings or 0))
                    if (meter.kwhSavings or 0) != 1
                    else 1
                )
                last_pf = float(meter.lastTotalPf or 0)
                pf_ratio = (
                    float(project.initialPf or 96) / last_pf
                    if last_pf > 0 and not (last_pf != last_pf)
                    else float(project.initialPf or 96) / 96
                )
                i2r_ratio = ((pf_ratio * pf_ratio - 1) * -1) * 0.05
                kwh = float(meter.lastTotalKva or 0) * (project.multiplier or 1) * kwh_savings
                i2r_savings = kwh / 60 * i2r_ratio * float(project.kwhRate or 0)
                savings = (
                    kwh / 60 * float(project.kwhRate or 0) * (1 + float(project.taxRate or 0))
                )

                def _update_rd(period, value_type, delta):
                    entry = next(
                        (r for r in report_data if r.period == period and r.valueType == value_type and r.type == "meter" and r.typeId == meter.id),
                        None,
                    )
                    if entry:
                        ReportData.query.filter_by(
                            type="meter",
                            typeId=meter.id,
                            period=period,
                            valueType=value_type,
                        ).update({"value": entry.value + delta})

                _update_rd("month", "kwh", float(meter.lastTotalKva or 0) * (project.multiplier or 1) / 60)
                _update_rd("week", "kwh", float(meter.lastTotalKva or 0) * (project.multiplier or 1) / 60)
                _update_rd("today", "kwh", float(meter.lastTotalKva or 0) * (project.multiplier or 1) / 60)
                _update_rd("today", "I2RLossSavings", i2r_savings)
                _update_rd("week", "I2RLossSavings", i2r_savings)
                _update_rd("month", "I2RLossSavings", i2r_savings)
                _update_rd("year", "I2RLossSavings", i2r_savings)
                _update_rd("allTime", "I2RLossSavings", i2r_savings)
                _update_rd("allTime", "totalSavings", savings)
                _update_rd("year", "totalSavings", savings)

            from app.models.switch import Switch
            schedulers = Switch.query.filter_by(
                project=project.id, isDeleted=False, deviceType=2
            ).filter(Switch.lastCommunicatedAt > 0).all()

            for scheduler in schedulers:
                eq_result = db.session.execute(
                    text(
                        "SELECT * FROM equipmentdata WHERE switch = :s "
                        "ORDER BY recordedAt DESC LIMIT 1"
                    ),
                    {"s": scheduler.id},
                )
                eq_row = eq_result.fetchone()
                if not eq_row:
                    continue
                rec_at = (
                    eq_row.recordedAt
                    if hasattr(eq_row, "recordedAt")
                    else (eq_row._mapping.get("recordedAt") if hasattr(eq_row, "_mapping") else 0)
                )
                if (now_ms - rec_at) < 120000:
                    total_kw_eq = (
                        eq_row.totalKw
                        if hasattr(eq_row, "totalKw")
                        else (eq_row._mapping.get("totalKw", 0) if hasattr(eq_row, "_mapping") else 0)
                    )
                    kwh_inc = float(total_kw_eq or 0) / 60
                    cost_inc = kwh_inc * float(project.kwhRate or 0)
                    for period in ["today", "week", "month", "year", "allTime"]:
                        kwh_entry = next(
                            (r for r in report_data if r.period == period and r.valueType == "kwh" and r.type == "scheduler" and r.typeId == scheduler.id),
                            None,
                        )
                        if kwh_entry:
                            ReportData.query.filter_by(
                                type="scheduler", typeId=scheduler.id, period=period, valueType="kwh"
                            ).update({"value": kwh_entry.value + kwh_inc})
                        cost_entry = next(
                            (r for r in report_data if r.period == period and r.valueType == "totalCost" and r.type == "scheduler" and r.typeId == scheduler.id),
                            None,
                        )
                        if cost_entry:
                            ReportData.query.filter_by(
                                type="scheduler", typeId=scheduler.id, period=period, valueType="totalCost"
                            ).update({"value": cost_entry.value + cost_inc})

            last_pf_safe = (total_kw / total_kva * 100) if total_kva > 0 and total_kw > 0 else 100
            project.lastTotalPf = last_pf_safe
            project.totalAmpLoad = total_load

            kwh_savings_proj = float(project.kwhSavings or 0) / (1 - float(project.kwhSavings or 0))
            pf_ratio_proj = float(project.initialPf or 96) / last_pf_safe
            i2r_ratio_proj = ((pf_ratio_proj * pf_ratio_proj - 1) * -1) * 0.05
            kwh_proj = float(project.avg15MinuteKva or 0) * kwh_savings_proj
            i2r_savings_proj = kwh_proj / 60 * i2r_ratio_proj * float(project.kwhRate or 0)
            savings_proj = kwh_proj / 60 * float(project.kwhRate or 0) * (1 + float(project.taxRate or 0))
            carbon_savings = kwh_proj / 60 * (0.7054 / 1000)
            carbon_value = carbon_savings * float(project.carbonCreditRate or 0)

            def _update_proj(period, value_type, delta):
                entry = next(
                    (r for r in report_data if r.period == period and r.valueType == value_type and r.type == "project"),
                    None,
                )
                if entry:
                    ReportData.query.filter_by(
                        type="project", typeId=project.id, period=period, valueType=value_type
                    ).update({"value": entry.value + delta})

            _update_proj("today", "I2RLossSavings", i2r_savings_proj)
            _update_proj("week", "I2RLossSavings", i2r_savings_proj)
            _update_proj("month", "I2RLossSavings", i2r_savings_proj)
            _update_proj("year", "I2RLossSavings", i2r_savings_proj)
            _update_proj("allTime", "I2RLossSavings", i2r_savings_proj)
            _update_proj("year", "totalSavings", savings_proj)
            _update_proj("allTime", "totalSavings", savings_proj)
            _update_proj("year", "carbonSavings", carbon_value)
            _update_proj("month", "kwh", float(project.avg15MinuteKva or 0) * (project.multiplier or 1) / 60)
            _update_proj("week", "kwh", float(project.avg15MinuteKva or 0) * (project.multiplier or 1) / 60)
            _update_proj("today", "kwh", float(project.avg15MinuteKva or 0) * (project.multiplier or 1) / 60)
            _update_proj("allTime", "kwhSavingsAmount", float(project.avg15MinuteKva or 0) * (project.multiplier or 1) / 60 * kwh_savings_proj)
            _update_proj("allTime", "kwhSavings", float(project.avg15MinuteKva or 0) * (project.multiplier or 1) / 60 * kwh_savings_proj * float(project.kwhRate or 0))
            _update_proj("allTime", "I2RLossSavingsAmount", float(project.avg15MinuteKva or 0) * (project.multiplier or 1) / 60 * kwh_savings_proj * i2r_ratio_proj)
            entry = next((r for r in report_data if r.period == "allTime" and r.valueType == "carbonSavingsAmount" and r.type == "project"), None)
            if entry:
                ReportData.query.filter_by(type="project", typeId=project.id, period="allTime", valueType="carbonSavingsAmount").update({"value": entry.value + carbon_savings})

            db.session.commit()
        except Exception as e:
            logger.exception("[rollup] cache-instantaneous-readings project %s: %s", project.id, e)
            db.session.rollback()

    logger.info("[rollup] cache-instantaneous-readings done")


def run_calculate_tests():
    """Calculate test results for completed tests. Ported from calculate-tests.js.
    Uses test_calculation_service for the actual computation.
    """
    from app.models.test import Test
    from app.models.project import Project
    from app.models.meter import Meter

    now = int(time.time() * 1000)
    tests = Test.query.filter(
        Test.isDeleted == False,
        Test.endAt < now,
        Test.reportData.is_(None),
        Test.isStatic != 1,
    ).all()

    if not tests:
        return

    for test in tests:
        try:
            project = Project.query.get(test.project)
            if not project:
                continue
            meters = Meter.query.filter_by(project=project.id, isDeleted=False).all()
            meter_ids = [str(m.id) for m in meters]
            meter_input = ",".join(meter_ids) if meter_ids else "0"

            from app.services.test_calculation_service import calculate_test_results

            result = calculate_test_results(test.id, meter_input)
            if result:
                test.reportData = result
                db.session.commit()
                for meter in meters:
                    if "percentSaved" in result:
                        ps = result["percentSaved"]
                        meter.kwPeakSavings = ps.get("kwPeak", meter.kwPeakSavings or 0)
                        meter.kwhSavings = ps.get("kwh", meter.kwhSavings or 0)
                db.session.commit()
        except Exception as e:
            logger.exception("[rollup] calculate-tests test %s: %s", test.id, e)
            db.session.rollback()

    logger.info("[rollup] calculate-tests done")


def run_accumulate_savings():
    """Daily savings accumulation - reset today/week/month/year counters at midnight.
    Ported from api/controllers/rollup/accumulate-savings.js
    """
    from datetime import timedelta
    from app.models.project import Project
    from app.models.meter import Meter
    from app.models.report_data import ReportData
    from app.models.switch import Switch

    projects = Project.query.filter_by(isDeleted=False).all()
    logger.info("[rollup] accumulate-savings, %d projects", len(projects))

    for project in projects:
        try:
            meters = Meter.query.filter_by(
                project=project.id, isDeleted=False, isMain=True
            ).all()
            if not meters:
                continue

            schedulers = Switch.query.filter_by(
                project=project.id, isDeleted=False, deviceType=2
            ).filter(Switch.lastCommunicatedAt > 0).all()

            tz_str = project.timeZoneId or "UTC"
            try:
                tz = ZoneInfo(tz_str)
            except Exception:
                tz = ZoneInfo("UTC")
            now = datetime.now(tz)
            yesterday = now - timedelta(days=1)
            new_week = yesterday.strftime("%W") != now.strftime("%W") or (yesterday.year != now.year)
            new_month = yesterday.month != now.month or yesterday.year != now.year
            new_year = yesterday.year != now.year

            report_data = list(ReportData.query.filter_by(project=project.id).all())
            if not report_data:
                continue

            avg_15min = project.avg15MinuteKva or 0

            ReportData.query.filter_by(
                type="project", typeId=project.id, period="today", valueType="kwh"
            ).update({"value": 0})
            entry = next(
                (r for r in report_data if r.period == "allTime" and r.valueType == "kwhSavings" and r.type == "project"),
                None,
            )
            if entry:
                ReportData.query.filter_by(
                    type="project", typeId=project.id, period="allTime", valueType="kwhSavings"
                ).update({
                    "value": entry.value + (avg_15min * 24 * (project.kwhSavings or 0) * (project.kwhRate or 0))
                })
            entry2 = next(
                (r for r in report_data if r.period == "allTime" and r.valueType == "kwhSavingsAmount" and r.type == "project"),
                None,
            )
            if entry2:
                ReportData.query.filter_by(
                    type="project", typeId=project.id, period="allTime", valueType="kwhSavingsAmount"
                ).update({
                    "value": entry2.value + (avg_15min * 24 * (project.kwhSavings or 0))
                })
            ReportData.query.filter_by(
                type="project", typeId=project.id, period="today", valueType="I2RLoss"
            ).update({"value": 0})

            for meter in meters:
                ReportData.query.filter_by(
                    type="meter", typeId=meter.id, period="today", valueType="kwh"
                ).update({"value": 0})
                ReportData.query.filter_by(
                    type="meter", typeId=meter.id, period="today", valueType="I2RLoss"
                ).update({"value": 0})
            for sched in schedulers:
                ReportData.query.filter_by(
                    type="scheduler", typeId=sched.id, period="today", valueType="kwh"
                ).update({"value": 0})
                ReportData.query.filter_by(
                    type="scheduler", typeId=sched.id, period="today", valueType="totalCost"
                ).update({"value": 0})

            if new_week:
                ReportData.query.filter_by(
                    type="project", typeId=project.id, period="week", valueType="kwh"
                ).update({"value": 0})
                ReportData.query.filter_by(
                    type="project", typeId=project.id, period="week", valueType="I2RLoss"
                ).update({"value": 0})
                for meter in meters:
                    ReportData.query.filter_by(
                        type="meter", typeId=meter.id, period="week", valueType="kwh"
                    ).update({"value": 0})
                    ReportData.query.filter_by(
                        type="meter", typeId=meter.id, period="week", valueType="I2RLoss"
                    ).update({"value": 0})
                for sched in schedulers:
                    ReportData.query.filter_by(
                        type="scheduler", typeId=sched.id, period="week", valueType="totalCost"
                    ).update({"value": 0})

            if new_month:
                month_kwh = next(
                    (r.value for r in report_data if r.period == "month" and r.valueType == "kwh" and r.type == "project"),
                    0,
                )
                month_peak = next(
                    (r.value for r in report_data if r.period == "month" and r.valueType == "peak" and r.type == "project"),
                    0,
                )
                kwh_sav = project.kwhSavings or 0
                kw_peak_sav = project.kwPeakSavings or 0
                month_savings = (
                    month_kwh * kwh_sav * (project.kwhRate or 0) * (1 + (project.taxRate or 0))
                    + month_peak * kw_peak_sav * (project.kwRate or 0)
                )
                month_budget = (
                    month_kwh * (1 - kwh_sav) * (project.kwhRate or 0) * (1 + (project.taxRate or 0))
                    + month_peak * (1 - kw_peak_sav) * (project.kwRate or 0) * (1 + (project.taxRate or 0))
                )
                peak_desc = now.strftime("%Y/%m/%d %I:%M:%S %p")

                ReportData.query.filter_by(
                    type="project", typeId=project.id, period="month", valueType="kwh"
                ).update({"value": 0})
                ReportData.query.filter_by(
                    type="project", typeId=project.id, period="month", valueType="peak"
                ).update({"value": avg_15min, "description": peak_desc})
                ReportData.query.filter_by(
                    type="project", typeId=project.id, period="lastMonth", valueType="totalSavings"
                ).update({"value": month_savings})
                ReportData.query.filter_by(
                    type="project", typeId=project.id, period="lastMonth", valueType="totalCost"
                ).update({"value": month_budget})
                ReportData.query.filter_by(
                    type="project", typeId=project.id, period="lastMonth", valueType="peak"
                ).update({"value": month_peak})
                ReportData.query.filter_by(
                    type="project", typeId=project.id, period="lastMonth", valueType="kwh"
                ).update({"value": month_kwh})
                year_entry = next(
                    (r for r in report_data if r.period == "year" and r.valueType == "totalSavings" and r.type == "project"),
                    None,
                )
                if year_entry:
                    ReportData.query.filter_by(
                        type="project", typeId=project.id, period="year", valueType="totalSavings"
                    ).update({"value": year_entry.value + month_savings})
                all_time_entry = next(
                    (r for r in report_data if r.period == "allTime" and r.valueType == "totalSavings" and r.type == "project"),
                    None,
                )
                if all_time_entry:
                    ReportData.query.filter_by(
                        type="project", typeId=project.id, period="allTime", valueType="totalSavings"
                    ).update({"value": all_time_entry.value + month_savings})
                ReportData.query.filter_by(
                    type="project", typeId=project.id, period="month", valueType="I2RLossSavings"
                ).update({"value": 0})
                month_i2r = next(
                    (r.value for r in report_data if r.period == "month" and r.valueType == "I2RLossSavings" and r.type == "project"),
                    0,
                )
                ReportData.query.filter_by(
                    type="project", typeId=project.id, period="lastMonth", valueType="I2RLossSavings"
                ).update({"value": month_i2r})
                ReportData.query.filter_by(
                    type="project", typeId=project.id, period="lastMonth", valueType="pfc"
                ).update({
                    "value": next((r.value for r in report_data if r.period == "month" and r.valueType == "pfc" and r.type == "project"), 0)
                })
                ReportData.query.filter_by(
                    type="project", typeId=project.id, period="month", valueType="pfc"
                ).update({"value": 0})

                for meter in meters:
                    m_month_kwh = next(
                        (r.value for r in report_data if r.period == "month" and r.valueType == "kwh" and r.type == "meter" and r.typeId == meter.id),
                        0,
                    )
                    m_month_peak = next(
                        (r.value for r in report_data if r.period == "month" and r.valueType == "peak" and r.type == "meter" and r.typeId == meter.id),
                        0,
                    )
                    mkwh_sav = (meter.kwhSavings or 0) / (1 - (meter.kwhSavings or 0)) if (meter.kwhSavings or 0) != 1 else 1
                    mkw_peak_sav = (meter.kwPeakSavings or 0) / (1 - (meter.kwPeakSavings or 0)) if (meter.kwPeakSavings or 0) != 1 else 1
                    m_savings = (
                        m_month_kwh * mkwh_sav * (project.kwhRate or 0) * (1 + (project.taxRate or 0))
                        + m_month_peak * mkw_peak_sav * (project.kwRate or 0)
                    )
                    m_budget = (
                        m_month_kwh * (1 / (meter.kwhSavings or 1)) * (project.kwhRate or 0) * (1 + (project.taxRate or 0))
                        + m_month_peak * (1 / (meter.kwPeakSavings or 1)) * (project.kwRate or 0)
                    )
                    ReportData.query.filter_by(
                        type="meter", typeId=meter.id, period="month", valueType="kwh"
                    ).update({"value": meter.lastTotalKva or 0})
                    ReportData.query.filter_by(
                        type="meter", typeId=meter.id, period="month", valueType="peak"
                    ).update({"value": meter.lastTotalKva or 0, "description": peak_desc})
                    ReportData.query.filter_by(
                        type="meter", typeId=meter.id, period="lastMonth", valueType="totalSavings"
                    ).update({"value": m_savings})
                    ReportData.query.filter_by(
                        type="meter", typeId=meter.id, period="lastMonth", valueType="peak"
                    ).update({"value": m_month_peak})
                    ReportData.query.filter_by(
                        type="meter", typeId=meter.id, period="lastMonth", valueType="totalCost"
                    ).update({"value": m_budget})
                    ReportData.query.filter_by(
                        type="meter", typeId=meter.id, period="lastMonth", valueType="kwh"
                    ).update({"value": m_month_kwh})
                    m_year = next(
                        (r for r in report_data if r.period == "year" and r.valueType == "totalSavings" and r.type == "meter" and r.typeId == meter.id),
                        None,
                    )
                    if m_year:
                        ReportData.query.filter_by(
                            type="meter", typeId=meter.id, period="year", valueType="totalSavings"
                        ).update({"value": m_year.value + m_savings})
                    m_all = next(
                        (r for r in report_data if r.period == "allTime" and r.valueType == "totalSavings" and r.type == "meter" and r.typeId == meter.id),
                        None,
                    )
                    if m_all:
                        ReportData.query.filter_by(
                            type="meter", typeId=meter.id, period="allTime", valueType="totalSavings"
                        ).update({"value": m_all.value + m_savings})
                    m_month_i2r = next(
                        (r.value for r in report_data if r.period == "month" and r.valueType == "I2RLossSavings" and r.type == "meter" and r.typeId == meter.id),
                        0,
                    )
                    ReportData.query.filter_by(
                        type="meter", typeId=meter.id, period="lastMonth", valueType="I2RLossSavings"
                    ).update({"value": m_month_i2r})
                    ReportData.query.filter_by(
                        type="meter", typeId=meter.id, period="month", valueType="I2RLossSavings"
                    ).update({"value": 0})

                for sched in schedulers:
                    ReportData.query.filter_by(
                        type="scheduler", typeId=sched.id, period="month", valueType="totalCost"
                    ).update({"value": 0})

            if new_year:
                ReportData.query.filter_by(
                    type="project", typeId=project.id, period="year", valueType="totalSavings"
                ).update({"value": 0})
                last_year = next(
                    (r.value for r in report_data if r.period == "year" and r.valueType == "totalSavings" and r.type == "project"),
                    0,
                )
                ReportData.query.filter_by(
                    type="project", typeId=project.id, period="lastYear", valueType="totalSavings"
                ).update({"value": last_year})
                ReportData.query.filter_by(
                    type="project", typeId=project.id, period="year", valueType="I2RLossSavings"
                ).update({"value": 0})
                last_year_i2r = next(
                    (r.value for r in report_data if r.period == "year" and r.valueType == "I2RLossSavings" and r.type == "project"),
                    0,
                )
                ReportData.query.filter_by(
                    type="project", typeId=project.id, period="lastYear", valueType="I2RLossSavings"
                ).update({"value": last_year_i2r})
                ReportData.query.filter_by(
                    type="project", typeId=project.id, period="year", valueType="carbonSavings"
                ).update({"value": 0})
                for meter in meters:
                    ReportData.query.filter_by(
                        type="meter", typeId=meter.id, period="year", valueType="totalSavings"
                    ).update({"value": 0})
                    m_ly = next(
                        (r.value for r in report_data if r.period == "year" and r.valueType == "totalSavings" and r.type == "meter" and r.typeId == meter.id),
                        0,
                    )
                    ReportData.query.filter_by(
                        type="meter", typeId=meter.id, period="lastYear", valueType="totalSavings"
                    ).update({"value": m_ly})
                    ReportData.query.filter_by(
                        type="meter", typeId=meter.id, period="year", valueType="I2RLossSavings"
                    ).update({"value": 0})
                    m_ly_i2r = next(
                        (r.value for r in report_data if r.period == "year" and r.valueType == "I2RLossSavings" and r.type == "meter" and r.typeId == meter.id),
                        0,
                    )
                    ReportData.query.filter_by(
                        type="meter", typeId=meter.id, period="lastYear", valueType="I2RLossSavings"
                    ).update({"value": m_ly_i2r})
                for sched in schedulers:
                    ReportData.query.filter_by(
                        type="scheduler", typeId=sched.id, period="year", valueType="totalCost"
                    ).update({"value": 0})

            db.session.commit()
        except Exception as e:
            logger.exception("[rollup] accumulate-savings project %s: %s", project.id, e)
            db.session.rollback()

    logger.info("[rollup] accumulate-savings done")


def run_rollup_schedule_tasks():
    """Rollup schedule: rollup → CBI → Capacity Intelligence → Savings Intelligence."""
    run_perform_rollup()
    _run_cbi_auto_compute()
    _run_ci_auto_compute()    # Phase 8 — downstream of CBI
    _run_si_auto_compute()    # Phase 9 — downstream of CI


def _run_cbi_auto_compute():
    """
    Phase 7 — CBI auto-trigger.

    After each rollup cycle, recompute CBI 15-minute buckets for the past 4 hours
    of meterdata across all active projects.  Only re-classifies recent data so the
    call is fast even on large deployments.

    Errors are swallowed per-project so one bad project cannot block the rest.
    """
    import time as _t
    from app.models.project import Project
    from app.models.meter import Meter
    from app.models.meter_data import MeterData
    from app.models.current_balance_metrics import CurrentBalanceMetrics
    from app.services.current_balance_engine import compute_buckets

    now_ms   = int(_t.time() * 1000)
    window_ms = 4 * 60 * 60 * 1000          # last 4 hours
    since_ms  = now_ms - window_ms

    projects = Project.query.filter_by(isDeleted=False).all()
    logger.info("[cbi-auto] triggered for %d projects", len(projects))

    for project in projects:
        try:
            # Collect meter ids for this project
            meter_ids = [
                m.id for m in Meter.query.filter_by(
                    project=project.id, isDeleted=False
                ).all()
            ]
            if not meter_ids:
                continue

            # Fetch recent meterdata
            rows = (MeterData.query
                    .filter(MeterData.meter.in_(meter_ids))
                    .filter(MeterData.recordedAt >= since_ms)
                    .order_by(MeterData.recordedAt.asc())
                    .limit(5000)           # cap to avoid memory spikes
                    .all())
            if not rows:
                continue

            # Compute CBI buckets and upsert
            buckets = compute_buckets(
                meterdata_rows=rows,
                project_id=project.id,
            )

            # Phase 10 — attach Digital Twin transformer kVA context
            try:
                from app.services.digital_twin_service import enrich_cbi_buckets_with_dt
                enrich_cbi_buckets_with_dt(buckets, project.id)
            except Exception:
                pass

            upsert_count = 0
            for b in buckets:
                existing = (CurrentBalanceMetrics.query
                            .filter_by(
                                project_id  = b["project_id"],
                                bucket_ts   = b["bucket_ts"],
                                meter_id    = b.get("meter_id"),
                            )
                            .first())
                if existing:
                    for k, v in b.items():
                        if hasattr(existing, k):
                            setattr(existing, k, v)
                else:
                    db.session.add(CurrentBalanceMetrics(**{
                        k: v for k, v in b.items()
                        if hasattr(CurrentBalanceMetrics, k)
                    }))
                upsert_count += 1

            db.session.commit()
            logger.info(
                "[cbi-auto] project=%d rows=%d buckets=%d",
                project.id, len(rows), upsert_count,
            )

        except Exception as exc:
            db.session.rollback()
            logger.warning("[cbi-auto] project=%d error: %s", project.id, exc)


def run_generate_monthly_reports():
    """Generate automatic monthly reports for projects when new month starts.
    Ported from api/controllers/rollup/generate-automatic-monthly-reports.js
    """
    from app.models.project import Project
    from app.models.savings_report import SavingsReport
    from app.services.aggregate_data_service import get_aggregate_data_for_period

    projects = Project.query.filter_by(isDeleted=False).all()
    logger.info("[rollup] generate-automatic-monthly-reports, %d projects", len(projects))

    for project in projects:
        try:
            tz_str = project.timeZoneId or "UTC"
            try:
                tz = ZoneInfo(tz_str)
            except Exception:
                tz = ZoneInfo("UTC")
            now = datetime.now(tz)
            yesterday = now - timedelta(days=1)
            new_month = yesterday.month != now.month or yesterday.year != now.year
            if not new_month:
                continue

            import calendar
            first_of_month = yesterday.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            last_day = calendar.monthrange(yesterday.year, yesterday.month)[1]
            last_of_month = yesterday.replace(day=last_day, hour=23, minute=59, second=59, microsecond=999999)
            from_date_ms = int(first_of_month.timestamp() * 1000)
            to_date_ms = int(last_of_month.timestamp() * 1000)

            try:
                data = get_aggregate_data_for_period(
                    project.id,
                    from_date_ms,
                    to_date_ms,
                    time_zone=tz_str,
                    multiplier=project.multiplier or 1,
                    peak_multiplier=getattr(project, "peakMultiplier", 1) or 1,
                )
            except Exception as e:
                logger.warning("[rollup] get_aggregate_data project %s: %s", project.id, e)
                continue

            kwh = data.get("kwh", 0)
            kva_peak = data.get("kvaPeak", 0)
            kwh_rate = float(project.kwhRate or 0)
            kw_rate = float(project.kwRate or 0)
            kwh_sav = float(project.kwhSavings or 0)
            kw_peak_sav = float(project.kwPeakSavings or 0)
            tax_rate = float(project.taxRate or 0)

            report_data = {
                "total": kwh * kwh_rate + kva_peak * kw_rate,
                "totalBeforeXeco": (
                    (kwh * kwh_rate * (1 + kwh_sav) + kva_peak * kw_rate * (1 + kw_peak_sav))
                    * (1 + tax_rate)
                ),
                "usageKWH": round(kwh),
                "kwPeak": round(kva_peak),
                "kwhSavings": round(kwh_sav * 100, 2),
                "kwPeakSavings": round(kw_peak_sav * 100, 2),
                "totalBill": round((kwh * kwh_rate + kva_peak * kw_rate) * (1 + tax_rate), 2),
                "pfc": 0,
            }

            # fromDate is start of month so date() is 1; the "> 15" branch never triggers
            month_str = first_of_month.strftime("%Y-%m")

            existing = SavingsReport.query.filter_by(
                project=project.id, month=month_str
            ).first()
            if existing:
                logger.info("[rollup] SavingsReport for %s already exists, skipping", month_str)
                continue

            db.session.add(SavingsReport(
                project=project.id,
                month=month_str,
                fromDate=from_date_ms,
                toDate=to_date_ms,
                reportData=report_data,
            ))
            db.session.commit()
            logger.info("[rollup] created SavingsReport for project %s month %s", project.id, month_str)
            # Email the ESR to client contacts
            try:
                _send_monthly_esr_email(project, month_str, report_data)
            except Exception as email_err:
                logger.exception("[rollup] ESR email failed for project %s month %s: %s", project.id, month_str, email_err)
        except Exception as e:
            logger.exception("[rollup] generate-automatic-monthly-reports project %s: %s", project.id, e)
            db.session.rollback()

    logger.info("[rollup] generate-automatic-monthly-reports done")


def _send_monthly_esr_email(project, month_str, report_data):
    """Generate the ESR PDF and email it to client contacts for the given project/month."""
    from flask import current_app
    from app.models.client import Client
    from app.models.user import User
    from app import services as _svc_pkg

    # ── Recipients ─────────────────────────────────────────────────────────────
    recipients = set()
    client = Client.query.get(project.client) if project.client else None
    if client:
        for field in ("financeEmail", "managerEmail"):
            val = getattr(client, field, None)
            if val and "@" in val:
                recipients.add(val.strip())
    # All Client Admin (role 2) and Client Manager (role 3) users for this client
    if project.client:
        for u in User.query.filter_by(client=project.client, isDeleted=False).all():
            if getattr(u, "role", None) in (2, 3) and u.email and "@" in u.email:
                recipients.add(u.email.strip())

    if not recipients:
        logger.info("[esr-email] no recipients for project %s, skipping", project.id)
        return

    mail_server = current_app.config.get("MAIL_SERVER", "")
    if not mail_server or not current_app.config.get("MAIL_USERNAME", ""):
        logger.warning("[esr-email] mail not configured, skipping ESR email for project %s", project.id)
        return

    # ── Build the public ESR link ───────────────────────────────────────────────
    public_base = (current_app.config.get("TRACKING_PUBLIC_WEBSITE_URL") or "").rstrip("/")
    app_root = (current_app.config.get("APPLICATION_ROOT") or "").rstrip("/")
    if not public_base:
        public_base = (current_app.config.get("TRACKING_BASE_URL") or "http://localhost:8087").rstrip("/")
    esr_link = f"{public_base}{app_root}/secure/view?costSavings={project.documentShareToken}"

    # ── Generate PDF attachment ─────────────────────────────────────────────────
    pdf_bytes = None
    try:
        import importlib
        pdf_mod = importlib.import_module("app.services.pdf_service")
        if "costSavings" in pdf_mod.SUPPORTED_DOCUMENT_KINDS:
            pdf_stream = pdf_mod.generate_pdf(project, "costSavings")
            pdf_bytes = pdf_stream.read()
    except Exception as pdf_err:
        logger.warning("[esr-email] PDF generation failed for project %s: %s — sending link only", project.id, pdf_err)

    # ── Format month for display (e.g. "February 2026") ────────────────────────
    try:
        from datetime import datetime as _dt
        month_display = _dt.strptime(month_str, "%Y-%m").strftime("%B %Y")
    except Exception:
        month_display = month_str

    project_name = project.name or f"Project {project.id}"
    client_name = client.name if client else project_name
    kwh_savings_pct = round((report_data.get("kwhSavings") or 0), 1)
    total_savings = round((report_data.get("totalBeforeXeco", 0) or 0) - (report_data.get("totalBill", 0) or 0), 2)
    total_bill = round(report_data.get("totalBill") or 0, 2)

    subject = f"Energy Savings Report — {client_name} — {month_display}"
    body_html = f"""
<html>
<body style="font-family: Inter, Arial, sans-serif; color: #212121; max-width: 600px; margin: 0 auto; padding: 24px;">
  <div style="background: #26c49d; padding: 20px 24px; border-radius: 8px 8px 0 0;">
    <h1 style="color: #fff; margin: 0; font-size: 20px;">Monthly Energy Savings Report</h1>
    <p style="color: #e0f7f3; margin: 4px 0 0; font-size: 14px;">{month_display}</p>
  </div>
  <div style="border: 1px solid #e0e0e0; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
    <p style="font-size: 15px;">Dear {client_name} Team,</p>
    <p style="font-size: 15px;">
      Please find your Energy Savings Report for <strong>{month_display}</strong> for project
      <strong>{project_name}</strong>.
    </p>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <tr style="background: #f5f5f5;">
        <td style="padding: 10px 14px; font-weight: 600; font-size: 14px;">Monthly Bill</td>
        <td style="padding: 10px 14px; font-size: 14px; text-align: right;">${total_bill:,.2f}</td>
      </tr>
      <tr>
        <td style="padding: 10px 14px; font-weight: 600; font-size: 14px;">Estimated Savings</td>
        <td style="padding: 10px 14px; font-size: 14px; text-align: right; color: #26c49d;">
          ${total_savings:,.2f} ({kwh_savings_pct}% kWh reduction)
        </td>
      </tr>
      <tr style="background: #f5f5f5;">
        <td style="padding: 10px 14px; font-weight: 600; font-size: 14px;">kWh Used</td>
        <td style="padding: 10px 14px; font-size: 14px; text-align: right;">{int(report_data.get("usageKWH") or 0):,} kWh</td>
      </tr>
    </table>
    <p style="margin: 20px 0;">
      <a href="{esr_link}"
         style="background: #26c49d; color: #fff; padding: 12px 24px; border-radius: 6px;
                text-decoration: none; font-weight: 600; font-size: 14px;">
        View Full Energy Savings Report
      </a>
    </p>
    {"<p style='font-size: 13px; color: #757575;'>The full PDF report is attached to this email.</p>" if pdf_bytes else ""}
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;">
    <p style="font-size: 12px; color: #9e9e9e;">
      This is an automated monthly report from the Synerex Energy Portal.
      For questions, contact your Synerex account manager.
    </p>
  </div>
</body>
</html>
"""

    # ── Send ───────────────────────────────────────────────────────────────────
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart
    from email.mime.application import MIMEApplication

    for recipient in recipients:
        try:
            msg = MIMEMultipart("mixed")
            msg["Subject"] = subject
            msg["From"] = current_app.config.get("MAIL_FROM", "noreply@synerex.com")
            msg["To"] = recipient

            alt = MIMEMultipart("alternative")
            alt.attach(MIMEText(body_html, "html"))
            msg.attach(alt)

            if pdf_bytes:
                pdf_part = MIMEApplication(pdf_bytes, _subtype="pdf")
                pdf_filename = f"ESR-{project.slug or project.id}-{month_str}.pdf"
                pdf_part.add_header("Content-Disposition", "attachment", filename=pdf_filename)
                msg.attach(pdf_part)

            port = current_app.config.get("MAIL_PORT", 587)
            use_tls = current_app.config.get("MAIL_USE_TLS", True)
            with smtplib.SMTP(mail_server, port) as server:
                if use_tls:
                    server.starttls()
                server.login(
                    current_app.config["MAIL_USERNAME"],
                    current_app.config.get("MAIL_PASSWORD", ""),
                )
                server.sendmail(msg["From"], recipient, msg.as_string())
            logger.info("[esr-email] sent ESR for project %s month %s to %s", project.id, month_str, recipient)
        except Exception as e:
            logger.exception("[esr-email] failed to send to %s for project %s: %s", recipient, project.id, e)


def run_check_payment():
    """Update ServicePlan expiresAt from Authorize.net subscriptions."""
    from app.models.service_plan import ServicePlan

    try:
        from app.services.authorizenet_service import get_subscriptions
        subs = get_subscriptions()
    except RuntimeError as e:
        logger.warning("check-payment: %s", e)
        return

    for sub in subs:
        sub_id = getattr(sub, "id", None) or sub.get("id") if isinstance(sub, dict) else None
        if not sub_id:
            continue
        plans = ServicePlan.query.filter_by(subscription=sub_id).all()
        if not plans:
            logger.warning("No ServicePlan for subscription %s", sub_id)
            continue

        create_ts = getattr(sub, "createTimeStampUTC", None) or (sub.get("createTimeStampUTC") if isinstance(sub, dict) else None)
        past_occ = getattr(sub, "pastOccurrences", 0) or (sub.get("pastOccurrences", 0) if isinstance(sub, dict) else 0)
        if not create_ts:
            continue

        try:
            dt = datetime.fromisoformat(create_ts.replace("Z", "+00:00")).replace(tzinfo=None)
            expires_at = dt + timedelta(days=30 * past_occ * plans[0].billingInterval)
            expires_at += timedelta(days=7)
            expires_ms = int(expires_at.timestamp() * 1000)
            if plans[0].expiresAt and plans[0].expiresAt < expires_ms:
                for plan in plans:
                    plan.expiresAt = expires_ms
                db.session.commit()
        except Exception as e:
            logger.exception("check-payment update: %s", e)


def run_sync_data():
    """DataSync.sync - sync with master/slave hosts.
    Ported from api/services/DataSyncService.sync and api/controllers/errands/sync-data.js
    """
    from app.services.datasync_sync import sync
    try:
        sync()
    except Exception as e:
        logger.exception("[errands] sync-data error: %s", e)


def run_schedule_switches():
    """Create SwitchCommand records for today's schedules and send to devices.
    Ported from api/controllers/schedule/schedule-switches.js
    """
    from app.models.project import Project
    from app.models.schedule import Schedule
    from app.models.switch_command import SwitchCommand
    from app.services.device_service import send_switch_command, cancel_switch_schedule

    from flask import current_app

    schedules = Schedule.query.filter_by(isDeleted=False, isCompleted=False).all()
    if not schedules:
        return

    # Moment.js: Sunday=0, Monday=1, ..., Saturday=6. Python: Monday=0, ..., Sunday=6.
    def python_dow_to_sails(weekday):
        return (weekday + 1) % 7

    for schedule in schedules:
        project = Project.query.get(schedule.project)
        if not project:
            continue
        try:
            tz = ZoneInfo(project.timeZoneId) if project.timeZoneId else ZoneInfo("UTC")
        except Exception:
            tz = ZoneInfo("UTC")
        now = datetime.now(tz)
        today = now.strftime("%Y-%m-%d")
        today_dow = now.weekday()
        sails_dow = python_dow_to_sails(today_dow)
        days = schedule.daysOfWeek or []
        if sails_dow not in days:
            continue

        switches = schedule.switches or []
        if not switches:
            continue
        switch_ids = []
        for s in switches:
            if isinstance(s, int):
                switch_ids.append(s)
            elif isinstance(s, str) and str(s).isdigit():
                switch_ids.append(int(s))
        if not switch_ids:
            continue

        detail_list = schedule.scheduleDetail or []
        for detail in detail_list:
            on_time_str = detail.get("onTime", "08:00")
            off_time_str = detail.get("offTime", "18:00")
            on_parts = on_time_str.split(":")
            off_parts = off_time_str.split(":")
            on_h, on_m = int(on_parts[0]), int(on_parts[1]) if len(on_parts) > 1 else 0
            off_h, off_m = int(off_parts[0]), int(off_parts[1]) if len(off_parts) > 1 else 0

            day_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            on_dt = day_start.replace(hour=on_h, minute=on_m)
            off_dt = day_start.replace(hour=off_h, minute=off_m)
            on_ts = int(on_dt.timestamp() * 1000)
            off_ts = int(off_dt.timestamp() * 1000)
            now_ts = int(now.timestamp() * 1000)

            cmd_types = current_app.config.get("SWITCH_COMMAND_TYPES", {"POWER_ON": 1, "POWER_OFF": 2})
            power_on = cmd_types.get("POWER_ON", 1)
            power_off = cmd_types.get("POWER_OFF", 2)

            def _create_and_send_command(command_type, start_at):
                sc = SwitchCommand(
                    project=schedule.project,
                    commandType=command_type,
                    startAt=start_at,
                    deviceType=schedule.deviceType,
                )
                db.session.add(sc)
                db.session.flush()
                for switch_id in switch_ids:
                    db.session.execute(
                        text(
                            "INSERT INTO switch_switches_switch__switchcommand_switches "
                            "(switchcommand_switches, switch_switches_switch) VALUES (:sc_id, :switch_id)"
                        ),
                        {"sc_id": sc.id, "switch_id": switch_id},
                    )
                db.session.commit()
                schedule_id = f"x-{sc.id}"
                send_errors = []
                for switch_id in switch_ids:
                    try:
                        send_switch_command(
                            project_slug=project.slug,
                            switch_id=switch_id,
                            command=command_type,
                            time_ms=start_at,
                            switch_command_id=sc.id,
                            schedule_id=schedule_id,
                        )
                        time.sleep(0.05)
                    except Exception as e:
                        logger.exception("[schedule-switches] send_switch_command %s: %s", switch_id, e)
                        send_errors.append(e)
                if send_errors:
                    try:
                        sc.isCancelled = True
                        db.session.commit()
                        cancel_switch_schedule(project.slug, schedule_id)
                    except Exception:
                        pass
                return sc

            if on_ts < now_ts:
                continue
            if off_ts < now_ts:
                _create_and_send_command(power_on, on_ts)
                logger.info("[schedule-switches] created ON command for switches %s", switch_ids)
            else:
                _create_and_send_command(power_off, off_ts)
                _create_and_send_command(power_on, on_ts)
                logger.info("[schedule-switches] created OFF/ON commands for switches %s", switch_ids)

        if today >= (schedule.endDate or ""):
            schedule.isCompleted = True
        db.session.commit()


def run_alerts_schedule_tasks():
    """Run check-for-alert-conditions for each project."""
    from app.models.project import Project

    projects = Project.query.filter_by(isDeleted=False).all()
    for p in projects:
        try:
            run_check_alert_conditions(p.id)
        except Exception as e:
            logger.exception("alerts project %s: %s", p.id, e)


def run_check_alert_conditions(project_id):
    """Check meter, repeater, switch alert conditions."""
    from app.models.project import Project

    project = Project.query.get(project_id)
    if not project or project.isDeleted:
        return
    logger.info("[alerts] checking project %s", project_id)


def _run_ci_auto_compute():
    """
    Phase 8 — Capacity Intelligence™ auto-trigger.

    Runs after _run_cbi_auto_compute() in every rollup cycle.
    For each active project that has CBI data from the last 4 hours,
    recomputes the five Capacity Intelligence categories and upserts into
    capacity_intelligence table.

    Errors are swallowed per-project so one bad project cannot block others.
    """
    import time as _t
    from app.models.project import Project
    from app.models.capacity_intelligence import CapacityIntelligence
    from app.services.capacity_intelligence_engine import compute_capacity_from_cbi_metrics

    now_ms    = int(_t.time() * 1000)
    window_ms = 4 * 60 * 60 * 1000     # last 4 hours (match CBI window)
    from_ts   = now_ms - window_ms

    projects = Project.query.filter_by(isDeleted=False).all()
    logger.info("[ci-auto] triggered for %d projects", len(projects))

    for project in projects:
        try:
            buckets = compute_capacity_from_cbi_metrics(
                project.id,
                from_ts=from_ts,
                to_ts=now_ms,
            )
            if not buckets:
                continue

            upserted = 0
            for b in buckets:
                existing = (CapacityIntelligence.query
                            .filter_by(
                                project_id=b["project_id"],
                                site_id=b.get("site_id"),
                                bucket_ts=b["bucket_ts"],
                            )
                            .first())
                if existing:
                    for k, v in b.items():
                        if hasattr(existing, k) and k not in ("project_id", "site_id", "bucket_ts"):
                            setattr(existing, k, v)
                    existing.updatedAt = now_ms
                else:
                    db.session.add(CapacityIntelligence(
                        createdAt=now_ms,
                        updatedAt=now_ms,
                        **{k: v for k, v in b.items()
                           if hasattr(CapacityIntelligence, k)},
                    ))
                upserted += 1

            db.session.commit()
            logger.info("[ci-auto] project=%d buckets=%d", project.id, upserted)

        except Exception as exc:
            db.session.rollback()
            logger.warning("[ci-auto] project=%d error: %s", project.id, exc)


def _run_si_auto_compute():
    """
    Phase 9 — Savings Intelligence™ auto-trigger.

    Runs after _run_ci_auto_compute() each rollup cycle.
    For each active project that has a locked baseline, computes the 5 savings
    categories against recent CBI data and upserts into savings_intelligence.

    Only processes the last 4 hours (matches the CBI/CI window) to stay fast.
    Errors are swallowed per-project.
    """
    import time as _t
    from app.models.project import Project
    from app.models.savings_intelligence import SavingsIntelligence
    from app.services.savings_intelligence_engine import compute_savings_for_project

    now_ms    = int(_t.time() * 1000)
    window_ms = 4 * 60 * 60 * 1000
    from_ts   = now_ms - window_ms

    projects = Project.query.filter_by(isDeleted=False).all()
    logger.info("[si-auto] triggered for %d projects", len(projects))

    for project in projects:
        try:
            buckets = compute_savings_for_project(
                project.id,
                from_ts=from_ts,
                to_ts=now_ms,
            )
            if not buckets:
                continue

            upserted = 0
            for b in buckets:
                existing = (SavingsIntelligence.query
                            .filter_by(
                                project_id=b["project_id"],
                                site_id=b.get("site_id"),
                                bucket_ts=b["bucket_ts"],
                            )
                            .first())
                if existing:
                    for k, v in b.items():
                        if hasattr(existing, k) and k not in ("project_id", "site_id", "bucket_ts"):
                            setattr(existing, k, v)
                    existing.updatedAt = now_ms
                else:
                    db.session.add(SavingsIntelligence(
                        createdAt=now_ms,
                        updatedAt=now_ms,
                        **{k: v for k, v in b.items()
                           if hasattr(SavingsIntelligence, k)},
                    ))
                upserted += 1

            db.session.commit()
            logger.info("[si-auto] project=%d buckets=%d", project.id, upserted)

        except Exception as exc:
            db.session.rollback()
            logger.warning("[si-auto] project=%d error: %s", project.id, exc)


def process_queue_message(topic, data):
    """Route device message by MQTT topic to appropriate handler."""
    for pattern, name in [
        (r"^xeco/(.+)/sensors/(.*)/(.*)/data$", "processSensorData"),
        (r"^xeco/(.+)/sensors/(.*)/(.*)/meterData$", "processMeterData"),
        (r"^xeco/(.+)/sensors/(.*)/(.*)/equipmentData$", "processEquipmentData"),
        (r"^xeco/(.+)/gateways/(.*)/status$", "processBeacon"),
        (r"^xeco/.+/(sensors|gateways)/.+/control$|cancelcontrol", "processControlMessage"),
        (r"^xeco/(.+)/sensors/(.*)/ack$", "processControlAck"),
        (r"^xeco/(.+)/gateways/(.*)/ack$", "processSoftwareAck"),
        (r"^xeco/(.+)/sensors/(.*)/status$", "processStatus"),
    ]:
        if re.match(pattern, topic):
            if name == "processControlMessage":
                return
            logger.info("[device-processor] topic=%s -> %s", topic, name)
            return
    logger.warning("[device-processor] unknown topic: %s", topic)
