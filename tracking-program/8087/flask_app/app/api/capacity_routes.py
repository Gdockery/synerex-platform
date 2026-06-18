"""
Capacity Intelligence™ routes — Phase 8.

Spec: ECBS OS v4 §16, §54–57, Figure A-4, Appendix B-17, C-1

Purpose
───────
Identify hidden and recoverable electrical capacity at site and asset level.
All endpoints are downstream of Phase 7 (CBI) — they read from
current_balance_metrics and add the Capacity Intelligence™ layer.

Routes
──────
GET  /api/capacity/summary          Project-level capacity dashboard KPIs
GET  /api/capacity/assets           Per-asset capacity table (transformers/feeders)
GET  /api/capacity/trends           Capacity utilization time-series
POST /api/capacity/calculate        (Re)compute capacity_intelligence rows from CBI data
GET  /api/capacity/transformer/<id> Single-transformer burden analysis

[COMPAT] Does NOT touch /api/meter, /api/pq-data, /api/current-balance, or /api/baseline.
"""
import time as _time
from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user

from app.db import get_session
from app.models.capacity_intelligence import CapacityIntelligence, capacity_health_rating
from app.helpers.roles import ENGINEERING_ROLES, ADMIN_ROLES, require_roles
from app.helpers.decorators import require_active_license

capacity_bp = Blueprint("capacity", __name__, url_prefix="/api/capacity")

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


def _ci_dict(row: CapacityIntelligence) -> dict:
    return {
        "id":                    row.id,
        "project_id":            row.project_id,
        "site_id":               row.site_id,
        "bucket_ts":             row.bucket_ts,
        "installed_capacity":    row.installed_capacity,
        "used_capacity":         row.used_capacity,
        "available_capacity":    row.available_capacity,
        "hidden_capacity":       row.hidden_capacity,
        "recoverable_capacity":  row.recoverable_capacity,
        "deferred_capital_value": row.deferred_capital_value,
        "capacity_health_score": row.capacity_health_score,
        "rating":                capacity_health_rating(row.capacity_health_score),
        "utilization_pct":       row.utilization_pct,
        "hidden_pct":            row.hidden_pct,
        "recoverable_pct":       row.recoverable_pct,
        "transformer_kva_source": row.transformer_kva_source,
        "voltage_level":         row.voltage_level,
        "cbi_bucket_ts":         row.cbi_bucket_ts,
        "baseline_id":           row.baseline_id,
        "sample_count":          row.sample_count,
        "calculated_at":         row.calculated_at,
        "createdAt":             row.createdAt,
    }


# ── 1. Summary — Dashboard KPIs ──────────────────────────────────────────────

@capacity_bp.route("/summary", methods=["GET"])
@login_required
@require_active_license
def get_summary():
    """
    GET /api/capacity/summary?project_id=&[site_id=]&[from_ts=]&[to_ts=]

    Returns aggregated Capacity Intelligence™ KPIs for the period:
      installed_capacity, used_capacity, available_capacity,
      hidden_capacity, recoverable_capacity, deferred_capital_value,
      capacity_health_score, utilization_pct, hidden_pct, recoverable_pct,
      rating, trend_direction, row_count
    """
    from app.services.capacity_intelligence_engine import dashboard_summary

    project_id = request.args.get("project_id", type=int)
    if not project_id:
        return jsonify({"error": "project_id required"}), 400

    sess = get_session()
    if not _can_access_project(sess, project_id):
        return jsonify({"error": "Unauthorized"}), 403

    now = _now_ms()
    site_id = request.args.get("site_id", type=int)
    from_ts = request.args.get("from_ts", type=int, default=now - 30 * 86400 * 1000)
    to_ts   = request.args.get("to_ts",   type=int, default=now)

    summary = dashboard_summary(project_id, site_id=site_id, from_ts=from_ts, to_ts=to_ts)
    # Alias fields to match Angular component expectations
    if "error" not in summary:
        summary["installed_capacity_kva"]  = summary.get("installed_capacity")
        summary["current_load_kva"]        = summary.get("used_capacity")
        summary["available_capacity_kva"]  = summary.get("available_capacity")
        summary["hidden_capacity_kva"]     = summary.get("hidden_capacity")
        summary["recovered_capacity_kva"]  = summary.get("recoverable_capacity")
        summary["health_score"]            = summary.get("capacity_health_score")
    return jsonify(summary)


# ── 2. Assets — Per-asset capacity table ─────────────────────────────────────

@capacity_bp.route("/assets", methods=["GET"])
@login_required
def get_assets():
    """
    GET /api/capacity/assets?project_id=&[site_id=]&[from_ts=]&[to_ts=]

    Returns a table of assets from the Digital Twin with their capacity metrics.
    Each row: asset_id, asset_type, label, rated_kva, used_kva,
              available_kva, recoverable_kva, utilization_pct, health_score, status.

    Status:
      healthy   — utilization < 70%
      warning   — utilization 70–85%
      critical  — utilization > 85%
    """
    from app.services.digital_twin_service import (
        get_approved_twin, get_latest_twin_snapshot
    )
    from app.models.current_balance_metrics import CurrentBalanceMetrics

    project_id = request.args.get("project_id", type=int)
    if not project_id:
        return jsonify({"error": "project_id required"}), 400

    sess = get_session()
    if not _can_access_project(sess, project_id):
        return jsonify({"error": "Unauthorized"}), 403

    now = _now_ms()
    from_ts = request.args.get("from_ts", type=int, default=now - 90 * 86400 * 1000)
    to_ts   = request.args.get("to_ts",   type=int, default=now)

    # Get Digital Twin assets
    twin = get_approved_twin(project_id)
    if not twin:
        return jsonify({"data": [], "meta": {"twin_status": "no_approved_twin"}}), 200

    snapshot = get_latest_twin_snapshot(twin)
    assets = snapshot.get("assets", [])

    # Get latest CBI aggregate for context — use 90-day window to ensure we find data
    avg_kva_row = (CurrentBalanceMetrics.query
                   .filter_by(project_id=project_id)
                   .filter(CurrentBalanceMetrics.bucket_ts.between(from_ts, to_ts))
                   .order_by(CurrentBalanceMetrics.bucket_ts.desc())
                   .first())

    total_used_kva    = float(avg_kva_row.avg_kva or 0) if avg_kva_row else 0.0
    harm_pct          = float(avg_kva_row.harmonic_burden_pct or 0) if avg_kva_row else 0.0
    react_pct         = float(avg_kva_row.reactive_burden_pct or 0) if avg_kva_row else 0.0
    imb_pct           = float(avg_kva_row.imbalance_pct or 0) if avg_kva_row else 0.0
    neut_pct          = float(avg_kva_row.neutral_burden_pct or 0) if avg_kva_row else 0.0
    total_burden_pct  = min(harm_pct + react_pct + imb_pct + neut_pct, 100.0)

    # Identify the main-metered transformer — the meter reading applies to it.
    # All CBI data (avg_kva) comes from the main service entrance meter.

    # Strategy 1: explicit is_main_meter flag (manual/seeded twins)
    main_meter_ids = {
        a.get("id") for a in assets
        if isinstance(a, dict) and a.get("is_main_meter")
    }

    # Strategy 2: topo-seeded twins — find pq_meter assets, then follow
    # the "feeds" relationship to the switchgear/bus they connect to.
    if not main_meter_ids:
        relationships = snapshot.get("relationships", [])
        pq_meter_ids = {
            a.get("id") for a in assets
            if isinstance(a, dict) and str(a.get("asset_type", a.get("type", ""))).lower() == "pq_meter"
        }
        if pq_meter_ids and relationships:
            for rel in relationships:
                if rel.get("parent_asset_id") in pq_meter_ids and rel.get("relationship_type") == "feeds":
                    main_meter_ids.add(rel.get("child_asset_id"))

    # Strategy 3: check extra/metadata field on each asset
    if not main_meter_ids:
        for a in assets:
            if isinstance(a, dict):
                extra = a.get("extra") or {}
                if isinstance(extra, dict) and extra.get("is_main_meter"):
                    main_meter_ids.add(a.get("id"))

    # Fallback: use the transformer/switchgear with the largest rated kVA
    if not main_meter_ids:
        candidate_types = {"transformer", "switchgear"}
        transformer_assets = [
            a for a in assets
            if isinstance(a, dict) and str(
                a.get("type", a.get("asset_type", ""))
            ).lower() in candidate_types
        ]
        if transformer_assets:
            biggest = max(
                transformer_assets,
                key=lambda a: float(
                    a.get("rated_kva") or a.get("kva_rating") or a.get("ratedKva") or 0
                )
            )
            main_meter_ids = {biggest.get("id")}

    rows = []
    for asset in assets:
        if not isinstance(asset, dict):
            continue
        rated_kva = None
        for k in ("rated_kva", "kva_rating", "ratedKva", "kva", "capacity_kva"):
            if asset.get(k):
                try:
                    rated_kva = float(asset[k])
                    break
                except (TypeError, ValueError):
                    pass

        # Meter is on the main transformer — assign full CBI load only to that asset.
        # Other assets (panels, utility feeds, secondary transformers) show 0 metered load.
        used_kva = total_used_kva if asset.get("id") in main_meter_ids else 0.0
        hidden_kva = used_kva * (total_burden_pct / 100.0) if used_kva else 0.0
        available_kva = max(0.0, (rated_kva - used_kva)) if rated_kva else None
        recoverable_kva = used_kva * ((harm_pct * 0.90 + react_pct * 0.85) / 100.0) if used_kva else 0.0

        if rated_kva and rated_kva > 0 and used_kva:
            util_pct = min((used_kva / rated_kva) * 100.0, 200.0)
            status = "critical" if util_pct > 85 else ("warning" if util_pct > 70 else "healthy")
        else:
            util_pct = None
            status = "unknown"

        rows.append({
            "asset_id":        asset.get("id") or asset.get("asset_uid"),
            "asset_type":      asset.get("type") or asset.get("asset_type"),
            "label":           asset.get("label") or asset.get("name") or asset.get("asset_uid"),
            "rated_kva":       rated_kva,
            "used_kva":        round(used_kva, 2) if used_kva else 0.0,
            "available_kva":   round(available_kva, 2) if available_kva is not None else None,
            "hidden_kva":      round(hidden_kva, 2),
            "recoverable_kva": round(recoverable_kva, 2),
            "utilization_pct": round(util_pct, 1) if util_pct is not None else None,
            "status":          status,
        })

    return jsonify({
        "data": rows,
        "meta": {
            "total_assets":  len(rows),
            "twin_id":       twin.id,
            "twin_status":   twin.status,
            "period_from_ts": from_ts,
            "period_to_ts":   to_ts,
        },
    })


# ── 3. Trends — Capacity utilization time-series ─────────────────────────────

@capacity_bp.route("/trends", methods=["GET"])
@login_required
def get_trends():
    """
    GET /api/capacity/trends
        ?project_id=&[site_id=]&[from_ts=]&[to_ts=]&[limit=500]

    Returns time-series of capacity metrics for charting:
      [ { bucket_ts, used_capacity, available_capacity, hidden_capacity,
          recoverable_capacity, capacity_health_score, utilization_pct }, ... ]
    Sorted ascending by bucket_ts.
    """
    project_id = request.args.get("project_id", type=int)
    if not project_id:
        return jsonify({"error": "project_id required"}), 400

    sess = get_session()
    if not _can_access_project(sess, project_id):
        return jsonify({"error": "Unauthorized"}), 403

    now = _now_ms()
    site_id = request.args.get("site_id", type=int)
    from_ts = request.args.get("from_ts", type=int, default=now - 30 * 86400 * 1000)
    to_ts   = request.args.get("to_ts",   type=int, default=now)
    limit   = min(request.args.get("limit", type=int, default=500), 2000)

    q = (CapacityIntelligence.query
         .filter_by(project_id=project_id)
         .filter(CapacityIntelligence.bucket_ts.between(from_ts, to_ts)))
    if site_id:
        q = q.filter(CapacityIntelligence.site_id == site_id)
    rows = q.order_by(CapacityIntelligence.bucket_ts.asc()).limit(limit).all()

    return jsonify({
        "data": [
            {
                "bucket_ts":             r.bucket_ts,
                "installed_capacity":    r.installed_capacity,
                "used_capacity":         r.used_capacity,
                "available_capacity":    r.available_capacity,
                "hidden_capacity":       r.hidden_capacity,
                "recoverable_capacity":  r.recoverable_capacity,
                "capacity_health_score": r.capacity_health_score,
                "utilization_pct":       r.utilization_pct,
                "deferred_capital_value": r.deferred_capital_value,
            }
            for r in rows
        ],
        "meta": {"count": len(rows), "from_ts": from_ts, "to_ts": to_ts},
    })


# ── 4. Transformer detail ─────────────────────────────────────────────────────

@capacity_bp.route("/transformer/<asset_id>", methods=["GET"])
@login_required
def get_transformer(asset_id: str):
    """
    GET /api/capacity/transformer/<asset_id>
        ?project_id=&[from_ts=]&[to_ts=]

    Returns detailed burden analysis for a single transformer asset from the
    Digital Twin, cross-referenced with CBI and capacity data.

    Spec: Figure A-23, §55 Transformer Burden Analysis™

    Returns:
      {
        asset: { id, label, rated_kva, voltage_in, voltage_out, ... },
        summary: { load_burden_pct, harmonic_burden_pct, reactive_burden_pct,
                   imbalance_burden_pct, neutral_burden_pct,
                   capacity_recovery_potential_kva, deferred_upgrade_value,
                   transformer_health_score },
        trends: [ { bucket_ts, utilization_pct, capacity_health_score }, ... ]
      }
    """
    from app.services.digital_twin_service import (
        get_approved_twin, get_latest_twin_snapshot
    )
    from app.models.current_balance_metrics import CurrentBalanceMetrics

    project_id = request.args.get("project_id", type=int)
    if not project_id:
        return jsonify({"error": "project_id required"}), 400

    sess = get_session()
    if not _can_access_project(sess, project_id):
        return jsonify({"error": "Unauthorized"}), 403

    now = _now_ms()
    from_ts = request.args.get("from_ts", type=int, default=now - 7 * 86400 * 1000)
    to_ts   = request.args.get("to_ts",   type=int, default=now)

    # Find asset in Digital Twin
    twin = get_approved_twin(project_id)
    if not twin:
        return jsonify({"error": "No approved Digital Twin for this project"}), 404

    snapshot = get_latest_twin_snapshot(twin)
    asset_data = next(
        (a for a in snapshot.get("assets", [])
         if isinstance(a, dict) and str(a.get("id", "")) == str(asset_id)),
        None,
    )
    if not asset_data:
        return jsonify({"error": f"Asset {asset_id} not found in approved Digital Twin"}), 404

    # CBI metrics for burden analysis
    cbi_rows = (CurrentBalanceMetrics.query
                .filter_by(project_id=project_id)
                .filter(CurrentBalanceMetrics.bucket_ts.between(from_ts, to_ts))
                .order_by(CurrentBalanceMetrics.bucket_ts.asc())
                .all())

    def _mean(vals):
        clean = [float(v) for v in vals if v is not None]
        return round(sum(clean) / len(clean), 2) if clean else 0.0

    harm_pct  = _mean([r.harmonic_burden_pct  for r in cbi_rows])
    react_pct = _mean([r.reactive_burden_pct  for r in cbi_rows])
    imb_pct   = _mean([r.imbalance_pct         for r in cbi_rows])
    neut_pct  = _mean([r.neutral_burden_pct    for r in cbi_rows])
    avg_kva   = _mean([r.avg_kva               for r in cbi_rows])

    rated_kva = None
    for k in ("rated_kva", "ratedKva", "kva"):
        if asset_data.get(k):
            try:
                rated_kva = float(asset_data[k])
                break
            except (TypeError, ValueError):
                pass

    hidden_kva = avg_kva * ((harm_pct + react_pct + imb_pct + neut_pct) / 100.0)
    recoverable_kva = avg_kva * ((harm_pct * 0.90 + react_pct * 0.85) / 100.0)
    deferred_upgrade = recoverable_kva * 65.0   # $65/kVA default

    load_burden_pct = min((avg_kva / rated_kva * 100.0) if rated_kva else 0.0, 200.0)

    # Transformer Health Score — penalises load burden, harmonic burden, imbalance
    if rated_kva and rated_kva > 0:
        th_score = max(0.0, 100.0
                       - load_burden_pct * 0.40
                       - harm_pct * 0.35
                       - imb_pct * 0.25)
    else:
        th_score = max(0.0, 100.0 - harm_pct * 0.5 - imb_pct * 0.5)

    # CI trends
    ci_rows = (CapacityIntelligence.query
               .filter_by(project_id=project_id)
               .filter(CapacityIntelligence.bucket_ts.between(from_ts, to_ts))
               .order_by(CapacityIntelligence.bucket_ts.asc())
               .limit(500)
               .all())

    return jsonify({
        "asset": {
            "id":          asset_data.get("id"),
            "label":       asset_data.get("label") or asset_data.get("name"),
            "type":        asset_data.get("type"),
            "rated_kva":   rated_kva,
            "voltage_in":  asset_data.get("voltage_in"),
            "voltage_out": asset_data.get("voltage_out"),
        },
        "summary": {
            "load_burden_pct":                round(load_burden_pct, 2),
            "harmonic_burden_pct":            harm_pct,
            "reactive_burden_pct":            react_pct,
            "imbalance_burden_pct":           imb_pct,
            "neutral_burden_pct":             neut_pct,
            "avg_kva":                        avg_kva,
            "hidden_kva":                     round(hidden_kva, 2),
            "capacity_recovery_potential_kva": round(recoverable_kva, 2),
            "deferred_upgrade_value":          round(deferred_upgrade, 2),
            "transformer_health_score":        round(th_score, 2),
        },
        "trends": [
            {
                "bucket_ts":             r.bucket_ts,
                "utilization_pct":       r.utilization_pct,
                "capacity_health_score": r.capacity_health_score,
                "hidden_capacity":       r.hidden_capacity,
                "recoverable_capacity":  r.recoverable_capacity,
            }
            for r in ci_rows
        ],
    })


# ── 5. Calculate — (Re)compute capacity_intelligence from CBI data ────────────

@capacity_bp.route("/calculate", methods=["POST"])
@login_required
@require_roles(_WRITE_ROLES)
def calculate():
    """
    POST /api/capacity/calculate
    Body: { project_id, [site_id], [from_ts], [to_ts], [baseline_id], [cost_per_kva] }

    Reads CBI metrics for the requested window, computes the 5 capacity
    categories + health score + deferred capital, and upserts into
    capacity_intelligence table.

    Safe to re-run (upsert on project_id + site_id + bucket_ts).
    Requires Engineering or Admin role.
    """
    from app.services.capacity_intelligence_engine import compute_capacity_from_cbi_metrics

    body = request.get_json(force=True, silent=True) or {}
    project_id = body.get("project_id")
    if not project_id:
        return jsonify({"error": "project_id required"}), 400

    sess = get_session()
    if not _can_access_project(sess, project_id):
        return jsonify({"error": "Unauthorized"}), 403

    site_id     = body.get("site_id")
    from_ts     = body.get("from_ts")
    to_ts       = body.get("to_ts")
    baseline_id = body.get("baseline_id")
    cost_per_kva = float(body.get("cost_per_kva", 65.0))

    try:
        buckets = compute_capacity_from_cbi_metrics(
            project_id,
            site_id=site_id,
            from_ts=from_ts,
            to_ts=to_ts,
            baseline_id=baseline_id,
            cost_per_kva=cost_per_kva,
        )
    except Exception as exc:
        return jsonify({"error": f"Compute failed: {exc}"}), 500

    now_ms   = _now_ms()
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
            row = CapacityIntelligence(
                createdAt=now_ms,
                updatedAt=now_ms,
                **{k: v for k, v in b.items() if hasattr(CapacityIntelligence, k)},
            )
            sess.add(row)
        upserted += 1

    sess.commit()
    return jsonify({
        "meta": {
            "computed": len(buckets),
            "upserted": upserted,
        },
        "response": {"status": "ok"},
    })
