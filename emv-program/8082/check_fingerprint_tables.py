#!/usr/bin/env python3
"""Check MySQL for fingerprint/verified file data (raw_meter_data, project_files, csv_fingerprints)."""
import os
import re
import sys
from pathlib import Path
from urllib.parse import urlparse

# Load .env from 8082 directory
try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent / ".env")
except ImportError:
    pass

EMV_DB_URL = os.getenv("EMV_DB_URL")
if not EMV_DB_URL:
    print("EMV_DB_URL not set. Set it or run from 8082 with .env present.")
    sys.exit(1)
# Apply EMV_DB_HOST/EMV_DB_PORT override for Docker (mysql-emv:3306)
_emv_db_host = os.getenv("EMV_DB_HOST")
_emv_db_port = os.getenv("EMV_DB_PORT")
if _emv_db_host:
    EMV_DB_URL = re.sub(r"@[^:/]+", "@" + _emv_db_host, EMV_DB_URL, count=1)
if _emv_db_port:
    EMV_DB_URL = re.sub(r":\d+(?=/)", ":" + str(_emv_db_port), EMV_DB_URL, count=1)

def parse_url(url):
    p = urlparse(url)
    return {
        "host": p.hostname or "localhost",
        "port": int(p.port or 3306),
        "user": p.username or "",
        "password": p.password or "",
        "database": (p.path or "").lstrip("/"),
    }

def main():
    cfg = parse_url(EMV_DB_URL)
    try:
        import pymysql
    except ImportError:
        print("pymysql not installed. Install with: pip install pymysql")
        sys.exit(1)
    conn = pymysql.connect(
        host=cfg["host"],
        port=cfg["port"],
        user=cfg["user"],
        password=cfg["password"],
        database=cfg["database"],
    )
    cur = conn.cursor()

    print("=== Fingerprint / verified files in MySQL ===\n")

    # Org IDs present
    try:
        cur.execute("SELECT DISTINCT org_id FROM raw_meter_data ORDER BY org_id")
        orgs = [row[0] for row in cur.fetchall()]
        if orgs:
            print(f"Organizations in raw_meter_data: {orgs}\n")
        else:
            print("No org_id found in raw_meter_data (table may be empty or no org_id column).\n")
    except Exception as e:
        print(f"Could not list org_id from raw_meter_data: {e}\n")
        orgs = ["default"]

    for table, label in [
        ("raw_meter_data", "raw_meter_data (uploaded CSV files)"),
        ("project_files", "project_files"),
        ("csv_fingerprints", "csv_fingerprints (integrity/verified)"),
    ]:
        try:
            cur.execute(f"SELECT COUNT(*) FROM `{table}`")
            total = cur.fetchone()[0]
            cur.execute(f"SELECT COUNT(*) FROM `{table}` WHERE fingerprint IS NOT NULL AND fingerprint != ''")
            with_fp = cur.fetchone()[0]
            if table == "csv_fingerprints":
                cur.execute(f"SELECT COUNT(*) FROM `{table}` WHERE file_path IS NOT NULL")
                with_path = cur.fetchone()[0]
                print(f"{label}: total rows = {total}, with fingerprint = {with_fp}, with file_path = {with_path}")
            else:
                print(f"{label}: total rows = {total}, with fingerprint = {with_fp}")
        except Exception as e:
            print(f"{label}: error - {e}")

    print("\n--- Per-org counts (raw_meter_data with fingerprint) ---")
    try:
        cur.execute("""
            SELECT org_id, COUNT(*) AS cnt
            FROM raw_meter_data
            WHERE fingerprint IS NOT NULL AND fingerprint != ''
            GROUP BY org_id
            ORDER BY org_id
        """)
        for row in cur.fetchall():
            print(f"  org_id = {row[0]!r}: {row[1]} files")
    except Exception as e:
        print(f"  Error: {e}")

    conn.close()
    print("\nDone.")

if __name__ == "__main__":
    main()
