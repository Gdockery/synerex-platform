from __future__ import annotations
from typing import Optional
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_

from ..db import SessionLocal
from ..models.audit import AuditEvent
from ..auth.api_keys import require_api_key

router = APIRouter(prefix="/api/audit", tags=["audit-api"])

def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/events")
def list_events(
    actor: Optional[str] = Query(None, description="Filter by actor"),
    action: Optional[str] = Query(None, description="Filter by action"),
    ref_id: Optional[str] = Query(None, description="Filter by reference ID"),
    start_date: Optional[str] = Query(None, description="Filter events from this date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="Filter events until this date (YYYY-MM-DD)"),
    limit: int = Query(200, ge=1, le=1000, description="Maximum number of results"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
    api_key = Depends(require_api_key({"utility:read"})),
    db: Session = Depends(db_session)
):
    """List audit events with optional filtering."""
    query = db.query(AuditEvent)
    
    if actor:
        query = query.filter(AuditEvent.actor == actor)
    if action:
        query = query.filter(AuditEvent.action == action)
    if ref_id:
        query = query.filter(AuditEvent.ref_id == ref_id)
    if start_date:
        try:
            start_dt = datetime.combine(date.fromisoformat(start_date), datetime.min.time())
            query = query.filter(AuditEvent.at >= start_dt)
        except ValueError:
            raise HTTPException(400, "Invalid start_date format (use YYYY-MM-DD)")
    if end_date:
        try:
            end_dt = datetime.combine(date.fromisoformat(end_date), datetime.max.time())
            query = query.filter(AuditEvent.at <= end_dt)
        except ValueError:
            raise HTTPException(400, "Invalid end_date format (use YYYY-MM-DD)")
    
    total = query.count()
    rows = query.order_by(AuditEvent.at.desc()).offset(offset).limit(limit).all()
    
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "events": [{
            "id": r.id if hasattr(r, 'id') else None,
            "at": r.at.isoformat(),
            "actor": r.actor,
            "action": r.action,
            "ref_id": r.ref_id,
            "detail": r.detail
        } for r in rows]
    }

@router.get("/events/{event_id}")
def get_event(
    event_id: int,
    api_key = Depends(require_api_key({"utility:read"})),
    db: Session = Depends(db_session)
):
    """Get a single audit event by ID."""
    # Note: This assumes AuditEvent has an 'id' field. Adjust if using a different primary key.
    event = db.query(AuditEvent).filter(AuditEvent.id == event_id).first()
    if not event:
        raise HTTPException(404, "Event not found")
    return {
        "id": event.id if hasattr(event, 'id') else None,
        "at": event.at.isoformat(),
        "actor": event.actor,
        "action": event.action,
        "ref_id": event.ref_id,
        "detail": event.detail
    }
