"""
Rollup utilities.
getIntervalFromMoment, getIntervalPeriodFromMoment, calculate15MinuteIntervals.
"""
import logging
from datetime import datetime
from zoneinfo import ZoneInfo

from sqlalchemy import text

logger = logging.getLogger(__name__)

# Interval duration in minutes (15-min rollup)
INTERVAL_DURATION = 15


def get_interval_from_moment(dt, interval_duration=INTERVAL_DURATION):
    """Given a datetime, get the 15-minute interval (0-95) it represents.
    Returns e.g. '05/-06:00' (interval/utc_offset).
    Ported from api/helpers/util/get-interval-from-moment.js
    """
    tz = dt.tzinfo or ZoneInfo("UTC")
    hours = dt.hour
    minutes = dt.minute
    intervals_in_hour = 60 // interval_duration
    interval = (hours * intervals_in_hour) + (minutes // interval_duration)
    interval_str = f"{interval:02d}" if interval < 10 else str(interval)
    # UTC offset for the timezone (e.g. -06:00)
    offset_seconds = tz.utcoffset(dt).total_seconds() if tz else 0
    offset_hours = int(offset_seconds // 3600)
    offset_mins = int((offset_seconds % 3600) // 60)
    sign = "+" if offset_hours >= 0 else "-"
    offset_str = f"{sign}{abs(offset_hours):02d}:{offset_mins:02d}"
    return f"{interval_str}/{offset_str}"


def get_interval_period_from_moment(day_str, interval_id, tz_str="UTC", interval_duration=INTERVAL_DURATION):
    """Given day (YYYY-MM-DD), intervalId (e.g. '5/-5:00'), return startTime and endTime (ms).
    Ported from api/helpers/util/get-interval-period-from-moment.js
    """
    try:
        tz = ZoneInfo(tz_str) if tz_str else ZoneInfo("UTC")
    except Exception:
        tz = ZoneInfo("UTC")
    parts = interval_id.split("/")
    interval_num = int(parts[0]) if parts else 0
    # Parse day in project timezone
    day_dt = datetime.strptime(day_str, "%Y-%m-%d").replace(tzinfo=tz)
    intervals_in_hour = 60 // interval_duration
    start_hour = interval_num // intervals_in_hour
    start_minute = (interval_num % intervals_in_hour) * interval_duration
    start_dt = day_dt.replace(hour=start_hour, minute=start_minute, second=0, microsecond=0)
    start_of_interval = int(start_dt.timestamp() * 1000)
    end_of_interval = start_of_interval + (60 * 1000 * interval_duration) - 1
    return {"startTime": start_of_interval, "endTime": end_of_interval}


def _clean_up_ranges(ranges):
    """Merge overlapping time ranges. Ported from calculate-15-minute-intervals.js"""
    if not ranges:
        return []
    sorted_ranges = sorted([(r["startTime"], r["endTime"]) for r in ranges], key=lambda x: x[0])
    merged = []
    current = None
    for start, end in sorted_ranges:
        if current is None:
            current = [start, end]
        else:
            if start > current[1] + 1:
                merged.append({"startTime": current[0], "endTime": current[1]})
                current = [start, end]
            else:
                current[1] = max(current[1], end)
    if current:
        merged.append({"startTime": current[0], "endTime": current[1]})
    return merged


def calculate_15_minute_intervals(db, meter_ids, ranges, db_connection=None):
    """Calculate 15-min aggregate from MeterData. Returns {all: rows, perMeter: rows}.
    Ported from api/helpers/rollup/calculate-15-minute-intervals.js
    Uses MySQL-compatible SQL - assumes mysql+pymysql.
    """
    if not ranges or not meter_ids:
        return {"all": [], "perMeter": []}

    ranges = _clean_up_ranges(ranges)
    range_criteria = " OR ".join(
        f"(recordedAt >= {r['startTime']} AND recordedAt <= {r['endTime']})" for r in ranges
    )
    meter_ids_str = ", ".join(str(m) for m in meter_ids)
    num_meters = len(meter_ids)
    first_meter_id = meter_ids[0]

    # Per-meter SQL - aggregate by day, intervalId, meter
    per_meter_sql = f"""
        SELECT day, intervalId, COUNT(*) as numSamples,
               MAX(createdAt) as createdAt, MAX(recordedAt) as recordedAt,
               meter, AVG(totalVolt) as avgVolt, AVG(totalAmp) as avgAmp,
               AVG(totalKw) as avgKw, AVG(totalKva) as avgKva,
               AVG(totalPf) as avgPf, AVG(totalKvar) as avgKvar
        FROM meterdata
        WHERE meter IN ({meter_ids_str}) AND ({range_criteria})
        GROUP BY day, intervalId, meter
        ORDER BY MAX(recordedAt) DESC
    """

    # Combined "all" SQL - inner group by meter,minute,intervalId,day
    # middle group by intervalId,day,minute with avg*len for totalKw/totalKva;
    # outer group by day,intervalId
    minute_subquery = f"""
        SELECT MAX(createdAt) as createdAt, MAX(updatedAt) as updatedAt, MAX(recordedAt) as recordedAt,
               day, intervalId, count(*) as numSamples,
               AVG(totalVolt) as avgVolt, AVG(totalAmp) as avgAmp,
               AVG(totalKw) as avgKw, AVG(totalKva) as avgKva,
               AVG(totalPf) as avgPf, AVG(totalKvar) as avgKvar,
               max(minute) as minute
        FROM meterdata
        WHERE meter IN ({meter_ids_str}) AND ({range_criteria})
        GROUP BY meter, minute, intervalId, day
    """
    middle_subquery = f"""
        SELECT day, intervalId, minute, SUM(numSamples) as numSamples,
               MAX(createdAt) as createdAt, MAX(recordedAt) as recordedAt,
               AVG(avgVolt) as avgVolt, AVG(avgAmp)*{num_meters} as avgAmp,
               AVG(avgKw)*{num_meters} as totalKw, AVG(avgKva)*{num_meters} as totalKva,
               AVG(avgPf) as avgPf, AVG(avgKvar)*{num_meters} as totalKvar
        FROM ({minute_subquery}) as metersum
        GROUP BY intervalId, day, minute
    """
    interval_sql = f"""
        SELECT day, intervalId, SUM(numSamples) as numSamples,
               MAX(createdAt) as createdAt, MAX(recordedAt) as recordedAt,
               AVG(avgVolt) as avgVolt, AVG(avgAmp) as avgAmp,
               AVG(totalKw) as avgKw, AVG(totalKva) as avgKva,
               AVG(avgPf) as avgPf, AVG(totalKvar) as avgKvar
        FROM ({middle_subquery}) as minuteData
        GROUP BY day, intervalId
        ORDER BY MAX(recordedAt) DESC
    """

    def _run_query(sql):
        result = db.session.execute(text(sql))
        rows = result.fetchall()
        if not rows:
            return []
        return [dict(row._mapping) if hasattr(row, "_mapping") else dict(zip(result.keys(), row)) for row in rows]

    all_rows = _run_query(interval_sql)
    per_meter_rows = _run_query(per_meter_sql)

    return {"all": all_rows, "perMeter": per_meter_rows}
