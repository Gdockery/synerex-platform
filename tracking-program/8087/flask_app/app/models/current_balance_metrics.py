"""
CurrentBalanceMetrics model — Phase 7: Current Balance Intelligence™

Stores pre-computed current classifications and CBI scores per project/site
and time bucket. Computed by current_balance_engine.py from meterdata rows.

Table: current_balance_metrics
"""
from app.extensions import db
from app.models.base import BaseModel


# CBI score thresholds per spec §53
CBI_RATINGS = {
    (90, 100): "Excellent",
    (80,  89): "Good",
    (70,  79): "Fair",
    (0,   69): "Poor",
}


def cbi_rating(score: float | None) -> str:
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


class CurrentBalanceMetrics(BaseModel):
    """
    One row per (project_id, site_id, bucket_ts) where bucket_ts is the
    start of a 15-minute interval (epoch-ms, aligned to the quarter-hour).

    All amp columns are in Amps (A), all _pct columns are 0.0-100.0.
    """
    __tablename__ = "current_balance_metrics"

    project_id  = db.Column(db.Integer, db.ForeignKey("project.id"), nullable=False, index=True)
    site_id     = db.Column(db.Integer, db.ForeignKey("site.id"),    nullable=True,  index=True)
    meter_id    = db.Column(db.Integer, db.ForeignKey("meter.id"),   nullable=True,  index=True)
    baseline_id = db.Column(db.Integer, nullable=True)   # soft ref to baseline_master.id

    # Time bucket (15-min aligned epoch-ms)
    bucket_ts   = db.Column(db.BigInteger, nullable=False, index=True)

    # Raw averages used for calculation
    avg_amp     = db.Column(db.Float, nullable=True)   # total RMS amps
    avg_pf      = db.Column(db.Float, nullable=True)   # weighted avg power factor
    avg_thd     = db.Column(db.Float, nullable=True)   # avg THDi %
    avg_kw      = db.Column(db.Float, nullable=True)
    avg_kvar    = db.Column(db.Float, nullable=True)
    avg_kva     = db.Column(db.Float, nullable=True)

    # Phase imbalance
    avg_l1_amp  = db.Column(db.Float, nullable=True)
    avg_l2_amp  = db.Column(db.Float, nullable=True)
    avg_l3_amp  = db.Column(db.Float, nullable=True)

    # ── Five current classifications (Amps) ──────────────────────────────────
    productive_amp  = db.Column(db.Float, nullable=True)   # Productive Current™
    reactive_amp    = db.Column(db.Float, nullable=True)   # Reactive Current™
    harmonic_amp    = db.Column(db.Float, nullable=True)   # Harmonic Current™
    imbalance_amp   = db.Column(db.Float, nullable=True)   # Imbalance Current™
    neutral_amp     = db.Column(db.Float, nullable=True)   # Neutral Current™  (estimated)
    lost_cap_amp    = db.Column(db.Float, nullable=True)   # Lost Capacity Current™

    # ── Burden percentages (0–100 scale) ─────────────────────────────────────
    harmonic_burden_pct  = db.Column(db.Float, nullable=True)
    reactive_burden_pct  = db.Column(db.Float, nullable=True)
    imbalance_pct        = db.Column(db.Float, nullable=True)
    neutral_burden_pct   = db.Column(db.Float, nullable=True)

    # ── Current Balance Index™ (0–100) ────────────────────────────────────────
    cbi_score = db.Column(db.Float, nullable=True, index=True)

    # ── Calculation metadata ──────────────────────────────────────────────────
    sample_count    = db.Column(db.Integer, nullable=True)   # meterdata rows averaged
    calculated_at   = db.Column(db.BigInteger, nullable=True)

    # ── Digital Twin context (Phase 10 — DT → CBI integration) ───────────────
    # Pulled from approved/locked DigitalTwin asset graph at calculation time.
    # NULL when no approved twin exists for the project.
    transformer_kva         = db.Column(db.Float, nullable=True)   # rated kVA from DT
    capacity_utilization_pct = db.Column(db.Float, nullable=True)  # avg_kva / transformer_kva × 100

    # ── Unique constraint: one row per meter/project/bucket ───────────────────
    __table_args__ = (
        db.UniqueConstraint(
            "project_id", "meter_id", "bucket_ts",
            name="uq_cbm_project_meter_bucket",
        ),
    )
