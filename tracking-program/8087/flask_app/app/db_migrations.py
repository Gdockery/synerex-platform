"""
Database migrations for the Tracking Program.
Run via: flask user-logo-migrate
Or: python scripts/add_user_logo_column.py
"""
import secrets

from sqlalchemy import or_, text

from app.extensions import db
from app.models.client import Client
from app.models.project import Project


def add_user_logo_column():
    """Add userLogo column to user table if missing. Returns 'ok'|'skipped'|'error'. Requires app_context."""
    from flask import current_app
    uri = current_app.config.get("SQLALCHEMY_DATABASE_URI", "")
    if "sqlite" in uri or ":memory:" in uri:
        print("Skipping: using sqlite. Run with MySQL (TRACKING_DB_URL) to add userLogo.")
        return "skipped"
    sql = "ALTER TABLE `user` ADD COLUMN `userLogo` TINYINT(1) DEFAULT 0"
    try:
        db.session.execute(text(sql))
        db.session.commit()
        print("Added userLogo column to user table.")
        return "ok"
    except Exception as e:
        if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
            print("userLogo column already exists.")
            return "ok"
        print(f"Error: {e}")
        return "error"


def add_client_taxid_column():
    """Add taxId column or rename paymentTerms to taxId (per database_changes)."""
    from flask import current_app
    uri = current_app.config.get("SQLALCHEMY_DATABASE_URI", "")
    if ":memory:" in uri:
        return "skipped"
    try:
        db.session.execute(text("ALTER TABLE client CHANGE paymentTerms taxId VARCHAR(255)"))
        db.session.commit()
        print("Renamed paymentTerms to taxId in client table.")
        return "ok"
    except Exception as e:
        err = str(e).lower()
        if "duplicate column" in err or "unknown column 'paymentterms'" in err:
            try:
                db.session.execute(text("ALTER TABLE client ADD COLUMN taxId VARCHAR(255) NULL"))
                db.session.commit()
                print("Added taxId column to client table.")
                return "ok"
            except Exception as e2:
                if "duplicate" in str(e2).lower():
                    return "ok"
        if "duplicate column" in err or "already exists" in err:
            return "ok"
        print(f"add_client_taxid: {e}")
        return "error"


def add_client_created_by_column():
    """Add createdBy column to client table if missing. xecobase.sql lacks it."""
    from flask import current_app
    uri = current_app.config.get("SQLALCHEMY_DATABASE_URI", "")
    if ":memory:" in uri or "sqlite" in uri:
        return "skipped"
    sql = "ALTER TABLE client ADD COLUMN createdBy INT NULL"
    try:
        db.session.execute(text(sql))
        db.session.commit()
        print("Added createdBy column to client table.")
        return "ok"
    except Exception as e:
        err = str(e).lower()
        if "duplicate column" in err or "already exists" in err:
            print("client.createdBy column already exists.")
            return "ok"
        print(f"Error: {e}")
        return "error"


def add_client_org_id_column():
    """Add org_id column to client table if missing. Links to License service org registry."""
    from flask import current_app
    uri = current_app.config.get("SQLALCHEMY_DATABASE_URI", "")
    if ":memory:" in uri:
        print("Skipping: using sqlite :memory:. Use a file DB or MySQL to add client.org_id.")
        return "skipped"
    # MySQL uses backticks; SQLite accepts them. Both support ADD COLUMN.
    sql = "ALTER TABLE client ADD COLUMN org_id VARCHAR(255) NULL"
    try:
        db.session.execute(text(sql))
        db.session.commit()
        print("Added org_id column to client table.")
        return "ok"
    except Exception as e:
        err = str(e).lower()
        if "duplicate column" in err or "already exists" in err:
            print("client.org_id column already exists.")
            return "ok"
        print(f"Error: {e}")
        return "error"


def add_client_sponsor_org_id_column():
    """Add sponsor_org_id column to client table if missing. OEM org_id when client created by OEM."""
    from flask import current_app
    uri = current_app.config.get("SQLALCHEMY_DATABASE_URI", "")
    if ":memory:" in uri:
        print("Skipping: using sqlite :memory:. Use a file DB or MySQL to add client.sponsor_org_id.")
        return "skipped"
    sql = "ALTER TABLE client ADD COLUMN sponsor_org_id VARCHAR(255) NULL"
    try:
        db.session.execute(text(sql))
        db.session.commit()
        print("Added sponsor_org_id column to client table.")
        return "ok"
    except Exception as e:
        err = str(e).lower()
        if "duplicate column" in err or "already exists" in err:
            print("client.sponsor_org_id column already exists.")
            return "ok"
        print(f"Error: {e}")
        return "error"


def _add_column_if_missing(table, col, col_def):
    """Add column to table if missing. Returns True if added or exists."""
    try:
        db.session.execute(text(f"ALTER TABLE `{table}` ADD COLUMN `{col}` {col_def}"))
        db.session.commit()
        print(f"Added {table}.{col}")
        return True
    except Exception as e:
        if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
            return True
        db.session.rollback()
        print(f"add_column {table}.{col}: {e}")
        return False


def add_project_slug_column():
    """
    Add slug column to project table if missing. Required by Flask model.
    xecobase.sql dump has older schema without slug. Backfill with project-{id}.
    """
    from flask import current_app
    uri = current_app.config.get("SQLALCHEMY_DATABASE_URI", "")
    if ":memory:" in uri or "sqlite" in uri:
        return "skipped"
    try:
        db.session.execute(text("ALTER TABLE project ADD COLUMN slug VARCHAR(255) NULL"))
        db.session.commit()
        print("Added slug column to project table.")
    except Exception as e:
        if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
            print("project.slug column already exists.")
            return "ok"
        db.session.rollback()
        print(f"add_project_slug: {e}")
        return "error"
    try:
        db.session.execute(text(
            "UPDATE project SET slug = CONCAT('project-', id) WHERE slug IS NULL"
        ))
        db.session.commit()
        db.session.execute(text(
            "ALTER TABLE project MODIFY slug VARCHAR(255) NOT NULL DEFAULT 'project'"
        ))
        db.session.commit()
        return "ok"
    except Exception as e:
        print(f"add_project_slug backfill: {e}")
        return "error"


def backfill_project_document_share_token():
    """Backfill documentShareToken for projects that have NULL or empty. Required for PDF generation."""
    from flask import current_app
    uri = current_app.config.get("SQLALCHEMY_DATABASE_URI", "")
    if ":memory:" in uri:
        return "skipped"
    try:
        projects = Project.query.filter(
            or_(
                Project.documentShareToken.is_(None),
                Project.documentShareToken == "",
            ),
            Project.isDeleted == False,
        ).all()
        for p in projects:
            p.documentShareToken = secrets.token_urlsafe(32)
        if projects:
            db.session.commit()
            print(f"Backfilled documentShareToken for {len(projects)} project(s).")
        return "ok"
    except Exception as e:
        db.session.rollback()
        print(f"backfill_project_document_share_token: {e}")
        return "error"


def add_project_xecobase_columns():
    """
    Add all project columns expected by Flask model but missing from xecobase.sql dump.
    Run after add_project_slug_column. Idempotent.
    """
    from flask import current_app
    uri = current_app.config.get("SQLALCHEMY_DATABASE_URI", "")
    if ":memory:" in uri or "sqlite" in uri:
        return "skipped"
    cols = [
        ("carbonCreditRate", "DOUBLE NULL"),
        ("currencyCode", "VARCHAR(255) NULL DEFAULT 'USD'"),
        ("currencyExchangeRate", "DOUBLE NULL"),
        ("subNeeded", "TINYINT(1) NULL DEFAULT 0"),
        ("subStartDate", "VARCHAR(255) NULL"),
        ("slackChannel", "INT NULL"),
        ("lastKwh", "DOUBLE NULL DEFAULT 0"),
        ("totalAmpLoad", "DOUBLE NULL DEFAULT 0"),
        ("lastTotalPf", "DOUBLE NULL DEFAULT 100"),
        ("initialPf", "DOUBLE NULL DEFAULT 100"),
        ("ILRatio", "DOUBLE NULL DEFAULT 100"),
        ("gwControl", "TINYINT(1) NULL DEFAULT 0"),
        ("kwRate", "DOUBLE NULL DEFAULT 0"),
        ("kwhRate", "DOUBLE NULL DEFAULT 0"),
        ("taxRate", "DOUBLE NULL DEFAULT 0"),
        ("lowAmpsThreshold", "DOUBLE NULL"),
        ("highAmpsThreshold", "DOUBLE NULL"),
        ("lastThresholdSwitchState", "VARCHAR(255) NULL"),
        ("reportFields", "JSON NULL"),
        ("multiplier", "DOUBLE NULL DEFAULT 1"),
        ("peakMultiplier", "DOUBLE NULL DEFAULT 1"),
        ("lastBudget", "JSON NULL"),
    ]
    for col, defn in cols:
        _add_column_if_missing("project", col, defn)
    return "ok"


def add_meter_xecobase_columns():
    """Add meter columns expected by Flask model but missing from xecobase.sql dump."""
    from flask import current_app
    uri = current_app.config.get("SQLALCHEMY_DATABASE_URI", "")
    if ":memory:" in uri or "sqlite" in uri:
        return "skipped"
    cols = [
        ("meterSerialNumber", "VARCHAR(255) NULL"),
        ("gateway", "VARCHAR(255) NULL"),
        ("meshIp", "VARCHAR(255) NULL"),
        ("lastTimestamp", "BIGINT NULL"),
        ("isReporting", "TINYINT(1) NULL DEFAULT 1"),
        ("lastTotalTHD", "DOUBLE NULL"),
        ("peakTime", "VARCHAR(255) NULL"),
        ("isSub", "INT NULL"),
        ("isMain", "INT NULL"),
        ("isFilter", "INT NULL"),
        ("multiplier", "DOUBLE NULL"),
        ("lastOutputAmp", "DOUBLE NULL"),
        ("monthKwh", "DOUBLE NULL DEFAULT 0"),
        ("weekKwh", "DOUBLE NULL DEFAULT 0"),
        ("todayKwh", "DOUBLE NULL DEFAULT 0"),
        ("lastMonthKwh", "DOUBLE NULL DEFAULT 0"),
        ("lastKwh", "DOUBLE NULL DEFAULT 0"),
        ("avg15MinuteKva", "DOUBLE NULL DEFAULT 0"),
        ("monthPeak", "DOUBLE NULL DEFAULT 0"),
        ("lastMonthPeak", "DOUBLE NULL DEFAULT 0"),
        ("lastMonthSavings", "DOUBLE NULL DEFAULT 0"),
        ("lastMonthBudget", "DOUBLE NULL DEFAULT 0"),
        ("yearSavings", "DOUBLE NULL DEFAULT 0"),
        ("lastYearSavings", "DOUBLE NULL DEFAULT 0"),
        ("projectSavings", "DOUBLE NULL DEFAULT 0"),
        ("monthI2RLoss", "DOUBLE NULL DEFAULT 0"),
        ("lastMonthI2RLoss", "DOUBLE NULL DEFAULT 0"),
        ("yearI2RLoss", "DOUBLE NULL DEFAULT 0"),
        ("lastYearI2RLoss", "DOUBLE NULL DEFAULT 0"),
        ("projectI2RLoss", "DOUBLE NULL DEFAULT 0"),
        ("todayI2RLoss", "DOUBLE NULL DEFAULT 0"),
        ("weekI2RLoss", "DOUBLE NULL DEFAULT 0"),
        ("kwhSavings", "DOUBLE NULL DEFAULT 0"),
        ("kwPeakSavings", "DOUBLE NULL DEFAULT 0"),
    ]
    for col, defn in cols:
        _add_column_if_missing("meter", col, defn)
    return "ok"


def add_mesh_ip_columns():
    """Add meshIp column to meter, switch, repeater, gateway tables if missing (per database_changes)."""
    from flask import current_app
    uri = current_app.config.get("SQLALCHEMY_DATABASE_URI", "")
    if ":memory:" in uri or "sqlite" in uri:
        return "skipped"
    for table in ("meter", "switch", "repeater", "gateway"):
        _add_column_if_missing(table, "meshIp", "VARCHAR(255) NULL")
    return "ok"


def add_schedule_xecobase_columns():
    """Add schedule columns expected by Flask model but missing from xecobase.sql dump."""
    from flask import current_app
    uri = current_app.config.get("SQLALCHEMY_DATABASE_URI", "")
    if ":memory:" in uri or "sqlite" in uri:
        return "skipped"
    cols = [
        ("isCompleted", "TINYINT(1) NULL DEFAULT 0"),
        ("deviceType", "INT NULL"),
        ("daysOfWeek", "JSON NULL"),
        ("totalHoursOff", "DOUBLE NULL"),
    ]
    for col, defn in cols:
        _add_column_if_missing("schedule", col, defn)
    return "ok"


def add_meterdataaggregate_multiplier_column():
    """Add multiplier column to meterdataaggregate table if missing. xecobase.sql lacks it."""
    from flask import current_app
    uri = current_app.config.get("SQLALCHEMY_DATABASE_URI", "")
    if ":memory:" in uri or "sqlite" in uri:
        return "skipped"
    sql = "ALTER TABLE meterdataaggregate ADD COLUMN multiplier DOUBLE DEFAULT 1 NULL"
    try:
        db.session.execute(text(sql))
        db.session.commit()
        print("Added multiplier column to meterdataaggregate table.")
        return "ok"
    except Exception as e:
        err = str(e).lower()
        if "duplicate column" in err or "already exists" in err:
            print("meterdataaggregate.multiplier column already exists.")
            return "ok"
        print(f"Error: {e}")
        return "error"


def add_project_org_id_column():
    """Add org_id column to project table if missing. Links to client.org_id."""
    from flask import current_app
    uri = current_app.config.get("SQLALCHEMY_DATABASE_URI", "")
    if ":memory:" in uri:
        return "skipped"
    sql = "ALTER TABLE project ADD COLUMN org_id VARCHAR(255) NULL"
    try:
        db.session.execute(text(sql))
        db.session.commit()
        print("Added org_id column to project table.")
        return "ok"
    except Exception as e:
        if "duplicate column" in str(e).lower() or "already exists" in str(e).lower():
            print("project.org_id column already exists.")
            return "ok"
        print(f"Error: {e}")
        return "error"


def backfill_client_org_id():
    """
    Backfill org_id for clients that have NULL org_id.
    Calls License ensure_org for each client and updates client.org_id.
    Requires app_context and LICENSE_SERVICE_URL.
    Returns (updated_count, error_count, skipped_count).
    """
    from flask import current_app
    from app.services.org_registry import ensure_org

    uri = current_app.config.get("SQLALCHEMY_DATABASE_URI", "")
    if ":memory:" in uri:
        print("Skipping: using sqlite :memory:. Use a file DB or MySQL for backfill.")
        return (0, 0, 0)

    license_url = current_app.config.get("LICENSE_SERVICE_URL")
    if not license_url:
        print("Skipping: LICENSE_SERVICE_URL not configured.")
        return (0, 0, 0)

    clients = Client.query.filter(
        or_(Client.org_id.is_(None), Client.org_id == "")
    ).all()
    if not clients:
        print("No clients with missing org_id.")
        return (0, 0, 0)

    updated = 0
    errors = 0
    skipped = 0
    for c in clients:
        org_name = (c.name or c.legalName or "Unknown").strip() or "Unknown"
        result = ensure_org(org_name=org_name, org_type="customer")
        if result and result.get("org_id"):
            c.org_id = result["org_id"]
            db.session.add(c)
            updated += 1
        elif result is None:
            errors += 1
        else:
            skipped += 1

    if updated:
        db.session.commit()
        print(f"Backfilled org_id for {updated} client(s).")
    if errors:
        print(f"Failed to ensure org for {errors} client(s) (License service unreachable?).")
    if skipped:
        print(f"Skipped {skipped} client(s).")
    return (updated, errors, skipped)


def backfill_project_org_id():
    """
    Backfill org_id for projects that have NULL org_id by copying from their client.
    Run after backfill_client_org_id so clients have org_ids.
    Returns number of projects updated.
    """
    from flask import current_app

    uri = current_app.config.get("SQLALCHEMY_DATABASE_URI", "")
    if ":memory:" in uri:
        print("Skipping: using sqlite :memory:. Use MySQL for project org_id backfill.")
        return 0

    # Update project.org_id from client.org_id where project has a client with org_id
    sql = text("""
        UPDATE project p
        INNER JOIN client c ON p.client = c.id
        SET p.org_id = c.org_id
        WHERE (p.org_id IS NULL OR p.org_id = '')
          AND c.org_id IS NOT NULL AND c.org_id != ''
    """)
    result = db.session.execute(sql)
    db.session.commit()
    updated = result.rowcount
    if updated:
        print(f"Backfilled org_id for {updated} project(s) from their clients.")
    return updated


def assign_admin_to_orphan_projects():
    """
    Assign ALL Synerex admins (role 8) to projects that have no users in project_users.
    Fixes projects created before the create_project handler added user assignment.
    Returns (assigned_count, num_admins).
    """
    from app.models.project import Project, project_user
    from app.models.user import User
    from sqlalchemy import insert

    admins = db.session.query(User).filter_by(role=8, isDeleted=False).all()
    if not admins:
        print("No admin users (role=8) found. Cannot assign.")
        return (0, 0)

    # Projects with no project_users entry
    subq = db.session.query(project_user.c.project_users).distinct()
    orphans = (
        db.session.query(Project.id)
        .filter_by(isDeleted=False)
        .filter(~Project.id.in_(subq))
        .all()
    )
    orphan_ids = [r[0] for r in orphans]

    if not orphan_ids:
        print("No orphan projects (all projects already have users assigned).")
        return (0, len(admins))

    for pid in orphan_ids:
        for admin in admins:
            try:
                db.session.execute(
                    insert(project_user).values(
                        project_users=pid,
                        user_projects=admin.id,
                    )
                )
            except Exception as e:
                if "duplicate" in str(e).lower() or "unique" in str(e).lower():
                    pass
                else:
                    db.session.rollback()
                    raise
    db.session.commit()
    print(f"Assigned {len(admins)} admin(s) to {len(orphan_ids)} orphan project(s).")
    return (len(orphan_ids), len(admins))


def add_active_emv_analysis_to_project():
    """Add active_emv_analysis_id column to project table. Idempotent."""
    from flask import current_app

    uri = current_app.config.get("SQLALCHEMY_DATABASE_URI", "")
    if ":memory:" in uri:
        return "skipped"
    is_sqlite = "sqlite" in uri
    col = "active_emv_analysis_id"
    if is_sqlite:
        sql = f"ALTER TABLE project ADD COLUMN {col} INTEGER NULL"
    else:
        sql = f"ALTER TABLE project ADD COLUMN {col} INT NULL"
    try:
        db.session.execute(text(sql))
        db.session.commit()
        print(f"Added {col} to project table.")
        return "ok"
    except Exception as e:
        err = str(e).lower()
        if "duplicate column" in err or "already exists" in err:
            print(f"{col} column already exists.")
            return "ok"
        db.session.rollback()
        print(f"add_active_emv_analysis_to_project: {e}")
        return "error"


def add_emv_analysis_table():
    """Create emv_analysis table for EM&V integration. Idempotent."""
    from flask import current_app

    uri = current_app.config.get("SQLALCHEMY_DATABASE_URI", "")
    if ":memory:" in uri:
        print("Skipping: using :memory: sqlite. Use file DB or MySQL for emv_analysis.")
        return "skipped"
    is_sqlite = "sqlite" in uri
    if is_sqlite:
        sql = """
        CREATE TABLE IF NOT EXISTS emv_analysis (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            createdAt BIGINT,
            updatedAt BIGINT,
            project_id INTEGER NOT NULL,
            org_id VARCHAR(255),
            client_id INTEGER,
            kwh_savings DOUBLE,
            kw_peak_savings DOUBLE,
            pf_savings DOUBLE,
            kvar_savings DOUBLE,
            kva_savings DOUBLE,
            report_html TEXT,
            share_token VARCHAR(255) UNIQUE,
            analysis_date VARCHAR(50),
            off_period_start VARCHAR(50),
            off_period_end VARCHAR(50),
            on_period_start VARCHAR(50),
            on_period_end VARCHAR(50),
            FOREIGN KEY(project_id) REFERENCES project(id)
        )
        """
    else:
        sql = """
        CREATE TABLE IF NOT EXISTS emv_analysis (
            id INT AUTO_INCREMENT PRIMARY KEY,
            createdAt BIGINT,
            updatedAt BIGINT,
            project_id INT NOT NULL,
            org_id VARCHAR(255),
            client_id INT,
            kwh_savings DOUBLE,
            kw_peak_savings DOUBLE,
            pf_savings DOUBLE,
            kvar_savings DOUBLE,
            kva_savings DOUBLE,
            report_html TEXT,
            share_token VARCHAR(255) UNIQUE,
            analysis_date VARCHAR(50),
            off_period_start VARCHAR(50),
            off_period_end VARCHAR(50),
            on_period_start VARCHAR(50),
            on_period_end VARCHAR(50),
            INDEX idx_emv_project (project_id),
            INDEX idx_emv_token (share_token),
            FOREIGN KEY(project_id) REFERENCES project(id)
        )
        """
    try:
        db.session.execute(text(sql))
        db.session.commit()
        print("Created emv_analysis table (or already exists).")
        return "ok"
    except Exception as e:
        if "already exists" in str(e).lower() or "duplicate" in str(e).lower():
            return "ok"
        db.session.rollback()
        print(f"add_emv_analysis_table: {e}")
        return "error"


def alter_emv_analysis_report_html_to_mediumtext():
    """Alter report_html to MEDIUMTEXT (16MB) with utf8mb4. HTML reports can exceed 64KB and contain Unicode (e.g. ≥)."""
    from flask import current_app

    uri = current_app.config.get("SQLALCHEMY_DATABASE_URI", "")
    if ":memory:" in uri or "sqlite" in uri:
        return "skipped"
    try:
        db.session.execute(text(
            "ALTER TABLE emv_analysis MODIFY COLUMN report_html MEDIUMTEXT "
            "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
        ))
        db.session.commit()
        print("Altered emv_analysis.report_html to MEDIUMTEXT.")
        return "ok"
    except Exception as e:
        try:
            db.session.rollback()
        except Exception:
            pass
        # Check if already MEDIUMTEXT (e.g. re-run)
        try:
            r = db.session.execute(text(
                "SELECT COLUMN_TYPE FROM information_schema.COLUMNS "
                "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'emv_analysis' AND COLUMN_NAME = 'report_html'"
            ))
            row = r.fetchone()
            if row and "mediumtext" in (row[0] or "").lower():
                print("emv_analysis.report_html already MEDIUMTEXT.")
                return "ok"
        except Exception:
            pass
        print(f"alter_emv_analysis_report_html_to_mediumtext: {e}")
        return "error"


def assign_all_admins_to_all_projects():
    """
    Ensure every Synerex admin (role 8) is assigned to every project.
    Use when admins report not seeing projects. Returns inserted_count.
    """
    from app.models.project import Project, project_user
    from app.models.user import User
    from sqlalchemy import insert

    admins = db.session.query(User).filter_by(role=8, isDeleted=False).all()
    projects = db.session.query(Project.id).filter_by(isDeleted=False).all()
    if not admins or not projects:
        print("No admins or no projects.")
        return 0

    existing = set(
        (r[0], r[1]) for r in db.session.query(
            project_user.c.project_users,
            project_user.c.user_projects
        ).all()
    )
    admin_ids = [a.id for a in admins]
    project_ids = [p[0] for p in projects]
    inserted = 0

    for pid in project_ids:
        for aid in admin_ids:
            if (pid, aid) in existing:
                continue
            db.session.execute(
                insert(project_user).values(
                    project_users=pid,
                    user_projects=aid,
                )
            )
            inserted += 1
            existing.add((pid, aid))

    if inserted:
        db.session.commit()
        print(f"Assigned admins to projects: {inserted} new assignment(s) created.")
    else:
        print("All admins already assigned to all projects.")
    return inserted


SYNEREX_ADMIN_EMAIL = "admin@synerex.local"


def ensure_synerex_admin_user():
    """Create Synerex admin user (role 8) for SSO if missing. Used by License Service admin token."""
    from app.models.user import User
    from flask import current_app

    uri = current_app.config.get("SQLALCHEMY_DATABASE_URI", "")
    if ":memory:" in uri:
        return "skipped"
    existing = db.session.query(User).filter_by(email=SYNEREX_ADMIN_EMAIL, isDeleted=False).first()
    if existing:
        return "ok"
    import bcrypt
    hashed = bcrypt.hashpw(b"admin123", bcrypt.gensalt(rounds=8)).decode("utf-8")
    u = User(
        firstName="Synerex",
        lastName="Admin",
        email=SYNEREX_ADMIN_EMAIL,
        hashedPassword=hashed,
        role=8,  # XECO_ADMIN
        client=None,
        isDeleted=False,
    )
    db.session.add(u)
    db.session.commit()
    print(f"Created Synerex admin user ({SYNEREX_ADMIN_EMAIL}) for SSO.")
    return "ok"


CLIENT_ADMIN_EMAIL = "clientadmin@example.com"
CLIENT_ADMIN_PASSWORD = "client123"


def ensure_client_admin_user():
    """Disabled — Test Client placeholder seeding is disabled for production use."""
    return "disabled"


CLIENT_ADMIN_EMAIL = "clientadmin@example.com"
CLIENT_ADMIN_PASSWORD = "client123"


def ensure_client_admin_user():  # noqa: F811 — intentional override of above stub
    """Disabled — Test Client placeholder seeding is disabled for production use."""
    return "disabled"


def add_harmonic_columns():
    """Add 60 individual harmonic order columns (l1AmpH3–l3VoltH21) to meterdata table."""
    from flask import current_app
    uri = current_app.config.get("SQLALCHEMY_DATABASE_URI", "")
    if ":memory:" in uri or "sqlite" in uri:
        return "skipped"
    HARMONIC_ORDERS = [3, 5, 7, 9, 11, 13, 15, 17, 19, 21]
    errors = []
    for phase in [1, 2, 3]:
        for col_type in ["Amp", "Volt"]:
            for order in HARMONIC_ORDERS:
                col = f"l{phase}{col_type}H{order}"
                sql = f"ALTER TABLE meterdata ADD COLUMN `{col}` FLOAT NULL"
                try:
                    db.session.execute(text(sql))
                    db.session.commit()
                except Exception as e:
                    err = str(e).lower()
                    if "duplicate column" in err or "already exists" in err:
                        pass
                    else:
                        errors.append(f"{col}: {e}")
    if errors:
        print(f"add_harmonic_columns errors: {errors[:3]}")
        return "error"
    print("add_harmonic_columns: added/verified 60 harmonic columns on meterdata.")
    return "ok"


def add_emv_harmonic_baseline_column():
    """Add harmonic_baseline JSON column to emv_analysis for EMV OFF-period harmonic storage."""
    from flask import current_app
    uri = current_app.config.get("SQLALCHEMY_DATABASE_URI", "")
    if ":memory:" in uri or "sqlite" in uri:
        return "skipped"
    sql = "ALTER TABLE emv_analysis ADD COLUMN `harmonic_baseline` JSON NULL"
    try:
        db.session.execute(text(sql))
        db.session.commit()
        print("Added harmonic_baseline column to emv_analysis table.")
        return "ok"
    except Exception as e:
        err = str(e).lower()
        if "duplicate column" in err or "already exists" in err:
            print("emv_analysis.harmonic_baseline column already exists.")
            return "ok"
        print(f"add_emv_harmonic_baseline_column: {e}")
        return "error"


def add_missing_model_columns():
    """
    Catch-all migration: adds all columns present in SQLAlchemy models but missing
    from the MySQL database. Safe to run multiple times (skips existing columns).
    """
    from flask import current_app
    uri = current_app.config.get("SQLALCHEMY_DATABASE_URI", "")
    if ":memory:" in uri or "sqlite" in uri:
        return "skipped"

    COLUMN_DDLS = [
        # meteralertgroup
        ("meteralertgroup", "note",       "ALTER TABLE `meteralertgroup` ADD COLUMN `note` VARCHAR(255) NULL"),
        ("meteralertgroup", "isDeleted",  "ALTER TABLE `meteralertgroup` ADD COLUMN `isDeleted` TINYINT(1) NOT NULL DEFAULT 0"),
        # repeateralertgroup
        ("repeateralertgroup", "note",      "ALTER TABLE `repeateralertgroup` ADD COLUMN `note` VARCHAR(255) NULL"),
        ("repeateralertgroup", "isDeleted", "ALTER TABLE `repeateralertgroup` ADD COLUMN `isDeleted` TINYINT(1) NOT NULL DEFAULT 0"),
        # switchalertgroup
        ("switchalertgroup", "note",      "ALTER TABLE `switchalertgroup` ADD COLUMN `note` VARCHAR(255) NULL"),
        ("switchalertgroup", "isDeleted", "ALTER TABLE `switchalertgroup` ADD COLUMN `isDeleted` TINYINT(1) NOT NULL DEFAULT 0"),
        # meterdata
        ("meterdata", "outputAmp", "ALTER TABLE `meterdata` ADD COLUMN `outputAmp` FLOAT NULL"),
        # repeater
        ("repeater", "deviceId",                "ALTER TABLE `repeater` ADD COLUMN `deviceId` VARCHAR(255) NULL"),
        ("repeater", "gateway",                 "ALTER TABLE `repeater` ADD COLUMN `gateway` VARCHAR(255) NULL"),
        ("repeater", "isOn",                    "ALTER TABLE `repeater` ADD COLUMN `isOn` TINYINT(1) NULL"),
        ("repeater", "meshLastCommunicatedAt",  "ALTER TABLE `repeater` ADD COLUMN `meshLastCommunicatedAt` FLOAT NULL"),
        # switch
        ("switch", "ampLoad",       "ALTER TABLE `switch` ADD COLUMN `ampLoad` FLOAT NULL"),
        ("switch", "isOn",          "ALTER TABLE `switch` ADD COLUMN `isOn` TINYINT(1) NULL"),
        ("switch", "originalHours", "ALTER TABLE `switch` ADD COLUMN `originalHours` FLOAT NULL"),
        ("switch", "pf",            "ALTER TABLE `switch` ADD COLUMN `pf` FLOAT NULL"),
        ("switch", "voltage",       "ALTER TABLE `switch` ADD COLUMN `voltage` FLOAT NULL"),
        # switchcommand
        ("switchcommand", "deviceType",           "ALTER TABLE `switchcommand` ADD COLUMN `deviceType` INT NULL"),
        ("switchcommand", "executedBySwitchIds",  "ALTER TABLE `switchcommand` ADD COLUMN `executedBySwitchIds` JSON NULL"),
        # oem_branding — per-OEM SMTP for white-label email sending
        ("oem_branding", "smtp_server",       "ALTER TABLE `oem_branding` ADD COLUMN `smtp_server` VARCHAR(255) NULL"),
        ("oem_branding", "smtp_port",         "ALTER TABLE `oem_branding` ADD COLUMN `smtp_port` INT NULL"),
        ("oem_branding", "smtp_username",     "ALTER TABLE `oem_branding` ADD COLUMN `smtp_username` VARCHAR(255) NULL"),
        ("oem_branding", "smtp_password",     "ALTER TABLE `oem_branding` ADD COLUMN `smtp_password` VARCHAR(512) NULL"),
        ("oem_branding", "smtp_from_address", "ALTER TABLE `oem_branding` ADD COLUMN `smtp_from_address` VARCHAR(255) NULL"),
        ("oem_branding", "smtp_from_name",    "ALTER TABLE `oem_branding` ADD COLUMN `smtp_from_name` VARCHAR(255) NULL"),
        ("oem_branding", "smtp_use_tls",      "ALTER TABLE `oem_branding` ADD COLUMN `smtp_use_tls` TINYINT(1) NOT NULL DEFAULT 1"),
        ("user",         "org_id",             "ALTER TABLE `user` ADD COLUMN `org_id` VARCHAR(255) NULL"),
    ]

    results = {}
    for table, col, sql in COLUMN_DDLS:
        key = f"{table}.{col}"
        try:
            db.session.execute(text(sql))
            db.session.commit()
            print(f"Added {key}.")
            results[key] = "added"
        except Exception as e:
            err = str(e).lower()
            if "duplicate column" in err or "already exists" in err or "1060" in err:
                print(f"{key} already exists.")
                results[key] = "exists"
            else:
                print(f"ERROR {key}: {e}")
                results[key] = f"error: {e}"
    return results
