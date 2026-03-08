"""Email notification service."""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from ..config import settings
from ..db import SessionLocal
from ..models.notification import Notification, NotificationStatus
from datetime import datetime

def send_email(
    to_email: str,
    subject: str,
    body_html: str,
    body_text: Optional[str] = None,
    org_id: Optional[str] = None,
    license_id: Optional[str] = None,
    notification_type: str = "system"
) -> bool:
    """Send an email and log the notification."""
    if not settings.smtp_host:
        # Email not configured, just log
        print(f"[EMAIL] Would send to {to_email}: {subject}")
        return False
    
    db = SessionLocal()
    notification = None
    try:
        # Create notification record
        notification = Notification(
            org_id=org_id or "system",
            license_id=license_id,
            notification_type=notification_type,
            status=NotificationStatus.PENDING.value,
            recipient_email=to_email,
            subject=subject,
            body=body_html
        )
        db.add(notification)
        db.commit()
        
        # Send email
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = settings.smtp_from_email
        msg['To'] = to_email
        
        if body_text:
            msg.attach(MIMEText(body_text, 'plain'))
        msg.attach(MIMEText(body_html, 'html'))
        
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            if settings.smtp_use_tls:
                server.starttls()
            if settings.smtp_username and settings.smtp_password:
                server.login(settings.smtp_username, settings.smtp_password)
            server.send_message(msg)
        
        # Update notification status
        notification.status = NotificationStatus.SENT.value
        notification.sent_at = datetime.utcnow()
        db.commit()
        return True
        
    except Exception as e:
        if notification:
            notification.status = NotificationStatus.FAILED.value
            notification.error_message = str(e)
            db.commit()
        print(f"[EMAIL ERROR] Failed to send to {to_email}: {e}")
        return False
    finally:
        db.close()

def send_expiration_reminder(license_id: str, days_until_expiry: int, db) -> bool:
    """Send expiration reminder email."""
    from ..models.license import License
    from ..models.org import Organization
    
    license_rec = db.get(License, license_id)
    if not license_rec:
        return False
    
    org = db.get(Organization, license_rec.org_id)
    if not org or not org.email:
        return False
    
    subject = f"License Expiring Soon: {days_until_expiry} days remaining"
    body_html = f"""
    <html>
    <body>
        <h2>License Expiration Reminder</h2>
        <p>Dear {org.org_name},</p>
        <p>Your license <strong>{license_id}</strong> will expire in {days_until_expiry} days.</p>
        <p>Please renew your license to continue using the service.</p>
        <p>Best regards,<br>Synerex License Service</p>
    </body>
    </html>
    """
    
    return send_email(
        to_email=org.email,
        subject=subject,
        body_html=body_html,
        org_id=org.org_id,
        license_id=license_id,
        notification_type="expiration_reminder"
    )

def send_renewal_notification(license_id: str, new_license_id: str, db) -> bool:
    """Send license renewal notification."""
    from ..models.license import License
    from ..models.org import Organization
    
    license_rec = db.get(License, license_id)
    if not license_rec:
        return False
    
    org = db.get(Organization, license_rec.org_id)
    if not org or not org.email:
        return False
    
    subject = "License Renewed Successfully"
    body_html = f"""
    <html>
    <body>
        <h2>License Renewed</h2>
        <p>Dear {org.org_name},</p>
        <p>Your license has been successfully renewed.</p>
        <p><strong>Previous License:</strong> {license_id}</p>
        <p><strong>New License:</strong> {new_license_id}</p>
        <p>Thank you for your continued business.</p>
        <p>Best regards,<br>Synerex License Service</p>
    </body>
    </html>
    """
    
    return send_email(
        to_email=org.email,
        subject=subject,
        body_html=body_html,
        org_id=org.org_id,
        license_id=new_license_id,
        notification_type="renewal_reminder"
    )

def send_license_receipt(license_id: str, db) -> bool:
    """Send OEM-branded license receipt email to the licensee."""
    from ..models.license import License
    from ..models.org import Organization
    from ..models.billing import BillingOrder
    import urllib.request as _ur
    import json as _json

    license_rec = db.get(License, license_id)
    if not license_rec:
        return False

    org = db.get(Organization, license_rec.org_id)
    if not org or not org.email:
        return False

    order = db.query(BillingOrder).filter(BillingOrder.license_id == license_id).first()
    if not order:
        return False

    receipt_date = datetime.utcnow().strftime("%B %d, %Y at %I:%M %p UTC")

    # Resolve OEM branding: check org's sponsor_org_id first, then org itself if it's an OEM
    oem_branding: dict = {}
    sponsor_org_id = getattr(org, "sponsor_org_id", None)
    lookup_org_id = sponsor_org_id or (org.org_id if getattr(org, "org_type", "") == "oem" else None)
    if lookup_org_id:
        try:
            tracking_url = (settings.tracking_program_url or "http://tracking-program:8087").rstrip("/")
            branding_url = f"{tracking_url}/api/whitelabel/oem-branding-by-org?org_id={lookup_org_id}"
            with _ur.urlopen(branding_url, timeout=2) as _resp:
                _data = _json.loads(_resp.read())
                if isinstance(_data, dict) and _data.get("brand_name"):
                    oem_branding = _data
        except Exception:
            pass

    brand_name = oem_branding.get("brand_name") or "Synerex"
    primary_color = oem_branding.get("primary_color") or "#7c3aed"
    oem_logo_url = oem_branding.get("logo_url") or ""
    oem_website = oem_branding.get("website_url") or ""

    # OEM logo block for email header
    logo_html = ""
    if oem_logo_url:
        logo_html = f'<img src="{oem_logo_url}" alt="{brand_name}" style="max-height:56px;max-width:180px;margin-bottom:10px;display:block;margin-left:auto;margin-right:auto;" />'

    subject = f"License Receipt — {brand_name} Energy Portal"

    body_html = f"""<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/>
<style>
  body{{font-family:Arial,sans-serif;line-height:1.6;color:#333;margin:0;padding:0;background:#f3f4f6;}}
  .wrap{{max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);}}
  .hdr{{background:{primary_color};padding:28px 36px;text-align:center;}}
  .hdr h1{{color:#fff;margin:8px 0 0;font-size:20px;}}
  .body{{padding:32px 36px;}}
  .receipt-box{{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:20px 0;}}
  .row{{margin:8px 0;font-size:14px;}}
  .lbl{{font-weight:600;color:#6b7280;display:inline-block;min-width:160px;}}
  .serial{{background:#ede9fe;border:2px solid {primary_color};border-radius:8px;padding:20px;text-align:center;margin:20px 0;}}
  .serial-lbl{{color:#6b7280;font-size:13px;font-weight:500;margin-bottom:6px;}}
  .serial-val{{font-size:22px;font-weight:700;color:{primary_color};font-family:'Courier New',monospace;letter-spacing:1px;}}
  .warn{{background:#fff7ed;border-left:4px solid #f97316;padding:14px 16px;margin:20px 0;color:#c2410c;font-size:14px;}}
  .cc-note{{background:#faf5ff;border:1px solid #d8b4fe;border-radius:8px;padding:16px;margin:20px 0;font-size:13px;color:#6b21a8;}}
  .ftr{{background:#f9fafb;padding:20px 36px;text-align:center;border-top:1px solid #e5e7eb;}}
  .powered{{margin:8px 0 0;font-size:12px;color:#9ca3af;}}
  .powered strong{{color:#7c3aed;}}
</style>
</head>
<body>
<div class="wrap">
  <div class="hdr">
    {logo_html}
    <h1>✓ License Receipt — {brand_name}</h1>
  </div>
  <div class="body">
    <p>Dear {org.org_name},</p>
    <p>Thank you for your purchase. Your license has been successfully issued.</p>

    <div class="receipt-box">
      <div style="font-weight:600;font-size:15px;margin-bottom:12px;">Organization &amp; Order Details</div>
      <div class="row"><span class="lbl">Organization:</span> {org.org_name}</div>
      <div class="row"><span class="lbl">Organization ID:</span> {org.org_id}</div>
      <div class="row"><span class="lbl">Program:</span> {order.program_id.upper()}</div>
      <div class="row"><span class="lbl">Plan:</span> {order.plan.title()}</div>
      <div class="row"><span class="lbl">Receipt Date:</span> {receipt_date}</div>
    </div>

    <div class="serial">
      <div class="serial-lbl">SOFTWARE LICENSE SERIAL NUMBER</div>
      <div class="serial-val">{license_rec.license_id}</div>
    </div>

    <div class="warn">
      <strong>Important:</strong> Save your Software License Serial Number — you will need it to activate your {order.program_id.upper()} software.
    </div>

    <div class="cc-note">
      <strong>Credit / Debit Card Statement Notice:</strong><br/>
      Your card statement will show a charge from <strong>Synerex Laboratories, LLC</strong>.
      This is the technology provider that powers the {brand_name} platform.
      Please retain this receipt as your record of purchase.
    </div>

    <div style="background:#f0fdf4;border:2px solid #4ade80;border-radius:8px;padding:20px;margin:20px 0;text-align:center;">
      <div style="font-weight:600;font-size:15px;color:#166534;margin-bottom:8px;">Quick Access</div>
      <p style="font-size:14px;color:#374151;margin:8px 0;">Click below to access your {order.program_id.upper()} program:</p>
      <a href="{settings.website_url or 'http://localhost:8080'}/license/access/{order.program_id}?license_id={license_rec.license_id}"
         style="display:inline-block;background:#16a34a;color:#fff;padding:12px 28px;text-decoration:none;border-radius:6px;font-weight:600;font-size:15px;margin:8px 0;">
        Access {order.program_id.upper()} Program →
      </a>
      <p style="font-size:12px;color:#6b7280;margin:8px 0 0;">You will be asked to enter your Serial Number to verify access.</p>
    </div>

    <p style="font-size:14px;color:#374151;">This is your official receipt. Please save it for your records.</p>
  </div>
  <div class="ftr">
    <p class="powered">Powered by <strong>Synerex</strong> Energy Corporation</p>
    <p style="font-size:11px;color:#9ca3af;margin:4px 0 0;">&copy; Synerex Laboratories, LLC. All rights reserved.</p>
    {f'<p style="font-size:11px;color:#9ca3af;margin:4px 0 0;"><a href="{oem_website}" style="color:{primary_color};">{brand_name}</a></p>' if oem_website else ''}
  </div>
</div>
</body>
</html>"""

    body_text = f"""LICENSE RECEIPT — {brand_name.upper()}
{"=" * 50}

Organization: {org.org_name}
Organization ID: {org.org_id}
Program: {order.program_id.upper()}
Plan: {order.plan.title()}
Receipt Date: {receipt_date}

SOFTWARE LICENSE SERIAL NUMBER:
{license_rec.license_id}

IMPORTANT: Save this Serial Number — you will need it to activate your {order.program_id.upper()} software.

CREDIT / DEBIT CARD STATEMENT NOTICE:
Your card statement will show a charge from Synerex Laboratories, LLC.
This is the technology provider that powers the {brand_name} platform.
Please retain this receipt as your record of purchase.

{"=" * 50}
Powered by Synerex Laboratories, LLC
This is your official receipt. Please save for your records.
"""

    return send_email(
        to_email=org.email,
        subject=subject,
        body_html=body_html,
        body_text=body_text,
        org_id=org.org_id,
        license_id=license_rec.license_id,
        notification_type="license_receipt"
    )

