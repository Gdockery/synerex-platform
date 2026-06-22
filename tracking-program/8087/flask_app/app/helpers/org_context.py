"""
Org context helpers — single source of truth for resolving org_id, org_type,
and sponsor_org_id for the current request.

Usage:
    from app.helpers.org_context import get_org_context, is_customer_user, scope_projects_query

These supplement the per-route ad-hoc session lookups that previously existed
across emv_routes, license_routes, etc.  Routes should call get_org_context()
instead of reading session keys directly.
"""
from flask import g, session
from flask_login import current_user


def get_org_context():
    """
    Return (org_id, org_type, sponsor_org_id) for the current request.

    Resolution order:
      1. Flask g (set by _setup_org_db_session before_request if per-org DB is enabled)
      2. Session keys set at login / SSO time
      3. Attributes on current_user (JIT-provisioned users)
    """
    org_id = (
        getattr(g, "org_id", None)
        or session.get("orgId")
        or (session.get("user") or {}).get("orgId")
        or getattr(current_user, "org_id", None)
    )
    org_type = getattr(g, "org_type", None) or session.get("orgType")
    sponsor_org_id = getattr(g, "sponsor_org_id", None) or session.get("sponsorOrgId")

    # Derive org_type from role when not present in session (e.g. old sessions)
    if not org_type and current_user.is_authenticated:
        role = getattr(current_user, "role", 0)
        if role == 8:
            org_type = "admin"
        elif role in (9, 10):
            org_type = "oem"
        else:
            org_type = "customer"

    return org_id, org_type, sponsor_org_id


def is_oem_or_admin():
    """Return True if the current user is an OEM or Synerex Admin (not a client user)."""
    if not current_user.is_authenticated:
        return False
    role = getattr(current_user, "role", 0)
    if role in (8, 9, 10):
        return True
    _, org_type, _ = get_org_context()
    return org_type in ("oem", "admin")


def is_customer_user():
    """
    Return True if the current user is a client/customer user.
    Client users should not access EM&V Program endpoints.
    """
    if not current_user.is_authenticated:
        return False
    role = getattr(current_user, "role", 0)
    if role in (8, 9, 10):
        return False
    _, org_type, _ = get_org_context()
    return org_type == "customer" or role in (1, 2)


def scope_projects_query(q, sess):
    """
    Apply org-based scoping to a SQLAlchemy project query.

    - Synerex Admin (role 8): unrestricted.
    - OEM Admin/User (role 9/10 or org_type='oem'): see only projects whose client
      has sponsor_org_id == their org_id.
    - Customer (role 1/2 or org_type='customer'): see only projects explicitly
      assigned to them via project_user join table (or whose project.org_id matches).

    Returns the filtered query.
    """
    from app.models.project import Project, project_user
    from app.models.client import Client

    role = getattr(current_user, "role", 0)
    org_id, org_type, sponsor_org_id = get_org_context()

    if role == 8:
        return q  # Synerex Admin — unrestricted

    if role in (9, 10) or org_type == "oem":
        oem_org = org_id  # OEM's own org_id
        client_ids = [
            c.id for c in
            sess.query(Client).filter(
                Client.sponsor_org_id == oem_org,
                Client.isDeleted == False,
            ).all()
        ]
        if not client_ids:
            return q.filter(Project.id == -1)  # OEM with no clients — return nothing
        return q.filter(Project.client.in_(client_ids), Project.isDeleted == False)

    # Customer: must be explicitly assigned (project_user join) or project.org_id match
    if org_id:
        assigned_ids = [
            r[0] for r in
            sess.query(project_user.c.project_users).filter(
                project_user.c.user_projects == current_user.id
            ).all()
        ]
        return q.filter(
            Project.isDeleted == False,
        ).filter(
            (Project.id.in_(assigned_ids)) | (Project.org_id == org_id)
        )

    # No org_id at all — fall back to explicit project_user assignment only
    assigned_ids = [
        r[0] for r in
        sess.query(project_user.c.project_users).filter(
            project_user.c.user_projects == current_user.id
        ).all()
    ]
    return q.filter(Project.id.in_(assigned_ids), Project.isDeleted == False)
