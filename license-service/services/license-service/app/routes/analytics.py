"""Analytics and reporting routes."""
from datetime import datetime, date, timedelta
from typing import Optional, Dict, Any
import json
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..db import SessionLocal
from ..models.license import License
from ..models.usage import UsageEvent
from ..models.billing import BillingOrder
from ..models.payment import Payment
from ..models.org import Organization
from ..admin.ui import require_admin

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/revenue")
def revenue_report(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    _=Depends(require_admin),
    db: Session = Depends(db_session)
):
    """Get revenue report."""
    query = db.query(Payment).filter(Payment.status == "completed")
    
    if start_date:
        query = query.filter(Payment.completed_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(Payment.completed_at <= datetime.fromisoformat(end_date))
    
    payments = query.all()
    
    total = sum(float(p.amount) for p in payments)
    by_currency = {}
    for p in payments:
        by_currency[p.currency] = by_currency.get(p.currency, 0) + float(p.amount)
    
    return {
        "total": str(total),
        "by_currency": {k: str(v) for k, v in by_currency.items()},
        "payment_count": len(payments),
        "period": {
            "start": start_date,
            "end": end_date
        }
    }

@router.get("/usage")
def usage_report(
    license_id: Optional[str] = Query(None),
    org_id: Optional[str] = Query(None),
    program_id: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    _=Depends(require_admin),
    db: Session = Depends(db_session)
):
    """Get usage analytics."""
    query = db.query(UsageEvent)
    
    if license_id:
        query = query.filter(UsageEvent.license_id == license_id)
    if org_id:
        query = query.filter(UsageEvent.org_id == org_id)
    if program_id:
        if program_id not in ("emv", "tracking"):
            raise HTTPException(400, "program_id must be 'emv' or 'tracking'")
        query = query.filter(UsageEvent.program_id == program_id)
    if start_date:
        query = query.filter(UsageEvent.created_at >= datetime.fromisoformat(start_date))
    if end_date:
        query = query.filter(UsageEvent.created_at <= datetime.fromisoformat(end_date))
    
    events = query.all()
    
    # Group by event type
    by_type = {}
    by_feature = {}
    by_user = {}
    for event in events:
        by_type[event.event_type] = by_type.get(event.event_type, 0) + 1
        if event.feature_name:
            by_feature[event.feature_name] = by_feature.get(event.feature_name, 0) + 1
        if event.user_id:
            by_user[event.user_id] = by_user.get(event.user_id, 0) + 1
    
    return {
        "total_events": len(events),
        "by_event_type": by_type,
        "by_feature": by_feature,
        "by_user": by_user,
        "period": {
            "start": start_date,
            "end": end_date
        }
    }

@router.get("/users/{license_id}")
def get_license_users(
    license_id: str,
    _=Depends(require_admin),
    db: Session = Depends(db_session)
):
    """
    Get list of users who have logged in with a specific license.
    
    Returns all users who have created sessions for the given license,
    along with their login counts and last login time.
    """
    # Validate license exists
    rec = db.get(License, license_id)
    if not rec:
        raise HTTPException(404, "License not found")
    
    # Get all login events for this license
    login_events = db.query(UsageEvent).filter(
        UsageEvent.license_id == license_id,
        UsageEvent.event_type == "user_login"
    ).order_by(UsageEvent.created_at.desc()).all()
    
    # Group by user
    users = {}
    for event in login_events:
        user_id = event.user_id
        if not user_id:
            continue
        
        if user_id not in users:
            try:
                metadata = json.loads(event.event_metadata or "{}")
            except:
                metadata = {}
            
            users[user_id] = {
                "user_id": user_id,
                "username": metadata.get("username"),
                "email": metadata.get("email"),
                "login_count": 0,
                "first_login": event.created_at.isoformat(),
                "last_login": event.created_at.isoformat()
            }
        
        users[user_id]["login_count"] += 1
        if event.created_at.isoformat() > users[user_id]["last_login"]:
            users[user_id]["last_login"] = event.created_at.isoformat()
    
    return {
        "license_id": license_id,
        "program_id": rec.program_id,
        "org_id": rec.org_id,
        "total_users": len(users),
        "users": list(users.values())
    }

@router.get("/license-utilization")
def license_utilization(_=Depends(require_admin), db: Session = Depends(db_session)):
    """Get license utilization metrics."""
    total = db.query(License).count()
    active = db.query(License).filter(License.revoked == False, License.suspended == False).count()
    expired = db.query(License).filter(License.expires_at < datetime.utcnow()).count()
    trials = db.query(License).filter(License.is_trial == True).count()
    
    # Usage by license
    usage_by_license = db.query(
        UsageEvent.license_id,
        func.count(UsageEvent.id).label('event_count')
    ).group_by(UsageEvent.license_id).all()
    
    return {
        "total_licenses": total,
        "active_licenses": active,
        "expired_licenses": expired,
        "trial_licenses": trials,
        "utilization_rate": (active / total * 100) if total > 0 else 0,
        "usage_by_license": [
            {"license_id": lic_id, "event_count": count}
            for lic_id, count in usage_by_license
        ]
    }

@router.post("/usage/track")
def track_usage(
    license_id: str = Body(...),
    user_id: Optional[str] = Body(None),
    username: Optional[str] = Body(None),
    feature_name: str = Body(...),
    event_type: str = Body("feature_usage"),
    metadata: Optional[Dict[str, Any]] = Body(None),
    ip_address: Optional[str] = Body(None),
    db: Session = Depends(db_session)
):
    """
    Track feature usage by user.
    
    Called by EM&V or Tracking software to track when users use specific features.
    This helps the License Management Software understand usage patterns.
    
    Request body:
    - license_id: str (required) - The license serial number
    - user_id: str (optional) - Software's internal user ID
    - username: str (optional) - Username of the user
    - feature_name: str (required) - Name of the feature being used
    - event_type: str (optional, default: "feature_usage") - Type of event
    - metadata: dict (optional) - Additional metadata about the usage
    - ip_address: str (optional) - IP address of the user
    """
    # Validate license exists
    rec = db.get(License, license_id)
    if not rec:
        raise HTTPException(404, "License not found")
    
    # Check if license is valid
    if rec.revoked:
        raise HTTPException(403, "License has been revoked")
    if rec.suspended:
        raise HTTPException(403, "License is suspended")
    
    # Create usage event
    event = UsageEvent(
        license_id=license_id,
        org_id=rec.org_id,
        program_id=rec.program_id,
        event_type=event_type,
        feature_name=feature_name,
        user_id=user_id or username,
        event_metadata=json.dumps(metadata or {}, ensure_ascii=False),
        ip_address=ip_address
    )
    db.add(event)
    db.commit()
    
    return {
        "ok": True,
        "event_id": event.id,
        "license_id": license_id,
        "program_id": rec.program_id,
        "org_id": rec.org_id,
        "feature_name": feature_name,
        "tracked_at": event.created_at.isoformat()
    }

