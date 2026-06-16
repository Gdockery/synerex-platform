"""
Baseline auto-compute service — Phase 6.

Given a Baseline record that has test_start / test_end set, this service
queries meterdata for all meters belonging to the baseline's project,
computes the statistical summary expected by the EM&V Baseline Manager™ spec,
and writes the result back to the baseline row.

Computed fields
───────────────
avg_kw       — mean total kW across all readings in the window
avg_kva      — mean total kVA
avg_kvar     — mean total kVAR
avg_pf       — mean total PF (normalised to 0–1)
peak_kva     — max kVA in the window (demand peak)
sample_count — number of meterdata rows included

These are written to the Baseline model columns and also returned as a dict
for the API response.
"""
from __future__ import annotations

import logging
from sqlalchemy import text

from app.extensions import db

logger = logging.getLogger(__name__)

_STAT_SQL = """
SELECT
    COUNT(*)                        AS sample_count,
    AVG(COALESCE(totalKw,   0))    AS avg_kw,
    AVG(COALESCE(totalKva,  0))    AS avg_kva,
    AVG(COALESCE(totalKvar, 0))    AS avg_kvar,
    AVG(
        CASE
            WHEN totalPf IS NULL THEN NULL
            WHEN totalPf > 1     THEN totalPf / 100.0
            ELSE totalPf
        END
    )                               AS avg_pf,
    MAX(COALESCE(totalKva,  0))    AS peak_kva
FROM meterdata
WHERE meter IN (
    SELECT id FROM meter
    WHERE project = :project_id
      AND isDeleted = 0
)
  AND recordedAt >= :ts_start
  AND recordedAt <= :ts_end
"""


def compute_baseline_metrics(baseline_id: int) -> dict:
    """
    Compute statistical metrics from meterdata for the baseline's test window.

    Returns a dict with keys:
        avg_kw, avg_kva, avg_kvar, avg_pf, peak_kva, sample_count,
        baseline_id, project_id
    Raises ValueError for missing fields or no data.
    """
    from app.models.baseline import Baseline

    b = db.session.get(Baseline, baseline_id)
    if b is None:
        raise ValueError(f"Baseline {baseline_id} not found")

    if b.status == "locked":
        raise ValueError("Cannot recompute a locked baseline")

    if not b.test_start or not b.test_end:
        raise ValueError("Baseline must have test_start and test_end set before computing")

    if b.test_start >= b.test_end:
        raise ValueError("test_start must be before test_end")

    row = db.session.execute(
        text(_STAT_SQL),
        {
            "project_id": b.project_id,
            "ts_start":   b.test_start,
            "ts_end":     b.test_end,
        },
    ).fetchone()

    if row is None or (row.sample_count or 0) == 0:
        raise ValueError(
            f"No meterdata found for project {b.project_id} "
            f"between {b.test_start} and {b.test_end}"
        )

    def _f(v):
        """Safe float, None if unavailable."""
        try:
            return round(float(v), 4) if v is not None else None
        except (TypeError, ValueError):
            return None

    avg_kw    = _f(row.avg_kw)
    avg_kva   = _f(row.avg_kva)
    avg_kvar  = _f(row.avg_kvar)
    avg_pf    = _f(row.avg_pf)
    peak_kva  = _f(row.peak_kva)
    n         = int(row.sample_count or 0)

    # Write back to baseline record
    from time import time as _t
    b.avg_kw    = avg_kw
    b.avg_kva   = avg_kva
    b.avg_kvar  = avg_kvar
    b.avg_pf    = avg_pf
    b.peak_kva  = peak_kva
    b.updatedAt = int(_t() * 1000)
    db.session.commit()

    logger.info(
        "[baseline_compute] baseline=%d project=%d n=%d avg_kw=%.2f avg_pf=%.4f",
        baseline_id, b.project_id, n,
        avg_kw or 0, avg_pf or 0,
    )

    return {
        "baseline_id":  baseline_id,
        "project_id":   b.project_id,
        "sample_count": n,
        "avg_kw":       avg_kw,
        "avg_kva":      avg_kva,
        "avg_kvar":     avg_kvar,
        "avg_pf":       avg_pf,
        "peak_kva":     peak_kva,
        "test_start":   b.test_start,
        "test_end":     b.test_end,
    }
