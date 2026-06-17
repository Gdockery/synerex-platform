"""
Capacity Intelligence™ Engine — Phase 8

Spec: ECBS OS v4 §16, §54-57, Appendix B-17, Figure A-4

Purpose
───────
Identify hidden and recoverable electrical capacity at site/asset level.
Bridges Phase 7 (CBI) output and Digital Twin™ installed ratings to produce
the five Capacity Intelligence categories and supporting metrics.

Five Capacity Categories (spec §54)
────────────────────────────────────
1. Installed Capacity   — Total nameplate infrastructure (Digital Twin rated kVA)
2. Used Capacity        — Current operational load (avg_kva from meterdata)
3. Available Capacity   — Installed − Used (free headroom)
4. Hidden Capacity™     — Capacity occupied by harmonics + reactive + imbalance
                          + neutral current (lost_cap_amp → kVA)
5. Recoverable Capacity™ — Portion of hidden capacity that ECBS devices can
                           recover (harmonic + reactive are recoverable; pure
                           imbalance/neutral typically require load redistribution)

Deferred Capital Value™ (spec §57)
───────────────────────────────────
Recoverable kVA × cost-per-kVA of avoided infrastructure upgrades.
Default cost: $65/kVA (conservative mid-range for transformer/switchgear upgrades).

Capacity Health Score™ (spec §16, 0–100)
─────────────────────────────────────────
100 = healthy (low utilization, minimal hidden capacity)
0   = critical (overloaded or all capacity is hidden/lost)

Formula:
  utilization_penalty = (used / installed × 100) × 0.50   # 50% weight
  hidden_penalty      = (hidden / installed × 100) × 0.50  # 50% weight
  raw_penalty         = utilization_penalty + hidden_penalty   (capped 0-100)
  health_score        = max(0, 100 - raw_penalty)

Engineering Logic (spec §146)
──────────────────────────────
Hidden Capacity is identified by measuring the impact of non-productive
current types on transformer apparent power capacity. The CBI engine already
computes these as burden percentages of total current; we reframe them as kVA.

  hidden_kva = used_kva × (harmonic_burden_pct + reactive_burden_pct
                           + imbalance_pct + neutral_burden_pct) / 100
  # capped so hidden ≤ used (cannot hide more than you use)

  recoverable_kva = harmonic_kva + reactive_kva
  # (imbalance and neutral require load redistribution, not ECBS devices)
"""
from __future__ import annotations

import math
import logging
import time as _time
from typing import Any

logger = logging.getLogger(__name__)

# ── Engineering constants ─────────────────────────────────────────────────────

# Recovery factor: what fraction of hidden kVA is recoverable via ECBS devices.
# ECBS devices address harmonics (APF) and reactive (power factor correction).
# Imbalance/neutral require load redistribution — not hardware we install.
# Empirically: APF recovers ~90% of harmonic burden, ~85% of reactive burden.
HARMONIC_RECOVERY_FACTOR  = 0.90
REACTIVE_RECOVERY_FACTOR  = 0.85

# Cost per kVA for avoided infrastructure upgrades.
# Sources: transformer replacement ~$40–80/kVA, switchgear ~$50–100/kVA.
# We use a conservative $65/kVA as default (caller can override).
DEFAULT_COST_PER_KVA = 65.0   # $/kVA

# Assumed secondary voltage for kVA→Amp conversion when voltage not available
DEFAULT_SECONDARY_VOLTAGE = 480.0  # V (most common US commercial)


# ── Internal helpers ──────────────────────────────────────────────────────────

def _safe(val, default: float = 0.0) -> float:
    try:
        v = float(val)
        return default if (math.isnan(v) or math.isinf(v)) else v
    except (TypeError, ValueError):
        return default


def _clamp(v: float, lo: float = 0.0, hi: float = float("inf")) -> float:
    return max(lo, min(hi, v))


def _pct(part: float, total: float) -> float:
    """part/total × 100, safe for zero total, clamped 0–100."""
    if total <= 0:
        return 0.0
    return _clamp((part / total) * 100.0, 0.0, 100.0)


# ── Core classification ───────────────────────────────────────────────────────

def compute_capacity_snapshot(
    installed_kva: float | None,
    cbi_row: dict[str, Any],
    *,
    cost_per_kva: float = DEFAULT_COST_PER_KVA,
    secondary_voltage: float = DEFAULT_SECONDARY_VOLTAGE,
) -> dict[str, Any]:
    """
    Compute one capacity snapshot from a CBI metrics row and the installed kVA.

    Args:
        installed_kva:    Transformer rated kVA from the Digital Twin (or None if
                          no approved twin exists — capacity metrics are still
                          computed but utilization ratios are omitted).
        cbi_row:          A dict with CBI engine output columns, specifically:
                            avg_kva, avg_amp,
                            harmonic_burden_pct, reactive_burden_pct,
                            imbalance_pct, neutral_burden_pct,
                            lost_cap_amp, sample_count, bucket_ts
        cost_per_kva:     $/kVA for Deferred Capital Value™ calculation.
        secondary_voltage: Transformer secondary voltage (V) for amp→kVA conversion
                           fallback when avg_kva is missing.

    Returns:
        Dict matching CapacityIntelligence columns (no id/project_id/timestamps).
    """
    used_kva = _safe(cbi_row.get("avg_kva"))

    # If avg_kva is missing but we have avg_amp, estimate from voltage
    if used_kva <= 0 and _safe(cbi_row.get("avg_amp")) > 0:
        avg_amp = _safe(cbi_row.get("avg_amp"))
        used_kva = (avg_amp * secondary_voltage * math.sqrt(3)) / 1000.0

    # ── Installed Capacity ────────────────────────────────────────────────────
    inst = _safe(installed_kva) if installed_kva is not None else None

    # ── Available Capacity ────────────────────────────────────────────────────
    available = (inst - used_kva) if inst is not None else None
    if available is not None:
        available = max(0.0, available)  # can't go negative

    # ── Hidden Capacity™ ─────────────────────────────────────────────────────
    # Sum of all non-productive burden percentages, applied to used kVA.
    harm_pct  = _safe(cbi_row.get("harmonic_burden_pct"))
    react_pct = _safe(cbi_row.get("reactive_burden_pct"))
    imb_pct   = _safe(cbi_row.get("imbalance_pct"))
    neut_pct  = _safe(cbi_row.get("neutral_burden_pct"))

    total_burden_pct = _clamp(harm_pct + react_pct + imb_pct + neut_pct, 0.0, 100.0)
    hidden_kva = used_kva * (total_burden_pct / 100.0)

    # Break out component kVA values for recoverable calculation
    harm_kva  = used_kva * (harm_pct  / 100.0)
    react_kva = used_kva * (react_pct / 100.0)

    # ── Recoverable Capacity™ ─────────────────────────────────────────────────
    # ECBS devices (APF, line filters) address harmonics and reactive.
    # Imbalance and neutral require load redistribution, not hardware.
    recoverable_kva = (
        harm_kva  * HARMONIC_RECOVERY_FACTOR +
        react_kva * REACTIVE_RECOVERY_FACTOR
    )
    recoverable_kva = _clamp(recoverable_kva, 0.0, hidden_kva)

    # ── Deferred Capital Value™ ───────────────────────────────────────────────
    deferred_capital = recoverable_kva * cost_per_kva

    # ── Utilization ratios ────────────────────────────────────────────────────
    utilization_pct  = _pct(used_kva,       inst) if inst else None
    hidden_pct       = _pct(hidden_kva,     inst) if inst else _pct(hidden_kva, used_kva)
    recoverable_pct  = _pct(recoverable_kva, inst) if inst else _pct(recoverable_kva, used_kva)

    # ── Capacity Health Score™ ────────────────────────────────────────────────
    # Penalises high utilization AND high hidden capacity equally.
    if inst and inst > 0:
        util_penalty   = _pct(used_kva,   inst) * 0.50
        hidden_penalty = _pct(hidden_kva, inst) * 0.50
        health_score   = _clamp(100.0 - util_penalty - hidden_penalty, 0.0, 100.0)
    else:
        # Without installed capacity reference, score from hidden burden only
        burden_penalty = total_burden_pct * 0.80  # 80% weight on burden when no DT data
        health_score   = _clamp(100.0 - burden_penalty, 0.0, 100.0)

    return {
        # 5 categories
        "installed_capacity":    round(inst, 2) if inst is not None else None,
        "used_capacity":         round(used_kva, 2),
        "available_capacity":    round(available, 2) if available is not None else None,
        "hidden_capacity":       round(hidden_kva, 2),
        "recoverable_capacity":  round(recoverable_kva, 2),
        # Deferred capital
        "deferred_capital_value": round(deferred_capital, 2),
        # Health score
        "capacity_health_score": round(health_score, 2),
        # Utilization ratios
        "utilization_pct":       round(utilization_pct, 2) if utilization_pct is not None else None,
        "hidden_pct":            round(hidden_pct, 2) if hidden_pct is not None else None,
        "recoverable_pct":       round(recoverable_pct, 2) if recoverable_pct is not None else None,
        # Source refs
        "transformer_kva_source": round(inst, 2) if inst is not None else None,
        "voltage_level":          secondary_voltage,
        "cbi_bucket_ts":          cbi_row.get("bucket_ts"),
        "sample_count":           cbi_row.get("sample_count"),
        "calculated_at":          int(_time.time() * 1000),
    }


# ── Batch computation from CBI metrics ───────────────────────────────────────

def compute_capacity_from_cbi_metrics(
    project_id: int,
    site_id: int | None = None,
    from_ts: int | None = None,
    to_ts: int | None = None,
    baseline_id: int | None = None,
    cost_per_kva: float = DEFAULT_COST_PER_KVA,
) -> list[dict[str, Any]]:
    """
    Compute CapacityIntelligence records for a project from its existing
    CBI metrics (current_balance_metrics table).

    Phase 8 is downstream of Phase 7 — it reads already-computed CBI buckets
    and adds the capacity layer on top using the Digital Twin installed kVA.

    Args:
        project_id:   Project to compute for.
        site_id:      Optional site filter.
        from_ts:      Epoch-ms start (default: last 30 days).
        to_ts:        Epoch-ms end (default: now).
        baseline_id:  Optional baseline to tag results against.
        cost_per_kva: $/kVA for deferred capital calculation.

    Returns:
        List of dicts ready to upsert into capacity_intelligence table.
    """
    from app.models.current_balance_metrics import CurrentBalanceMetrics
    from app.services.digital_twin_service import get_transformer_kva

    now_ms = int(_time.time() * 1000)
    if from_ts is None:
        from_ts = now_ms - 30 * 86400 * 1000
    if to_ts is None:
        to_ts = now_ms

    # Get installed capacity from approved Digital Twin
    installed_kva = get_transformer_kva(project_id)

    # Infer secondary voltage from Digital Twin if possible
    secondary_voltage = _get_secondary_voltage(project_id)

    # Query CBI buckets for the requested window
    q = (CurrentBalanceMetrics.query
         .filter_by(project_id=project_id)
         .filter(
             CurrentBalanceMetrics.bucket_ts >= from_ts,
             CurrentBalanceMetrics.bucket_ts <= to_ts,
         )
         .order_by(CurrentBalanceMetrics.bucket_ts.asc()))

    if site_id:
        q = q.filter(CurrentBalanceMetrics.site_id == site_id)

    cbi_rows = q.all()
    if not cbi_rows:
        return []

    results = []
    for row in cbi_rows:
        cbi_dict = {
            "avg_kva":              row.avg_kva,
            "avg_amp":              row.avg_amp,
            "harmonic_burden_pct":  row.harmonic_burden_pct,
            "reactive_burden_pct":  row.reactive_burden_pct,
            "imbalance_pct":        row.imbalance_pct,
            "neutral_burden_pct":   row.neutral_burden_pct,
            "lost_cap_amp":         row.lost_cap_amp,
            "sample_count":         row.sample_count,
            "bucket_ts":            row.bucket_ts,
        }
        snap = compute_capacity_snapshot(
            installed_kva,
            cbi_dict,
            cost_per_kva=cost_per_kva,
            secondary_voltage=secondary_voltage,
        )
        snap["project_id"]  = project_id
        snap["site_id"]     = site_id or getattr(row, "site_id", None)
        snap["bucket_ts"]   = row.bucket_ts
        snap["baseline_id"] = baseline_id
        results.append(snap)

    logger.info(
        "[ci_engine] project=%d from=%d to=%d installed_kva=%s buckets=%d",
        project_id, from_ts, to_ts, installed_kva, len(results),
    )
    return results


# ── Dashboard summary aggregation ─────────────────────────────────────────────

def dashboard_summary(project_id: int, site_id: int | None = None,
                      from_ts: int | None = None, to_ts: int | None = None) -> dict:
    """
    Return a summary dict for the Capacity Intelligence dashboard KPIs.
    Aggregates the most recent capacity_intelligence rows for the project.

    Returns:
        {
          installed_capacity, used_capacity, available_capacity,
          hidden_capacity, recoverable_capacity, deferred_capital_value,
          capacity_health_score, utilization_pct, hidden_pct,
          recoverable_pct, rating, row_count,
          trend_direction  # "improving" | "stable" | "degrading"
        }
    """
    from app.models.capacity_intelligence import CapacityIntelligence, capacity_health_rating

    now_ms = int(_time.time() * 1000)
    if from_ts is None:
        from_ts = now_ms - 30 * 86400 * 1000
    if to_ts is None:
        to_ts = now_ms

    q = (CapacityIntelligence.query
         .filter_by(project_id=project_id)
         .filter(
             CapacityIntelligence.bucket_ts >= from_ts,
             CapacityIntelligence.bucket_ts <= to_ts,
         ))
    if site_id:
        q = q.filter(CapacityIntelligence.site_id == site_id)

    rows = q.order_by(CapacityIntelligence.bucket_ts.desc()).limit(2000).all()
    if not rows:
        return {"error": "No capacity data for this period"}

    def _mean(vals):
        clean = [v for v in vals if v is not None]
        return round(sum(clean) / len(clean), 2) if clean else None

    def _latest(attr):
        for r in rows:  # rows are desc-sorted
            v = getattr(r, attr, None)
            if v is not None:
                return v
        return None

    installed  = _latest("installed_capacity")
    used       = _mean([r.used_capacity for r in rows])
    available  = (installed - used) if (installed and used) else None
    hidden     = _mean([r.hidden_capacity for r in rows])
    recoverable = _mean([r.recoverable_capacity for r in rows])
    deferred   = _mean([r.deferred_capital_value for r in rows])
    health     = _mean([r.capacity_health_score for r in rows])
    util_pct   = _mean([r.utilization_pct for r in rows])
    hidden_pct = _mean([r.hidden_pct for r in rows])
    rec_pct    = _mean([r.recoverable_pct for r in rows])

    # Trend: compare first half vs second half health scores
    n = len(rows)
    if n >= 4:
        half = n // 2
        old_health = _mean([r.capacity_health_score for r in rows[half:]])
        new_health = _mean([r.capacity_health_score for r in rows[:half]])
        if old_health and new_health:
            delta = new_health - old_health
            trend = "improving" if delta > 2 else ("degrading" if delta < -2 else "stable")
        else:
            trend = "stable"
    else:
        trend = "stable"

    return {
        "installed_capacity":    installed,
        "used_capacity":         used,
        "available_capacity":    round(available, 2) if available is not None else None,
        "hidden_capacity":       hidden,
        "recoverable_capacity":  recoverable,
        "deferred_capital_value": deferred,
        "capacity_health_score": health,
        "utilization_pct":       util_pct,
        "hidden_pct":            hidden_pct,
        "recoverable_pct":       rec_pct,
        "rating":                capacity_health_rating(health),
        "row_count":             n,
        "trend_direction":       trend,
    }


# ── Helper: secondary voltage from Digital Twin ───────────────────────────────

def _get_secondary_voltage(project_id: int) -> float:
    """
    Look up the transformer secondary (output) voltage from the approved Digital
    Twin asset graph. Falls back to DEFAULT_SECONDARY_VOLTAGE (480V) if not found.
    """
    try:
        from app.services.digital_twin_service import get_approved_twin, get_latest_twin_snapshot
        twin = get_approved_twin(project_id)
        if not twin:
            return DEFAULT_SECONDARY_VOLTAGE
        snapshot = get_latest_twin_snapshot(twin)
        for asset in snapshot.get("assets", []):
            if not isinstance(asset, dict):
                continue
            if str(asset.get("type", "")).strip().lower() == "transformer":
                v_out = asset.get("voltage_out") or asset.get("voltageOut")
                if v_out:
                    return float(v_out)
    except Exception:
        pass
    return DEFAULT_SECONDARY_VOLTAGE
