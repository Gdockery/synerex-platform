"""
Savings Intelligence™ routes — Phase 9.

Spec: ECBS OS v4 §17, §64–65, Figure A-11, Appendix B-18, C-1

Purpose
───────
Financial proof-of-value: quantify energy savings, demand savings, power factor
savings, capacity value, and sustainability value against a locked baseline.

Routes
──────
GET  /api/savings/intelligence   Project-level savings dashboard KPIs
GET  /api/savings/trends         Time-series for cumulative savings chart
GET  /api/savings/waterfall      Savings waterfall breakdown (5 categories)
GET  /api/roi                    ROI summary
GET  /api/payback                Payback period summary
POST /api/savings/calculate      (Re)compute savings_intelligence from CBI + baseline

[COMPAT] Does NOT touch /api/meter, /api/pq-data, /api/current-balance,
         /api/baseline, or /api/capacity.
"""

from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user

from app.db import get_session
from app.models.savings_intelligence import SavingsIntelligence, savings_health_rating
from app.helpers.roles import ENGINEERING_ROLES, ADMIN_ROLES, require_roles
from app.helpers.decorators import require_active_license
from app.helpers.time_utils import now_ms as _now_ms
from app.helpers.project_access import org_can_access_project as _can_access_project

savings_bp = Blueprint("savings", __name__, url_prefix="")

# ── Geocoding helper (server-side, cached) ────────────────────────────────────
_geo_cache: dict = {}  # location string → (lat, lng) or (None, None)

def _geocode_location(location: str):
    """
    Geocode a location string to (lat, lng) floats using Nominatim.
    Tries the full address first, then falls back to city/state extraction.
    Results are cached in-process so the map API only calls Nominatim once per site.
    Returns (None, None) if geocoding fails.
    """
    import urllib.request, urllib.parse, json as _json, re

    if not location:
        return None, None
    if location in _geo_cache:
        return _geo_cache[location]

    def _fetch(query: str):
        url = ("https://nominatim.openstreetmap.org/search?format=json&limit=1&q="
               + urllib.parse.quote(query))
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Synerex/1.0"})
            with urllib.request.urlopen(req, timeout=4) as resp:
                data = _json.loads(resp.read())
                if data:
                    return float(data[0]["lat"]), float(data[0]["lon"])
        except Exception:
            pass
        return None, None

    lat, lng = _fetch(location)
    if lat is None:
        # Fallback: extract "City, ST" from the address
        m = re.search(r"([A-Za-z ]+,\s*[A-Z]{2})", location)
        if m:
            lat, lng = _fetch(m.group(1).strip())

    _geo_cache[location] = (lat, lng)
    return lat, lng

_WRITE_ROLES = ENGINEERING_ROLES | ADMIN_ROLES





def _si_dict(row: SavingsIntelligence) -> dict:
    return {
        "id":                   row.id,
        "project_id":           row.project_id,
        "site_id":              row.site_id,
        "bucket_ts":            row.bucket_ts,
        "energy_savings":       row.energy_savings,
        "demand_savings":       row.demand_savings,
        "pf_savings":           row.pf_savings,
        "capacity_value":       row.capacity_value,
        "sustainability_value": row.sustainability_value,
        "annual_savings":       row.annual_savings,
        "roi":                  row.roi,
        "payback":              row.payback,
        "lifetime_savings":     row.lifetime_savings,
        "kw_reduction":         row.kw_reduction,
        "kwh_per_year":         row.kwh_per_year,
        "peak_kw_reduction":    row.peak_kw_reduction,
        "pf_improvement":       row.pf_improvement,
        "co2_reduction_tons":   row.co2_reduction_tons,
        "recoverable_kva":      row.recoverable_kva,
        "baseline_id":          row.baseline_id,
        "rating":               savings_health_rating(row.roi),
        "energy_rate":          row.energy_rate,
        "demand_rate":          row.demand_rate,
        "project_cost":         row.project_cost,
        "calculated_at":        row.calculated_at,
    }


# ── 1. Intelligence — Dashboard KPIs ─────────────────────────────────────────

@savings_bp.route("/api/savings/intelligence", methods=["GET"])
@login_required
@require_active_license
def get_intelligence():
    """
    GET /api/savings/intelligence
        ?project_id=&[site_id=]&[from_ts=]&[to_ts=]&[baseline_id=]

    Returns aggregated Savings Intelligence™ KPIs for the period:
      annual_savings, lifetime_savings, roi, payback, cumulative_savings,
      energy_savings, demand_savings, pf_savings, capacity_value,
      sustainability_value, kw_reduction, co2_reduction_tons,
      pf_improvement, recoverable_kva, rating, trend_direction
    """
    from app.services.savings_intelligence_engine import dashboard_summary

    project_id = request.args.get("project_id", type=int)
    if not project_id:
        return jsonify({"error": "project_id required"}), 400

    sess = get_session()
    if not _can_access_project(sess, project_id):
        return jsonify({"error": "Unauthorized"}), 403

    now    = _now_ms()
    site_id     = request.args.get("site_id",     type=int)
    baseline_id = request.args.get("baseline_id", type=int)
    from_ts     = request.args.get("from_ts", type=int, default=now - 90 * 86400 * 1000)
    to_ts       = request.args.get("to_ts",   type=int, default=now)

    summary = dashboard_summary(
        project_id, site_id=site_id,
        from_ts=from_ts, to_ts=to_ts,
        baseline_id=baseline_id,
    )
    # Alias for Angular backward compat
    if "error" not in summary:
        summary["annual_savings_est"] = summary.get("annual_savings")
    return jsonify(summary)


# ── 2. ROI endpoint ───────────────────────────────────────────────────────────

@savings_bp.route("/api/roi", methods=["GET"])
@login_required
def get_roi():
    """
    GET /api/roi?project_id=&[baseline_id=]

    Returns ROI and payback for the most recent savings snapshot.
    """
    project_id = request.args.get("project_id", type=int)
    if not project_id:
        return jsonify({"error": "project_id required"}), 400

    sess = get_session()
    if not _can_access_project(sess, project_id):
        return jsonify({"error": "Unauthorized"}), 403

    baseline_id = request.args.get("baseline_id", type=int)
    q = SavingsIntelligence.query.filter_by(project_id=project_id)
    if baseline_id:
        q = q.filter_by(baseline_id=baseline_id)

    latest = q.order_by(SavingsIntelligence.bucket_ts.desc()).first()
    if not latest:
        return jsonify({"error": "No savings data yet — run /api/savings/calculate first"}), 404

    return jsonify({
        "data": {
            "roi":              latest.roi,
            "payback":          latest.payback,
            "annual_savings":   latest.annual_savings,
            "lifetime_savings": latest.lifetime_savings,
            "project_cost":     latest.project_cost,
            "energy_rate":      latest.energy_rate,
            "demand_rate":      latest.demand_rate,
            "rating":           savings_health_rating(latest.roi),
            "baseline_id":      latest.baseline_id,
            "calculated_at":    latest.calculated_at,
        }
    })


# ── 3. Payback endpoint ───────────────────────────────────────────────────────

@savings_bp.route("/api/payback", methods=["GET"])
@login_required
def get_payback():
    """
    GET /api/payback?project_id=&[baseline_id=]

    Returns payback period and supporting savings metrics.
    """
    project_id = request.args.get("project_id", type=int)
    if not project_id:
        return jsonify({"error": "project_id required"}), 400

    sess = get_session()
    if not _can_access_project(sess, project_id):
        return jsonify({"error": "Unauthorized"}), 403

    baseline_id = request.args.get("baseline_id", type=int)
    q = SavingsIntelligence.query.filter_by(project_id=project_id)
    if baseline_id:
        q = q.filter_by(baseline_id=baseline_id)

    latest = q.order_by(SavingsIntelligence.bucket_ts.desc()).first()
    if not latest:
        return jsonify({"error": "No savings data yet — run /api/savings/calculate first"}), 404

    return jsonify({
        "data": {
            "payback":          latest.payback,
            "annual_savings":   latest.annual_savings,
            "energy_savings":   latest.energy_savings,
            "demand_savings":   latest.demand_savings,
            "pf_savings":       latest.pf_savings,
            "capacity_value":   latest.capacity_value,
            "sustainability_value": latest.sustainability_value,
            "project_cost":     latest.project_cost,
            "baseline_id":      latest.baseline_id,
        }
    })


# ── 4. Trends — Time-series for cumulative savings chart ──────────────────────

@savings_bp.route("/api/savings/trends", methods=["GET"])
@login_required
def get_trends():
    """
    GET /api/savings/trends
        ?project_id=&[site_id=]&[from_ts=]&[to_ts=]&[baseline_id=]&[limit=500]

    Returns time-series for the cumulative savings curve and waterfall sparklines.
    Sorted ascending by bucket_ts.
    """
    project_id = request.args.get("project_id", type=int)
    if not project_id:
        return jsonify({"error": "project_id required"}), 400

    sess = get_session()
    if not _can_access_project(sess, project_id):
        return jsonify({"error": "Unauthorized"}), 403

    now     = _now_ms()
    site_id     = request.args.get("site_id",     type=int)
    baseline_id = request.args.get("baseline_id", type=int)
    from_ts     = request.args.get("from_ts", type=int, default=now - 90 * 86400 * 1000)
    to_ts       = request.args.get("to_ts",   type=int, default=now)
    limit       = min(request.args.get("limit", type=int, default=500), 2000)

    q = (SavingsIntelligence.query
         .filter_by(project_id=project_id)
         .filter(SavingsIntelligence.bucket_ts.between(from_ts, to_ts)))
    if site_id:
        q = q.filter(SavingsIntelligence.site_id == site_id)
    if baseline_id:
        q = q.filter(SavingsIntelligence.baseline_id == baseline_id)

    rows = q.order_by(SavingsIntelligence.bucket_ts.asc()).limit(limit).all()

    # Compute running cumulative savings (15-min slices of annual_savings)
    frac = 15.0 / 60 / 24 / 365
    cumulative = 0.0
    series = []
    for r in rows:
        if r.annual_savings is not None:
            cumulative += float(r.annual_savings) * frac
        series.append({
            "bucket_ts":            r.bucket_ts,
            "annual_savings":       r.annual_savings,
            "cumulative_savings":   round(cumulative, 2),
            "energy_savings":       r.energy_savings,
            "demand_savings":       r.demand_savings,
            "pf_savings":           r.pf_savings,
            "capacity_value":       r.capacity_value,
            "sustainability_value": r.sustainability_value,
            "roi":                  r.roi,
            "kw_reduction":         r.kw_reduction,
            "co2_reduction_tons":   r.co2_reduction_tons,
        })

    return jsonify({
        "data": series,
        "meta": {
            "count":   len(series),
            "from_ts": from_ts,
            "to_ts":   to_ts,
            "total_cumulative": round(cumulative, 2),
        },
    })


# ── 5. Waterfall — Savings breakdown by category ──────────────────────────────

@savings_bp.route("/api/savings/waterfall", methods=["GET"])
@login_required
def get_waterfall():
    """
    GET /api/savings/waterfall?project_id=&[from_ts=]&[to_ts=]&[baseline_id=]

    Returns the savings waterfall chart data — one value per savings category,
    ordered as Energy → Demand → PF → Capacity → Sustainability.

    Format:
      { "data": [
          { "label": "Energy Savings", "value": 35000.0, "color": "energy" },
          ...
          { "label": "Total Annual Savings", "value": 48723.0, "color": "total" }
        ] }
    """
    from app.services.savings_intelligence_engine import dashboard_summary

    project_id = request.args.get("project_id", type=int)
    if not project_id:
        return jsonify({"error": "project_id required"}), 400

    sess = get_session()
    if not _can_access_project(sess, project_id):
        return jsonify({"error": "Unauthorized"}), 403

    now     = _now_ms()
    baseline_id = request.args.get("baseline_id", type=int)
    from_ts     = request.args.get("from_ts", type=int, default=now - 90 * 86400 * 1000)
    to_ts       = request.args.get("to_ts",   type=int, default=now)

    summary = dashboard_summary(project_id, from_ts=from_ts, to_ts=to_ts, baseline_id=baseline_id)
    if "error" in summary:
        return jsonify({"data": [], "meta": summary}), 200

    waterfall = [
        {"label": "Energy Savings",       "value": summary.get("energy_savings"),       "color": "energy"},
        {"label": "Demand Savings",        "value": summary.get("demand_savings"),        "color": "demand"},
        {"label": "Power Factor Savings",  "value": summary.get("pf_savings"),            "color": "pf"},
        {"label": "Capacity Value",        "value": summary.get("capacity_value"),         "color": "capacity"},
        {"label": "Sustainability Value",  "value": summary.get("sustainability_value"),   "color": "sustainability"},
        {"label": "Total Annual Savings",  "value": summary.get("annual_savings"),         "color": "total"},
    ]

    return jsonify({
        "data": waterfall,
        "meta": {
            "roi":            summary.get("roi"),
            "payback":        summary.get("payback"),
            "baseline_id":    summary.get("baseline_id"),
            "energy_rate":    summary.get("energy_rate"),
            "demand_rate":    summary.get("demand_rate"),
            "project_cost":   summary.get("project_cost"),
        },
    })


# ── 6. Calculate — (Re)compute savings from CBI + baseline ───────────────────

@savings_bp.route("/api/savings/calculate", methods=["POST"])
@login_required
@require_roles(_WRITE_ROLES)
def calculate():
    """
    POST /api/savings/calculate
    Body: {
        project_id,
        [baseline_id],   — defaults to latest locked baseline
        [from_ts],       — epoch-ms, default last 30 days
        [to_ts],
        [energy_rate],   — $/kWh override
        [demand_rate],   — $/kW/month override
    }

    Reads CBI + CI metrics, computes savings against the locked baseline,
    and upserts into savings_intelligence table.

    Safe to re-run. Requires Engineering or Admin role.
    """
    from app.services.savings_intelligence_engine import compute_savings_for_project

    body = request.get_json(force=True, silent=True) or {}
    project_id = body.get("project_id")
    if not project_id:
        return jsonify({"error": "project_id required"}), 400

    sess = get_session()
    if not _can_access_project(sess, project_id):
        return jsonify({"error": "Unauthorized"}), 403

    baseline_id  = body.get("baseline_id")
    from_ts      = body.get("from_ts")
    to_ts        = body.get("to_ts")
    energy_rate  = body.get("energy_rate", type=float) if hasattr(body.get, "__call__") else body.get("energy_rate")
    demand_rate  = body.get("demand_rate", type=float) if hasattr(body.get, "__call__") else body.get("demand_rate")

    # Coerce rate args
    try:
        energy_rate = float(energy_rate) if energy_rate is not None else None
        demand_rate = float(demand_rate) if demand_rate is not None else None
    except (TypeError, ValueError):
        energy_rate = demand_rate = None

    try:
        buckets = compute_savings_for_project(
            project_id,
            baseline_id=baseline_id,
            from_ts=from_ts,
            to_ts=to_ts,
            energy_rate=energy_rate,
            demand_rate=demand_rate,
        )
    except Exception as exc:
        return jsonify({"error": f"Compute failed: {exc}"}), 500

    now_ms   = _now_ms()
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
            sess.add(SavingsIntelligence(
                createdAt=now_ms,
                updatedAt=now_ms,
                **{k: v for k, v in b.items() if hasattr(SavingsIntelligence, k)},
            ))
        upserted += 1

    sess.commit()
    return jsonify({
        "meta": {
            "computed": len(buckets),
            "upserted": upserted,
        },
        "response": {"status": "ok"},
    })


# ── Portfolio Summary ─────────────────────────────────────────────────────────

@savings_bp.route("/api/portfolio/summary", methods=["GET"])
@login_required
@require_active_license
def get_portfolio_summary():
    """
    GET /api/portfolio/summary

    Returns aggregated KPIs across ALL projects the current user can access.
    Used by the Portfolio Dashboard (all-sites view) shown on first login.

    Response shape:
      total_annual_savings   float
      total_kva_recovered    float
      avg_power_factor       float   (0-1)
      avg_thd                float   (%)
      total_active_alarms    int
      total_devices          int
      devices_healthy        int
      devices_warning        int
      devices_offline        int
      total_co2_tons         float
      site_count             int
      sites                  list[{id, name, location, annual_savings, avg_pf,
                                   avg_thd, status, active_alarms, lat, lng}]
      savings_trend          list[{month, value}]  — last 7 days aggregate
    """
    from flask_login import current_user
    from app.models.user import User
    from app.models.project import Project, project_user
    from app.models.savings_intelligence import SavingsIntelligence
    from sqlalchemy import func, desc, text
    from app.extensions import db

    sess = get_session()
    user = User.query.get(current_user.id)
    if not user:
        return jsonify({"error": "Unauthorized"}), 403

    role = getattr(user, "role", 0)

    # ── 1. Gather accessible project IDs ────────────────────────────────────
    if role == 8:
        # Synerex Admin: all non-deleted projects
        projects = Project.query.filter_by(isDeleted=False).all()
    elif role in (9, 10):
        # OEM: projects whose client shares the same org
        org_id = getattr(user, "org_id", None)
        if not org_id:
            return jsonify({"error": "No org assigned"}), 403
        try:
            from app.models.client import Client
            client_ids = [c.id for c in Client.query.filter_by(org_id=org_id, isDeleted=False).all()]
            projects = Project.query.filter(
                Project.client.in_(client_ids),
                Project.isDeleted == False
            ).all() if client_ids else []
        except Exception:
            projects = []
    else:
        # All other roles: explicitly assigned projects only
        assigned = db.session.query(project_user.c.project_users).filter(
            project_user.c.user_projects == user.id
        ).all()
        project_ids = [row[0] for row in assigned]
        projects = Project.query.filter(
            Project.id.in_(project_ids),
            Project.isDeleted == False
        ).all() if project_ids else []

    if not projects:
        return jsonify({
            "meta": {"project_count": 0},
            "response": {
                "total_annual_savings": 0, "total_kva_recovered": 0,
                "avg_power_factor": 0, "avg_thd": 0,
                "total_active_alarms": 0, "site_count": 0,
                "total_devices": 0, "devices_healthy": 0,
                "devices_warning": 0, "devices_offline": 0,
                "total_co2_tons": 0, "sites": [], "savings_trend": [],
            }
        })

    pid_list = [p.id for p in projects]

    # ── 2. 30-day average savings_intelligence per project ───────────────────
    # Use a 30-day rolling average for stable KPI values rather than a single
    # snapshot (which fluctuates with instantaneous load vs a fixed baseline).
    import time as _t2
    _now_ms = int(_t2.time() * 1000)
    _cutoff30 = _now_ms - 30 * 86400 * 1000
    try:
        avg_rows = db.session.execute(
            text(
                "SELECT project_id, "
                "  AVG(annual_savings) AS annual_savings, "
                "  AVG(recoverable_kva) AS recoverable_kva, "
                "  AVG(co2_reduction_tons) AS co2_reduction_tons, "
                "  AVG(pf_improvement) AS pf_improvement "
                "FROM savings_intelligence "
                "WHERE project_id IN :pids AND bucket_ts >= :c30 "
                "GROUP BY project_id"
            ),
            {"pids": tuple(pid_list) or (0,), "c30": _cutoff30},
        ).fetchall()

        class _SIProxy:
            """Lightweight proxy so downstream code can use dot-access."""
            def __init__(self, row):
                self.project_id        = row[0]
                self.annual_savings    = row[1]
                self.recoverable_kva   = row[2]
                self.co2_reduction_tons = row[3]
                self.pf_improvement    = row[4]

        si_by_project = {r[0]: _SIProxy(r) for r in avg_rows}
    except Exception:
        si_by_project = {}

    # ── 3. Alarm counts per project ───────────────────────────────────────────
    try:
        from app.models.alarm import Alarm
        alarm_rows = (
            db.session.query(Alarm.project_id, func.count(Alarm.id).label("cnt"))
            .filter(Alarm.project_id.in_(pid_list), Alarm.resolved == False)
            .group_by(Alarm.project_id)
            .all()
        )
        alarm_by_project = {r.project_id: r.cnt for r in alarm_rows}
    except Exception:
        alarm_by_project = {}

    # ── 4. Device counts per project (from switch table — physical Synerex units) ──
    # Status derived from lastCommunicatedAt:
    #   healthy  = communicated within last 30 minutes
    #   warning  = communicated within last 24 hours
    #   offline  = older than 24 hours or never communicated
    try:
        import time as _time
        now_epoch_ms = int(_time.time() * 1000)
        rows = db.session.execute(
            text(
                "SELECT project, "
                "  SUM(CASE WHEN lastCommunicatedAt >= :h30 THEN 1 ELSE 0 END) AS healthy, "
                "  SUM(CASE WHEN lastCommunicatedAt >= :h24 AND lastCommunicatedAt < :h30 THEN 1 ELSE 0 END) AS warning, "
                "  SUM(CASE WHEN lastCommunicatedAt < :h24 OR lastCommunicatedAt IS NULL THEN 1 ELSE 0 END) AS offline, "
                "  COUNT(*) AS total "
                "FROM switch WHERE project IN :pids AND isDeleted=0 GROUP BY project"
            ),
            {
                "pids": tuple(pid_list) or (0,),
                "h30": now_epoch_ms - 30 * 60 * 1000,
                "h24": now_epoch_ms - 24 * 3600 * 1000,
            }
        ).fetchall()
        dev_by_project = {
            r[0]: {"healthy": int(r[1] or 0), "warning": int(r[2] or 0),
                   "offline": int(r[3] or 0), "total": int(r[4] or 0)}
            for r in rows
        }
    except Exception:
        dev_by_project = {}

    # ── 5. Current PF / THD per project (from current_balance_metrics) ──────────
    try:
        cbi_rows = db.session.execute(
            text(
                "SELECT project_id, avg_pf, avg_thd "
                "FROM current_balance_metrics WHERE project_id IN :pids "
                "ORDER BY bucket_ts DESC"
            ),
            {"pids": tuple(pid_list) or (0,)}
        ).fetchall()
        # Keep most recent per project
        cbi_by_project = {}
        for r in cbi_rows:
            if r[0] not in cbi_by_project:
                cbi_by_project[r[0]] = {"avg_pf": r[1] or 0, "avg_thd": r[2] or 0}
    except Exception:
        cbi_by_project = {}

    # ── 6. Aggregate totals ───────────────────────────────────────────────────
    total_savings = 0.0
    total_kva = 0.0
    total_co2 = 0.0
    pf_vals = []
    thd_vals = []
    total_alarms = sum(alarm_by_project.values())
    total_devices = 0
    devices_healthy = 0
    devices_warning = 0
    devices_offline = 0

    site_list = []
    for p in projects:
        si = si_by_project.get(p.id)
        cbi = cbi_by_project.get(p.id, {})
        alarms = alarm_by_project.get(p.id, 0)
        devs = dev_by_project.get(p.id, {})

        ann_sav = float(si.annual_savings or 0) if si else 0
        kva = float(si.recoverable_kva or 0) if si else 0
        co2 = float(si.co2_reduction_tons or 0) if si else 0
        avg_pf = float(cbi.get("avg_pf") or 0)
        avg_thd = float(cbi.get("avg_thd") or 0)

        total_savings += ann_sav
        total_kva += kva
        total_co2 += co2
        if avg_pf > 0:
            pf_vals.append(avg_pf)
        if avg_thd > 0:
            thd_vals.append(avg_thd)

        d_healthy = devs.get("healthy", 0)
        d_warning = devs.get("warning", 0)
        d_offline = devs.get("offline", 0)
        d_total   = devs.get("total", 0)
        total_devices    += d_total
        devices_healthy  += d_healthy
        devices_warning  += d_warning
        devices_offline  += d_offline

        status = "Healthy" if alarms == 0 else ("Warning" if alarms < 3 else "Critical")
        loc = getattr(p, "location", "") or ""
        lat, lng = _geocode_location(loc)
        site_list.append({
            "id": p.id,
            "name": getattr(p, "name", "") or "",
            "location": loc,
            "lat": lat,
            "lng": lng,
            "annual_savings": round(ann_sav),
            "avg_pf": round(avg_pf * 100, 1) if avg_pf <= 1 else round(avg_pf, 1),
            "avg_thd": round(avg_thd, 1),
            "status": status,
            "active_alarms": alarms,
            "kva_recovered": round(kva),
        })

    site_list.sort(key=lambda s: s["annual_savings"], reverse=True)

    avg_pf_out = (sum(pf_vals) / len(pf_vals)) if pf_vals else 0
    avg_thd_out = (sum(thd_vals) / len(thd_vals)) if thd_vals else 0

    # ── 7. Comprehensive trend data ──────────────────────────────────────────
    from datetime import datetime, timedelta
    import time as _time
    import calendar

    now_ms     = int(_time.time() * 1000)
    now_dt     = datetime.utcnow()
    today      = now_dt.date()
    day_abbr   = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
    pids_t     = tuple(pid_list) or (0,)

    ms30  = 30 * 86400 * 1000
    ms60  = 60 * 86400 * 1000
    cutoff30 = now_ms - ms30
    cutoff60 = now_ms - ms60

    # ── Helper: build ordered 30-day list filling gaps ────────────────────────
    def _daily_list(day_map, fallback=0):
        out = []
        last = fallback
        for i in range(29, -1, -1):
            d = today - timedelta(days=i)
            ds = d.strftime("%Y-%m-%d")
            v = day_map.get(ds)
            if v is not None:
                last = v
            out.append({"day": ds, "abbr": day_abbr[d.weekday()], "value": round(last, 4)})
        return out

    # ── 7a. 30-day daily savings + kVA (from savings_intelligence) ────────────
    trend_savings_30d = []
    trend_kva_30d     = []
    savings_delta_pct = 0.0
    kva_delta         = 0.0
    try:
        rows = db.session.execute(text(
            "SELECT DATE(FROM_UNIXTIME(bucket_ts/1000)) AS day, project_id,"
            "  AVG(annual_savings) AS sav, AVG(recoverable_kva) AS kva "
            "FROM savings_intelligence "
            "WHERE project_id IN :pids AND bucket_ts >= :c30 "
            "GROUP BY day, project_id ORDER BY day"
        ), {"pids": pids_t, "c30": cutoff30}).fetchall()

        sav_by_day = {}; kva_by_day = {}
        for r in rows:
            ds = str(r[0])
            sav_by_day[ds] = sav_by_day.get(ds, 0) + float(r[2] or 0)
            kva_by_day[ds] = kva_by_day.get(ds, 0) + float(r[3] or 0)

        trend_savings_30d = _daily_list(sav_by_day, total_savings)
        trend_kva_30d     = _daily_list(kva_by_day, total_kva)

        # Previous period for delta — use raw DB avg for both periods (apples-to-apples)
        cur_db = db.session.execute(text(
            "SELECT AVG(annual_savings) AS sav, AVG(recoverable_kva) AS kva "
            "FROM savings_intelligence "
            "WHERE project_id IN :pids AND bucket_ts >= :c30"
        ), {"pids": pids_t, "c30": cutoff30}).fetchone()
        prev = db.session.execute(text(
            "SELECT AVG(annual_savings) AS sav, AVG(recoverable_kva) AS kva "
            "FROM savings_intelligence "
            "WHERE project_id IN :pids AND bucket_ts >= :c60 AND bucket_ts < :c30"
        ), {"pids": pids_t, "c60": cutoff60, "c30": cutoff30}).fetchone()
        if cur_db and cur_db[0] and prev and prev[0]:
            cur_avg  = float(cur_db[0])
            prev_avg = float(prev[0])
            raw_delta = (cur_avg - prev_avg) / prev_avg * 100 if prev_avg else 0
            # Clamp to ±200% — outliers from model changes or powered-down periods
            savings_delta_pct = round(max(-200.0, min(200.0, raw_delta)), 1)
        if prev and prev[1] and total_kva > 0:
            kva_delta = round(total_kva - float(prev[1]), 1)
    except Exception:
        pass

    # ── 7b. 30-day daily PF + THD (from current_balance_metrics) ─────────────
    trend_pf_30d  = []
    trend_thd_30d = []
    try:
        cbm = db.session.execute(text(
            "SELECT DATE(FROM_UNIXTIME(bucket_ts/1000)) AS day,"
            "  AVG(avg_pf) AS pf, AVG(avg_thd) AS thd "
            "FROM current_balance_metrics "
            "WHERE project_id IN :pids AND bucket_ts >= :c30 "
            "GROUP BY day ORDER BY day"
        ), {"pids": pids_t, "c30": cutoff30}).fetchall()

        pf_by_day = {}; thd_by_day = {}
        for r in cbm:
            ds = str(r[0])
            pf_by_day[ds]  = float(r[1] or 0)
            thd_by_day[ds] = float(r[2] or 0)

        trend_pf_30d  = _daily_list(pf_by_day)
        trend_thd_30d = _daily_list(thd_by_day)
    except Exception:
        pass

    # ── 7c. Baseline — requires approved/locked baseline_master record ──────────
    baseline_avg_pf  = 0.0
    baseline_avg_thd = 0.0
    has_pf_baseline  = False
    has_thd_baseline = False
    try:
        bl = db.session.execute(text(
            "SELECT AVG(avg_pf), AVG(avg_thd) FROM baseline_master "
            "WHERE project_id IN :pids AND status IN ('approved', 'locked')"
        ), {"pids": pids_t}).fetchone()
        if bl:
            if bl[0] and float(bl[0]) > 0:
                baseline_avg_pf = round(float(bl[0]) * 100, 2)
                has_pf_baseline = True
            if bl[1] and float(bl[1]) > 0:
                baseline_avg_thd = round(float(bl[1]), 2)
                has_thd_baseline = True
    except Exception:
        pass

    # ── 7d. Weekly cumulative savings for current calendar year ──────────────
    monthly_trend = []
    try:
        year_start_ms = int(datetime(now_dt.year, 1, 1).timestamp() * 1000)
        wrows = db.session.execute(text(
            "SELECT "
            "  WEEK(FROM_UNIXTIME(bucket_ts/1000), 1) AS wk,"
            "  MIN(DATE(FROM_UNIXTIME(bucket_ts/1000))) AS wstart,"
            "  project_id, AVG(annual_savings) AS avg_sav "
            "FROM savings_intelligence "
            "WHERE project_id IN :pids AND bucket_ts >= :ys "
            "GROUP BY wk, project_id ORDER BY wk"
        ), {"pids": pids_t, "ys": year_start_ms}).fetchall()

        weekly = {}
        for r in wrows:
            wk = int(r[0]); ws = str(r[1])
            weekly.setdefault(wk, {"start": ws, "sav": 0})
            weekly[wk]["sav"] += float(r[3] or 0)

        cumulative = 0.0
        mon_abbr = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
        for wk in sorted(weekly.keys()):
            w = weekly[wk]
            weekly_dollars = w["sav"] / 365 * 7
            cumulative += weekly_dollars
            try:
                import datetime as _dt
                ws_d = _dt.date.fromisoformat(w["start"])
                label = mon_abbr[ws_d.month - 1]
            except Exception:
                label = ""
            monthly_trend.append({"month": label, "week": wk, "value": round(cumulative)})
    except Exception:
        pass

    # ── Legacy savings_trend (7-day, for sparkline fallback) ─────────────────
    savings_trend = trend_savings_30d[-7:] if trend_savings_30d else []

    return jsonify({
        "meta": {"project_count": len(projects)},
        "response": {
            "total_annual_savings": round(total_savings),
            "total_kva_recovered": round(total_kva),
            "avg_power_factor": round(avg_pf_out, 4),
            "avg_thd": round(avg_thd_out, 2),
            "total_active_alarms": total_alarms,
            "total_co2_tons": round(total_co2),
            "site_count": len(projects),
            "total_devices": total_devices,
            "devices_healthy": devices_healthy,
            "devices_warning": devices_warning,
            "devices_offline": devices_offline,
            "sites": site_list,
            # ── Trend series ───────────────────────────────────────────────
            "savings_trend":      savings_trend,        # legacy 7-day
            "trend_savings_30d":  trend_savings_30d,    # 30-day daily savings
            "trend_kva_30d":      trend_kva_30d,        # 30-day daily kVA
            "trend_pf_30d":       trend_pf_30d,         # 30-day daily PF
            "trend_thd_30d":      trend_thd_30d,        # 30-day daily THD
            "monthly_trend":      monthly_trend,         # weekly cumulative YTD
            # ── Deltas ─────────────────────────────────────────────────────
            "savings_delta_pct":  savings_delta_pct,
            "kva_delta":          kva_delta,
            # ── Baseline ───────────────────────────────────────────────────
            "baseline_avg_pf":    baseline_avg_pf,
            "baseline_avg_thd":   baseline_avg_thd,
            "has_pf_baseline":    has_pf_baseline,
            "has_thd_baseline":   has_thd_baseline,
        }
    })

