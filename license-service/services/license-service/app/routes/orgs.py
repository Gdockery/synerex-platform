import re
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..db import SessionLocal
from ..models.org import Organization
from ..models.authorization import ProgramAuthorization
from ..models.license import License
from ..models.api_key import ApiKey
from ..audit.events import log_event

router = APIRouter(prefix="/api", tags=["orgs"])


class EnsureOrgRequest(BaseModel):
    """Request body for create-or-adopt org. Idempotent: returns existing org if present."""
    org_id: Optional[str] = Field(None, description="Optional. If provided and exists, returns it. If new, creates with this id.")
    org_name: str = Field(..., min_length=1)
    org_type: str = Field(..., pattern="^(oem|customer|pe)$")
    sponsor_org_id: Optional[str] = Field(None, description="OEM org_id when creating customer/pe org (OEM-sponsored)")
    email: Optional[str] = None
    contact_name: Optional[str] = None
    phone: Optional[str] = None


def _generate_org_id(db: Session, org_name: str, org_type: str) -> str:
    """Generate a unique org_id from org_name."""
    clean = re.sub(r'[^a-zA-Z0-9\s-]', '', org_name)
    clean = re.sub(r'\s+', '-', clean.strip()).upper()
    base_id = f"{org_type.upper()}-{clean[:20]}"
    counter = 1
    org_id = base_id
    while db.get(Organization, org_id):
        org_id = f"{base_id}-{counter:03d}"
        counter += 1
    return org_id

def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/orgs")
def list_orgs(
    org_type: Optional[str] = Query(None, description="Filter by org_type (oem or customer)"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of results"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
    db: Session = Depends(db_session)
):
    """List all organizations with optional filtering."""
    query = db.query(Organization)
    if org_type:
        if org_type not in ("oem", "customer", "pe"):
            raise HTTPException(400, "org_type must be 'oem', 'customer', or 'pe'")
        query = query.filter(Organization.org_type == org_type)
    
    total = query.count()
    orgs = query.order_by(Organization.org_id.asc()).offset(offset).limit(limit).all()
    
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "orgs": [{"org_id": o.org_id, "org_name": o.org_name, "org_type": o.org_type} for o in orgs]
    }


@router.post("/orgs/ensure")
def ensure_org(body: EnsureOrgRequest, db: Session = Depends(db_session)):
    """
    Create or adopt an organization. Idempotent registry endpoint for programs (EMV, Tracking).
    - If org_id provided and exists: return 200 with org (adopt).
    - If org_id provided and new: create with that id, return 201.
    - If org_id not provided: generate unique id, create, return 201.
    """
    from fastapi.responses import JSONResponse

    if body.org_id:
        existing = db.get(Organization, body.org_id)
        if existing:
            return JSONResponse(
                status_code=200,
                content={
                    "org_id": existing.org_id,
                    "org_name": existing.org_name,
                    "org_type": existing.org_type,
                    "created": False,
                },
            )
        org_id = body.org_id
    else:
        org_id = _generate_org_id(db, body.org_name, body.org_type)

    org = Organization(
        org_id=org_id,
        org_name=body.org_name,
        org_type=body.org_type,
        email=body.email,
        contact_name=body.contact_name,
        phone=body.phone,
        sponsor_org_id=body.sponsor_org_id if body.org_type in ("customer", "pe") else None,
    )
    db.add(org)
    db.commit()
    log_event(db, actor="program", action="org.ensure", ref_id=org_id, detail={"org_type": body.org_type, "created": True})
    return JSONResponse(
        status_code=201,
        content={
            "org_id": org_id,
            "org_name": body.org_name,
            "org_type": body.org_type,
            "created": True,
        },
    )


@router.get("/orgs/{org_id}")
def get_org(org_id: str, db: Session = Depends(db_session)):
    """Get a single organization by ID."""
    org = db.get(Organization, org_id)
    if not org:
        raise HTTPException(404, "Organization not found")
    return {"org_id": org.org_id, "org_name": org.org_name, "org_type": org.org_type}


@router.post("/orgs")
def create_org(org_id: str, org_name: str, org_type: str, db: Session = Depends(db_session)):
    """Create a new organization."""
    if org_type not in ("oem", "customer", "pe"):
        raise HTTPException(400, "org_type must be oem, customer, or pe")
    if db.get(Organization, org_id):
        raise HTTPException(409, "org_id exists")
    db.add(Organization(org_id=org_id, org_name=org_name, org_type=org_type))
    db.commit()
    log_event(db, actor="admin", action="org.create", ref_id=org_id, detail={"org_type": org_type})
    return {"ok": True, "org_id": org_id}

@router.patch("/orgs/{org_id}")
def update_org(
    org_id: str,
    org_name: Optional[str] = None,
    org_type: Optional[str] = None,
    db: Session = Depends(db_session)
):
    """Update an organization."""
    org = db.get(Organization, org_id)
    if not org:
        raise HTTPException(404, "Organization not found")
    
    if org_type is not None:
        if org_type not in ("oem", "customer", "pe"):
            raise HTTPException(400, "org_type must be oem, customer, or pe")
        org.org_type = org_type
    
    if org_name is not None:
        org.org_name = org_name
    
    db.commit()
    log_event(db, actor="admin", action="org.update", ref_id=org_id, detail={"org_name": org_name, "org_type": org_type})
    return {"ok": True, "org_id": org.org_id, "org_name": org.org_name, "org_type": org.org_type}

@router.delete("/orgs/{org_id}")
def delete_org(org_id: str, force: bool = Query(False, description="Force delete even if related records exist"), db: Session = Depends(db_session)):
    """Delete an organization. Checks for related records unless force=true."""
    org = db.get(Organization, org_id)
    if not org:
        raise HTTPException(404, "Organization not found")
    
    if not force:
        # Check for related records
        auth_count = db.query(ProgramAuthorization).filter(ProgramAuthorization.org_id == org_id).count()
        license_count = db.query(License).filter(License.org_id == org_id).count()
        key_count = db.query(ApiKey).filter(ApiKey.org_id == org_id).count()
        
        if auth_count > 0 or license_count > 0 or key_count > 0:
            raise HTTPException(409, f"Cannot delete organization with related records. Found: {auth_count} authorizations, {license_count} licenses, {key_count} API keys. Use force=true to override.")
    
    db.delete(org)
    db.commit()
    log_event(db, actor="admin", action="org.delete", ref_id=org_id, detail={"force": force})
    return {"ok": True, "org_id": org_id}

@router.get("/orgs/{org_id}/summary")
def org_summary(org_id: str, db: Session = Depends(db_session)):
    """Get organization summary with related records."""
    org = db.get(Organization, org_id)
    if not org:
        raise HTTPException(404, "Organization not found")
    
    auths = db.query(ProgramAuthorization).filter(ProgramAuthorization.org_id == org_id).all()
    licenses = db.query(License).filter(License.org_id == org_id).all()
    keys = db.query(ApiKey).filter(ApiKey.org_id == org_id).all()
    
    return {
        "org": {"org_id": org.org_id, "org_name": org.org_name, "org_type": org.org_type},
        "authorizations": [{"authorization_id": a.authorization_id, "program_id": a.program_id, "status": a.status} for a in auths],
        "licenses": [{"license_id": l.license_id, "program_id": l.program_id, "revoked": l.revoked, "suspended": l.suspended} for l in licenses],
        "api_keys": [{"key_id": k.key_id, "is_active": k.is_active, "scopes": k.scopes} for k in keys],
        "counts": {
            "authorizations": len(auths),
            "licenses": len(licenses),
            "api_keys": len(keys)
        }
    }


class SendInvitationRequest(BaseModel):
    """Request body for sending a client activation/invitation email."""
    to_email: str = Field(..., description="Recipient email address for the invitation.")
    oem_org_name: Optional[str] = Field(None, description="OEM brand name shown in the email. Defaults to org sponsor name.")


@router.post("/orgs/{org_id}/send-invitation")
def send_org_invitation(
    org_id: str,
    body: SendInvitationRequest,
    db: Session = Depends(db_session),
):
    """Send a welcome email to an activated client with their login link.

    The client's subscription has already been set up by the OEM (first-year cost
    collected with equipment). This email simply tells them how to log in.
    """
    from ..config import settings as _settings
    from ..services.email import send_email
    from ..models.user import User as _User
    import urllib.request as _ur
    import json as _json

    org = db.get(Organization, org_id)
    if not org:
        raise HTTPException(404, "Organization not found")

    # Build the login URL for the Tracking portal
    base_url = (_settings.website_url or "http://localhost:8080").rstrip("/")
    login_url = f"{base_url}/tracking/login"

    # Resolve OEM branding from sponsor (fall back to Synerex defaults gracefully)
    brand_name = "Synerex"
    primary_color = "#4c1d95"
    logo_html = f'<div style="font-size:1.3em;font-weight:bold;color:#fff;text-align:center;padding:6px 0;">{brand_name}</div>'
    sponsor_id = org.sponsor_org_id
    public_base = base_url
    if sponsor_id:
        try:
            tracking_url = (getattr(_settings, "tracking_program_url", None) or "http://tracking-program:8087").rstrip("/")
            with _ur.urlopen(f"{tracking_url}/api/whitelabel/oem-branding-by-org?org_id={sponsor_id}", timeout=3) as _resp:
                _data = _json.loads(_resp.read())
                if isinstance(_data, dict) and _data.get("brand_name"):
                    brand_name = _data["brand_name"]
                    primary_color = _data.get("primary_color") or primary_color
                    logo_url = _data.get("logo_url") or ""
                    # Convert relative URL to absolute so it loads in email clients
                    if logo_url and not logo_url.startswith("http"):
                        logo_url = f"{public_base}/tracking{logo_url}"
                    if logo_url:
                        logo_html = f'<img src="{logo_url}" alt="{brand_name}" style="max-height:56px;max-width:200px;display:block;margin:0 auto;"/>'
                    else:
                        logo_html = f'<div style="font-size:1.3em;font-weight:bold;color:#fff;text-align:center;padding:6px 0;">{brand_name}</div>'
        except Exception:
            pass

    # Find the client admin username
    client_user = db.query(_User).filter(_User.org_id == org_id).order_by(_User.username).first()
    username = client_user.username if client_user else body.to_email

    subject = f"Welcome to {brand_name} — Your Portal is Ready"
    html_body = f"""<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:{primary_color};padding:28px 32px;text-align:center;">
            {logo_html}
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px;">
            <p style="color:#444;font-size:1em;margin:0 0 12px 0;">Dear <strong>{org.org_name}</strong>,</p>
            <h2 style="margin:0 0 16px 0;color:#222;">Your {brand_name} Portal is Ready</h2>
            <p style="color:#444;line-height:1.6;margin:0 0 20px 0;">
              Your Tracking Portal has been set up and is ready to use.
              Log in below to get started.
            </p>
            <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:1rem 1.25rem;margin:0 0 20px 0;text-align:center;">
              <p style="margin:0 0 4px 0;color:#166534;font-size:0.85rem;font-weight:600;">Your Login Email</p>
              <p style="margin:0;color:#14532d;font-size:1.1rem;font-weight:700;font-family:monospace;">{username}</p>
            </div>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 16px auto;">
              <tr>
                <td style="background:{primary_color};border-radius:6px;padding:14px 32px;text-align:center;">
                  <a href="{login_url}" style="color:white;text-decoration:none;font-size:1em;font-weight:bold;">
                    Log In to {brand_name} &rarr;
                  </a>
                </td>
              </tr>
            </table>
            <p style="text-align:center;margin:0 0 24px 0;font-size:0.875rem;color:#6b7280;">
              Manage your account at
              <a href="{base_url}/my-account" style="color:{primary_color};text-decoration:none;font-weight:600;">My Account &rarr;</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#f8f8f8;padding:16px 40px;text-align:center;border-top:1px solid #eee;color:#aaa;font-size:0.8em;">
            &copy; {brand_name}. All rights reserved.
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""

    text_body = (
        f"Dear {org.org_name},\n\n"
        f"Your {brand_name} Tracking Portal has been set up and is ready to use.\n\n"
        f"Log in at: {login_url}\n"
        f"Username: {username}\n\n"
        f"Manage your account at: {base_url}/my-account\n\n"
        f"— The {brand_name} Team"
    )

    sent = send_email(
        to_email=body.to_email,
        subject=subject,
        body_html=html_body,
        body_text=text_body,
    )

    log_event(
        db,
        actor="oem",
        action="org.welcome_email_sent",
        ref_id=org_id,
        detail={"to_email": body.to_email, "sent": sent},
    )

    return {
        "ok": True,
        "org_id": org_id,
        "to_email": body.to_email,
        "email_sent": sent,
    }
