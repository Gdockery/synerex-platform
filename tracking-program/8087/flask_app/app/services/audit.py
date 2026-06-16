"""
Audit logging helper — Phase 1.

Usage:
    from app.services.audit import audit

    audit("user.login",  user_id=u.id, org_id=u.org_id, ip=request.remote_addr)
    audit("report.generated", user_id=u.id, entity_type="project", entity_id=proj.id,
          detail={"report": "proposal_contract"})

All writes are best-effort: a failure never blocks the primary action.
"""
from __future__ import annotations

import traceback
from time import time
from typing import Any

from flask import request as flask_request


def audit(
    action: str,
    *,
    user_id: int | None = None,
    org_id: str | None = None,
    entity_type: str | None = None,
    entity_id: int | None = None,
    ip: str | None = None,
    detail: dict[str, Any] | None = None,
) -> None:
    """Append one row to audit_log.  Never raises."""
    try:
        from app.extensions import db
        from app.models.audit_log import AuditLog

        ip_addr = ip
        ua = None
        try:
            ip_addr = ip_addr or flask_request.remote_addr
            ua = flask_request.headers.get("User-Agent", "")[:512]
        except RuntimeError:
            pass  # outside request context — fine, e.g. CLI commands

        now = int(time() * 1000)
        row = AuditLog(
            user_id=user_id,
            org_id=org_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            ip_address=ip_addr,
            user_agent=ua,
            detail=detail,
            createdAt=now,
            updatedAt=now,
        )
        db.session.add(row)
        db.session.commit()
    except Exception:
        traceback.print_exc()
