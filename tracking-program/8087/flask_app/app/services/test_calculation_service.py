"""
Test calculation service - full port of api/helpers/web/test/calculate-test-results.js
Computes test reportData from MeterData with segment/cycle logic and project-specific handling.
"""
import logging
from sqlalchemy import text

from app.extensions import db

logger = logging.getLogger(__name__)


def _avg(vals):
    return sum(vals) / len(vals) if vals else 0


def _sum(vals):
    return sum(vals) if vals else 0


def _pluck(records, key):
    return [r.get(key) for r in records if key in r]


def _max_or_default(vals, default=0):
    return max(vals) if vals else default


def _where(segments, **kwargs):
    return [s for s in segments if all(s.get(k) == v for k, v in kwargs.items())]


def _segment_first_minutes_criteria(test, project_name, minutes_to_avg=5, minutes_to_ignore=1):
    """Build segment criteria for getAggregateData SQL."""
    num_segments = int(test.duration / test.interval * 2 / 3)
    seg_index = 1
    conditions = []
    for segment in range(num_segments):
        start, end = 0, 0
        if test.interval == 24:
            start = test.startAt + (2 * 1000 * 60) + ((segment + seg_index) * test.interval * 60 * 60 * 1000)
            end = start + (test.interval * 1000 * 60 * 60) - (5 * 1000 * 60) - 1
            seg_index += 1
        elif "ione" in (project_name or ""):
            if segment % 2:  # on
                if "New Hope" in (project_name or ""):
                    start = test.startAt + (7 * 1000 * 60) + ((segment + seg_index) * test.interval * 60 * 60 * 1000)
                    end = start + (6 * 1000 * 60) - 1
                else:
                    start = test.startAt + (7 * 1000 * 60) + ((segment + seg_index) * test.interval * 60 * 60 * 1000)
                    end = start + (8 * 1000 * 60) - 1
                seg_index += 1
            else:  # off
                if "New Hope" in (project_name or ""):
                    start = test.startAt + (58 * 1000 * 60) + ((segment + seg_index) * test.interval * 60 * 60 * 1000)
                    end = start + (2 * 1000 * 60) - 1
                else:
                    start = test.startAt + (59 * 1000 * 60) + ((segment + seg_index) * test.interval * 60 * 60 * 1000)
                    end = start + (1 * 1000 * 60) - 1
        else:
            cycle_num = segment // 2
            cycle_start = test.startAt + (cycle_num * 3 * test.interval * 60 * 60 * 1000)
            transition = cycle_start + (2 * test.interval * 60 * 60 * 1000)
            if segment % 2:  # on
                start = transition + (minutes_to_ignore * 1000 * 60)
                end = start + (minutes_to_avg * 1000 * 60) - 1
                seg_index += 1
            else:  # off
                off_end = transition - (minutes_to_ignore * 60 * 1000)
                end = off_end - 1
                start = off_end - (minutes_to_avg * 60 * 1000)
        conditions.append(f"(recordedAt >= {start} AND recordedAt <= {end})")
    return " OR ".join(conditions)


def _segment_peak_off_criteria(test, project_name):
    """Off segments only."""
    num_segments = int(test.duration / test.interval * 2 / 3)
    peak_seg_index = 1
    conditions = []
    for segment in range(num_segments):
        if not (segment % 2):  # off
            if "ione" in (project_name or ""):
                if "alt" in (project_name or "") and peak_seg_index not in (1, 3):
                    start = test.startAt + (1 * 1000 * 60) + ((segment + peak_seg_index) * test.interval * 60 * 60 * 1000)
                    end = start + (58 * 1000 * 60) - 1
                elif "alt" not in (project_name or ""):
                    start = test.startAt + (1 * 1000 * 60) + ((segment + peak_seg_index) * test.interval * 60 * 60 * 1000)
                    end = start + (58 * 1000 * 60) - 1
                else:
                    peak_seg_index += 1
                    continue
            else:
                start = test.startAt + (50 * 60 * 1000) + ((segment + peak_seg_index) * test.interval * 60 * 60 * 1000)
                end = start + (10 * 1000 * 60) - 1
            peak_seg_index += 1
            conditions.append(f"(recordedAt >= {start} AND recordedAt <= {end})")
    return " OR ".join(conditions) if conditions else "1=0"


def _segment_peak_criteria(test, project_name):
    """On segments only."""
    num_segments = int(test.duration / test.interval * 2 / 3)
    peak_seg_index = 1
    conditions = []
    for segment in range(num_segments):
        if segment % 2:  # on
            if "ione" in (project_name or ""):
                if "alt" in (project_name or "") and peak_seg_index not in (1, 3):
                    start = test.startAt + (1 * 1000 * 60) + ((segment + peak_seg_index) * test.interval * 60 * 60 * 1000)
                    end = start + (58 * 1000 * 60) - 1
                elif "alt" not in (project_name or ""):
                    start = test.startAt + (7 * 1000 * 60) + ((segment + peak_seg_index) * test.interval * 60 * 60 * 1000)
                    end = start + (8 * 1000 * 60) - 1
                else:
                    peak_seg_index += 1
                    continue
            else:
                start = test.startAt + (1 * 60 * 1000) + ((segment + peak_seg_index) * test.interval * 60 * 60 * 1000)
                end = start + (10 * 1000 * 60) - 1
            peak_seg_index += 1
            conditions.append(f"(recordedAt >= {start} AND recordedAt <= {end})")
    return " OR ".join(conditions) if conditions else "1=0"


def calculate_test_results(test_id, meters_input, minutes_to_average=5, minutes_to_ignore=1):
    """
    Full port of sails.helpers.web.test.calculateTestResults.
    Returns report dict or None.
    """
    from app.models.test import Test
    from app.models.project import Project

    test = Test.query.filter_by(id=test_id, isDeleted=False).first()
    if not test:
        return None
    if test.isStatic == 1 and test.reportData:
        return test.reportData

    now_ms = int(__import__("time").time() * 1000)
    if now_ms <= test.endAt:
        return None

    project = Project.query.get(test.project)
    project_name = project.name if project else ""

    meter_ids = [int(x.strip()) for x in str(meters_input or "").split(",") if x.strip()]
    if not meter_ids:
        return _minimal_report(test)

    meter_ids_in = "(" + ",".join(str(m) for m in meter_ids) + ")"
    num_meters = len(meter_ids)
    hidden_ids = test.hiddenMeterDataRowIds or []
    hidden_clause = ""
    if hidden_ids:
        hidden_safe = ",".join(str(int(x)) for x in hidden_ids if x is not None)
        if hidden_safe:
            hidden_clause = f" AND id NOT IN ({hidden_safe})"

    seg_first = _segment_first_minutes_criteria(test, project_name, minutes_to_average, minutes_to_ignore)
    seg_peak_off = _segment_peak_off_criteria(test, project_name)
    seg_peak = _segment_peak_criteria(test, project_name)

    if "ione" in project_name:
        if "hipp" in project_name:
            max_kva_off = f"(SELECT AVG(totalKva)*{num_meters} FROM meterdata WHERE meter IN {meter_ids_in} AND (recordedAt > {test.startAt} AND recordedAt < {test.endAt}){hidden_clause} GROUP BY intervalId, minute ORDER BY AVG(totalKva)*{num_meters} DESC LIMIT 1)"
        else:
            max_kva_off = f"(SELECT AVG(totalKva)*{num_meters} FROM meterdata WHERE meter IN {meter_ids_in} AND ({seg_peak_off}){hidden_clause} GROUP BY intervalId, minute ORDER BY AVG(totalKva)*{num_meters} DESC LIMIT 1)"
        sql_extra = f"AVG(totalKva) as avgKva, AVG(totalKw) as avgKw, AVG(totalKvar) as avgKvar, AVG(totalTHD) as avgTHD, {max_kva_off} as maxKVAOff, "
    else:
        max_kva_off = f"(SELECT SUM(totalKva)/{num_meters} FROM meterdata WHERE meter IN {meter_ids_in} AND (recordedAt > {test.startAt} AND recordedAt < {test.endAt}){hidden_clause} GROUP BY intervalId, minute ORDER BY SUM(totalKva)/{num_meters} DESC LIMIT 1)"
        sql_extra = f"AVG(totalKva)*{num_meters} as avgKva, AVG(totalKw)*{num_meters} as avgKw, AVG(totalKvar)*{num_meters} as avgKvar, AVG(totalTHD)*{num_meters} as avgTHD, {max_kva_off} as maxKVAOff, "

    max_kva_on = f"(SELECT AVG(totalKva)*{num_meters} FROM meterdata WHERE meter IN {meter_ids_in} AND ({seg_peak}){hidden_clause} GROUP BY intervalId, minute ORDER BY AVG(totalKva)*{num_meters} DESC LIMIT 1)"
    group_by = "day, intervalId" if "New Hope" in project_name else "day, intervalId, minute"

    sql = (
        f"SELECT day, intervalId, COUNT(id) as numSamples, "
        f"MAX(createdAt) as createdAt, MAX(updatedAt) as updatedAt, "
        f"MIN(recordedAt) as intervalStartTime, MAX(recordedAt) as intervalEndTime, "
        f"AVG(totalVolt) as avgVolt, AVG(totalAmp) as avgAmp, "
        f"{sql_extra}"
        f"{max_kva_on} as maxKVAOn, "
        f"AVG(CASE WHEN totalPf < 0 THEN 100 ELSE totalPf END) as avgPf "
        f"FROM meterdata WHERE meter IN {meter_ids_in} AND ({seg_first}){hidden_clause} "
        f"GROUP BY {group_by}"
    )

    try:
        result = db.session.execute(text(sql))
        rows = result.fetchall()
        aggregate_records = [dict(row._mapping) if hasattr(row, "_mapping") else {} for row in rows]
    except Exception as e:
        logger.exception("calculate_test_results query error: %s", e)
        return None

    if not aggregate_records:
        return _minimal_report(test)

    num_cycles = int((test.duration / test.interval) / 3)
    segments = []
    cycles = []

    for cycle_num in range(num_cycles):
        cycle_start = test.startAt + ((cycle_num * 3) * (test.interval * 60 * 60 * 1000))
        cycle_end = cycle_start + (test.interval * 3 * 60 * 60 * 1000)
        transition = cycle_start + (2 * test.interval * 60 * 60 * 1000)

        cycle = {"cycle": cycle_num + 1, "startedAt": cycle_start, "endedAt": cycle_end, "percentSaved": {}}
        cycle_segments = []

        for segment_num in range(2):
            if segment_num % 2:  # on
                seg_start = transition + (minutes_to_ignore * 60 * 1000)
                seg_end = seg_start + (minutes_to_average * 60 * 1000) - 1
            else:  # off
                off_end = transition - (minutes_to_ignore * 60 * 1000)
                seg_end = off_end - 1
                seg_start = off_end - (minutes_to_average * 60 * 1000)

            aggregated = [
                r for r in aggregate_records
                if (r.get("intervalStartTime") or 0) <= seg_end and (r.get("intervalEndTime") or 0) >= seg_start
            ]

            if not aggregated:
                avg_kva = 0
                max_off = 0
                max_on = 0
                avg_pf = 0
                avg_thd = 0
                avg_kvar = 0
            else:
                avg_kva = sum(r.get("avgKva") or 0 for r in aggregated) / len(aggregated)
                max_off = _max_or_default(_pluck(aggregated, "maxKVAOff"))
                max_on = _max_or_default(_pluck(aggregated, "maxKVAOn"))
                avg_pf = sum(r.get("avgPf") or 0 for r in aggregated) / len(aggregated)
                avg_thd = sum(r.get("avgTHD") or 0 for r in aggregated) / len(aggregated)
                avg_kvar = sum(r.get("avgKvar") or 0 for r in aggregated) / len(aggregated)

            kw_peak = _max_or_default(_pluck(aggregated, "avgKva"))

            seg = {
                "segment": segment_num + 1,
                "startTime": cycle_start + (60 * 60 * 1000) + (segment_num * test.interval * 60 * 60 * 1000),
                "xecoSwitchedOn": bool(segment_num),
                "duration": test.interval,
                "include": True,
                "maxKVAOff": max_off,
                "maxKVAOn": max_on,
                "kwPeak": kw_peak,
                "powerFactor": avg_pf,
                "THD": avg_thd,
                "avgKw15MinInterval": avg_kva,
                "kvar": avg_kvar,
                "kwh": avg_kva,
            }
            cycle_segments.append(seg)
            segments.append(seg)

        cycle["segments"] = cycle_segments

        for attr in ["avgKw15MinInterval"]:
            off_val = cycle_segments[0].get(attr, 0)
            on_val = cycle_segments[1].get(attr, 0)
            if off_val > on_val:
                cycle["percentSaved"][attr] = ((off_val - on_val) / off_val) if off_val else 0
            else:
                cycle["percentSaved"][attr] = ((off_val - on_val) / on_val) if on_val else 0

        for attr in ["kwPeak", "kvar", "kwh", "THD"]:
            off_val = cycle_segments[0].get(attr, 0)
            on_val = cycle_segments[1].get(attr, 0)
            if off_val > on_val:
                cycle["percentSaved"][attr] = ((off_val - on_val) / off_val) if off_val else 0
            else:
                cycle["percentSaved"][attr] = ((off_val - on_val) / on_val) if on_val else 0

        off_pf = cycle_segments[0].get("powerFactor", 0)
        on_pf = cycle_segments[1].get("powerFactor", 0)
        if off_pf > on_pf:
            cycle["percentSaved"]["powerFactor"] = ((on_pf - off_pf) / off_pf) if off_pf else 0
        else:
            cycle["percentSaved"]["powerFactor"] = ((on_pf - off_pf) / on_pf) if on_pf else 0

        cycles.append(cycle)

    kva_diff_min, kva_diff_max = 100000, -100000
    rem_seg_min, rem_seg_max = 0, 0
    for c in cycles:
        val = c["percentSaved"].get("kwPeak", 0)
        if val < kva_diff_min:
            kva_diff_min, rem_seg_min = val, c["cycle"]
        if val > kva_diff_max:
            kva_diff_max, rem_seg_max = val, c["cycle"]

    if num_cycles >= 5 and "New Hope" not in project_name:
        for c in cycles:
            if c["cycle"] in (rem_seg_max, rem_seg_min):
                for s in c["segments"]:
                    s["include"] = False

    xeco_off = _where(segments, xecoSwitchedOn=False, include=True)
    xeco_on = _where(segments, xecoSwitchedOn=True, include=True)

    if "ione" in project_name and "New Hope" not in project_name:
        off_peak = _max_or_default(_pluck(xeco_off, "maxKVAOff"))
        on_peak = _max_or_default(_pluck(xeco_on, "maxKVAOn"))
    else:
        off_peak = _max_or_default(_pluck(xeco_off, "kwPeak"))
        on_peak = _max_or_default(_pluck(xeco_on, "kwPeak"))

    report = {
        "duration": test.duration,
        "startedAt": test.startAt,
        "endAt": test.endAt,
        "cycles": cycles,
        "totals": {
            "xecoOff": {
                "kwPeak": off_peak,
                "powerFactor": _avg(_pluck(xeco_off, "powerFactor")),
                "THD": _avg(_pluck(xeco_off, "THD")) or 0,
                "kvar": _avg(_pluck(xeco_off, "kvar")),
                "kva": _avg(_pluck(xeco_off, "avgKw15MinInterval")),
                "kwh": _sum(_pluck(xeco_off, "avgKw15MinInterval")),
            },
            "xecoOn": {
                "kwPeak": on_peak,
                "powerFactor": _avg(_pluck(xeco_on, "powerFactor")),
                "THD": _avg(_pluck(xeco_on, "THD")) or 0,
                "kvar": _avg(_pluck(xeco_on, "kvar")),
                "kva": _avg(_pluck(xeco_on, "avgKw15MinInterval")),
                "kwh": _sum(_pluck(xeco_on, "avgKw15MinInterval")),
            },
            "savings": {},
        },
        "percentSaved": {},
    }

    report["totals"]["savings"] = {
        "kwPeak": report["totals"]["xecoOff"]["kwPeak"] - report["totals"]["xecoOn"]["kwPeak"],
        "powerFactor": report["totals"]["xecoOn"]["powerFactor"] - report["totals"]["xecoOff"]["powerFactor"],
        "THD": (report["totals"]["xecoOff"]["THD"] - report["totals"]["xecoOn"]["THD"]) or 0,
        "kvar": report["totals"]["xecoOff"]["kvar"] - report["totals"]["xecoOn"]["kvar"],
        "kva": report["totals"]["xecoOff"]["kva"] - report["totals"]["xecoOn"]["kva"],
        "kwh": report["totals"]["xecoOff"]["kwh"] - report["totals"]["xecoOn"]["kwh"],
    }

    savings = report["totals"]["savings"]
    off_totals = report["totals"]["xecoOff"]
    on_totals = report["totals"]["xecoOn"]

    kw_peak_max = max(off_totals["kwPeak"], on_totals["kwPeak"])
    pf_max = max(off_totals["powerFactor"], on_totals["powerFactor"])
    kvar_max = max(off_totals["kvar"], on_totals["kvar"])
    kva_max = max(off_totals["kva"], on_totals["kva"])
    kwh_max = max(off_totals["kwh"], on_totals["kwh"])

    report["percentSaved"] = {
        "kwPeak": (savings["kwPeak"] / kw_peak_max) if kw_peak_max else 0,
        "powerFactor": (savings["powerFactor"] / pf_max) if pf_max else 0,
        "THD": savings["THD"] or 0,
        "kvar": (savings["kvar"] / kvar_max) if kvar_max else 0,
        "kva": (savings["kva"] / kva_max) if kva_max else 0,
        "kwh": (savings["kwh"] / kwh_max) if kwh_max else 0,
    }

    return report


def _minimal_report(test):
    return {
        "duration": test.duration,
        "startedAt": test.startAt,
        "endAt": test.endAt,
        "totals": {"xecoOff": {}, "xecoOn": {}, "savings": {}},
        "percentSaved": {"kwh": 0, "kwPeak": 0, "kva": 0},
        "cycles": [],
    }
