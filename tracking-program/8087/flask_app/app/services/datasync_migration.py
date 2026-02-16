"""
DataSync XUID migration - port of DataSyncService doMigrate/undoMigrate.
Ported from api/services/DataSyncService.js
Adds xuid, updatedAt columns and triggers for sync support.
Requires MySQL.
"""
import logging

from sqlalchemy import text

from app.extensions import db
from app.services.datasync_service import REFERENCES

logger = logging.getLogger(__name__)

# Tables excluded from xuid migration (big tables - no xuid)
BIG_TABLES = ["meterdata", "meterdataaggregate", "permeterdataaggregate"]


def _is_mysql():
    """Check if we're using MySQL."""
    from flask import current_app
    uri = current_app.config.get("SQLALCHEMY_DATABASE_URI", "")
    return "mysql" in uri and "sqlite" not in uri


def _is_relational(table):
    """Relational tables (join tables) have __ in name - no updatedAt."""
    return "__" in table


def _migration_tables():
    """Tables to migrate: REFERENCES keys minus BigTables."""
    return [t for t in REFERENCES if t not in BIG_TABLES]


def _migration_status():
    """Check xuid/updatedAt for each table. Returns dict table -> {hasXuid, hasUpdatedAt}."""
    info = {}
    for table in _migration_tables():
        info[table] = {"hasXuid": False, "hasUpdatedAt": False}
        try:
            result = db.session.execute(text(f"SHOW COLUMNS FROM `{table}`"))
            rows = result.fetchall()
            for row in rows:
                field = row[0] if hasattr(row, "__getitem__") else getattr(row, "Field", None)
                if field == "xuid":
                    info[table]["hasXuid"] = True
                elif field == "updatedAt":
                    info[table]["hasUpdatedAt"] = True
        except Exception as e:
            logger.warning("migrationStatus %s: %s", table, e)
    return info


def _run_sql(sql, ignore_errors=False):
    """Execute raw SQL. Returns True on success."""
    try:
        db.session.execute(text(sql))
        db.session.commit()
        return True
    except Exception as e:
        logger.warning("SQL: %s", e)
        db.session.rollback()
        return ignore_errors


# --- Create functions (doMigrate) ---


def create_sync_status_table():
    return _run_sql("""
        CREATE TABLE IF NOT EXISTS `_sync_status` (
            `host` VARCHAR(200) NOT NULL,
            `table` VARCHAR(100) NOT NULL,
            `lastSyncPoint` BIGINT(20) NOT NULL DEFAULT 0,
            `refId` BIGINT(20) NOT NULL DEFAULT 0,
            UNIQUE INDEX `PK` (`host` ASC, `table` ASC)
        )
    """)


def create_deleted_xuids_table():
    return _run_sql("""
        CREATE TABLE IF NOT EXISTS `_deleted_xuids` (
            `table` VARCHAR(100) NOT NULL,
            `xuid` VARCHAR(36) NOT NULL,
            `deletedAt` BIGINT(20) NOT NULL,
            PRIMARY KEY (`xuid`),
            INDEX `timestamp` (`deletedAt` ASC),
            INDEX `table` (`table` ASC)
        )
    """)


def create_xuid_columns():
    info = _migration_status()
    for table, data in info.items():
        if data["hasXuid"]:
            continue
        after_id = "" if _is_relational(table) else " AFTER id"
        sql = (
            f"ALTER TABLE `{table}` ADD COLUMN xuid VARCHAR(36) NULL{after_id}, "
            f"ADD UNIQUE INDEX xuid (xuid ASC)"
        )
        _run_sql(sql, ignore_errors=True)  # idempotent: column may already exist


def populate_xuid_columns():
    info = _migration_status()
    for table, data in info.items():
        if not data["hasXuid"]:
            continue
        _run_sql(f"UPDATE `{table}` SET xuid = UUID() WHERE xuid IS NULL")


def create_xuid_triggers():
    info = _migration_status()
    for table in info:
        trigger_sql = (
            f"CREATE DEFINER = CURRENT_USER TRIGGER xuid_{table} "
            f"BEFORE INSERT ON `{table}` FOR EACH ROW "
            "SET NEW.xuid = IF(NEW.xuid IS NULL OR NEW.xuid = '', UUID(), NEW.xuid)"
        )
        _run_sql(trigger_sql, ignore_errors=True)  # may already exist


def create_updated_at_columns():
    info = _migration_status()
    for table, data in info.items():
        if not _is_relational(table) or data["hasUpdatedAt"]:
            continue
        _run_sql(f"ALTER TABLE `{table}` ADD COLUMN updatedAt BIGINT(20) NULL", ignore_errors=True)


def populate_updated_at_columns():
    info = _migration_status()
    for table, data in info.items():
        if not _is_relational(table) or not data["hasUpdatedAt"]:
            continue
        _run_sql(f"UPDATE `{table}` SET updatedAt = id")


def create_updated_at_triggers():
    info = _migration_status()
    for table in info:
        if not _is_relational(table):
            continue
        trigger_sql = (
            f"CREATE DEFINER = CURRENT_USER TRIGGER updatedAt_{table} "
            f"BEFORE INSERT ON `{table}` FOR EACH ROW "
            "SET NEW.updatedAt = IF(NEW.updatedAt IS NULL, ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000), NEW.updatedAt)"
        )
        _run_sql(trigger_sql, ignore_errors=True)


def create_updated_at_index():
    info = _migration_status()
    for table, data in info.items():
        if not data["hasUpdatedAt"]:
            continue
        _run_sql(f"ALTER TABLE `{table}` ADD INDEX updatedAt (updatedAt ASC)", ignore_errors=True)


def create_delete_triggers():
    info = _migration_status()
    for table in info:
        trigger_sql = (
            f"CREATE DEFINER = CURRENT_USER TRIGGER deleteXuid_{table} "
            f"AFTER DELETE ON `{table}` FOR EACH ROW "
            f"INSERT INTO _deleted_xuids (`table`, xuid, deletedAt) "
            f"VALUES ('{table}', OLD.xuid, ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000)) "
            "ON DUPLICATE KEY UPDATE deletedAt = ROUND(UNIX_TIMESTAMP(NOW(3)) * 1000)"
        )
        _run_sql(trigger_sql, ignore_errors=True)


# --- Destroy functions (undoMigrate) ---


def destroy_sync_status_table():
    return _run_sql("DROP TABLE IF EXISTS `_sync_status`")


def destroy_deleted_xuids_table():
    return _run_sql("DROP TABLE IF EXISTS `_deleted_xuids`")


def destroy_xuid_columns():
    info = _migration_status()
    for table, data in info.items():
        if not data["hasXuid"]:
            continue
        _run_sql(f"ALTER TABLE `{table}` DROP COLUMN xuid, DROP INDEX xuid")


def destroy_xuid_triggers():
    info = _migration_status()
    for table in info:
        _run_sql(f"DROP TRIGGER IF EXISTS xuid_{table}")


def destroy_updated_at_index():
    info = _migration_status()
    for table, data in info.items():
        if not data["hasUpdatedAt"]:
            continue
        _run_sql(f"ALTER TABLE `{table}` DROP INDEX updatedAt", ignore_errors=True)


def destroy_updated_at_columns():
    info = _migration_status()
    for table, data in info.items():
        if not _is_relational(table) or not data["hasUpdatedAt"]:
            continue
        _run_sql(f"ALTER TABLE `{table}` DROP COLUMN updatedAt")


def destroy_updated_at_triggers():
    info = _migration_status()
    for table in info:
        if not _is_relational(table):
            continue
        _run_sql(f"DROP TRIGGER IF EXISTS updatedAt_{table}")


def destroy_delete_triggers():
    info = _migration_status()
    for table in info:
        _run_sql(f"DROP TRIGGER IF EXISTS deleteXuid_{table}")


def do_migrate():
    """Run full xuid migration. Returns (success, message)."""
    if not _is_mysql():
        return False, "Migration requires MySQL (sqlite not supported)"
    steps = [
        create_sync_status_table,
        create_deleted_xuids_table,
        create_xuid_columns,
        populate_xuid_columns,
        create_xuid_triggers,
        create_updated_at_columns,
        populate_updated_at_columns,
        create_updated_at_triggers,
        create_updated_at_index,
        create_delete_triggers,
    ]
    for step in steps:
        step()
    return True, "Migration complete"


def undo_migrate():
    """Revert xuid migration. Returns (success, message)."""
    if not _is_mysql():
        return False, "Undo migration requires MySQL"
    steps = [
        destroy_sync_status_table,
        destroy_deleted_xuids_table,
        destroy_xuid_columns,
        destroy_xuid_triggers,
        destroy_updated_at_index,
        destroy_updated_at_columns,
        destroy_updated_at_triggers,
        destroy_delete_triggers,
    ]
    for step in steps:
        step()
    return True, "Undo migration complete"
