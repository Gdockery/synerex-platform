"""
Current Balance Intelligence™ Engine — Phase 7

Pure-math service: given a list of meterdata-like dicts (or MeterData ORM rows),
classify electrical current into the five ECBS categories and produce the
Current Balance Index™ (CBI) score.

No database writes here — callers store the returned dicts as they see fit.

CBI Formula (spec §53)
──────────────────────
Inputs  : harmonic_burden_pct, reactive_burden_pct, imbalance_pct, neutral_burden_pct
Weights : configurable; defaults from ECBS OS v4 (sum = 100)
Output  : CBI  0–100   (90+ Excellent, 80-89 Good, 70-79 Fair, <70 Poor)

Current Classifications (spec §52)
───────────────────────────────────
Productive Current  = I × PF                               (useful work)
Reactive Current    = I × sin(arccos(PF)) ≈ kVAR/V·√3     (magnetic support)
Harmonic Current    = I × THD / √(1 + THD²)               (distortion, THD as fraction)
Imbalance Current   = max phase deviation from mean         (unequal loading)
Neutral Current     = Imbalance × NEUTRAL_FACTOR           (estimated; neutral not metered)
Lost Capacity       = Reactive + Harmonic + Imbalance       (non-productive infrastructure load)
"""
from __future__ import annotations

import math
import logging
from typing import Any

logger = logging.getLogger(__name__)

# ── CBI weighting (must sum to 100) ──────────────────────────────────────────
CBI_WEIGHT_HARMONIC   = 35.0
CBI_WEIGHT_REACTIVE   = 30.0
CBI_WEIGHT_IMBALANCE  = 20.0
CBI_WEIGHT_NEUTRAL    = 15.0

# Estimated ratio: neutral current ≈ this × imbalance current
NEUTRAL_FACTOR = 0.5

# Max penalty caps (% of total current) — prevents one bad reading dominating
MAX_HARMONIC_PCT  = 60.0
MAX_REACTIVE_PCT  = 80.0
MAX_IMBALANCE_PCT = 50.0
MAX_NEUTRAL_PCT   = 30.0


# ── Internal helpers ──────────────────────────────────────────────────────────

def _safe(val, default: float = 0.0) -> float:
    """Return float(val) or default if val is None/NaN."""
    try:
        v = float(val)
        return default if math.isnan(v) or math.isinf(v) else v
    except (TypeError, ValueError):
        return default


def _avg(values: list[float]) -> float:
    clean = [v for v in values if v is not None]
    return sum(clean) / len(clean) if clean else 0.0


def _clamp(val: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, val))


def _pct_of(part: float, total: float) -> float:
    """part / total × 100, clamped 0–100, safe for zero total."""
    if total <= 0:
        return 0.0
    return _clamp((part / total) * 100.0)


# ── Single-reading classification ─────────────────────────────────────────────

def classify_reading(row: dict[str, Any]) -> dict[str, Any]:
    """
    Classify a single meterdata row (dict with camelCase keys matching MeterData columns).

    Returns a dict with:
        productive_amp, reactive_amp, harmonic_amp,
        imbalance_amp, neutral_amp, lost_cap_amp,
        harmonic_burden_pct, reactive_burden_pct,
        imbalance_pct, neutral_burden_pct,
        cbi_score, avg_amp, avg_pf, avg_thd,
        avg_l1_amp, avg_l2_amp, avg_l3_amp,
        avg_kw, avg_kvar, avg_kva
    """
    # ── Pull raw values ───────────────────────────────────────────────────────
    total_amp  = _safe(row.get("totalAmp"))
    total_pf   = _safe(row.get("totalPf"), 1.0)   # 0–1 scale assumed
    total_thd  = _safe(row.get("totalTHD"))        # percentage, e.g. 12.5 = 12.5 %
    total_kw   = _safe(row.get("totalKw"))
    total_kvar = _safe(row.get("totalKvar"))
    total_kva  = _safe(row.get("totalKva"))

    l1_amp = _safe(row.get("l1Amp"))
    l2_amp = _safe(row.get("l2Amp"))
    l3_amp = _safe(row.get("l3Amp"))

    # ── PF normalisation: some meters report 0-100, convert to 0-1 ───────────
    if total_pf > 1.0:
        total_pf = total_pf / 100.0
    total_pf = _clamp(total_pf, 0.0, 1.0)

    # ── Effective total amp from per-phase if total_amp is missing ────────────
    if total_amp <= 0 and (l1_amp + l2_amp + l3_amp) > 0:
        total_amp = (l1_amp + l2_amp + l3_amp) / 3.0  # avg, not sum (line current)

    # ── Productive Current = I × PF ───────────────────────────────────────────
    productive_amp = total_amp * total_pf

    # ── Reactive Current = I × sin(arccos(PF)) ───────────────────────────────
    sin_phi = math.sqrt(max(0.0, 1.0 - total_pf ** 2))
    reactive_amp = total_amp * sin_phi

    # Optionally better: derive from kVAR / (V × √3) but we don't always have V
    # Fall back to the kW/kVAR triangle if per-phase kVAR is available
    if total_kvar > 0 and total_kw > 0:
        apparent = math.sqrt(total_kw ** 2 + total_kvar ** 2)
        if apparent > 0:
            reactive_amp_alt = (total_kvar / apparent) * total_amp
            # Blend with trig method (both valid; average for stability)
            reactive_amp = (reactive_amp + reactive_amp_alt) / 2.0

    # ── Harmonic Current = I × (THD/100) / √(1 + (THD/100)²) ────────────────
    thd_frac = total_thd / 100.0
    if thd_frac > 0:
        harmonic_amp = total_amp * thd_frac / math.sqrt(1.0 + thd_frac ** 2)
    else:
        harmonic_amp = 0.0

    # ── Imbalance Current = max deviation of per-phase amp from mean ──────────
    phases = [a for a in (l1_amp, l2_amp, l3_amp) if a > 0]
    if len(phases) == 3:
        mean_phase = sum(phases) / 3.0
        if mean_phase > 0:
            imbalance_amp = max(abs(a - mean_phase) for a in phases)
        else:
            imbalance_amp = 0.0
    else:
        imbalance_amp = 0.0

    # ── Neutral Current (estimated) ───────────────────────────────────────────
    neutral_amp = imbalance_amp * NEUTRAL_FACTOR

    # ── Lost Capacity Current™ ────────────────────────────────────────────────
    lost_cap_amp = reactive_amp + harmonic_amp + imbalance_amp

    # ── Burden percentages ────────────────────────────────────────────────────
    if total_amp > 0:
        harmonic_burden_pct = _clamp((harmonic_amp  / total_amp) * 100.0, 0, MAX_HARMONIC_PCT)
        reactive_burden_pct = _clamp((reactive_amp  / total_amp) * 100.0, 0, MAX_REACTIVE_PCT)
        imbalance_pct       = _clamp((imbalance_amp / total_amp) * 100.0, 0, MAX_IMBALANCE_PCT)
        neutral_burden_pct  = _clamp((neutral_amp   / total_amp) * 100.0, 0, MAX_NEUTRAL_PCT)
    else:
        harmonic_burden_pct = reactive_burden_pct = imbalance_pct = neutral_burden_pct = 0.0

    # ── CBI score ─────────────────────────────────────────────────────────────
    # Normalise each burden to its own max cap before weighting
    h_norm = harmonic_burden_pct / MAX_HARMONIC_PCT
    r_norm = reactive_burden_pct / MAX_REACTIVE_PCT
    i_norm = imbalance_pct       / MAX_IMBALANCE_PCT
    n_norm = neutral_burden_pct  / MAX_NEUTRAL_PCT

    penalty = (
        CBI_WEIGHT_HARMONIC  * h_norm +
        CBI_WEIGHT_REACTIVE  * r_norm +
        CBI_WEIGHT_IMBALANCE * i_norm +
        CBI_WEIGHT_NEUTRAL   * n_norm
    )
    cbi_score = _clamp(100.0 - penalty, 0.0, 100.0)

    return {
        # raw stats
        "avg_amp":   total_amp,
        "avg_pf":    total_pf,
        "avg_thd":   total_thd,
        "avg_kw":    total_kw,
        "avg_kvar":  total_kvar,
        "avg_kva":   total_kva,
        "avg_l1_amp": l1_amp,
        "avg_l2_amp": l2_amp,
        "avg_l3_amp": l3_amp,
        # classifications
        "productive_amp": round(productive_amp, 4),
        "reactive_amp":   round(reactive_amp,   4),
        "harmonic_amp":   round(harmonic_amp,   4),
        "imbalance_amp":  round(imbalance_amp,  4),
        "neutral_amp":    round(neutral_amp,    4),
        "lost_cap_amp":   round(lost_cap_amp,   4),
        # burdens
        "harmonic_burden_pct": round(harmonic_burden_pct, 2),
        "reactive_burden_pct": round(reactive_burden_pct, 2),
        "imbalance_pct":       round(imbalance_pct,       2),
        "neutral_burden_pct":  round(neutral_burden_pct,  2),
        # index
        "cbi_score": round(cbi_score, 2),
    }


# ── Bucket aggregation ────────────────────────────────────────────────────────

def aggregate_bucket(rows: list[dict[str, Any]]) -> dict[str, Any]:
    """
    Average multiple classify_reading() results into one bucket summary.
    Averages the raw inputs first, then re-runs the classification once
    so the CBI is computed from averaged data (not averaged from CBI values).
    """
    if not rows:
        return {}

    avg_row = {
        "totalAmp":  _avg([_safe(r.get("totalAmp"))  for r in rows]),
        "totalPf":   _avg([_safe(r.get("totalPf"), 1) for r in rows]),
        "totalTHD":  _avg([_safe(r.get("totalTHD"))  for r in rows]),
        "totalKw":   _avg([_safe(r.get("totalKw"))   for r in rows]),
        "totalKvar": _avg([_safe(r.get("totalKvar")) for r in rows]),
        "totalKva":  _avg([_safe(r.get("totalKva"))  for r in rows]),
        "l1Amp":     _avg([_safe(r.get("l1Amp"))     for r in rows]),
        "l2Amp":     _avg([_safe(r.get("l2Amp"))     for r in rows]),
        "l3Amp":     _avg([_safe(r.get("l3Amp"))     for r in rows]),
    }
    result = classify_reading(avg_row)
    result["sample_count"] = len(rows)
    return result


def bucket_ts_for(epoch_ms: int, bucket_minutes: int = 15) -> int:
    """Floor epoch_ms to the nearest bucket_minutes boundary."""
    bucket_ms = bucket_minutes * 60 * 1000
    return (epoch_ms // bucket_ms) * bucket_ms


# ── Batch processing helpers ──────────────────────────────────────────────────

def _row_to_dict(row) -> dict[str, Any]:
    """Convert a MeterData ORM object or plain dict to a dict for classify_reading."""
    if isinstance(row, dict):
        return row
    return {
        "totalAmp":  getattr(row, "totalAmp",  None),
        "totalPf":   getattr(row, "totalPf",   None),
        "totalTHD":  getattr(row, "totalTHD",  None),
        "totalKw":   getattr(row, "totalKw",   None),
        "totalKvar": getattr(row, "totalKvar", None),
        "totalKva":  getattr(row, "totalKva",  None),
        "l1Amp":     getattr(row, "l1Amp",     None),
        "l2Amp":     getattr(row, "l2Amp",     None),
        "l3Amp":     getattr(row, "l3Amp",     None),
        "recordedAt": getattr(row, "recordedAt", None),
        "meter":     getattr(row, "meter",     None),
    }


def compute_buckets(
    meterdata_rows,
    project_id: int,
    site_id: int | None = None,
    meter_id: int | None = None,
    baseline_id: int | None = None,
    bucket_minutes: int = 15,
) -> list[dict[str, Any]]:
    """
    Group meterdata rows by 15-min bucket, classify, and return a list of
    dicts ready to upsert into current_balance_metrics.

    Args:
        meterdata_rows: iterable of MeterData ORM objects or dicts
        project_id: project scope
        site_id: optional site scope
        meter_id: optional single meter override (if rows span meters, pass None)
        baseline_id: optional Phase 6 baseline to tag the metrics against
        bucket_minutes: bucket width (default 15)

    Returns:
        list of dicts matching CurrentBalanceMetrics columns (no id/timestamps)
    """
    from collections import defaultdict
    import time as _time

    now_ms = int(_time.time() * 1000)
    buckets: dict[tuple, list] = defaultdict(list)

    for raw in meterdata_rows:
        row = _row_to_dict(raw)
        ts = _safe(row.get("recordedAt"), 0)
        if ts <= 0:
            continue
        mid = meter_id or (row.get("meter") if not isinstance(raw, dict) else row.get("meter"))
        bk = (bucket_ts_for(int(ts), bucket_minutes), mid)
        buckets[bk].append(row)

    results = []
    for (bts, mid), rows in buckets.items():
        metrics = aggregate_bucket(rows)
        if not metrics:
            continue
        results.append({
            "project_id":   project_id,
            "site_id":      site_id,
            "meter_id":     mid,
            "baseline_id":  baseline_id,
            "bucket_ts":    bts,
            "calculated_at": now_ms,
            **metrics,
        })

    results.sort(key=lambda r: r["bucket_ts"])
    return results


# ── Dashboard summary ─────────────────────────────────────────────────────────

def dashboard_summary(metrics_rows: list[dict[str, Any]]) -> dict[str, Any]:
    """
    Compute project-level dashboard KPIs from a list of metrics dicts
    (already fetched from current_balance_metrics table).

    Returns:
        avg_cbi_score        — mean CBI over the period
        latest_cbi_score     — most recent bucket's CBI
        cbi_rating           — "Excellent" / "Good" / "Fair" / "Poor"
        avg_harmonic_burden  — mean harmonic burden %
        avg_reactive_burden  — mean reactive burden %
        avg_imbalance        — mean imbalance %
        avg_neutral_burden   — mean neutral burden %
        avg_productive_pct   — productive amps as % of total
        avg_lost_cap_pct     — lost capacity amps as % of total
        bucket_count         — number of 15-min intervals
    """
    if not metrics_rows:
        return {
            "avg_cbi_score":       None,
            "latest_cbi_score":    None,
            "cbi_rating":          "Unknown",
            "avg_harmonic_burden": None,
            "avg_reactive_burden": None,
            "avg_imbalance":       None,
            "avg_neutral_burden":  None,
            "avg_productive_pct":  None,
            "avg_lost_cap_pct":    None,
            "bucket_count":        0,
        }

    cbis = [_safe(r.get("cbi_score")) for r in metrics_rows if r.get("cbi_score") is not None]
    latest = max(metrics_rows, key=lambda r: r.get("bucket_ts", 0))

    def _field_avg(field: str) -> float | None:
        vals = [_safe(r.get(field)) for r in metrics_rows if r.get(field) is not None]
        return round(sum(vals) / len(vals), 2) if vals else None

    def _ratio_avg(num: str, den: str) -> float | None:
        pairs = [
            (_safe(r.get(num)), _safe(r.get(den)))
            for r in metrics_rows
            if r.get(num) is not None and r.get(den) is not None and _safe(r.get(den)) > 0
        ]
        if not pairs:
            return None
        pcts = [_clamp((n / d) * 100.0) for n, d in pairs]
        return round(sum(pcts) / len(pcts), 2)

    avg_cbi = round(sum(cbis) / len(cbis), 2) if cbis else None
    latest_cbi = _safe(latest.get("cbi_score"))

    from app.models.current_balance_metrics import cbi_rating as _cbi_rating
    return {
        "avg_cbi_score":       avg_cbi,
        "latest_cbi_score":    latest_cbi,
        "cbi_rating":          _cbi_rating(avg_cbi),
        "avg_harmonic_burden": _field_avg("harmonic_burden_pct"),
        "avg_reactive_burden": _field_avg("reactive_burden_pct"),
        "avg_imbalance":       _field_avg("imbalance_pct"),
        "avg_neutral_burden":  _field_avg("neutral_burden_pct"),
        "avg_productive_pct":  _ratio_avg("productive_amp", "avg_amp"),
        "avg_lost_cap_pct":    _ratio_avg("lost_cap_amp", "avg_amp"),
        "bucket_count":        len(metrics_rows),
    }
