from __future__ import annotations
import json
import os
import sys
import time
import platform
import requests
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, Form, HTTPException, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session
from sqlalchemy import case, or_, func

from ..config import settings
from ..db import SessionLocal
from ..models.org import Organization
from ..models.api_key import ApiKey
from ..models.authorization import ProgramAuthorization
from ..models.license import License
from ..models.audit import AuditEvent
from ..models.billing import BillingOrder
from ..auth.api_keys import create_api_key, _hash_key  # internal use for key creation
from ..templates_loader import load_template
from ..programs.guardrails import validate_template
from ..audit.events import log_event

ADMIN_TEMPLATES_DIR = Path(__file__).resolve().parent / "templates"
templates = Jinja2Templates(directory=str(ADMIN_TEMPLATES_DIR))

router = APIRouter(prefix="/admin", tags=["admin"])

def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def _is_logged_in(request: Request) -> bool:
    """Check if user is logged in. Returns False if session is not available."""
    try:
        return bool(request.session.get("admin_logged_in", False))
    except (AttributeError, KeyError, RuntimeError):
        # Session not available or not initialized
        return False

def require_admin(request: Request):
    if not _is_logged_in(request):
        raise HTTPException(401, "Not authenticated")
    return True

@router.get("/login", response_class=HTMLResponse)
def login_page(request: Request):
    """Display login page. Never redirects - always shows the form."""
    # Get return_url from query params to preserve it
    return_url = request.query_params.get("return_url", "")
    # Explicitly return the template without any redirects or checks
    # This ensures the page always loads without looping
    try:
        return templates.TemplateResponse("login.html", {"request": request, "error": None, "return_url": return_url})
    except Exception as e:
        # If template rendering fails, return a simple HTML response
        return_url_param = f'?return_url={return_url}' if return_url else ''
        return HTMLResponse(f"""
        <html>
        <body>
            <h1>Admin Login</h1>
            <p>Error loading template: {str(e)}</p>
            <form method="post" action="/admin/login{return_url_param}">
                <label>Username:</label><br/>
                <input name="username" required /><br/><br/>
                <label>Password:</label><br/>
                <input name="password" type="password" required /><br/><br/>
                <button type="submit">Login</button>
            </form>
        </body>
        </html>
        """)

@router.post("/login", response_class=HTMLResponse)
def login_submit(request: Request, username: str = Form(...), password: str = Form(...)):
    # Get return_url from query params (passed from website)
    return_url = request.query_params.get("return_url")
    
    # If already logged in, redirect appropriately
    if _is_logged_in(request):
        if return_url:
            # Generate a simple session token for external use
            import uuid
            session_token = str(uuid.uuid4())
            request.session["session_token"] = session_token
            separator = "&" if "?" in return_url else "?"
            return RedirectResponse(f"{return_url}{separator}token={session_token}", status_code=303)
        return RedirectResponse("/admin", status_code=303)
    
    if username == settings.admin_username and password == settings.admin_password:
        request.session["admin_logged_in"] = True
        request.session["admin_username"] = username
        
        # If return_url is provided (from website), redirect there with token
        if return_url:
            # Generate a session token for external use
            import uuid
            session_token = str(uuid.uuid4())
            request.session["session_token"] = session_token
            separator = "&" if "?" in return_url else "?"
            return RedirectResponse(f"{return_url}{separator}token={session_token}", status_code=303)
        
        # Otherwise, redirect to License Service admin dashboard
        return RedirectResponse("/admin", status_code=303)
    return templates.TemplateResponse("login.html", {"request": request, "error": "Invalid credentials"}, status_code=401)

@router.post("/logout")
def logout(request: Request):
    request.session.clear()
    return RedirectResponse("/admin/login", status_code=303)

@router.get("", response_class=HTMLResponse)
def dashboard(request: Request, _=Depends(require_admin), db: Session = Depends(db_session)):
    counts = {
        "orgs": db.query(Organization).count(),
        "api_keys": db.query(ApiKey).count(),
        "authorizations": db.query(ProgramAuthorization).count(),
        "licenses": db.query(License).count(),
    }
    return templates.TemplateResponse("dashboard.html", {"request": request, "counts": counts})

# ---- Orgs ----
@router.get("/pe-registrations", response_class=HTMLResponse)
def pe_registrations_page(request: Request, _=Depends(require_admin), db: Session = Depends(db_session)):
    """Page to view and manage PE registrations."""
    try:
        status_filter = request.query_params.get("status", "").strip()  # pending, approved, rejected
        
        query = db.query(Organization).filter(Organization.org_type == "pe")
        
        if status_filter in ("pending", "approved", "rejected"):
            query = query.filter(Organization.pe_approval_status == status_filter)
            query = query.order_by(Organization.org_id.asc())
        elif status_filter == "":
            # Default: show pending first (including None), then sort by org_id
            # Handle None values explicitly - treat None as "pending" for sorting
            # Use coalesce to convert None to "pending" for sorting
            query = query.order_by(
                case(
                    (func.coalesce(Organization.pe_approval_status, "pending") == "pending", 1),
                    (func.coalesce(Organization.pe_approval_status, "pending") == "approved", 2),
                    (func.coalesce(Organization.pe_approval_status, "pending") == "rejected", 3),
                    else_=4
                ),
                Organization.org_id.asc()  # Secondary sort by org_id
            )
        else:
            # Invalid status filter, just sort by org_id
            query = query.order_by(Organization.org_id.asc())
        
        pe_orgs = query.all()
        
        # Count by status - handle None values explicitly
        pending_count = db.query(Organization).filter(
            Organization.org_type == "pe",
            or_(
                Organization.pe_approval_status == "pending",
                Organization.pe_approval_status.is_(None)
            )
        ).count()
        approved_count = db.query(Organization).filter(
            Organization.org_type == "pe",
            Organization.pe_approval_status == "approved"
        ).count()
        rejected_count = db.query(Organization).filter(
            Organization.org_type == "pe",
            Organization.pe_approval_status == "rejected"
        ).count()
        
        return templates.TemplateResponse("pe_registrations.html", {
            "request": request,
            "pe_orgs": pe_orgs,
            "status_filter": status_filter,
            "pending_count": pending_count,
            "approved_count": approved_count,
            "rejected_count": rejected_count
        })
    except Exception as e:
        import traceback
        error_msg = str(e)
        traceback.print_exc()
        # Log the error and return a user-friendly error page
        error_html = f"""
        <html>
        <head><title>Error</title></head>
        <body style="font-family: Arial, sans-serif; padding: 2rem;">
            <h1>Internal Server Error</h1>
            <p>An error occurred while loading PE registrations:</p>
            <pre style="background: #f5f5f5; padding: 1rem; border-radius: 4px; overflow: auto;">{error_msg}</pre>
            <p><a href="/admin" style="color: #1976d2; text-decoration: none;">← Back to Admin Dashboard</a></p>
        </body>
        </html>
        """
        return HTMLResponse(content=error_html, status_code=500)

@router.post("/pe-registrations/{org_id}/approve")
def approve_pe(request: Request, org_id: str, _=Depends(require_admin), db: Session = Depends(db_session)):
    """Approve a PE registration and sync to EMV."""
    org = db.get(Organization, org_id)
    if not org:
        raise HTTPException(404, "Organization not found")
    
    if org.org_type != "pe":
        raise HTTPException(400, "Organization is not a Licensed PE")
    
    if org.pe_approval_status == "approved":
        return RedirectResponse(f"/admin/pe-registrations?status=approved&message=PE+already+approved&message_type=info", status_code=303)
    
    # Update approval status
    org.pe_approval_status = "approved"
    db.commit()
    
    # Sync to EMV
    try:
        sync_pe_to_emv(org)
        log_event(db, actor="admin", action="pe.approve", ref_id=org_id,
                 detail={"pe_license_number": org.pe_license_number, "pe_license_state": org.pe_license_state, "synced_to_emv": True})
    except Exception as e:
        # Log error but don't fail the approval
        log_event(db, actor="admin", action="pe.approve", ref_id=org_id,
                 detail={"pe_license_number": org.pe_license_number, "pe_license_state": org.pe_license_state, "synced_to_emv": False, "error": str(e)})
        # Still approve even if sync fails - admin can manually sync later
    
    return RedirectResponse(f"/admin/pe-registrations?status=approved&message=PE+approved+and+synced+to+EMV&message_type=success", status_code=303)

@router.post("/pe-registrations/{org_id}/reject")
def reject_pe(request: Request, org_id: str, reason: str = Form(None), _=Depends(require_admin), db: Session = Depends(db_session)):
    """Reject a PE registration."""
    org = db.get(Organization, org_id)
    if not org:
        raise HTTPException(404, "Organization not found")
    
    if org.org_type != "pe":
        raise HTTPException(400, "Organization is not a Licensed PE")
    
    # Update approval status
    org.pe_approval_status = "rejected"
    db.commit()
    
    log_event(db, actor="admin", action="pe.reject", ref_id=org_id,
             detail={"pe_license_number": org.pe_license_number, "pe_license_state": org.pe_license_state, "reason": reason})
    
    return RedirectResponse(f"/admin/pe-registrations?status=rejected&message=PE+registration+rejected&message_type=success", status_code=303)

@router.post("/pe-registrations/{org_id}/sync")
def sync_pe_to_emv_endpoint(request: Request, org_id: str, _=Depends(require_admin), db: Session = Depends(db_session)):
    """Manually sync a PE to EMV."""
    org = db.get(Organization, org_id)
    if not org:
        raise HTTPException(404, "Organization not found")
    
    if org.org_type != "pe":
        raise HTTPException(400, "Organization is not a Licensed PE")
    
    if org.pe_approval_status != "approved":
        return RedirectResponse(f"/admin/pe-registrations?message=PE+must+be+approved+before+syncing&message_type=error", status_code=303)
    
    try:
        sync_pe_to_emv(org)
        log_event(db, actor="admin", action="pe.sync", ref_id=org_id,
                 detail={"pe_license_number": org.pe_license_number, "pe_license_state": org.pe_license_state, "synced_to_emv": True})
        return RedirectResponse(f"/admin/pe-registrations?message=PE+synced+to+EMV+successfully&message_type=success", status_code=303)
    except Exception as e:
        log_event(db, actor="admin", action="pe.sync", ref_id=org_id,
                 detail={"pe_license_number": org.pe_license_number, "pe_license_state": org.pe_license_state, "synced_to_emv": False, "error": str(e)})
        return RedirectResponse(f"/admin/pe-registrations?message=Sync+failed%3A+{str(e).replace(' ', '+')[:50]}&message_type=error", status_code=303)

def sync_pe_to_emv(org: Organization):
    """Sync PE organization data to EMV's pe_certifications table."""
    
    if not org.pe_license_number or not org.pe_license_state:
        raise ValueError("PE license number and state are required")
    
    # Prepare data for EMV API
    emv_data = {
        "name": org.org_name or org.contact_name or "Unknown",
        "license_number": org.pe_license_number,
        "state": org.pe_license_state,
        "discipline": None,  # Not stored in Organization model
        "expiration_date": None,  # Not stored in Organization model
        "email": org.email,
        "phone": org.phone
    }
    
    # Call EMV's PE registration endpoint
    emv_url = f"{settings.emv_program_url}/api/pe/register"
    
    try:
        response = requests.post(
            emv_url,
            json=emv_data,
            timeout=10,
            headers={"Content-Type": "application/json"}
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        raise Exception(f"Failed to sync to EMV: {str(e)}")

@router.get("/orgs", response_class=HTMLResponse)
def orgs_page(request: Request, _=Depends(require_admin), db: Session = Depends(db_session)):
    search = request.query_params.get("search", "").strip()
    org_type_filter = request.query_params.get("type", "").strip()
    
    query = db.query(Organization)
    
    if search:
        query = query.filter(
            (Organization.org_id.ilike(f"%{search}%")) |
            (Organization.org_name.ilike(f"%{search}%"))
        )
    
    if org_type_filter and org_type_filter in ("oem", "customer", "pe"):
        query = query.filter(Organization.org_type == org_type_filter)
    
    orgs = query.order_by(Organization.org_id.asc()).all()
    
    # Get stats for each org
    orgs_with_stats = []
    for org in orgs:
        licenses_count = db.query(License).filter(License.org_id == org.org_id).count()
        authorizations_count = db.query(ProgramAuthorization).filter(ProgramAuthorization.org_id == org.org_id).count()
        api_keys_count = db.query(ApiKey).filter(ApiKey.org_id == org.org_id).count()
        api_keys_active = db.query(ApiKey).filter(ApiKey.org_id == org.org_id, ApiKey.is_active == True).count()
        billing_orders_count = db.query(BillingOrder).filter(BillingOrder.org_id == org.org_id).count()
        
        orgs_with_stats.append({
            "org": org,
            "licenses_count": licenses_count,
            "authorizations_count": authorizations_count,
            "api_keys_count": api_keys_count,
            "api_keys_active": api_keys_active,
            "billing_orders_count": billing_orders_count,
        })
    
    return templates.TemplateResponse("orgs.html", {
        "request": request,
        "orgs_with_stats": orgs_with_stats,
        "search": search,
        "type_filter": org_type_filter,
        "error": None
    })

@router.post("/orgs")
def orgs_create(request: Request, org_id: str = Form(...), org_name: str = Form(...), org_type: str = Form(...), _=Depends(require_admin), db: Session = Depends(db_session)):
    if org_type not in ("oem", "customer", "pe"):
        raise HTTPException(400, "org_type must be oem, customer, or pe")
    if db.get(Organization, org_id):
        return templates.TemplateResponse("orgs.html", {"request": request, "orgs_with_stats": [], "error": "org_id already exists"}, status_code=409)
    db.add(Organization(org_id=org_id, org_name=org_name, org_type=org_type))
    db.commit()
    log_event(db, actor="admin", action="org.create", ref_id=org_id, detail={"org_name": org_name, "org_type": org_type})
    return RedirectResponse("/admin/orgs", status_code=303)

@router.get("/orgs/{org_id}", response_class=HTMLResponse)
def org_detail(org_id: str, request: Request, tab: str = "overview", _=Depends(require_admin), db: Session = Depends(db_session)):
    """Organization detail page with tabs."""
    org = db.get(Organization, org_id)
    if not org:
        raise HTTPException(404, "Organization not found")
    
    # Get related data
    licenses = db.query(License).filter(License.org_id == org_id).order_by(License.issued_at.desc()).limit(50).all()
    authorizations = db.query(ProgramAuthorization).filter(ProgramAuthorization.org_id == org_id).order_by(ProgramAuthorization.authorization_id.desc()).limit(50).all()
    api_keys = db.query(ApiKey).filter(ApiKey.org_id == org_id).order_by(ApiKey.key_id.desc()).limit(50).all()
    billing_orders = db.query(BillingOrder).filter(BillingOrder.org_id == org_id).order_by(BillingOrder.created_at.desc()).limit(50).all()
    audit_events = db.query(AuditEvent).filter(AuditEvent.ref_id == org_id).order_by(AuditEvent.at.desc()).limit(100).all()
    
    # Calculate stats
    stats = {
        "licenses_total": len(licenses),
        "licenses_active": len([l for l in licenses if not l.revoked and not l.suspended]),
        "licenses_revoked": len([l for l in licenses if l.revoked]),
        "authorizations_total": len(authorizations),
        "authorizations_active": len([a for a in authorizations if a.status == "active"]),
        "api_keys_total": len(api_keys),
        "api_keys_active": len([k for k in api_keys if k.is_active]),
        "billing_orders_total": len(billing_orders),
        "billing_orders_paid": len([o for o in billing_orders if o.status == "paid"]),
        "billing_orders_pending": len([o for o in billing_orders if o.status == "pending"]),
    }
    
    return templates.TemplateResponse("org_detail.html", {
        "request": request,
        "org": org,
        "tab": tab,
        "licenses": licenses,
        "authorizations": authorizations,
        "api_keys": api_keys,
        "billing_orders": billing_orders,
        "audit_events": audit_events,
        "stats": stats,
    })

@router.get("/orgs/{org_id}/edit", response_class=HTMLResponse)
def org_edit_page(org_id: str, request: Request, _=Depends(require_admin), db: Session = Depends(db_session)):
    """Edit organization page."""
    org = db.get(Organization, org_id)
    if not org:
        raise HTTPException(404, "Organization not found")
    
    message = request.query_params.get("message", "").replace("+", " ")
    message_type = request.query_params.get("message_type", "success")
    
    return templates.TemplateResponse("org_edit.html", {
        "request": request,
        "org": org,
        "message": message,
        "message_type": message_type,
    })

@router.post("/orgs/{org_id}/edit")
def org_update(org_id: str, request: Request, 
               org_name: str = Form(None),
               org_type: str = Form(None),
               email: str = Form(None),
               contact_name: str = Form(None),
               phone: str = Form(None),
               address: str = Form(None),
               billing_email: str = Form(None),
               _=Depends(require_admin), 
               db: Session = Depends(db_session)):
    """Update organization."""
    org = db.get(Organization, org_id)
    if not org:
        raise HTTPException(404, "Organization not found")
    
    if org_type and org_type not in ("oem", "customer", "pe"):
        return RedirectResponse(f"/admin/orgs/{org_id}/edit?message=Invalid+org_type&message_type=error", status_code=303)
    
    # Update fields if provided
    if org_name:
        org.org_name = org_name
    if org_type:
        org.org_type = org_type
    if email is not None:
        org.email = email if email else None
    if contact_name is not None:
        org.contact_name = contact_name if contact_name else None
    if phone is not None:
        org.phone = phone if phone else None
    if address is not None:
        org.address = address if address else None
    if billing_email is not None:
        org.billing_email = billing_email if billing_email else None
    
    db.commit()
    log_event(db, actor="admin", action="org.update", ref_id=org_id, detail={"updated_fields": ["org_name", "org_type", "email", "contact_name", "phone", "address", "billing_email"]})
    return RedirectResponse(f"/admin/orgs/{org_id}/edit?message=Organization+updated+successfully&message_type=success", status_code=303)

@router.post("/orgs/{org_id}/delete")
def org_delete(org_id: str, request: Request, _=Depends(require_admin), db: Session = Depends(db_session)):
    """Delete organization (with safety checks)."""
    org = db.get(Organization, org_id)
    if not org:
        raise HTTPException(404, "Organization not found")
    
    # Check for related records
    licenses_count = db.query(License).filter(License.org_id == org_id).count()
    authorizations_count = db.query(ProgramAuthorization).filter(ProgramAuthorization.org_id == org_id).count()
    
    if licenses_count > 0 or authorizations_count > 0:
        return RedirectResponse(f"/admin/orgs/{org_id}?tab=overview&message=Cannot+delete+organization+with+existing+licenses+or+authorizations&message_type=error", status_code=303)
    
    db.delete(org)
    db.commit()
    log_event(db, actor="admin", action="org.delete", ref_id=org_id, detail={})
    return RedirectResponse("/admin/orgs?message=Organization+deleted+successfully&message_type=success", status_code=303)

# ---- API Keys ----
@router.get("/api-keys", response_class=HTMLResponse)
def api_keys_page(request: Request, _=Depends(require_admin), db: Session = Depends(db_session)):
    keys = db.query(ApiKey).order_by(ApiKey.key_id.desc()).limit(500).all()
    return templates.TemplateResponse("api_keys.html", {"request": request, "keys": keys, "issued": None, "error": None})

@router.post("/api-keys/issue")
def api_keys_issue(request: Request, org_id: str = Form(...), scopes_csv: str = Form(...), _=Depends(require_admin), db: Session = Depends(db_session)):
    org = db.get(Organization, org_id)
    if not org:
        keys = db.query(ApiKey).order_by(ApiKey.key_id.desc()).limit(500).all()
        return templates.TemplateResponse("api_keys.html", {"request": request, "keys": keys, "issued": None, "error": "Organization not found"}, status_code=404)

    raw, key_hash = create_api_key(prefix="syx")
    key_id = f"KEY-{int(datetime.utcnow().timestamp())}"
    rec = ApiKey(key_id=key_id, org_id=org_id, key_hash=key_hash, scopes=scopes_csv, is_active=True)
    db.add(rec); db.commit()

    keys = db.query(ApiKey).order_by(ApiKey.key_id.desc()).limit(500).all()
    # raw shown once
    return templates.TemplateResponse("api_keys.html", {"request": request, "keys": keys, "issued": {"key_id": key_id, "api_key": raw}, "error": None})

@router.post("/api-keys/{key_id}/disable")
def api_keys_disable(key_id: str, request: Request, _=Depends(require_admin), db: Session = Depends(db_session)):
    rec = db.get(ApiKey, key_id)
    if not rec:
        raise HTTPException(404, "Not found")
    rec.is_active = False
    db.commit()
    return RedirectResponse("/admin/api-keys", status_code=303)

# ---- Templates (read-only, from repo) ----
# Path: services/license-service/app/admin/ui.py
# parents[0]=admin, [1]=app, [2]=license-service, [3]=services, [4]=project root
# Need to go up 4 levels to project root, then add templates/
TEMPLATES_ROOT = Path(__file__).resolve().parents[4] / "templates"

def _list_templates(program_id: str):
    """Load template files and extract summary information."""
    folder = TEMPLATES_ROOT / program_id
    if not folder.exists():
        return []
    
    templates_list = []
    for path in sorted(folder.glob("*.json"), key=lambda p: p.name):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            # Extract tier name from filename (e.g., "pro.json" -> "Pro")
            tier_name = path.stem.replace("_", " ").title()
            
            # Get enabled products
            enabled_products = []
            if data.get("products", {}).get("emv", {}).get("enabled"):
                enabled_products.append("EM&V")
            if data.get("products", {}).get("tracking", {}).get("enabled"):
                enabled_products.append("Tracking")
            
            # Get key information
            entitlements = data.get("entitlements", {})
            limits = entitlements.get("limits", {})
            features = entitlements.get("features", [])
            
            templates_list.append({
                "name": path.name,
                "path": path,
                "tier_name": tier_name,
                "template_id": data.get("template_id", ""),
                "policy_version": data.get("policy_version", ""),
                "enabled_products": enabled_products,
                "feature_count": len(features),
                "roles": data.get("roles", []),
                "limits": limits,
                "support_tier": entitlements.get("support_tier", ""),
                "api_access": entitlements.get("api_access", False),
                "data_retention_days": entitlements.get("data_retention_days", 0)
            })
        except Exception as e:
            # If JSON parsing fails, still include the file with minimal info
            templates_list.append({
                "name": path.name,
                "path": path,
                "tier_name": path.stem.replace("_", " ").title(),
                "error": str(e)
            })
    
    return templates_list

@router.get("/templates", response_class=HTMLResponse)
def templates_page(request: Request, _=Depends(require_admin)):
    emv = _list_templates("emv")
    tracking = _list_templates("tracking")
    return templates.TemplateResponse("templates.html", {"request": request, "emv": emv, "tracking": tracking})

@router.get("/templates/{program_id}/{filename}", response_class=HTMLResponse)
def template_detail(program_id: str, filename: str, request: Request, _=Depends(require_admin)):
    path = (TEMPLATES_ROOT / program_id / filename).resolve()
    if not str(path).startswith(str((TEMPLATES_ROOT / program_id).resolve())):
        raise HTTPException(400, "bad path")
    if not path.exists():
        raise HTTPException(404, "Not found")
    data = json.loads(path.read_text(encoding="utf-8"))
    # validate guardrails
    validate_template("emv" if program_id=="emv" else "tracking", data)
    return templates.TemplateResponse("template_detail.html", {"request": request, "program_id": program_id, "filename": filename, "data": data})

# ---- Authorizations ----
@router.get("/authorizations", response_class=HTMLResponse)
def authorizations_page(request: Request, _=Depends(require_admin), db: Session = Depends(db_session)):
    search = request.query_params.get("search", "").strip()
    program_filter = request.query_params.get("program", "").strip()
    status_filter = request.query_params.get("status", "").strip()
    
    query = db.query(ProgramAuthorization)
    
    if search:
        query = query.filter(
            (ProgramAuthorization.authorization_id.ilike(f"%{search}%")) |
            (ProgramAuthorization.org_id.ilike(f"%{search}%")) |
            (ProgramAuthorization.template_id.ilike(f"%{search}%"))
        )
    
    if program_filter and program_filter in ("emv", "tracking"):
        query = query.filter(ProgramAuthorization.program_id == program_filter)
    
    if status_filter and status_filter in ("active", "suspended", "terminated"):
        query = query.filter(ProgramAuthorization.status == status_filter)
    
    authzs = query.order_by(ProgramAuthorization.authorization_id.desc()).limit(500).all()
    
    # Get stats for each authorization
    authzs_with_stats = []
    for auth in authzs:
        licenses_count = db.query(License).filter(License.authorization_id == auth.authorization_id).count()
        licenses_active = db.query(License).filter(
            License.authorization_id == auth.authorization_id,
            License.revoked == False,
            License.suspended == False
        ).count()
        
        authzs_with_stats.append({
            "auth": auth,
            "licenses_count": licenses_count,
            "licenses_active": licenses_active,
        })
    
    return templates.TemplateResponse("authorizations.html", {
        "request": request,
        "authzs_with_stats": authzs_with_stats,
        "search": search,
        "program_filter": program_filter,
        "status_filter": status_filter,
        "error": None,
    })

@router.get("/authorizations/new", response_class=HTMLResponse)
def authorizations_new(request: Request, _=Depends(require_admin)):
    return templates.TemplateResponse("authorization_new.html", {"request": request})

@router.post("/authorizations")
def authorizations_create(
    request: Request,
    authorization_id: str = Form(None),
    program_id: str = Form(...),
    org_id: str = Form(...),
    template_id: str = Form(...),
    status: str = Form("active"),
    starts_at: str = Form(...),
    ends_at: str = Form(...),
    scope_json: str = Form("{}"),
    bindings_override_json: str = Form("{}"),
    issued_by: str = Form("admin"),
    _=Depends(require_admin),
    db: Session = Depends(db_session),
):
    if program_id not in ("emv","tracking"):
        raise HTTPException(400, "program_id must be emv or tracking")
    
    org = db.get(Organization, org_id)
    if not org:
        raise HTTPException(404, "org_id not found")

    # Auto-generate authorization_id if not provided
    if not authorization_id or not authorization_id.strip():
        authorization_id = f"AUTH-{program_id.upper()}-{org_id}-{int(datetime.utcnow().timestamp())}"
    
    # Check if authorization_id already exists
    if db.get(ProgramAuthorization, authorization_id):
        return templates.TemplateResponse("authorizations.html", {
            "request": request,
            "authzs_with_stats": [],
            "search": "",
            "program_filter": "",
            "status_filter": "",
            "error": f"Authorization ID '{authorization_id}' already exists. Please choose a different one or leave blank to auto-generate."
        }, status_code=409)

    # Load/validate template
    template = load_template(program_id, template_id)
    validate_template(program_id, template)

    try:
        scope = json.loads(scope_json or "{}")
        bindings_override = json.loads(bindings_override_json or "{}")
    except Exception:
        raise HTTPException(400, "scope_json/bindings_override_json must be valid JSON")

    auth = ProgramAuthorization(
        authorization_id=authorization_id,
        program_id=program_id,
        org_id=org_id,
        template_id=template_id,
        status=status,
        starts_at=starts_at,
        ends_at=ends_at,
        scope_json=json.dumps(scope, ensure_ascii=False),
        constraints_json=json.dumps({}, ensure_ascii=False),
        bindings_override_json=json.dumps(bindings_override, ensure_ascii=False),
        issued_by=issued_by,
    )
    db.add(auth)
    db.commit()
    log_event(db, actor="admin", action="authorization.create", ref_id=authorization_id, detail={"program_id": program_id, "org_id": org_id, "template_id": template_id, "auto_generated": not authorization_id.startswith("AUTH-")})
    return RedirectResponse("/admin/authorizations", status_code=303)

@router.get("/authorizations/{authorization_id}", response_class=HTMLResponse)
def authorization_detail(authorization_id: str, request: Request, tab: str = "overview", _=Depends(require_admin), db: Session = Depends(db_session)):
    """Authorization detail page with tabs."""
    auth = db.get(ProgramAuthorization, authorization_id)
    if not auth:
        raise HTTPException(404, "Not found")
    
    # Get related data
    licenses = db.query(License).filter(License.authorization_id == authorization_id).order_by(License.issued_at.desc()).limit(50).all()
    audit_events = db.query(AuditEvent).filter(AuditEvent.ref_id == authorization_id).order_by(AuditEvent.at.desc()).limit(100).all()
    org = db.get(Organization, auth.org_id)
    
    # Parse JSON fields
    scope = json.loads(auth.scope_json)
    constraints = json.loads(auth.constraints_json)
    bindings_override = json.loads(auth.bindings_override_json)
    
    # Calculate stats
    stats = {
        "licenses_total": len(licenses),
        "licenses_active": len([l for l in licenses if not l.revoked and not l.suspended]),
        "licenses_revoked": len([l for l in licenses if l.revoked]),
    }
    
    # Load template info if available
    template_info = None
    try:
        template_info = load_template(auth.program_id, auth.template_id)
    except:
        pass
    
    return templates.TemplateResponse("authorization_detail.html", {
        "request": request,
        "auth": auth,
        "org": org,
        "tab": tab,
        "licenses": licenses,
        "audit_events": audit_events,
        "scope": scope,
        "constraints": constraints,
        "bindings_override": bindings_override,
        "template_info": template_info,
        "stats": stats,
    })

@router.get("/authorizations/{authorization_id}/edit", response_class=HTMLResponse)
def authorization_edit_page(authorization_id: str, request: Request, _=Depends(require_admin), db: Session = Depends(db_session)):
    """Edit authorization page."""
    auth = db.get(ProgramAuthorization, authorization_id)
    if not auth:
        raise HTTPException(404, "Authorization not found")
    
    message = request.query_params.get("message", "").replace("+", " ")
    message_type = request.query_params.get("message_type", "success")
    
    scope = json.loads(auth.scope_json)
    constraints = json.loads(auth.constraints_json)
    bindings_override = json.loads(auth.bindings_override_json)
    
    return templates.TemplateResponse("authorization_edit.html", {
        "request": request,
        "auth": auth,
        "scope": scope,
        "constraints": constraints,
        "bindings_override": bindings_override,
        "message": message,
        "message_type": message_type,
    })

@router.post("/authorizations/{authorization_id}/edit")
def authorization_update(
    authorization_id: str,
    request: Request,
    org_id: str = Form(None),
    template_id: str = Form(None),
    status: str = Form(None),
    starts_at: str = Form(None),
    ends_at: str = Form(None),
    scope_json: str = Form(None),
    bindings_override_json: str = Form(None),
    _=Depends(require_admin),
    db: Session = Depends(db_session),
):
    """Update authorization."""
    auth = db.get(ProgramAuthorization, authorization_id)
    if not auth:
        raise HTTPException(404, "Authorization not found")
    
    if status and status not in ("active", "suspended", "terminated"):
        return RedirectResponse(f"/admin/authorizations/{authorization_id}/edit?message=Invalid+status&message_type=error", status_code=303)
    
    if template_id:
        try:
            template = load_template(auth.program_id, template_id)
            validate_template(auth.program_id, template)
            auth.template_id = template_id
        except Exception as e:
            return RedirectResponse(f"/admin/authorizations/{authorization_id}/edit?message=Invalid+template%3A+{str(e)}&message_type=error", status_code=303)
    
    if status:
        auth.status = status
    if starts_at:
        auth.starts_at = starts_at
    if ends_at:
        auth.ends_at = ends_at
    
    if scope_json is not None:
        try:
            json.loads(scope_json)
            auth.scope_json = scope_json
        except:
            return RedirectResponse(f"/admin/authorizations/{authorization_id}/edit?message=Invalid+scope+JSON&message_type=error", status_code=303)
    
    if bindings_override_json is not None:
        try:
            json.loads(bindings_override_json)
            auth.bindings_override_json = bindings_override_json
        except:
            return RedirectResponse(f"/admin/authorizations/{authorization_id}/edit?message=Invalid+bindings+override+JSON&message_type=error", status_code=303)
    
    db.commit()
    log_event(db, actor="admin", action="authorization.update", ref_id=authorization_id, detail={"updated_fields": ["status", "template_id", "starts_at", "ends_at", "scope", "bindings_override"]})
    return RedirectResponse(f"/admin/authorizations/{authorization_id}/edit?message=Authorization+updated+successfully&message_type=success", status_code=303)

@router.post("/authorizations/{authorization_id}/suspend")
def authorization_suspend(authorization_id: str, request: Request, _=Depends(require_admin), db: Session = Depends(db_session)):
    """Suspend authorization."""
    auth = db.get(ProgramAuthorization, authorization_id)
    if not auth:
        raise HTTPException(404, "Authorization not found")
    
    auth.status = "suspended"
    db.commit()
    log_event(db, actor="admin", action="authorization.suspend", ref_id=authorization_id, detail={})
    return RedirectResponse(f"/admin/authorizations/{authorization_id}?tab=overview&message=Authorization+suspended&message_type=success", status_code=303)

@router.post("/authorizations/{authorization_id}/activate")
def authorization_activate(authorization_id: str, request: Request, _=Depends(require_admin), db: Session = Depends(db_session)):
    """Activate authorization."""
    auth = db.get(ProgramAuthorization, authorization_id)
    if not auth:
        raise HTTPException(404, "Authorization not found")
    
    auth.status = "active"
    db.commit()
    log_event(db, actor="admin", action="authorization.activate", ref_id=authorization_id, detail={})
    return RedirectResponse(f"/admin/authorizations/{authorization_id}?tab=overview&message=Authorization+activated&message_type=success", status_code=303)

@router.post("/authorizations/{authorization_id}/terminate")
def authorization_terminate(authorization_id: str, request: Request, _=Depends(require_admin), db: Session = Depends(db_session)):
    """Terminate authorization."""
    auth = db.get(ProgramAuthorization, authorization_id)
    if not auth:
        raise HTTPException(404, "Authorization not found")
    
    auth.status = "terminated"
    db.commit()
    log_event(db, actor="admin", action="authorization.terminate", ref_id=authorization_id, detail={})
    return RedirectResponse(f"/admin/authorizations/{authorization_id}?tab=overview&message=Authorization+terminated&message_type=success", status_code=303)

@router.post("/authorizations/{authorization_id}/issue-license")
def authorization_issue_license(authorization_id: str, request: Request, _=Depends(require_admin), db: Session = Depends(db_session)):
    """Issue a license from this authorization."""
    auth = db.get(ProgramAuthorization, authorization_id)
    if not auth:
        raise HTTPException(404, "Authorization not found")
    
    if auth.status != "active":
        return RedirectResponse(f"/admin/authorizations/{authorization_id}?tab=overview&message=Cannot+issue+license%3A+authorization+not+active&message_type=error", status_code=303)
    
    # Use the API endpoint logic to issue license
    from datetime import datetime, timedelta
    from ..licensing import build_license_payload, sign_license
    from ..crypto.signing import load_private_key
    from pathlib import Path
    
    org = db.get(Organization, auth.org_id)
    if not org:
        return RedirectResponse(f"/admin/authorizations/{authorization_id}?tab=overview&message=Organization+not+found&message_type=error", status_code=303)
    
    try:
        template = load_template(auth.program_id, auth.template_id)
        validate_template(auth.program_id, template)
        
        scope = json.loads(auth.scope_json)
        bindings_override = json.loads(auth.bindings_override_json)
        
        # Merge scope into bindings
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
        program_env = {"program_id": auth.program_id, "authorization_id": authorization_id, "status": auth.status, "policy_version": template.get("policy_version")}
        
        PRIV = load_private_key(Path(__file__).resolve().parents[2] / "keys" / "issuer_private.key")
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
        
        # Store license
        expires_at = datetime.utcnow() + timedelta(days=365)
        rec = License(
            license_id=license_id,
            org_id=org.org_id,
            program_id=auth.program_id,
            authorization_id=authorization_id,
            expires_at=expires_at,
            payload_json=json.dumps(signed, ensure_ascii=False),
            signature_b64=signed["signature"]["value"],
            key_id=settings.key_id
        )
        db.add(rec)
        db.commit()
        log_event(db, actor="admin", action="license.issue", ref_id=license_id, detail={"program_id": auth.program_id, "authorization_id": authorization_id})
        
        return RedirectResponse(f"/admin/authorizations/{authorization_id}?tab=licenses&message=License+issued+successfully%3A+{license_id}&message_type=success", status_code=303)
    except Exception as e:
        return RedirectResponse(f"/admin/authorizations/{authorization_id}?tab=overview&message=Error+issuing+license%3A+{str(e).replace(' ', '+')[:50]}&message_type=error", status_code=303)

# ---- Licenses ----
@router.get("/licenses", response_class=HTMLResponse)
def licenses_page(request: Request, _=Depends(require_admin), db: Session = Depends(db_session)):
    search = request.query_params.get("search", "").strip()
    program_filter = request.query_params.get("program", "").strip()
    status_filter = request.query_params.get("status", "").strip()
    
    query = db.query(License)
    
    if search:
        query = query.filter(
            (License.license_id.ilike(f"%{search}%")) |
            (License.org_id.ilike(f"%{search}%")) |
            (License.authorization_id.ilike(f"%{search}%"))
        )
    
    if program_filter and program_filter in ("emv", "tracking"):
        query = query.filter(License.program_id == program_filter)
    
    if status_filter == "active":
        query = query.filter(License.revoked == False, License.suspended == False)
    elif status_filter == "revoked":
        query = query.filter(License.revoked == True)
    elif status_filter == "suspended":
        query = query.filter(License.suspended == True)
    
    licenses = query.order_by(License.issued_at.desc()).limit(500).all()
    
    return templates.TemplateResponse("licenses.html", {
        "request": request,
        "licenses": licenses,
        "search": search,
        "program_filter": program_filter,
        "status_filter": status_filter,
    })

@router.get("/licenses/{license_id}", response_class=HTMLResponse)
def license_detail(license_id: str, request: Request, tab: str = "overview", _=Depends(require_admin), db: Session = Depends(db_session)):
    """License detail page with tabs."""
    lic = db.get(License, license_id)
    if not lic:
        raise HTTPException(404, "License not found")
    
    # Get related data
    auth = db.get(ProgramAuthorization, lic.authorization_id)
    org = db.get(Organization, lic.org_id)
    audit_events = db.query(AuditEvent).filter(AuditEvent.ref_id == license_id).order_by(AuditEvent.at.desc()).limit(100).all()
    
    # Parse payload
    payload = json.loads(lic.payload_json)
    
    # Extract structured information from payload
    # Note: payload structure is: license_id, issued_at, issuer, organization, program, products, roles, entitlements, bindings, term, revocation
    program_info = payload.get("program", {})
    org_info = payload.get("organization", {})
    term_info = payload.get("term", {})
    entitlements = payload.get("entitlements", {})
    products = payload.get("products", {})
    roles = payload.get("roles", {})
    limits = entitlements.get("limits", {}) if entitlements else {}
    bindings = payload.get("bindings", {})
    
    # Get template_id from authorization if available
    template_id = auth.template_id if auth else None
    
    return templates.TemplateResponse("license_detail.html", {
        "request": request,
        "lic": lic,
        "auth": auth,
        "org": org,
        "tab": tab,
        "payload": payload,
        "template_id": template_id,
        "program_info": program_info,
        "org_info": org_info,
        "term_info": term_info,
        "entitlements": entitlements,
        "products": products,
        "roles": roles,
        "limits": limits,
        "bindings": bindings,
        "audit_events": audit_events,
    })

@router.post("/licenses/{license_id}/revoke")
def license_revoke(license_id: str, request: Request, _=Depends(require_admin), db: Session = Depends(db_session)):
    """Revoke a license."""
    lic = db.get(License, license_id)
    if not lic:
        raise HTTPException(404, "License not found")
    
    lic.revoked = True
    lic.revoked_at = datetime.utcnow()
    db.commit()
    log_event(db, actor="admin", action="license.revoke", ref_id=license_id, detail={})
    return RedirectResponse(f"/admin/licenses/{license_id}?tab=overview&message=License+revoked&message_type=success", status_code=303)

@router.post("/licenses/{license_id}/suspend")
def license_suspend(license_id: str, request: Request, reason: str = Form("admin_action"), _=Depends(require_admin), db: Session = Depends(db_session)):
    """Suspend a license."""
    lic = db.get(License, license_id)
    if not lic:
        raise HTTPException(404, "License not found")
    
    lic.suspended = True
    lic.suspended_at = datetime.utcnow()
    lic.suspended_reason = reason
    db.commit()
    log_event(db, actor="admin", action="license.suspend", ref_id=license_id, detail={"reason": reason})
    return RedirectResponse(f"/admin/licenses/{license_id}?tab=overview&message=License+suspended&message_type=success", status_code=303)

@router.post("/licenses/{license_id}/unsuspend")
def license_unsuspend(license_id: str, request: Request, _=Depends(require_admin), db: Session = Depends(db_session)):
    """Unsuspend a license."""
    lic = db.get(License, license_id)
    if not lic:
        raise HTTPException(404, "License not found")
    
    lic.suspended = False
    lic.suspended_at = None
    lic.suspended_reason = None
    db.commit()
    log_event(db, actor="admin", action="license.unsuspend", ref_id=license_id, detail={})
    return RedirectResponse(f"/admin/licenses/{license_id}?tab=overview&message=License+unsuspended&message_type=success", status_code=303)

@router.get("/audit", response_class=HTMLResponse)
def audit_page(request: Request, _=Depends(require_admin), db: Session = Depends(db_session)):
    events = db.query(AuditEvent).order_by(AuditEvent.at.desc()).limit(500).all()
    return templates.TemplateResponse("audit.html", {"request": request, "events": events})

# ---- Server Management ----
@router.get("/server", response_class=HTMLResponse)
def server_page(request: Request, _=Depends(require_admin)):
    """Server management page."""
    import fastapi
    
    # Get message from query params if present
    message = request.query_params.get("message", "").replace("+", " ").replace("%3A", ":").replace("%2C", ",")
    message_type = request.query_params.get("message_type", "success")
    
    # Try to get psutil for advanced stats
    try:
        import psutil
        has_psutil = True
    except ImportError:
        has_psutil = False
    
    # Calculate uptime
    uptime_str = "Unknown"
    if has_psutil:
        try:
            process = psutil.Process(os.getpid())
            uptime_seconds = time.time() - process.create_time()
            uptime_str = _format_uptime(uptime_seconds)
        except Exception:
            pass
    
    # System info
    system_info = {
        "Platform": platform.platform(),
        "Python": sys.version.split()[0],
        "FastAPI": fastapi.__version__,
        "Process ID": os.getpid(),
        "Working Directory": str(Path.cwd()),
    }
    
    if has_psutil:
        try:
            process = psutil.Process(os.getpid())
            system_info["Memory Usage"] = f"{process.memory_info().rss / 1024 / 1024:.2f} MB"
            system_info["CPU Percent"] = f"{process.cpu_percent(interval=0.1):.1f}%"
        except Exception:
            pass
    
    system_info_str = "\n".join([f"{k}: {v}" for k, v in system_info.items()])
    
    return templates.TemplateResponse(
        "server.html",
        {
            "request": request,
            "uptime": uptime_str,
            "python_version": sys.version.split()[0],
            "fastapi_version": fastapi.__version__,
            "system_info": system_info_str,
            "message": message,
            "message_type": message_type,
        }
    )

def _format_uptime(seconds: float) -> str:
    """Format uptime in human-readable format."""
    days = int(seconds // 86400)
    hours = int((seconds % 86400) // 3600)
    minutes = int((seconds % 3600) // 60)
    if days > 0:
        return f"{days}d {hours}h {minutes}m"
    elif hours > 0:
        return f"{hours}h {minutes}m"
    else:
        return f"{minutes}m"

@router.post("/server/reload")
def server_reload(request: Request, _=Depends(require_admin), db: Session = Depends(db_session)):
    """Trigger server reload by touching a watched file."""
    # Log that we're attempting reload
    try:
        log_event(db, actor="admin", action="server.reload.start", ref_id="server", detail={"step": "function_called"})
    except:
        pass  # Don't fail if logging fails
    
    try:
        # Method 1: Use Python import to find main.py
        # Since app.main is imported in main.py itself, we need to import it
        import app.main
        main_py = Path(app.main.__file__)
        
        # Log the path for debugging
        try:
            log_event(db, actor="admin", action="server.reload.attempt", ref_id="server", detail={
                "main_py_path": str(main_py),
                "exists": main_py.exists(),
                "__file__": app.main.__file__,
                "cwd": str(Path.cwd())
            })
        except:
            pass
        
        if not main_py.exists():
            error_msg = f"main.py+not+found+at%3A+{str(main_py).replace(' ', '+').replace(':', '%3A')}"
            try:
                log_event(db, actor="admin", action="server.reload.error", ref_id="server", detail={"error": "file_not_found", "path": str(main_py)})
            except:
                pass
            return RedirectResponse(f"/admin/server?message={error_msg}&message_type=error", status_code=303)
        
        # Touch the file to trigger uvicorn reload
        main_py.touch()
        try:
            log_event(db, actor="admin", action="server.reload.success", ref_id="server", detail={"method": "file_touch", "path": str(main_py)})
        except:
            pass
        return RedirectResponse("/admin/server?message=Server+reload+triggered.+If+--reload+is+enabled%2C+the+server+will+restart.&message_type=success", status_code=303)
    except ImportError as e:
        # Try alternative method if import fails
        try:
            ui_file = Path(__file__).resolve()
            main_py = ui_file.parent.parent / "main.py"
            if main_py.exists():
                main_py.touch()
                try:
                    log_event(db, actor="admin", action="server.reload.success", ref_id="server", detail={"method": "path_resolution", "path": str(main_py)})
                except:
                    pass
                return RedirectResponse("/admin/server?message=Server+reload+triggered.+If+--reload+is+enabled%2C+the+server+will+restart.&message_type=success", status_code=303)
        except:
            pass
        
        # Log the import error
        try:
            import traceback
            log_event(db, actor="admin", action="server.reload.error", ref_id="server", detail={
                "error_type": "ImportError",
                "error_message": str(e),
                "traceback": traceback.format_exc()
            })
        except:
            pass
        error_msg = f"Import+error%3A+{str(e).replace(' ', '+').replace(':', '%3A')}"
        return RedirectResponse(f"/admin/server?message={error_msg}&message_type=error", status_code=303)
    except Exception as e:
        # Log the actual error
        try:
            import traceback
            log_event(db, actor="admin", action="server.reload.error", ref_id="server", detail={
                "error_type": type(e).__name__,
                "error_message": str(e),
                "traceback": traceback.format_exc()
            })
        except:
            pass
        error_msg = f"Reload+failed%3A+{type(e).__name__}%3A+{str(e).replace(' ', '+').replace(':', '%3A')[:100]}"
        return RedirectResponse(f"/admin/server?message={error_msg}&message_type=error", status_code=303)

@router.post("/server/restart")
def server_restart(request: Request, _=Depends(require_admin), db: Session = Depends(db_session)):
    """Restart the server by executing the restart script."""
    try:
        log_event(db, actor="admin", action="server.restart", ref_id="server", detail={"method": "script_execution"})
        script_path = Path(__file__).resolve().parents[2] / "restart_server.ps1"
        if platform.system() == "Windows" and script_path.exists():
            import subprocess
            subprocess.Popen(["powershell", "-ExecutionPolicy", "Bypass", "-File", str(script_path)], cwd=str(script_path.parent))
            message = "Server restart initiated!"
        else:
            main_py = Path(__file__).resolve().parents[2] / "main.py"
            if main_py.exists():
                main_py.touch()
            message = "Server reload triggered."
        return RedirectResponse(f"/admin/server?message={message.replace(' ', '+')}&message_type=success", status_code=303)
    except Exception as e:
        return RedirectResponse(f"/admin/server?message=Restart+failed%3A+{str(e).replace(' ', '+')}&message_type=error", status_code=303)

@router.post("/server/shutdown")
def server_shutdown(request: Request, _=Depends(require_admin), db: Session = Depends(db_session)):
    """Gracefully shutdown the server."""
    import signal
    import threading
    
    def shutdown_delayed():
        time.sleep(1)  # Give time for response to be sent
        os.kill(os.getpid(), signal.SIGTERM)
    
    # Log the shutdown
    try:
        log_event(
            db,
            actor="admin",
            action="server.shutdown",
            ref_id="server",
            detail={"method": "graceful_shutdown"}
        )
    except Exception:
        pass
    
    # Start shutdown in background thread
    threading.Thread(target=shutdown_delayed, daemon=True).start()
    
    import fastapi
    return templates.TemplateResponse(
        "server.html",
        {
            "request": request,
            "message": "Server shutdown initiated. The server will stop in a few seconds. Use a process manager to restart.",
            "message_type": "error",
            "uptime": "N/A",
            "python_version": sys.version.split()[0],
            "fastapi_version": fastapi.__version__,
            "system_info": "Server shutting down...",
        }
    )


@router.get("/downloads", response_class=HTMLResponse)
def downloads_registry_page(request: Request, _=Depends(require_admin)):
    from pathlib import Path
    import json
    reg_path = Path(__file__).resolve().parents[3] / "downloads" / "registry.json"
    registry = {"documents": []}
    if reg_path.exists():
        registry = json.loads(reg_path.read_text(encoding="utf-8"))
    return templates.TemplateResponse("downloads.html", {"request": request, "registry": registry})


@router.get("/downloads/edit/{doc_id}", response_class=HTMLResponse)
def downloads_edit_page(doc_id: str, request: Request, _=Depends(require_admin)):
    from pathlib import Path
    import json
    reg_path = Path(__file__).resolve().parents[3] / "downloads" / "registry.json"
    registry = {"documents": []}
    if reg_path.exists():
        registry = json.loads(reg_path.read_text(encoding="utf-8"))

    doc = next((d for d in registry.get("documents", []) if d.get("id") == doc_id), None)
    if not doc:
        return templates.TemplateResponse("error.html", {"request": request, "message": "Document not found in registry"})
    # ensure fields exist
    doc.setdefault("version", "1.0")
    doc.setdefault("lifecycle", "approved")
    doc.setdefault("programs", ["emv","tracking"])
    doc.setdefault("allowed_roles", [])
    doc.setdefault("required_entitlements", [])
    doc.setdefault("watermark", True)
    return templates.TemplateResponse("downloads_edit.html", {"request": request, "doc": doc})

@router.post("/downloads/edit/{doc_id}", response_class=HTMLResponse)
async def downloads_edit_save(doc_id: str, request: Request, _=Depends(require_admin)):
    from pathlib import Path
    import json
    from fastapi import Form
    form = await request.form()

    reg_path = Path(__file__).resolve().parents[3] / "downloads" / "registry.json"
    registry = {"documents": []}
    if reg_path.exists():
        registry = json.loads(reg_path.read_text(encoding="utf-8"))

    doc = next((d for d in registry.get("documents", []) if d.get("id") == doc_id), None)
    if not doc:
        return templates.TemplateResponse("error.html", {"request": request, "message": "Document not found in registry"})

    def _csv(v):
        return [x.strip() for x in (v or "").split(",") if x.strip()]

    doc["filename"] = form.get("filename")
    doc["category"] = form.get("category")
    doc["version"] = form.get("version") or doc.get("version","1.0")
    doc["lifecycle"] = form.get("lifecycle") or "approved"
    doc["programs"] = _csv(form.get("programs"))
    doc["allowed_roles"] = _csv(form.get("allowed_roles"))
    doc["required_entitlements"] = _csv(form.get("required_entitlements"))
    doc["watermark"] = True if form.get("watermark") else False

    reg_path.write_text(json.dumps(registry, indent=2), encoding="utf-8")
    return templates.TemplateResponse("downloads.html", {"request": request, "registry": registry})


@router.get("/downloads/new", response_class=HTMLResponse)
def downloads_new_page(request: Request, _=Depends(require_admin)):
    import uuid
    doc_id = f"doc_{uuid.uuid4().hex[:8]}"
    return templates.TemplateResponse("downloads_new.html", {"request": request, "doc_id": doc_id})

@router.post("/downloads/new", response_class=HTMLResponse)
async def downloads_new_save(request: Request, _=Depends(require_admin)):
    from pathlib import Path
    import json
    form = await request.form()

    def _csv(v):
        return [x.strip() for x in (v or "").split(",") if x.strip()]

    reg_path = Path(__file__).resolve().parents[3] / "downloads" / "registry.json"
    registry = {"documents": []}
    if reg_path.exists():
        registry = json.loads(reg_path.read_text(encoding="utf-8"))

    new_id = (form.get("id") or "").strip()
    if not new_id:
        return templates.TemplateResponse("error.html", {"request": request, "message": "Document ID is required"})
    if any(d.get("id") == new_id for d in registry.get("documents", [])):
        return templates.TemplateResponse("error.html", {"request": request, "message": "Document ID already exists"})

    doc = {
        "id": new_id,
        "filename": (form.get("filename") or "").strip(),
        "category": (form.get("category") or "").strip(),
        "version": (form.get("version") or "1.0").strip(),
        "lifecycle": (form.get("lifecycle") or "approved").strip(),
        "programs": _csv(form.get("programs")),
        "allowed_roles": _csv(form.get("allowed_roles")),
        "required_entitlements": _csv(form.get("required_entitlements")),
        "watermark": True if form.get("watermark") else False,
    }
    if not doc["filename"]:
        return templates.TemplateResponse("error.html", {"request": request, "message": "Filename is required"})
    registry["documents"].append(doc)
    reg_path.write_text(json.dumps(registry, indent=2), encoding="utf-8")
    return templates.TemplateResponse("downloads.html", {"request": request, "registry": registry})

@router.get("/downloads/bulk", response_class=HTMLResponse)
def downloads_bulk_page(request: Request, _=Depends(require_admin)):
    from pathlib import Path
    import json
    reg_path = Path(__file__).resolve().parents[3] / "downloads" / "registry.json"
    registry = {"documents": []}
    if reg_path.exists():
        registry = json.loads(reg_path.read_text(encoding="utf-8"))
    return templates.TemplateResponse("downloads_bulk.html", {"request": request, "registry": registry})

@router.post("/downloads/bulk", response_class=HTMLResponse)
async def downloads_bulk_apply(request: Request, _=Depends(require_admin)):
    from pathlib import Path
    import json
    form = await request.form()

    def _csv(v):
        return [x.strip() for x in (v or "").split(",") if x.strip()]

    doc_ids = set(_csv(form.get("doc_ids")))
    if not doc_ids:
        return templates.TemplateResponse("error.html", {"request": request, "message": "Provide at least one doc_id"})

    lifecycle = (form.get("lifecycle") or "").strip() or None
    programs = _csv(form.get("programs")) if (form.get("programs") or "").strip() else None
    allowed_roles = _csv(form.get("allowed_roles")) if (form.get("allowed_roles") or "").strip() else None
    required_entitlements = _csv(form.get("required_entitlements")) if (form.get("required_entitlements") or "").strip() else None
    version = (form.get("version") or "").strip() or None
    watermark_raw = (form.get("watermark") or "").strip() or None
    watermark = None
    if watermark_raw == "true":
        watermark = True
    elif watermark_raw == "false":
        watermark = False

    reg_path = Path(__file__).resolve().parents[3] / "downloads" / "registry.json"
    registry = {"documents": []}
    if reg_path.exists():
        registry = json.loads(reg_path.read_text(encoding="utf-8"))

    updated = 0
    for d in registry.get("documents", []):
        if d.get("id") in doc_ids:
            if lifecycle is not None:
                d["lifecycle"] = lifecycle
            if programs is not None:
                d["programs"] = programs
            if allowed_roles is not None:
                d["allowed_roles"] = allowed_roles
            if required_entitlements is not None:
                d["required_entitlements"] = required_entitlements
            if version is not None:
                d["version"] = version
            if watermark is not None:
                d["watermark"] = watermark
            updated += 1

    reg_path.write_text(json.dumps(registry, indent=2), encoding="utf-8")
    return templates.TemplateResponse("downloads.html", {"request": request, "registry": registry})
