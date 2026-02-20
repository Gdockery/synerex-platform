#!/usr/bin/env python3
"""
Migrate all org_id 'ADMIN' to 'admin' in MySQL and remove the ADMIN org.
Run from 8082 with EMV_DB_URL set (e.g. source .env).
"""
import os
import re
import sys
from pathlib import Path
from urllib.parse import urlparse

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

# Tables that have org_id (from main_hardened_ready_refactored.py ORG_TABLES + sessions)
ORG_TABLES = {
    "projects", "transformers_data", "feeders_data", "raw_meter_data",
    "project_files", "users", "user_activity", "data_modifications",
    "analysis_sessions", "calculation_audit", "data_access_log",
    "compliance_verification", "weather_data_audit", "pe_certifications",
    "pe_verification_documents", "pe_review_workflow", "equipment_health_monitoring",
    "html_reports", "csv_fingerprints", "csv_cell_annotations",
}


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

    print("Migrating org_id 'ADMIN' -> 'admin' and removing ADMIN org.\n")

    # 1) Update all org-scoped tables
    for table in sorted(ORG_TABLES):
        try:
            cur.execute(
                f"UPDATE `{table}` SET org_id = %s WHERE org_id = %s",
                ("admin", "ADMIN"),
            )
            n = cur.rowcount
            if n:
                print(f"  {table}: updated {n} row(s) to org_id='admin'")
        except pymysql.err.ProgrammingError as e:
            if "1146" in str(e) or "doesn't exist" in str(e).lower():
                pass  # table missing
            else:
                print(f"  {table}: error - {e}")
        except Exception as e:
            print(f"  {table}: error - {e}")

    # 2) user_sessions (shared table, has org_id)
    try:
        cur.execute(
            "UPDATE user_sessions SET org_id = %s WHERE org_id = %s",
            ("admin", "ADMIN"),
        )
        n = cur.rowcount
        if n:
            print(f"  user_sessions: updated {n} row(s) to org_id='admin'")
    except Exception as e:
        print(f"  user_sessions: {e}")

    # 3) organizations: ensure 'admin' exists (copy from ADMIN if needed), then delete ADMIN
    try:
        cur.execute("SELECT org_id, company_name, address, city, state, zip, contact_name, contact_phone FROM organizations WHERE org_id = %s", ("ADMIN",))
        admin_row = cur.fetchone()
        cur.execute("SELECT 1 FROM organizations WHERE org_id = %s LIMIT 1", ("admin",))
        admin_exists = cur.fetchone() is not None

        if admin_row and not admin_exists:
            # Copy ADMIN -> admin so we keep company info
            cur.execute(
                """INSERT INTO organizations (org_id, company_name, address, city, state, zip, contact_name, contact_phone, created_at)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW())""",
                ("admin", admin_row[1] or "Admin", admin_row[2], admin_row[3], admin_row[4], admin_row[5], admin_row[6], admin_row[7]),
            )
            print("  organizations: inserted 'admin' from ADMIN data")
        elif admin_row and admin_exists:
            pass  # keep existing admin row
        # Remove ADMIN org
        cur.execute("DELETE FROM organizations WHERE org_id = %s", ("ADMIN",))
        if cur.rowcount:
            print("  organizations: removed org_id='ADMIN'")
    except Exception as e:
        print(f"  organizations: {e}")

    conn.commit()
    conn.close()
    print("\nDone. All ADMIN data now belongs to 'admin'; ADMIN org removed.")


if __name__ == "__main__":
    main()
