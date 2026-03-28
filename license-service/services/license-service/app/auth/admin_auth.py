"""Admin authentication and role-based access for platform admins."""
from typing import Callable
from fastapi import Request, Depends, HTTPException
from sqlalchemy.orm import Session

from ..config import settings
from ..db import SessionLocal
from ..models.admin_user import AdminUser, PLATFORM_ROLES


def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _is_admin_logged_in(request: Request) -> bool:
    try:
        return bool(request.session.get("admin_logged_in", False))
    except (AttributeError, KeyError, RuntimeError):
        return False


def _get_admin_role(request: Request, db: Session) -> str:
    """Return admin role from session. Master admin from config = 'admin'."""
    role = request.session.get("admin_role")
    if role:
        return role
    username = request.session.get("admin_username")
    if not username:
        return ""
    if username == settings.admin_username:
        return "admin"
    admin_user = db.get(AdminUser, username)
    if admin_user and admin_user.is_active:
        return admin_user.role or "admin"
    return ""


def require_admin(request: Request, db: Session = Depends(db_session)):
    """Require any platform admin. Used for billing list, get, create, update, delete."""
    if not _is_admin_logged_in(request):
        raise HTTPException(401, "Not authenticated")
    role = _get_admin_role(request, db)
    if role not in PLATFORM_ROLES:
        raise HTTPException(403, "Admin role required")
    return {"username": request.session.get("admin_username"), "role": role}


def require_admin_role(*allowed_roles: str):
    """Dependency factory: require admin with one of allowed_roles."""
    def _check(request: Request, db: Session = Depends(db_session)):
        if not _is_admin_logged_in(request):
            raise HTTPException(401, "Not authenticated")
        role = _get_admin_role(request, db)
        if role not in allowed_roles:
            raise HTTPException(403, f"Requires one of: {allowed_roles}")
        return {"username": request.session.get("admin_username"), "role": role}
    return _check


def check_admin_or_customer_support_for_org(request: Request, db: Session, org_id: str) -> dict:
    """Verify admin or customer_support has access to org_id. Raises HTTPException if not."""
    if not _is_admin_logged_in(request):
        raise HTTPException(401, "Not authenticated")
    role = _get_admin_role(request, db)
    if role == "admin":
        return {"username": request.session.get("admin_username"), "role": role}
    if role == "customer_support":
        username = request.session.get("admin_username")
        if username == settings.admin_username:
            return {"username": username, "role": "admin"}
        admin_user = db.get(AdminUser, username)
        if admin_user and org_id in admin_user.get_support_org_ids():
            return {"username": username, "role": role}
        raise HTTPException(403, "Customer Support: not authorized for this organization")
    if role == "fraud_prevention":
        raise HTTPException(403, "Fraud Prevention cannot mark paid; use approve workflow")
    raise HTTPException(403, "Admin or Customer Support required")
