from __future__ import annotations
import json
from datetime import datetime, date, timedelta
from typing import Any, Dict, Tuple

from sqlalchemy.orm import Session

from ..config import settings
from ..crypto.signing import load_private_key, load_public_key
from ..licensing import verify_license
from ..models.authorization import ProgramAuthorization
from ..models.license import License
from ..audit.events import log_event

def issue_license_record(
    db: Session,
    *,
    authorization: ProgramAuthorization,
    license_payload: Dict[str, Any],
) -> Tuple[License, Dict[str, Any]]:
    """Issue a signed license and persist to DB. Returns (db_record, signed_payload)."""
    PRIV = load_private_key(settings.private_key_pem)

    # enforce intent + patents defaults (consistent with earlier work)
    license_payload["intent"] = license_payload.get("intent") or {
        "purpose": "Utility-grade EM&V baseline creation and/or continuous tracking",
        "permitted_uses": ["baseline_creation", "utility_submission", "continuous_tracking"],
        "explicitly_prohibited": ["independent_resale", "derivative_analysis_outside_synerex", "reverse_engineering"],
    }
    license_payload["patents"] = license_payload.get("patents") or ["US-12,375,324-B2"]

    from ..licensing import sign_license
    signed = sign_license(PRIV, license_payload, settings.key_id)

    # quick self-check
    PUB = load_public_key(settings.public_key_pem)
    ok = verify_license(PUB, signed)
    if not ok:
        raise ValueError("license_sign_verify_failed")

    rec = License(
        license_id=signed["license_id"],
        org_id=authorization.org_id,
        program_id=authorization.program_id,
        authorization_id=authorization.authorization_id,
        issued_at=datetime.utcnow(),
        expires_at=datetime.fromisoformat(signed["term"]["end"] + "T00:00:00"),
        revoked=False,
        payload_json=json.dumps(signed),
        signature_b64=signed["signature"]["value"],
        key_id=signed["signature"]["key_id"],
    )
    db.add(rec)
    db.commit()

    log_event(db, actor="admin", action="license.issue", ref_id=rec.license_id, detail={"program_id": rec.program_id, "org_id": rec.org_id})
    return rec, signed
