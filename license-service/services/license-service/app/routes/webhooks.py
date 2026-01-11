"""Webhook management routes."""
import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Body, Query
from sqlalchemy.orm import Session
from ..db import SessionLocal
from ..models.webhook import Webhook, WebhookDelivery
from ..admin.ui import require_admin
from ..services.webhooks import trigger_webhook

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])

def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("")
def list_webhooks(
    org_id: Optional[str] = Query(None),
    _=Depends(require_admin),
    db: Session = Depends(db_session)
):
    """List all webhooks."""
    query = db.query(Webhook)
    if org_id:
        query = query.filter(Webhook.org_id == org_id)
    
    webhooks = query.all()
    return {
        "webhooks": [{
            "id": w.id,
            "org_id": w.org_id,
            "url": w.url,
            "events": json.loads(w.events),
            "is_active": w.is_active,
            "created_at": w.created_at.isoformat(),
            "last_triggered_at": w.last_triggered_at.isoformat() if w.last_triggered_at else None
        } for w in webhooks]
    }

@router.post("")
def create_webhook(
    url: str = Body(...),
    events: List[str] = Body(...),
    org_id: Optional[str] = Body(None),
    secret: Optional[str] = Body(None),
    _=Depends(require_admin),
    db: Session = Depends(db_session)
):
    """Create a new webhook."""
    webhook = Webhook(
        org_id=org_id,
        url=url,
        secret=secret,
        events=json.dumps(events),
        is_active=True
    )
    db.add(webhook)
    db.commit()
    return {"ok": True, "webhook_id": webhook.id}

@router.get("/{webhook_id}")
def get_webhook(webhook_id: int, _=Depends(require_admin), db: Session = Depends(db_session)):
    """Get a webhook."""
    webhook = db.get(Webhook, webhook_id)
    if not webhook:
        raise HTTPException(404, "Webhook not found")
    return {
        "id": webhook.id,
        "org_id": webhook.org_id,
        "url": webhook.url,
        "events": json.loads(webhook.events),
        "is_active": webhook.is_active,
        "created_at": webhook.created_at.isoformat(),
        "last_triggered_at": webhook.last_triggered_at.isoformat() if webhook.last_triggered_at else None
    }

@router.patch("/{webhook_id}")
def update_webhook(
    webhook_id: int,
    url: Optional[str] = Body(None),
    events: Optional[List[str]] = Body(None),
    is_active: Optional[bool] = Body(None),
    secret: Optional[str] = Body(None),
    _=Depends(require_admin),
    db: Session = Depends(db_session)
):
    """Update a webhook."""
    webhook = db.get(Webhook, webhook_id)
    if not webhook:
        raise HTTPException(404, "Webhook not found")
    
    if url is not None:
        webhook.url = url
    if events is not None:
        webhook.events = json.dumps(events)
    if is_active is not None:
        webhook.is_active = is_active
    if secret is not None:
        webhook.secret = secret
    
    db.commit()
    return {"ok": True, "webhook_id": webhook_id}

@router.delete("/{webhook_id}")
def delete_webhook(webhook_id: int, _=Depends(require_admin), db: Session = Depends(db_session)):
    """Delete a webhook."""
    webhook = db.get(Webhook, webhook_id)
    if not webhook:
        raise HTTPException(404, "Webhook not found")
    db.delete(webhook)
    db.commit()
    return {"ok": True}

@router.get("/{webhook_id}/deliveries")
def list_deliveries(
    webhook_id: int,
    limit: int = Query(50, ge=1, le=100),
    _=Depends(require_admin),
    db: Session = Depends(db_session)
):
    """List webhook delivery attempts."""
    deliveries = db.query(WebhookDelivery).filter(
        WebhookDelivery.webhook_id == webhook_id
    ).order_by(WebhookDelivery.created_at.desc()).limit(limit).all()
    
    return {
        "deliveries": [{
            "id": d.id,
            "event_type": d.event_type,
            "status_code": d.status_code,
            "attempt_number": d.attempt_number,
            "delivered_at": d.delivered_at.isoformat() if d.delivered_at else None,
            "error_message": d.error_message,
            "created_at": d.created_at.isoformat()
        } for d in deliveries]
    }

@router.post("/{webhook_id}/test")
def test_webhook(
    webhook_id: int,
    event_type: str = Body("test"),
    _=Depends(require_admin),
    db: Session = Depends(db_session)
):
    """Test a webhook with a test event."""
    webhook = db.get(Webhook, webhook_id)
    if not webhook:
        raise HTTPException(404, "Webhook not found")
    
    test_payload = {
        "event": event_type,
        "test": True,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    success = trigger_webhook(webhook, event_type, test_payload, db)
    return {"ok": success, "webhook_id": webhook_id}

