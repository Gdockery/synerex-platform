"""
Get aggregate meter data for a date period.
Ported from api/helpers/web/meter/get-aggregate-data-for-period.js
Simplified for monthly report use - returns kwh and kvaPeak.
"""
from sqlalchemy import text

from app.extensions import db


def get_aggregate_data_for_period(project_id, from_date_ms, to_date_ms, time_zone="UTC", multiplier=1, peak_multiplier=1):
    """
    Get kwh and kvaPeak for a project over a date range.
    Uses MeterDataAggregate with intervalId != '' (15-min rollups).
    Returns dict with kwh, kvaPeak, kwPeak (for compatibility).
    """
    from datetime import datetime
    from zoneinfo import ZoneInfo

    try:
        tz = ZoneInfo(time_zone)
    except Exception:
        tz = ZoneInfo("UTC")

    start_dt = datetime.fromtimestamp(from_date_ms / 1000, tz=tz)
    end_dt = datetime.fromtimestamp(to_date_ms / 1000, tz=tz)
    start_day = start_dt.strftime("%Y-%m-%d")
    end_day = end_dt.strftime("%Y-%m-%d")

    result = db.session.execute(
        text("""
            SELECT day, intervalId, avgKva, avgKw, intervalStartTime
            FROM meterdataaggregate
            WHERE project = :proj AND day >= :start_day AND day <= :end_day
              AND intervalId IS NOT NULL AND intervalId != ''
            ORDER BY intervalStartTime ASC
        """),
        {"proj": project_id, "start_day": start_day, "end_day": end_day},
    )
    rows = result.fetchall()

    if not rows:
        return {"kwh": 0, "kvaPeak": 0, "kwPeak": 0}

    # getKwh() - group by 4 intervals (15-min each = 1 hour), avg each hour, sum
    avg_kva_list = []
    for r in rows:
        avg_kva = r.avgKva if hasattr(r, "avgKva") else (r._mapping.get("avgKva") if hasattr(r, "_mapping") else r[2])
        avg_kva_list.append(float(avg_kva or 0))

    total_kwh_raw = 0
    this_kwh = 0
    i = 0
    for h in range(len(avg_kva_list)):
        if i < 4:
            this_kwh += avg_kva_list[h]
            i += 1
        else:
            total_kwh_raw += this_kwh / 4
            this_kwh = avg_kva_list[h]
            i = 1
    # Does not add final partial group

    kwh = total_kwh_raw * (multiplier or 1)
    max_avg_kva = max(avg_kva_list) if avg_kva_list else 0
    kva_peak = max_avg_kva * (peak_multiplier or 1)
    max_avg_kw = max(
        r.avgKw if hasattr(r, "avgKw") else (r._mapping.get("avgKw", 0) if hasattr(r, "_mapping") else r[3])
        for r in rows
    ) if rows else 0
    kw_peak = float(max_avg_kw or 0)

    return {"kwh": kwh, "kvaPeak": kva_peak, "kwPeak": kw_peak}
