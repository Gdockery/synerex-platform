"""
ECBS OS Role Constants — Phase 1 Role Granularity.

Maps the existing integer role system (from userRoles.ts / phase6_routes.py)
to named ECBS OS spec roles, and adds the three missing spec roles.

Existing roles (from Angular userRoles.ts — do NOT renumber these):
  1  = Client User Level   (basic client user)
  2  = Client Admin Level  (client administrator; maps to Enterprise Admin in spec)
  3  = Client Manager Level
  4  = Client Finance Level
  7  = Account Manager     (field role; maps to Installer in spec)
  8  = Platform Admin      (Synerex Super Admin)
  9  = OEM Admin
  10 = OEM User
  11 = Installer (Legacy)
  12 = Executive

New ECBS OS spec roles (added, no conflicts):
  5  = Engineering         (Phase 1 addition)
  6  = Operations          (Phase 1 addition)
  13 = Read Only           (Phase 1 addition)

Usage
-----
    from app.helpers.roles import ROLE, role_name, require_roles
    from app.helpers.roles import ADMIN_ROLES, ENGINEERING_ROLES

    @app.route("/api/something")
    @login_required
    @require_roles(ADMIN_ROLES)
    def admin_only_route(): ...
"""
from __future__ import annotations

from functools import wraps
from flask import jsonify
from flask_login import current_user


# ── Role integer constants ────────────────────────────────────────────────────

class ROLE:
    CLIENT_USER      = 1    # Basic client user — read own project data
    CLIENT_ADMIN     = 2    # Client Administrator (≈ Enterprise Admin in spec)
    CLIENT_MANAGER   = 3    # Client Manager
    CLIENT_FINANCE   = 4    # Client Finance / billing access
    ENGINEERING      = 5    # Engineering staff — technical records, reviews  [NEW]
    OPERATIONS       = 6    # Operations staff — dashboards, deployments      [NEW]
    ACCOUNT_MANAGER  = 7    # Account Manager / field installer role
    SYNEREX_ADMIN    = 8    # Synerex Super Admin — full platform access
    OEM_ADMIN        = 9    # OEM partner admin — full access within their OEM tenant
    OEM_USER         = 10   # OEM partner user — limited to their OEM tenant
    INSTALLER        = 11   # Installer (legacy / duplicate of Account Manager)
    EXECUTIVE        = 12   # Executive — dashboards and reports only
    READ_ONLY        = 13   # Read Only — view data only, no writes            [NEW]


# ── Role name lookup (matches angular userRoles.ts displayNames) ──────────────

ROLE_NAMES: dict[int, str] = {
    ROLE.CLIENT_USER:     "Client User",
    ROLE.CLIENT_ADMIN:    "Client Admin",
    ROLE.CLIENT_MANAGER:  "Client Manager",
    ROLE.CLIENT_FINANCE:  "Client Finance",
    ROLE.ENGINEERING:     "Engineering",
    ROLE.OPERATIONS:      "Operations",
    ROLE.ACCOUNT_MANAGER: "Account Manager",
    ROLE.SYNEREX_ADMIN:   "Platform Admin",
    ROLE.OEM_ADMIN:       "OEM Admin",
    ROLE.OEM_USER:        "OEM User",
    ROLE.INSTALLER:       "Installer",
    ROLE.EXECUTIVE:       "Executive",
    ROLE.READ_ONLY:       "Read Only",
}


def role_name(role_int: int | None) -> str:
    """Return the human-readable name for a role integer."""
    if role_int is None:
        return "Unknown"
    return ROLE_NAMES.get(int(role_int), f"Role {role_int}")


# ── Role groupings ────────────────────────────────────────────────────────────

# Full platform admin — bypass all tenant/license checks
PLATFORM_ADMIN_ROLES = {ROLE.SYNEREX_ADMIN}

# OEM-level admin roles
OEM_ADMIN_ROLES = {ROLE.OEM_ADMIN, ROLE.OEM_USER}

# All admin-level roles (bypass most permission guards)
ADMIN_ROLES = PLATFORM_ADMIN_ROLES | OEM_ADMIN_ROLES | {ROLE.CLIENT_ADMIN}

# Roles that can CREATE and EDIT records
WRITE_ROLES = ADMIN_ROLES | {
    ROLE.CLIENT_MANAGER,
    ROLE.ENGINEERING,
    ROLE.OPERATIONS,
    ROLE.ACCOUNT_MANAGER,
    ROLE.INSTALLER,
}

# Engineering roles (can approve/reject engineering reviews, create baselines)
ENGINEERING_ROLES = {ROLE.ENGINEERING} | ADMIN_ROLES

# Field technician roles (deploy, commission devices)
FIELD_ROLES = {ROLE.ACCOUNT_MANAGER, ROLE.INSTALLER}

# Roles with deployment access
DEPLOYMENT_ROLES = FIELD_ROLES | {ROLE.ENGINEERING, ROLE.OPERATIONS} | ADMIN_ROLES

# Read-only roles (view data only)
VIEWER_ROLES = {ROLE.READ_ONLY, ROLE.EXECUTIVE, ROLE.CLIENT_USER, ROLE.CLIENT_FINANCE}

# All roles ordered for UI display
ALL_ROLES_ORDERED = [
    ROLE.SYNEREX_ADMIN,
    ROLE.OEM_ADMIN,
    ROLE.OEM_USER,
    ROLE.CLIENT_ADMIN,
    ROLE.CLIENT_MANAGER,
    ROLE.CLIENT_FINANCE,
    ROLE.ENGINEERING,
    ROLE.OPERATIONS,
    ROLE.ACCOUNT_MANAGER,
    ROLE.INSTALLER,
    ROLE.EXECUTIVE,
    ROLE.READ_ONLY,
    ROLE.CLIENT_USER,
]


# ── Route decorator ───────────────────────────────────────────────────────────

def require_roles(allowed_roles: set[int]):
    """
    Decorator: require current_user.role in allowed_roles.
    Must be used AFTER @login_required.

    Usage:
        @login_required
        @require_roles({ROLE.SYNEREX_ADMIN, ROLE.CLIENT_ADMIN})
        def admin_route(): ...
    """
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            user_role = getattr(current_user, "role", None)
            if user_role not in allowed_roles:
                return jsonify({"error": "Insufficient permissions", "code": "FORBIDDEN"}), 403
            return f(*args, **kwargs)
        return wrapper
    return decorator


def is_admin(user=None) -> bool:
    """Return True if user (or current_user) has admin-level role."""
    u = user or current_user
    return getattr(u, "role", None) in ADMIN_ROLES | PLATFORM_ADMIN_ROLES


def can_write(user=None) -> bool:
    """Return True if user can create/edit records."""
    u = user or current_user
    return getattr(u, "role", None) in WRITE_ROLES


def roles_for_api() -> list[dict]:
    """Return all roles as a list of {value, label} dicts for API responses / Angular dropdowns."""
    return [
        {"value": r, "label": ROLE_NAMES[r]}
        for r in ALL_ROLES_ORDERED
        if r in ROLE_NAMES
    ]
