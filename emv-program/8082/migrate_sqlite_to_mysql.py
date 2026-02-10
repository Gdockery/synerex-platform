#!/usr/bin/env python3
import os
import sqlite3
from pathlib import Path
from typing import Dict, List, Tuple
from urllib.parse import urlparse

import pymysql


ORG_TABLES = {
    "projects",
    "transformers_data",
    "feeders_data",
    "raw_meter_data",
    "project_files",
    "users",
    "user_activity",
    "data_modifications",
    "analysis_sessions",
    "calculation_audit",
    "data_access_log",
    "compliance_verification",
    "weather_data_audit",
    "pe_certifications",
    "pe_verification_documents",
    "pe_review_workflow",
    "equipment_health_monitoring",
    "html_reports",
    "csv_fingerprints",
    "csv_cell_annotations",
}

SHARED_TABLES = set()
SKIP_TABLES = {"sqlite_sequence", "organizations", "user_sessions"}
FORCE_TEXT_COLUMNS = {"uploaded_by", "uploader_name", "uploaded_by_name"}


def parse_mysql_url(url: str) -> dict:
    parsed = urlparse(url)
    return {
        "host": parsed.hostname or "localhost",
        "port": parsed.port or 3306,
        "user": parsed.username or "",
        "password": parsed.password or "",
        "database": (parsed.path or "").lstrip("/"),
    }


def mysql_type(sqlite_type: str, is_pk: bool, column_name: str, sample_values: List) -> str:
    st = (sqlite_type or "").upper()
    if is_pk and st in ("INTEGER", ""):
        return "INT AUTO_INCREMENT"
    if is_pk:
        return "VARCHAR(255)"
    if "INT" in st:
        for value in sample_values:
            if value is None:
                continue
            if isinstance(value, (int, float)):
                continue
            return "TEXT"
        return "INT"
    if "REAL" in st or "DOUBLE" in st or "FLOAT" in st:
        return "DOUBLE"
    if "DATE" in st or "TIME" in st:
        return "DATETIME"
    if "CHAR" in st or "CLOB" in st or "TEXT" in st:
        return "TEXT"
    return "TEXT"


def ensure_table(cursor, table_name: str, columns: List[Tuple], rows: List[Tuple]):
    columns_sql = []
    pk_columns = []
    col_names = [col[1] for col in columns]
    samples_by_col = {name: [] for name in col_names}
    for row in rows[:100]:
        for idx, name in enumerate(col_names):
            samples_by_col[name].append(row[idx])

    for col in columns:
        name = col[1]
        col_type = col[2]
        is_pk = col[5] == 1
        if is_pk:
            pk_columns.append(name)
        column_type = mysql_type(col_type, is_pk, name, samples_by_col.get(name, []))
        if name in FORCE_TEXT_COLUMNS:
            column_type = "TEXT"
        columns_sql.append(f"`{name}` {column_type}")

    if table_name in ORG_TABLES:
        if "org_id" not in [c[1] for c in columns]:
            columns_sql.append("`org_id` VARCHAR(255) NOT NULL")

    pk_sql = ""
    if pk_columns:
        pk_sql = f", PRIMARY KEY ({', '.join([f'`{c}`' for c in pk_columns])})"

    create_sql = f"CREATE TABLE IF NOT EXISTS `{table_name}` ({', '.join(columns_sql)}{pk_sql})"
    cursor.execute(create_sql)
    db_name = cursor.connection.db
    if isinstance(db_name, bytes):
        db_name = db_name.decode()
    cursor.execute(
        "SELECT column_name FROM information_schema.columns WHERE table_schema=%s AND table_name=%s",
        (db_name, table_name),
    )
    existing_columns = {row[0] for row in cursor.fetchall()}

    if table_name in ORG_TABLES and "org_id" not in existing_columns:
        cursor.execute(f"ALTER TABLE `{table_name}` ADD COLUMN `org_id` VARCHAR(255) NOT NULL")
        existing_columns.add("org_id")

    for col in columns:
        name = col[1]
        if name not in existing_columns:
            column_type = mysql_type(col[2], col[5] == 1, name, samples_by_col.get(name, []))
            cursor.execute(f"ALTER TABLE `{table_name}` ADD COLUMN `{name}` {column_type}")
        if name in FORCE_TEXT_COLUMNS:
            try:
                cursor.execute(f"ALTER TABLE `{table_name}` MODIFY COLUMN `{name}` TEXT")
            except Exception:
                pass


def read_sqlite_tables(conn: sqlite3.Connection) -> List[str]:
    cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
    return [row[0] for row in cursor.fetchall()]


def read_table_rows(conn: sqlite3.Connection, table_name: str) -> Tuple[List[str], List[Tuple]]:
    cursor = conn.execute(f"SELECT * FROM {table_name}")
    columns = [col[0] for col in cursor.description]
    rows = cursor.fetchall()
    normalized_rows = [tuple(row[col] for col in columns) for row in rows]
    return columns, normalized_rows


def migrate_db(sqlite_path: Path, mysql_conn, org_id: str):
    sqlite_conn = sqlite3.connect(str(sqlite_path))
    sqlite_conn.row_factory = sqlite3.Row
    sqlite_cursor = sqlite_conn.cursor()

    tables = read_sqlite_tables(sqlite_conn)
    for table in tables:
        if table in SKIP_TABLES:
            continue
        if table in SHARED_TABLES and org_id != "shared":
            continue
        if table in ORG_TABLES and org_id == "shared":
            continue

        sqlite_cursor.execute(f"PRAGMA table_info({table})")
        columns = sqlite_cursor.fetchall()

        col_names, rows = read_table_rows(sqlite_conn, table)
        mysql_cursor = mysql_conn.cursor()
        ensure_table(mysql_cursor, table, columns, rows)
        if table in ORG_TABLES:
            if "org_id" not in col_names:
                col_names.append("org_id")
                rows = [tuple(list(row) + [org_id]) for row in rows]

        if not rows:
            continue

        placeholders = ", ".join(["%s"] * len(col_names))
        columns_sql = ", ".join([f"`{c}`" for c in col_names])
        insert_sql = f"REPLACE INTO `{table}` ({columns_sql}) VALUES ({placeholders})"

        try:
            mysql_cursor.executemany(insert_sql, rows)
            print(f"Migrated {len(rows)} rows into {table} (org_id={org_id})")
            if table in ("raw_meter_data", "project_files", "csv_fingerprints"):
                print(f"  -> Fingerprints/verified data: {table} migrated for org_id={org_id}")
        except Exception as e:
            print(f"WARNING: Failed to migrate {table} (org_id={org_id}): {e}")
            raise

    mysql_conn.commit()
    sqlite_conn.close()


def main():
    mysql_url = os.getenv("EMV_DB_URL")
    if not mysql_url:
        raise RuntimeError("EMV_DB_URL is not set.")

    cfg = parse_mysql_url(mysql_url)
    mysql_conn = pymysql.connect(
        host=cfg["host"],
        port=cfg["port"],
        user=cfg["user"],
        password=cfg["password"],
        database=cfg["database"],
        autocommit=False,
    )

    base_dir = Path(__file__).parent
    results_dir = base_dir / "results"
    sessions_db = results_dir / "sessions.db"
    default_db = results_dir / "app.db"

    if default_db.exists():
        migrate_db(default_db, mysql_conn, "default")

    for org_db in results_dir.glob("org_*/app.db"):
        org_id = org_db.parent.name.replace("org_", "")
        migrate_db(org_db, mysql_conn, org_id)

    mysql_conn.close()
    print("EMV migration complete.")


if __name__ == "__main__":
    main()
