"""OEM Admin Panel - OEM users can view their sponsored customers."""
from pathlib import Path

import bcrypt
from fastapi import APIRouter, Depends, Form, HTTPException, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from ..config import settings
from ..db import SessionLocal
from ..models.org import Organization
from ..models.user import User

router = APIRouter(prefix="/oem-admin", tags=["oem_admin"])
TEMPLATES_DIR = Path(__file__).resolve().parents[1] / "admin" / "templates"
templates = Jinja2Templates(directory=str(TEMPLATES_DIR))
path_prefix = (settings.root_path or "").rstrip("/")
templates.env.globals["path_prefix"] = path_prefix


def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _is_user_logged_in(request: Request) -> bool:
    try:
        return bool(request.session.get("user_logged_in", False))
    except (AttributeError, KeyError, RuntimeError):
        return False


@router.get("", response_class=HTMLResponse)
@router.get("/", response_class=HTMLResponse)
def oem_admin_page(request: Request, db: Session = Depends(db_session)):
    """OEM Admin Panel - list customers sponsored by this OEM."""
    if not _is_user_logged_in(request):
        login_url = f"{path_prefix}/auth/login" if path_prefix else "/auth/login"
        return_url = f"{path_prefix}/oem-admin" if path_prefix else "/oem-admin"
        return RedirectResponse(f"{login_url}?return_url={return_url}", status_code=303)

    org_id = request.session.get("org_id")
    if not org_id:
        login_url = f"{path_prefix}/auth/login" if path_prefix else "/auth/login"
        return RedirectResponse(login_url, status_code=303)

    org = db.get(Organization, org_id)
    if not org or org.org_type != "oem":
        # Not an OEM - redirect to my-account
        return RedirectResponse(f"{path_prefix}/auth/login", status_code=303)

    # Get customers sponsored by this OEM
    customers = (
        db.query(Organization)
        .filter(Organization.sponsor_org_id == org_id, Organization.org_type == "customer")
        .order_by(Organization.org_name)
        .all()
    )

    # Build the branded login link for Client Admins of this OEM's customers
    base_url = (settings.website_url or "http://localhost:8080").rstrip("/")
    oem_login_url = f"{base_url}{path_prefix}/auth/login?oem={org_id}"

    message = request.query_params.get("message", "").replace("+", " ")
    message_type = request.query_params.get("message_type", "success")

    return templates.TemplateResponse(
        "oem_admin.html",
        {
            "request": request,
            "oem_org": org,
            "customers": customers,
            "oem_login_url": oem_login_url,
            "path_prefix": path_prefix,
            "message": message,
            "message_type": message_type,
        },
    )


def _get_customer_for_oem(db: Session, oem_org_id: str, customer_org_id: str) -> Organization | None:
    """Return customer org if it is sponsored by the given OEM."""
    customer = db.get(Organization, customer_org_id)
    if not customer or customer.org_type != "customer" or customer.sponsor_org_id != oem_org_id:
        return None
    return customer


@router.get("/customers/{org_id}/edit", response_class=HTMLResponse)
def oem_customer_edit_page(org_id: str, request: Request, db: Session = Depends(db_session)):
    """Edit customer organization (OEM can only edit their sponsored customers)."""
    if not _is_user_logged_in(request):
        login_url = f"{path_prefix}/auth/login" if path_prefix else "/auth/login"
        return_url = f"{path_prefix}/oem-admin/customers/{org_id}/edit" if path_prefix else f"/oem-admin/customers/{org_id}/edit"
        return RedirectResponse(f"{login_url}?return_url={return_url}", status_code=303)

    oem_org_id = request.session.get("org_id")
    if not oem_org_id:
        return RedirectResponse(f"{path_prefix}/auth/login" if path_prefix else "/auth/login", status_code=303)

    oem_org = db.get(Organization, oem_org_id)
    if not oem_org or oem_org.org_type != "oem":
        return RedirectResponse(f"{path_prefix}/oem-admin" if path_prefix else "/oem-admin", status_code=303)

    customer = _get_customer_for_oem(db, oem_org_id, org_id)
    if not customer:
        raise HTTPException(404, "Customer not found or you do not have permission to edit this customer")

    message = request.query_params.get("message", "").replace("+", " ")
    message_type = request.query_params.get("message_type", "success")

    return templates.TemplateResponse(
        "oem_customer_edit.html",
        {
            "request": request,
            "oem_org": oem_org,
            "customer": customer,
            "path_prefix": path_prefix,
            "message": message,
            "message_type": message_type,
        },
    )


@router.get("/profile", response_class=HTMLResponse)
def oem_profile_page(request: Request, db: Session = Depends(db_session)):
    """OEM self-service profile page — view and edit their own company details."""
    if not _is_user_logged_in(request):
        login_url = f"{path_prefix}/auth/login" if path_prefix else "/auth/login"
        return_url = f"{path_prefix}/oem-admin/profile" if path_prefix else "/oem-admin/profile"
        return RedirectResponse(f"{login_url}?return_url={return_url}", status_code=303)

    org_id = request.session.get("org_id")
    if not org_id:
        return RedirectResponse(f"{path_prefix}/auth/login" if path_prefix else "/auth/login", status_code=303)

    org = db.get(Organization, org_id)
    if not org or org.org_type != "oem":
        return RedirectResponse(f"{path_prefix}/auth/login" if path_prefix else "/auth/login", status_code=303)

    message = request.query_params.get("message", "").replace("+", " ")
    message_type = request.query_params.get("message_type", "success")

    return templates.TemplateResponse(
        "oem_profile.html",
        {
            "request": request,
            "oem_org": org,
            "path_prefix": path_prefix,
            "message": message,
            "message_type": message_type,
        },
    )


@router.post("/profile", response_class=RedirectResponse)
def oem_profile_update(
    request: Request,
    org_name: str = Form(None),
    email: str = Form(None),
    contact_name: str = Form(None),
    phone: str = Form(None),
    billing_email: str = Form(None),
    company_address: str = Form(None),
    company_city: str = Form(None),
    company_state: str = Form(None),
    company_zip: str = Form(None),
    company_phone: str = Form(None),
    company_cell: str = Form(None),
    physical_address: str = Form(None),
    physical_city: str = Form(None),
    physical_state: str = Form(None),
    physical_zip: str = Form(None),
    physical_phone: str = Form(None),
    physical_cell: str = Form(None),
    db: Session = Depends(db_session),
):
    """Save OEM's own company profile updates."""
    if not _is_user_logged_in(request):
        return RedirectResponse(f"{path_prefix}/auth/login" if path_prefix else "/auth/login", status_code=303)

    org_id = request.session.get("org_id")
    if not org_id:
        return RedirectResponse(f"{path_prefix}/auth/login" if path_prefix else "/auth/login", status_code=303)

    org = db.get(Organization, org_id)
    if not org or org.org_type != "oem":
        return RedirectResponse(f"{path_prefix}/auth/login" if path_prefix else "/auth/login", status_code=303)

    if org_name:
        org.org_name = org_name
    if email is not None:
        org.email = email or None
    if contact_name is not None:
        org.contact_name = contact_name or None
    if phone is not None:
        org.phone = phone or None
    if billing_email is not None:
        org.billing_email = billing_email or None
    if company_address is not None:
        org.company_address = company_address or None
    if company_city is not None:
        org.company_city = company_city or None
    if company_state is not None:
        org.company_state = company_state or None
    if company_zip is not None:
        org.company_zip = company_zip or None
    if company_phone is not None:
        org.company_phone = company_phone or None
    if company_cell is not None:
        org.company_cell = company_cell or None
    if physical_address is not None:
        org.physical_address = physical_address or None
    if physical_city is not None:
        org.physical_city = physical_city or None
    if physical_state is not None:
        org.physical_state = physical_state or None
    if physical_zip is not None:
        org.physical_zip = physical_zip or None
    if physical_phone is not None:
        org.physical_phone = physical_phone or None
    if physical_cell is not None:
        org.physical_cell = physical_cell or None

    db.commit()

    profile_url = f"{path_prefix}/oem-admin/profile" if path_prefix else "/oem-admin/profile"
    return RedirectResponse(f"{profile_url}?message=Profile+updated+successfully&message_type=success", status_code=303)


@router.post("/customers/{org_id}/edit", response_class=RedirectResponse)
def oem_customer_update(
    org_id: str,
    request: Request,
    org_name: str = Form(None),
    email: str = Form(None),
    contact_name: str = Form(None),
    phone: str = Form(None),
    address: str = Form(None),
    billing_email: str = Form(None),
    db: Session = Depends(db_session),
):
    """Update customer organization (OEM can only update their sponsored customers)."""
    if not _is_user_logged_in(request):
        login_url = f"{path_prefix}/auth/login" if path_prefix else "/auth/login"
        return RedirectResponse(login_url, status_code=303)

    oem_org_id = request.session.get("org_id")
    if not oem_org_id:
        return RedirectResponse(f"{path_prefix}/auth/login" if path_prefix else "/auth/login", status_code=303)

    oem_org = db.get(Organization, oem_org_id)
    if not oem_org or oem_org.org_type != "oem":
        return RedirectResponse(f"{path_prefix}/oem-admin" if path_prefix else "/oem-admin", status_code=303)

    customer = _get_customer_for_oem(db, oem_org_id, org_id)
    if not customer:
        raise HTTPException(404, "Customer not found or you do not have permission to edit this customer")

    # Update fields if provided
    if org_name is not None:
        customer.org_name = org_name if org_name else customer.org_name
    if email is not None:
        customer.email = email if email else None
    if contact_name is not None:
        customer.contact_name = contact_name if contact_name else None
    if phone is not None:
        customer.phone = phone if phone else None
    if address is not None:
        customer.address = address if address else None
    if billing_email is not None:
        customer.billing_email = billing_email if billing_email else None

    db.commit()

    edit_url = f"{path_prefix}/oem-admin/customers/{org_id}/edit" if path_prefix else f"/oem-admin/customers/{org_id}/edit"
    return RedirectResponse(f"{edit_url}?message=Customer+updated+successfully&message_type=success", status_code=303)


@router.get("/customers/{org_id}/create-admin", response_class=HTMLResponse)
def oem_create_admin_page(org_id: str, request: Request, db: Session = Depends(db_session)):
    """Show form to create/reset the Client Admin for a customer org."""
    if not _is_user_logged_in(request):
        login_url = f"{path_prefix}/auth/login" if path_prefix else "/auth/login"
        return RedirectResponse(login_url, status_code=303)

    oem_org_id = request.session.get("org_id")
    if not oem_org_id:
        return RedirectResponse(f"{path_prefix}/auth/login" if path_prefix else "/auth/login", status_code=303)

    oem_org = db.get(Organization, oem_org_id)
    if not oem_org or oem_org.org_type != "oem":
        return RedirectResponse(f"{path_prefix}/oem-admin" if path_prefix else "/oem-admin", status_code=303)

    customer = _get_customer_for_oem(db, oem_org_id, org_id)
    if not customer:
        raise HTTPException(404, "Customer not found")

    existing_admin = db.query(User).filter(
        User.org_id == org_id,
        User.role == "customer_admin",
    ).first()

    message = request.query_params.get("message", "").replace("+", " ")
    message_type = request.query_params.get("message_type", "success")

    base_url = (settings.website_url or "http://localhost:8080").rstrip("/")
    oem_login_url = f"{base_url}{path_prefix}/auth/login?oem={oem_org_id}"

    return templates.TemplateResponse("oem_create_admin.html", {
        "request": request,
        "oem_org": oem_org,
        "customer": customer,
        "existing_admin": existing_admin,
        "oem_login_url": oem_login_url,
        "path_prefix": path_prefix,
        "message": message,
        "message_type": message_type,
    })


@router.post("/customers/{org_id}/create-admin", response_class=RedirectResponse)
def oem_create_admin_submit(
    org_id: str,
    request: Request,
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(db_session),
):
    """Create or reset Client Admin for a customer org."""
    create_url = f"{path_prefix}/oem-admin/customers/{org_id}/create-admin" if path_prefix else f"/oem-admin/customers/{org_id}/create-admin"

    if not _is_user_logged_in(request):
        return RedirectResponse(f"{path_prefix}/auth/login" if path_prefix else "/auth/login", status_code=303)

    oem_org_id = request.session.get("org_id")
    oem_org = db.get(Organization, oem_org_id) if oem_org_id else None
    if not oem_org or oem_org.org_type != "oem":
        return RedirectResponse(f"{path_prefix}/oem-admin" if path_prefix else "/oem-admin", status_code=303)

    customer = _get_customer_for_oem(db, oem_org_id, org_id)
    if not customer:
        raise HTTPException(404, "Customer not found")

    if len(password) < 6:
        return RedirectResponse(
            f"{create_url}?message=Password+must+be+at+least+6+characters&message_type=error",
            status_code=303
        )

    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    # Check if admin already exists for this org
    existing = db.query(User).filter(
        User.org_id == org_id,
        User.role == "customer_admin",
    ).first()

    if existing:
        # Reset credentials
        existing.username = email
        existing.email = email
        existing.password_hash = hashed
        existing.is_active = True
        db.commit()
        return RedirectResponse(
            f"{create_url}?message=Client+Admin+credentials+updated&message_type=success",
            status_code=303
        )
    else:
        # Check if username already taken by another org
        taken = db.query(User).filter(
            (User.username == email) | (User.email == email)
        ).first()
        if taken:
            return RedirectResponse(
                f"{create_url}?message=Email+already+in+use+by+another+account&message_type=error",
                status_code=303
            )
        new_admin = User(
            username=email,
            email=email,
            password_hash=hashed,
            org_id=org_id,
            role="customer_admin",
            is_active=True,
        )
        db.add(new_admin)
        db.commit()
        return RedirectResponse(
            f"{create_url}?message=Client+Admin+{email}+created+successfully&message_type=success",
            status_code=303
        )
