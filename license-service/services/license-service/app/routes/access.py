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


def _get_redirect_base_url(request: Request) -> str:
    """Get browser-accessible base URL (e.g. https://synerexlabs.com) for redirects.
    Prefers settings.website_url (always the public hostname) so internal Docker
    container names like 'proxy' never leak into browser-facing redirects."""
    if settings.website_url:
        return settings.website_url.rstrip("/")
    proto = request.headers.get("X-Forwarded-Proto", request.url.scheme)
    host = request.headers.get("X-Forwarded-Host", request.url.netloc)
    return f"{proto}://{host}".rstrip("/")

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
        base = _get_redirect_base_url(request)
        # First try as a user SSO JWT (from my-account page)
        from ..services.jwt_tokens import validate_user_token
        try:
            validate_user_token(token)
            # Valid user JWT — redirect directly to the program SSO endpoint
            if program_id == "emv":
                return RedirectResponse(url=f"{base}/emv/sso?token={token}", status_code=302)
            else:
                return RedirectResponse(url=f"{base}/tracking/sso?token={token}", status_code=302)
        except ValueError:
            pass  # Not a user JWT, try as admin or program session token below

        # Try as a Synerex Admin session token (non-JWT opaque token)
        from ..auth.admin_tokens import verify_admin_token
        if verify_admin_token(token):
            # Valid admin token — forward to program SSO which handles it via verify_user_jwt
            if program_id == "emv":
                return RedirectResponse(url=f"{base}/emv/sso?token={token}", status_code=302)
            else:
                return RedirectResponse(url=f"{base}/tracking/sso?token={token}", status_code=302)

        # Try as a program session token
        try:
            claims = validate_session_token(token)
            if claims.get("program_id") != program_id:
                raise HTTPException(403, "Token is for a different program")
            if program_id == "emv":
                redirect_url = f"{base}/emv/?token={token}"
            else:
                redirect_url = f"{base}/tracking/sso?token={token}"
            return RedirectResponse(url=redirect_url, status_code=302)
        except ValueError as e:
            return templates.TemplateResponse(
                "access_verify.html",
                {
                    "request": request,
                    "program_id": program_id,
                    "program_name": program_id.upper(),
                    "error": f"Invalid or expired access token: {str(e)}",
                    "license_id": license_id or "",
                    "path_prefix": (settings.root_path or "").rstrip("/"),
                    "brand_logo_url": None,
                    "brand_name": None,
                }
            )

    # Admins skip the serial-number gate entirely — use their session token for SSO
    if request.session.get("admin_logged_in"):
        admin_token = request.session.get("session_token")
        if admin_token:
            base = _get_redirect_base_url(request)
            if program_id == "emv":
                return RedirectResponse(url=f"{base}/emv/sso?token={admin_token}", status_code=302)
            else:
                return RedirectResponse(url=f"{base}/tracking/sso?token={admin_token}", status_code=302)

    # Resolve OEM branding via the license_id → org → sponsor_org
    path_prefix = (settings.root_path or "").rstrip("/")
    brand_logo_url = None
    brand_name = None
    if license_id:
        try:
            from ..routes.oem_admin import _fetch_oem_branding
            lic_rec = db.get(License, license_id)
            if lic_rec and lic_rec.org_id:
                client_org = db.get(Organization, lic_rec.org_id)
                sponsor_id = getattr(client_org, "sponsor_org_id", None) if client_org else None
                if sponsor_id:
                    branding = _fetch_oem_branding(sponsor_id)
                    brand_logo_url = branding.get("brand_logo_url")
                    brand_name = branding.get("brand_name")
        except Exception:
            pass

    # Show verification form
    return templates.TemplateResponse(
        "access_verify.html",
        {
            "request": request,
            "program_id": program_id,
            "program_name": program_id.upper(),
            "error": None,
            "license_id": license_id or "",
            "path_prefix": path_prefix,
            "brand_logo_url": brand_logo_url,
            "brand_name": brand_name,
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

    path_prefix = (settings.root_path or "").rstrip("/")

    # Resolve OEM branding for this license
    _brand_logo_url = None
    _brand_name = None
    try:
        from ..routes.oem_admin import _fetch_oem_branding
        _lic_tmp = db.get(License, license_id)
        if _lic_tmp and _lic_tmp.org_id:
            _client_org = db.get(Organization, _lic_tmp.org_id)
            _sponsor_id = getattr(_client_org, "sponsor_org_id", None) if _client_org else None
            if _sponsor_id:
                _b = _fetch_oem_branding(_sponsor_id)
                _brand_logo_url = _b.get("brand_logo_url")
                _brand_name = _b.get("brand_name")
    except Exception:
        pass

    def _error_page(msg, status=400):
        return templates.TemplateResponse(
            "access_verify.html",
            {
                "request": request,
                "program_id": program_id,
                "program_name": program_id.upper(),
                "error": msg,
                "license_id": license_id,
                "path_prefix": path_prefix,
                "brand_logo_url": _brand_logo_url,
                "brand_name": _brand_name,
            },
            status_code=status,
        )

    # Get license
    license_rec = db.get(License, license_id)
    if not license_rec:
        return _error_page("License not found. Please check your serial number.", 404)

    # Verify license is for correct program
    if license_rec.program_id != program_id:
        return _error_page(f"This license is for {license_rec.program_id.upper()}, not {program_id.upper()}.")

    # Check if license is valid
    if license_rec.revoked:
        return _error_page("This license has been revoked.", 403)

    if license_rec.suspended:
        return _error_page("This license is suspended.", 403)

    # Verify authorization
    auth = db.get(ProgramAuthorization, license_rec.authorization_id)
    if not auth or auth.status != "active":
        return _error_page("License authorization is not active.", 403)
    
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
    
    # Build browser-accessible redirect URL from request origin (works behind proxy)
    base = _get_redirect_base_url(request)
    if program_id == "emv":
        redirect_url = f"{base}/emv/?token={session_token}"
    else:
        redirect_url = f"{base}/tracking/sso?token={session_token}"
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
    # Synerex Admin bypass: admin panel login sets admin_logged_in but not org_id.
    # Return a synthetic admin response so MyAccount can show the Admin Access section
    # and build the correct SSO URL via getAccessUrl("emv").
    # IMPORTANT: Only fire this bypass when user_logged_in is NOT also set — if both
    # flags exist in the same session (e.g. admin logged in, then OEM logged in without
    # fully clearing the session), prefer the regular user session to prevent privilege
    # escalation where an OEM is incorrectly treated as Synerex Admin.
    if request.session.get("admin_logged_in") and not request.session.get("user_logged_in"):
        from ..config import settings
        return JSONResponse(
            status_code=200,
            content={
                "authenticated": True,
                "user_type": "admin",
                "org_id": "admin",
                "org_name": "Synerex Laboratories",
                "org_type": "admin",
                "email": settings.admin_sso_email,
                "role": "administrator",
            },
        )

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
    
    # Look up the individual user's role from the session username
    username = request.session.get("username")
    user_role = None
    if username:
        from ..models.user import User as _User
        user = db.get(_User, username)
        if user:
            user_role = getattr(user, "role", None)

    # Build response based on org_type
    response = {
        "authenticated": True,
        "org_id": org.org_id,
        "org_name": org.org_name,
        "org_type": org.org_type,
        "email": org.email,
        "role": user_role,
    }
    
    # Add PE-specific fields if org_type is 'pe'
    if org.org_type == "pe":
        response["user_type"] = "licensed_pe"
        response["pe_approval_status"] = org.pe_approval_status or "pending"
        response["pe_license_number"] = org.pe_license_number
        response["pe_license_state"] = org.pe_license_state
        response["pe_linked_org_id"] = org.pe_linked_org_id

    # For customer orgs, include license status so the portal can show renewal prompt
    if org.org_type == "customer":
        try:
            from ..models.license import License as _License
            lic = (
                db.query(_License)
                .filter(
                    _License.org_id == org.org_id,
                    _License.program_id == "tracking",
                    _License.revoked == False,
                )
                .order_by(_License.issued_at.desc())
                .first()
            )
            if lic:
                response["license_id"] = lic.license_id
                response["license_expires_at"] = lic.expires_at.isoformat() if lic.expires_at else None
                response["license_suspended"] = bool(lic.suspended)
                response["license_active"] = not lic.suspended and not lic.revoked and (
                    lic.expires_at is None or lic.expires_at > __import__("datetime").datetime.utcnow()
                )
            else:
                response["license_id"] = None
                response["license_active"] = False
                response["license_suspended"] = False
        except Exception:
            pass

    return response