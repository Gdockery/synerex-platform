"""
CapacityIntelligence model — Phase 8: Capacity Intelligence™

Spec: ECBS OS v4 §16, §54, §55, §57, Appendix B-17

One row per (project_id, site_id, bucket_ts) representing a 15-minute
capacity snapshot. Computed by the capacity_intelligence_engine from:
  - Digital Twin™ installed capacity (transformer rated kVA)
  - Current Balance Intelligence™ (CBI) lost capacity current → hidden kVA
  - meterdata avg_kva → used capacity

Table: capacity_intelligence
"""
from app.extensions import db
from app.models.base import BaseModel


# Capacity Health Score thresholds (matches CBI rating scale convention)
def capacity_health_rating(score: float | None) -> str:
    if score is None:
        return "Unknown"
    s = float(score)
    if s >= 90:
        return "Excellent"
    if s >= 80:
        return "Good"
    if s >= 70:
        return "Fair"
    return "Poor"


class CapacityIntelligence(BaseModel):
    """
    One row per (project_id, site_id, bucket_ts).

    All capacity values are in kVA (apparent power).
    bucket_ts is 15-minute aligned epoch-ms (same grid as current_balance_metrics).
    """
    __tablename__ = "capacity_intelligence"

    project_id = db.Column(db.Integer, db.ForeignKey("project.id"),
                           nullable=False, index=True)
    site_id    = db.Column(db.Integer, db.ForeignKey("site.id"),
                           nullable=True, index=True)

    # Time bucket (15-min aligned epoch-ms, same as current_balance_metrics)
    bucket_ts  = db.Column(db.BigInteger, nullable=False, index=True)

    # ── 5 Capacity Categories (spec §54) ─────────────────────────────────────
    # All values in kVA

    # Installed Capacity — total nameplate from Digital Twin (transformer rated kVA)
    installed_capacity   = db.Column(db.Float, nullable=True)

    # Used Capacity — current operational load (avg_kva from meterdata)
    used_capacity        = db.Column(db.Float, nullable=True)

    # Available Capacity — installed - used (free headroom)
    available_capacity   = db.Column(db.Float, nullable=True)

    # Hidden Capacity™ — capacity occupied by harmonics, reactive, imbalance,
    # neutral current. Derived from CBI lost_cap_amp → kVA conversion.
    hidden_capacity      = db.Column(db.Float, nullable=True)

    # Recoverable Capacity™ — portion of hidden capacity recoverable through
    # ECBS device installation (harmonic + reactive portions are recoverable)
    recoverable_capacity = db.Column(db.Float, nullable=True)

    # ── Deferred Capital Value™ (spec §57) ────────────────────────────────────
    # Dollar estimate of avoided transformer/switchgear/utility upgrades.
    # recoverable_kva × cost_per_kva_of_new_capacity
    deferred_capital_value = db.Column(db.Float, nullable=True)

    # ── Capacity Health Score™ (spec §16, scale 0–100) ────────────────────────
    capacity_health_score  = db.Column(db.Float, nullable=True, index=True)

    # ── Utilization metrics (derived, stored for fast querying) ──────────────
    utilization_pct        = db.Column(db.Float, nullable=True)   # used / installed × 100
    hidden_pct             = db.Column(db.Float, nullable=True)   # hidden / installed × 100
    recoverable_pct        = db.Column(db.Float, nullable=True)   # recoverable / installed × 100

    # ── Source references ─────────────────────────────────────────────────────
    # Cross-reference to the CBI bucket this was derived from
    cbi_bucket_ts          = db.Column(db.BigInteger, nullable=True)
    baseline_id            = db.Column(db.Integer, nullable=True)   # soft ref

    # Transformer data source (from Digital Twin)
    transformer_kva_source = db.Column(db.Float, nullable=True)   # same as installed_capacity
    voltage_level          = db.Column(db.Float, nullable=True)   # V (secondary, for kVA conversion)

    # ── Calculation metadata ──────────────────────────────────────────────────
    sample_count           = db.Column(db.Integer, nullable=True)
    calculated_at          = db.Column(db.BigInteger, nullable=True)

    # ── Unique constraint ─────────────────────────────────────────────────────
    __table_args__ = (
        db.UniqueConstraint(
            "project_id", "site_id", "bucket_ts",
            name="uq_ci_project_site_bucket",
        ),
    )
