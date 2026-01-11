"""License lifecycle management service."""
from datetime import datetime, timedelta, date
from typing import List, Optional
from ..db import SessionLocal
from ..models.license import License
from ..models.authorization import ProgramAuthorization
from ..models.org import Organization
from ..config import settings
from ..audit.events import log_event
from .email import send_expiration_reminder, send_renewal_notification
from .webhooks import trigger_webhooks_for_event

def check_expiring_licenses(db) -> List[License]:
    """Find licenses expiring within the reminder window."""
    today = date.today()
    max_days = max(settings.renewal_reminder_days) if settings.renewal_reminder_days else 90
    
    cutoff_date = today + timedelta(days=max_days)
    
    licenses = db.query(License).filter(
        License.revoked == False,
        License.expires_at <= cutoff_date,
        License.expires_at > today
    ).all()
    
    return licenses

def send_expiration_reminders(db):
    """Send expiration reminder emails for licenses expiring soon."""
    licenses = check_expiring_licenses(db)
    sent_count = 0
    
    for lic in licenses:
        days_until = (lic.expires_at.date() - date.today()).days
        
        # Check if we should send a reminder for this number of days
        if days_until in settings.renewal_reminder_days:
            # Check if we've already sent a reminder for this day
            from ..models.notification import Notification
            existing = db.query(Notification).filter(
                Notification.license_id == lic.license_id,
                Notification.notification_type == "expiration_reminder",
                Notification.subject.like(f"%{days_until} days%")
            ).first()
            
            if not existing:
                if send_expiration_reminder(lic.license_id, days_until, db):
                    sent_count += 1
                    trigger_webhooks_for_event(
                        "license.expiring",
                        {
                            "license_id": lic.license_id,
                            "org_id": lic.org_id,
                            "days_until_expiry": days_until,
                            "expires_at": lic.expires_at.isoformat()
                        },
                        org_id=lic.org_id
                    )
    
    return sent_count

def handle_expired_licenses(db):
    """Handle licenses that have expired."""
    today = date.today()
    
    expired = db.query(License).filter(
        License.revoked == False,
        License.expires_at < today
    ).all()
    
    handled = 0
    for lic in expired:
        # Check if grace period applies
        if not lic.grace_period_ends_at:
            grace_end = lic.expires_at + timedelta(days=settings.grace_period_days)
            lic.grace_period_ends_at = grace_end
            db.commit()
        
        # If grace period has ended, suspend the license
        if lic.grace_period_ends_at and lic.grace_period_ends_at.date() < today:
            if not lic.suspended:
                lic.suspended = True
                lic.suspended_at = datetime.utcnow()
                lic.suspended_reason = "expired"
                db.commit()
                handled += 1
                
                trigger_webhooks_for_event(
                    "license.expired",
                    {
                        "license_id": lic.license_id,
                        "org_id": lic.org_id,
                        "expired_at": lic.expires_at.isoformat()
                    },
                    org_id=lic.org_id
                )
    
    return handled

def auto_renew_license(license_id: str, db) -> Optional[License]:
    """Automatically renew a license if auto_renew is enabled."""
    if not settings.auto_renewal_enabled:
        return None
    
    lic = db.get(License, license_id)
    if not lic or not lic.auto_renew:
        return None
    
    if lic.revoked or lic.suspended:
        return None
    
    # Get authorization
    auth = db.get(ProgramAuthorization, lic.authorization_id)
    if not auth or auth.status != "active":
        return None
    
    # Calculate new term (extend by same duration)
    old_term_days = (lic.expires_at.date() - lic.issued_at.date()).days
    new_start = lic.expires_at.date() + timedelta(days=1)
    new_end = new_start + timedelta(days=old_term_days)
    
    # Create new authorization for renewal
    from ..templates_loader import load_template
    from ..licensing import build_license_payload, sign_license
    from ..crypto.signing import load_private_key
    from pathlib import Path
    
    new_auth_id = f"{auth.authorization_id}-RENEW-{int(datetime.utcnow().timestamp())}"
    new_auth = ProgramAuthorization(
        authorization_id=new_auth_id,
        program_id=auth.program_id,
        org_id=auth.org_id,
        template_id=auth.template_id,
        status="active",
        starts_at=new_start.isoformat(),
        ends_at=new_end.isoformat(),
        scope_json=auth.scope_json,
        constraints_json=auth.constraints_json,
        bindings_override_json=auth.bindings_override_json,
        issued_by="auto_renewal"
    )
    db.add(new_auth)
    db.commit()
    
    # Issue new license
    org = db.get(Organization, lic.org_id)
    template = load_template(auth.program_id, auth.template_id)
    
    PRIV = load_private_key(Path(__file__).resolve().parents[3] / "keys" / "issuer_private.key")
    new_license_id = f"SYX-LIC-{datetime.utcnow().year}-{int(datetime.utcnow().timestamp())}"
    
    program_env = {
        "program_id": auth.program_id,
        "authorization_id": new_auth_id,
        "status": "active",
        "policy_version": template.get("policy_version", "2026.01")
    }
    
    payload = build_license_payload(
        license_id=new_license_id,
        issuer=settings.issuer_name,
        org={"org_id": org.org_id, "org_name": org.org_name, "org_type": org.org_type},
        term_start=new_start.isoformat(),
        term_end=new_end.isoformat(),
        program=program_env,
        template=template,
    )
    
    signed = sign_license(PRIV, payload, settings.key_id)
    
    import json
    new_license = License(
        license_id=new_license_id,
        org_id=org.org_id,
        program_id=auth.program_id,
        authorization_id=new_auth_id,
        expires_at=datetime.combine(new_end, datetime.min.time()),
        payload_json=json.dumps(signed, ensure_ascii=False),
        signature_b64=signed["signature"]["value"],
        key_id=settings.key_id,
        auto_renew=True,
        previous_license_id=license_id
    )
    db.add(new_license)
    
    # Link old license to new one
    lic.renewal_license_id = new_license_id
    db.commit()
    
    # Send notification
    send_renewal_notification(license_id, new_license_id, db)
    
    trigger_webhooks_for_event(
        "license.renewed",
        {
            "old_license_id": license_id,
            "new_license_id": new_license_id,
            "org_id": org.org_id
        },
        org_id=org.org_id
    )
    
    log_event(db, actor="system", action="license.auto_renew", ref_id=new_license_id, 
             detail={"previous_license_id": license_id})
    
    return new_license

def run_lifecycle_tasks(db):
    """Run all lifecycle management tasks."""
    reminders_sent = send_expiration_reminders(db)
    expired_handled = handle_expired_licenses(db)
    
    # Auto-renew eligible licenses
    auto_renewed = 0
    if settings.auto_renewal_enabled:
        expiring_soon = db.query(License).filter(
            License.auto_renew == True,
            License.revoked == False,
            License.expires_at <= date.today() + timedelta(days=7),
            License.renewal_license_id == None
        ).all()
        
        for lic in expiring_soon:
            if auto_renew_license(lic.license_id, db):
                auto_renewed += 1
    
    return {
        "reminders_sent": reminders_sent,
        "expired_handled": expired_handled,
        "auto_renewed": auto_renewed
    }

