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

    # Check if OEM branding is configured in the Tracking program.
    # Clients must see the OEM's logo — not Synerex defaults — so we warn if unset.
    oem_branding_configured = False
    try:
        import urllib.request as _ur
        import json as _json
        _tracking_url = (settings.tracking_program_url or "http://tracking-program:8087").rstrip("/")
        _branding_url = f"{_tracking_url}/api/whitelabel/oem-branding-by-org?org_id={org_id}"
        with _ur.urlopen(_branding_url, timeout=3) as _resp:
            _bdata = _json.loads(_resp.read().decode())
            oem_branding_configured = bool(_bdata.get("brand_name"))
    except Exception:
        pass

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
            "oem_branding_configured": oem_branding_configured,
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
            is_active=False,  # inactive until OEM approves after payment
        )
        db.add(new_admin)
        # Mark the customer org as pending OEM approval
        customer.approval_status = "pending"
        db.commit()
        return RedirectResponse(
            f"{create_url}?message=Client+Admin+{email}+created.+Approve+after+payment+is+received.&message_type=info",
            status_code=303
        )


# ── OEM Users (oem_user sub-accounts) ────────────────────────────────────────

def _require_oem_admin(request: Request, db: Session):
    """Return (oem_org, username) or raise a 303 redirect if not an approved OEM admin."""
    if not _is_user_logged_in(request):
        raise HTTPException(303, headers={"Location": f"{path_prefix}/auth/login"})
    org_id = request.session.get("org_id")
    username = request.session.get("username")
    user = db.get(User, username) if username else None
    org = db.get(Organization, org_id) if org_id else None
    if not user or user.role != "oem_admin" or not org or org.org_type != "oem":
        raise HTTPException(403, "OEM Admin access required")
    return org, user


@router.get("/users", response_class=HTMLResponse)
def oem_users_page(request: Request, db: Session = Depends(db_session)):
    """OEM Admin: manage OEM User sub-accounts within this OEM organization."""
    if not _is_user_logged_in(request):
        return RedirectResponse(f"{path_prefix}/auth/login?return_url={path_prefix}/oem-admin/users", status_code=303)

    org_id = request.session.get("org_id")
    username = request.session.get("username")
    user = db.get(User, username) if username else None
    oem_org = db.get(Organization, org_id) if org_id else None
    if not user or user.role != "oem_admin" or not oem_org or oem_org.org_type != "oem":
        return RedirectResponse(f"{path_prefix}/oem-admin", status_code=303)

    oem_users = (
        db.query(User)
        .filter(User.org_id == org_id, User.role == "oem_user")
        .order_by(User.email)
        .all()
    )

    message = request.query_params.get("message", "").replace("+", " ")
    message_type = request.query_params.get("message_type", "success")

    return templates.TemplateResponse("oem_users.html", {
        "request": request,
        "oem_org": oem_org,
        "oem_users": oem_users,
        "path_prefix": path_prefix,
        "message": message,
        "message_type": message_type,
    })


@router.post("/users/create", response_class=RedirectResponse)
def oem_user_create(
    request: Request,
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(db_session),
):
    """Create an OEM User sub-account within this OEM organization."""
    users_url = f"{path_prefix}/oem-admin/users" if path_prefix else "/oem-admin/users"

    if not _is_user_logged_in(request):
        return RedirectResponse(f"{path_prefix}/auth/login", status_code=303)

    org_id = request.session.get("org_id")
    username = request.session.get("username")
    user = db.get(User, username) if username else None
    oem_org = db.get(Organization, org_id) if org_id else None
    if not user or user.role != "oem_admin" or not oem_org or oem_org.org_type != "oem":
        return RedirectResponse(f"{path_prefix}/oem-admin", status_code=303)

    if len(password) < 6:
        return RedirectResponse(f"{users_url}?message=Password+must+be+at+least+6+characters&message_type=error", status_code=303)

    taken = db.query(User).filter((User.username == email) | (User.email == email)).first()
    if taken:
        return RedirectResponse(f"{users_url}?message=Email+already+in+use+by+another+account&message_type=error", status_code=303)

    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    new_user = User(
        username=email,
        email=email,
        password_hash=hashed,
        org_id=org_id,
        role="oem_user",
        is_active=True,
    )
    db.add(new_user)
    db.commit()

    return RedirectResponse(f"{users_url}?message=OEM+User+{email}+created&message_type=success", status_code=303)


@router.post("/users/delete", response_class=RedirectResponse)
def oem_user_delete(
    request: Request,
    target_username: str = Form(...),
    db: Session = Depends(db_session),
):
    """Deactivate an OEM User sub-account."""
    users_url = f"{path_prefix}/oem-admin/users" if path_prefix else "/oem-admin/users"

    if not _is_user_logged_in(request):
        return RedirectResponse(f"{path_prefix}/auth/login", status_code=303)

    org_id = request.session.get("org_id")
    username = request.session.get("username")
    user = db.get(User, username) if username else None
    oem_org = db.get(Organization, org_id) if org_id else None
    if not user or user.role != "oem_admin" or not oem_org or oem_org.org_type != "oem":
        return RedirectResponse(f"{path_prefix}/oem-admin", status_code=303)

    target = db.query(User).filter(
        User.username == target_username,
        User.org_id == org_id,
        User.role == "oem_user",
    ).first()
    if not target:
        return RedirectResponse(f"{users_url}?message=User+not+found&message_type=error", status_code=303)

    target.is_active = False
    db.commit()
    return RedirectResponse(f"{users_url}?message=OEM+User+{target_username}+removed&message_type=success", status_code=303)


# ── Client Approval Queue (OEM Admin) ─────────────────────────────────────────

@router.get("/client-approvals", response_class=HTMLResponse)
def oem_client_approvals_page(request: Request, db: Session = Depends(db_session)):
    """OEM Admin: list sponsored customer orgs awaiting approval after payment."""
    if not _is_user_logged_in(request):
        return RedirectResponse(f"{path_prefix}/auth/login?return_url={path_prefix}/oem-admin/client-approvals", status_code=303)

    org_id = request.session.get("org_id")
    username = request.session.get("username")
    user = db.get(User, username) if username else None
    oem_org = db.get(Organization, org_id) if org_id else None
    if not user or user.role != "oem_admin" or not oem_org or oem_org.org_type != "oem":
        return RedirectResponse(f"{path_prefix}/oem-admin", status_code=303)

    from sqlalchemy import or_
    status_filter = request.query_params.get("status", "").strip()

    query = db.query(Organization).filter(
        Organization.org_type == "customer",
        Organization.sponsor_org_id == org_id,
    )
    if status_filter in ("pending", "approved", "rejected"):
        query = query.filter(Organization.approval_status == status_filter)
    else:
        from sqlalchemy import case as _case, func as _func
        query = query.order_by(
            _case(
                (_func.coalesce(Organization.approval_status, "pending") == "pending", 1),
                (_func.coalesce(Organization.approval_status, "pending") == "approved", 2),
                (_func.coalesce(Organization.approval_status, "pending") == "rejected", 3),
                else_=4,
            )
        )

    customers = query.all()

    # Attach admin user and latest paid order to each customer
    from ..models.billing import BillingOrder
    clients_data = []
    for c in customers:
        admin_user = db.query(User).filter(User.org_id == c.org_id, User.role == "customer_admin").first()
        latest_order = (
            db.query(BillingOrder)
            .filter(BillingOrder.org_id == c.org_id, BillingOrder.status == "paid")
            .order_by(BillingOrder.paid_at.desc())
            .first()
        )
        clients_data.append({"org": c, "admin": admin_user, "paid_order": latest_order})

    pending_count = db.query(Organization).filter(
        Organization.org_type == "customer",
        Organization.sponsor_org_id == org_id,
        or_(Organization.approval_status == "pending", Organization.approval_status.is_(None)),
    ).count()

    message = request.query_params.get("message", "").replace("+", " ")
    message_type = request.query_params.get("message_type", "success")

    return templates.TemplateResponse("oem_client_approvals.html", {
        "request": request,
        "oem_org": oem_org,
        "clients_data": clients_data,
        "status_filter": status_filter,
        "pending_count": pending_count,
        "path_prefix": path_prefix,
        "message": message,
        "message_type": message_type,
    })


@router.post("/client-approvals/{org_id}/approve", response_class=RedirectResponse)
def oem_client_approve(
    org_id: str,
    request: Request,
    db: Session = Depends(db_session),
):
    """OEM Admin: approve a client org after payment — activates their Client Admin."""
    approvals_url = f"{path_prefix}/oem-admin/client-approvals" if path_prefix else "/oem-admin/client-approvals"

    if not _is_user_logged_in(request):
        return RedirectResponse(f"{path_prefix}/auth/login", status_code=303)

    oem_org_id = request.session.get("org_id")
    username = request.session.get("username")
    user = db.get(User, username) if username else None
    oem_org = db.get(Organization, oem_org_id) if oem_org_id else None
    if not user or user.role != "oem_admin" or not oem_org or oem_org.org_type != "oem":
        return RedirectResponse(f"{path_prefix}/oem-admin", status_code=303)

    customer = _get_customer_for_oem(db, oem_org_id, org_id)
    if not customer:
        return RedirectResponse(f"{approvals_url}?message=Client+not+found&message_type=error", status_code=303)

    customer.approval_status = "approved"
    # Activate all customer_admin users for this org
    admin_users = db.query(User).filter(User.org_id == org_id, User.role == "customer_admin").all()
    for u in admin_users:
        u.is_active = True
    db.commit()

    # Send invitation email (best-effort)
    for u in admin_users:
        try:
            from ..services.email import send_client_admin_invitation_email as _send
            from ..config import settings as _settings
            base = (_settings.website_url or "http://localhost:8080").rstrip("/")
            pfx = (_settings.root_path or "").rstrip("/")
            _client_portal_url = f"{base}{pfx}/auth/client-portal"
            _oem_login_url = f"{base}{pfx}/auth/login?client={org_id}"
            _send(
                to_email=u.email,
                client_org_name=customer.org_name,
                client_org_id=org_id,
                oem_org_name=oem_org.org_name,
                temp_password="(use your configured password)",
                oem_login_url=_oem_login_url,
                client_portal_url=_client_portal_url,
                is_reset=False,
            )
        except Exception as _e:
            print(f"[EMAIL] Client approval email failed for {u.email}: {_e}")

    return RedirectResponse(
        f"{approvals_url}?message=Client+{customer.org_name}+approved+and+activated&message_type=success",
        status_code=303
    )


@router.post("/client-approvals/{org_id}/reject", response_class=RedirectResponse)
def oem_client_reject(
    org_id: str,
    request: Request,
    reason: str = Form(None),
    db: Session = Depends(db_session),
):
    """OEM Admin: reject a client org (keeps admin account inactive)."""
    approvals_url = f"{path_prefix}/oem-admin/client-approvals" if path_prefix else "/oem-admin/client-approvals"

    if not _is_user_logged_in(request):
        return RedirectResponse(f"{path_prefix}/auth/login", status_code=303)

    oem_org_id = request.session.get("org_id")
    username = request.session.get("username")
    user = db.get(User, username) if username else None
    oem_org = db.get(Organization, oem_org_id) if oem_org_id else None
    if not user or user.role != "oem_admin" or not oem_org or oem_org.org_type != "oem":
        return RedirectResponse(f"{path_prefix}/oem-admin", status_code=303)

    customer = _get_customer_for_oem(db, oem_org_id, org_id)
    if not customer:
        return RedirectResponse(f"{approvals_url}?message=Client+not+found&message_type=error", status_code=303)

    customer.approval_status = "rejected"
    customer.approval_note = reason or ""
    for u in db.query(User).filter(User.org_id == org_id, User.role == "customer_admin").all():
        u.is_active = False
    db.commit()

    return RedirectResponse(
        f"{approvals_url}?message=Client+{customer.org_name}+rejected&message_type=success",
        status_code=303
    )
