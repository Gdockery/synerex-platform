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
from ..services.jwt_tokens import generate_user_token, validate_user_token
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

@router.get("/login", response_class=HTMLResponse)
def client_login_page(request: Request):
    """Display client login page."""
    return_url = request.query_params.get("return_url", "")
    error = request.query_params.get("error", "")
    ctx = {
        "request": request,
        "error": error if error else None,
        "return_url": return_url,
        "login_action": _path("/auth/login"),
        "register_href": _path("/register"),
        "path_prefix": settings.root_path.rstrip("/") if settings.root_path else "",
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
    
    try:
        user = db.get(User, username)
        if not user or not user.is_active:
            error_msg = "Invalid username or password"
            if return_url:
                return RedirectResponse(_path(f"/auth/login?error={error_msg}&return_url={return_url}"), status_code=303)
            return templates.TemplateResponse(
                "client_login.html",
                {"request": request, "error": error_msg, "return_url": return_url},
                status_code=401
            )
        
        # Verify password
        try:
            password_valid = bcrypt.checkpw(
                password.encode('utf-8'),
                user.password_hash.encode('utf-8')
            )
        except Exception:
            password_valid = False
        
        if not password_valid:
            error_msg = "Invalid username or password"
            if return_url:
                return RedirectResponse(_path(f"/auth/login?error={error_msg}&return_url={return_url}"), status_code=303)
            return templates.TemplateResponse(
                "client_login.html",
                {"request": request, "error": error_msg, "return_url": return_url},
                status_code=401
            )
        
        # Set session
        request.session["user_logged_in"] = True
        request.session["username"] = username
        request.session["org_id"] = user.org_id

        # Generate user JWT for SSO (stored in session for now)
        try:
            org = db.get(Organization, user.org_id)
            org_type = org.org_type if org else None
            user_token = generate_user_token(
                org_id=user.org_id,
                username=username,
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
            username=username,
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
        
        # Default redirect to my-account (use website_url so port is included; request.url can omit port)
        base = (settings.website_url or "").rstrip("/")
        default_url = f"{base}/my-account" if base else "/my-account"
        return RedirectResponse(default_url, status_code=303)
    except Exception as e:
        error_msg = f"Login failed: {str(e)}"
        if return_url:
            return RedirectResponse(_path(f"/auth/login?error={error_msg}&return_url={return_url}"), status_code=303)
        return templates.TemplateResponse(
            "client_login.html",
            {"request": request, "error": error_msg, "return_url": return_url},
            status_code=500
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
    <a href="{(settings.website_url or "").rstrip("/")}/my-account" class="back-link">← Back to My Account</a>
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
def get_user_jwt(request: Request):
    """Return the current user's JWT if logged in."""
    if not _is_user_logged_in(request):
        raise HTTPException(401, "Not authenticated")
    token = request.session.get("user_token")
    if not token:
        raise HTTPException(404, "JWT not available")
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
