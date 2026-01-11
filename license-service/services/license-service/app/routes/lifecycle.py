"""License lifecycle management routes."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db import SessionLocal
from ..services.lifecycle import run_lifecycle_tasks, auto_renew_license, handle_expired_licenses, send_expiration_reminders
from ..admin.ui import require_admin

router = APIRouter(prefix="/api/lifecycle", tags=["lifecycle"])

def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/run-tasks")
def run_tasks(_=Depends(require_admin), db: Session = Depends(db_session)):
    """Run all lifecycle management tasks (expiration checks, reminders, auto-renewals)."""
    results = run_lifecycle_tasks(db)
    return {"ok": True, **results}

@router.post("/check-expiring")
def check_expiring(_=Depends(require_admin), db: Session = Depends(db_session)):
    """Check and send expiration reminders."""
    count = send_expiration_reminders(db)
    return {"ok": True, "reminders_sent": count}

@router.post("/handle-expired")
def handle_expired(_=Depends(require_admin), db: Session = Depends(db_session)):
    """Handle expired licenses (apply grace period, suspend if needed)."""
    count = handle_expired_licenses(db)
    return {"ok": True, "licenses_handled": count}

@router.post("/renew/{license_id}")
def renew_license(license_id: str, _=Depends(require_admin), db: Session = Depends(db_session)):
    """Manually trigger license renewal."""
    new_license = auto_renew_license(license_id, db)
    if not new_license:
        raise HTTPException(400, "License cannot be renewed (auto-renew disabled, already renewed, or invalid)")
    return {"ok": True, "new_license_id": new_license.license_id}

