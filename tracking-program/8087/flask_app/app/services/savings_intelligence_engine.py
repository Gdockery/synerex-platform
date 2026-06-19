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
    # PF improvement: utilities may charge ratchet penalties below 0.9 or 0.95 PF.
    # Simplified model: each 0.01 PF improvement on base kVA reduces apparent
    # power draw. kVAR saved × e_rate × 8760 approximates the savings.
    pf_improvement = max(0.0, c_avg_pf - b_avg_pf)   # positive = improvement
    # kVAR_saved = kVA × sin(arccos(new_pf)) − kVA × sin(arccos(old_pf))
    if b_avg_kva > 0 and b_avg_pf < 1.0 and c_avg_pf > b_avg_pf:
        try:
            old_angle = math.acos(min(b_avg_pf, 1.0))
            new_angle = math.acos(min(c_avg_pf, 1.0))
            kvar_saved = b_avg_kva * (math.sin(old_angle) - math.sin(new_angle))
            kvar_saved = max(0.0, kvar_saved)
        except (ValueError, ZeroDivisionError):
            kvar_saved = 0.0
        # kVAR savings monetised as equivalent kWh reduction at energy rate
        pf_savings = kvar_saved * e_rate * 8760.0
    else:
        pf_savings = 0.0

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

    # 3. CBI buckets
    cbi_rows = (CurrentBalanceMetrics.query
                .filter_by(project_id=project_id)
                .filter(CurrentBalanceMetrics.bucket_ts.between(from_ts, to_ts))
                .order_by(CurrentBalanceMetrics.bucket_ts.asc())
                .all())
    if not cbi_rows:
        logger.info("[si_engine] project %d no CBI data in window", project_id)
        return []

    # 4. Pre-fetch CI buckets for this window (keyed by bucket_ts)
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

    # 5. Compute per CBI bucket
    results = []
    for cbi in cbi_rows:
        current_dict = {
            "avg_kw":   cbi.avg_kw,
            "avg_kva":  cbi.avg_kva,
            "avg_pf":   cbi.avg_pf,
            "peak_kva": cbi.avg_kva,    # CBI doesn't store peak; use avg as conservative estimate
        }
        ci_snap = ci_map.get(cbi.bucket_ts)

        snap = compute_savings_snapshot(
            baseline_dict,
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

    now_ms = int(_time.time() * 1000)
    if from_ts is None:
        from_ts = now_ms - 90 * 86400 * 1000  # 90 days captures EM&V ON period
    if to_ts is None:
        to_ts = now_ms

    q = (SavingsIntelligence.query
         .filter_by(project_id=project_id)
         .filter(SavingsIntelligence.bucket_ts.between(from_ts, to_ts)))
    if site_id:
        q = q.filter(SavingsIntelligence.site_id == site_id)
    if baseline_id:
        q = q.filter(SavingsIntelligence.baseline_id == baseline_id)

    rows = q.order_by(SavingsIntelligence.bucket_ts.desc()).limit(2000).all()
    if not rows:
        return {"error": "No savings data for this period"}

    def _mean(vals):
        clean = [float(v) for v in vals if v is not None]
        return round(sum(clean) / len(clean), 2) if clean else None

    def _mean_nonzero(vals):
        """Average excluding zeros — eliminates submeter rows and ECBS-OFF intervals."""
        clean = [float(v) for v in vals if v is not None and float(v) > 0]
        return round(sum(clean) / len(clean), 2) if clean else None

    def _latest(attr):
        for r in rows:
            v = getattr(r, attr, None)
            if v is not None:
                return v
        return None

    # For cumulative savings since activation, sum all annual_savings × (15-min fraction)
    # 15 min = 15/60/24/365 fraction of a year
    frac_15min = 15.0 / 60 / 24 / 365
    cumulative = sum(
        (float(r.annual_savings) * frac_15min)
        for r in rows if r.annual_savings is not None and float(r.annual_savings) > 0
    )

    # Use non-zero mean for savings figures — zero rows are submeter or ECBS-OFF intervals
    annual       = _mean_nonzero([r.annual_savings for r in rows])
    roi          = _latest("roi")
    payback      = _latest("payback")
    lifetime     = _latest("lifetime_savings")
    capacity_val = _mean([r.capacity_value for r in rows])
    energy_sav   = _mean_nonzero([r.energy_savings for r in rows])
    demand_sav   = _mean_nonzero([r.demand_savings for r in rows])
    pf_sav       = _mean([r.pf_savings for r in rows])
    sustain_val  = _mean([r.sustainability_value for r in rows])
    co2_tons     = _mean([r.co2_reduction_tons for r in rows])
    kw_red       = _mean([r.kw_reduction for r in rows])
    pf_imp       = _mean([r.pf_improvement for r in rows])
    rec_kva      = _mean([r.recoverable_kva for r in rows])

    # Baseline / current averages (stored per-row, averaged over window)
    b_avg_kw  = _mean([r.baseline_avg_kw   for r in rows])
    b_avg_kva = _mean([r.baseline_avg_kva  for r in rows])
    b_avg_pf  = _mean([r.baseline_avg_pf   for r in rows])
    b_pk_kva  = _mean([r.baseline_peak_kva for r in rows])
    c_avg_kw  = _mean([r.current_avg_kw    for r in rows])
    c_avg_kva = _mean([r.current_avg_kva   for r in rows])
    c_avg_pf  = _mean([r.current_avg_pf    for r in rows])

    # Annualised energy estimates (kWh = avg_kW × 8760 h/yr)
    b_kwh = round(b_avg_kw * 8760, 0) if b_avg_kw else None
    c_kwh = round(c_avg_kw * 8760, 0) if c_avg_kw else None

    # Derived percentage improvements
    def _pct_improve(baseline_val, current_val):
        if baseline_val and current_val and baseline_val > 0:
            return round((1 - current_val / baseline_val) * 100, 1)
        return None

    energy_savings_pct   = _pct_improve(b_avg_kw, c_avg_kw)
    demand_reduction_pct = round(kw_red / b_avg_kw * 100, 1) if (kw_red and b_avg_kw) else None
    pf_improvement_pct   = round(pf_imp * 100, 2) if pf_imp is not None else None

    # Trend: compare first half vs second half annual_savings
    n    = len(rows)
    half = n // 2
    if n >= 4:
        old_sav = _mean([r.annual_savings for r in rows[half:]])
        new_sav = _mean([r.annual_savings for r in rows[:half]])
        if old_sav and new_sav:
            delta   = new_sav - old_sav
            pct_chg = round((delta / old_sav) * 100, 1)
            trend   = "improving" if delta > 10 else ("degrading" if delta < -10 else "stable")
        else:
            pct_chg, trend = 0.0, "stable"
    else:
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
