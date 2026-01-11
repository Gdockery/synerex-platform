import json
from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..db import SessionLocal
from ..models.api_key import ApiKey
from ..models.org import Organization
from ..auth.api_keys import create_api_key
from ..audit.events import log_event

router = APIRouter(prefix="/api", tags=["api-keys"])

def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/api-keys")
def list_api_keys(
    org_id: Optional[str] = Query(None, description="Filter by organization ID"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of results"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
    db: Session = Depends(db_session)
):
    """List all API keys with optional filtering."""
    query = db.query(ApiKey)
    
    if org_id:
        query = query.filter(ApiKey.org_id == org_id)
    if is_active is not None:
        query = query.filter(ApiKey.is_active == is_active)
    
    total = query.count()
    keys = query.order_by(ApiKey.key_id.desc()).offset(offset).limit(limit).all()
    
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "keys": [{
            "key_id": k.key_id,
            "org_id": k.org_id,
            "scopes": k.scopes,
            "is_active": k.is_active
        } for k in keys]
    }

@router.get("/api-keys/{key_id}")
def get_api_key(key_id: str, db: Session = Depends(db_session)):
    """Get a single API key (metadata only, raw key is never returned)."""
    rec = db.get(ApiKey, key_id)
    if not rec:
        raise HTTPException(404, "API key not found")
    return {
        "key_id": rec.key_id,
        "org_id": rec.org_id,
        "scopes": rec.scopes,
        "is_active": rec.is_active
    }

@router.post("/api-keys/issue")
def issue_api_key(org_id: str, scopes_csv: str, db: Session = Depends(db_session)):
    """Issue a new API key."""
    org = db.get(Organization, org_id)
    if not org:
        raise HTTPException(404, "Organization not found")

    raw, key_hash = create_api_key(prefix="syx")
    key_id = f"KEY-{int(datetime.utcnow().timestamp())}"

    rec = ApiKey(
        key_id=key_id,
        org_id=org_id,
        key_hash=key_hash,
        scopes=scopes_csv,
        is_active=True
    )
    db.add(rec)
    db.commit()
    log_event(db, actor="admin", action="api_key.issue", ref_id=key_id, detail={"org_id": org_id, "scopes": scopes_csv})

    # IMPORTANT: raw key is only shown once
    return {"key_id": key_id, "org_id": org_id, "scopes": scopes_csv, "api_key": raw}

@router.post("/api-keys/{key_id}/disable")
def disable_api_key(key_id: str, db: Session = Depends(db_session)):
    """Disable an API key."""
    rec = db.get(ApiKey, key_id)
    if not rec:
        raise HTTPException(404, "Not found")
    rec.is_active = False
    db.commit()
    log_event(db, actor="admin", action="api_key.disable", ref_id=key_id)
    return {"ok": True}

@router.post("/api-keys/{key_id}/enable")
def enable_api_key(key_id: str, db: Session = Depends(db_session)):
    """Re-enable a disabled API key."""
    rec = db.get(ApiKey, key_id)
    if not rec:
        raise HTTPException(404, "Not found")
    rec.is_active = True
    db.commit()
    log_event(db, actor="admin", action="api_key.enable", ref_id=key_id)
    return {"ok": True, "key_id": key_id, "is_active": True}

@router.delete("/api-keys/{key_id}")
def delete_api_key(key_id: str, db: Session = Depends(db_session)):
    """Delete an API key permanently."""
    rec = db.get(ApiKey, key_id)
    if not rec:
        raise HTTPException(404, "Not found")
    db.delete(rec)
    db.commit()
    log_event(db, actor="admin", action="api_key.delete", ref_id=key_id)
    return {"ok": True, "key_id": key_id}
