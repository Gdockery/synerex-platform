"""
Current Balance Intelligence™ routes — Phase 7.

Spec: ECBS OS v4 §15, §52-53, §56
      Continuously classify electrical current behavior across the network.

Routes
------
GET  /api/current-balance/summary        Project-level CBI dashboard KPIs
GET  /api/current-balance/timeseries     CBI over a date range (bucketed)
GET  /api/current-balance/breakdown      Per-meter current classification for a range
POST /api/current-balance/calculate      Trigger (re)calculation; writes to DB
GET  /api/current-balance/baseline-compare  CBI vs approved Phase-6 baseline

[COMPAT] Does NOT touch existing /api/meter, /api/pq-data, or /api/baseline routes.
         Only adds new /api/current-balance/* namespace.
         Reads from meterdata (Phase 5) and current_balance_metrics (new table).
         Optionally tags results with baseline_id from Phase 6.
"""
import time as _time
from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from sqlalchemy import text

from app.db import get_session
from app.models.meter import Meter
from app.models.meter_data import MeterData
from app.models.current_balance_metrics import CurrentBalanceMetrics, cbi_rating
from app.services.current_balance_engine import (
    compute_buckets,
    dashboard_summary,
    classify_reading,
    bucket_ts_for,
    _row_to_dict,
)
from app.helpers.roles import ENGINEERING_ROLES, ADMIN_ROLES, require_roles

_CBI_WRITE_ROLES = ENGINEERING_ROLES | ADMIN_ROLES

current_balance_bp = Blueprint("current_balance", __name__, url_prefix="/api/current-balance")

_PAGE_SIZE_MAX = 2000


def _now_ms():
    return int(_time.time() * 1000)


# ── Access helpers ────────────────────────────────────────────────────────────

def _user_project_ids(sess):
    """Return project IDs accessible to the current user."""
    from app.models.project import project_user
    role = getattr(current_user, "role", 0)
    if role == 8:
        rows = sess.execute(text("SELECT id FROM project WHERE isDeleted=0")).fetchall()
        return [r[0] for r in rows]
    uid = current_user.id
    rows = sess.execute(
        text("SELECT project_users FROM project_users WHERE user_projects=:uid"),
        {"uid": uid},
    ).fetchall()
    return [r[0] for r in rows]


def _can_access_project(sess, project_id: int) -> bool:
    role = getattr(current_user, "role", 0)
    if role == 8:
        return True
    uid = current_user.id
    row = sess.execute(
        text(
            "SELECT 1 FROM project_users "
            "WHERE project_users=:pid AND user_projects=:uid LIMIT 1"
        ),
        {"pid": project_id, "uid": uid},
    ).fetchone()
    return row is not None


def _meter_ids_for_project(sess, project_id: int):
    rows = sess.query(Meter.id).filter_by(project=project_id, isDeleted=False).all()
    return [r[0] for r in rows]


# ── Serialiser ────────────────────────────────────────────────────────────────

def _cbm_dict(m: CurrentBalanceMetrics) -> dict:
    return {
        "id":                  m.id,
        "project_id":          m.project_id,
        "site_id":             m.site_id,
        "meter_id":            m.meter_id,
        "baseline_id":         m.baseline_id,
        "bucket_ts":           m.bucket_ts,
        "avg_amp":             m.avg_amp,
        "avg_pf":              m.avg_pf,
        "avg_thd":             m.avg_thd,
        "avg_kw":              m.avg_kw,
        "avg_kvar":            m.avg_kvar,
        "avg_kva":             m.avg_kva,
        "avg_l1_amp":          m.avg_l1_amp,
        "avg_l2_amp":          m.avg_l2_amp,
        "avg_l3_amp":          m.avg_l3_amp,
        "productive_amp":      m.productive_amp,
        "reactive_amp":        m.reactive_amp,
        "harmonic_amp":        m.harmonic_amp,
        "imbalance_amp":       m.imbalance_amp,
        "neutral_amp":         m.neutral_amp,
        "lost_cap_amp":        m.lost_cap_amp,
        "harmonic_burden_pct": m.harmonic_burden_pct,
        "reactive_burden_pct": m.reactive_burden_pct,
        "imbalance_pct":       m.imbalance_pct,
        "neutral_burden_pct":  m.neutral_burden_pct,
        "cbi_score":           m.cbi_score,
        "cbi_rating":          cbi_rating(m.cbi_score),
        "sample_count":        m.sample_count,
        "calculated_at":       m.calculated_at,
    }


# ── 1. Summary ────────────────────────────────────────────────────────────────

@current_balance_bp.route("/summary", methods=["GET"])
@login_required
def get_summary():
    """
    GET /api/current-balance/summary?project_id=&[from_ts=]&[to_ts=]&[site_id=]&[meter_id=]

    Returns CBI dashboard KPIs for the given project over the date range.
    If no date range given defaults to last 30 days.
    """
    project_id = request.args.get("project_id", type=int)
    if not project_id:
        return jsonify({"error": "project_id required"}), 400

    sess = get_session()
    if not _can_access_project(sess, project_id):
        return jsonify({"error": "Unauthorized"}), 403

    now = _now_ms()
    from_ts = request.args.get("from_ts", type=int, default=now - 30 * 86400 * 1000)
    to_ts   = request.args.get("to_ts",   type=int, default=now)
    site_id  = request.args.get("site_id",  type=int)
    meter_id = request.args.get("meter_id", type=int)

    q = sess.query(CurrentBalanceMetrics).filter(
        CurrentBalanceMetrics.project_id == project_id,
        CurrentBalanceMetrics.bucket_ts  >= from_ts,
        CurrentBalanceMetrics.bucket_ts  <= to_ts,
    )
    if site_id:
        q = q.filter(CurrentBalanceMetrics.site_id == site_id)
    if meter_id:
        q = q.filter(CurrentBalanceMetrics.meter_id == meter_id)

    rows = q.order_by(CurrentBalanceMetrics.bucket_ts.asc()).all()
    row_dicts = [_cbm_dict(r) for r in rows]

    summary = dashboard_summary(row_dicts)
    return jsonify({"meta": {"from_ts": from_ts, "to_ts": to_ts, "rows": len(rows)},
                    "response": summary})


# ── 2. Timeseries ─────────────────────────────────────────────────────────────

@current_balance_bp.route("/timeseries", methods=["GET"])
@login_required
def get_timeseries():
    """
    GET /api/current-balance/timeseries
        ?project_id=&[from_ts=]&[to_ts=]&[site_id=]&[meter_id=]&[page=]&[page_size=]

    Returns ordered list of bucket-level CBI rows for charting.
    """
    project_id = request.args.get("project_id", type=int)
    if not project_id:
        return jsonify({"error": "project_id required"}), 400

    sess = get_session()
    if not _can_access_project(sess, project_id):
        return jsonify({"error": "Unauthorized"}), 403

    now = _now_ms()
    from_ts   = request.args.get("from_ts",   type=int, default=now - 7 * 86400 * 1000)
    to_ts     = request.args.get("to_ts",     type=int, default=now)
    site_id   = request.args.get("site_id",   type=int)
    meter_id  = request.args.get("meter_id",  type=int)
    page      = request.args.get("page",      type=int, default=1)
    page_size = min(request.args.get("page_size", type=int, default=500), _PAGE_SIZE_MAX)

    q = sess.query(CurrentBalanceMetrics).filter(
        CurrentBalanceMetrics.project_id == project_id,
        CurrentBalanceMetrics.bucket_ts  >= from_ts,
        CurrentBalanceMetrics.bucket_ts  <= to_ts,
    )
    if site_id:
        q = q.filter(CurrentBalanceMetrics.site_id == site_id)
    if meter_id:
        q = q.filter(CurrentBalanceMetrics.meter_id == meter_id)

    total = q.count()
    rows  = q.order_by(CurrentBalanceMetrics.bucket_ts.asc()) \
             .offset((page - 1) * page_size).limit(page_size).all()

    return jsonify({
        "meta": {"total": total, "page": page, "page_size": page_size},
        "response": [_cbm_dict(r) for r in rows],
    })


# ── 3. Breakdown ──────────────────────────────────────────────────────────────

@current_balance_bp.route("/breakdown", methods=["GET"])
@login_required
def get_breakdown():
    """
    GET /api/current-balance/breakdown
        ?project_id=&[from_ts=]&[to_ts=]

    Returns one aggregated row per meter showing average CBI and current
    classifications for the date range. Useful for per-meter comparison view.
    """
    project_id = request.args.get("project_id", type=int)
    if not project_id:
        return jsonify({"error": "project_id required"}), 400

    sess = get_session()
    if not _can_access_project(sess, project_id):
        return jsonify({"error": "Unauthorized"}), 403

    now = _now_ms()
    from_ts = request.args.get("from_ts", type=int, default=now - 30 * 86400 * 1000)
    to_ts   = request.args.get("to_ts",   type=int, default=now)

    sql = text("""
        SELECT
            meter_id,
            COUNT(*)                              AS bucket_count,
            AVG(cbi_score)                        AS avg_cbi,
            AVG(harmonic_burden_pct)              AS avg_harmonic,
            AVG(reactive_burden_pct)              AS avg_reactive,
            AVG(imbalance_pct)                    AS avg_imbalance,
            AVG(neutral_burden_pct)               AS avg_neutral,
            AVG(productive_amp)                   AS avg_productive,
            AVG(reactive_amp)                     AS avg_reactive_amp,
            AVG(harmonic_amp)                     AS avg_harmonic_amp,
            AVG(imbalance_amp)                    AS avg_imbalance_amp,
            AVG(neutral_amp)                      AS avg_neutral_amp,
            AVG(lost_cap_amp)                     AS avg_lost_cap,
            AVG(avg_amp)                          AS avg_total_amp
        FROM current_balance_metrics
        WHERE project_id = :pid
          AND bucket_ts >= :from_ts
          AND bucket_ts <= :to_ts
        GROUP BY meter_id
        ORDER BY avg_cbi ASC
    """)

    rows = sess.execute(sql, {"pid": project_id, "from_ts": from_ts, "to_ts": to_ts}).fetchall()

    results = []
    for r in rows:
        avg_cbi = float(r[2]) if r[2] is not None else None
        results.append({
            "meter_id":          r[0],
            "bucket_count":      r[1],
            "avg_cbi_score":     round(avg_cbi, 2) if avg_cbi is not None else None,
            "cbi_rating":        cbi_rating(avg_cbi),
            "avg_harmonic_pct":  round(float(r[3]), 2) if r[3] is not None else None,
            "avg_reactive_pct":  round(float(r[4]), 2) if r[4] is not None else None,
            "avg_imbalance_pct": round(float(r[5]), 2) if r[5] is not None else None,
            "avg_neutral_pct":   round(float(r[6]), 2) if r[6] is not None else None,
            "avg_productive_amp":round(float(r[7]), 4) if r[7] is not None else None,
            "avg_reactive_amp":  round(float(r[8]), 4) if r[8] is not None else None,
            "avg_harmonic_amp":  round(float(r[9]), 4) if r[9] is not None else None,
            "avg_imbalance_amp": round(float(r[10]),4) if r[10] is not None else None,
            "avg_neutral_amp":   round(float(r[11]),4) if r[11] is not None else None,
            "avg_lost_cap_amp":  round(float(r[12]),4) if r[12] is not None else None,
            "avg_total_amp":     round(float(r[13]),4) if r[13] is not None else None,
        })

    return jsonify({
        "meta":     {"project_id": project_id, "from_ts": from_ts, "to_ts": to_ts},
        "response": results,
    })


# ── 4. Calculate (trigger computation) ───────────────────────────────────────

@current_balance_bp.route("/calculate", methods=["POST"])
@login_required
@require_roles(_CBI_WRITE_ROLES)
def run_calculate():
    """
    POST /api/current-balance/calculate
    Body: { project_id, [from_ts], [to_ts], [site_id], [meter_id], [baseline_id] }

    Reads 1-minute meterdata for the range, computes CBI per 15-min bucket per
    meter, and upserts into current_balance_metrics. Returns counts.

    Safe to re-run (upsert on project_id + meter_id + bucket_ts).
    Max date range: 90 days to prevent timeout.
    """
    body = request.get_json(force=True, silent=True) or {}
    project_id = body.get("project_id")
    if not project_id:
        return jsonify({"error": "project_id required"}), 400

    sess = get_session()
    if not _can_access_project(sess, project_id):
        return jsonify({"error": "Unauthorized"}), 403

    now = _now_ms()
    max_range_ms = 90 * 86400 * 1000
    from_ts     = body.get("from_ts", now - 30 * 86400 * 1000)
    to_ts       = body.get("to_ts",   now)
    if to_ts - from_ts > max_range_ms:
        return jsonify({"error": "Date range exceeds 90 days"}), 400

    site_id     = body.get("site_id")
    meter_id    = body.get("meter_id")
    baseline_id = body.get("baseline_id")

    # Query meterdata
    q = sess.query(MeterData).filter(
        MeterData.recordedAt >= from_ts,
        MeterData.recordedAt <= to_ts,
    )
    if meter_id:
        q = q.filter(MeterData.meter == meter_id)
    else:
        meter_ids = _meter_ids_for_project(sess, project_id)
        if not meter_ids:
            return jsonify({"error": "No meters found for project"}), 404
        q = q.filter(MeterData.meter.in_(meter_ids))

    meterdata_rows = q.order_by(MeterData.recordedAt.asc()).all()
    if not meterdata_rows:
        return jsonify({"meta": {"meterdata_rows": 0, "computed": 0, "upserted": 0}, "response": {}}), 200

    buckets = compute_buckets(
        meterdata_rows,
        project_id=project_id,
        site_id=site_id,
        meter_id=meter_id,
        baseline_id=baseline_id,
    )

    # Phase 10 — enrich buckets with Digital Twin transformer context
    try:
        from app.services.digital_twin_service import enrich_cbi_buckets_with_dt
        enrich_cbi_buckets_with_dt(buckets, project_id)
    except Exception:
        pass   # DT enrichment is best-effort; never break CBI calculate

    now_ms = _now_ms()
    upserted = 0
    for b in buckets:
        existing = sess.query(CurrentBalanceMetrics).filter_by(
            project_id=b["project_id"],
            meter_id=b.get("meter_id"),
            bucket_ts=b["bucket_ts"],
        ).first()

        if existing:
            for k, v in b.items():
                if k not in ("project_id", "meter_id", "bucket_ts"):
                    setattr(existing, k, v)
            existing.updatedAt = now_ms
        else:
            row = CurrentBalanceMetrics(
                createdAt=now_ms,
                updatedAt=now_ms,
                **b,
            )
            sess.add(row)
        upserted += 1

    sess.commit()
    return jsonify({
        "meta": {
            "meterdata_rows": len(meterdata_rows),
            "computed":       len(buckets),
            "upserted":       upserted,
        },
        "response": {"status": "ok"},
    })


# ── 5. Baseline comparison ────────────────────────────────────────────────────

@current_balance_bp.route("/baseline-compare", methods=["GET"])
@login_required
def baseline_compare():
    """
    GET /api/current-balance/baseline-compare
        ?project_id=&[from_ts=]&[to_ts=]

    Compares the current period's CBI metrics against the project's locked
    Phase-6 baseline (baseline_master.status='locked' with the highest version).
    If no locked baseline exists, compares against the approved one.

    Returns: current_period summary + baseline_reference + delta fields.
    """
    project_id = request.args.get("project_id", type=int)
    if not project_id:
        return jsonify({"error": "project_id required"}), 400

    sess = get_session()
    if not _can_access_project(sess, project_id):
        return jsonify({"error": "Unauthorized"}), 403

    now = _now_ms()
    from_ts = request.args.get("from_ts", type=int, default=now - 30 * 86400 * 1000)
    to_ts   = request.args.get("to_ts",   type=int, default=now)

    # ── Fetch current period metrics ──────────────────────────────────────────
    current_rows = sess.query(CurrentBalanceMetrics).filter(
        CurrentBalanceMetrics.project_id == project_id,
        CurrentBalanceMetrics.bucket_ts  >= from_ts,
        CurrentBalanceMetrics.bucket_ts  <= to_ts,
    ).all()
    current_dicts = [_cbm_dict(r) for r in current_rows]
    current_summary = dashboard_summary(current_dicts)

    # ── Fetch reference baseline from Phase 6 ────────────────────────────────
    ref_baseline = None
    try:
        from app.models.baseline import Baseline
        ref = (
            sess.query(Baseline)
            .filter(
                Baseline.project_id == project_id,
                Baseline.status.in_(["locked", "approved"]),
            )
            .order_by(
                Baseline.status.desc(),  # "locked" > "approved" alphabetically
                Baseline.version.desc(),
            )
            .first()
        )
        if ref:
            ref_baseline = {
                "id":          ref.id,
                "version":     ref.version,
                "status":      ref.status,
                "test_type":   ref.test_type,
                "test_start":  ref.test_start,
                "test_end":    ref.test_end,
                "avg_kw":      ref.avg_kw,
                "avg_kvar":    ref.avg_kvar,
                "avg_pf":      ref.avg_pf,
                "avg_kva":     ref.avg_kva,
            }
    except Exception:
        pass  # baseline table may not exist yet

    # ── Fetch baseline-tagged metrics if baseline exists ──────────────────────
    baseline_summary = None
    if ref_baseline:
        baseline_rows = sess.query(CurrentBalanceMetrics).filter(
            CurrentBalanceMetrics.project_id  == project_id,
            CurrentBalanceMetrics.baseline_id == ref_baseline["id"],
        ).all()
        if baseline_rows:
            baseline_dicts   = [_cbm_dict(r) for r in baseline_rows]
            baseline_summary = dashboard_summary(baseline_dicts)

    # ── Compute deltas ────────────────────────────────────────────────────────
    delta = {}
    if baseline_summary and current_summary.get("avg_cbi_score") is not None and \
            baseline_summary.get("avg_cbi_score") is not None:
        for field in ("avg_cbi_score", "avg_harmonic_burden", "avg_reactive_burden",
                      "avg_imbalance", "avg_neutral_burden",
                      "avg_productive_pct", "avg_lost_cap_pct"):
            c_val = current_summary.get(field)
            b_val = baseline_summary.get(field)
            if c_val is not None and b_val is not None:
                delta[f"{field}_delta"] = round(c_val - b_val, 2)

    return jsonify({
        "meta":     {"project_id": project_id, "from_ts": from_ts, "to_ts": to_ts},
        "response": {
            "current":   current_summary,
            "baseline":  baseline_summary,
            "reference": ref_baseline,
            "delta":     delta,
        },
    })
