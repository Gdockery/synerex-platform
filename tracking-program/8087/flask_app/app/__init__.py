"""
Flask app factory for Tracking Program.
"""
import time

from flask import Flask

from app.config import Config
from app.extensions import db, login_manager, socketio
from app import models  # noqa: F401 - register models with SQLAlchemy
from app.api.auth_routes import auth_bp  # registers user_loader
from app.api.device_routes import device_bp
from app.api.phase6_routes import phase6_bp
from app.api.bill_routes import bill_bp
from app.api.phase7_routes import phase7_bp
from app.api.phase8_routes import phase8_bp
from app.api.phase9_routes import phase9_bp
from app.api.phase10_routes import phase10_bp
from app.api.phase11_routes import phase11_bp
from app.api.web_routes import web_bp
from app.api.emv_routes import emv_bp
from app.api.tariff_routes import tariff_bp
from app import socket_events  # noqa: F401 - register socket handlers


def create_app(config_class=Config):
    """Create and configure the Flask application."""
    import logging
    import os

    # Require LICENSE_SERVICE_URL in production for license enforcement
    if config_class.ENV == "production" and not config_class.LICENSE_SERVICE_URL:
        raise ValueError(
            "LICENSE_SERVICE_URL must be set in production. "
            "Tracking program requires license service (port 8000) for access control."
        )
    log_level = os.environ.get("LOG_LEVEL", "").upper()
    if log_level in ("DEBUG", "INFO", "WARNING", "ERROR"):
        logging.basicConfig(
            level=getattr(logging, log_level),
            format="%(asctime)s %(name)s %(levelname)s: %(message)s",
        )
        for name in ("app.api.auth_routes", "app.helpers.decorators", "app.services.org_registry"):
            logging.getLogger(name).setLevel(getattr(logging, log_level))

    app = Flask(__name__)
    app.url_map.strict_slashes = False
    app.config.from_object(config_class)

    # Flask-Session: Redis when REDIS_URL set, else filesystem
    if config_class.REDIS_URL:
        from flask_session import Session
        Session(app)

    # Initialize extensions (explicit import to avoid app.db package shadowing)
    from app.extensions import db as _db
    _db.init_app(app)
    login_manager.init_app(app)
    login_manager.login_view = "auth.show_login_page"
    login_manager.login_message = None

    @login_manager.unauthorized_handler
    def _redirect_to_login():
        from flask import redirect
        app_root = app.config.get("APPLICATION_ROOT", "") or ""
        return redirect(f"{app_root}/login" if app_root else "/login")

    # Flask-SocketIO with CORS - allow multiple origins for socket connections
    allowed_origins = [
        config_class.TRACKING_BASE_URL,
        "http://127.0.0.1:8087",
        "http://localhost:8087",
        "http://localhost:8080",
    ]
    allowed_origins = [o for o in allowed_origins if o]
    if not allowed_origins:
        allowed_origins = "*"
    socketio.init_app(
        app,
        cors_allowed_origins=allowed_origins,
        async_mode="eventlet",
        ping_timeout=620,
        ping_interval=300,
    )

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(bill_bp)
    app.register_blueprint(device_bp)
    app.register_blueprint(phase6_bp)
    app.register_blueprint(phase7_bp)
    app.register_blueprint(phase8_bp)
    app.register_blueprint(phase9_bp)
    app.register_blueprint(phase10_bp)
    app.register_blueprint(phase11_bp)
    app.register_blueprint(web_bp)
    app.register_blueprint(emv_bp)
    app.register_blueprint(tariff_bp)
    # Register admin blueprint after db init to avoid import-order issues
    from app.api.admin_routes import admin_bp
    app.register_blueprint(admin_bp)

    @app.route("/health")
    def health():
        return {"status": "healthy"}, 200

    @app.before_request
    def _log_api_client_post():
        """Log POST /api/client for debugging create-client flow."""
        from flask import request
        if request.method == "POST" and request.path == "/api/client":
            import sys
            print("[create-client] POST /api/client received", flush=True)
            sys.stdout.flush()

    @app.before_request
    def _setup_org_db_session():
        """Set up org-scoped database session when per-org mode is enabled (consistent with EMV)."""
        from app.db.org_db import (
            get_current_org_id,
            use_per_org_db,
            get_org_session,
            ensure_org_db,
            DEFAULT_ORG_ID,
        )

        if not use_per_org_db():
            return

        org_id = get_current_org_id() or DEFAULT_ORG_ID
        ensure_org_db(org_id)
        session = get_org_session(org_id)
        from flask import g
        g.org_id = org_id
        g.org_db_session = session

    @app.teardown_request
    def _teardown_org_db_session(exc=None):
        """Close org-scoped session after request."""
        from flask import g
        if hasattr(g, "org_db_session") and g.org_db_session is not None:
            try:
                if exc:
                    g.org_db_session.rollback()
                else:
                    g.org_db_session.commit()
            except Exception:
                g.org_db_session.rollback()
            finally:
                g.org_db_session.close()
                g.org_db_session = None

    @app.errorhandler(500)
    def handle_500(e):
        """Log 500 errors with full traceback for debugging."""
        import traceback
        import sys
        app.logger.error("500 Internal Server Error: %s", e)
        tb_str = "".join(traceback.format_exception(type(e), e, e.__traceback__)) if e else traceback.format_exc()
        print(tb_str, flush=True)
        sys.stdout.flush()
        from flask import render_template_string
        return render_template_string("<h1>500 Internal Server Error</h1><pre>{{ tb }}</pre>", tb=tb_str), 500

    @app.before_request
    def update_last_active_at():
        """Update user.lastActiveAt on each authenticated request (matches Sails user hook)."""
        from flask_login import current_user
        from app.db.request_session import get_session

        if current_user.is_authenticated:
            sess = get_session()
            try:
                from app.models.user import User
                sess.query(User).filter_by(id=current_user.id).update(
                    {"lastActiveAt": int(time.time() * 1000)}
                )
                sess.commit()
            except Exception:
                sess.rollback()

    @app.cli.command("user-logo-migrate")
    def user_logo_migrate():
        """Add userLogo column to user table if missing (MySQL only)."""
        from app.db_migrations import add_user_logo_column
        add_user_logo_column()

    @app.cli.command("client-org-id-migrate")
    def client_org_id_migrate():
        """Add org_id column to client table if missing."""
        from app.db_migrations import add_client_org_id_column
        add_client_org_id_column()

    @app.cli.command("project-org-id-migrate")
    def project_org_id_migrate():
        """Add org_id column to project table if missing."""
        from app.db_migrations import add_project_org_id_column
        add_project_org_id_column()

    @app.cli.command("client-org-id-backfill")
    def client_org_id_backfill():
        """Backfill org_id for clients with NULL org_id via License ensure_org."""
        from app.db_migrations import backfill_client_org_id
        updated, errors, skipped = backfill_client_org_id()
        print(f"Done: {updated} updated, {errors} errors, {skipped} skipped.")

    @app.cli.command("project-org-id-backfill")
    def project_org_id_backfill():
        """Backfill org_id for projects from their client's org_id."""
        from app.db_migrations import backfill_project_org_id
        updated = backfill_project_org_id()
        print(f"Done: {updated} project(s) updated.")

    @app.cli.command("assign-admin-to-orphan-projects")
    def assign_admin_to_orphan_projects_cmd():
        """Assign Synerex admin (role 8) to projects with no users assigned."""
        from app.db_migrations import assign_admin_to_orphan_projects
        count, _ = assign_admin_to_orphan_projects()
        print(f"Done: {count} project(s) assigned to admin.")

    @app.cli.command("assign-all-admins-to-all-projects")
    def assign_all_admins_to_all_projects_cmd():
        """Ensure every admin (role 8) is assigned to every project."""
        from app.db_migrations import assign_all_admins_to_all_projects
        count = assign_all_admins_to_all_projects()
        print(f"Done: {count} new assignment(s).")

    @app.cli.command("emv-analysis-migrate")
    def emv_analysis_migrate():
        """Create emv_analysis table and add active_emv_analysis_id to project. Run: flask emv-analysis-migrate"""
        from app.db_migrations import add_emv_analysis_table, add_active_emv_analysis_to_project
        add_emv_analysis_table()
        add_active_emv_analysis_to_project()

    @app.cli.command("backfill-document-token")
    def backfill_document_token():
        """Backfill documentShareToken for projects with NULL. Run: flask backfill-document-token"""
        from app.db_migrations import backfill_project_document_share_token
        backfill_project_document_share_token()

    @app.cli.command("harmonic-columns-migrate")
    def harmonic_columns_migrate():
        """Add 60 individual harmonic columns (l1AmpH3-l3VoltH21) to meterdata table. Run: flask harmonic-columns-migrate"""
        from app.db_migrations import add_harmonic_columns, add_emv_harmonic_baseline_column
        r1 = add_harmonic_columns()
        r2 = add_emv_harmonic_baseline_column()
        print(f"harmonic-columns-migrate: meterdata={r1}, emv_baseline={r2}")

    @app.cli.command("schema-sync")
    def schema_sync():
        """Add all columns present in models but missing from MySQL. Safe to re-run. Run: flask schema-sync"""
        from app.db_migrations import add_missing_model_columns
        results = add_missing_model_columns()
        added = [k for k, v in results.items() if v == "added"]
        errors = [k for k, v in results.items() if "error" in str(v)]
        print(f"schema-sync: {len(added)} added, {len(errors)} errors")

    @app.cli.command("org-db-init")
    def org_db_init():
        """Bootstrap default org database (when TRACKING_USE_PER_ORG_DB). Run: flask org-db-init"""
        from app.db.org_db import ensure_org_db, use_per_org_db, DEFAULT_ORG_ID
        if not use_per_org_db():
            print("TRACKING_USE_PER_ORG_DB is not enabled. Set env TRACKING_USE_PER_ORG_DB=true")
            return
        ensure_org_db(DEFAULT_ORG_ID)
        print(f"Initialized database for org_id={DEFAULT_ORG_ID}")

    return app
