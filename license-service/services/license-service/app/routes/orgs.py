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
    """Send a client activation email for a pre-registered organisation.

    Builds a unique registration URL that pre-fills the signup form with the
    org's existing details so the client does not create a duplicate record.
    Logs a ``client_invitation`` notification regardless of email delivery.
    """
    from ..config import settings as _settings
    from ..services.email import send_client_invitation_email
    from ..models.notification import Notification, NotificationStatus
    import urllib.request as _ur
    import json as _json
    from datetime import datetime as _dt

    org = db.get(Organization, org_id)
    if not org:
        raise HTTPException(404, "Organization not found")

    # Build the invitation URL pointing to the plan-selection page (new OEM invite flow)
    base_url = (_settings.website_url or "http://localhost:8000").rstrip("/")
    root_pfx = (getattr(_settings, "root_path", None) or "").rstrip("/")
    invite_url = (
        f"{base_url}{root_pfx}/license/register/choose-plan"
        f"?org_id={org.org_id}"
        + (f"&sponsor_org_id={org.sponsor_org_id}" if org.sponsor_org_id else "")
    )

    # Resolve OEM branding from sponsor
    oem_branding: dict = {}
    oem_org_name = body.oem_org_name or "Synerex"
    sponsor_id = org.sponsor_org_id
    if sponsor_id:
        try:
            tracking_url = (getattr(_settings, "tracking_program_url", None) or "http://tracking-program:8087").rstrip("/")
            with _ur.urlopen(f"{tracking_url}/api/whitelabel/oem-branding-by-org?org_id={sponsor_id}", timeout=3) as _resp:
                _data = _json.loads(_resp.read())
                if isinstance(_data, dict) and _data.get("brand_name"):
                    oem_branding = _data
                    if not body.oem_org_name:
                        oem_org_name = _data.get("brand_name") or oem_org_name
        except Exception:
            pass

    # Guard: require OEM branding to be configured before sending invitations.
    # Clients must never see the Synerex default — the OEM logo and brand name are mandatory.
    if not oem_branding.get("brand_name"):
        raise HTTPException(
            400,
            "OEM branding is not configured. Please set up your brand name and logo in "
            "the OEM Profile page before sending client invitations."
        )

    sent = send_client_invitation_email(
        to_email=body.to_email,
        client_org_name=org.org_name,
        client_org_id=org.org_id,
        oem_org_name=oem_org_name,
        registration_url=invite_url,
        sponsor_org_id=sponsor_id,
        oem_branding=oem_branding,
    )

    log_event(
        db,
        actor="oem",
        action="org.invitation_sent",
        ref_id=org_id,
        detail={"to_email": body.to_email, "sent": sent, "invite_url": invite_url},
    )

    return {
        "ok": True,
        "org_id": org_id,
        "to_email": body.to_email,
        "invite_url": invite_url,
        "email_sent": sent,
    }
