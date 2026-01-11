from __future__ import annotations
import json
from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..db import SessionLocal
from ..models.license import License
from ..models.seats import SeatAssignment
from ..audit.events import log_event

router = APIRouter(prefix="/api", tags=["seats"])

def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def _seat_limit(license_payload: dict) -> int:
    return int(license_payload.get("entitlements", {}).get("limits", {}).get("seat_limit", 0) or 0)

@router.get("/seats")
def list_all_seats(
    license_id: Optional[str] = Query(None, description="Filter by license ID"),
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of results"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
    db: Session = Depends(db_session)
):
    """List all seat assignments with optional filtering."""
    query = db.query(SeatAssignment)
    
    if license_id:
        query = query.filter(SeatAssignment.license_id == license_id)
    if user_id:
        query = query.filter(SeatAssignment.user_id == user_id)
    if is_active is not None:
        query = query.filter(SeatAssignment.is_active == is_active)
    
    total = query.count()
    seats = query.order_by(SeatAssignment.assigned_at.desc()).offset(offset).limit(limit).all()
    
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "seats": [{
            "id": r.id,
            "license_id": r.license_id,
            "user_id": r.user_id,
            "is_active": r.is_active,
            "assigned_at": r.assigned_at.isoformat() if r.assigned_at else None
        } for r in seats]
    }

@router.get("/licenses/{license_id}/seats")
def list_seats(license_id: str, db: Session = Depends(db_session)):
    rows = db.query(SeatAssignment).filter(SeatAssignment.license_id == license_id, SeatAssignment.is_active == True).all()
    return {"license_id": license_id, "active_seats": [{"user_id": r.user_id, "assigned_at": r.assigned_at.isoformat()} for r in rows]}

@router.post("/licenses/{license_id}/seats/assign")
def assign_seat(license_id: str, user_id: str, db: Session = Depends(db_session)):
    lic = db.get(License, license_id)
    if not lic:
        raise HTTPException(404, "license not found")
    payload = json.loads(lic.payload_json)
    limit = _seat_limit(payload)
    if limit <= 0:
        raise HTTPException(403, "seat_limit not enabled for this license")

    current = db.query(SeatAssignment).filter(SeatAssignment.license_id == license_id, SeatAssignment.is_active == True).count()
    seat_id = f"{license_id}:{user_id}"
    existing = db.get(SeatAssignment, seat_id)

    if existing and existing.is_active:
        return {"ok": True, "license_id": license_id, "user_id": user_id, "already_assigned": True}

    if current >= limit:
        raise HTTPException(409, f"seat_limit_exceeded:{limit}")

    if not existing:
        db.add(SeatAssignment(id=seat_id, license_id=license_id, user_id=user_id, is_active=True))
    else:
        existing.is_active = True
        existing.assigned_at = datetime.utcnow()
    db.commit()

    log_event(db, actor="system", action="seat.assign", ref_id=seat_id, detail={"license_id": license_id, "user_id": user_id})
    return {"ok": True, "license_id": license_id, "user_id": user_id, "already_assigned": False}

@router.get("/licenses/{license_id}/seats/{user_id}")
def get_seat(license_id: str, user_id: str, db: Session = Depends(db_session)):
    """Get a specific seat assignment."""
    seat_id = f"{license_id}:{user_id}"
    rec = db.get(SeatAssignment, seat_id)
    if not rec:
        raise HTTPException(404, "Seat assignment not found")
    return {
        "id": rec.id,
        "license_id": rec.license_id,
        "user_id": rec.user_id,
        "is_active": rec.is_active,
        "assigned_at": rec.assigned_at.isoformat() if rec.assigned_at else None
    }

@router.post("/licenses/{license_id}/seats/release")
def release_seat(license_id: str, user_id: str, db: Session = Depends(db_session)):
    """Release a seat assignment."""
    seat_id = f"{license_id}:{user_id}"
    rec = db.get(SeatAssignment, seat_id)
    if not rec:
        raise HTTPException(404, "seat assignment not found")
    rec.is_active = False
    db.commit()
    log_event(db, actor="system", action="seat.release", ref_id=seat_id, detail={"license_id": license_id, "user_id": user_id})
    return {"ok": True}
