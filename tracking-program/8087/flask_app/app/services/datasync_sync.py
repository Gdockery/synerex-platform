"""
DataSync sync - full port of DataSyncService.sync for master/slave data replication.
Ported from api/services/DataSyncService.js
"""
import json
import logging
import os
import time

import requests
from sqlalchemy import text

from app.extensions import db
from app.services.datasync_service import REFERENCES, is_syncable, export_records

logger = logging.getLogger(__name__)

# Table order for sync - refs before dependents
ORDERED_TABLES = [
    "serviceplan", "xeco", "piboard", "client",
    "user", "project", "gateway", "meter", "repeater", "switch",
    "switchcommand",  # before join table (join refs switchcommand)
    "switch_switches_switch__switchcommand_switches",
    "test", "schedule",
    "meterdata", "meterdataaggregate", "permeterdataaggregate",
]

# Unique key fields for upsert (when not using xuid)
UNIQUE_KEYS = {
    "meterdata": ["meter", "recordedAt"],
    "meterdataaggregate": ["project", "day", "intervalId"],
    "permeterdataaggregate": ["project", "day", "meter", "intervalId"],
}

SEMAPHORE_DIR = "/tmp"
SEMAPHORE_TIMEOUT_MS = 20000


def _ensure_sync_status_table():
    """Create _sync_status if not exists."""
    try:
        db.session.execute(text("""
            CREATE TABLE IF NOT EXISTS _sync_status (
                host VARCHAR(200) NOT NULL,
                `table` VARCHAR(100) NOT NULL,
                lastSyncPoint BIGINT NOT NULL DEFAULT 0,
                refId BIGINT NOT NULL DEFAULT 0,
                UNIQUE KEY PK (host, `table`)
            )
        """))
        db.session.commit()
    except Exception as e:
        logger.warning("ensure _sync_status: %s", e)
        db.session.rollback()


def _get_last_sync_point(host, table):
    """Get lastSyncPoint, refId for host/table."""
    try:
        result = db.session.execute(
            text(
                "SELECT lastSyncPoint, refId FROM _sync_status "
                "WHERE host = :host AND `table` = :tbl"
            ),
            {"host": host, "tbl": table},
        )
        row = result.fetchone()
        if row:
            return row[0] or 0, row[1] or 0
    except Exception as e:
        logger.warning("getLastSyncPoint: %s", e)
    return 0, 0


def _set_last_sync_point(host, table, sync_point, ref_id):
    """Update sync point for host/table."""
    ref_id = ref_id or 0
    try:
        db.session.execute(
            text("""
                INSERT INTO _sync_status (host, `table`, lastSyncPoint, refId)
                VALUES (:host, :tbl, :sp, :rid)
                ON DUPLICATE KEY UPDATE
                    lastSyncPoint = :sp2, refId = :rid2
            """),
            {"host": host, "tbl": table, "sp": sync_point, "rid": ref_id, "sp2": sync_point, "rid2": ref_id},
        )
        db.session.commit()
    except Exception as e:
        logger.exception("setLastSyncPoint: %s", e)
        db.session.rollback()


def _request_records(host, table, sync_point, ref_id, base_url=None):
    """Fetch records from remote host. base_url e.g. http://host:8087"""
    ref_id = ref_id or 0
    url = f"{base_url or f'http://{host}'}/api/datasync/{table}/{sync_point}/100/{ref_id}"
    try:
        r = requests.get(url, timeout=600)
        if r.status_code == 200:
            return None, r.json()
        return f"Request failed: {r.status_code}", None
    except Exception as e:
        return str(e), None


def _resolve_xuids_to_ids(records, table):
    """Resolve xuid refs in records to local ids. Returns updated records or error."""
    if table not in REFERENCES:
        return None, records
    refs = REFERENCES[table]
    xuid_maps = {}
    for ref_field, ref_table in refs.items():
        if isinstance(ref_table, str) and ref_table.startswith("@"):
            continue
        ref_tables = [ref_table] if isinstance(ref_table, str) else ref_table.split("|")
        for rt in ref_tables:
            xuid_maps[rt] = {}

    for rec in records:
        for ref_field, ref_table in refs.items():
            if ref_field not in rec or rec[ref_field] is None:
                continue
            rt = ref_table
            if isinstance(rt, str) and rt.startswith("@"):
                var_field = rt[1:].split(":")[0]
                rt = rec.get(var_field, ref_table)
            if rt not in xuid_maps:
                xuid_maps[rt] = {}
            xuid_maps[rt][rec[ref_field]] = False

    for rt in xuid_maps:
        xuids = list(xuid_maps[rt].keys())
        if not xuids:
            continue
        # Use parameterized query to avoid SQL injection from remote xuids
        params = {f"x{i}": x for i, x in enumerate(xuids)}
        placeholders = ", ".join(f":x{i}" for i in range(len(xuids)))
        try:
            result = db.session.execute(
                text(f'SELECT id, xuid FROM {rt} WHERE xuid IN ({placeholders})'),
                params,
            )
            for row in result:
                xuid_val = row.xuid if hasattr(row, "xuid") else row[1]
                id_val = row.id if hasattr(row, "id") else row[0]
                xuid_maps[rt][xuid_val] = id_val
        except Exception as e:
            logger.warning("resolve xuids %s: %s", rt, e)

    for rec in records:
        for ref_field, ref_table in refs.items():
            if ref_field not in rec:
                continue
            rt = ref_table
            if isinstance(rt, str) and rt.startswith("@"):
                var_field = rt[1:].split(":")[0]
                rt = rec.get(var_field, ref_table)
            xuid = rec.get(ref_field)
            if xuid and rt in xuid_maps and xuid in xuid_maps[rt] and xuid_maps[rt][xuid]:
                rec[ref_field] = xuid_maps[rt][xuid]
    return None, records


def _import_record(table, record):
    """Insert or update record. Uses parameterized queries for values."""
    local_id = record.get("_localId")
    record = {k: v for k, v in record.items() if k not in ("id", "_refid", "_localId")}
    if not record:
        return None

    # Whitelist column names (alphanumeric + underscore) to prevent injection
    keys = [k for k in record.keys() if k and all(c.isalnum() or c == "_" for c in str(k))]
    if len(keys) != len(record):
        return None
    keys_str = ", ".join(f"`{k}`" for k in keys)

    if local_id and isinstance(local_id, (int, float)):
        # UPDATE existing record
        sets = ", ".join(f"`{k}` = :v{i}" for i, k in enumerate(keys))
        params = {f"v{i}": record[k] for i, k in enumerate(keys)}
        params["local_id"] = int(local_id)
        try:
            db.session.execute(
                text(f"UPDATE {table} SET {sets} WHERE id = :local_id"),
                params,
            )
            db.session.commit()
        except Exception as e:
            logger.exception("importRecord UPDATE %s: %s", table, e)
            db.session.rollback()
            return e
        return None

    # INSERT ... ON DUPLICATE KEY UPDATE
    params = {f"v{i}": record[k] for i, k in enumerate(keys)}
    placeholders = ", ".join(f":v{i}" for i in range(len(keys)))
    updates = ", ".join(f"`{k}` = VALUES(`{k}`)" for k in keys)
    try:
        db.session.execute(
            text(f"INSERT INTO {table} ({keys_str}) VALUES ({placeholders}) ON DUPLICATE KEY UPDATE {updates}"),
            params,
        )
        db.session.commit()
    except Exception as e:
        logger.exception("importRecord INSERT %s: %s", table, e)
        db.session.rollback()
        return e
    return None


def _table_needs_syncing(table, this_is_master, only_these_tables=None):
    """Whether to sync this table."""
    if only_these_tables and table not in only_these_tables:
        return False
    if not this_is_master and table not in (
        "schedule", "switch", "switch_switches_switch__switchcommand_switches",
        "switchcommand", "test",
    ):
        return False
    if this_is_master and table in ("client", "user"):
        return False
    return table in REFERENCES or table == "deleted"


def _sync_semaphore_start(host):
    """Acquire file-based sync semaphore. Returns True if acquired."""
    path = f"{SEMAPHORE_DIR}/xeco-datasync-semaphore-{host.replace('/', '_')}"
    try:
        if os.path.exists(path):
            mtime = os.path.getmtime(path)
            if (time.time() * 1000 - mtime * 1000) < SEMAPHORE_TIMEOUT_MS:
                return False
        with open(path, "w") as f:
            f.write("")
        return True
    except Exception:
        return False


def _sync_semaphore_stop(host):
    try:
        path = f"{SEMAPHORE_DIR}/xeco-datasync-semaphore-{host.replace('/', '_')}"
        if os.path.exists(path):
            os.unlink(path)
    except Exception:
        pass


def _handle_switchcommand_side_effects(record, local_id):
    """Send switch command to devices when new switchcommand is imported."""
    if local_id:
        return
    from app.services.device_service import send_switch_command
    from app.models.project import Project
    from app.models.switch import Switch

    xuid = record.get("xuid")
    if not xuid:
        return
    try:
        result = db.session.execute(
            text("""
                SELECT p.slug, GROUP_CONCAT(ss.switch_switches_switch) as switches, sc.id
                FROM switchcommand sc
                INNER JOIN project p ON sc.project = p.id
                INNER JOIN switch_switches_switch__switchcommand_switches ss ON ss.switchcommand_switches = sc.id
                WHERE sc.xuid = :xuid
                GROUP BY sc.id
            """),
            {"xuid": xuid},
        )
        row = result.fetchone()
        if not row:
            return
        slug = row[0]
        switches_str = row[1] or ""
        sc_id = row[2]
        switch_ids = [int(x) for x in switches_str.split(",") if x.strip()]
        for switch_id in switch_ids:
            try:
                send_switch_command(
                    project_slug=slug,
                    switch_id=switch_id,
                    command=record.get("commandType", 1),
                    time_ms=record.get("startAt", 0),
                    switch_command_id=sc_id,
                    schedule_id=f"x-{sc_id}",
                )
                time.sleep(1)
            except Exception as e:
                logger.warning("sendSwitchCommand %s: %s", switch_id, e)
    except Exception as e:
        logger.exception("handle_switchcommand_side_effects: %s", e)


def sync(only_these_tables=None, base_url_builder=None):
    """
    Run DataSync. If DATASYNC_MASTER set, we're slave (sync from master).
    If DATASYNC_SLAVES set, we're master (sync to each slave).
    base_url_builder: optional callable(host) -> full base URL e.g. http://host:8087
    """
    from flask import current_app
    master = (current_app.config.get("DATASYNC_MASTER") or "").strip()
    slaves_raw = current_app.config.get("DATASYNC_SLAVES") or []
    slaves = [s.strip() for s in slaves_raw if s and str(s).strip()]

    if master:
        hosts = [master]
        this_is_master = False
    elif slaves:
        hosts = slaves
        this_is_master = True
    else:
        logger.info("DataSync: no DATASYNC_MASTER or DATASYNC_SLAVES configured")
        return

    _ensure_sync_status_table()

    for host in hosts:
        if not _sync_semaphore_start(host):
            logger.info("Host %s already in progress, skipping", host)
            continue
        try:
            if base_url_builder:
                base_url = base_url_builder(host)
            elif host.startswith("http://") or host.startswith("https://"):
                base_url = host
            else:
                base_url = f"http://{host}"
            _sync_host(host, this_is_master, only_these_tables, base_url)
        except Exception as e:
            logger.exception("DataSync host %s: %s", host, e)
        finally:
            _sync_semaphore_stop(host)


def _sync_host(host, this_is_master, only_these_tables, base_url):
    """Sync with one host."""
    logger.info("DataSync: syncing with %s (master=%s)", host, this_is_master)

    for table in ORDERED_TABLES:
        if table not in REFERENCES and table != "deleted":
            continue
        if not _table_needs_syncing(table, this_is_master, only_these_tables):
            continue

        sync_point, ref_id = _get_last_sync_point(host, table)
        err, records = _request_records(host, table, sync_point, ref_id, base_url)
        if err:
            logger.warning("DataSync %s %s: request failed: %s", host, table, err)
            continue

        if not records:
            continue

        err, records = _resolve_xuids_to_ids(records, table)
        if err:
            continue

        last_time, last_ref = sync_point, ref_id
        imported = 0
        for rec in records:
            refid = rec.get("_refid", 0)
            updated = rec.get("updatedAt", 0)
            if updated >= last_time:
                last_time = updated
                last_ref = refid

            err = _import_record(table, rec)
            if not err:
                imported += 1
                if table == "switchcommand" and not rec.get("_localId"):
                    _handle_switchcommand_side_effects(rec, rec.get("_localId"))

        _set_last_sync_point(host, table, last_time, last_ref)
        logger.info("DataSync %s %s: imported %d", host, table, imported)
