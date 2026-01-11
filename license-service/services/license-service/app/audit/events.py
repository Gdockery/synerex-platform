from __future__ import annotations
import json
from datetime import datetime
from typing import Any, Dict, Optional
from sqlalchemy.orm import Session

from ..models.audit import AuditEvent

def log_event(
    db: Session,
    *,
    actor: str,
    action: str,
    ref_id: Optional[str] = None,
    detail: Optional[Dict[str, Any]] = None,
):
    evt = AuditEvent(
        actor=actor,
        action=action,
        ref_id=ref_id,
        detail=json.dumps(detail, ensure_ascii=False) if detail else None,
    )
    db.add(evt)
    db.commit()
