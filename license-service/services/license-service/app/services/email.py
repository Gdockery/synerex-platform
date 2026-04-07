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
    """Send expiration reminder email with renewal link."""
    from ..models.license import License
    from ..models.org import Organization

    license_rec = db.get(License, license_id)
    if not license_rec:
        return False

    org = db.get(Organization, license_rec.org_id)
    if not org or not org.email:
        return False

    base_url = (settings.website_url or "http://localhost:8080").rstrip("/")
    root_pfx = (settings.root_path or "").rstrip("/")
    renewal_url = f"{base_url}{root_pfx}/register/renew?org_id={org.org_id}"

    urgency_color = "#e65100" if days_until_expiry <= 7 else ("#f59e0b" if days_until_expiry <= 30 else "#4a5568")
    subject = f"Action Required: Your subscription expires in {days_until_expiry} day{'s' if days_until_expiry != 1 else ''}"

    body_html = f"""
    <html>
    <body style="font-family:system-ui,sans-serif;background:#f7fafc;margin:0;padding:2rem 1rem;">
      <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:10px;box-shadow:0 2px 12px rgba(0,0,0,.08);overflow:hidden;">
        <div style="background:#4c1d95;padding:1.75rem 2rem;text-align:center;">
          <h2 style="color:#fff;margin:0;font-size:1.35rem;">Subscription Renewal Reminder</h2>
        </div>
        <div style="padding:2rem;">
          <p style="color:#374151;font-size:1rem;">Dear <strong>{org.org_name}</strong>,</p>
          <div style="background:#fff3e0;border-left:4px solid {urgency_color};padding:1rem 1.25rem;border-radius:6px;margin:1.25rem 0;">
            <p style="margin:0;color:{urgency_color};font-weight:700;font-size:1rem;">
              Your Tracking portal subscription expires in <span style="font-size:1.3rem;">{days_until_expiry}</span> day{'s' if days_until_expiry != 1 else ''}.
            </p>
          </div>
          <p style="color:#4b5563;font-size:0.95rem;">To avoid any interruption in service, please renew your subscription before it expires.</p>
          <p style="color:#4b5563;font-size:0.875rem;margin-top:0.5rem;">License ID: <code style="background:#f3f4f6;padding:0.2rem 0.4rem;border-radius:4px;">{license_id}</code></p>
          <div style="text-align:center;margin:2rem 0;">
            <a href="{renewal_url}" style="background:#4c1d95;color:#fff;padding:0.85rem 2rem;border-radius:8px;text-decoration:none;font-weight:700;font-size:1rem;display:inline-block;">
              Renew My Subscription &rarr;
            </a>
          </div>
          <p style="color:#9ca3af;font-size:0.8rem;text-align:center;">
            Or copy this link: <a href="{renewal_url}" style="color:#7c3aed;">{renewal_url}</a>
          </p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:1.5rem 0;"/>
          <p style="color:#9ca3af;font-size:0.8rem;">This is an automated reminder. If you have questions, contact your account manager.</p>
        </div>
      </div>
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


def send_account_activated_email(org_id: str, license_id: str, db) -> bool:
    """Send account activation confirmation email to Client Admin after manual activation by Synerex Admin."""
    from ..models.org import Organization
    from ..models.user import User
    from ..models.license import License

    org = db.get(Organization, org_id)
    if not org or not org.email:
        return False

    client_user = db.query(User).filter(User.org_id == org_id).order_by(User.username).first()
    client_username = client_user.username if client_user else None

    # Fetch license expiry date
    license_rec = db.get(License, license_id) if license_id else None
    expires_at = license_rec.expires_at if license_rec else None
    expiry_str = expires_at.strftime("%B %d, %Y") if expires_at else None

    # Resolve OEM branding if org has a sponsor
    brand_name = "Synerex"
    portal_url = (settings.website_url or "http://localhost:8080").rstrip("/")
    login_url = f"{portal_url}/tracking/#/login"
    if org.sponsor_org_id:
        try:
            import urllib.request as _ur
            import json as _json
            _tracking_url = (getattr(settings, "tracking_program_url", None) or "http://tracking-program:8087").rstrip("/")
            with _ur.urlopen(f"{_tracking_url}/api/whitelabel/oem-branding-by-org?org_id={org.sponsor_org_id}", timeout=3) as _resp:
                _d = _json.loads(_resp.read().decode())
                brand_name = _d.get("brand_name") or brand_name
        except Exception:
            pass

    subject = f"Your {brand_name} Tracking Portal is Now Active"

    username_block = ""
    if client_username:
        username_block = f"""
          <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:1.25rem 1.5rem;margin:1.25rem 0;text-align:center;">
            <p style="margin:0 0 0.35rem 0;color:#166534;font-size:0.85rem;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;">Your Login Username</p>
            <p style="margin:0;color:#14532d;font-size:1.6rem;font-weight:800;font-family:monospace;">{client_username}</p>
          </div>"""

    expiry_block = ""
    if expiry_str:
        expiry_block = f"""
          <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:1rem 1.25rem;margin:1.25rem 0;">
            <p style="margin:0;color:#92400e;font-size:0.875rem;">
              <strong>&#128197; Subscription expires:</strong> {expiry_str}
            </p>
            <p style="margin:0.4rem 0 0;color:#b45309;font-size:0.8rem;">
              You will receive renewal reminder emails before this date. Renewing takes just a few minutes through the portal.
            </p>
          </div>"""

    body_html = f"""
    <html>
    <body style="font-family:system-ui,sans-serif;background:#f7fafc;margin:0;padding:2rem 1rem;">
      <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:10px;box-shadow:0 2px 12px rgba(0,0,0,.08);overflow:hidden;">
        <div style="background:#4c1d95;padding:1.75rem 2rem;text-align:center;">
          <h2 style="color:#fff;margin:0;font-size:1.35rem;">Your Account is Now Active!</h2>
        </div>
        <div style="padding:2rem;">
          <p style="color:#374151;font-size:1rem;">Dear <strong>{org.org_name}</strong>,</p>
          <p style="color:#4b5563;font-size:0.95rem;margin:0.75rem 0;">
            Great news! Your <strong>{brand_name} Tracking Portal</strong> subscription has been activated.
            You can now log in and start using the portal.
          </p>
          {username_block}
          <div style="text-align:center;margin:2rem 0;">
            <a href="{login_url}" style="background:#4c1d95;color:#fff;padding:0.85rem 2rem;border-radius:8px;text-decoration:none;font-weight:700;font-size:1rem;display:inline-block;">
              Log In to {brand_name} Portal &rarr;
            </a>
          </div>
          <div style="background:#f3f4f6;border-radius:8px;padding:1rem 1.25rem;margin-top:1.25rem;">
            <p style="margin:0 0 0.5rem 0;color:#374151;font-weight:700;font-size:0.9rem;">What's included:</p>
            <ul style="margin:0;padding-left:1.25rem;color:#4b5563;font-size:0.875rem;line-height:1.8;">
              <li>Full access to the Tracking dashboard</li>
              <li>Project and equipment management</li>
              <li>Annual subscription — renews each year</li>
            </ul>
          </div>
          {expiry_block}
          <p style="color:#9ca3af;font-size:0.8rem;margin-top:1.5rem;text-align:center;">
            License ID: <code style="background:#f3f4f6;padding:0.2rem 0.4rem;border-radius:4px;">{license_id}</code>
          </p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:1.5rem 0;"/>
          <p style="color:#9ca3af;font-size:0.8rem;">If you have questions, contact your account manager.</p>
        </div>
      </div>
    </body>
    </html>
    """

    return send_email(
        to_email=org.email,
        subject=subject,
        body_html=body_html,
        org_id=org_id,
        license_id=license_id,
        notification_type="account_activated"
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

    # Build branded portal login URL so it appears in the receipt email
    portal_login_url = ""
    if sponsor_org_id:
        _pub = (settings.website_url or "").rstrip("/")
        if not _pub:
            _pub = (settings.tracking_program_url or "http://localhost:8087").rstrip("/")
        portal_login_url = f"{_pub}/auth/login?oem={sponsor_org_id}"

    # Resolve Client Admin's username for the receipt email
    client_username = None
    from ..models.user import User as _User
    _client_user = db.query(_User).filter(_User.org_id == org.org_id).order_by(_User.username).first()
    if _client_user:
        client_username = _client_user.username

    # OEM logo block for email header
    logo_html = ""
    if oem_logo_url:
        logo_html = f'<img src="{oem_logo_url}" alt="{brand_name}" style="max-height:56px;max-width:180px;margin-bottom:10px;display:block;margin-left:auto;margin-right:auto;" />'

    # Build username block for receipt email (plain string, no nested f-string)
    if client_username:
        username_html_block = (
            '<div style="background:#ede9fe;border:2px solid ' + primary_color + ';border-radius:8px;'
            'padding:18px 20px;margin:20px 0;text-align:center;">'
            '<div style="font-size:0.78rem;color:#6b7280;font-weight:600;text-transform:uppercase;'
            'letter-spacing:.05em;margin-bottom:6px;">Your Login Username</div>'
            '<div style="font-size:1.6rem;font-weight:800;color:' + primary_color + ';'
            'font-family:\'Courier New\',monospace;">' + client_username + '</div>'
            '<div style="font-size:0.82rem;color:#6b7280;margin-top:6px;">'
            'Use this username and the password you set during signup to log in.</div>'
            '</div>'
        )
    else:
        username_html_block = ""

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

    {username_html_block}
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
      {"" if not portal_login_url else f'''
      <p style="font-size:14px;color:#374151;margin:8px 0;">Click below to go directly to your {brand_name} portal:</p>
      <a href="{portal_login_url}"
         style="display:inline-block;background:{primary_color};color:#fff;padding:13px 32px;text-decoration:none;border-radius:7px;font-weight:700;font-size:15px;margin:8px 0;">
        Access {brand_name} Portal →
      </a>
      <p style="font-size:12px;color:#6b7280;margin:8px 0 0;">{portal_login_url}</p>
      '''}
      {"" if portal_login_url else f'''
      <p style="font-size:14px;color:#374151;margin:8px 0;">Click below to access your {order.program_id.upper()} program:</p>
      <a href="{settings.website_url or 'http://localhost:8080'}/license/access/{order.program_id}?license_id={license_rec.license_id}"
         style="display:inline-block;background:#16a34a;color:#fff;padding:12px 28px;text-decoration:none;border-radius:6px;font-weight:600;font-size:15px;margin:8px 0;">
        Access {order.program_id.upper()} Program →
      </a>
      '''}
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


def send_oem_invitation_email(
    to_email: str,
    org_name: str,
    org_id: str,
    temp_password: str,
    login_url: str,
    is_reset: bool = False,
) -> bool:
    """Send OEM partner invitation (or credential reset) email."""
    action = "reset" if is_reset else "invitation"
    subject = f"{'Your Synerex OEM Login Has Been Updated' if is_reset else 'Welcome to Synerex — OEM Partner Access'}"

    base_url = (settings.website_url or "http://localhost:8080").rstrip("/")
    root_pfx = getattr(settings, "root_path", "") or ""
    root_pfx = root_pfx.rstrip("/")
    change_pw_url = f"{base_url}{root_pfx}/auth/change-password"
    oem_admin_url = f"{base_url}{root_pfx}/oem-admin"

    body_html = f"""<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/>
<style>
  body{{font-family:Arial,sans-serif;line-height:1.6;color:#333;margin:0;padding:0;background:#f3f4f6;}}
  .wrap{{max-width:580px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);}}
  .hdr{{background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:28px 36px;text-align:center;}}
  .hdr h1{{color:#fff;margin:0;font-size:22px;font-weight:700;}}
  .hdr p{{color:#ddd6fe;margin:6px 0 0;font-size:14px;}}
  .body{{padding:32px 36px;}}
  .creds-box{{background:#f5f3ff;border:2px solid #7c3aed;border-radius:8px;padding:20px;margin:20px 0;}}
  .creds-box .title{{font-weight:700;color:#5b21b6;font-size:14px;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:12px;}}
  .cred-row{{margin:8px 0;font-size:14px;}}
  .cred-lbl{{font-weight:600;color:#6b7280;display:inline-block;min-width:130px;}}
  .cred-val{{font-family:'Courier New',monospace;background:#ede9fe;padding:2px 8px;border-radius:4px;color:#4c1d95;font-size:13px;}}
  .steps-box{{background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:20px;margin:20px 0;}}
  .steps-box .title{{font-weight:700;color:#166534;font-size:14px;margin-bottom:12px;}}
  .step{{margin:8px 0;font-size:14px;color:#374151;display:flex;gap:10px;}}
  .step-num{{background:#16a34a;color:#fff;border-radius:50%;width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;margin-top:1px;}}
  .warn{{background:#fffbeb;border-left:4px solid #f59e0b;padding:14px 16px;margin:20px 0;color:#92400e;font-size:13px;border-radius:0 6px 6px 0;}}
  .btn-wrap{{text-align:center;margin:24px 0;}}
  .btn{{display:inline-block;background:#7c3aed;color:#fff;padding:13px 32px;text-decoration:none;border-radius:7px;font-weight:700;font-size:15px;}}
  .ftr{{background:#f9fafb;padding:20px 36px;text-align:center;border-top:1px solid #e5e7eb;}}
  .powered{{font-size:12px;color:#9ca3af;margin:0;}}
  .powered strong{{color:#7c3aed;}}
</style>
</head>
<body>
<div class="wrap">
  <div class="hdr">
    <h1>{'&#128274; Credentials Updated' if is_reset else '&#127881; Welcome, OEM Partner!'}</h1>
    <p>{'Your Synerex partner login has been reset.' if is_reset else 'Your Synerex OEM partner account is ready.'}</p>
  </div>
  <div class="body">
    <p>Hello,</p>
    <p>{'Your OEM partner credentials for <strong>' + org_name + '</strong> have been updated by Synerex.' if is_reset else 'You have been set up as an OEM partner on the Synerex platform for <strong>' + org_name + '</strong>. As a partner, you can manage your customer organizations and distribute access to the Tracking Program.'}</p>

    <div class="creds-box">
      <div class="title">&#128272; Your Login Credentials</div>
      <div class="cred-row"><span class="cred-lbl">Email:</span> <span class="cred-val">{to_email}</span></div>
      <div class="cred-row"><span class="cred-lbl">Temp Password:</span> <span class="cred-val">{temp_password}</span></div>
      <div class="cred-row"><span class="cred-lbl">Login URL:</span> <a href="{login_url}" style="color:#5b21b6;">{login_url}</a></div>
    </div>

    <div class="warn">
      <strong>Security:</strong> This is a temporary password. Please change it immediately after logging in.
      <br/><a href="{change_pw_url}" style="color:#92400e;">Change your password &rarr;</a>
    </div>

    <div class="steps-box">
      <div class="title">&#128204; Getting Started</div>
      <div class="step"><span class="step-num">1</span><span>Click the login link above and sign in with your credentials.</span></div>
      <div class="step"><span class="step-num">2</span><span>Change your password from the temporary one provided.</span></div>
      <div class="step"><span class="step-num">3</span><span>Go to the <a href="{oem_admin_url}" style="color:#166534;">OEM Admin Panel</a> to view and manage your customer organizations.</span></div>
      <div class="step"><span class="step-num">4</span><span>For each customer, click <strong>"Set Up Admin"</strong> to create their Client Admin account and share their branded login link.</span></div>
    </div>

    <div class="btn-wrap">
      <a href="{login_url}" class="btn">Sign In as OEM Partner &rarr;</a>
    </div>

    <p style="font-size:13px;color:#6b7280;">If you have any questions, contact Synerex support. Do not share your credentials with anyone.</p>
  </div>
  <div class="ftr">
    <p class="powered">Powered by <strong>Synerex</strong> Energy Corporation</p>
    <p style="font-size:11px;color:#9ca3af;margin:4px 0 0;">&copy; Synerex Laboratories, LLC. All rights reserved.</p>
  </div>
</div>
</body>
</html>"""

    body_text = f"""{'CREDENTIALS UPDATED — SYNEREX OEM PARTNER' if is_reset else 'WELCOME TO SYNEREX — OEM PARTNER ACCESS'}
{'=' * 55}

Hello,

{'Your OEM partner credentials for ' + org_name + ' have been updated.' if is_reset else 'You have been set up as an OEM partner on the Synerex platform for ' + org_name + '.'}

YOUR LOGIN CREDENTIALS:
  Email:          {to_email}
  Temp Password:  {temp_password}
  Login URL:      {login_url}

SECURITY: This is a temporary password. Change it immediately:
  {change_pw_url}

GETTING STARTED:
  1. Visit the login link above and sign in.
  2. Change your password immediately.
  3. Go to the OEM Admin Panel: {oem_admin_url}
  4. For each customer, click "Set Up Admin" and share their branded login link.

{'=' * 55}
Synerex Laboratories, LLC — Do not share your credentials.
"""

    return send_email(
        to_email=to_email,
        subject=subject,
        body_html=body_html,
        body_text=body_text,
        org_id=org_id,
        notification_type="oem_invitation" if not is_reset else "oem_credentials_reset",
    )


def send_client_admin_invitation_email(
    to_email: str,
    client_org_name: str,
    client_org_id: str,
    oem_org_name: str,
    temp_password: str,
    oem_login_url: str,
    client_portal_url: str,
    is_reset: bool = False,
) -> bool:
    """Send Client Admin invitation (or credential reset) from OEM setup."""
    subject = (
        f"Your {oem_org_name} Partner Portal Access Has Been Updated"
        if is_reset
        else f"Welcome — You\'ve Been Set Up as Admin for {client_org_name}"
    )

    base_url = (settings.website_url or "http://localhost:8080").rstrip("/")
    root_pfx = getattr(settings, "root_path", "") or ""
    root_pfx = root_pfx.rstrip("/")
    change_pw_url = f"{base_url}{root_pfx}/auth/change-password"

    body_html = f"""<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/>
<style>
  body{{font-family:Arial,sans-serif;line-height:1.6;color:#333;margin:0;padding:0;background:#f3f4f6;}}
  .wrap{{max-width:580px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);}}
  .hdr{{background:linear-gradient(135deg,#0369a1,#075985);padding:28px 36px;text-align:center;}}
  .hdr h1{{color:#fff;margin:0;font-size:21px;font-weight:700;}}
  .hdr p{{color:#bae6fd;margin:6px 0 0;font-size:14px;}}
  .body{{padding:32px 36px;}}
  .creds-box{{background:#f0f9ff;border:2px solid #0369a1;border-radius:8px;padding:20px;margin:20px 0;}}
  .creds-box .title{{font-weight:700;color:#0c4a6e;font-size:14px;text-transform:uppercase;letter-spacing:.05em;margin-bottom:12px;}}
  .cred-row{{margin:8px 0;font-size:14px;}}
  .cred-lbl{{font-weight:600;color:#6b7280;display:inline-block;min-width:130px;}}
  .cred-val{{font-family:\'Courier New\',monospace;background:#e0f2fe;padding:2px 8px;border-radius:4px;color:#0c4a6e;font-size:13px;}}
  .steps-box{{background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:20px;margin:20px 0;}}
  .steps-box .title{{font-weight:700;color:#166534;font-size:14px;margin-bottom:12px;}}
  .step{{margin:8px 0;font-size:14px;color:#374151;display:flex;gap:10px;}}
  .step-num{{background:#16a34a;color:#fff;border-radius:50%;width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;margin-top:1px;}}
  .warn{{background:#fffbeb;border-left:4px solid #f59e0b;padding:14px 16px;margin:20px 0;color:#92400e;font-size:13px;border-radius:0 6px 6px 0;}}
  .btn-wrap{{text-align:center;margin:24px 0;}}
  .btn{{display:inline-block;background:#0369a1;color:#fff;padding:13px 32px;text-decoration:none;border-radius:7px;font-weight:700;font-size:15px;}}
  .ftr{{background:#f9fafb;padding:20px 36px;text-align:center;border-top:1px solid #e5e7eb;}}
  .powered{{font-size:12px;color:#9ca3af;margin:0;}}
  .powered strong{{color:#7c3aed;}}
</style>
</head>
<body>
<div class="wrap">
  <div class="hdr">
    <h1>{'&#128272; Access Updated' if is_reset else '&#127881; Welcome, Client Admin!'}</h1>
    <p>{'Your admin access for ' + client_org_name + ' has been reset.' if is_reset else 'You have been set up as admin for ' + client_org_name + ' via ' + oem_org_name + '.'}</p>
  </div>
  <div class="body">
    <p>Hello,</p>
    <p>{'Your admin credentials for <strong>' + client_org_name + '</strong> have been updated by <strong>' + oem_org_name + '</strong>.' if is_reset else '<strong>' + oem_org_name + '</strong> has set you up as the Client Admin for <strong>' + client_org_name + '</strong>. As Client Admin, you can add and manage the users in your organization.'}</p>

    <div class="creds-box">
      <div class="title">&#128272; Your Login Credentials</div>
      <div class="cred-row"><span class="cred-lbl">Email:</span> <span class="cred-val">{to_email}</span></div>
      <div class="cred-row"><span class="cred-lbl">Temp Password:</span> <span class="cred-val">{temp_password}</span></div>
      <div class="cred-row"><span class="cred-lbl">Login URL:</span> <a href="{oem_login_url}" style="color:#0369a1;">{oem_login_url}</a></div>
    </div>

    <div class="warn">
      <strong>Security:</strong> This is a temporary password. Please change it immediately after logging in.
      <br/><a href="{change_pw_url}" style="color:#92400e;">Change your password &rarr;</a>
    </div>

    <div class="steps-box">
      <div class="title">&#128204; Getting Started</div>
      <div class="step"><span class="step-num">1</span><span>Click the login link above and sign in with your credentials.</span></div>
      <div class="step"><span class="step-num">2</span><span>Change your password from the temporary one provided.</span></div>
      <div class="step"><span class="step-num">3</span><span>Go to <strong>My Account &rarr; User Management</strong> to add your team members.</span></div>
      <div class="step"><span class="step-num">4</span><span>Share your organization\'s branded login link with your users so they can access their portal: <a href="{client_portal_url}" style="color:#166534;">{client_portal_url}</a></span></div>
    </div>

    <div class="btn-wrap">
      <a href="{oem_login_url}" class="btn">Sign In as Client Admin &rarr;</a>
    </div>

    <p style="font-size:13px;color:#6b7280;">This email was sent on behalf of <strong>{oem_org_name}</strong> via the Synerex platform. Do not share your credentials with anyone.</p>
  </div>
  <div class="ftr">
    <p class="powered">Powered by <strong>Synerex</strong> Energy Corporation</p>
    <p style="font-size:11px;color:#9ca3af;margin:4px 0 0;">&copy; Synerex Laboratories, LLC. All rights reserved.</p>
  </div>
</div>
</body>
</html>"""

    body_text = f"""{'ACCESS UPDATED — ' + oem_org_name.upper() if is_reset else 'WELCOME — CLIENT ADMIN ACCESS'}
{'=' * 55}

Hello,

{'Your admin credentials for ' + client_org_name + ' have been updated by ' + oem_org_name + '.' if is_reset else oem_org_name + ' has set you up as the Client Admin for ' + client_org_name + '.'}

YOUR LOGIN CREDENTIALS:
  Email:          {to_email}
  Temp Password:  {temp_password}
  Login URL:      {oem_login_url}

SECURITY: This is a temporary password. Change it immediately:
  {change_pw_url}

GETTING STARTED:
  1. Visit the login link above and sign in.
  2. Change your password immediately.
  3. Go to My Account -> User Management to add your team members.
  4. Share your client portal link with users: {client_portal_url}

{'=' * 55}
Powered by Synerex Laboratories, LLC
"""

    return send_email(
        to_email=to_email,
        subject=subject,
        body_html=body_html,
        body_text=body_text,
        org_id=client_org_id,
        notification_type="client_admin_invitation" if not is_reset else "client_admin_credentials_reset",
    )


def send_client_invitation_email(
    to_email: str,
    client_org_name: str,
    client_org_id: str,
    oem_org_name: str,
    registration_url: str,
    sponsor_org_id: Optional[str] = None,
    oem_branding: Optional[dict] = None,
) -> bool:
    """
    Send a client invitation email so a pre-registered client can activate their account.
    Called by the OEM after scanning the client's bill. The registration_url pre-fills the
    signup form with the client's existing org_id so a duplicate org is not created.
    """
    branding = oem_branding or {}
    brand_name = branding.get("brand_name") or oem_org_name or "Synerex"
    primary_color = branding.get("primary_color") or "#7c3aed"
    oem_logo_url = branding.get("logo_url") or ""

    logo_html = ""
    if oem_logo_url:
        logo_html = (
            f'<img src="{oem_logo_url}" alt="{brand_name}" '
            f'style="max-height:56px;max-width:180px;margin-bottom:10px;'
            f'display:block;margin-left:auto;margin-right:auto;" />'
        )

    subject = f"Your {brand_name} Account is Ready — Activate Your Subscription"

    body_html = f"""<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"/>
<style>
  body{{font-family:Arial,sans-serif;line-height:1.6;color:#333;margin:0;padding:0;background:#f3f4f6;}}
  .wrap{{max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);}}
  .hdr{{background:{primary_color};padding:28px 36px;text-align:center;}}
  .hdr h1{{color:#fff;margin:8px 0 0;font-size:21px;font-weight:700;}}
  .hdr p{{color:rgba(255,255,255,.85);margin:6px 0 0;font-size:14px;}}
  .body{{padding:32px 36px;}}
  .info-box{{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:20px 0;}}
  .row{{margin:8px 0;font-size:14px;}}
  .lbl{{font-weight:600;color:#6b7280;display:inline-block;min-width:150px;}}
  .steps-box{{background:#f5f3ff;border:1px solid #ddd6fe;border-radius:8px;padding:20px;margin:20px 0;}}
  .steps-box .title{{font-weight:700;color:#5b21b6;font-size:14px;margin-bottom:12px;}}
  .step{{margin:10px 0;font-size:14px;color:#374151;display:flex;gap:10px;align-items:flex-start;}}
  .step-num{{background:{primary_color};color:#fff;border-radius:50%;width:24px;height:24px;display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;margin-top:1px;}}
  .btn-wrap{{text-align:center;margin:28px 0;}}
  .btn{{display:inline-block;background:{primary_color};color:#fff;padding:14px 36px;text-decoration:none;border-radius:8px;font-weight:700;font-size:16px;}}
  .note{{background:#fffbeb;border-left:4px solid #f59e0b;padding:14px 16px;margin:20px 0;color:#92400e;font-size:13px;border-radius:0 6px 6px 0;}}
  .ftr{{background:#f9fafb;padding:20px 36px;text-align:center;border-top:1px solid #e5e7eb;}}
  .powered{{font-size:12px;color:#9ca3af;margin:0;}}
  .powered strong{{color:#7c3aed;}}
</style>
</head>
<body>
<div class="wrap">
  <div class="hdr">
    {logo_html}
    <h1>&#127881; Your Account is Ready</h1>
    <p>Complete your {brand_name} subscription to get started</p>
  </div>
  <div class="body">
    <p>Hello,</p>
    <p><strong>{oem_org_name}</strong> has set up an account for <strong>{client_org_name}</strong>
    on the {brand_name} platform. Your organization profile is already configured —
    just click the button below to choose your plan and activate your subscription.</p>

    <div class="info-box">
      <div style="font-weight:600;font-size:15px;margin-bottom:12px;">Your Pre-Configured Account</div>
      <div class="row"><span class="lbl">Organization:</span> {client_org_name}</div>
      <div class="row"><span class="lbl">Account ID:</span> <code style="background:#ede9fe;padding:2px 6px;border-radius:4px;color:#5b21b6;">{client_org_id}</code></div>
      <div class="row"><span class="lbl">Set up by:</span> {oem_org_name}</div>
    </div>

    <div class="btn-wrap">
      <a href="{registration_url}" class="btn">View Plans &amp; Subscribe &rarr;</a>
    </div>

    <div class="steps-box">
      <div class="title">&#128204; What happens next</div>
      <div class="step"><span class="step-num">1</span>
        <span>Click the button above — your organization details will be pre-filled.</span></div>
      <div class="step"><span class="step-num">2</span>
        <span>Select the plan that fits your needs (Basic, Pro, or Enterprise).</span></div>
      <div class="step"><span class="step-num">3</span>
        <span>Create your username and password — just 4 fields, takes 30 seconds.</span></div>
      <div class="step"><span class="step-num">4</span>
        <span>Complete payment. Your license activates instantly — log in and start using the platform.</span></div>
    </div>

    <div class="note">
      <strong>Note:</strong> This invitation link is unique to your organization.
      You can activate your account at any time — there is no expiry.
      If you have questions, contact <strong>{oem_org_name}</strong> directly.
    </div>

    <p style="font-size:13px;color:#6b7280;margin-top:24px;">
      If the button above does not work, copy and paste this link into your browser:<br/>
      <a href="{registration_url}" style="color:{primary_color};word-break:break-all;">{registration_url}</a>
    </p>
  </div>
  <div class="ftr">
    <p class="powered">Powered by <strong>Synerex</strong> Energy Corporation</p>
    <p style="font-size:11px;color:#9ca3af;margin:4px 0 0;">&copy; Synerex Laboratories, LLC. All rights reserved.</p>
  </div>
</div>
</body>
</html>"""

    body_text = f"""YOUR {brand_name.upper()} ACCOUNT IS READY
{'=' * 55}

Hello,

{oem_org_name} has set up an account for {client_org_name} on the {brand_name} platform.
Your organization profile is already configured. Click the link below to choose
your plan and activate your subscription.

  Organization: {client_org_name}
  Account ID:   {client_org_id}
  Set up by:    {oem_org_name}

ACTIVATE YOUR SUBSCRIPTION:
  {registration_url}

WHAT HAPPENS NEXT:
  1. Visit the link above — your details will be pre-filled.
  2. Create your username and password.
  3. Choose your plan and complete payment.
  4. Your license activates immediately.

Note: This link does not expire. Activate your account whenever you are ready.

{'=' * 55}
Powered by Synerex Laboratories, LLC
"""

    return send_email(
        to_email=to_email,
        subject=subject,
        body_html=body_html,
        body_text=body_text,
        org_id=client_org_id,
        notification_type="client_invitation",
    )
