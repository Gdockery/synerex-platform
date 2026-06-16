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
    Extract the total rated kVA of all Transformer-type assets in the
    approved/locked Digital Twin for the given project.

    Returns:
        Sum of rated_kva for all Transformer assets (float), or None if:
        - No approved/locked twin exists for the project.
        - The twin has no Transformer assets with a rated_kva value.

    Multiple transformers (e.g., a site with two parallel 150 kVA units)
    are summed so the capacity context reflects the full site capacity.
    """
    try:
        twin = get_approved_twin(project_id)
        if twin is None:
            return None

        snapshot = get_latest_twin_snapshot(twin)
        assets = snapshot.get("assets", [])

        transformer_kva_values = []
        for asset in assets:
            if not isinstance(asset, dict):
                continue
            # Match "Transformer", "transformer", "TRANSFORMER" — case-insensitive
            asset_type = str(asset.get("type", "")).strip().lower()
            if asset_type == "transformer":
                kva = asset.get("rated_kva") or asset.get("ratedKva") or asset.get("kva")
                if kva is not None:
                    try:
                        transformer_kva_values.append(float(kva))
                    except (TypeError, ValueError):
                        pass

        if not transformer_kva_values:
            return None

        return sum(transformer_kva_values)

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
