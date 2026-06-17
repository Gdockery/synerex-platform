"""
Flask app factory for Tracking Program.
"""
import time

import click
from flask import Flask

from app.config import Config
from app.extensions import db, login_manager, socketio
from app import models  # noqa: F401 - register models with SQLAlchemy
from app.api.auth_routes import auth_bp  # registers user_loader
from app.api.device_routes import device_bp
from app.api.phase6_routes import phase6_bp
from app.api.bill_routes import bill_bp
from app.api.sld_routes import sld_bp
from app.api.gpu_routes import gpu_bp
from app.api.proposal_routes import proposal_bp
from app.api.report_routes import report_bp
from app.api.phase7_routes import phase7_bp
from app.api.phase8_routes import phase8_bp
from app.api.phase9_routes import phase9_bp
from app.api.phase10_routes import phase10_bp
from app.api.phase11_routes import phase11_bp
from app.api.web_routes import web_bp
from app.api.emv_routes import emv_bp
from app.api.tariff_routes import tariff_bp
from app.api.internal_routes import internal_bp
from app.api.pipeline_routes import pipeline_bp
# Phase 1
from app.api.oem_routes import oem_bp
from app.api.mfa_routes import mfa_bp
from app.api.oauth_routes import oauth_bp
from app.api.license_routes import license_bp
from app.api.audit_routes import audit_bp
# Phase 2
from app.api.site_routes import site_bp
from app.api.asset_routes import asset_bp
from app.api.digital_twin_routes import dt_bp
# Phase 3
from app.api.device_registry_routes import device_reg_bp
# Phase 4
from app.api.deployment_routes import deployment_bp
# Phase 5
from app.api.pq_data_routes import pq_data_bp
# Phase 6
from app.api.baseline_routes import baseline_bp
# Phase 7
from app.api.current_balance_routes import current_balance_bp
# Phase 8
from app.api.capacity_routes import capacity_bp
# Phase 9
from app.api.savings_routes import savings_bp
# Phase 10
from app.api.utility_routes import utility_bp
# Phase 11
from app.api.alarm_routes import alarm_bp
# Phase 12
from app.api.report_catalog_routes import report_catalog_bp
# Phase 13
from app.api.commercial_routes import commercial_bp
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
    app.register_blueprint(sld_bp)
    app.register_blueprint(gpu_bp)
    app.register_blueprint(proposal_bp)
    app.register_blueprint(report_bp)
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
    app.register_blueprint(internal_bp)
    app.register_blueprint(pipeline_bp)
    # Register admin blueprint after db init to avoid import-order issues
    from app.api.admin_routes import admin_bp
    app.register_blueprint(admin_bp)
    # Phase 1 blueprints
    app.register_blueprint(oem_bp)
    app.register_blueprint(mfa_bp)
    app.register_blueprint(oauth_bp)
    app.register_blueprint(license_bp)
    app.register_blueprint(audit_bp)
    # Phase 2 blueprints
    app.register_blueprint(site_bp)
    app.register_blueprint(asset_bp)
    app.register_blueprint(dt_bp)
    # Phase 3 blueprints
    app.register_blueprint(device_reg_bp)
    # Phase 4 blueprints
    app.register_blueprint(deployment_bp)
    # Phase 5 blueprints
    app.register_blueprint(pq_data_bp)
    # Phase 6 blueprints
    app.register_blueprint(baseline_bp)
    # Phase 7 blueprints
    app.register_blueprint(current_balance_bp)
    # Phase 8 blueprints
    app.register_blueprint(capacity_bp)
    # Phase 9 blueprints
    app.register_blueprint(savings_bp)
    # Phase 10 blueprints
    app.register_blueprint(utility_bp)
    # Phase 11 blueprints
    app.register_blueprint(alarm_bp)
    # Phase 12 blueprints
    app.register_blueprint(report_catalog_bp)
    # Phase 13 blueprints
    app.register_blueprint(commercial_bp)

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
        """Log 500 errors server-side only; return a generic message to the client."""
        import traceback
        import sys
        tb_str = "".join(traceback.format_exception(type(e), e, e.__traceback__)) if e else traceback.format_exc()
        app.logger.error("500 Internal Server Error: %s\n%s", e, tb_str)
        print(tb_str, flush=True)
        sys.stdout.flush()
        from flask import jsonify, request as _req
        try:
            wants_json = (_req.accept_mimetypes.accept_json and
                          not _req.accept_mimetypes.accept_html)
        except Exception:
            wants_json = False
        if wants_json:
            return jsonify({"error": "Internal server error"}), 500
        return "<h1>500 Internal Server Error</h1><p>An unexpected error occurred. Please try again.</p>", 500

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

    @app.cli.command("phase5b-migrate")
    def phase5b_migrate():
        """Phase 5b — add l1THDv/l2THDv/l3THDv/totalTHDv columns to meterdata. Run: flask phase5b-migrate"""
        from app.db_migrations import phase5b_add_thdv_columns
        result = phase5b_add_thdv_columns()
        print(f"phase5b-migrate: {result}")

    @app.cli.command("phase7-migrate")
    def phase7_migrate():
        """Phase 7 — create current_balance_metrics table. Run: flask phase7-migrate"""
        from app.db_migrations import phase7_create_tables
        result = phase7_create_tables()
        print(f"phase7-migrate: {result}")

    @app.cli.command("phase10-migrate")
    def phase10_migrate():
        """Phase 10 — add transformer_kva/capacity_utilization_pct to current_balance_metrics. Run: flask phase10-migrate"""
        from app.db_migrations import phase10_add_dt_context_columns
        result = phase10_add_dt_context_columns()
        print(f"phase10-migrate: {result}")

    @app.cli.command("phase8-migrate")
    def phase8_migrate():
        """Phase 8 — create capacity_intelligence table. Run: flask phase8-migrate"""
        from app.db_migrations import phase8_create_capacity_intelligence_table
        result = phase8_create_capacity_intelligence_table()
        print(f"phase8-migrate: {result}")

    @app.cli.command("phase9-migrate")
    def phase9_migrate():
        """Phase 9 — create savings_intelligence table. Run: flask phase9-migrate"""
        from app.db_migrations import phase9_create_savings_intelligence_table
        result = phase9_create_savings_intelligence_table()
        print(f"phase9-migrate: {result}")

    @app.cli.command("phase10u-migrate")
    def phase10u_migrate():
        """Phase 10 — create utility_accounts, utility_bills, utility_forecasts tables. Run: flask phase10u-migrate"""
        from app.db_migrations import phase10_create_utility_tables
        result = phase10_create_utility_tables()
        print(f"phase10u-migrate: {result}")

    @app.cli.command("phase11-migrate")
    def phase11_migrate():
        """Phase 11 — create alarms, alarm_assignments, events, notifications, alert_rules tables. Run: flask phase11-migrate"""
        from app.db_migrations import phase11_create_alarm_tables
        result = phase11_create_alarm_tables()
        print(f"phase11-migrate: {result}")

    @app.cli.command("phase12-migrate")
    def phase12_migrate():
        """Phase 12 — create ecbs_reports, report_schedules, report_exports tables. Run: flask phase12-migrate"""
        from app.db_migrations import phase12_create_report_tables
        result = phase12_create_report_tables()
        print(f"phase12-migrate: {result}")

    @app.cli.command("phase13-migrate")
    def phase13_migrate():
        """Phase 13 — create royalties table + add royalty_rate to oem. Run: flask phase13-migrate"""
        from app.db_migrations import phase13_create_royalty_table
        result = phase13_create_royalty_table()
        print(f"phase13-migrate: {result}")

    @app.cli.command("backfill-analytics")
    @click.option("--project-id", default=13, type=int, show_default=True, help="Project ID to backfill")
    @click.option("--days", default=0, type=int, show_default=True, help="Limit to last N days (0=all history)")
    @click.option("--batch-size", default=20160, type=int, show_default=True, help="Meterdata rows per CBI batch")
    def backfill_analytics(project_id, days, batch_size):
        """
        Backfill CBI → Capacity → Savings analytics for a project.

        Processes all historical meterdata (or last N days) and upserts results
        into current_balance_metrics, capacity_intelligence, savings_intelligence.

        Run: flask backfill-analytics --project-id 13
        """
        import time as _t
        from app.extensions import db as _db
        from app.models.meter import Meter
        from app.models.meter_data import MeterData
        from app.models.current_balance_metrics import CurrentBalanceMetrics
        from app.models.capacity_intelligence import CapacityIntelligence
        from app.models.savings_intelligence import SavingsIntelligence
        from app.services.current_balance_engine import compute_buckets
        from app.services.capacity_intelligence_engine import compute_capacity_from_cbi_metrics
        from app.services.savings_intelligence_engine import compute_savings_for_project

        now_ms = int(_t.time() * 1000)
        since_ms = (now_ms - days * 86_400_000) if days > 0 else 0

        meter_ids = [m.id for m in Meter.query.filter_by(project=project_id, isDeleted=False).all()]
        if not meter_ids:
            print(f"[backfill] No meters found for project {project_id}")
            return

        print(f"[backfill] project={project_id} meters={meter_ids} since_ms={since_ms or 'all'}")

        # ── Step 1: CBI backfill ──────────────────────────────────────────────
        total_rows = (MeterData.query
                      .filter(MeterData.meter.in_(meter_ids))
                      .filter(MeterData.recordedAt >= since_ms)
                      .count())
        print(f"[backfill] CBI: {total_rows} meterdata rows to process in batches of {batch_size}")

        offset = 0
        cbi_upserted = 0
        while offset < total_rows:
            batch = (MeterData.query
                     .filter(MeterData.meter.in_(meter_ids))
                     .filter(MeterData.recordedAt >= since_ms)
                     .order_by(MeterData.recordedAt.asc())
                     .offset(offset)
                     .limit(batch_size)
                     .all())
            if not batch:
                break

            for meter_id_val in meter_ids:
                meter_batch = [r for r in batch if r.meter == meter_id_val]
                if not meter_batch:
                    continue
                buckets = compute_buckets(meter_batch, project_id, meter_id=meter_id_val)
                for b in buckets:
                    existing = CurrentBalanceMetrics.query.filter_by(
                        project_id=b["project_id"],
                        meter_id=b.get("meter_id"),
                        bucket_ts=b["bucket_ts"],
                    ).first()
                    if existing:
                        for k, v in b.items():
                            if hasattr(existing, k) and k not in ("project_id", "meter_id", "bucket_ts"):
                                setattr(existing, k, v)
                        existing.updatedAt = now_ms
                    else:
                        _db.session.add(CurrentBalanceMetrics(
                            createdAt=now_ms, updatedAt=now_ms,
                            **{k: v for k, v in b.items() if hasattr(CurrentBalanceMetrics, k)},
                        ))
                    cbi_upserted += 1

            _db.session.commit()
            offset += batch_size
            print(f"[backfill] CBI: offset={offset}/{total_rows} upserted={cbi_upserted}")

        print(f"[backfill] CBI done — {cbi_upserted} buckets upserted")

        # ── Step 2: Capacity Intelligence backfill ────────────────────────────
        print("[backfill] Computing Capacity Intelligence...")
        ci_buckets = compute_capacity_from_cbi_metrics(project_id, from_ts=since_ms, to_ts=now_ms)
        ci_upserted = 0
        for b in (ci_buckets or []):
            existing = CapacityIntelligence.query.filter_by(
                project_id=b["project_id"],
                site_id=b.get("site_id"),
                bucket_ts=b["bucket_ts"],
            ).first()
            if existing:
                for k, v in b.items():
                    if hasattr(existing, k) and k not in ("project_id", "site_id", "bucket_ts"):
                        setattr(existing, k, v)
                existing.updatedAt = now_ms
            else:
                _db.session.add(CapacityIntelligence(
                    createdAt=now_ms, updatedAt=now_ms,
                    **{k: v for k, v in b.items() if hasattr(CapacityIntelligence, k)},
                ))
            ci_upserted += 1
        _db.session.commit()
        print(f"[backfill] CI done — {ci_upserted} buckets upserted")

        # ── Step 3: Savings Intelligence backfill ─────────────────────────────
        print("[backfill] Computing Savings Intelligence...")
        si_buckets = compute_savings_for_project(project_id, from_ts=since_ms, to_ts=now_ms)
        si_upserted = 0
        for b in (si_buckets or []):
            existing = SavingsIntelligence.query.filter_by(
                project_id=b["project_id"],
                site_id=b.get("site_id"),
                bucket_ts=b["bucket_ts"],
            ).first()
            if existing:
                for k, v in b.items():
                    if hasattr(existing, k) and k not in ("project_id", "site_id", "bucket_ts"):
                        setattr(existing, k, v)
                existing.updatedAt = now_ms
            else:
                _db.session.add(SavingsIntelligence(
                    createdAt=now_ms, updatedAt=now_ms,
                    **{k: v for k, v in b.items() if hasattr(SavingsIntelligence, k)},
                ))
            si_upserted += 1
        _db.session.commit()
        print(f"[backfill] SI done — {si_upserted} buckets upserted")

        print(f"\n[backfill] COMPLETE — CBI:{cbi_upserted}  CI:{ci_upserted}  SI:{si_upserted}")

    @app.cli.command("phase6-migrate")
    def phase6_migrate():
        """Phase 6 — create baseline_master table + add active_baseline_id to project. Run: flask phase6-migrate"""
        from app.db_migrations import phase6_create_tables
        result = phase6_create_tables()
        print(f"phase6-migrate: {result}")

    @app.cli.command("phase5-migrate")
    def phase5_migrate():
        """Phase 5 — add frequency + site_id columns to meterdata. Run: flask phase5-migrate"""
        from app.db_migrations import phase5_add_columns
        results = phase5_add_columns()
        print(f"phase5-migrate: {results}")

    @app.cli.command("phase4-migrate")
    def phase4_migrate():
        """Phase 4 — create deployment, deployment_device, site_discovery, engineering_review, site_activation tables. Run: flask phase4-migrate"""
        from app.db_migrations import phase4_create_tables
        tables = phase4_create_tables()
        print(f"phase4-migrate: tables={tables}")

    @app.cli.command("phase3-migrate")
    def phase3_migrate():
        """Phase 3 — create device_registry + commissioning_test tables. Run: flask phase3-migrate"""
        from app.db_migrations import phase3_create_tables
        tables = phase3_create_tables()
        print(f"phase3-migrate: tables={tables}")

    @app.cli.command("phase2-migrate")
    def phase2_migrate():
        """Phase 2 — create site, asset, asset_relationship, digital_twin, digital_twin_version tables. Run: flask phase2-migrate"""
        from app.db_migrations import phase2_create_tables
        tables = phase2_create_tables()
        print(f"phase2-migrate: tables={tables}")

    @app.cli.command("phase1-migrate")
    def phase1_migrate():
        """Phase 1 — create new tables + add user columns. Run: flask phase1-migrate"""
        from app.db_migrations import phase1_create_tables, phase1_add_user_columns
        tables = phase1_create_tables()
        cols   = phase1_add_user_columns()
        print(f"phase1-migrate: tables={tables} cols={cols}")

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
