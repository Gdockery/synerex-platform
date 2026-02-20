#!/usr/bin/env python3
"""
One-time fix: normalize file_path in MySQL to use forward slashes so CSV paths
resolve correctly when the app runs in Docker (Linux). Run after migrate_sqlite_to_mysql.py.
"""
import os
import re
import sys
from urllib.parse import urlparse

import pymysql


def _resolve_emv_db_url(url):
    """Apply EMV_DB_HOST/EMV_DB_PORT override for Docker (mysql-emv:3306)."""
    if not url:
        return url
    host = os.getenv("EMV_DB_HOST")
    port = os.getenv("EMV_DB_PORT")
    if host:
        url = re.sub(r"@[^:/]+", "@" + host, url, count=1)
    if port:
        url = re.sub(r":\d+(?=/)", ":" + str(port), url, count=1)
    return url


def main():
    url = os.getenv("EMV_DB_URL")
    if not url:
        print("EMV_DB_URL not set.", file=sys.stderr)
        return 1
    url = _resolve_emv_db_url(url)
    parsed = urlparse(url)
    conn = pymysql.connect(
        host=parsed.hostname or "localhost",
        port=parsed.port or 3306,
        user=parsed.username or "",
        password=parsed.password or "",
        database=(parsed.path or "").lstrip("/"),
    )
    cur = conn.cursor()
    # Normalize backslashes to forward slashes so paths work on Linux
    for table, col in [("raw_meter_data", "file_path"), ("project_files", "file_path")]:
        try:
            # REPLACE all backslashes with forward slashes (MySQL: \ in string is \\ in Python)
            n = cur.execute(
                f"UPDATE {table} SET {col} = REPLACE({col}, CHAR(92), '/')"
            )
            conn.commit()
            print(f"Updated {n} rows in {table}.{col}")
        except pymysql.err.ProgrammingError as e:
            if "1146" in str(e) or "doesn't exist" in str(e).lower():
                print(f"Table {table} does not exist or has no {col}, skipping.")
            else:
                raise
    conn.close()
    print("Done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
