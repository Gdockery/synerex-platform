"""
SavingsIntelligence model — Phase 9: Savings Intelligence™

Spec: ECBS OS v4 §17, §64–65, Figure A-11, Appendix B-18

Purpose
───────
Financial proof-of-value. Converts engineering improvements (from Phases 6–8)
into dollar savings, ROI, payback, and sustainability metrics.

One row per (project_id, bucket_ts) representing a 15-minute or daily
savings snapshot. Computed by the savings_intelligence_engine from:
  - Phase 6 Baseline™ (locked baseline metrics)
  - Phase 7 CBI (current performance metrics)
  - Phase 8 Capacity Intelligence™ (deferred_capital_value → Capacity Value™)
  - Project utility rates (kwhRate, kwRate) + tariff lookup service

Table: savings_intelligence
DB schema per spec Appendix B-18.
"""
from app.extensions import db
from app.models.base import BaseModel


def savings_health_rating(roi: float | None) -> str:
    """Text label for ROI level."""
    if roi is None:
        return "Unknown"
    r = float(roi)
    if r >= 200:
        return "Excellent"
    if r >= 100:
        return "Good"
    if r >= 50:
        return "Fair"
    return "Poor"


class SavingsIntelligence(BaseModel):
    """
    One row per (project_id, bucket_ts) savings snapshot.

    All monetary values are in USD ($).
    All energy values are in kWh.
    All power values are in kW or kVA.
    bucket_ts is 15-minute aligned epoch-ms (matches current_balance_metrics).
    """
    __tablename__ = "savings_intelligence"

    project_id = db.Column(db.Integer, db.ForeignKey("project.id"),
                           nullable=False, index=True)
    site_id    = db.Column(db.Integer, db.ForeignKey("site.id"),
                           nullable=True, index=True)

    # Time bucket (15-min aligned epoch-ms, matches CBI and CI grids)
    bucket_ts  = db.Column(db.BigInteger, nullable=False, index=True)

    # ── 5 Savings Categories (spec §17) ──────────────────────────────────────
    # All values in $/year (annualized)

    # Energy Savings™ — kWh reduction × energy rate ($/kWh)
    energy_savings       = db.Column(db.Float, nullable=True)

    # Demand Savings™ — peak kW reduction × demand rate ($/kW/month × 12)
    demand_savings       = db.Column(db.Float, nullable=True)

    # Power Factor Savings™ — PF penalty avoided from PF improvement
    pf_savings           = db.Column(db.Float, nullable=True)

    # Capacity Value™ — recoverable kVA × $/kVA (Deferred Capital Value from Phase 8)
    capacity_value       = db.Column(db.Float, nullable=True)

    # Sustainability Value™ — CO₂ reduction × carbon credit price ($/tonne)
    sustainability_value = db.Column(db.Float, nullable=True)

    # ── Financial summary (spec B-18) ─────────────────────────────────────────
    # Annual savings = sum of the 5 categories above (normalized to $/year)
    annual_savings       = db.Column(db.Float, nullable=True, index=True)

    # ROI = annual_savings / project_cost × 100 (%)
    roi                  = db.Column(db.Float, nullable=True)

    # Payback = project_cost / annual_savings (years)
    payback              = db.Column(db.Float, nullable=True)

    # Lifetime savings = annual_savings × project_lifetime_years
    lifetime_savings     = db.Column(db.Float, nullable=True)

    # ── Supporting metrics ────────────────────────────────────────────────────
    # Physical deltas (baseline vs current) — stored for audit/waterfall chart
    kw_reduction         = db.Column(db.Float, nullable=True)   # kW saved
    kwh_per_year         = db.Column(db.Float, nullable=True)   # kWh/year saved
    peak_kw_reduction    = db.Column(db.Float, nullable=True)   # kW peak reduction
    pf_improvement       = db.Column(db.Float, nullable=True)   # ΔPF (0–1 scale)
    co2_reduction_tons   = db.Column(db.Float, nullable=True)   # tonnes CO₂/year

    # Recoverable capacity (from Phase 8) — underpins capacity_value
    recoverable_kva      = db.Column(db.Float, nullable=True)

    # ── Baseline reference ────────────────────────────────────────────────────
    # The locked baseline this savings record is computed against
    baseline_id          = db.Column(db.Integer, nullable=True, index=True)  # soft FK

    # Baseline snapshot values (captured at compute time for audit)
    baseline_avg_kw      = db.Column(db.Float, nullable=True)
    baseline_avg_kva     = db.Column(db.Float, nullable=True)
    baseline_avg_pf      = db.Column(db.Float, nullable=True)
    baseline_peak_kva    = db.Column(db.Float, nullable=True)

    # Current performance values (from CBI, captured at compute time)
    current_avg_kw       = db.Column(db.Float, nullable=True)
    current_avg_kva      = db.Column(db.Float, nullable=True)
    current_avg_pf       = db.Column(db.Float, nullable=True)

    # ── Rate inputs (stored for audit — rates can change over time) ───────────
    energy_rate          = db.Column(db.Float, nullable=True)   # $/kWh
    demand_rate          = db.Column(db.Float, nullable=True)   # $/kW/month
    carbon_credit_price  = db.Column(db.Float, nullable=True)   # $/tonne CO₂
    project_cost         = db.Column(db.Float, nullable=True)   # total installation $
    project_lifetime_yrs = db.Column(db.Integer, nullable=True) # assumed lifetime (default 10)

    # ── Calculation metadata ──────────────────────────────────────────────────
    sample_count         = db.Column(db.Integer, nullable=True)
    calculated_at        = db.Column(db.BigInteger, nullable=True)

    # ── Unique constraint ─────────────────────────────────────────────────────
    __table_args__ = (
        db.UniqueConstraint(
            "project_id", "site_id", "bucket_ts",
            name="uq_si_project_site_bucket",
        ),
    )
