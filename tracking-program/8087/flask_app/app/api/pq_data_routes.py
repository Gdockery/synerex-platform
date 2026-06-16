"""
PQ Data routes — Phase 5: PQ Meter Data Collection Layer.

Spec: ECBS OS v4 §20A – PQ Meter Data Architecture™
      Data Flow: PQ Meter → Gateway → Site Server → Analytics Engines
      Storage tiers: 1-minute (meterdata), 15-minute (meterdataaggregate)

Routes
------
GET  /api/pq-data/readings          1-minute readings for a meter or site
GET  /api/pq-data/aggregate         15-minute aggregate for a site or project
GET  /api/pq-data/latest            Latest reading per meter for a site/project
GET  /api/pq-data/summary           KPI summary (avg/peak) for a date range
GET  /api/pq-data/channels          Enumeration of all available measurement channels

[COMPAT] Does NOT replace /api/meter/data or /api/meter/period.
         Those legacy endpoints remain for Angular compatibility.
         These new routes use site_id / project_id scope and return
         Phase-5-aligned field names.
"""
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from flask import Blueprint, request
from flask_login import login_required, current_user
from sqlalchemy import text

from app.db import get_session
from app.models.meter_data import MeterData
from app.models.meter_data_aggregate import MeterDataAggregate
from app.models.meter import Meter

pq_data_bp = Blueprint("pq_data", __name__, url_prefix="/api/pq-data")

# ── Spec-aligned measurement channels ─────────────────────────────────────────
PQ_CHANNELS = [
    # Phase measurements
    {"key": "l1Volt",    "label": "L1 Voltage",        "unit": "V",    "category": "voltage"},
    {"key": "l2Volt",    "label": "L2 Voltage",        "unit": "V",    "category": "voltage"},
    {"key": "l3Volt",    "label": "L3 Voltage",        "unit": "V",    "category": "voltage"},
    {"key": "totalVolt", "label": "Average Voltage",   "unit": "V",    "category": "voltage"},
    {"key": "l1Amp",     "label": "L1 Current",        "unit": "A",    "category": "current"},
    {"key": "l2Amp",     "label": "L2 Current",        "unit": "A",    "category": "current"},
    {"key": "l3Amp",     "label": "L3 Current",        "unit": "A",    "category": "current"},
    {"key": "totalAmp",  "label": "Total Current",     "unit": "A",    "category": "current"},
    {"key": "l1Kw",      "label": "L1 Power (kW)",     "unit": "kW",   "category": "power"},
    {"key": "l2Kw",      "label": "L2 Power (kW)",     "unit": "kW",   "category": "power"},
    {"key": "l3Kw",      "label": "L3 Power (kW)",     "unit": "kW",   "category": "power"},
    {"key": "totalKw",   "label": "Total Power (kW)",  "unit": "kW",   "category": "power"},
    {"key": "l1Kva",     "label": "L1 Apparent (kVA)", "unit": "kVA",  "category": "power"},
    {"key": "l2Kva",     "label": "L2 Apparent (kVA)", "unit": "kVA",  "category": "power"},
    {"key": "l3Kva",     "label": "L3 Apparent (kVA)", "unit": "kVA",  "category": "power"},
    {"key": "totalKva",  "label": "Total Apparent (kVA)", "unit": "kVA","category": "power"},
    {"key": "l1Kvar",    "label": "L1 Reactive (kVAR)","unit": "kVAR", "category": "power"},
    {"key": "l2Kvar",    "label": "L2 Reactive (kVAR)","unit": "kVAR", "category": "power"},
    {"key": "l3Kvar",    "label": "L3 Reactive (kVAR)","unit": "kVAR", "category": "power"},
    {"key": "totalKvar", "label": "Total Reactive (kVAR)","unit":"kVAR","category": "power"},
    {"key": "l1Pf",      "label": "L1 Power Factor",   "unit": "PF",   "category": "power_factor"},
    {"key": "l2Pf",      "label": "L2 Power Factor",   "unit": "PF",   "category": "power_factor"},
    {"key": "l3Pf",      "label": "L3 Power Factor",   "unit": "PF",   "category": "power_factor"},
    {"key": "totalPf",   "label": "Total Power Factor", "unit": "PF",  "category": "power_factor"},
    {"key": "l1THD",     "label": "L1 THDi",           "unit": "%",    "category": "harmonics"},
    {"key": "l2THD",     "label": "L2 THDi",           "unit": "%",    "category": "harmonics"},
    {"key": "l3THD",     "label": "L3 THDi",           "unit": "%",    "category": "harmonics"},
    {"key": "totalTHD",  "label": "Total THDi",        "unit": "%",    "category": "harmonics"},
    {"key": "frequency", "label": "Frequency",         "unit": "Hz",   "category": "frequency"},
    {"key": "outputAmp", "label": "Output Current",    "unit": "A",    "category": "current"},
]

_CHANNEL_KEYS = {c["key"] for c in PQ_CHANNELS}


def _now_ms():
    return int(datetime.now(timezone.utc).timestamp() * 1000)


def _scope_meter_ids(sess, project_id=None, site_id=None):
    """Return list of meter.id values the current user can access."""
    role = getattr(current_user, "role", 0)
    org  = getattr(current_user, "org_id", None)

    q = sess.query(Meter.id).filter_by(isDeleted=False)

    if project_id:
        q = q.filter(Meter.project == project_id)
    elif site_id:
        # Site → project is a join; use raw SQL for simplicity
        ids = sess.execute(
            text("SELECT id FROM meter WHERE isDeleted=0 AND project IN "
                 "(SELECT id FROM project WHERE org_id=:org OR 0=:admin)")
            .bindparams(org=org, admin=(1 if role == 8 else 0))
        ).fetchall()
        return [r[0] for r in ids]

    if role != 8 and org:
        # Join to project then client to scope by org
        q = q.join(
            text("project ON meter.project = project.id"),
            isouter=False,
        ).filter(text(f"project.org_id = '{org}'"))

    return [r[0] for r in q.all()]


def _reading_dict(r: MeterData, channels=None) -> dict:
    base = {
        "id":         r.id,
        "meter_id":   r.meter,
        "site_id":    r.site_id,
        "recorded_at": r.recordedAt,
        "day":        r.day,
        "minute":     r.minute,
        "interval_id": r.intervalId,
    }
    keys = channels if channels else _CHANNEL_KEYS
    for k in keys:
        if k in _CHANNEL_KEYS:
            base[k] = getattr(r, k, None)
    return base


def _agg_dict(r: MeterDataAggregate) -> dict:
    return {
        "id":                r.id,
        "project_id":        r.project,
        "day":               r.day,
        "interval_id":       r.intervalId,
        "interval_start":    r.intervalStartTime,
        "interval_end":      r.intervalEndTime,
        "num_samples":       r.numSamples,
        "avg_volt":          r.avgVolt,
        "avg_amp":           r.avgAmp,
        "avg_kw":            r.avgKw,
        "avg_kva":           r.avgKva,
        "avg_kvar":          r.avgKvar,
        "avg_pf":            r.avgPf,
        "peak_kva":          r.peakKva,
        "peak_kw":           r.peakKw,
    }


# ── Channels enumeration ───────────────────────────────────────────────────────

@pq_data_bp.route("/channels", methods=["GET"])
@login_required
def list_channels():
    """Return all spec-defined PQ measurement channels."""
    return {"data": PQ_CHANNELS}


# ── 1-minute readings ─────────────────────────────────────────────────────────

@pq_data_bp.route("/readings", methods=["GET"])
@login_required
def get_readings():
    """
    1-minute PQ readings for one meter or all meters in a project/site.

    Query params:
      meter_id    int      — single meter (optional)
      project_id  int      — scope to project (optional)
      site_id     int      — scope to site (optional)
      from_ts     int (ms) — start timestamp (required)
      to_ts       int (ms) — end timestamp (defaults to now)
      channels    str      — comma-separated channel keys to include (optional)
      limit       int      — max rows (default 1440, max 10080 / 7 days × 1440)
    """
    meter_id   = request.args.get("meter_id",   type=int)
    project_id = request.args.get("project_id", type=int)
    site_id    = request.args.get("site_id",     type=int)
    from_ts    = request.args.get("from_ts",     type=int)
    to_ts      = request.args.get("to_ts",       type=int) or _now_ms()
    limit      = min(request.args.get("limit",   1440, type=int), 10080)
    channels   = None
    if ch := request.args.get("channels"):
        channels = [c.strip() for c in ch.split(",") if c.strip() in _CHANNEL_KEYS]

    if not from_ts:
        return {"error": "from_ts required (ms epoch)"}, 400

    sess = get_session()
    q    = sess.query(MeterData).filter(
        MeterData.recordedAt >= from_ts,
        MeterData.recordedAt <= to_ts,
    )

    if meter_id:
        q = q.filter(MeterData.meter == meter_id)
    elif project_id or site_id:
        ids = _scope_meter_ids(sess, project_id=project_id, site_id=site_id)
        if not ids:
            return {"data": [], "meta": {"count": 0}}
        q = q.filter(MeterData.meter.in_(ids))
    else:
        return {"error": "meter_id, project_id, or site_id required"}, 400

    rows = q.order_by(MeterData.recordedAt.asc()).limit(limit).all()
    return {"data": [_reading_dict(r, channels) for r in rows],
            "meta": {"count": len(rows), "limit": limit}}


# ── 15-minute aggregate ────────────────────────────────────────────────────────

@pq_data_bp.route("/aggregate", methods=["GET"])
@login_required
def get_aggregate():
    """
    15-minute aggregate data (Tier 3 — spec §20B).

    Query params:
      project_id  int      — required
      from_day    str      — YYYY-MM-DD (required)
      to_day      str      — YYYY-MM-DD (defaults to from_day)
      limit       int      — max rows (default 2688 = 28 days × 96 intervals)
    """
    project_id = request.args.get("project_id", type=int)
    from_day   = request.args.get("from_day", "")
    to_day     = request.args.get("to_day")   or from_day
    limit      = min(request.args.get("limit", 2688, type=int), 26688)

    if not project_id:
        return {"error": "project_id required"}, 400
    if not from_day:
        return {"error": "from_day required (YYYY-MM-DD)"}, 400

    sess = get_session()
    rows = (sess.query(MeterDataAggregate)
            .filter(
                MeterDataAggregate.project == project_id,
                MeterDataAggregate.day >= from_day,
                MeterDataAggregate.day <= to_day,
                MeterDataAggregate.intervalId != "",
            )
            .order_by(MeterDataAggregate.intervalStartTime.asc())
            .limit(limit)
            .all())

    return {"data": [_agg_dict(r) for r in rows],
            "meta": {"count": len(rows), "from_day": from_day, "to_day": to_day}}


# ── Latest readings (live view) ───────────────────────────────────────────────

@pq_data_bp.route("/latest", methods=["GET"])
@login_required
def get_latest():
    """
    Latest 1-minute reading per meter for a project or site.
    Suitable for real-time dashboard tiles.

    Query params:
      project_id  int
      site_id     int
    """
    project_id = request.args.get("project_id", type=int)
    site_id    = request.args.get("site_id",     type=int)

    if not project_id and not site_id:
        return {"error": "project_id or site_id required"}, 400

    sess = get_session()
    ids  = _scope_meter_ids(sess, project_id=project_id, site_id=site_id)
    if not ids:
        return {"data": []}

    # One subquery per meter for the latest recordedAt
    result = sess.execute(
        text("""
            SELECT md.*
            FROM meterdata md
            INNER JOIN (
                SELECT meter, MAX(recordedAt) AS max_ts
                FROM meterdata
                WHERE meter IN :ids
                GROUP BY meter
            ) latest ON md.meter = latest.meter AND md.recordedAt = latest.max_ts
            ORDER BY md.meter
        """),
        {"ids": tuple(ids) if len(ids) > 1 else (ids[0], ids[0])},
    ).mappings().all()

    rows = [dict(r) for r in result]
    return {"data": rows, "meta": {"meter_count": len(ids)}}


# ── KPI summary ───────────────────────────────────────────────────────────────

@pq_data_bp.route("/summary", methods=["GET"])
@login_required
def get_summary():
    """
    Aggregated KPI summary across all meters in a project for a date range.
    Uses 15-minute meterdataaggregate table (Tier 3).

    Returns: avg_kw, avg_kva, avg_pf, avg_kvar, peak_kva, peak_kw,
             total_kwh (estimated), interval_count

    Query params:
      project_id   int    (required)
      from_day     str    YYYY-MM-DD (required)
      to_day       str    YYYY-MM-DD (defaults to from_day)
    """
    project_id = request.args.get("project_id", type=int)
    from_day   = request.args.get("from_day", "")
    to_day     = request.args.get("to_day") or from_day

    if not project_id:
        return {"error": "project_id required"}, 400
    if not from_day:
        return {"error": "from_day required (YYYY-MM-DD)"}, 400

    sess = get_session()
    rows = (sess.query(MeterDataAggregate)
            .filter(
                MeterDataAggregate.project == project_id,
                MeterDataAggregate.day >= from_day,
                MeterDataAggregate.day <= to_day,
                MeterDataAggregate.intervalId != "",
            )
            .all())

    if not rows:
        return {"data": {
            "project_id":    project_id,
            "from_day":      from_day,
            "to_day":        to_day,
            "interval_count": 0,
            "avg_kw": None, "avg_kva": None, "avg_pf": None, "avg_kvar": None,
            "peak_kva": None, "peak_kw": None, "total_kwh": None,
        }}

    def _avg(attr):
        vals = [getattr(r, attr) for r in rows if getattr(r, attr) is not None]
        return round(sum(vals) / len(vals), 4) if vals else None

    def _peak(attr):
        vals = [getattr(r, attr) for r in rows if getattr(r, attr) is not None]
        return round(max(vals), 4) if vals else None

    # Estimate kWh: each 15-min interval = avgKw × (15/60)
    kwh_vals = [getattr(r, "avgKw") for r in rows if getattr(r, "avgKw") is not None]
    total_kwh = round(sum(kwh_vals) * (15 / 60), 2) if kwh_vals else None

    return {"data": {
        "project_id":     project_id,
        "from_day":       from_day,
        "to_day":         to_day,
        "interval_count": len(rows),
        "avg_kw":         _avg("avgKw"),
        "avg_kva":        _avg("avgKva"),
        "avg_pf":         _avg("avgPf"),
        "avg_kvar":       _avg("avgKvar"),
        "peak_kva":       _peak("peakKva"),
        "peak_kw":        _peak("peakKw"),
        "total_kwh":      total_kwh,
    }}
