"""
Shared project-access helpers.

Single source of truth for "can the current user access this project?"
Import and use in every route file instead of copy-pasting the function.

Access rules:
  Role 8  (Synerex Admin)  — all projects
  Role 9/10 (OEM Admin/User) — projects whose client is owned by or
                                sponsored by their org  (sponsor_org_id)
  Everyone else             — only projects they are explicitly assigned
                              to via the project_user join table

For ECBS analytics routes that scope by org, use org_can_access_project().
"""
from flask_login import current_user
from sqlalchemy import text

from app.extensions import db
from app.models.project import project_user, Project
from app.models.user import User


def user_has_project_access(project_id) -> bool:
    """Return True if the currently logged-in user may access *project_id*."""
    if not current_user.is_authenticated:
        return False
    user = User.query.get(current_user.id)
    if not user:
        return False

    # Synerex Admin: unrestricted
    if user.role == 8:
        return True

    # OEM Admin / OEM User: access via org sponsorship — no per-project assignment needed
    if user.role in (9, 10):
        org_id = getattr(user, "org_id", None)
        if org_id:
            try:
                from app.models.client import Client
                p = Project.query.filter_by(id=project_id, isDeleted=False).first()
                if p and p.client:
                    cli = Client.query.filter_by(id=p.client, isDeleted=False).first()
                    if cli and (
                        getattr(cli, "org_id", None) == org_id
                        or getattr(cli, "sponsor_org_id", None) == org_id
                    ):
                        return True
            except Exception:
                pass
        return False

    # All other roles: must be explicitly assigned to the project
    row = db.session.query(project_user).filter(
        project_user.c.project_users == project_id,
        project_user.c.user_projects == user.id,
    ).first()
    return row is not None


def org_can_access_project(project_id: int, sess=None) -> bool:
    """
    Lighter check used by ECBS analytics routes: Synerex Admin sees all;
    everyone else must share the same org_id as the project.
    Pass *sess* to reuse an existing SQLAlchemy session, or leave None to
    use the default db.session.
    """
    role = getattr(current_user, "role", 0)
    if role == 8:
        return True
    org = getattr(current_user, "org_id", None)
    if not org:
        return False
    s = sess or db.session
    row = s.execute(
        text("SELECT id FROM project WHERE id=:pid AND org_id=:org AND isDeleted=0"),
        {"pid": project_id, "org": org},
    ).fetchone()
    return row is not None
