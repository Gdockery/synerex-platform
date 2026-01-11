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
    """Send license receipt email to the licensee."""
    from ..models.license import License
    from ..models.org import Organization
    from ..models.billing import BillingOrder
    
    license_rec = db.get(License, license_id)
    if not license_rec:
        return False
    
    org = db.get(Organization, license_rec.org_id)
    if not org or not org.email:
        return False
    
    # Find the order to get plan information
    order = db.query(BillingOrder).filter(BillingOrder.license_id == license_id).first()
    if not order:
        return False
    
    receipt_date = datetime.utcnow().strftime("%B %d, %Y at %I:%M %p UTC")
    
    # Generate receipt email
    subject = f"License Receipt - {license_rec.license_id}"
    body_html = f"""
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }}
            .content {{ padding: 20px; max-width: 600px; margin: 0 auto; }}
            .receipt-box {{ background: #f5f5f5; border: 2px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0; }}
            .serial-number {{ background: #e3f2fd; border: 2px solid #1976d2; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }}
            .serial-number-label {{ color: #666; font-size: 14px; font-weight: 500; margin-bottom: 8px; }}
            .serial-number-value {{ font-size: 24px; font-weight: 700; color: #1976d2; font-family: 'Courier New', monospace; letter-spacing: 1px; }}
            .info-row {{ margin: 10px 0; }}
            .info-label {{ font-weight: 600; color: #666; display: inline-block; min-width: 160px; }}
            .warning-box {{ background: #fff3e0; border-left: 4px solid #ff9800; padding: 16px; margin: 20px 0; color: #e65100; }}
            .footer {{ text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>✓ License Receipt</h1>
        </div>
        <div class="content">
            <p>Dear {org.org_name},</p>
            <p>Thank you for your purchase. Your license has been successfully issued.</p>
            
            <div class="receipt-box">
                <h2 style="margin-top: 0;">Organization Details</h2>
                <div class="info-row">
                    <span class="info-label">Organization ID:</span>
                    <span>{org.org_id}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Organization Name:</span>
                    <span>{org.org_name}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Program:</span>
                    <span>{order.program_id.upper()}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Plan:</span>
                    <span>{order.plan.title()}</span>
                </div>
            </div>
            
            <div class="serial-number">
                <div class="serial-number-label">SOFTWARE LICENSE SERIAL NUMBER</div>
                <div class="serial-number-value">{license_rec.license_id}</div>
            </div>
            
            <div class="warning-box">
                <strong>⚠️ Important:</strong> Save your Software License Serial Number! You will need to enter this serial number into the login page of your {order.program_id.upper()} software.
            </div>
            
            <div style="background: #e8f5e9; border: 2px solid #4caf50; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                <h3 style="margin-top: 0; color: #2e7d32;">Quick Access</h3>
                <p style="margin: 12px 0;">Click the link below to access your {order.program_id.upper()} program:</p>
                <a href="https://license-service.synerex.com/access/{order.program_id}?license_id={license_rec.license_id}" 
                   style="display: inline-block; background: #4caf50; color: white; padding: 14px 28px; text-decoration: none; border-radius: 4px; font-weight: 600; margin: 8px 0;">
                    Access {order.program_id.upper()} Program →
                </a>
                <p style="margin: 12px 0 0 0; font-size: 14px; color: #666;">You will be asked to enter your Serial Number to verify access.</p>
            </div>
            
            <h3>How to Use Your License Serial Number</h3>
            <p><strong>When to enter your Serial Number:</strong></p>
            <ol>
                <li><strong>First-time login:</strong> When you first access the {order.program_id.upper()} software login page, you will be prompted to enter your Software License Serial Number.</li>
                <li><strong>License expiration:</strong> When your license expires, you will need to enter a new Serial Number after renewing your license.</li>
            </ol>
            <p><strong>Where to enter it:</strong> Enter the Serial Number above into the license field on the {order.program_id.upper()} software login page. The software will validate your license and grant you access.</p>
            
            <div class="footer">
                <p><strong>Receipt Date:</strong> {receipt_date}</p>
                <p>This is your official receipt. Please save for your records.</p>
                <p>Synerex License Management System</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    body_text = f"""
SYNEREX LICENSE RECEIPT
========================

Organization Details:
- Organization ID: {org.org_id}
- Organization Name: {org.org_name}
- Program: {order.program_id.upper()}
- Plan: {order.plan.title()}

License Information:
- Software License Serial Number: {license_rec.license_id}

Receipt Date: {receipt_date}

IMPORTANT: Save this receipt for your records.
You will need your Software License Serial Number to access the {order.program_id.upper()} software.

QUICK ACCESS:
Access your {order.program_id.upper()} program here:
https://license-service.synerex.com/access/{order.program_id}?license_id={license_rec.license_id}

When to enter your Serial Number:
1. First-time login: When you first access the {order.program_id.upper()} software login page
2. License expiration: When your license expires, you will need to enter a new Serial Number after renewing

Where to enter it: Enter the Serial Number into the license field on the {order.program_id.upper()} software login page.

========================
Synerex License Management System
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

