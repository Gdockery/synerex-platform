"""
Digital Twin service helpers — Phase 10: DT → CBI integration.

Provides functions for extracting useful engineering data from the DigitalTwin
asset graph (stored as a JSON snapshot in DigitalTwinVersion.snapshot).

Asset graph format
──────────────────
snapshot = {
    "assets": [
        {
            "id":          "asset-uuid",
            "type":        "Transformer" | "Feeder" | "Panel" | "Load" | …
            "label":       "TX-MDP",
            "rated_kva":   150.0,      # primary transformer rating
            "voltage_in":  480,
            "voltage_out": 208,
            …
        },
        …
    ],
    "relationships": [
        { "source": "asset-id-A", "target": "asset-id-B", "type": "feeds" },
        …
    ]
}

The canonical asset type for main transformers in ECBS OS is "Transformer".
"""
from __future__ import annotations

import logging
from typing import Optional

logger = logging.getLogger(__name__)


def get_approved_twin(project_id: int) -> Optional[object]:
    """
    Return the DigitalTwin row with status 'approved' or 'locked' for the
    given project, or None if no such twin exists.
    """
    from app.models.digital_twin import DigitalTwin, TWIN_STATUSES
    twin = (
        DigitalTwin.query
        .filter_by(project_id=project_id, is_deleted=False)
        .filter(DigitalTwin.status.in_(("approved", "locked")))
        .order_by(DigitalTwin.version_number.desc())
        .first()
    )
    return twin


def get_latest_twin_snapshot(twin) -> dict:
    """
    Return the most recent DigitalTwinVersion snapshot dict for a twin,
    or an empty dict if no version exists.
    """
    from app.models.digital_twin import DigitalTwinVersion
    version = (
        DigitalTwinVersion.query
        .filter_by(digital_twin_id=twin.id)
        .order_by(DigitalTwinVersion.version_number.desc())
        .first()
    )
    if version and version.snapshot:
        return version.snapshot if isinstance(version.snapshot, dict) else {}
    return {}


def get_transformer_kva(project_id: int) -> Optional[float]:
    """
    Return total rated kVA of all Transformer assets for this project.

    Single source of truth: the Asset table (kva_rating column).
    The Digital Twin snapshot is topology-only and is NOT used for specs.

    Falls back to the snapshot rated_kva only if no Asset table record exists
    (legacy / not-yet-migrated twins).
    """
    try:
        twin = get_approved_twin(project_id)
        if twin is None:
            return None

        # ── Primary: query the Asset table (single source of truth) ────────
        from app.models.asset import Asset
        db_assets = (
            Asset.query
            .filter_by(digital_twin_id=twin.id, is_deleted=False)
            .filter(Asset.asset_type.ilike("transformer"))
            .all()
        )
        db_kva_values = [float(a.kva_rating) for a in db_assets if a.kva_rating]
        if db_kva_values:
            return sum(db_kva_values)

        # ── Fallback: read from snapshot (legacy twins without asset rows) ──
        snapshot = get_latest_twin_snapshot(twin)
        snap_kva = []
        for asset in snapshot.get("assets", []):
            if not isinstance(asset, dict):
                continue
            if str(asset.get("type", "")).strip().lower() == "transformer":
                kva = asset.get("rated_kva") or asset.get("ratedKva") or asset.get("kva")
                if kva:
                    try:
                        snap_kva.append(float(kva))
                    except (TypeError, ValueError):
                        pass
        return sum(snap_kva) if snap_kva else None

    except Exception as exc:
        logger.warning("[dt_service] get_transformer_kva project=%d error: %s", project_id, exc)
        return None


def enrich_cbi_buckets_with_dt(buckets: list[dict], project_id: int) -> list[dict]:
    """
    Given a list of CBI bucket dicts (output of compute_buckets), attach
    Digital Twin context if an approved twin exists for the project.

    Adds two keys to each bucket dict:
        transformer_kva         — rated kVA from the twin (or None)
        capacity_utilization_pct — avg_kva / transformer_kva × 100 (or None)

    Mutates and returns the bucket list in place (buckets are dicts, mutable).
    """
    kva = get_transformer_kva(project_id)

    for b in buckets:
        b["transformer_kva"] = kva
        if kva and kva > 0:
            avg_kva = b.get("avg_kva") or 0.0
            try:
                util = round((float(avg_kva) / kva) * 100.0, 2)
                b["capacity_utilization_pct"] = min(util, 200.0)   # cap at 200% (overload indicator)
            except (TypeError, ZeroDivisionError):
                b["capacity_utilization_pct"] = None
        else:
            b["capacity_utilization_pct"] = None

    return buckets
