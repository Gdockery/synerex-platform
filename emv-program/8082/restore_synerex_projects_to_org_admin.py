#!/usr/bin/env python3
"""
One-time restore: copy all Synerex project data from the original single-tenant
results/app.db into results/org_admin/app.db so that when users log in as
Synerex (admin) they see all projects. Use after switching to multi-tenant
or MySQL when projects went missing from the admin org.
"""
import sqlite3
import sys
from pathlib import Path

# Same org-scoped tables as main app (excluding users/sessions to keep admin auth)
TABLES_TO_COPY = {
    "projects",
    "transformers_data",
    "feeders_data",
    "raw_meter_data",
    "project_files",
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
# Also copy sequence so AUTOINCREMENT continues correctly
COPY_SQLITE_SEQUENCE = True


def get_create_table(conn: sqlite3.Connection, table: str) -> str:
    cur = conn.execute(
        "SELECT sql FROM sqlite_master WHERE type='table' AND name=?",
        (table,),
    )
    row = cur.fetchone()
    if not row:
        return None
    sql = row[0]
    # Ensure we can run idempotently
    if sql.strip().upper().startswith("CREATE TABLE ") and " IF NOT EXISTS " not in sql.upper():
        sql = sql.replace("CREATE TABLE ", "CREATE TABLE IF NOT EXISTS ", 1)
    return sql


def copy_table(
    src: sqlite3.Connection,
    dst: sqlite3.Connection,
    table: str,
    *,
    copy_sequence: bool = False,
) -> int:
    cur_src = src.execute(f"SELECT * FROM {table}")
    rows = cur_src.fetchall()
    if not rows and not copy_sequence:
        return 0
    cols = [d[0] for d in cur_src.description]
    cur_dst = dst.cursor()
    if table == "sqlite_sequence":
        cur_dst.execute("DELETE FROM sqlite_sequence")
        # Create only if missing (SQLite may not allow CREATE IF NOT EXISTS for this)
        try:
            cur_dst.execute("CREATE TABLE IF NOT EXISTS sqlite_sequence(name, seq)")
        except sqlite3.OperationalError:
            pass
    else:
        create_sql = get_create_table(src, table)
        if not create_sql:
            return 0
        cur_dst.execute(f"DROP TABLE IF EXISTS {table}")
        cur_dst.execute(create_sql)
    dst.commit()
    if not rows:
        return 0
    placeholders = ",".join(["?"] * len(cols))
    col_list = ",".join(f'"{c}"' for c in cols)
    cur_dst.executemany(
        f'INSERT INTO {table} ({col_list}) VALUES ({placeholders})',
        rows,
    )
    dst.commit()
    return len(rows)


def main() -> int:
    base = Path(__file__).resolve().parent
    source_db = base / "results" / "app.db"
    target_db = base / "results" / "org_admin" / "app.db"

    if not source_db.exists():
        print(f"Source not found: {source_db}", file=sys.stderr)
        return 1
    target_db.parent.mkdir(parents=True, exist_ok=True)

    src = sqlite3.connect(str(source_db))
    dst = sqlite3.connect(str(target_db))

    # Get list of tables that exist in source
    cur = src.execute(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    )
    source_tables = {r[0] for r in cur.fetchall()}

    to_copy = [t for t in TABLES_TO_COPY if t in source_tables]
    if COPY_SQLITE_SEQUENCE and "sqlite_sequence" in source_tables:
        to_copy.append("sqlite_sequence")

    total = 0
    for table in to_copy:
        n = copy_table(src, dst, table, copy_sequence=(table == "sqlite_sequence"))
        if n > 0:
            print(f"  {table}: {n} rows")
            total += n

    src.close()
    dst.close()
    print(f"Restore complete: {total} total rows copied into {target_db}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
