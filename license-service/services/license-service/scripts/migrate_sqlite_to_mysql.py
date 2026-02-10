#!/usr/bin/env python3
import os
import sys
import sqlite3
from typing import List, Tuple
from urllib.parse import urlparse

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

from app.config import settings  # noqa: E402


def _read_sqlite_table(conn: sqlite3.Connection, table_name: str):
    cursor = conn.execute(f"SELECT * FROM {table_name}")
    columns = [col[0] for col in cursor.description]
    rows = cursor.fetchall()
    normalized_rows = [tuple(row[col] for col in columns) for row in rows]
    return columns, normalized_rows


def _sqlite_tables(conn: sqlite3.Connection) -> List[str]:
    cursor = conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
    return [row[0] for row in cursor.fetchall()]


def _sqlite_table_info(conn: sqlite3.Connection, table_name: str) -> List[Tuple]:
    cursor = conn.execute(f"PRAGMA table_info({table_name})")
    return cursor.fetchall()


def _mysql_type(sqlite_type: str, is_pk: bool) -> str:
    st = (sqlite_type or "").upper()
    if is_pk and st in ("INTEGER", ""):
        return "INT AUTO_INCREMENT"
    if is_pk and ("CHAR" in st or "CLOB" in st or "TEXT" in st):
        return "VARCHAR(255)"
    if "INT" in st:
        return "INT"
    if "REAL" in st or "DOUBLE" in st or "FLOAT" in st:
        return "DOUBLE"
    if "DATE" in st or "TIME" in st:
        return "DATETIME"
    if "CHAR" in st or "CLOB" in st or "TEXT" in st:
        return "TEXT"
    return "TEXT"


def _ensure_table(cursor, table_name: str, columns: List[Tuple]):
    columns_sql = []
    pk_columns = []
    for col in columns:
        name = col[1]
        col_type = col[2]
        is_pk = col[5] == 1
        if is_pk:
            pk_columns.append(name)
        columns_sql.append(f"`{name}` {_mysql_type(col_type, is_pk)}")
    pk_sql = ""
    if pk_columns:
        pk_sql = f", PRIMARY KEY ({', '.join([f'`{c}`' for c in pk_columns])})"
    cursor.execute(f"CREATE TABLE IF NOT EXISTS `{table_name}` ({', '.join(columns_sql)}{pk_sql})")


def migrate(sqlite_path: str) -> None:
    mysql_url = settings.db_url
    if not mysql_url.startswith("mysql"):
        raise RuntimeError("DB_URL must point to MySQL for migration.")

    sqlite_conn = sqlite3.connect(sqlite_path)
    sqlite_conn.row_factory = sqlite3.Row

    parsed = urlparse(mysql_url)
    import pymysql
    mysql_conn = pymysql.connect(
        host=parsed.hostname or "localhost",
        port=parsed.port or 3306,
        user=parsed.username or "",
        password=parsed.password or "",
        database=(parsed.path or "").lstrip("/"),
        autocommit=False,
    )

    mysql_cursor = mysql_conn.cursor()
    for table in _sqlite_tables(sqlite_conn):
        columns = _sqlite_table_info(sqlite_conn, table)
        _ensure_table(mysql_cursor, table, columns)
        col_names, rows = _read_sqlite_table(sqlite_conn, table)
        if not rows:
            continue
        placeholders = ", ".join(["%s"] * len(col_names))
        columns_sql = ", ".join([f"`{c}`" for c in col_names])
        insert_sql = f"REPLACE INTO `{table}` ({columns_sql}) VALUES ({placeholders})"
        mysql_cursor.executemany(insert_sql, rows)
        print(f"Migrated {len(rows)} rows into {table}")
    mysql_conn.commit()
    mysql_conn.close()

    sqlite_conn.close()
    print("License Service migration complete.")


if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    default_sqlite = os.path.join(base_dir, "licensing.db")
    sqlite_path = os.getenv("LICENSE_SQLITE_PATH", default_sqlite)
    migrate(sqlite_path)
