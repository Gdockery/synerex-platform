"""Helpers for checking license entitlements within the License Service itself."""
from __future__ import annotations

import json
import logging
from typing import Optional

from ..db import SessionLocal
from ..models.license import License

logger = logging.getLogger(__name__)


def get_seat_limit(org_id: str, program_id: str = "tracking") -> Optional[int]:
    """
    Return the seat_limit from the active license payload for *org_id*.

    Returns None if:
    - no active license exists (caller should allow creation in that case)
    - the license payload has no seat_limit set

    The caller is responsible for comparing the limit against the current
    active user count.
    """
    db = SessionLocal()
    try:
        from datetime import datetime
        lic = (
            db.query(License)
            .filter(
                License.org_id == org_id,
                License.program_id == program_id,
                License.revoked == False,
                License.suspended == False,
                License.expires_at > datetime.utcnow(),
            )
            .order_by(License.issued_at.desc())
            .first()
        )
        if not lic:
            logger.debug("[license_check] no active %s license for org %s — seat limit not enforced", program_id, org_id)
            return None

        try:
            payload = json.loads(lic.payload_json)
        except (ValueError, TypeError):
            return None

        seat_limit = (
            payload.get("entitlements", {})
                   .get("limits", {})
                   .get("seat_limit")
        )
        if seat_limit is not None:
            try:
                seat_limit = int(seat_limit)
            except (ValueError, TypeError):
                seat_limit = None

        logger.debug("[license_check] org %s seat_limit=%s (license %s)", org_id, seat_limit, lic.license_id)
        return seat_limit
    finally:
        db.close()
