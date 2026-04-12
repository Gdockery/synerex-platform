"""OEM Admin Panel - OEM users can view their sponsored customers."""
from pathlib import Path
from datetime import datetime

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


def _fetch_oem_branding(org_id: str) -> dict:
    """Fetch OEM branding from the Tracking program. Returns a dict with
    brand_name, brand_logo_url, primary_color, and oem_branding_configured."""
    result = {
        "brand_name": None,
        "brand_logo_url": None,
        "primary_color": "#667eea",
        "oem_branding_configured": False,
    }
    if not org_id:
        return result
    try:
        import urllib.request as _ur
        import json as _json
        # Always use the Docker-internal service name for server-to-server calls.
        # settings.tracking_program_url is the Tailscale/public URL which is not
        # reachable from inside Docker containers.
        _tracking_url = "http://tracking-program:8087"
        with _ur.urlopen(f"{_tracking_url}/api/whitelabel/oem-branding-by-org?org_id={org_id}", timeout=3) as _resp:
            _d = _json.loads(_resp.read().decode())
            if isinstance(_d, dict) and _d.get("brand_name"):
                result["brand_name"] = _d.get("brand_name")
                result["primary_color"] = _d.get("primary_color") or result["primary_color"]
                result["oem_branding_configured"] = True
                # logo_url is a relative path served by the Tracking program.
                # Convert it to an absolute public URL so the browser can load it
                # from the License Service pages (which are on a different path).
                logo_url = _d.get("logo_url") or None
                if logo_url and logo_url.startswith("/"):
                    _public_base = (settings.website_url or "").rstrip("/")
                    logo_url = f"{_public_base}/tracking{logo_url}"
                result["brand_logo_url"] = logo_url
    except Exception:
        pass
    return result


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
    oem_branding = _fetch_oem_branding(org_id)
    oem_branding_configured = oem_branding["oem_branding_configured"]

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
            "brand_logo_url": oem_branding["brand_logo_url"],
            "brand_name": oem_branding["brand_name"] or org.org_name,
            "primary_color": oem_branding["primary_color"],
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

    oem_branding = _fetch_oem_branding(org_id)

    return templates.TemplateResponse(
        "oem_profile.html",
        {
            "request": request,
            "oem_org": org,
            "path_prefix": path_prefix,
            "message": message,
            "message_type": message_type,
            "brand_logo_url": oem_branding["brand_logo_url"],
            "brand_name": oem_branding["brand_name"] or org.org_name,
            "primary_color": oem_branding["primary_color"],
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

    oem_branding = _fetch_oem_branding(org_id or "")

    return templates.TemplateResponse("oem_users.html", {
        "request": request,
        "oem_org": oem_org,
        "oem_users": oem_users,
        "path_prefix": path_prefix,
        "message": message,
        "message_type": message_type,
        "brand_logo_url": oem_branding["brand_logo_url"],
        "brand_name": oem_branding["brand_name"] or (oem_org.org_name if oem_org else ""),
        "primary_color": oem_branding["primary_color"],
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


@router.get("/clients/new", response_class=HTMLResponse)
def oem_new_client_page(request: Request, db: Session = Depends(db_session)):
    """OEM Admin: form to create a brand-new client org and its Client Admin in one step."""
    if not _is_user_logged_in(request):
        return RedirectResponse(f"{path_prefix}/auth/login?return_url={path_prefix}/oem-admin/clients/new", status_code=303)

    org_id = request.session.get("org_id")
    if not org_id:
        return RedirectResponse(f"{path_prefix}/auth/login", status_code=303)

    oem_org = db.get(Organization, org_id)
    if not oem_org or oem_org.org_type != "oem":
        return RedirectResponse(f"{path_prefix}/oem-admin", status_code=303)

    oem_branding = _fetch_oem_branding(org_id)
    message = request.query_params.get("message", "").replace("+", " ")
    message_type = request.query_params.get("message_type", "success")

    return templates.TemplateResponse("oem_new_client.html", {
        "request": request,
        "oem_org": oem_org,
        "path_prefix": path_prefix,
        "message": message,
        "message_type": message_type,
        "brand_logo_url": oem_branding["brand_logo_url"],
        "brand_name": oem_branding["brand_name"] or oem_org.org_name,
        "primary_color": oem_branding["primary_color"],
    })


@router.post("/clients/new", response_class=RedirectResponse)
def oem_new_client_submit(
    request: Request,
    org_name: str = Form(...),
    email: str = Form(...),
    contact_name: str = Form(None),
    phone: str = Form(None),
    company_address: str = Form(None),
    company_city: str = Form(None),
    company_state: str = Form(None),
    company_zip: str = Form(None),
    admin_email: str = Form(...),
    db: Session = Depends(db_session),
):
    """Create a new customer org + Client Admin account in one step."""
    new_url = f"{path_prefix}/oem-admin/clients/new"
    approvals_url = f"{path_prefix}/oem-admin/client-approvals"

    if not _is_user_logged_in(request):
        return RedirectResponse(f"{path_prefix}/auth/login", status_code=303)

    oem_org_id = request.session.get("org_id")
    oem_org = db.get(Organization, oem_org_id) if oem_org_id else None
    if not oem_org or oem_org.org_type != "oem":
        return RedirectResponse(f"{path_prefix}/oem-admin", status_code=303)

    # Check admin email uniqueness across all users
    taken = db.query(User).filter(
        (User.username == admin_email) | (User.email == admin_email)
    ).first()
    if taken:
        return RedirectResponse(
            f"{new_url}?message=Email+{admin_email}+is+already+in+use+by+another+account&message_type=error",
            status_code=303,
        )

    # Generate org_id (reuse registration helper)
    import re
    clean = re.sub(r"[^a-zA-Z0-9\s-]", "", org_name)
    clean = re.sub(r"\s+", "-", clean.strip()).upper()
    base_id = f"CUSTOMER-{clean[:20]}"
    org_id = base_id
    counter = 1
    while db.get(Organization, org_id):
        org_id = f"{base_id}-{counter:03d}"
        counter += 1

    # Create the customer org
    new_org = Organization(
        org_id=org_id,
        org_name=org_name.strip(),
        org_type="customer",
        email=email.strip() or None,
        contact_name=contact_name.strip() if contact_name else None,
        phone=phone.strip() if phone else None,
        company_address=company_address.strip() if company_address else None,
        company_city=company_city.strip() if company_city else None,
        company_state=company_state.strip() if company_state else None,
        company_zip=company_zip.strip() if company_zip else None,
        sponsor_org_id=oem_org_id,
        approval_status="pending",
    )
    db.add(new_org)
    db.commit()

    # Create the Client Admin user with a placeholder hash (inactive until they set password + OEM approves)
    import secrets
    from datetime import timedelta
    placeholder_hash = bcrypt.hashpw(secrets.token_hex(32).encode(), bcrypt.gensalt()).decode("utf-8")
    set_password_token = secrets.token_urlsafe(48)
    new_admin = User(
        username=admin_email,
        email=admin_email,
        password_hash=placeholder_hash,
        org_id=org_id,
        role="customer_admin",
        is_active=False,
        reset_token=set_password_token,
        reset_token_expires_at=datetime.utcnow() + timedelta(hours=72),
    )
    db.add(new_admin)
    db.commit()

    # Send set-password invitation email to the new client admin
    try:
        from ..services.email import send_password_reset_email as _send_set_pw
        _base = (settings.website_url or "http://localhost:8080").rstrip("/")
        _pfx = (settings.root_path or "").rstrip("/")
        set_pw_url = f"{_base}{_pfx}/auth/reset-password?token={set_password_token}"

        brand_name = oem_org.org_name or "Synerex"
        primary_color = "#7c3aed"
        try:
            _branding = _fetch_oem_branding(oem_org_id)
            brand_name = _branding.get("brand_name") or brand_name
            primary_color = _branding.get("primary_color") or primary_color
        except Exception:
            pass

        _send_set_pw(
            to_email=admin_email,
            reset_url=set_pw_url,
            brand_name=brand_name,
            primary_color=primary_color,
            is_new_account=True,
        )
    except Exception as _e:
        import logging as _log
        _log.getLogger(__name__).warning("Could not send set-password email for %s: %s", admin_email, _e)

    # Sync org to EMV and Tracking programs (best-effort, non-blocking)
    try:
        from ..services.org_sync import sync_org_to_programs
        sync_org_to_programs(new_org)
    except Exception as _e:
        import logging as _log
        _log.getLogger(__name__).warning("org_sync failed for %s: %s", org_id, _e)

    # Audit log
    try:
        from ..audit.events import log_event
        log_event(db, actor=oem_org_id, action="org.create_by_oem", ref_id=org_id,
                  detail={"org_name": org_name, "admin_email": admin_email, "oem_org_id": oem_org_id})
    except Exception:
        pass

    return RedirectResponse(
        f"{approvals_url}?message=Client+{org_name}+created.+A+set-password+link+was+emailed+to+{admin_email}.+Approve+after+payment+is+confirmed.&message_type=success",
        status_code=303,
    )


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

@router.get("/clients", response_class=HTMLResponse)
def oem_clients_redirect(request: Request):
    """Redirect /oem-admin/clients → /oem-admin/client-approvals (full client list)."""
    pfx = (settings.root_path or "").rstrip("/")
    return RedirectResponse(f"{pfx}/oem-admin/client-approvals", status_code=302)


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

    oem_branding = _fetch_oem_branding(org_id or "")

    return templates.TemplateResponse("oem_client_approvals.html", {
        "request": request,
        "oem_org": oem_org,
        "clients_data": clients_data,
        "status_filter": status_filter,
        "pending_count": pending_count,
        "path_prefix": path_prefix,
        "message": message,
        "message_type": message_type,
        "brand_logo_url": oem_branding["brand_logo_url"],
        "brand_name": oem_branding["brand_name"] or (oem_org.org_name if oem_org else ""),
        "primary_color": oem_branding["primary_color"],
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
            _oem_login_url = f"{base}{pfx}/auth/login?oem={oem_org_id}"
            _send(
                to_email=u.email,
                client_org_name=customer.org_name,
                client_org_id=org_id,
                oem_org_name=oem_org.org_name,
                temp_password=None,
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


@router.get("/billing", response_class=HTMLResponse)
def oem_billing_page(request: Request, db: Session = Depends(db_session)):
    """OEM Admin: view their platform-fee billing statement from Synerex."""
    from decimal import Decimal
    from ..models.oem_invoice import OemInvoice

    path_prefix = (settings.root_path or "").rstrip("/")
    if not _is_user_logged_in(request):
        return RedirectResponse(f"{path_prefix}/auth/login", status_code=303)

    oem_org_id = request.session.get("org_id")
    username = request.session.get("username")
    user = db.get(User, username) if username else None
    oem_org = db.get(Organization, oem_org_id) if oem_org_id else None
    if not user or user.role != "oem_admin" or not oem_org or oem_org.org_type != "oem":
        return RedirectResponse(f"{path_prefix}/oem-admin", status_code=303)

    branding = _fetch_oem_branding(oem_org_id)

    invoices_raw = db.query(OemInvoice).filter(
        OemInvoice.oem_org_id == oem_org_id
    ).order_by(OemInvoice.created_at.desc()).all()

    client_ids = list({inv.client_org_id for inv in invoices_raw})
    client_orgs = {o.org_id: o for o in db.query(Organization).filter(Organization.org_id.in_(client_ids)).all()} if client_ids else {}

    invoices = [
        {
            "invoice_id": inv.invoice_id,
            "client_org_id": inv.client_org_id,
            "client_name": (client_orgs.get(inv.client_org_id) or Organization()).org_name,
            "plan": inv.plan,
            "event_type": inv.event_type,
            "amount": inv.amount,
            "status": inv.status,
            "paid_at": inv.paid_at,
            "created_at": inv.created_at,
            "notes": inv.notes,
        }
        for inv in invoices_raw
    ]

    pending_sum = sum(Decimal(i.amount or "0") for i in invoices_raw if i.status == "pending")
    paid_sum = sum(Decimal(i.amount or "0") for i in invoices_raw if i.status == "paid")

    return templates.TemplateResponse("oem_billing_statement.html", {
        "request": request,
        "oem_org": oem_org,
        "invoices": invoices,
        "totals": {
            "total_count": len(invoices),
            "pending_amount": f"{pending_sum:.2f}",
            "paid_amount": f"{paid_sum:.2f}",
            "client_count": len(client_ids),
        },
        "brand_name": branding.get("brand_name") or oem_org.org_name,
        "brand_logo_url": branding.get("brand_logo_url"),
        "primary_color": branding.get("primary_color", "#667eea"),
        "path_prefix": path_prefix,
    })


@router.get("/payment-method", response_class=HTMLResponse)
def oem_payment_method_page(request: Request, db: Session = Depends(db_session)):
    """OEM Admin: view/update saved Stripe payment method."""
    from fastapi.responses import JSONResponse as _JSONResponse

    path_prefix = (settings.root_path or "").rstrip("/")
    if not _is_user_logged_in(request):
        return RedirectResponse(f"{path_prefix}/auth/login", status_code=303)

    oem_org_id = request.session.get("org_id")
    username = request.session.get("username")
    user = db.get(User, username) if username else None
    oem_org = db.get(Organization, oem_org_id) if oem_org_id else None
    if not user or user.role != "oem_admin" or not oem_org or oem_org.org_type != "oem":
        return RedirectResponse(f"{path_prefix}/oem-admin", status_code=303)

    branding = _fetch_oem_branding(oem_org_id)

    has_payment_method = False
    card_brand = card_last4 = card_exp = ""
    if oem_org.stripe_customer_id and settings.stripe_secret_key:
        try:
            import stripe as _stripe
            _stripe.api_key = settings.stripe_secret_key
            payment_methods = _stripe.PaymentMethod.list(
                customer=oem_org.stripe_customer_id, type="card"
            )
            if payment_methods.data:
                pm = payment_methods.data[0]
                has_payment_method = True
                card_brand = pm.card.brand
                card_last4 = pm.card.last4
                card_exp = f"{pm.card.exp_month:02d}/{pm.card.exp_year}"
        except Exception:
            pass

    flash_message = request.query_params.get("message", "").replace("+", " ")
    flash_type = request.query_params.get("message_type", "success")

    return templates.TemplateResponse("oem_payment_method.html", {
        "request": request,
        "oem_org": oem_org,
        "has_payment_method": has_payment_method,
        "card_brand": card_brand,
        "card_last4": card_last4,
        "card_exp": card_exp,
        "publishable_key": settings.stripe_publishable_key or "",
        "brand_name": branding.get("brand_name") or oem_org.org_name,
        "brand_logo_url": branding.get("brand_logo_url"),
        "flash_message": flash_message,
        "flash_type": flash_type,
        "path_prefix": path_prefix,
    })


@router.post("/payment-method/create-setup-intent")
async def oem_create_setup_intent(request: Request, db: Session = Depends(db_session)):
    """Create a Stripe SetupIntent for saving an OEM's card."""
    from fastapi.responses import JSONResponse as _JSONResponse

    path_prefix = (settings.root_path or "").rstrip("/")
    if not _is_user_logged_in(request):
        return _JSONResponse({"error": "Not authenticated"}, status_code=401)

    if not settings.stripe_secret_key:
        return _JSONResponse({"error": "Stripe is not configured"}, status_code=503)

    oem_org_id = request.session.get("org_id")
    username = request.session.get("username")
    user = db.get(User, username) if username else None
    oem_org = db.get(Organization, oem_org_id) if oem_org_id else None
    if not user or user.role != "oem_admin" or not oem_org or oem_org.org_type != "oem":
        return _JSONResponse({"error": "Forbidden"}, status_code=403)

    try:
        import stripe as _stripe
        _stripe.api_key = settings.stripe_secret_key

        # Create or reuse Stripe Customer for this OEM
        if not oem_org.stripe_customer_id:
            customer = _stripe.Customer.create(
                name=oem_org.org_name,
                email=oem_org.email or oem_org.billing_email or "",
                metadata={"org_id": oem_org_id, "org_type": "oem"},
            )
            oem_org.stripe_customer_id = customer.id
            db.commit()
        else:
            customer = _stripe.Customer.retrieve(oem_org.stripe_customer_id)

        setup_intent = _stripe.SetupIntent.create(
            customer=customer.id,
            usage="off_session",
            metadata={"org_id": oem_org_id},
        )
        return _JSONResponse({"client_secret": setup_intent.client_secret})
    except Exception as exc:
        return _JSONResponse({"error": str(exc)}, status_code=502)


@router.post("/payment-method/save")
async def oem_save_payment_method(request: Request, db: Session = Depends(db_session)):
    """Attach the confirmed SetupIntent payment method as the OEM's default card."""
    from fastapi.responses import JSONResponse as _JSONResponse

    if not _is_user_logged_in(request):
        return _JSONResponse({"error": "Not authenticated"}, status_code=401)

    if not settings.stripe_secret_key:
        return _JSONResponse({"error": "Stripe is not configured"}, status_code=503)

    oem_org_id = request.session.get("org_id")
    username = request.session.get("username")
    user = db.get(User, username) if username else None
    oem_org = db.get(Organization, oem_org_id) if oem_org_id else None
    if not user or user.role != "oem_admin" or not oem_org or oem_org.org_type != "oem":
        return _JSONResponse({"error": "Forbidden"}, status_code=403)

    try:
        body = await request.json()
        payment_method_id = body.get("payment_method_id")
        if not payment_method_id:
            return _JSONResponse({"error": "payment_method_id required"}, status_code=400)

        import stripe as _stripe
        _stripe.api_key = settings.stripe_secret_key

        # Attach PM to customer and set as default
        _stripe.PaymentMethod.attach(payment_method_id, customer=oem_org.stripe_customer_id)
        _stripe.Customer.modify(
            oem_org.stripe_customer_id,
            invoice_settings={"default_payment_method": payment_method_id},
        )
        db.commit()
        return _JSONResponse({"ok": True})
    except Exception as exc:
        return _JSONResponse({"error": str(exc)}, status_code=502)
