import json
from typing import Optional, Dict, Any
from datetime import datetime, date
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session

from ..db import SessionLocal
from ..models.license import License
from ..models.authorization import ProgramAuthorization
from ..crypto.signing import load_public_key
from ..licensing import verify_license
from ..audit.events import log_event

router = APIRouter(prefix="/api", tags=["licenses"])

def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

KEYS_DIR = Path(__file__).resolve().parents[2] / "keys"
PUB = load_public_key(KEYS_DIR / "issuer_public.key")

def _today_utc() -> date:
    return datetime.utcnow().date()

@router.get("/licenses")
def list_licenses(
    org_id: Optional[str] = Query(None, description="Filter by organization ID"),
    program_id: Optional[str] = Query(None, description="Filter by program ID (emv or tracking)"),
    status: Optional[str] = Query(None, description="Filter by status (active, revoked, suspended)"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of results"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
    db: Session = Depends(db_session)
):
    """List all licenses with optional filtering."""
    query = db.query(License)
    
    if org_id:
        query = query.filter(License.org_id == org_id)
    if program_id:
        if program_id not in ("emv", "tracking"):
            raise HTTPException(400, "program_id must be emv or tracking")
        query = query.filter(License.program_id == program_id)
    if status:
        if status == "revoked":
            query = query.filter(License.revoked == True)
        elif status == "suspended":
            query = query.filter(License.suspended == True)
        elif status == "active":
            query = query.filter(License.revoked == False, License.suspended == False)
        else:
            raise HTTPException(400, "status must be active, revoked, or suspended")
    
    total = query.count()
    licenses = query.order_by(License.license_id.desc()).offset(offset).limit(limit).all()
    
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "licenses": [{
            "license_id": l.license_id,
            "org_id": l.org_id,
            "program_id": l.program_id,
            "authorization_id": l.authorization_id,
            "issued_at": l.issued_at.isoformat() if l.issued_at else None,
            "expires_at": l.expires_at.isoformat() if l.expires_at else None,
            "revoked": l.revoked,
            "suspended": l.suspended
        } for l in licenses]
    }

@router.post("/licenses/verify")
def verify_license_endpoint(license_payload: dict, db: Session = Depends(db_session)):
    # 1) signature
    if not verify_license(PUB, license_payload):
        return {"valid": False, "reason": "bad_signature"}

    license_id = license_payload.get("license_id")
    if not license_id:
        return {"valid": False, "reason": "missing_license_id"}

    # 2) must exist in DB (single source of truth for online status)
    rec = db.get(License, license_id)
    if not rec:
        return {"valid": False, "reason": "unknown_license_id"}

    # 3) revocation
    if rec.revoked:
        return {"valid": False, "reason": "revoked"}
    if getattr(rec, 'suspended', False):
        return {"valid": False, "reason": "suspended"}

    # 4) authorization must be active and in-term
    auth = db.get(ProgramAuthorization, rec.authorization_id)
    if not auth:
        return {"valid": False, "reason": "authorization_missing"}
    if auth.status != "active":
        return {"valid": False, "reason": "authorization_inactive"}

    today = _today_utc()
    try:
        starts = date.fromisoformat(auth.starts_at)
        ends = date.fromisoformat(auth.ends_at)
        if today < starts:
            return {"valid": False, "reason": "not_yet_active"}
        if today > ends:
            return {"valid": False, "reason": "expired"}
    except Exception:
        return {"valid": False, "reason": "bad_term"}

    log_event(db, actor="system", action="license.verify", ref_id=license_id, detail={"program_id": rec.program_id})
    rev = license_payload.get("revocation", {})
    cache_ttl = int(rev.get("cache_ttl_sec", 30))
    grace = int(rev.get("grace_seconds", 300))
    log_event(db, actor="system", action="license.verify", ref_id=license_id, detail={"program_id": rec.program_id})
    return {"valid": True, "license_id": license_id, "program_id": rec.program_id, "authorization_id": rec.authorization_id, "cache_ttl_sec": cache_ttl, "grace_seconds": grace}

@router.get("/licenses/{license_id}")
def get_license(license_id: str, db: Session = Depends(db_session)):
    rec = db.get(License, license_id)
    if not rec:
        raise HTTPException(404, "Not found")
    return json.loads(rec.payload_json)

@router.patch("/licenses/{license_id}")
def update_license(
    license_id: str,
    body: Dict[str, Any] = Body(...),
    db: Session = Depends(db_session)
):
    """Update license metadata (limited fields)."""
    rec = db.get(License, license_id)
    if not rec:
        raise HTTPException(404, "License not found")
    
    # Only allow updating expires_at for now
    if "expires_at" in body:
        try:
            rec.expires_at = datetime.fromisoformat(body["expires_at"].replace("Z", "+00:00"))
        except Exception:
            raise HTTPException(400, "Invalid expires_at format (use ISO 8601)")
    
    db.commit()
    log_event(db, actor="admin", action="license.update", ref_id=license_id, detail=body)
    return {"ok": True, "license_id": license_id}

@router.post("/licenses/{license_id}/revoke")
def revoke_license(license_id: str, reason: str = "breach", db: Session = Depends(db_session)):
    """Revoke a license."""
    rec = db.get(License, license_id)
    if not rec:
        raise HTTPException(404, "Not found")
    rec.revoked = True
    rec.revoked_at = datetime.utcnow()
    db.commit()
    log_event(db, actor="admin", action="license.revoke", ref_id=license_id, detail={"reason": reason})
    return {"ok": True, "license_id": license_id, "reason": reason}

@router.post("/licenses/{license_id}/suspend")
def suspend_license(license_id: str, reason: str = "admin_action", db: Session = Depends(db_session)):
    """Suspend a license."""
    rec = db.get(License, license_id)
    if not rec:
        raise HTTPException(404, "License not found")
    rec.suspended = True
    rec.suspended_at = datetime.utcnow()
    rec.suspended_reason = reason
    db.commit()
    log_event(db, actor="admin", action="license.suspend", ref_id=license_id, detail={"reason": reason})
    return {"ok": True, "license_id": license_id, "suspended": True, "reason": reason}

@router.post("/licenses/{license_id}/unsuspend")
def unsuspend_license(license_id: str, db: Session = Depends(db_session)):
    """Unsuspend a license."""
    rec = db.get(License, license_id)
    if not rec:
        raise HTTPException(404, "License not found")
    rec.suspended = False
    rec.suspended_at = None
    rec.suspended_reason = None
    db.commit()
    log_event(db, actor="admin", action="license.unsuspend", ref_id=license_id)
    return {"ok": True, "license_id": license_id, "suspended": False}

@router.get("/licenses/{license_id}/status")
def get_license_status(license_id: str, db: Session = Depends(db_session)):
    """Get license status summary."""
    rec = db.get(License, license_id)
    if not rec:
        raise HTTPException(404, "License not found")
    
    auth = db.get(ProgramAuthorization, rec.authorization_id)
    today = _today_utc()
    
    status = "active"
    if rec.revoked:
        status = "revoked"
    elif rec.suspended:
        status = "suspended"
    elif auth:
        try:
            starts = date.fromisoformat(auth.starts_at)
            ends = date.fromisoformat(auth.ends_at)
            if today < starts:
                status = "not_yet_active"
            elif today > ends:
                status = "expired"
        except Exception:
            pass
    
    return {
        "license_id": license_id,
        "status": status,
        "revoked": rec.revoked,
        "suspended": rec.suspended,
        "authorization_status": auth.status if auth else None,
        "expires_at": rec.expires_at.isoformat() if rec.expires_at else None
    }

@router.get("/licenses/{license_id}/authorization")
def get_license_authorization(license_id: str, db: Session = Depends(db_session)):
    """Get the authorization associated with a license."""
    rec = db.get(License, license_id)
    if not rec:
        raise HTTPException(404, "License not found")
    
    auth = db.get(ProgramAuthorization, rec.authorization_id)
    if not auth:
        raise HTTPException(404, "Authorization not found")
    
    return {
        "authorization_id": auth.authorization_id,
        "program_id": auth.program_id,
        "org_id": auth.org_id,
        "template_id": auth.template_id,
        "status": auth.status,
        "starts_at": auth.starts_at,
        "ends_at": auth.ends_at
    }

@router.get("/licenses/by-serial/{license_id}")
def get_license_by_serial(license_id: str, db: Session = Depends(db_session)):
    """
    Get full license JSON by serial number (license_id).
    
    This endpoint is used by EM&V and Tracking software to fetch the full license
    JSON when a user enters their serial number on the login page.
    
    Works for both 'emv' and 'tracking' programs.
    """
    rec = db.get(License, license_id)
    if not rec:
        raise HTTPException(404, "License not found")
    
    # Return the full signed license JSON
    return json.loads(rec.payload_json)

@router.post("/licenses/{license_id}/session")
def track_user_session(
    license_id: str,
    user_info: Dict[str, Any] = Body(...),
    db: Session = Depends(db_session)
):
    """
    Track user login session for a license.
    
    Called by EM&V or Tracking software when a user logs in with their serial number.
    Records user information (username, email) and creates audit/usage events.
    
    Request body should include:
    - username: str (required)
    - email: str (optional)
    - user_id: str (optional, software's internal user ID)
    - program: str (optional, "emv" or "tracking" - will be auto-detected from license)
    """
    # Validate license exists and is active
    rec = db.get(License, license_id)
    if not rec:
        raise HTTPException(404, "License not found")
    
    # Check if license is valid
    if rec.revoked:
        raise HTTPException(403, "License has been revoked")
    if rec.suspended:
        raise HTTPException(403, "License is suspended")
    
    # Verify authorization is active
    auth = db.get(ProgramAuthorization, rec.authorization_id)
    if not auth or auth.status != "active":
        raise HTTPException(403, "License authorization is not active")
    
    # Extract user information
    username = user_info.get("username")
    if not username:
        raise HTTPException(400, "username is required")
    
    email = user_info.get("email")
    user_id = user_info.get("user_id")
    program = user_info.get("program", rec.program_id)  # Use license's program if not provided
    
    # Validate program matches license
    if program not in ("emv", "tracking"):
        raise HTTPException(400, "program must be 'emv' or 'tracking'")
    if program != rec.program_id:
        raise HTTPException(400, f"Program mismatch: license is for '{rec.program_id}', but '{program}' was provided")
    
    # Log user login event in audit trail
    log_event(
        db,
        actor="user",
        action="user.login",
        ref_id=license_id,
        detail=json.dumps({
            "username": username,
            "email": email,
            "user_id": user_id,
            "program_id": rec.program_id,
            "org_id": rec.org_id,
            "login_time": datetime.utcnow().isoformat()
        }, ensure_ascii=False)
    )
    
    # Create usage event for login tracking
    from ..models.usage import UsageEvent
    usage_event = UsageEvent(
        license_id=license_id,
        org_id=rec.org_id,
        program_id=rec.program_id,
        event_type="user_login",
        feature_name="login",
        user_id=user_id or username,
        event_metadata=json.dumps({
            "username": username,
            "email": email,
            "login_time": datetime.utcnow().isoformat()
        }, ensure_ascii=False),
        ip_address=None  # Could be extracted from request if needed
    )
    db.add(usage_event)
    db.commit()
    
    return {
        "ok": True,
        "license_id": license_id,
        "program_id": rec.program_id,
        "org_id": rec.org_id,
        "username": username,
        "message": "User session tracked successfully"
    }

@router.post("/licenses/{license_id}/resend-receipt")
def resend_license_receipt(license_id: str, db: Session = Depends(db_session)):
    """
    Resend license receipt email to licensee (admin endpoint).
    
    This endpoint allows admins to resend the receipt email if the licensee
    didn't receive it or requests a new copy.
    """
    from ..services.email import send_license_receipt
    
    license_rec = db.get(License, license_id)
    if not license_rec:
        raise HTTPException(404, "License not found")
    
    success = send_license_receipt(license_id, db)
    
    if success:
        log_event(db, actor="admin", action="license.receipt.resend", ref_id=license_id)
        return {"ok": True, "message": "Receipt email sent successfully", "license_id": license_id}
    else:
        org = db.get(Organization, license_rec.org_id)
        if not org or not org.email:
            raise HTTPException(400, "No email address on file for this organization")
        raise HTTPException(500, "Failed to send email. Please check email configuration.")

# Note: Baseline management is handled by the EM&V program, not the license service
# This endpoint has been removed as baselines are not stored in the license service
