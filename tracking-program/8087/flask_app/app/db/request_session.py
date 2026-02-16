"""
Request-scoped database session for Tracking Program.

Use get_session() to obtain the current request's database session.
When per-org mode is enabled and org_id is set, returns the org-scoped session.
Otherwise returns the default Flask-SQLAlchemy session.
"""
from flask import g

from app.extensions import db
from app.db.org_db import use_per_org_db


def get_session():
    """
    Get the database session for the current request.
    Returns org-scoped session when per-org DB is enabled and g.org_db_session is set.
    Otherwise returns the default Flask-SQLAlchemy session.
    """
    if use_per_org_db() and hasattr(g, "org_db_session") and g.org_db_session is not None:
        return g.org_db_session
    return db.session
