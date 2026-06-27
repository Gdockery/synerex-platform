"""
Savings Intelligence™ Engine — Phase 9

Spec: ECBS OS v4 §17, §64–65, Figure A-11, Appendix B-18

Purpose
───────
Convert engineering improvements (measured against a locked baseline) into
financial proof-of-value. Computes five savings categories plus ROI, payback,
lifetime savings, and sustainability metrics.

Five Savings Categories (spec §17)
────────────────────────────────────
1. Energy Savings™       — kWh reduction × energy rate ($/kWh)
2. Demand Savings™       — Peak kW reduction × demand rate ($/kW/month)
3. Power Factor Savings™ — PF penalty avoided from PF improvement
4. Capacity Value™       — Recoverable kVA → Deferred Capital Value (from Phase 8)
5. Sustainability Value™ — CO₂ reduction × carbon credit price

Data flow (downstream of Phases 6, 7, 8)
──────────────────────────────────────────
  Phase 6 Baseline™ (locked)
        ↓  baseline avg_kw, avg_kva, avg_pf, peak_kva
  Phase 7 CBI™ (current)
        ↓  current avg_kw, avg_kva, avg_pf from recent CBI buckets
  Phase 8 Capacity Intelligence™
        ↓  recoverable_capacity, deferred_capital_value → Capacity Value™
  Project utility rates
        ↓  project.kwhRate ($/kWh), project.kwRate ($/kW-demand)
               — with tariff lookup fallback for missing rates
  → savings_intelligence table

Engineering Formulas
────────────────────
  kw_reduction        = baseline_avg_kw   − current_avg_kw        (kW)
  kwh_per_year        = kw_reduction × 8760                        (kWh/yr)
  energy_savings      = kwh_per_year × energy_rate                 ($/yr)

  peak_kw_reduction   = baseline_peak_kva − current_peak_kva       (kW approx)
  demand_savings      = peak_kw_reduction × demand_rate × 12        ($/yr)

  pf_improvement      = current_avg_pf − baseline_avg_pf           (ΔPF, 0–1)
  # PF penalty: utilities charge ~1–3% per 0.01 PF below 0.95 target
  # Conservative: PF savings = improved kVAR × energy_rate × 8760
  pf_savings          = max(0, pf_improvement) × baseline_avg_kva × energy_rate × 8760

  capacity_value      = recoverable_kva × COST_PER_KVA             (one-time $, amortised)

  co2_reduction_tons  = kwh_per_year × EPA_GRID_FACTOR             (tonnes/yr)
  sustainability_value= co2_reduction_tons × carbon_credit_price    ($/yr)

  annual_savings      = energy + demand + pf + (capacity_value / lifetime_yrs) + sustainability
  roi                 = annual_savings / project_cost × 100         (%)
  payback             = project_cost / annual_savings               (yrs)
  lifetime_savings    = annual_savings × project_lifetime_yrs       ($)

Constants
─────────
  EPA_GRID_FACTOR     = 0.000386 tonne CO₂/kWh (2024 US national average grid emission factor)
  COST_PER_KVA        = 65.0 $/kVA (transformer/switchgear upgrade cost, conservative mid-range)
  DEFAULT_CARBON_PRICE= 15.0 $/tonne CO₂ (US voluntary carbon credit market reference)
  DEFAULT_LIFETIME_YRS= 10   years (ECBS device expected service life)
"""
from __future__ import annotations

import logging
import math
import time as _time
from typing import Any

logger = logging.getLogger(__name__)

# ── Engineering constants ─────────────────────────────────────────────────────

EPA_GRID_FACTOR      = 0.000386   # tonne CO₂/kWh — EPA 2024 US grid average
COST_PER_KVA         = 65.0       # $/kVA — avoided transformer/switchgear upgrade
DEFAULT_CARBON_PRICE = 15.0       # $/tonne CO₂ — US voluntary carbon credit market
DEFAULT_LIFETIME_YRS = 10         # assumed ECBS device service life
DEFAULT_ENERGY_RATE  = 0.12       # $/kWh — fallback if project.kwhRate is 0/null
DEFAULT_DEMAND_RATE  = 9.0        # $/kW/month — fallback if project.kwRate is 0/null


# ── Internal helpers ──────────────────────────────────────────────────────────

def _safe(val, default: float = 0.0) -> float:
    try:
        v = float(val)
        return default if (math.isnan(v) or math.isinf(v) or v < 0) else v
    except (TypeError, ValueError):
        return default


def _pos(val, default: float = 0.0) -> float:
    """Like _safe but clamps negatives to default."""
    return max(_safe(val, default), 0.0)


# ── Core formula ──────────────────────────────────────────────────────────────

def compute_savings_snapshot(
    baseline: dict[str, Any],
    current:  dict[str, Any],
    project:  dict[str, Any],
    *,
    capacity_intelligence: dict[str, Any] | None = None,
    energy_rate: float | None = None,
    demand_rate: float | None = None,
    carbon_credit_price: float = DEFAULT_CARBON_PRICE,
    project_lifetime_yrs: int = DEFAULT_LIFETIME_YRS,
    bucket_ts: int | None = None,
) -> dict[str, Any]:
    """
    Compute one Savings Intelligence™ snapshot.

    Args:
        baseline: Dict of baseline metrics (avg_kw, avg_kva, avg_pf, peak_kva, id, ...)
                  from a locked Baseline row.
        current:  Dict of current metrics (avg_kw, avg_kva, avg_pf, peak_kva)
                  from the most recent CBI bucket or meterdata aggregate.
        project:  Dict with project rate fields (kwhRate, kwRate, totalCost, location, ...).
        capacity_intelligence: Optional latest CapacityIntelligence snapshot dict.
                  Provides recoverable_capacity and deferred_capital_value.
        energy_rate: Override $/kWh rate. If None, uses project.kwhRate or tariff lookup.
        demand_rate: Override $/kW/month rate. If None, uses project.kwRate or tariff lookup.
        carbon_credit_price: $/tonne CO₂ for sustainability valuation.
        project_lifetime_yrs: Assumed device service life for lifetime savings.
        bucket_ts: 15-min aligned epoch-ms to stamp this snapshot.

    Returns:
        Dict matching SavingsIntelligence columns.
    """
    # ── Rate resolution ───────────────────────────────────────────────────────
    e_rate = energy_rate
    d_rate = demand_rate

    if e_rate is None:
        e_rate = _safe(project.get("kwhRate")) or DEFAULT_ENERGY_RATE
    if d_rate is None:
        d_rate = _safe(project.get("kwRate")) or DEFAULT_DEMAND_RATE

    project_cost = _safe(project.get("totalCost") or project.get("project_cost"))
    if project_cost <= 0:
        # Fallback: check proposalData for cost fields
        pd = project.get("proposalData") or {}
        if isinstance(pd, dict):
            for k in ("project_cost", "total_cost", "equipment_cost", "totalCost"):
                if pd.get(k):
                    project_cost = _safe(pd[k])
                    break

    # ── Baseline metrics ──────────────────────────────────────────────────────
    b_avg_kw   = _safe(baseline.get("avg_kw"))
    b_avg_kva  = _safe(baseline.get("avg_kva"))
    b_avg_pf   = _safe(baseline.get("avg_pf"))
    b_peak_kva = _safe(baseline.get("peak_kva"))
    baseline_id = baseline.get("id")

    # ── Current metrics ───────────────────────────────────────────────────────
    c_avg_kw   = _safe(current.get("avg_kw"))
    c_avg_kva  = _safe(current.get("avg_kva"))
    c_avg_pf   = _safe(current.get("avg_pf"))
    c_peak_kva = _safe(current.get("peak_kva") or current.get("peak_kw") or c_avg_kva)

    # ── 1. Energy Savings™ ────────────────────────────────────────────────────
    kw_reduction  = _pos(b_avg_kw - c_avg_kw)
    kwh_per_year  = kw_reduction * 8760.0
    energy_savings = kwh_per_year * e_rate

    # ── 2. Demand Savings™ ────────────────────────────────────────────────────
    peak_kw_reduction = _pos(b_peak_kva - c_peak_kva)
    demand_savings    = peak_kw_reduction * d_rate * 12.0   # 12 months

    # ── 3. Power Factor Savings™ ──────────────────────────────────────────────
    # PF ratchet penalty model: many utilities apply a demand penalty when PF < 0.90.
    # Common formula: billed_kW = measured_kW × (0.90 / actual_pf) when PF < 0.90.
    # Savings = avoided penalty on demand charges (12 months).
    # When current PF >= 0.90 and baseline PF was below 0.90, Synerex eliminated
    # the penalty. When both are above 0.90, no penalty savings apply.
    pf_improvement = max(0.0, c_avg_pf - b_avg_pf)   # positive = improvement
    pf_savings = 0.0
    PF_THRESHOLD = 0.90
    if b_avg_pf > 0 and c_avg_pf > b_avg_pf:
        # Only credit savings if baseline PF was below the penalty threshold
        if b_avg_pf < PF_THRESHOLD:
            # Baseline would have been billed at penalty_kw; current avoids it
            penalty_kw_baseline = c_avg_kw * (PF_THRESHOLD / b_avg_pf - 1.0)
            # Current may still have a residual penalty if c_avg_pf < threshold
            penalty_kw_current  = c_avg_kw * max(0.0, PF_THRESHOLD / max(c_avg_pf, 0.001) - 1.0) if c_avg_pf < PF_THRESHOLD else 0.0
            avoided_penalty_kw  = max(0.0, penalty_kw_baseline - penalty_kw_current)
            pf_savings = avoided_penalty_kw * d_rate * 12.0

    # ── 4. Capacity Value™ ────────────────────────────────────────────────────
    # = Deferred Capital Value™ from Phase 8 Capacity Intelligence.
    # If Phase 8 data is available, use it directly; otherwise estimate from kVA delta.
    recoverable_kva = 0.0
    if capacity_intelligence:
        recoverable_kva = _safe(capacity_intelligence.get("recoverable_capacity"))
        capacity_value  = _safe(
            capacity_intelligence.get("deferred_capital_value")
            or recoverable_kva * COST_PER_KVA
        )
    else:
        # Estimate from kVA delta: kVA freed × COST_PER_KVA
        kva_freed       = _pos(b_avg_kva - c_avg_kva)
        recoverable_kva = kva_freed
        capacity_value  = kva_freed * COST_PER_KVA

    # ── 5. Sustainability Value™ ──────────────────────────────────────────────
    co2_reduction_tons   = kwh_per_year * EPA_GRID_FACTOR
    sustainability_value = co2_reduction_tons * carbon_credit_price

    # ── Annual savings ────────────────────────────────────────────────────────
    # Capacity value is a one-time avoided cost — amortise over device lifetime
    capacity_value_annual = capacity_value / max(1, project_lifetime_yrs)

    annual_savings = (
        energy_savings
        + demand_savings
        + pf_savings
        + capacity_value_annual
        + sustainability_value
    )

    # ── ROI, Payback, Lifetime ────────────────────────────────────────────────
    roi              = (annual_savings / project_cost * 100.0) if project_cost > 0 else None
    payback          = (project_cost / annual_savings) if annual_savings > 0 and project_cost > 0 else None
    lifetime_savings = annual_savings * project_lifetime_yrs

    now_ms = int(_time.time() * 1000)

    return {
        # 5 savings categories
        "energy_savings":       round(energy_savings, 2),
        "demand_savings":       round(demand_savings, 2),
        "pf_savings":           round(pf_savings, 2),
        "capacity_value":       round(capacity_value, 2),
        "sustainability_value": round(sustainability_value, 2),
        # Financial summary
        "annual_savings":       round(annual_savings, 2),
        "roi":                  round(roi, 2) if roi is not None else None,
        "payback":              round(payback, 2) if payback is not None else None,
        "lifetime_savings":     round(lifetime_savings, 2),
        # Physical deltas (for waterfall chart)
        "kw_reduction":         round(kw_reduction, 3),
        "kwh_per_year":         round(kwh_per_year, 1),
        "peak_kw_reduction":    round(peak_kw_reduction, 3),
        "pf_improvement":       round(pf_improvement, 4),
        "co2_reduction_tons":   round(co2_reduction_tons, 2),
        "recoverable_kva":      round(recoverable_kva, 2),
        # Baseline snapshot
        "baseline_id":          baseline_id,
        "baseline_avg_kw":      round(b_avg_kw, 3),
        "baseline_avg_kva":     round(b_avg_kva, 3),
        "baseline_avg_pf":      round(b_avg_pf, 4),
        "baseline_peak_kva":    round(b_peak_kva, 3),
        # Current snapshot
        "current_avg_kw":       round(c_avg_kw, 3),
        "current_avg_kva":      round(c_avg_kva, 3),
        "current_avg_pf":       round(c_avg_pf, 4),
        # Rate audit trail
        "energy_rate":          e_rate,
        "demand_rate":          d_rate,
        "carbon_credit_price":  carbon_credit_price,
        "project_cost":         project_cost,
        "project_lifetime_yrs": project_lifetime_yrs,
        # Metadata
        "bucket_ts":            bucket_ts or now_ms,
        "calculated_at":        now_ms,
    }


# ── Batch computation ─────────────────────────────────────────────────────────

def compute_savings_for_project(
    project_id: int,
    *,
    baseline_id: int | None = None,
    from_ts: int | None = None,
    to_ts:   int | None = None,
    energy_rate: float | None = None,
    demand_rate: float | None = None,
) -> list[dict[str, Any]]:
    """
    Compute SavingsIntelligence records for a project.

    Steps:
      1. Load the project (for utility rates, totalCost, location).
      2. Find the locked baseline (baseline_id if given, else latest locked).
      3. Iterate CBI buckets in the requested time window.
      4. For each CBI bucket, look up the matching CI bucket (same bucket_ts).
      5. Call compute_savings_snapshot() and return the list.

    Returns:
        List of dicts ready to upsert into savings_intelligence.
        Empty list if no locked baseline or no CBI data in the window.
    """
    from app.models.project import Project
    from app.models.baseline import Baseline
    from app.models.current_balance_metrics import CurrentBalanceMetrics
    from app.models.capacity_intelligence import CapacityIntelligence

    now_ms = int(_time.time() * 1000)
    if from_ts is None:
        from_ts = now_ms - 30 * 86400 * 1000
    if to_ts is None:
        to_ts = now_ms

    # 1. Project
    project = Project.query.filter_by(id=project_id, isDeleted=False).first()
    if not project:
        logger.warning("[si_engine] project %d not found", project_id)
        return []
    project_dict = {
        "kwhRate":     project.kwhRate,
        "kwRate":      project.kwRate,
        "totalCost":   project.totalCost,
        "proposalData": project.proposalData,
        "location":    project.location,
    }

    # If rates are still missing, try tariff lookup by project location
    e_rate = energy_rate or _safe(project.kwhRate) or None
    d_rate = demand_rate or _safe(project.kwRate) or None
    if not e_rate or not d_rate:
        e_rate, d_rate = _resolve_rates_from_location(project, e_rate, d_rate)
    project_dict["kwhRate"] = e_rate
    project_dict["kwRate"]  = d_rate

    # 2. Locked baseline
    if baseline_id:
        baseline = Baseline.query.filter_by(id=baseline_id, project_id=project_id).first()
    else:
        baseline = (Baseline.query
                    .filter_by(project_id=project_id, status="locked")
                    .order_by(Baseline.version.desc())
                    .first())
    if not baseline:
        logger.info("[si_engine] project %d has no locked baseline — skipping", project_id)
        return []

    baseline_dict = {
        "id":        baseline.id,
        "avg_kw":    baseline.avg_kw,
        "avg_kva":   baseline.avg_kva,
        "avg_pf":    baseline.avg_pf,
        "peak_kva":  baseline.peak_kva,
    }
    # If baseline is missing avg_kw/avg_pf (e.g. pre-Phase 9), try linked EmvAnalysis
    if not baseline.avg_kw and baseline.emv_analysis_id:
        baseline_dict = _fill_baseline_from_emv(baseline_dict, baseline.emv_analysis_id)

    if not any(baseline_dict.get(k) for k in ("avg_kw", "avg_kva")):
        logger.info("[si_engine] project %d baseline %d missing metrics — skipping",
                    project_id, baseline.id)
        return []

    # 3. Identify isMain=1 meters for this project (savings computed from main meters only)
    from app.models.meter import Meter
    from sqlalchemy import text as _text
    main_meter_ids = [
        m.id for m in Meter.query.filter_by(project=project_id, isMain=True, isDeleted=False).all()
    ]
    if not main_meter_ids:
        logger.info("[si_engine] project %d has no isMain meters — skipping", project_id)
        return []
    logger.info("[si_engine] project %d main meters: %s", project_id, main_meter_ids)

    # 4. Load interval-normalized baselines (96 slots, from baseline_intervals table).
    #    Falls back to flat baseline_dict if not available.
    from app.extensions import db
    interval_baselines: dict[int, dict] = {}
    try:
        ibl_rows = db.session.execute(
            _text(
                "SELECT interval_num, avg_kw, avg_kva, avg_pf, avg_kvar, avg_thd, peak_kva "
                "FROM baseline_intervals WHERE project_id=:pid"
            ),
            {"pid": project_id},
        ).fetchall()
        for row in ibl_rows:
            interval_baselines[int(row[0])] = {
                "avg_kw":   float(row[1] or 0),
                "avg_kva":  float(row[2] or 0),
                "avg_pf":   float(row[3] or 0),
                "avg_kvar": float(row[4] or 0),
                "avg_thd":  float(row[5] or 0),
                "peak_kva": float(row[6] or 0),
            }
        if interval_baselines:
            logger.info("[si_engine] project %d loaded %d interval baselines", project_id, len(interval_baselines))
    except Exception as exc:
        logger.warning("[si_engine] could not load interval baselines: %s", exc)

    # Pre-compute monthly peak kVA from CBI for demand savings (current monthly peak vs baseline peak)
    # demand_savings = (baseline_peak - current_monthly_peak) * demand_rate per month
    try:
        monthly_peaks = db.session.execute(
            _text(
                "SELECT DATE_FORMAT(FROM_UNIXTIME(bucket_ts/1000),'%Y-%m') as mo, "
                "  MAX(avg_kva) as peak_kva "
                "FROM current_balance_metrics "
                "WHERE project_id=:pid AND meter_id IN :mids "
                "  AND bucket_ts BETWEEN :f AND :t "
                "GROUP BY mo"
            ),
            {"pid": project_id, "mids": tuple(main_meter_ids), "f": from_ts, "t": to_ts},
        ).fetchall()
        monthly_peak_map: dict[str, float] = {str(r[0]): float(r[1] or 0) for r in monthly_peaks}
    except Exception:
        monthly_peak_map = {}

    # 5. CBI buckets — restricted to isMain meters only
    cbi_rows = (CurrentBalanceMetrics.query
                .filter_by(project_id=project_id)
                .filter(CurrentBalanceMetrics.meter_id.in_(main_meter_ids))
                .filter(CurrentBalanceMetrics.bucket_ts.between(from_ts, to_ts))
                .order_by(CurrentBalanceMetrics.bucket_ts.asc())
                .all())
    if not cbi_rows:
        logger.info("[si_engine] project %d no CBI data for main meters in window", project_id)
        return []

    # 6. Pre-fetch CI buckets for this window (keyed by bucket_ts)
    ci_map: dict[int, dict] = {}
    ci_rows = (CapacityIntelligence.query
               .filter_by(project_id=project_id)
               .filter(CapacityIntelligence.bucket_ts.between(from_ts, to_ts))
               .all())
    for ci in ci_rows:
        ci_map[ci.bucket_ts] = {
            "recoverable_capacity":  ci.recoverable_capacity,
            "deferred_capital_value": ci.deferred_capital_value,
        }

    # 7. Compute per CBI bucket using interval-normalized baseline
    results = []
    for cbi in cbi_rows:
        # Interval number for this 15-min bucket (0=00:00, 95=23:45)
        slot = int((cbi.bucket_ts // 900000) % 96)

        # Use per-slot baseline if available, else flat baseline_dict.
        # avg_kw/avg_kva come from interval data (time-of-day normalized).
        # avg_pf uses baseline_master value (user-set 0.88) — the pre-install PF
        #   agreed on with the customer, not the measured May figure.
        # peak_kva uses baseline_master peak (monthly historical max, not slot max)
        #   so demand savings compares the same monthly peaks correctly.
        if interval_baselines:
            ibl = interval_baselines.get(slot, {})
            slot_baseline = {
                "id":       baseline_dict["id"],
                "avg_kw":   ibl.get("avg_kw") or baseline_dict.get("avg_kw") or 0,
                "avg_kva":  ibl.get("avg_kva") or baseline_dict.get("avg_kva") or 0,
                # PF: use baseline_master agreed value (e.g. 0.88) for penalty calc
                "avg_pf":   baseline_dict.get("avg_pf") or ibl.get("avg_pf") or 0,
                # Peak: use baseline_master monthly peak for demand comparison (not slot peak)
                "peak_kva": baseline_dict.get("peak_kva") or ibl.get("peak_kva") or 0,
            }
        else:
            slot_baseline = baseline_dict.copy()

        # Current monthly peak for proper demand savings calculation
        import datetime as _dt
        bucket_month = _dt.datetime.utcfromtimestamp(cbi.bucket_ts / 1000).strftime("%Y-%m")
        current_month_peak = monthly_peak_map.get(bucket_month, cbi.avg_kva or 0)

        current_dict = {
            "avg_kw":   cbi.avg_kw,
            "avg_kva":  cbi.avg_kva,
            "avg_pf":   cbi.avg_pf,
            "peak_kva": current_month_peak,  # actual monthly peak, not instantaneous avg
        }
        ci_snap = ci_map.get(cbi.bucket_ts)

        snap = compute_savings_snapshot(
            slot_baseline,
            current_dict,
            project_dict,
            capacity_intelligence=ci_snap,
            energy_rate=e_rate,
            demand_rate=d_rate,
            bucket_ts=cbi.bucket_ts,
        )
        snap["project_id"] = project_id
        snap["site_id"]    = getattr(cbi, "site_id", None)
        snap["sample_count"] = cbi.sample_count
        results.append(snap)

    logger.info(
        "[si_engine] project=%d baseline=%d window=%d→%d buckets=%d e_rate=%.4f d_rate=%.2f",
        project_id, baseline.id, from_ts, to_ts, len(results), e_rate or 0, d_rate or 0,
    )
    return results


# ── Dashboard summary ─────────────────────────────────────────────────────────

def dashboard_summary(project_id: int, site_id: int | None = None,
                      from_ts: int | None = None, to_ts: int | None = None,
                      baseline_id: int | None = None) -> dict:
    """
    Return aggregated KPIs for the Savings Intelligence dashboard.

    Aggregates rows from savings_intelligence for the requested window.
    Returns the financial proof-of-value numbers shown on Figure A-11.
    """
    from app.models.savings_intelligence import SavingsIntelligence
    from app.extensions import db
    from sqlalchemy import func

    now_ms = int(_time.time() * 1000)
    if from_ts is None:
        from_ts = now_ms - 90 * 86400 * 1000  # 90 days captures EM&V ON period
    if to_ts is None:
        to_ts = now_ms

    base_filter = [
        SavingsIntelligence.project_id == project_id,
        SavingsIntelligence.bucket_ts.between(from_ts, to_ts),
    ]
    if site_id:
        base_filter.append(SavingsIntelligence.site_id == site_id)
    if baseline_id:
        base_filter.append(SavingsIntelligence.baseline_id == baseline_id)

    # Use SQL aggregation for savings KPIs — avoids Python limit() cutting off ON-period rows.
    # Non-zero average: only count rows where the field > 0 (excludes submeter & ECBS-OFF rows).
    def _sql_avg_nonzero(col):
        val = (db.session.query(func.avg(col))
               .filter(*base_filter)
               .filter(col > 0)
               .scalar())
        return round(float(val), 2) if val is not None else None

    def _sql_avg(col):
        val = (db.session.query(func.avg(col))
               .filter(*base_filter)
               .scalar())
        return round(float(val), 2) if val is not None else None

    def _sql_sum_nonzero(col):
        val = (db.session.query(func.sum(col))
               .filter(*base_filter)
               .filter(col > 0)
               .scalar())
        return float(val) if val is not None else 0.0

    def _sql_count_nonzero(col):
        return (db.session.query(func.count(col))
                .filter(*base_filter)
                .filter(col > 0)
                .scalar()) or 0

    # Check if any rows exist at all
    total_rows = (db.session.query(func.count(SavingsIntelligence.id))
                  .filter(*base_filter)
                  .scalar()) or 0
    if total_rows == 0:
        return {"error": "No savings data for this period"}

    # "Latest" values: grab the most recent single row for scalar fields
    latest_row = (SavingsIntelligence.query
                  .filter(*base_filter)
                  .order_by(SavingsIntelligence.bucket_ts.desc())
                  .first())

    def _latest(attr):
        if latest_row is None:
            return None
        return getattr(latest_row, attr, None)

    # For cumulative savings: sum(annual_savings > 0) × 15-min fraction of a year
    frac_15min = 15.0 / 60 / 24 / 365
    cumulative = _sql_sum_nonzero(SavingsIntelligence.annual_savings) * frac_15min

    # Core KPIs — SQL-averaged over non-zero rows only
    annual      = _sql_avg_nonzero(SavingsIntelligence.annual_savings)
    energy_sav  = _sql_avg_nonzero(SavingsIntelligence.energy_savings)
    demand_sav  = _sql_avg_nonzero(SavingsIntelligence.demand_savings)
    pf_sav      = _sql_avg(SavingsIntelligence.pf_savings)
    capacity_val= _sql_avg(SavingsIntelligence.capacity_value)
    sustain_val = _sql_avg(SavingsIntelligence.sustainability_value)
    co2_tons    = _sql_avg(SavingsIntelligence.co2_reduction_tons)
    kw_red      = _sql_avg(SavingsIntelligence.kw_reduction)
    pf_imp      = _sql_avg(SavingsIntelligence.pf_improvement)
    rec_kva     = _sql_avg(SavingsIntelligence.recoverable_kva)

    # Baseline / current averages
    b_avg_kw  = _sql_avg(SavingsIntelligence.baseline_avg_kw)
    b_avg_kva = _sql_avg(SavingsIntelligence.baseline_avg_kva)
    b_avg_pf  = _sql_avg(SavingsIntelligence.baseline_avg_pf)
    b_pk_kva  = _sql_avg(SavingsIntelligence.baseline_peak_kva)
    c_avg_kw  = _sql_avg(SavingsIntelligence.current_avg_kw)
    c_avg_kva = _sql_avg(SavingsIntelligence.current_avg_kva)
    c_avg_pf  = _sql_avg(SavingsIntelligence.current_avg_pf)

    # Latest scalar fields for ROI, payback, lifetime (from most recent non-zero row)
    latest_nz = (SavingsIntelligence.query
                 .filter(*base_filter)
                 .filter(SavingsIntelligence.annual_savings > 0)
                 .order_by(SavingsIntelligence.bucket_ts.desc())
                 .first())
    roi      = getattr(latest_nz, "roi", None) if latest_nz else None
    payback  = getattr(latest_nz, "payback", None) if latest_nz else None
    lifetime = getattr(latest_nz, "lifetime_savings", None) if latest_nz else None

    n = total_rows

    # Annualised energy estimates
    b_kwh = round(b_avg_kw * 8760, 0) if b_avg_kw else None
    c_kwh = round(c_avg_kw * 8760, 0) if c_avg_kw else None

    def _pct_improve(baseline_val, current_val):
        if baseline_val and current_val and baseline_val > 0:
            return round((1 - current_val / baseline_val) * 100, 1)
        return None

    energy_savings_pct   = _pct_improve(b_avg_kw, c_avg_kw)
    demand_reduction_pct = round(kw_red / b_avg_kw * 100, 1) if (kw_red and b_avg_kw) else None
    pf_improvement_pct   = round(pf_imp * 100, 2) if pf_imp is not None else None

    pct_chg, trend = 0.0, "stable"

    from app.models.savings_intelligence import savings_health_rating
    return {
        # Primary KPIs (Figure A-11 dashboard widgets)
        "annual_savings":         annual,
        "lifetime_savings":       lifetime,
        "roi":                    roi,
        "payback":                payback,
        "cumulative_savings":     round(cumulative, 2),
        # 5 categories
        "energy_savings":         energy_sav,
        "demand_savings":         demand_sav,
        "pf_savings":             pf_sav,
        "capacity_value":         capacity_val,
        "sustainability_value":   sustain_val,
        # Physical improvements
        "kw_reduction":           kw_red,
        "co2_reduction_tons":     co2_tons,
        "pf_improvement":         pf_imp,
        "recoverable_kva":        rec_kva,
        # Rating
        "rating":                 savings_health_rating(roi),
        # Trend
        "trend_direction":        trend,
        "trend_pct_change":       pct_chg,
        "row_count":              n,
        # Baseline ref
        "baseline_id":            _latest("baseline_id"),
        "project_cost":           _latest("project_cost"),
        "energy_rate":            _latest("energy_rate"),
        "demand_rate":            _latest("demand_rate"),
        # Baseline vs current (averaged over window) — for comparison table
        "baseline_avg_kw":        b_avg_kw,
        "baseline_avg_kva":       b_avg_kva,
        "baseline_avg_pf":        b_avg_pf,
        "baseline_peak_kva":      b_pk_kva,
        "current_avg_kw":         c_avg_kw,
        "current_avg_kva":        c_avg_kva,
        "current_avg_pf":         c_avg_pf,
        "baseline_kwh_year":      b_kwh,
        "current_kwh_year":       c_kwh,
        "energy_savings_pct":     energy_savings_pct,
        "demand_reduction_pct":   demand_reduction_pct,
        "pf_improvement_pct":     pf_improvement_pct,
    }



# ── Rate resolution helpers ───────────────────────────────────────────────────

def _resolve_rates_from_location(project, e_rate, d_rate) -> tuple[float, float]:
    """
    Try tariff lookup service using project location as state hint.
    Falls back gracefully to defaults — never raises.
    """
    try:
        from app.services.tariff_lookup_service import lookup_tariff_rates

        location = (project.location or "").strip()
        if not location:
            return e_rate or DEFAULT_ENERGY_RATE, d_rate or DEFAULT_DEMAND_RATE

        result = lookup_tariff_rates(
            utility="",
            tariff="",
            state=location,
            country="USA",
            sector="Commercial",
        )
        if result and result.get("energy_rate"):
            e_rate = e_rate or float(result["energy_rate"])
        if result and result.get("demand_rate"):
            d_rate = d_rate or float(result["demand_rate"])
    except Exception as exc:
        logger.debug("[si_engine] tariff lookup failed: %s", exc)

    return e_rate or DEFAULT_ENERGY_RATE, d_rate or DEFAULT_DEMAND_RATE


def _fill_baseline_from_emv(baseline_dict: dict, emv_id: int) -> dict:
    """
    If the baseline lacks avg_kw/avg_kva/avg_pf, try pulling from the linked
    EmvAnalysis record and the project's current meter aggregate.
    Returns the dict with whatever was found.
    """
    try:
        from app.models.emv_analysis import EmvAnalysis
        emv = EmvAnalysis.query.get(emv_id)
        if emv and emv.kwh_savings and not baseline_dict.get("avg_kw"):
            # EmvAnalysis stores savings percentages, not absolute values.
            # We can't back-calculate avg_kw without the absolute meterdata.
            # Leave empty — the caller will skip this project.
            pass
    except Exception:
        pass
    return baseline_dict
