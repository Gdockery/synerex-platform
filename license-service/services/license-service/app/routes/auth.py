from __future__ import annotations
import uuid
import bcrypt
from fastapi import APIRouter, Depends, Form, HTTPException, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from starlette.requests import Request
from sqlalchemy.orm import Session
from pathlib import Path

from ..db import SessionLocal
from ..models.user import User
from ..models.org import Organization
from ..services.jwt_tokens import generate_user_token, validate_user_token, is_token_expired
from ..config import settings

router = APIRouter(prefix="/auth", tags=["auth"])
_path = lambda p: f"{settings.root_path.rstrip('/')}{p}" if settings.root_path else p

# Templates directory
TEMPLATES_DIR = Path(__file__).resolve().parents[1] / "admin" / "templates"
templates = Jinja2Templates(directory=str(TEMPLATES_DIR))

def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def _is_user_logged_in(request: Request) -> bool:
    """Check if user is logged in."""
    try:
        return bool(request.session.get("user_logged_in", False))
    except (AttributeError, KeyError, RuntimeError):
        return False

def _resolve_login_branding(request: Request, db: Session) -> dict:
    """Resolve branding from ?oem= or ?client= query params. Returns brand context dict."""
    oem_param = request.query_params.get("oem", "")
    client_param = request.query_params.get("client", "")
    brand_name = "Synerex"
    brand_type = "default"
    brand_org_id = ""
    brand_subtitle = "Account Portal"
    brand_color = "#1976d2"

    # Determine which OEM org_id to use for logo lookup
    oem_logo_org_id = None

    if oem_param:
        org = db.get(Organization, oem_param)
        if org and org.org_type == "oem":
            brand_name = org.org_name
            brand_type = "oem"
            brand_org_id = oem_param
            brand_subtitle = "Partner Portal"
            brand_color = "#7c3aed"
            oem_logo_org_id = oem_param
    elif client_param:
        org = db.get(Organization, client_param)
        if org and org.org_type == "customer":
            brand_name = org.org_name
            brand_type = "client"
            brand_org_id = client_param
            brand_subtitle = "User Portal"
            brand_color = "#0369a1"
            # Use the sponsor OEM org_id for logo lookup
            oem_logo_org_id = getattr(org, "sponsor_org_id", None) or None

    # Fetch OEM logo URL from Tracking Program
    brand_logo_url = None
    if oem_logo_org_id:
        try:
            import urllib.request as _ur
            _tracking_url = (getattr(settings, "tracking_program_url", None) or "http://tracking-program:8087").rstrip("/")
            _branding_url = f"{_tracking_url}/api/whitelabel/oem-branding-by-org?org_id={oem_logo_org_id}"
            with _ur.urlopen(_branding_url, timeout=3) as _resp:
                import json as _json
                _data = _json.loads(_resp.read().decode())
                brand_logo_url = _data.get("logo_url") or None
        except Exception:
            brand_logo_url = None

    return {
        "brand_name": brand_name,
        "brand_type": brand_type,
        "brand_org_id": brand_org_id,
        "brand_subtitle": brand_subtitle,
        "brand_color": brand_color,
        "brand_logo_url": brand_logo_url,
    }


@router.get("/login", response_class=HTMLResponse)
def client_login_page(request: Request, db: Session = Depends(db_session)):
    """Display client login page."""
    return_url = request.query_params.get("return_url", "")
    error = request.query_params.get("error", "")
    branding = _resolve_login_branding(request, db)

    # Build login action URL preserving oem/client params
    action_params = []
    if branding["brand_type"] == "oem":
        action_params.append(f"oem={branding['brand_org_id']}")
    elif branding["brand_type"] == "client":
        action_params.append(f"client={branding['brand_org_id']}")
    action_qs = ("?" + "&".join(action_params)) if action_params else ""
    login_action = _path(f"/auth/login{action_qs}")

    ctx = {
        "request": request,
        "error": error if error else None,
        "return_url": return_url,
        "login_action": login_action,
        "register_href": _path("/register/"),
        "path_prefix": settings.root_path.rstrip("/") if settings.root_path else "",
        **branding,
    }
    try:
        return templates.TemplateResponse("client_login.html", ctx)
    except Exception as e:
        # Fallback HTML if template fails
        return_url_param = f'?return_url={return_url}' if return_url else ''
        return HTMLResponse(f"""
        <html>
        <head>
            <title>Client Login - Synerex Platform</title>
            <style>
                body {{ font-family: Arial, sans-serif; max-width: 400px; margin: 50px auto; padding: 20px; }}
                h1 {{ color: #1976d2; }}
                .error {{ color: #b00020; background: #ffebee; padding: 12px; border-radius: 4px; margin-bottom: 20px; }}
                input {{ width: 100%; padding: 10px; margin: 8px 0; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }}
                button {{ background: #1976d2; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; width: 100%; }}
                button:hover {{ background: #1565c0; }}
            </style>
        </head>
        <body>
            <h1>Client Login</h1>
            {f'<div class="error">{error}</div>' if error else ''}
            <form method="post" action="/auth/login{return_url_param}">
                <label>Username:</label><br/>
                <input name="username" required /><br/><br/>
                <label>Password:</label><br/>
                <input name="password" type="password" required /><br/><br/>
                <button type="submit">Login</button>
            </form>
            <p style="margin-top: 20px;">
                <a href="/register">Don't have an account? Register here</a>
            </p>
        </body>
        </html>
        """)

@router.post("/login", response_class=HTMLResponse)
def client_login_submit(
    request: Request,
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(db_session)
):
    """Handle client login."""
    return_url = request.query_params.get("return_url", "")
    branding = _resolve_login_branding(request, db)

    # Build branded error redirect URL
    def _error_redirect(msg):
        params = [f"error={msg}"]
        if branding["brand_type"] == "oem":
            params.append(f"oem={branding['brand_org_id']}")
        elif branding["brand_type"] == "client":
            params.append(f"client={branding['brand_org_id']}")
        if return_url:
            params.append(f"return_url={return_url}")
        return RedirectResponse(_path(f"/auth/login?{'&'.join(params)}"), status_code=303)
    
    try:
        user = db.get(User, username)
        # Fall back to email lookup (accounts created via admin panel use a username != email)
        if not user:
            user = db.query(User).filter(User.email == username).first()
        if not user or not user.is_active:
            return _error_redirect("Invalid username or password")

        # Verify password
        try:
            password_valid = bcrypt.checkpw(
                password.encode('utf-8'),
                user.password_hash.encode('utf-8')
            )
        except Exception:
            password_valid = False

        if not password_valid:
            return _error_redirect("Invalid username or password")

        # Enforce approval gate — OEM and Customer orgs must be approved
        try:
            org = db.get(Organization, user.org_id)
            if org and org.org_type in ("oem", "customer"):
                status = org.approval_status
                if status == "rejected":
                    return _error_redirect("This account has been rejected. Please contact Synerex.")
                if status == "pending":
                    if org.org_type == "oem":
                        return _error_redirect("Your OEM account is pending approval by Synerex. You will be notified when it is approved.")
                    else:
                        return _error_redirect("Your organization is pending approval. Please contact your OEM sponsor.")
        except Exception:
            pass  # Never block login due to an unexpected error in this check
        
        # Set session — always use the canonical username (PK), not the raw form input
        # (user may have logged in with their email address instead of their username)
        canonical_username = user.username
        request.session["user_logged_in"] = True
        request.session["username"] = canonical_username
        request.session["org_id"] = user.org_id

        # Generate user JWT for SSO (stored in session for now)
        try:
            org = db.get(Organization, user.org_id)
            org_type = org.org_type if org else None
            user_token = generate_user_token(
                org_id=user.org_id,
                username=canonical_username,
                email=user.email,
                roles=["user"],
            )
            request.session["user_token"] = user_token
        except Exception:
            # Do not block login if token creation fails
            request.session["user_token"] = None
        
        # Generate session token for external use
        session_token = str(uuid.uuid4())
        request.session["session_token"] = session_token

        # Generate SSO JWT for external services
        user_roles = []
        try:
            org = db.get(Organization, user.org_id)
            if org and org.org_type:
                user_roles = [org.org_type]
        except Exception:
            user_roles = []
        jwt_token = generate_user_token(
            username=canonical_username,
            org_id=user.org_id,
            roles=user_roles
        )
        request.session["user_jwt"] = jwt_token
        
        if return_url:
            return_url = _normalize_return_url(return_url)
            separator = "&" if "?" in return_url else "?"
            # Prefer JWT token for SSO if available, fallback to session token
            token_to_use = request.session.get("user_token") or session_token
            return RedirectResponse(f"{return_url}{separator}token={token_to_use}", status_code=303)
        
        # Default redirect based on role
        base = (settings.website_url or "").rstrip("/")
        user_role = getattr(user, "role", None)
        token_to_use = request.session.get("user_token") or session_token

        if user_role == "customer_viewer":
            # Client User → go directly to Tracking Program
            tracking_url = (f"{base}/tracking" if base else "/tracking")
            return RedirectResponse(f"{tracking_url}/?token={token_to_use}", status_code=303)
        else:
            # Client Admin, OEM, Synerex Admin → go to My Account
            default_url = f"{base}/my-account" if base else "/my-account"
            return RedirectResponse(default_url, status_code=303)
    except Exception as e:
        return _error_redirect(f"Login failed: {str(e)}")

@router.get("/client-portal", response_class=HTMLResponse)
def client_admin_portal(request: Request, db: Session = Depends(db_session)):
    """Client Admin portal — manage Client Users and show their branded login link."""
    if not _is_user_logged_in(request):
        return RedirectResponse(_path("/auth/login"), status_code=303)

    org_id = request.session.get("org_id")
    if not org_id:
        return RedirectResponse(_path("/auth/login"), status_code=303)

    # Verify this is a customer_admin user
    username = request.session.get("username")
    user = db.get(User, username) if username else None
    if not user or user.role != "customer_admin":
        return RedirectResponse(_path("/auth/login"), status_code=303)

    org = db.get(Organization, org_id)
    if not org or org.org_type != "customer":
        return RedirectResponse(_path("/auth/login"), status_code=303)

    # Get all client users for this org
    client_users = db.query(User).filter(
        User.org_id == org_id,
        User.role == "customer_viewer",
        User.is_active == True,
    ).all()

    # Build the branded login link for client users
    base_url = (settings.website_url or "http://localhost:8080").rstrip("/")
    path_pfx = (settings.root_path or "").rstrip("/")
    client_login_url = f"{base_url}{path_pfx}/auth/login?client={org_id}"

    message = request.query_params.get("message", "").replace("+", " ")
    message_type = request.query_params.get("message_type", "success")
    path_prefix = (settings.root_path or "").rstrip("/")

    return templates.TemplateResponse("client_admin_portal.html", {
        "request": request,
        "org": org,
        "client_users": client_users,
        "client_login_url": client_login_url,
        "path_prefix": path_prefix,
        "message": message,
        "message_type": message_type,
    })


@router.post("/client-portal/create-user", response_class=RedirectResponse)
def client_admin_create_user(
    request: Request,
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(db_session),
):
    """Create a Client User (customer_viewer) for the logged-in Client Admin's org."""
    portal_url = _path("/auth/client-portal")
    if not _is_user_logged_in(request):
        return RedirectResponse(_path("/auth/login"), status_code=303)

    org_id = request.session.get("org_id")
    username = request.session.get("username")
    user = db.get(User, username) if username else None
    if not user or user.role != "customer_admin":
        return RedirectResponse(_path("/auth/login"), status_code=303)

    org = db.get(Organization, org_id)
    if not org or org.org_type != "customer":
        return RedirectResponse(_path("/auth/login"), status_code=303)

    # Check seat limit from license service
    try:
        from ..services.license_check import get_seat_limit
        seat_limit = get_seat_limit(org_id)
    except Exception:
        seat_limit = None

    if seat_limit is not None:
        current_count = db.query(User).filter(
            User.org_id == org_id,
            User.role == "customer_viewer",
            User.is_active == True,
        ).count()
        if current_count >= seat_limit:
            return RedirectResponse(
                f"{portal_url}?message=Seat+limit+reached+({seat_limit}+seats)&message_type=error",
                status_code=303
            )

    # Check if user already exists
    existing = db.query(User).filter(
        (User.username == email) | (User.email == email)
    ).first()
    if existing:
        return RedirectResponse(
            f"{portal_url}?message=User+already+exists+with+that+email&message_type=error",
            status_code=303
        )

    if len(password) < 6:
        return RedirectResponse(
            f"{portal_url}?message=Password+must+be+at+least+6+characters&message_type=error",
            status_code=303
        )

    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    new_user = User(
        username=email,
        email=email,
        password_hash=hashed,
        org_id=org_id,
        role="customer_viewer",
        is_active=True,
    )
    db.add(new_user)
    db.commit()

    return RedirectResponse(
        f"{portal_url}?message=User+{email}+created+successfully&message_type=success",
        status_code=303
    )


@router.post("/client-portal/delete-user", response_class=RedirectResponse)
def client_admin_delete_user(
    request: Request,
    target_username: str = Form(...),
    db: Session = Depends(db_session),
):
    """Deactivate a Client User."""
    portal_url = _path("/auth/client-portal")
    if not _is_user_logged_in(request):
        return RedirectResponse(_path("/auth/login"), status_code=303)

    org_id = request.session.get("org_id")
    username = request.session.get("username")
    user = db.get(User, username) if username else None
    if not user or user.role != "customer_admin":
        return RedirectResponse(_path("/auth/login"), status_code=303)

    target = db.query(User).filter(
        User.username == target_username,
        User.org_id == org_id,
        User.role == "customer_viewer",
    ).first()
    if not target:
        return RedirectResponse(
            f"{portal_url}?message=User+not+found&message_type=error", status_code=303
        )

    target.is_active = False
    db.commit()
    return RedirectResponse(
        f"{portal_url}?message=User+{target_username}+removed&message_type=success",
        status_code=303
    )


@router.post("/logout")
def client_logout(request: Request):
    """Handle client logout."""
    request.session.clear()
    return RedirectResponse(_path("/auth/login"), status_code=303)


def _my_account_url(request: Request) -> str:
    """Build browser-accessible my-account URL. Uses website_url so port is included (request.url can omit port)."""
    base = (settings.website_url or "").rstrip("/")
    if base:
        return f"{base}/my-account"
    origin = f"{request.url.scheme}://{request.url.netloc}"
    return f"{origin}/my-account"


def _normalize_return_url(return_url: str) -> str:
    """Rewrite return_url to always use the canonical website_url origin (localhost not 127.0.0.1, correct port)."""
    if not return_url or not settings.website_url:
        return return_url
    from urllib.parse import urlparse
    try:
        parsed = urlparse(return_url)
        if parsed.hostname in ("localhost", "127.0.0.1"):
            base = urlparse(settings.website_url)
            origin = f"{base.scheme}://{base.netloc}"
            path = parsed.path or "/my-account"
            return f"{origin}{path}{('?' + parsed.query) if parsed.query else ''}"
    except Exception:
        pass
    return return_url


@router.get("/change-password", response_class=HTMLResponse)
def change_password_page(request: Request):
    """Display change password form for logged-in users."""
    if not _is_user_logged_in(request):
        login_url = _path("/auth/login")
        return_url = _path("/auth/change-password")
        return RedirectResponse(f"{login_url}?return_url={return_url}", status_code=303)
    message = request.query_params.get("message", "").replace("+", " ")
    message_type = request.query_params.get("message_type", "success")
    username = request.session.get("username", "")
    path_prefix = (settings.root_path or "").rstrip("/")
    # Look up user role to conditionally show Back to My Account
    _db = SessionLocal()
    try:
        from ..models.user import User as _UserModel
        _u = _db.get(_UserModel, username)
        _user_role = getattr(_u, "role", None) if _u else None
    finally:
        _db.close()
    _website_home = (settings.website_url or "").rstrip("/")
    back_link_html = (
        f'<a href="{_website_home}/my-account" class="back-link">← Back to My Account</a>'
        if _user_role != "customer_viewer"
        else '<a href="javascript:history.back()" class="back-link">← Back</a>'
    )
    return HTMLResponse(f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Change Password - Synerex Platform</title>
  <style>
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    body {{ font-family: system-ui, sans-serif; background: #f5f7fa; color: #2c3e50; line-height: 1.6; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 2rem; }}
    .card {{ background: white; border-radius: 8px; box-shadow: 0 2px 12px rgba(0,0,0,0.1); padding: 2.5rem; width: 100%; max-width: 440px; }}
    .logo-container {{ text-align: center; margin-bottom: 1.5rem; }}
    .logo-container img {{ height: 44px; max-width: 180px; }}
    h1 {{ font-size: 1.4rem; font-weight: 700; color: #2c3e50; margin-bottom: 0.25rem; text-align: center; }}
    .subtitle {{ font-size: 0.9rem; color: #718096; margin-bottom: 1.75rem; text-align: center; }}
    .form-group {{ margin-bottom: 1.1rem; }}
    .form-group label {{ display: block; font-weight: 500; color: #4a5568; margin-bottom: 0.35rem; font-size: 0.9rem; }}
    .form-group input {{ width: 100%; padding: 0.6rem 0.8rem; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.95rem; transition: border-color 0.2s; }}
    .form-group input:focus {{ outline: none; border-color: #667eea; box-shadow: 0 0 0 3px rgba(102,126,234,0.12); }}
    .btn {{ display: block; width: 100%; padding: 0.7rem; background: #667eea; color: white; border: none; border-radius: 6px; font-size: 1rem; font-weight: 600; cursor: pointer; margin-top: 1.5rem; transition: background 0.2s; }}
    .btn:hover {{ background: #5a67d8; }}
    .back-link {{ display: block; text-align: center; margin-top: 1rem; font-size: 0.9rem; color: #667eea; text-decoration: none; }}
    .back-link:hover {{ text-decoration: underline; }}
    .message {{ padding: 0.85rem 1rem; border-radius: 6px; margin-bottom: 1.25rem; font-size: 0.9rem; font-weight: 500; }}
    .message.ok {{ background: #c6f6d5; color: #22543d; border: 1px solid #9ae6b4; }}
    .message.error {{ background: #fed7d7; color: #c53030; border: 1px solid #fc8181; }}
    .hint {{ font-size: 0.8rem; color: #a0aec0; margin-top: 0.25rem; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="logo-container">
      <img src="{path_prefix}/static/synerex_logo_color.png" alt="Synerex"/>
    </div>
    <h1>Change Password</h1>
    <p class="subtitle">Logged in as <strong>{username}</strong></p>
    {"<div class='message ok'>" + message + "</div>" if message and message_type != "error" else ""}
    {"<div class='message error'>" + message + "</div>" if message and message_type == "error" else ""}
    <form method="post" action="{path_prefix}/auth/change-password" autocomplete="off">
      <div class="form-group">
        <label for="current_password">Current Password</label>
        <input type="password" id="current_password" name="current_password" required autocomplete="current-password"/>
      </div>
      <div class="form-group">
        <label for="new_password">New Password</label>
        <input type="password" id="new_password" name="new_password" required autocomplete="new-password" minlength="8"/>
        <div class="hint">Minimum 8 characters.</div>
      </div>
      <div class="form-group">
        <label for="confirm_password">Confirm New Password</label>
        <input type="password" id="confirm_password" name="confirm_password" required autocomplete="new-password"/>
      </div>
      <button type="submit" class="btn">Update Password</button>
    </form>
    {back_link_html}
  </div>
</body>
</html>""")


@router.post("/change-password", response_class=RedirectResponse)
def change_password_submit(
    request: Request,
    current_password: str = Form(...),
    new_password: str = Form(...),
    confirm_password: str = Form(...),
    db: Session = Depends(db_session),
):
    """Process password change for logged-in user."""
    change_url = _path("/auth/change-password")
    if not _is_user_logged_in(request):
        return RedirectResponse(_path("/auth/login"), status_code=303)

    username = request.session.get("username")
    if not username:
        return RedirectResponse(_path("/auth/login"), status_code=303)

    if new_password != confirm_password:
        return RedirectResponse(
            f"{change_url}?message=New+passwords+do+not+match&message_type=error", status_code=303
        )
    if len(new_password) < 8:
        return RedirectResponse(
            f"{change_url}?message=Password+must+be+at+least+8+characters&message_type=error", status_code=303
        )

    user = db.query(User).filter(User.username == username).first()
    if not user:
        return RedirectResponse(
            f"{change_url}?message=User+not+found&message_type=error", status_code=303
        )

    try:
        current_valid = bcrypt.checkpw(current_password.encode("utf-8"), user.password_hash.encode("utf-8"))
    except Exception:
        current_valid = False

    if not current_valid:
        return RedirectResponse(
            f"{change_url}?message=Current+password+is+incorrect&message_type=error", status_code=303
        )

    user.password_hash = bcrypt.hashpw(new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    db.commit()

    return RedirectResponse(
        f"{change_url}?message=Password+updated+successfully&message_type=success", status_code=303
    )


@router.get("/logout-all")
def client_logout_all(request: Request):
    """Unified logout (GET for link navigation). Clears session, redirects to website Home page."""
    request.session.clear()
    home_url = (settings.website_url or "").rstrip("/") + "/"
    return RedirectResponse(home_url, status_code=303)


@router.get("/api/jwt")
def get_user_jwt(request: Request, db: Session = Depends(db_session)):
    """Return the current user's JWT if logged in. Refreshes token if expired."""
    if not _is_user_logged_in(request):
        raise HTTPException(401, "Not authenticated")
    token = request.session.get("user_token")
    # Refresh token if missing or expired so program links (EM&V, Tracking) always work
    if not token or is_token_expired(token):
        username = request.session.get("username")
        org_id = request.session.get("org_id")
        if not username or not org_id:
            raise HTTPException(404, "JWT not available")
        user = db.get(User, username)
        if not user or not user.is_active:
            raise HTTPException(401, "User invalid")
        org = db.get(Organization, org_id)
        org_type = org.org_type if org else None
        user_roles = [org_type] if org_type else []
        token = generate_user_token(
            username=username,
            org_id=org_id,
            roles=user_roles,
            email=getattr(user, "email", None),
        )
        request.session["user_token"] = token
    return {"token": token}


@router.post("/api/verify-credentials")
def verify_credentials(body: dict, db: Session = Depends(db_session)):
    """Verify username+password for a user — used by other services (e.g. Tracking Program) for SSO credential check."""
    username = body.get("username") or body.get("email")
    password = body.get("password")
    if not username or not password:
        raise HTTPException(400, "username and password required")

    user = db.query(User).filter(
        (User.username == username) | (User.email == username)
    ).first()
    if not user:
        raise HTTPException(401, "Invalid credentials")

    try:
        valid = bcrypt.checkpw(password.encode("utf-8"), user.password_hash.encode("utf-8"))
    except Exception:
        valid = False

    if not valid:
        raise HTTPException(401, "Invalid credentials")

    org = db.get(Organization, user.org_id) if user.org_id else None
    org_type = org.org_type if org else None
    # Derive a role string suitable for downstream services (EMV, Tracking)
    # OEM orgs and the Synerex admin org are treated as administrators
    if org_type in ("oem", "admin") or user.org_id == "admin":
        derived_role = "administrator"
    else:
        derived_role = "user"
    return {
        "valid": True,
        "username": user.username,
        "email": getattr(user, "email", None),
        "org_id": user.org_id,
        "org_type": org_type,
        "org_name": org.org_name if org else None,
        "role": derived_role,
        "roles": [derived_role],
    }


@router.post("/api/verify-jwt")
def verify_user_jwt(body: dict):
    """Verify a user JWT or admin session token; return claims."""
    token = body.get("token")
    if not token:
        raise HTTPException(400, "token required")
    try:
        claims = validate_user_token(token)
    except ValueError:
        # Not a JWT - check if it's a valid admin session token (for SSO from AdminDashboard)
        from ..auth.admin_tokens import verify_admin_token
        from ..config import settings
        if verify_admin_token(token):
            claims = {
                "email": settings.admin_sso_email,
                "sub": "synerex",
                "roles": ["admin"],
            }
        else:
            raise HTTPException(401, "Invalid or expired token")
    return {"valid": True, "claims": claims}

@router.post("/api/login-jwt")
def login_jwt(
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(db_session)
):
    """Issue a user JWT for SSO login."""
    user = db.get(User, username)
    if not user or not user.is_active:
        raise HTTPException(401, "Invalid username or password")
    try:
        password_valid = bcrypt.checkpw(
            password.encode("utf-8"),
            user.password_hash.encode("utf-8")
        )
    except Exception:
        password_valid = False
    if not password_valid:
        raise HTTPException(401, "Invalid username or password")

    user_roles = []
    org = db.get(Organization, user.org_id)
    if org and org.org_type:
        user_roles = [org.org_type]
    token = generate_user_token(username=user.username, org_id=user.org_id, roles=user_roles)
    return {"token": token, "org_id": user.org_id, "roles": user_roles}

@router.post("/api/validate-jwt")
def validate_jwt(body: dict, db: Session = Depends(db_session)):
    """Validate a user JWT and return claims."""
    token = body.get("token")
    if not token:
        raise HTTPException(400, "token required")
    try:
        claims = validate_user_token(token)
        return {"valid": True, "claims": claims}
    except ValueError as e:
        raise HTTPException(401, str(e))
