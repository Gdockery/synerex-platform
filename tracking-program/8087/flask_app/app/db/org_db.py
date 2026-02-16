"""
Per-org database support for Tracking Program - consistent with EMV.

When TRACKING_USE_PER_ORG_DB=True and using SQLite (no TRACKING_DB_URL),
each org gets its own database file: {TRACKING_RESULTS_DIR}/org_{org_id}/tracking.db

When using MySQL (TRACKING_DB_URL set), shared database is used for now.
MySQL per-org (database per tenant) can be added in a follow-up.
"""
import logging
import os
import threading
from contextlib import contextmanager
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

logger = logging.getLogger(__name__)

# Cache of engines per org_id (for SQLite per-org mode)
_engines = {}
_engines_lock = threading.Lock()

# Default org for backward compatibility (login before org is known)
DEFAULT_ORG_ID = "default"


def use_per_org_db():
    """True if per-org database mode is enabled (SQLite, no MySQL URL)."""
    try:
        from flask import current_app
        use = current_app.config.get("TRACKING_USE_PER_ORG_DB", False)
        uri = current_app.config.get("SQLALCHEMY_DATABASE_URI", "")
        has_mysql = "mysql" in uri or "pymysql" in uri
        return bool(use) and not has_mysql
    except Exception:
        return False


def _get_results_dir():
    """Path for per-org SQLite databases (like EMV results/)."""
    try:
        from flask import current_app
        base = current_app.config.get("TRACKING_RESULTS_DIR", "")
        if base:
            return base
        # Default: flask_app dir / ../tracking_data
        from app.config import Config
        _base = Path(__file__).resolve().parent.parent.parent
        return str(_base / "tracking_data")
    except Exception:
        return "tracking_data"


def _org_db_path(org_id):
    """SQLite path for org's database."""
    org_id = (org_id or DEFAULT_ORG_ID).strip() or DEFAULT_ORG_ID
    safe_org = "".join(c if c.isalnum() or c in "-_" else "_" for c in org_id)
    base = _get_results_dir()
    org_dir = os.path.join(base, f"org_{safe_org}")
    os.makedirs(org_dir, exist_ok=True)
    return os.path.join(org_dir, "tracking.db")


def _get_default_uri():
    """Default SQLAlchemy URI from app config."""
    try:
        from flask import current_app
        return current_app.config.get("SQLALCHEMY_DATABASE_URI", "sqlite:///:memory:")
    except Exception:
        return "sqlite:///:memory:"


def get_org_engine(org_id):
    """
    Get SQLAlchemy engine for org's database.
    When per-org mode: returns engine for org's SQLite file.
    Otherwise: returns the default app engine (shared DB).
    """
    if not use_per_org_db():
        from app.extensions import db
        return db.engine

    org_id = (org_id or DEFAULT_ORG_ID).strip() or DEFAULT_ORG_ID
    with _engines_lock:
        if org_id not in _engines:
            db_path = _org_db_path(org_id)
            uri = f"sqlite:///{db_path}"
            # SQLite: check_same_thread=False for Flask context; connect_args for FK
            _engines[org_id] = create_engine(
                uri,
                connect_args={"check_same_thread": False},
                poolclass=StaticPool,
                echo=False,
            )
            logger.debug("Created engine for org_id=%s at %s", org_id, db_path)
        return _engines[org_id]


def get_org_session(org_id) -> Session:
    """
    Create a new session bound to the org's engine.
    Caller must commit/rollback and close when done, or use as context manager.
    """
    engine = get_org_engine(org_id)
    SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    return SessionLocal()


@contextmanager
def org_session(org_id):
    """Context manager for org-scoped session."""
    s = get_org_session(org_id)
    try:
        yield s
        s.commit()
    except Exception:
        s.rollback()
        raise
    finally:
        s.close()


def ensure_org_tables(engine):
    """
    Create all tables in the given engine if they don't exist.
    Uses the same metadata as Flask-SQLAlchemy models.
    """
    from app.extensions import db
    from app import models  # noqa: F401 - ensure models registered
    db.Model.metadata.create_all(bind=engine)
    logger.info("Ensured tables in org database")


def ensure_org_db(org_id):
    """
    Ensure the org's database exists and has tables.
    Call on first access to an org.
    """
    if not use_per_org_db():
        return
    engine = get_org_engine(org_id)
    ensure_org_tables(engine)


def get_current_org_id():
    """
    Get org_id for the current request from session, headers, or form.
    Returns None if not determinable.
    """
    try:
        from flask import request, session
        # Session (set after login / SSO)
        org = session.get("orgId") or (session.get("user") or {}).get("orgId") or (session.get("user") or {}).get("org_id")
        if org:
            return str(org).strip() or None
        # Header (API clients)
        org = request.headers.get("X-Org-Id") or request.headers.get("x-org-id")
        if org:
            return str(org).strip() or None
        # Form/query (e.g. login form when per-org requires org before session)
        org = (request.form.get("org_id") or request.args.get("org") or "").strip()
        if org:
            return org
        return None
    except RuntimeError:
        return None  # No request context
