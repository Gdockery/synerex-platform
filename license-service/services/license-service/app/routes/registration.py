from __future__ import annotations
import json
import re
import hashlib
from datetime import datetime, timedelta, date
from pathlib import Path
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Form
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from starlette.requests import Request
from sqlalchemy.orm import Session

from ..db import SessionLocal
from ..models.org import Organization
from ..models.user import User
from ..models.authorization import ProgramAuthorization
from ..models.license import License
from ..models.billing import BillingOrder
from ..models.payment import Payment
from ..config import settings
from ..templates_loader import load_template
from ..programs.guardrails import validate_template
from ..crypto.signing import load_private_key
from ..licensing import build_license_payload, sign_license
from ..audit.events import log_event
from ..services.pricing import calculate_price, get_pricing_info
from ..licensing.issuer import issue_license_record
from datetime import datetime, timedelta

router = APIRouter(prefix="/register", tags=["registration"])

# Calculate template directory path
# registration.py is at: app/routes/registration.py
# We need: app/admin/templates
TEMPLATES_DIR = Path(__file__).resolve().parents[1] / "admin" / "templates"
if not TEMPLATES_DIR.exists():
    # Log warning but don't fail - let it fail at runtime with better error message
    import warnings
    warnings.warn(f"Template directory not found: {TEMPLATES_DIR}. Registration page may not work.")
templates = Jinja2Templates(directory=str(TEMPLATES_DIR))

def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def _generate_org_id(org_name: str, org_type: str) -> str:
    """Generate a unique org_id from org_name."""
    # Clean org name: remove special chars, convert to uppercase, replace spaces with hyphens
    clean = re.sub(r'[^a-zA-Z0-9\s-]', '', org_name)
    clean = re.sub(r'\s+', '-', clean.strip()).upper()
    base_id = f"{org_type.upper()}-{clean[:20]}"
    
    # Check for uniqueness and append number if needed
    db = SessionLocal()
    try:
        counter = 1
        org_id = base_id
        while db.get(Organization, org_id):
            org_id = f"{base_id}-{counter:03d}"
            counter += 1
        return org_id
    finally:
        db.close()

def _create_default_authorization(
    db: Session,
    org_id: str,
    program_id: str,
    template_id: str,
    term_days: int = 365
) -> ProgramAuthorization:
    """Create a default authorization for a new organization."""
    template = load_template(program_id, template_id)
    validate_template(program_id, template)
    
    today = date.today()
    starts_at = today.isoformat()
    ends_at = (today + timedelta(days=term_days)).isoformat()
    
    auth_id = f"AUTH-{program_id.upper()}-{org_id}-{int(datetime.utcnow().timestamp())}"
    
    auth = ProgramAuthorization(
        authorization_id=auth_id,
        program_id=program_id,
        org_id=org_id,
        template_id=template_id,
        status="active",
        starts_at=starts_at,
        ends_at=ends_at,
        scope_json=json.dumps({}, ensure_ascii=False),
        constraints_json=json.dumps({}, ensure_ascii=False),
        bindings_override_json=json.dumps({}, ensure_ascii=False),
        issued_by="self_service_registration",
    )
    db.add(auth)
    db.commit()
    log_event(db, actor="self_service", action="authorization.create", ref_id=auth_id, 
              detail={"program_id": program_id, "org_id": org_id, "template_id": template_id})
    return auth

def _issue_license_from_authorization(
    db: Session,
    authorization: ProgramAuthorization,
    org: Organization
) -> tuple[License, Dict[str, Any]]:
    """Issue a license from an authorization."""
    template = load_template(authorization.program_id, authorization.template_id)
    validate_template(authorization.program_id, template)
    
    # Load private key
    key_path = Path(__file__).resolve().parents[2] / "keys" / "issuer_private.key"
    PRIV = load_private_key(key_path)
    
    # Build license payload
    license_id = f"SYX-LIC-{datetime.utcnow().year}-{int(datetime.utcnow().timestamp())}"
    
    program_env = {
        "program_id": authorization.program_id,
        "authorization_id": authorization.authorization_id,
        "status": authorization.status,
        "policy_version": template.get("policy_version", "2026.01")
    }
    
    payload = build_license_payload(
        license_id=license_id,
        issuer=settings.issuer_name,
        org={"org_id": org.org_id, "org_name": org.org_name, "org_type": org.org_type},
        term_start=authorization.starts_at,
        term_end=authorization.ends_at,
        program=program_env,
        template=template,
    )
    
    # Sign license
    signed = sign_license(PRIV, payload, settings.key_id)
    
    # Calculate expires_at from term_end
    term_end_date = datetime.fromisoformat(authorization.ends_at + "T00:00:00")
    expires_at = term_end_date
    
    # Store license
    rec = License(
        license_id=license_id,
        org_id=org.org_id,
        program_id=authorization.program_id,
        authorization_id=authorization.authorization_id,
        expires_at=expires_at,
        payload_json=json.dumps(signed, ensure_ascii=False),
        signature_b64=signed["signature"]["value"],
        key_id=settings.key_id
    )
    db.add(rec)
    db.commit()
    log_event(db, actor="self_service", action="license.issue", ref_id=license_id, 
             detail={"program_id": authorization.program_id, "authorization_id": authorization.authorization_id})
    
    return rec, signed

@router.get("/", response_class=HTMLResponse)
def registration_page(
    request: Request,
    program: Optional[str] = None,
    plan: Optional[str] = None,
    return_url: Optional[str] = None
):
    """Display the registration form."""
    return templates.TemplateResponse(
        "signup.html",
        {
            "request": request,
            "error": None,
            "success": None,
            "program": program,
            "plan": plan,
            "return_url": return_url,
            "website_url": settings.website_url
        }
    )

@router.get("/test")
def registration_test():
    """Test endpoint to verify route is working."""
    return {"status": "ok", "message": "Registration route is working", "template_dir": str(TEMPLATES_DIR)}

@router.get("/payment", response_class=HTMLResponse)
def payment_page(
    request: Request,
    order_id: str,
    return_url: Optional[str] = None,
    db: Session = Depends(db_session)
):
    """Display payment page for an order."""
    order = db.get(BillingOrder, order_id)
    if not order:
        return templates.TemplateResponse(
            "signup.html",
            {"request": request, "error": "Order not found", "success": None, "website_url": settings.website_url},
            status_code=404
        )
    
    if order.status == "paid":
        # Already paid, redirect to success
        redirect_url = f"/register/success?order_id={order_id}"
        if return_url:
            redirect_url += f"&return_url={return_url}"
        return RedirectResponse(redirect_url, status_code=303)
    
    org = db.get(Organization, order.org_id)
    if not org:
        return templates.TemplateResponse(
            "signup.html",
            {"request": request, "error": "Organization not found", "success": None, "website_url": settings.website_url},
            status_code=404
        )
    
    # Get pricing info for display
    pricing_info = get_pricing_info(order.program_id, order.plan)
    
    return templates.TemplateResponse(
        "payment.html",
        {
            "request": request,
            "order": order,
            "org": org,
            "pricing_info": pricing_info,
            "stripe_enabled": bool(settings.stripe_secret_key),
            "paypal_enabled": bool(settings.paypal_client_id),
            "return_url": return_url,
            "website_url": settings.website_url,
        }
    )

@router.post("/payment/process", response_class=HTMLResponse)
def process_payment(
    request: Request,
    order_id: str = Form(...),
    payment_method: str = Form(...),  # "stripe", "paypal", "eft", or "demo"
    return_url: Optional[str] = Form(None),
    db: Session = Depends(db_session)
):
    """Process payment and issue license."""
    try:
        print(f"[PAYMENT DEBUG] Processing payment: order_id={order_id}, method={payment_method}")
        order = db.get(BillingOrder, order_id)
        if not order:
            return templates.TemplateResponse(
                "payment.html",
                {"request": request, "error": "Order not found", "order": None, "org": None, "website_url": settings.website_url},
                status_code=404
            )
        
        if order.status == "paid":
            redirect_url = f"/register/success?order_id={order_id}"
            if return_url:
                redirect_url += f"&return_url={return_url}"
            return RedirectResponse(redirect_url, status_code=303)
        
        # For now, simulate payment success (in production, integrate with Stripe/PayPal)
        # TODO: Integrate actual payment gateway
        
        # Map plan to template_id
        template_mapping = {
            "emv": {
                "single_report": "emv_single_report",
                "annual": "emv_annual"
            },
            "tracking": {
                "basic": "tracking_basic",
                "pro": "tracking_pro",
                "enterprise": "tracking_enterprise"
            }
        }
        template_id = template_mapping.get(order.program_id, {}).get(order.plan)
        
        if not template_id:
            return templates.TemplateResponse(
                "payment.html",
                {"request": request, "error": f"Invalid plan '{order.plan}' for program '{order.program_id}'", "order": order, "org": db.get(Organization, order.org_id), "website_url": settings.website_url},
                status_code=400
            )
        
        # Handle EFT payments differently - they require manual verification
        if payment_method == "eft":
            # Check if EFT payment already exists
            existing_eft_payment = db.query(Payment).filter(Payment.order_id == order_id, Payment.gateway == "eft").first()
            if existing_eft_payment:
                # EFT payment already initiated, redirect to EFT instructions page
                return RedirectResponse(f"/register/eft-instructions?order_id={order_id}", status_code=303)
            
            # Create pending EFT payment record
            payment_id = f"PAY-EFT-{order_id}-{int(datetime.utcnow().timestamp())}"
            payment = Payment(
                id=payment_id,
                order_id=order_id,
                org_id=order.org_id,
                amount=order.amount_total,
                currency=order.currency,
                gateway="eft",
                gateway_transaction_id=None,  # Will be filled when payment is verified
                status="pending",  # EFT payments start as pending
                payment_method="eft",
                completed_at=None  # Will be set when payment is verified
            )
            db.add(payment)
            db.commit()
            
            log_event(db, actor="self_service", action="payment.eft.initiated", ref_id=payment_id,
                     detail={"order_id": order_id, "amount": order.amount_total})
            
            # Redirect to EFT instructions page
            return RedirectResponse(f"/register/eft-instructions?order_id={order_id}", status_code=303)
        
        # Handle demo payments - immediately complete and issue license
        if payment_method == "demo":
            # Check if payment already exists
            existing_payment = db.query(Payment).filter(Payment.order_id == order_id, Payment.status == "completed").first()
            if existing_payment and order.license_id:
                # Already processed, redirect to success
                redirect_url = f"/register/success?order_id={order_id}"
                if return_url:
                    redirect_url += f"&return_url={return_url}"
                return RedirectResponse(redirect_url, status_code=303)
            
            # Create completed demo payment
            payment_id = f"PAY-DEMO-{order_id}-{int(datetime.utcnow().timestamp())}"
            payment = Payment(
                id=payment_id,
                order_id=order_id,
                org_id=order.org_id,
                amount=order.amount_total,
                currency=order.currency,
                gateway="demo",
                gateway_transaction_id=f"DEMO-{payment_id}",
                status="completed",  # Demo payments are immediately completed
                payment_method="demo",
                completed_at=datetime.utcnow()
            )
            db.add(payment)
            db.commit()
            
            log_event(db, actor="self_service", action="payment.demo.completed", ref_id=payment_id,
                     detail={"order_id": order_id, "amount": order.amount_total})
            
            # For demo payments, immediately issue license (skip pending state)
            # Check if license already exists
            if order.license_id:
                existing_license = db.get(License, order.license_id)
                if existing_license:
                    redirect_url = f"/register/success?order_id={order_id}"
                    if return_url:
                        redirect_url += f"&return_url={return_url}"
                    return RedirectResponse(redirect_url, status_code=303)
            
            # Create authorization
            auth_id = f"AUTH-{order.program_id.upper()}-{order.org_id}-{order_id}"
            existing_auth = db.get(ProgramAuthorization, auth_id)
            
            if existing_auth:
                auth = existing_auth
            else:
                auth = ProgramAuthorization(
                    authorization_id=auth_id,
                    program_id=order.program_id,
                    org_id=order.org_id,
                    template_id=template_id,
                    status="active",
                    starts_at=order.term_start,
                    ends_at=order.term_end,
                    scope_json=json.dumps({}, ensure_ascii=False),
                    constraints_json=json.dumps({}, ensure_ascii=False),
                    bindings_override_json=json.dumps({}, ensure_ascii=False),
                    issued_by="self_service_demo",
                )
                db.add(auth)
            
            db.commit()
            
            # Load template and build license payload
            template = load_template(order.program_id, template_id)
            org = db.get(Organization, order.org_id)
            
            if not org:
                return templates.TemplateResponse(
                    "payment.html",
                    {"request": request, "error": "Organization not found", "order": order, "org": None, "website_url": settings.website_url},
                    status_code=404
                )
            
            license_id = f"SYX-LIC-{datetime.utcnow().year}-{int(datetime.utcnow().timestamp())}"
            
            program_env = {
                "program_id": order.program_id,
                "authorization_id": auth_id,
                "status": "active",
                "policy_version": template.get("policy_version", "2026.01")
            }
            
            # Build license payload
            license_payload = build_license_payload(
                license_id=license_id,
                issuer=settings.issuer_name,
                org={"org_id": org.org_id, "org_name": org.org_name, "org_type": org.org_type},
                term_start=order.term_start,
                term_end=order.term_end,
                program=program_env,
                template=template,
            )
            
            # Issue license
            license_rec, signed_license = issue_license_record(db, authorization=auth, license_payload=license_payload)
            
            # Update order
            order.status = "paid"
            order.paid_at = datetime.utcnow()
            order.license_id = license_rec.license_id
            db.commit()
            
            log_event(db, actor="self_service", action="payment.completed", ref_id=payment_id,
                     detail={"order_id": order_id, "license_id": license_rec.license_id, "gateway": "demo"})
            
            redirect_url = f"/register/success?order_id={order_id}"
            if return_url:
                redirect_url += f"&return_url={return_url}"
            return RedirectResponse(redirect_url, status_code=303)
        
        # For credit card/PayPal payments, create pending payment
        # Payment will be marked as "completed" only after gateway confirmation
        # In production, this would be handled by webhook callbacks from Stripe/PayPal
        existing_payment = db.query(Payment).filter(Payment.order_id == order_id).first()
        if existing_payment:
            # Payment already exists, redirect to appropriate page
            if existing_payment.status == "completed" and order.license_id:
                # Payment completed and license issued, redirect to success
                redirect_url = f"/register/success?order_id={order_id}"
                if return_url:
                    redirect_url += f"&return_url={return_url}"
                return RedirectResponse(redirect_url, status_code=303)
            elif existing_payment.status == "pending":
                # Payment pending, show pending status page
                return RedirectResponse(f"/register/payment-pending?order_id={order_id}", status_code=303)
            payment_id = existing_payment.id
        else:
            # Create pending payment record (will be marked completed after gateway confirmation)
            payment_id = f"PAY-{order_id}-{int(datetime.utcnow().timestamp())}"
            payment = Payment(
                id=payment_id,
                order_id=order_id,
                org_id=order.org_id,
                amount=order.amount_total,
                currency=order.currency,
                gateway=payment_method,
                gateway_transaction_id=None,  # Will be set when payment is confirmed
                status="pending",  # Start as pending, will be completed after gateway confirmation
                payment_method=payment_method,
                completed_at=None  # Will be set when payment clears
            )
            db.add(payment)
            db.commit()
            
            log_event(db, actor="self_service", action="payment.initiated", ref_id=payment_id,
                     detail={"order_id": order_id, "gateway": payment_method, "amount": order.amount_total})
        
        # IMPORTANT: Do NOT issue license here - licenses are only issued after payment is verified as "completed"
        # For demo mode: In production, payment gateway webhooks will mark payment as "completed"
        # For now, redirect to pending page - admin can manually verify payment later
        
        # In demo mode, simulate payment processing delay
        # In production, this would be handled by webhook callbacks
        return RedirectResponse(f"/register/payment-pending?order_id={order_id}", status_code=303)
        
    except Exception as e:
        db.rollback()
        import traceback
        error_msg = f"Payment processing failed: {str(e)}"
        print(f"ERROR in process_payment: {error_msg}")
        print(traceback.format_exc())
        return templates.TemplateResponse(
            "payment.html",
            {"request": request, "error": error_msg, "order": order if 'order' in locals() else None, "org": None, "website_url": settings.website_url},
            status_code=500
        )

@router.get("/eft-instructions", response_class=HTMLResponse)
def eft_instructions(request: Request, order_id: str, db: Session = Depends(db_session)):
    """Display EFT payment instructions page."""
    order = db.get(BillingOrder, order_id)
    if not order:
        return templates.TemplateResponse(
            "signup.html",
            {"request": request, "error": "Order not found", "success": None, "website_url": settings.website_url},
            status_code=404
        )
    
    org = db.get(Organization, order.org_id)
    if not org:
        return templates.TemplateResponse(
            "signup.html",
            {"request": request, "error": "Organization not found", "success": None, "website_url": settings.website_url},
            status_code=404
        )
    
    # EFT bank details - HARDCODED VALUES
    # Config loading was having caching issues, so values are hardcoded here
    bank_name_val = "Wells Fargo Bank"
    account_name_val = "Synerex Laboratories, LLC"
    routing_num_val = "121000248"
    account_num_val = "1714650080"
    swift_code_val = "WFBIUS6S"
    
    # Debug: Verify values before sending to template
    print(f"[EFT DEBUG] Values: bank={bank_name_val}, routing={routing_num_val}, account={account_num_val}")
    
    return templates.TemplateResponse(
        "eft_instructions.html",
        {
            "request": request,
            "order": order,
            "org": org,
            "bank_name": bank_name_val,
            "account_name": account_name_val,
            "routing_number": routing_num_val,
            "account_number": account_num_val,  # Full account number needed for EFT transfers
            "swift_code": swift_code_val,
            "website_url": settings.website_url,
        }
    )

@router.get("/success", response_class=HTMLResponse)
def payment_success(
    request: Request,
    order_id: Optional[str] = None,
    license_id: Optional[str] = None,
    return_url: Optional[str] = None,
    db: Session = Depends(db_session)
):
    """Display success page after payment."""
    # If return_url is provided, redirect to website with license info
    if return_url:
        if order_id:
            redirect_url = f"{return_url}?order_id={order_id}"
            if license_id:
                redirect_url += f"&license_id={license_id}"
            return RedirectResponse(url=redirect_url, status_code=302)
        elif license_id:
            redirect_url = f"{return_url}?license_id={license_id}"
            return RedirectResponse(url=redirect_url, status_code=302)
    
    # If no order_id provided, return error
    if not order_id:
        return templates.TemplateResponse(
            "signup.html",
            {"request": request, "error": "Order ID required", "success": None, "website_url": settings.website_url},
            status_code=400
        )
    
    order = db.get(BillingOrder, order_id)
    if not order:
        return templates.TemplateResponse(
            "signup.html",
            {"request": request, "error": "Order not found", "success": None, "website_url": settings.website_url},
            status_code=404
        )
    
    org = db.get(Organization, order.org_id)
    if not org:
        return templates.TemplateResponse(
            "signup.html",
            {"request": request, "error": "Organization not found", "success": None, "website_url": settings.website_url},
            status_code=404
        )
    
    license_rec = None
    signed_license = None
    if order.license_id:
        license_rec = db.get(License, order.license_id)
        if license_rec:
            signed_license = json.loads(license_rec.payload_json)
    
    # Send receipt email to licensee
    if license_rec and org.email:
        from ..services.email import send_license_receipt
        send_license_receipt(license_rec.license_id, db)
    
    return templates.TemplateResponse(
        "signup_success.html",
        {
            "request": request,
            "org_id": org.org_id,
            "org_name": org.org_name,
            "order_id": order_id,
            "license_id": license_rec.license_id if license_rec else None,
            "license_json": json.dumps(signed_license, indent=2) if signed_license else None,
            "program": order.program_id,
            "plan": order.plan,
            "website_url": settings.website_url,
        }
    )

@router.post("/resend-receipt", response_class=HTMLResponse)
def resend_receipt(
    request: Request,
    order_id: Optional[str] = Form(None),
    license_id: Optional[str] = Form(None),
    db: Session = Depends(db_session)
):
    """
    Resend license receipt email to licensee.
    
    Can be called with either order_id or license_id.
    Useful if the licensee didn't receive the initial email.
    """
    from ..services.email import send_license_receipt
    
    if not order_id and not license_id:
        return templates.TemplateResponse(
            "signup.html",
            {"request": request, "error": "Either order_id or license_id is required", "success": None, "website_url": settings.website_url},
            status_code=400
        )
    
    # Find license by order_id or license_id
    license_rec = None
    order = None
    if license_id:
        license_rec = db.get(License, license_id)
    elif order_id:
        order = db.get(BillingOrder, order_id)
        if order and order.license_id:
            license_rec = db.get(License, order.license_id)
    
    if not license_rec:
        return templates.TemplateResponse(
            "signup.html",
            {"request": request, "error": "License not found", "success": None, "website_url": settings.website_url},
            status_code=404
        )
    
    org = db.get(Organization, license_rec.org_id)
    if not org:
        return templates.TemplateResponse(
            "signup.html",
            {"request": request, "error": "Organization not found", "success": None, "website_url": settings.website_url},
            status_code=404
        )
    
    # Send receipt email
    success = send_license_receipt(license_rec.license_id, db)
    
    # Get order info if we have order_id
    if not order and order_id:
        order = db.get(BillingOrder, order_id)
    
    # Return success page with message
    return templates.TemplateResponse(
        "signup_success.html",
        {
            "request": request,
            "org_id": org.org_id,
            "org_name": org.org_name,
            "order_id": order_id or "",
            "license_id": license_rec.license_id,
            "license_json": None,
            "program": license_rec.program_id,
            "plan": order.plan if order else "Unknown",
            "resend_message": "Receipt email resent successfully!" if success else "Failed to resend email. Please check your email configuration or contact support.",
            "website_url": settings.website_url,
        }
    )

@router.post("/", response_class=HTMLResponse)
def register_submit(
    request: Request,
    org_name: str = Form(...),
    org_type: str = Form(...),
    username: str = Form(...),
    password: str = Form(...),
    password_confirm: str = Form(...),
    email: str = Form(...),
    # Address fields
    company_address: str = Form(...),
    company_city: str = Form(...),
    company_state: str = Form(...),
    company_zip: str = Form(...),
    company_phone: str = Form(...),
    company_cell: Optional[str] = Form(None),
    physical_address: Optional[str] = Form(None),
    physical_city: Optional[str] = Form(None),
    physical_state: Optional[str] = Form(None),
    physical_zip: Optional[str] = Form(None),
    physical_phone: Optional[str] = Form(None),
    physical_cell: Optional[str] = Form(None),
    # PE fields (if org_type == 'pe')
    pe_license_number: Optional[str] = Form(None),
    pe_license_state: Optional[str] = Form(None),
    agreement_accepted: Optional[str] = Form(None),  # Checkbox returns "on" if checked
    return_url: Optional[str] = Form(None),
    db: Session = Depends(db_session)
):
    """Handle registration submission for PE or Licensee."""
    try:
        # Validate username format
        import re
        if not re.match(r'^[a-zA-Z0-9_]{3,20}$', username):
            return templates.TemplateResponse(
                "signup.html",
                {"request": request, "error": "Username must be 3-20 characters and contain only letters, numbers, and underscores", "success": None, "website_url": settings.website_url},
                status_code=400
            )
        
        # Validate password
        if len(password) < 8:
            return templates.TemplateResponse(
                "signup.html",
                {"request": request, "error": "Password must be at least 8 characters long", "success": None, "website_url": settings.website_url},
                status_code=400
            )
        
        # Validate password confirmation
        if password != password_confirm:
            return templates.TemplateResponse(
                "signup.html",
                {"request": request, "error": "Passwords do not match", "success": None, "website_url": settings.website_url},
                status_code=400
            )
        
        # Check if username already exists
        if db.get(User, username):
            return templates.TemplateResponse(
                "signup.html",
                {"request": request, "error": "Username already exists. Please choose a different username.", "success": None, "website_url": settings.website_url},
                status_code=409
            )
        
        # Validate org_type
        if org_type not in ("pe", "customer"):
            return templates.TemplateResponse(
                "signup.html",
                {"request": request, "error": "Registration type must be 'pe' or 'customer'", "success": None, "website_url": settings.website_url},
                status_code=400
            )
        
        # Validate agreement acceptance
        if not agreement_accepted or agreement_accepted != "on":
            agreement_type = "Licensed PE Registration Agreement" if org_type == "pe" else "Software License Agreement"
            return templates.TemplateResponse(
                "signup.html",
                {"request": request, "error": f"You must accept the {agreement_type} to proceed.", "success": None, "website_url": settings.website_url},
                status_code=400
            )
        
        # Validate PE-specific fields if PE registration
        if org_type == "pe":
            if not pe_license_number or not pe_license_number.strip():
                return templates.TemplateResponse(
                    "signup.html",
                    {"request": request, "error": "PE License Number is required", "success": None, "website_url": settings.website_url},
                    status_code=400
                )
            if not pe_license_state or not pe_license_state.strip():
                return templates.TemplateResponse(
                    "signup.html",
                    {"request": request, "error": "PE License State is required", "success": None, "website_url": settings.website_url},
                    status_code=400
                )
        
        # Generate org_id
        org_id = _generate_org_id(org_name, org_type)
        
        # Check if org_id already exists
        if db.get(Organization, org_id):
            return templates.TemplateResponse(
                "signup.html",
                {"request": request, "error": "Organization ID already exists. Please try again.", "success": None, "website_url": settings.website_url},
                status_code=409
            )
        
        # Create organization
        org_data = {
            "org_id": org_id,
            "org_name": org_name,
            "org_type": org_type,
            "email": email.strip(),
            # Company/Billing Address
            "company_address": company_address.strip() if company_address else None,
            "company_city": company_city.strip() if company_city else None,
            "company_state": company_state.strip().upper() if company_state else None,
            "company_zip": company_zip.strip() if company_zip else None,
            "company_phone": company_phone.strip() if company_phone else None,
            "company_cell": company_cell.strip() if company_cell else None,
            # Physical Address
            "physical_address": physical_address.strip() if physical_address else None,
            "physical_city": physical_city.strip() if physical_city else None,
            "physical_state": physical_state.strip().upper() if physical_state else None,
            "physical_zip": physical_zip.strip() if physical_zip else None,
            "physical_phone": physical_phone.strip() if physical_phone else None,
            "physical_cell": physical_cell.strip() if physical_cell else None,
        }
        
        if org_type == "pe":
            org_data["pe_license_number"] = pe_license_number.strip() if pe_license_number else None
            org_data["pe_license_state"] = pe_license_state.strip().upper() if pe_license_state else None
            org_data["pe_approval_status"] = "pending"
        
        org = Organization(**org_data)
        db.add(org)
        db.commit()
        log_event(db, actor="self_service", action="org.create", ref_id=org_id, 
                 detail={"org_type": org_type, "email": email, "pe_license_number": pe_license_number if org_type == "pe" else None})
        
        # Create user account
        import bcrypt
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        user = User(
            username=username,
            password_hash=password_hash,
            org_id=org_id,
            email=email,
            is_active=True
        )
        db.add(user)
        db.commit()
        log_event(db, actor="self_service", action="user.create", ref_id=username, 
                 detail={"org_id": org_id, "email": email})
        
        # For PE registration, skip billing/license creation - just show success message
        if org_type == "pe":
            return templates.TemplateResponse(
                "signup.html",
                {
                    "request": request,
                    "error": None,
                    "success": f"Licensed PE registration submitted successfully! Your registration is pending admin approval. You will be notified via email at {email} once your registration is reviewed.",
                    "website_url": settings.website_url
                }
            )
        
        # For Licensee, registration is complete - redirect to login or My Account
        # No billing/license creation at registration time
        # Users will select licenses from My Account page
        if return_url:
            return RedirectResponse(f"{return_url}?registered=true", status_code=303)
        # Redirect to login with success message
        return RedirectResponse("/auth/login?registered=true&message=Registration+successful!+Please+log+in+to+access+your+account.", status_code=303)
        
    except Exception as e:
        db.rollback()
        return templates.TemplateResponse(
            "signup.html",
            {"request": request, "error": f"Registration failed: {str(e)}", "success": None, "website_url": settings.website_url},
            status_code=500
        )

@router.post("/api", response_class=JSONResponse)
def register_api(
    org_name: str = Form(...),
    org_type: str = Form(...),
    email: str = Form(...),
    program: str = Form(None),  # Optional for PE
    plan: str = Form(None),  # Optional for PE
    pe_license_number: str = Form(None),
    pe_license_state: str = Form(None),
    db: Session = Depends(db_session)
):
    """API endpoint for PE or Licensee registration."""
    try:
        # Validate org_type
        if org_type not in ("pe", "customer"):
            raise HTTPException(400, "org_type must be 'pe' or 'customer'")
        
        # Validate PE-specific fields if PE registration
        if org_type == "pe":
            if not pe_license_number or not pe_license_number.strip():
                raise HTTPException(400, "pe_license_number is required for PE registration")
            if not pe_license_state or not pe_license_state.strip():
                raise HTTPException(400, "pe_license_state is required for PE registration")
            program = None
            plan = None
        else:
            # Validate Licensee-specific fields
            if not program or program not in ("emv", "tracking"):
                raise HTTPException(400, "program must be 'emv' or 'tracking'")
            
            # Map plan to template_id
            template_mapping = {
                "emv": {
                    "single_report": "emv_single_report",
                    "annual": "emv_annual"
                },
                "tracking": {
                    "basic": "tracking_basic",
                    "pro": "tracking_pro",
                    "enterprise": "tracking_enterprise"
                }
            }
            
            template_id = template_mapping.get(program, {}).get(plan)
            if not template_id:
                raise HTTPException(400, f"Invalid plan '{plan}' for program '{program}'")
        
        # Generate org_id
        org_id = _generate_org_id(org_name, org_type)
        
        # Check if org_id already exists
        if db.get(Organization, org_id):
            raise HTTPException(409, "Organization ID already exists")
        
        # Create organization
        org_data = {
            "org_id": org_id,
            "org_name": org_name,
            "org_type": org_type,
            "email": email.strip()
        }
        
        if org_type == "pe":
            org_data["pe_license_number"] = pe_license_number.strip() if pe_license_number else None
            org_data["pe_license_state"] = pe_license_state.strip().upper() if pe_license_state else None
            org_data["pe_approval_status"] = "pending"
        
        org = Organization(**org_data)
        db.add(org)
        db.commit()
        log_event(db, actor="self_service", action="org.create", ref_id=org_id, 
                 detail={"org_type": org_type, "email": email, "pe_license_number": pe_license_number if org_type == "pe" else None})
        
        # For PE registration, skip billing/license creation
        if org_type == "pe":
            return {
                "status": "success",
                "message": "Licensed PE registration submitted successfully. Registration is pending admin approval.",
                "org_id": org_id,
                "pe_approval_status": "pending"
            }
        
        # For Licensee, return order info (billing order creation would happen separately)
        return {
            "status": "success",
            "message": "Licensee registration submitted successfully. Please proceed with billing order creation.",
            "org_id": org_id,
            "program": program,
            "plan": plan
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(500, f"Registration failed: {str(e)}")

