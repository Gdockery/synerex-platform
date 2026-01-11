import json
from typing import Optional, Dict, Any
from datetime import datetime, timedelta, date
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from ..db import SessionLocal
from ..models.authorization import ProgramAuthorization
from ..models.license import License
from ..models.org import Organization
from ..config import settings
from ..templates_loader import load_template
from ..programs.guardrails import validate_template
from ..crypto.signing import load_private_key, load_public_key
from ..audit.events import log_event
from ..licensing import build_license_payload, sign_license

router = APIRouter(prefix="/api/programs", tags=["authorizations"])

def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

PRIV = load_private_key(Path(__file__).resolve().parents[2] / "keys" / "issuer_private.key")

@router.get("/{program_id}/authorizations")
def list_authorizations(
    program_id: str,
    org_id: Optional[str] = Query(None, description="Filter by organization ID"),
    status: Optional[str] = Query(None, description="Filter by status (active, suspended, terminated)"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of results"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
    db: Session = Depends(db_session)
):
    """List authorizations for a program with optional filtering."""
    if program_id not in ("emv", "tracking"):
        raise HTTPException(400, "program_id must be emv or tracking")
    
    query = db.query(ProgramAuthorization).filter(ProgramAuthorization.program_id == program_id)
    
    if org_id:
        query = query.filter(ProgramAuthorization.org_id == org_id)
    if status:
        if status not in ("active", "suspended", "terminated"):
            raise HTTPException(400, "status must be active, suspended, or terminated")
        query = query.filter(ProgramAuthorization.status == status)
    
    total = query.count()
    auths = query.order_by(ProgramAuthorization.authorization_id.desc()).offset(offset).limit(limit).all()
    
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "authorizations": [{
            "authorization_id": a.authorization_id,
            "program_id": a.program_id,
            "org_id": a.org_id,
            "template_id": a.template_id,
            "status": a.status,
            "starts_at": a.starts_at,
            "ends_at": a.ends_at,
            "issued_by": a.issued_by
        } for a in auths]
    }

@router.get("/{program_id}/authorizations/{authorization_id}")
def get_authorization(program_id: str, authorization_id: str, db: Session = Depends(db_session)):
    """Get a single authorization by ID."""
    if program_id not in ("emv", "tracking"):
        raise HTTPException(400, "program_id must be emv or tracking")
    
    auth = db.get(ProgramAuthorization, authorization_id)
    if not auth or auth.program_id != program_id:
        raise HTTPException(404, "Authorization not found")
    
    return {
        "authorization_id": auth.authorization_id,
        "program_id": auth.program_id,
        "org_id": auth.org_id,
        "template_id": auth.template_id,
        "status": auth.status,
        "starts_at": auth.starts_at,
        "ends_at": auth.ends_at,
        "scope": json.loads(auth.scope_json),
        "constraints": json.loads(auth.constraints_json),
        "bindings_override": json.loads(auth.bindings_override_json),
        "issued_by": auth.issued_by
    }

@router.post("/{program_id}/authorizations")
def create_authorization(program_id: str, body: dict, db: Session = Depends(db_session)):
    if program_id not in ("emv","tracking"):
        raise HTTPException(400, "program_id must be emv or tracking")
    auth_id = body.get("authorization_id")
    if not auth_id:
        raise HTTPException(400, "authorization_id required")
    if db.get(ProgramAuthorization, auth_id):
        raise HTTPException(409, "authorization_id exists")

    template_id = body.get("template_id")
    template = load_template(program_id, template_id)
    validate_template(program_id, template)

    auth = ProgramAuthorization(
        authorization_id=auth_id,
        program_id=program_id,
        org_id=body["org_id"],
        template_id=template_id,
        status=body.get("status","active"),
        starts_at=body["starts_at"],
        ends_at=body["ends_at"],
        scope_json=json.dumps(body.get("scope", {}), ensure_ascii=False),
        constraints_json=json.dumps(body.get("constraints", {}), ensure_ascii=False),
        bindings_override_json=json.dumps(body.get("bindings_override", {}), ensure_ascii=False),
        issued_by=body.get("issued_by","program_engine"),
    )
    db.add(auth)
    db.commit()
    log_event(db, actor=auth.issued_by, action="authorization.create", ref_id=auth_id, detail={"program_id": program_id, "org_id": body.get("org_id")})
    return {"ok": True, "authorization_id": auth_id}

@router.post("/{program_id}/authorizations/{authorization_id}/issue-license")
def issue_from_authorization(program_id: str, authorization_id: str, db: Session = Depends(db_session)):
    auth = db.get(ProgramAuthorization, authorization_id)
    if not auth or auth.program_id != program_id:
        raise HTTPException(404, "Authorization not found")
    if auth.status != "active":
        raise HTTPException(409, "Authorization not active")

    org = db.get(Organization, auth.org_id)
    if not org:
        raise HTTPException(404, "Organization not found")

    template = load_template(program_id, auth.template_id)
    validate_template(program_id, template)

    scope = json.loads(auth.scope_json)
    bindings_override = json.loads(auth.bindings_override_json)

    # Note: Baseline lineage validation is handled by the Tracking program itself
    # The license service only stores the baseline_lineage reference if provided
    # The Tracking program will verify baseline existence when the license is used
    if program_id == "tracking" and "baseline_lineage" in bindings_override:
        # Store baseline_lineage reference in license payload (optional metadata)
        # Actual baseline verification happens in the Tracking program
        pass

    # merge scope into bindings
        

    # enforce meter_limit against scoped meter_ids (if provided)
    limits = template.get("entitlements", {}).get("limits", {})
    meter_limit = int(limits.get("meter_limit", 0) or 0)
    scoped_meters = (scope.get("meter_ids") or [])
    if meter_limit and scoped_meters and len(scoped_meters) > meter_limit:
        raise HTTPException(409, f"meter_limit_exceeded:{meter_limit}")

    bindings = template.get("bindings", {})
    bindings = dict(bindings)
    for k in ("project_ids","site_ids","meter_ids"):
        if k in scope:
            bindings[k] = scope.get(k, [])
    for k,v in bindings_override.items():
        bindings[k] = v
    template = dict(template)
    template["bindings"] = bindings

    license_id = f"SYX-LIC-{datetime.utcnow().year}-{int(datetime.utcnow().timestamp())}"
    program_env = {"program_id": program_id, "authorization_id": authorization_id, "status": auth.status, "policy_version": template.get("policy_version")}
    payload = build_license_payload(
        license_id=license_id,
        issuer=settings.issuer_name,
        org={"org_id": org.org_id, "org_name": org.org_name, "org_type": org.org_type},
        term_start=auth.starts_at,
        term_end=auth.ends_at,
        program=program_env,
        template=template,
    )
    signed = sign_license(PRIV, payload, settings.key_id)

    # store
    expires_at = datetime.utcnow() + timedelta(days=365)  # you can compute from auth.ends_at; placeholder
    rec = License(
        license_id=license_id,
        org_id=org.org_id,
        program_id=program_id,
        authorization_id=authorization_id,
        expires_at=expires_at,
        payload_json=json.dumps(signed, ensure_ascii=False),
        signature_b64=signed["signature"]["value"],
        key_id=settings.key_id
    )
    db.add(rec)
    db.commit()
    log_event(db, actor="system", action="license.issue", ref_id=license_id, detail={"program_id": program_id, "authorization_id": authorization_id})
    return {"license_id": license_id, "license": signed}

@router.patch("/{program_id}/authorizations/{authorization_id}")
def update_authorization(
    program_id: str,
    authorization_id: str,
    body: Dict[str, Any] = Body(...),
    db: Session = Depends(db_session)
):
    """Update an authorization."""
    if program_id not in ("emv", "tracking"):
        raise HTTPException(400, "program_id must be emv or tracking")
    
    auth = db.get(ProgramAuthorization, authorization_id)
    if not auth or auth.program_id != program_id:
        raise HTTPException(404, "Authorization not found")
    
    # Update fields if provided
    if "status" in body:
        if body["status"] not in ("active", "suspended", "terminated"):
            raise HTTPException(400, "status must be active, suspended, or terminated")
        auth.status = body["status"]
    
    if "starts_at" in body:
        auth.starts_at = body["starts_at"]
    
    if "ends_at" in body:
        auth.ends_at = body["ends_at"]
    
    if "scope" in body:
        auth.scope_json = json.dumps(body["scope"], ensure_ascii=False)
    
    if "constraints" in body:
        auth.constraints_json = json.dumps(body["constraints"], ensure_ascii=False)
    
    if "bindings_override" in body:
        auth.bindings_override_json = json.dumps(body["bindings_override"], ensure_ascii=False)
    
    if "template_id" in body:
        # Validate new template
        template = load_template(program_id, body["template_id"])
        validate_template(program_id, template)
        auth.template_id = body["template_id"]
    
    db.commit()
    log_event(db, actor="admin", action="authorization.update", ref_id=authorization_id, detail=body)
    return {"ok": True, "authorization_id": authorization_id}

@router.post("/{program_id}/authorizations/{authorization_id}/suspend")
def suspend_authorization(program_id: str, authorization_id: str, reason: str = "admin_action", db: Session = Depends(db_session)):
    """Suspend an authorization."""
    if program_id not in ("emv", "tracking"):
        raise HTTPException(400, "program_id must be emv or tracking")
    
    auth = db.get(ProgramAuthorization, authorization_id)
    if not auth or auth.program_id != program_id:
        raise HTTPException(404, "Authorization not found")
    
    auth.status = "suspended"
    db.commit()
    log_event(db, actor="admin", action="authorization.suspend", ref_id=authorization_id, detail={"reason": reason})
    return {"ok": True, "authorization_id": authorization_id, "status": "suspended"}

@router.post("/{program_id}/authorizations/{authorization_id}/activate")
def activate_authorization(program_id: str, authorization_id: str, db: Session = Depends(db_session)):
    """Activate an authorization."""
    if program_id not in ("emv", "tracking"):
        raise HTTPException(400, "program_id must be emv or tracking")
    
    auth = db.get(ProgramAuthorization, authorization_id)
    if not auth or auth.program_id != program_id:
        raise HTTPException(404, "Authorization not found")
    
    auth.status = "active"
    db.commit()
    log_event(db, actor="admin", action="authorization.activate", ref_id=authorization_id)
    return {"ok": True, "authorization_id": authorization_id, "status": "active"}

@router.post("/{program_id}/authorizations/{authorization_id}/terminate")
def terminate_authorization(program_id: str, authorization_id: str, reason: str = "admin_action", db: Session = Depends(db_session)):
    """Terminate an authorization."""
    if program_id not in ("emv", "tracking"):
        raise HTTPException(400, "program_id must be emv or tracking")
    
    auth = db.get(ProgramAuthorization, authorization_id)
    if not auth or auth.program_id != program_id:
        raise HTTPException(404, "Authorization not found")
    
    auth.status = "terminated"
    db.commit()
    log_event(db, actor="admin", action="authorization.terminate", ref_id=authorization_id, detail={"reason": reason})
    return {"ok": True, "authorization_id": authorization_id, "status": "terminated"}

@router.delete("/{program_id}/authorizations/{authorization_id}")
def delete_authorization(
    program_id: str,
    authorization_id: str,
    force: bool = Query(False, description="Force delete even if licenses exist"),
    db: Session = Depends(db_session)
):
    """Delete an authorization. Checks for related licenses unless force=true."""
    if program_id not in ("emv", "tracking"):
        raise HTTPException(400, "program_id must be emv or tracking")
    
    auth = db.get(ProgramAuthorization, authorization_id)
    if not auth or auth.program_id != program_id:
        raise HTTPException(404, "Authorization not found")
    
    if not force:
        license_count = db.query(License).filter(License.authorization_id == authorization_id).count()
        if license_count > 0:
            raise HTTPException(409, f"Cannot delete authorization with {license_count} related licenses. Use force=true to override.")
    
    db.delete(auth)
    db.commit()
    log_event(db, actor="admin", action="authorization.delete", ref_id=authorization_id, detail={"force": force})
    return {"ok": True, "authorization_id": authorization_id}
