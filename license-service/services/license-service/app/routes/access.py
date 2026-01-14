"""Access gateway routes for EM&V and Tracking programs."""
import json
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Form, Query, Body
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from starlette.requests import Request
from sqlalchemy.orm import Session
from pathlib import Path

from ..db import SessionLocal
from ..models.license import License
from ..models.org import Organization
from ..models.authorization import ProgramAuthorization
from ..crypto.signing import load_public_key
from ..licensing import verify_license
from ..audit.events import log_event
from ..services.jwt_tokens import generate_session_token, validate_session_token
from ..config import settings

router = APIRouter(prefix="/access", tags=["access"])

# Template directory
TEMPLATES_DIR = Path(__file__).resolve().parents[1] / "admin" / "templates"
templates = Jinja2Templates(directory=str(TEMPLATES_DIR))

def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

KEYS_DIR = Path(__file__).resolve().parents[2] / "keys"
PUB = load_public_key(KEYS_DIR / "issuer_public.key")

# Program URLs from settings
PROGRAM_URLS = {
    "emv": settings.emv_program_url,
    "tracking": settings.tracking_program_url
}

@router.get("/{program_id}", response_class=HTMLResponse)
def access_program(
    program_id: str,
    request: Request,
    license_id: Optional[str] = Query(None),
    token: Optional[str] = Query(None),
    db: Session = Depends(db_session)
):
    """
    Access gateway page for EM&V or Tracking programs.
    
    If license_id is provided, shows a form to enter serial number.
    If token is provided, validates and redirects to program.
    """
    if program_id not in ("emv", "tracking"):
        raise HTTPException(400, "Invalid program. Must be 'emv' or 'tracking'")
    
    # If token provided, validate and redirect
    if token:
        try:
            claims = validate_session_token(token)
            if claims.get("program_id") != program_id:
                raise HTTPException(403, "Token is for a different program")
            
            # Redirect to program with token
            program_url = PROGRAM_URLS.get(program_id)
            if not program_url:
                raise HTTPException(500, "Program URL not configured")
            
            # For EM&V, redirect to root with token (it will auto-login)
            # For other programs, adjust as needed
            if program_id == "emv":
                redirect_url = f"{program_url}/?token={token}"
            else:
                redirect_url = f"{program_url}/login?token={token}"
            return RedirectResponse(url=redirect_url, status_code=302)
        except ValueError as e:
            # Token invalid or expired
            return templates.TemplateResponse(
                "access_verify.html",
                {
                    "request": request,
                    "program_id": program_id,
                    "program_name": program_id.upper(),
                    "error": f"Invalid or expired access token: {str(e)}",
                    "license_id": license_id or ""
                }
            )
    
    # Show verification form
    return templates.TemplateResponse(
        "access_verify.html",
        {
            "request": request,
            "program_id": program_id,
            "program_name": program_id.upper(),
            "error": None,
            "license_id": license_id or ""
        }
    )

@router.post("/{program_id}/verify", response_class=RedirectResponse)
def verify_and_redirect(
    program_id: str,
    request: Request,
    license_id: str = Form(...),
    db: Session = Depends(db_session)
):
    """
    Verify license and generate session token, then redirect to program.
    """
    if program_id not in ("emv", "tracking"):
        raise HTTPException(400, "Invalid program. Must be 'emv' or 'tracking'")
    
    # Get license
    license_rec = db.get(License, license_id)
    if not license_rec:
        return templates.TemplateResponse(
            "access_verify.html",
            {
                "request": request,
                "program_id": program_id,
                "program_name": program_id.upper(),
                "error": "License not found. Please check your serial number.",
                "license_id": license_id
            },
            status_code=404
        )
    
    # Verify license is for correct program
    if license_rec.program_id != program_id:
        return templates.TemplateResponse(
            "access_verify.html",
            {
                "request": request,
                "program_id": program_id,
                "program_name": program_id.upper(),
                "error": f"This license is for {license_rec.program_id.upper()}, not {program_id.upper()}.",
                "license_id": license_id
            },
            status_code=400
        )
    
    # Check if license is valid
    if license_rec.revoked:
        return templates.TemplateResponse(
            "access_verify.html",
            {
                "request": request,
                "program_id": program_id,
                "program_name": program_id.upper(),
                "error": "This license has been revoked.",
                "license_id": license_id
            },
            status_code=403
        )
    
    if license_rec.suspended:
        return templates.TemplateResponse(
            "access_verify.html",
            {
                "request": request,
                "program_id": program_id,
                "program_name": program_id.upper(),
                "error": "This license is suspended.",
                "license_id": license_id
            },
            status_code=403
        )
    
    # Verify authorization
    auth = db.get(ProgramAuthorization, license_rec.authorization_id)
    if not auth or auth.status != "active":
        return templates.TemplateResponse(
            "access_verify.html",
            {
                "request": request,
                "program_id": program_id,
                "program_name": program_id.upper(),
                "error": "License authorization is not active.",
                "license_id": license_id
            },
            status_code=403
        )
    
    # Get license JSON for roles/features
    try:
        license_json = json.loads(license_rec.payload_json)
        roles = license_json.get("roles", [])
        entitlements = license_json.get("entitlements", {})
        features = entitlements.get("features", [])
    except:
        roles = []
        features = []
    
    # Generate session token
    session_token = generate_session_token(
        license_id=license_id,
        program_id=program_id,
        org_id=license_rec.org_id,
        roles=roles,
        features=features
    )
    
    # Log access event
    log_event(
        db,
        actor="user",
        action="access.gateway",
        ref_id=license_id,
        detail=json.dumps({
            "program_id": program_id,
            "org_id": license_rec.org_id,
            "method": "serial_number"
        }, ensure_ascii=False)
    )
    
    # Get program URL
    program_url = PROGRAM_URLS.get(program_id)
    if not program_url:
        raise HTTPException(500, "Program URL not configured")
    
    # Redirect to program with token
    # For EM&V, redirect to root with token (it will auto-login)
    # For other programs, adjust as needed
    if program_id == "emv":
        redirect_url = f"{program_url}/?token={session_token}"
    else:
        redirect_url = f"{program_url}/login?token={session_token}"
    return RedirectResponse(url=redirect_url, status_code=302)

@router.post("/api/validate-session-token")
async def validate_session_token_endpoint(
    body: Dict[str, Any] = Body(...),
    db: Session = Depends(db_session)
):
    """
    Validate a session token and return license information.
    
    Called by EM&V or Tracking programs to validate tokens.
    
    Request body: {"token": "jwt_token_string"}
    """
    try:
        token = body.get("token")
        if not token:
            return JSONResponse(
                status_code=400,
                content={"valid": False, "reason": "token_required"}
            )
        
        claims = validate_session_token(token)
        license_id = claims.get("license_id")
        
        if not license_id:
            return JSONResponse(
                status_code=400,
                content={"valid": False, "reason": "missing_license_id"}
            )
        
        # Verify license still exists and is valid
        license_rec = db.get(License, license_id)
        if not license_rec:
            return JSONResponse(
                status_code=404,
                content={"valid": False, "reason": "license_not_found"}
            )
        
        if license_rec.revoked:
            return JSONResponse(
                status_code=403,
                content={"valid": False, "reason": "license_revoked"}
            )
        
        if license_rec.suspended:
            return JSONResponse(
                status_code=403,
                content={"valid": False, "reason": "license_suspended"}
            )
        
        # Verify authorization
        auth = db.get(ProgramAuthorization, license_rec.authorization_id)
        if not auth or auth.status != "active":
            return JSONResponse(
                status_code=403,
                content={"valid": False, "reason": "authorization_inactive"}
            )
        
        # Return token claims and license info
        return {
            "valid": True,
            "license_id": license_id,
            "program_id": claims.get("program_id"),
            "org_id": claims.get("sub"),
            "roles": claims.get("roles", []),
            "features": claims.get("features", []),
            "verified_at": claims.get("verified_at")
        }
        
    except ValueError as e:
        return JSONResponse(
            status_code=401,
            content={"valid": False, "reason": str(e)}
        )

@router.get("/auth/api/check-session")
def check_session(request: Request, db: Session = Depends(db_session)):
    """
    Check session and return user info.
    Used by website MyAccount page.
    Does NOT modify token/payload structures - only reads organization data.
    """
    # Check if user has a session (could be from license lookup, admin login, etc.)
    # For now, check if there's an org_id in session or from query params
    org_id = request.session.get("org_id") or request.query_params.get("org_id")
    
    if not org_id:
        return JSONResponse(
            status_code=401,
            content={"authenticated": False, "message": "No session found"}
        )
    
    # Get organization
    org = db.get(Organization, org_id)
    if not org:
        return JSONResponse(
            status_code=404,
            content={"authenticated": False, "message": "Organization not found"}
        )
    
    # Build response based on org_type
    response = {
        "authenticated": True,
        "org_id": org.org_id,
        "org_name": org.org_name,
        "org_type": org.org_type,
        "email": org.email
    }
    
    # Add PE-specific fields if org_type is 'pe'
    if org.org_type == "pe":
        response["user_type"] = "licensed_pe"
        response["pe_approval_status"] = org.pe_approval_status or "pending"
        response["pe_license_number"] = org.pe_license_number
        response["pe_license_state"] = org.pe_license_state
        response["pe_linked_org_id"] = org.pe_linked_org_id
    
    return response