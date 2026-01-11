from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from ..db import SessionLocal
from ..models.org import Organization
from ..models.authorization import ProgramAuthorization
from ..models.license import License
from ..models.api_key import ApiKey
from ..audit.events import log_event

router = APIRouter(prefix="/api", tags=["orgs"])

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
        if org_type not in ("oem", "customer"):
            raise HTTPException(400, "org_type must be 'oem' or 'customer'")
        query = query.filter(Organization.org_type == org_type)
    
    total = query.count()
    orgs = query.order_by(Organization.org_id.asc()).offset(offset).limit(limit).all()
    
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "orgs": [{"org_id": o.org_id, "org_name": o.org_name, "org_type": o.org_type} for o in orgs]
    }

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
    if org_type not in ("oem","customer"):
        raise HTTPException(400, "org_type must be oem or customer")
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
        if org_type not in ("oem", "customer"):
            raise HTTPException(400, "org_type must be oem or customer")
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
