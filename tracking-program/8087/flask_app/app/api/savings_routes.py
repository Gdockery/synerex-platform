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
import time as _time

from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user

from app.db import get_session
from app.models.savings_intelligence import SavingsIntelligence, savings_health_rating
from app.helpers.roles import ENGINEERING_ROLES, ADMIN_ROLES, require_roles
from app.helpers.decorators import require_active_license

savings_bp = Blueprint("savings", __name__, url_prefix="")

_WRITE_ROLES = ENGINEERING_ROLES | ADMIN_ROLES


def _now_ms():
    return int(_time.time() * 1000)


def _can_access_project(sess, project_id: int) -> bool:
    from sqlalchemy import text
    role = getattr(current_user, "role", 0)
    if role == 8:
        return True
    org = getattr(current_user, "org_id", None)
    if not org:
        return False
    row = sess.execute(
        text("SELECT id FROM project WHERE id=:pid AND org_id=:org AND isDeleted=0"),
        {"pid": project_id, "org": org},
    ).fetchone()
    return row is not None


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
    from_ts     = request.args.get("from_ts", type=int, default=now - 30 * 86400 * 1000)
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
    from_ts     = request.args.get("from_ts", type=int, default=now - 30 * 86400 * 1000)
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
    from_ts     = request.args.get("from_ts", type=int, default=now - 30 * 86400 * 1000)
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
