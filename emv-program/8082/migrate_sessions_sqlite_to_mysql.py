#!/usr/bin/env python3
import os
import sqlite3
from pathlib import Path
from typing import List, Tuple
from urllib.parse import urlparse

import pymysql


SHARED_TABLES = {
    "organizations": [
        ("org_id", "VARCHAR(255) PRIMARY KEY"),
        ("company_name", "TEXT"),
        ("address", "TEXT"),
        ("city", "TEXT"),
        ("state", "TEXT"),
        ("zip", "TEXT"),
        ("contact_name", "TEXT"),
        ("contact_phone", "TEXT"),
        ("created_at", "DATETIME"),
    ],
    "user_sessions": [
        ("id", "INT AUTO_INCREMENT PRIMARY KEY"),
        ("user_id", "INT"),
        ("org_id", "VARCHAR(255)"),
        ("session_token", "VARCHAR(255) UNIQUE"),
        ("expires_at", "DATETIME"),
        ("created_at", "DATETIME"),
    ],
}


def parse_mysql_url(url: str) -> dict:
    parsed = urlparse(url)
    return {
        "host": parsed.hostname or "localhost",
        "port": parsed.port or 3306,
        "user": parsed.username or "",
        "password": parsed.password or "",
        "database": (parsed.path or "").lstrip("/"),
    }


def ensure_shared_tables(cursor):
    for table, columns in SHARED_TABLES.items():
        cols_sql = ", ".join([f"`{name}` {ctype}" for name, ctype in columns])
        cursor.execute(f"CREATE TABLE IF NOT EXISTS `{table}` ({cols_sql})")


def read_table_rows(conn: sqlite3.Connection, table_name: str) -> Tuple[List[str], List[Tuple]]:
    cursor = conn.execute(f"SELECT * FROM {table_name}")
    columns = [col[0] for col in cursor.description]
    rows = cursor.fetchall()
    normalized_rows = [tuple(row[col] for col in columns) for row in rows]
    return columns, normalized_rows


def migrate_sessions():
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
    mysql_cursor = mysql_conn.cursor()
    ensure_shared_tables(mysql_cursor)

    base_dir = Path(__file__).parent
    sessions_db = base_dir / "results" / "sessions.db"
    if not sessions_db.exists():
        print("sessions.db not found; nothing to migrate.")
        return

    sqlite_conn = sqlite3.connect(str(sessions_db))
    sqlite_conn.row_factory = sqlite3.Row

    for table in SHARED_TABLES.keys():
        columns, rows = read_table_rows(sqlite_conn, table)
        if not rows:
            continue
        placeholders = ", ".join(["%s"] * len(columns))
        columns_sql = ", ".join([f"`{c}`" for c in columns])
        insert_sql = f"REPLACE INTO `{table}` ({columns_sql}) VALUES ({placeholders})"
        mysql_cursor.executemany(insert_sql, rows)
        print(f"Migrated {len(rows)} rows into {table}")

    mysql_conn.commit()
    sqlite_conn.close()
    mysql_conn.close()
    print("Sessions migration complete.")


if __name__ == "__main__":
    migrate_sessions()
