"""
Utility Intelligence™ Forecast Engine — Phase 10: uBillForecast™

Spec: ECBS OS v4 §18, §65–66, Figure A-10

Purpose
───────
Project future utility costs (next month / quarter / year) from:
  1. Trailing actual bills (utility_bills table) — trend baseline
  2. CBI metrics (current_balance_metrics) — improvement trend adjustment
  3. Project utility rates (kwhRate / kwRate) — rate projection
  4. Tariff lookup — rate-change impact if tariff is known

Forecasting Logic (uBillForecast™)
────────────────────────────────────
Step 1 — Trailing average (last N months of actual bills)
  avg_kwh     = mean(energy_kwh for trailing N bills)
  avg_kw      = mean(demand_kw  for trailing N bills)

Step 2 — Trend factor (month-over-month change in usage)
  If ≥6 bills: linear regression slope → project forward
  If 3–5 bills: compare first half vs second half average → simple trend pct
  If <3 bills:  no trend adjustment (confidence = "low")

Step 3 — ECBS improvement adjustment
  Read recent CBI avg_kw vs baseline.avg_kw → compute kW savings applied pct
  Apply reduction to the trended forecast (ensures savings are not double-counted)

Step 4 — Rate application
  forecast_energy_cost = forecast_kwh × energy_rate
  forecast_demand_cost = forecast_kw  × demand_rate
  forecast_taxes       = (energy + demand) × tax_rate
  forecast_fees        = avg(fees from bills) or 0
  forecast_total       = sum of above

Step 5 — Drivers of change
  Compare forecast vs trailing average on: usage trend, demand trend,
  rate changes (from tariff lookup), PF improvement (from CBI)

Confidence rating:
  high   — ≥12 months of actual bills, stable trend, known rates
  medium — 6–11 months, moderate trend, project rates used
  low    — <6 months or high variance in bills
"""
from __future__ import annotations

import logging
import math
import time as _time
from datetime import datetime, timedelta
from typing import Any

logger = logging.getLogger(__name__)

# ── Constants ─────────────────────────────────────────────────────────────────

TRAILING_MONTHS_DEFAULT = 12   # months of history to use for forecast baseline
MIN_BILLS_FOR_TREND     = 3    # minimum bills needed to compute a trend
DEFAULT_ENERGY_RATE     = 0.12
DEFAULT_DEMAND_RATE     = 9.0
DEFAULT_TAX_RATE        = 0.08  # 8% — project.taxRate fallback


# ── Internal helpers ──────────────────────────────────────────────────────────

def _safe(val, default: float = 0.0) -> float:
    try:
        v = float(val)
        return default if (math.isnan(v) or math.isinf(v) or v < 0) else v
    except (TypeError, ValueError):
        return default


def _month_offset(yyyy_mm: str, months: int) -> str:
    """Add `months` to a YYYY-MM string. Handles year rollover."""
    y, m = int(yyyy_mm[:4]), int(yyyy_mm[5:7])
    m += months
    while m > 12:
        m -= 12
        y += 1
    while m < 1:
        m += 12
        y -= 1
    return f"{y:04d}-{m:02d}"


def _current_yyyy_mm() -> str:
    return datetime.utcnow().strftime("%Y-%m")


def _linear_trend(values: list[float]) -> float:
    """
    Return the average month-over-month change (slope) via simple linear regression.
    Returns 0.0 if fewer than 2 values.
    """
    n = len(values)
    if n < 2:
        return 0.0
    xs = list(range(n))
    x_mean = sum(xs) / n
    y_mean = sum(values) / n
    num = sum((xs[i] - x_mean) * (values[i] - y_mean) for i in range(n))
    den = sum((xs[i] - x_mean) ** 2 for i in range(n))
    return num / den if den else 0.0


# ── Core forecast function ────────────────────────────────────────────────────

def compute_forecast(
    project_id: int,
    forecast_month: str | None = None,
    *,
    trailing_months: int = TRAILING_MONTHS_DEFAULT,
    energy_rate: float | None = None,
    demand_rate: float | None = None,
) -> dict[str, Any]:
    """
    Compute a uBillForecast™ for a single month.

    Args:
        project_id:     Project to forecast for.
        forecast_month: YYYY-MM to forecast. Defaults to next calendar month.
        trailing_months: How many past bills to use as the trend baseline.
        energy_rate:    $/kWh override. If None, uses project.kwhRate → tariff lookup.
        demand_rate:    $/kW/month override. If None, uses project.kwRate → tariff lookup.

    Returns:
        Dict matching UtilityForecast columns.
    """
    from app.models.project import Project
    from app.models.utility_bill import UtilityBill

    # ── 0. Setup ──────────────────────────────────────────────────────────────
    if not forecast_month:
        forecast_month = _month_offset(_current_yyyy_mm(), 1)

    project = Project.query.filter_by(id=project_id, isDeleted=False).first()
    if not project:
        raise ValueError(f"Project {project_id} not found")

    # Rate resolution
    e_rate = energy_rate or _safe(project.kwhRate) or None
    d_rate = demand_rate or _safe(project.kwRate) or None
    if not e_rate or not d_rate:
        e_rate, d_rate = _resolve_rates(project, e_rate, d_rate)
    tax_rate = _safe(project.taxRate) or DEFAULT_TAX_RATE

    # ── 1. Trailing bills ─────────────────────────────────────────────────────
    # Fetch last N months of actual bills (ordered oldest → newest)
    bills = (UtilityBill.query
             .filter_by(project_id=project_id, isDeleted=False)
             .filter(UtilityBill.bill_month < forecast_month)
             .order_by(UtilityBill.bill_month.desc())
             .limit(trailing_months)
             .all())
    bills = list(reversed(bills))   # oldest first for trend

    n_bills = len(bills)
    trailing_used = n_bills

    # Fallback: if no bills, seed from project.electricBillAnalysis if present
    if n_bills == 0:
        return _forecast_from_project_data(
            project, forecast_month, e_rate, d_rate, tax_rate
        )

    kwh_vals = [_safe(b.energy_kwh) for b in bills]
    kw_vals  = [_safe(b.demand_kw)  for b in bills]
    fee_vals = [_safe(b.fees or 0)  for b in bills]
    tax_vals = [_safe(b.taxes or 0) for b in bills]

    avg_kwh  = sum(kwh_vals) / n_bills if n_bills else 0.0
    avg_kw   = sum(kw_vals)  / n_bills if n_bills else 0.0
    avg_fees = sum(fee_vals) / n_bills if n_bills else 0.0
    avg_taxes= sum(tax_vals) / n_bills if n_bills else 0.0

    # ── 2. Trend factor ───────────────────────────────────────────────────────
    if n_bills >= MIN_BILLS_FOR_TREND:
        kwh_slope = _linear_trend(kwh_vals)
        kw_slope  = _linear_trend(kw_vals)
        # Project forward: forecast is avg + slope × (n_bills + 1)th position
        trend_kwh = avg_kwh + kwh_slope * (n_bills + 1 - (n_bills + 1) / 2)
        trend_kw  = avg_kw  + kw_slope  * (n_bills + 1 - (n_bills + 1) / 2)
        # Clamp: can't go below 0, can't exceed 150% of average (sanity cap)
        trend_kwh = max(0.0, min(trend_kwh, avg_kwh * 1.5))
        trend_kw  = max(0.0, min(trend_kw,  avg_kw  * 1.5))
        usage_trend_pct = ((trend_kwh - avg_kwh) / avg_kwh * 100) if avg_kwh else 0.0
    else:
        trend_kwh = avg_kwh
        trend_kw  = avg_kw
        usage_trend_pct = 0.0

    # ── 3. ECBS improvement adjustment ───────────────────────────────────────
    ecbs_kwh_reduction_pct, ecbs_kw_reduction_pct = _get_ecbs_improvements(project_id)
    forecast_kwh = trend_kwh * (1.0 - ecbs_kwh_reduction_pct / 100.0)
    forecast_kw  = trend_kw  * (1.0 - ecbs_kw_reduction_pct  / 100.0)

    # ── 4. Rate application ───────────────────────────────────────────────────
    forecast_energy_cost = forecast_kwh * e_rate
    forecast_demand_cost = forecast_kw  * d_rate
    subtotal             = forecast_energy_cost + forecast_demand_cost
    forecast_taxes       = subtotal * tax_rate
    forecast_fees        = avg_fees
    forecast_total       = subtotal + forecast_taxes + forecast_fees

    # ── 5. Prior year comparison ──────────────────────────────────────────────
    prior_year_month = _month_offset(forecast_month, -12)
    prior_bill = (UtilityBill.query
                  .filter_by(project_id=project_id, bill_month=prior_year_month, isDeleted=False)
                  .first())
    prior_year_total = _safe(prior_bill.total_cost) if prior_bill else None
    yoy_variance     = (forecast_total - prior_year_total) if prior_year_total else None
    yoy_variance_pct = ((yoy_variance / prior_year_total * 100) if prior_year_total else None)

    # ── 6. Drivers of change ──────────────────────────────────────────────────
    drivers = _build_drivers(
        usage_trend_pct=usage_trend_pct,
        ecbs_kwh_pct=ecbs_kwh_reduction_pct,
        ecbs_kw_pct=ecbs_kw_reduction_pct,
    )

    # ── 7. Confidence ─────────────────────────────────────────────────────────
    if n_bills >= 12:
        confidence = "high"
    elif n_bills >= 6:
        confidence = "medium"
    else:
        confidence = "low"

    now_ms = int(_time.time() * 1000)
    return {
        "project_id":            project_id,
        "forecast_month":        forecast_month,
        "forecast_energy_kwh":   round(forecast_kwh, 1),
        "forecast_demand_kw":    round(forecast_kw, 2),
        "forecast_energy_cost":  round(forecast_energy_cost, 2),
        "forecast_demand_cost":  round(forecast_demand_cost, 2),
        "forecast_taxes":        round(forecast_taxes, 2),
        "forecast_fees":         round(forecast_fees, 2),
        "forecast_total_cost":   round(forecast_total, 2),
        "yoy_variance":          round(yoy_variance, 2) if yoy_variance is not None else None,
        "yoy_variance_pct":      round(yoy_variance_pct, 1) if yoy_variance_pct is not None else None,
        "prior_year_total_cost": round(prior_year_total, 2) if prior_year_total is not None else None,
        "drivers_of_change":     drivers,
        "energy_rate":           e_rate,
        "demand_rate":           d_rate,
        "trailing_months_used":  trailing_used,
        "confidence":            confidence,
        "calculated_at":         now_ms,
    }


def compute_forecast_range(
    project_id: int,
    months_ahead: int = 12,
    **kwargs,
) -> list[dict[str, Any]]:
    """
    Compute forecasts for the next N months.
    Returns a list of forecast dicts ordered by forecast_month ascending.
    """
    base_month = _current_yyyy_mm()
    results = []
    for i in range(1, months_ahead + 1):
        target = _month_offset(base_month, i)
        try:
            snap = compute_forecast(project_id, target, **kwargs)
            results.append(snap)
        except Exception as exc:
            logger.warning("[ui_forecast] project=%d month=%s error: %s", project_id, target, exc)
    return results


# ── uBillTracker summary ──────────────────────────────────────────────────────

def tracker_summary(project_id: int, months: int = 12) -> dict[str, Any]:
    """
    uBillTracker™ summary — aggregate recent bills for the KPI cards.

    Returns:
        { total_cost_ytd, total_kwh_ytd, avg_demand_kw,
          avg_energy_rate, avg_demand_rate,
          vs_prior_period_pct, recent_bills: [...] }
    """
    from app.models.utility_bill import UtilityBill

    bills = (UtilityBill.query
             .filter_by(project_id=project_id, isDeleted=False)
             .order_by(UtilityBill.bill_month.desc())
             .limit(months)
             .all())

    if not bills:
        return {"error": "No utility bills entered yet"}

    def _mean(vals):
        clean = [v for v in vals if v is not None]
        return round(sum(clean) / len(clean), 4) if clean else None

    total_cost_ytd = sum(_safe(b.total_cost) for b in bills)
    total_kwh_ytd  = sum(_safe(b.energy_kwh) for b in bills)
    avg_demand_kw  = _mean([b.demand_kw for b in bills])

    # Effective rates — computed from bill data
    valid_e = [(b.energy_cost, b.energy_kwh) for b in bills
               if b.energy_cost and b.energy_kwh and b.energy_kwh > 0]
    avg_e_rate = round(
        sum(e / k for e, k in valid_e) / len(valid_e), 6
    ) if valid_e else None

    valid_d = [(b.demand_cost, b.demand_kw) for b in bills
               if b.demand_cost and b.demand_kw and b.demand_kw > 0]
    avg_d_rate = round(
        sum(d / k for d, k in valid_d) / len(valid_d), 4
    ) if valid_d else None

    # vs prior period (compare first half vs second half)
    n = len(bills)
    half = n // 2
    if n >= 4:
        recent_total = sum(_safe(b.total_cost) for b in bills[:half])
        prior_total  = sum(_safe(b.total_cost) for b in bills[half:])
        vs_prior_pct = round(
            (recent_total - prior_total) / prior_total * 100, 1
        ) if prior_total else None
    else:
        vs_prior_pct = None

    return {
        "total_cost_period":  round(total_cost_ytd, 2),
        "total_kwh_period":   round(total_kwh_ytd, 1),
        "avg_demand_kw":      avg_demand_kw,
        "avg_energy_rate":    avg_e_rate,
        "avg_demand_rate":    avg_d_rate,
        "vs_prior_period_pct": vs_prior_pct,
        "months_included":    n,
        "recent_bills":       [_bill_summary(b) for b in bills[:6]],
    }


# ── Helpers ───────────────────────────────────────────────────────────────────

def _bill_summary(bill) -> dict:
    return {
        "id":           bill.id,
        "bill_month":   bill.bill_month,
        "energy_kwh":   bill.energy_kwh,
        "demand_kw":    bill.demand_kw,
        "energy_cost":  bill.energy_cost,
        "demand_cost":  bill.demand_cost,
        "taxes":        bill.taxes,
        "fees":         bill.fees,
        "total_cost":   bill.total_cost,
        "power_factor": bill.power_factor,
        "is_paid":      bill.is_paid,
        "source":       bill.source,
    }


def _get_ecbs_improvements(project_id: int) -> tuple[float, float]:
    """
    Return (kwh_reduction_pct, kw_reduction_pct) from ECBS savings intelligence.
    These represent the percentage reductions already achieved, so we back them
    out of the usage forecast (savings not counted twice).
    Falls back to (0, 0) if no data.
    """
    try:
        from app.models.savings_intelligence import SavingsIntelligence
        latest = (SavingsIntelligence.query
                  .filter_by(project_id=project_id)
                  .order_by(SavingsIntelligence.bucket_ts.desc())
                  .first())
        if not latest:
            return 0.0, 0.0

        # kw_reduction as fraction of baseline_avg_kw
        if latest.baseline_avg_kw and latest.baseline_avg_kw > 0 and latest.kw_reduction:
            kw_pct  = min(float(latest.kw_reduction) / float(latest.baseline_avg_kw) * 100, 30.0)
            kwh_pct = kw_pct   # proportional
        else:
            kw_pct = kwh_pct = 0.0

        return round(kwh_pct, 2), round(kw_pct, 2)

    except Exception:
        return 0.0, 0.0


def _build_drivers(
    usage_trend_pct: float,
    ecbs_kwh_pct: float,
    ecbs_kw_pct: float,
) -> list[dict]:
    """Build the 'Drivers of Change' list for the forecast summary table."""
    drivers = []

    if abs(usage_trend_pct) >= 0.5:
        drivers.append({
            "label":      "Usage Trend",
            "impact_pct": round(usage_trend_pct, 1),
            "direction":  "increase" if usage_trend_pct > 0 else "decrease",
        })

    if ecbs_kwh_pct > 0.1:
        drivers.append({
            "label":      "ECBS Energy Reduction",
            "impact_pct": round(-ecbs_kwh_pct, 1),
            "direction":  "decrease",
        })

    if ecbs_kw_pct > 0.1:
        drivers.append({
            "label":      "ECBS Demand Reduction",
            "impact_pct": round(-ecbs_kw_pct, 1),
            "direction":  "decrease",
        })

    return drivers


def _forecast_from_project_data(
    project, forecast_month: str,
    e_rate: float, d_rate: float, tax_rate: float,
) -> dict:
    """
    Fallback forecast when no utility bills exist.
    Estimates from project.electricBillAnalysis JSON or project meter averages.
    """
    bill_data = getattr(project, "electricBillAnalysis", None) or {}
    if isinstance(bill_data, dict):
        kwh = _safe(bill_data.get("kwhUsage") or bill_data.get("annualKwh") or bill_data.get("kwh"))
        kw  = _safe(bill_data.get("demandKw") or bill_data.get("peakDemand") or bill_data.get("kw"))
        # annualKwh → monthly
        if kwh > 1000:
            kwh /= 12.0
    else:
        kwh = kw = 0.0

    if kwh <= 0:
        avg15 = _safe(getattr(project, "avg15MinuteKva", 0))
        kwh = avg15 * 4 * 24 * 30  # 15-min kVA intervals → monthly kWh approx
        kw  = avg15

    subtotal = kwh * e_rate + kw * d_rate
    taxes    = subtotal * tax_rate
    total    = subtotal + taxes

    return {
        "project_id":            project.id,
        "forecast_month":        forecast_month,
        "forecast_energy_kwh":   round(kwh, 1),
        "forecast_demand_kw":    round(kw, 2),
        "forecast_energy_cost":  round(kwh * e_rate, 2),
        "forecast_demand_cost":  round(kw * d_rate, 2),
        "forecast_taxes":        round(taxes, 2),
        "forecast_fees":         0.0,
        "forecast_total_cost":   round(total, 2),
        "yoy_variance":          None,
        "yoy_variance_pct":      None,
        "prior_year_total_cost": None,
        "drivers_of_change":     [],
        "energy_rate":           e_rate,
        "demand_rate":           d_rate,
        "trailing_months_used":  0,
        "confidence":            "low",
        "calculated_at":         int(_time.time() * 1000),
    }


def _resolve_rates(project, e_rate, d_rate) -> tuple[float, float]:
    try:
        from app.services.tariff_lookup_service import lookup_tariff_rates
        location = (getattr(project, "location", "") or "").strip()
        if location:
            result = lookup_tariff_rates("", "", state=location, country="USA", sector="Commercial")
            if result:
                e_rate = e_rate or result.get("energy_rate")
                d_rate = d_rate or result.get("demand_rate")
    except Exception:
        pass
    return e_rate or DEFAULT_ENERGY_RATE, d_rate or DEFAULT_DEMAND_RATE
