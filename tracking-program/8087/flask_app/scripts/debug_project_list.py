#!/usr/bin/env python3
"""
Debug script: inspect projects and client filter to trace why new projects don't appear.

Run from tracking-program/8087/flask_app:
  ./venv/bin/python scripts/debug_project_list.py

Uses the database from TRACKING_DB_URL. Shows:
- Recent projects with their client IDs
- Client list with project counts
- Simulated list_projects filter per client
- Projects with client=NULL/0 (would not show in filter)

When reproducing the bug, also run Flask with logging to see API traces:
  LOG_LEVEL=INFO ./venv/bin/flask run  # or your start command

Server logs will show:
  [create_project] vals.client=... -> client_id=...
  [create_project] created project id=X name='...' client=Y
  [update_project] pid=X vals.client=... -> sanitized=... (p.client before=...)
  [update_project] pid=X done, p.client=Y
  [list_projects] client_arg=... client_id=...
  [list_projects] total=N items=M (client_id=...)
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Use real DB if configured
os.environ.setdefault("LICENSE_SERVICE_URL", "http://localhost:8000")
os.environ.setdefault("SECRET_KEY", "test-secret")


def main():
    from app import create_app
    from app.extensions import db
    from app.db.request_session import get_session
    from sqlalchemy import text

    app = create_app()
    with app.app_context():
        sess = get_session()

        print("=" * 60)
        print("PROJECT LIST DEBUG")
        print("=" * 60)
        db_uri = str(app.config.get("SQLALCHEMY_DATABASE_URI", ""))
        print("Database:", db_uri.split("@")[-1].split("?")[0] if "@" in db_uri else db_uri)
        print()

        # 1. List all non-deleted projects (raw SQL to avoid schema mismatch)
        try:
            rows = sess.execute(text("""
                SELECT id, name, client, slug FROM project
                WHERE isDeleted = 0 ORDER BY id DESC LIMIT 25
            """)).fetchall()
        except Exception as e:
            print("Error querying project:", e)
            rows = []
        print("Recent projects (last 25):")
        print("-" * 50)
        for r in rows:
            print(f"  id={r[0]}  name={r[1]!r}  client={r[2]}  slug={r[3]!r}")
        if not rows:
            print("  (no projects found)")
        print()

        # 2. List clients
        try:
            clients = sess.execute(text("""
                SELECT id, name FROM client WHERE isDeleted = 0 LIMIT 15
            """)).fetchall()
        except Exception as e:
            print("Error querying client:", e)
            clients = []
        print("Clients (first 15):")
        print("-" * 50)
        for c in clients:
            cid, cname = c[0], c[1]
            count = sess.execute(text("""
                SELECT COUNT(*) FROM project WHERE isDeleted = 0 AND client = :cid
            """), {"cid": cid}).scalar()
            print(f"  id={cid}  name={cname!r}  -> {count} projects")
        if not clients:
            print("  (no clients found)")
        print()

        # 3. Simulate list_projects filter for each client
        print("Simulating GET /api/project?client=X:")
        print("-" * 50)
        for c in clients:
            cid, cname = c[0], c[1]
            projs = sess.execute(text("""
                SELECT id, name FROM project
                WHERE isDeleted = 0 AND client = :cid ORDER BY name LIMIT 10
            """), {"cid": cid}).fetchall()
            names = [p[1] for p in projs]
            print(f"  client={cid} ({cname}): {len(projs)} -> {names}")
        print()

        # 4. Projects with client=NULL or 0
        odd = sess.execute(text("""
            SELECT id, name, client FROM project
            WHERE isDeleted = 0 AND (client IS NULL OR client = 0)
        """)).fetchall()
        if odd:
            print("WARNING: Projects with client=NULL/0 (won't show in client filter):")
            for r in odd:
                print(f"  id={r[0]} name={r[1]!r} client={r[2]}")
        print("=" * 60)


if __name__ == "__main__":
    main()
