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

router = APIRouter(prefix="/auth", tags=["auth"])

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
    
    try:
        return templates.TemplateResponse(
            "client_login.html",
            {"request": request, "error": error if error else None, "return_url": return_url}
        )
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
                return RedirectResponse(f"/auth/login?error={error_msg}&return_url={return_url}", status_code=303)
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
                return RedirectResponse(f"/auth/login?error={error_msg}&return_url={return_url}", status_code=303)
            return templates.TemplateResponse(
                "client_login.html",
                {"request": request, "error": error_msg, "return_url": return_url},
                status_code=401
            )
        
        # Set session
        request.session["user_logged_in"] = True
        request.session["username"] = username
        request.session["org_id"] = user.org_id
        
        # Generate session token for external use
        session_token = str(uuid.uuid4())
        request.session["session_token"] = session_token
        
        if return_url:
            separator = "&" if "?" in return_url else "?"
            return RedirectResponse(f"{return_url}{separator}token={session_token}", status_code=303)
        
        # Default redirect to my-account
        return RedirectResponse("/my-account", status_code=303)
    except Exception as e:
        error_msg = f"Login failed: {str(e)}"
        if return_url:
            return RedirectResponse(f"/auth/login?error={error_msg}&return_url={return_url}", status_code=303)
        return templates.TemplateResponse(
            "client_login.html",
            {"request": request, "error": error_msg, "return_url": return_url},
            status_code=500
        )

@router.post("/logout")
def client_logout(request: Request):
    """Handle client logout."""
    request.session.clear()
    return RedirectResponse("/auth/login", status_code=303)
