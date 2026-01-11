"""Webhook delivery service."""
import json
import hmac
import hashlib
import requests
from typing import List, Dict, Any, Optional
from datetime import datetime
from ..config import settings
from ..db import SessionLocal
from ..models.webhook import Webhook, WebhookDelivery
from ..audit.events import log_event

def trigger_webhook(webhook: Webhook, event_type: str, payload: Dict[str, Any], db) -> bool:
    """Trigger a webhook delivery."""
    delivery = WebhookDelivery(
        webhook_id=webhook.id,
        event_type=event_type,
        payload=json.dumps(payload, ensure_ascii=False),
        attempt_number=1
    )
    db.add(delivery)
    db.commit()
    
    return _deliver_webhook(webhook, delivery, db)

def _deliver_webhook(webhook: Webhook, delivery: WebhookDelivery, db) -> bool:
    """Actually deliver the webhook with retry logic."""
    headers = {
        "Content-Type": "application/json",
        "User-Agent": "Synerex-License-Service/1.0",
        "X-Webhook-Event": delivery.event_type,
        "X-Webhook-ID": str(webhook.id)
    }
    
    # Add HMAC signature if secret is configured
    if webhook.secret:
        signature = hmac.new(
            webhook.secret.encode(),
            delivery.payload.encode(),
            hashlib.sha256
        ).hexdigest()
        headers["X-Webhook-Signature"] = f"sha256={signature}"
    
    try:
        response = requests.post(
            webhook.url,
            data=delivery.payload,
            headers=headers,
            timeout=settings.webhook_timeout_seconds
        )
        
        delivery.status_code = response.status_code
        delivery.response_body = response.text[:1000]  # Limit response size
        
        if 200 <= response.status_code < 300:
            delivery.delivered_at = datetime.utcnow()
            webhook.last_triggered_at = datetime.utcnow()
            db.commit()
            return True
        else:
            # Retry logic
            if delivery.attempt_number < settings.webhook_max_retries:
                delivery.attempt_number += 1
                db.commit()
                # In production, use a task queue for retries
                return False
            else:
                delivery.error_message = f"Failed after {delivery.attempt_number} attempts: {response.status_code}"
                db.commit()
                return False
                
    except Exception as e:
        delivery.error_message = str(e)
        if delivery.attempt_number < settings.webhook_max_retries:
            delivery.attempt_number += 1
            db.commit()
            return False
        else:
            db.commit()
            return False

def trigger_webhooks_for_event(event_type: str, payload: Dict[str, Any], org_id: Optional[str] = None):
    """Trigger all relevant webhooks for an event."""
    db = SessionLocal()
    try:
        # Get active webhooks that subscribe to this event
        query = db.query(Webhook).filter(Webhook.is_active == True)
        if org_id:
            query = query.filter((Webhook.org_id == org_id) | (Webhook.org_id == None))
        
        webhooks = query.all()
        
        for webhook in webhooks:
            try:
                events = json.loads(webhook.events)
                if "*" in events or event_type in events:
                    trigger_webhook(webhook, event_type, payload, db)
            except Exception as e:
                log_event(db, actor="system", action="webhook.error", ref_id=str(webhook.id), detail={"error": str(e)})
    finally:
        db.close()

