#!/usr/bin/env python3
"""
Simulate: create project -> list by client. Captures logs to trace why new projects don't appear.

Run from tracking-program/8087/flask_app:
  ./venv/bin/python scripts/simulate_project_flow.py

Uses temp SQLite DB. Seeds client + admin, logs in, creates project, updates it, lists by client.
"""
import io
import json
import logging
import os
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault("TRACKING_DB_URL", "sqlite:///:memory:")
os.environ.setdefault("LICENSE_SERVICE_URL", "http://localhost:8000")
os.environ.setdefault("SECRET_KEY", "test-secret")
os.environ.setdefault("FLASK_ENV", "development")


def main():
    import bcrypt
    from app import create_app
    from app.extensions import db
    from app.models.user import User
    from app.models.client import Client
    from app.models.project import Project
    from app.models.report_data import ReportData
    from app.models.project import project_user
    from sqlalchemy import text

    # Capture logs
    log_buf = io.StringIO()
    handler = logging.StreamHandler(log_buf)
    handler.setLevel(logging.INFO)
    handler.setFormatter(logging.Formatter("%(name)s %(levelname)s: %(message)s"))
    root = logging.getLogger()
    root.addHandler(handler)
    root.setLevel(logging.INFO)
    for n in ("app.api.web_routes", "app"):
        logging.getLogger(n).setLevel(logging.INFO)
        logging.getLogger(n).addHandler(handler)

    app = create_app()
    with app.app_context():
        db.create_all()

        # Seed: client + admin (role 8 bypasses license)
        c = Client(name="Test Client", isDeleted=False)
        db.session.add(c)
        db.session.commit()
        client_id = c.id

        hashed = bcrypt.hashpw(b"admin123", bcrypt.gensalt(rounds=8))
        u = User(
            firstName="Admin",
            lastName="User",
            email="admin@test.local",
            role=8,  # XECO_ADMIN
            hashedPassword=hashed.decode("utf-8"),
            isDeleted=False,
        )
        db.session.add(u)
        db.session.commit()
        user_id = u.id

        print("=" * 60)
        print("PROJECT CREATE + LIST SIMULATION")
        print("=" * 60)
        print(f"Seeded: client id={client_id}, admin user id={user_id}")
        print()

        with app.test_client() as tc:
            # 1. Login
            rv = tc.post("/login", json={"email": "admin@test.local", "password": "admin123"})
            if rv.status_code not in (200, 302):
                print(f"FAIL: Login {rv.status_code}: {rv.get_data(as_text=True)[:300]}")
                return
            print("1. Login: OK")
            print()

            # 2. Create project (client as int - same as form would send)
            vals = {
                "name": "Test Project",
                "slug": "test-project",
                "client": client_id,  # integer
                "timeZoneId": "America/Chicago",
            }
            rv = tc.post(
                "/api/project",
                json={"valuesToSet": vals},
                headers={"Accept": "application/json"},
            )
            if rv.status_code != 200:
                print(f"2. Create project: FAIL {rv.status_code}: {rv.get_data(as_text=True)[:400]}")
                return
            data = rv.get_json()
            proj_id = data.get("response", {}).get("id")
            if not proj_id:
                print(f"2. Create project: no id in response: {data}")
                return
            print(f"2. Create project: OK id={proj_id}")
            print()

            # 3. Verify project in DB
            p = db.session.query(Project).filter_by(id=proj_id, isDeleted=False).first()
            if not p:
                print("3. DB check: Project not found!")
            else:
                print(f"3. DB check: project id={p.id} name={p.name} client={p.client}")
            print()

            # 4. Update project (mimic frontend - includes client in formData)
            update_vals = dict(vals)
            update_vals["id"] = proj_id
            update_vals["invoiceNumber"] = {"deposit": "1231", "installation": "1232", "final": "1233", "total": "1234"}
            rv = tc.put(
                f"/api/project/{proj_id}",
                json={"valuesToSet": update_vals},
                headers={"Accept": "application/json"},
            )
            if rv.status_code != 200:
                print(f"4. Update project: FAIL {rv.status_code}: {rv.get_data(as_text=True)[:300]}")
            else:
                print("4. Update project: OK")
                p2 = db.session.query(Project).get(proj_id)
                print(f"   After update: project.client={p2.client}")
            print()

            # 5. List projects filtered by client
            rv = tc.get(
                f"/api/project?client={client_id}&page=1&pageSize=50",
                headers={"Accept": "application/json"},
            )
            if rv.status_code != 200:
                print(f"5. List projects: FAIL {rv.status_code}: {rv.get_data(as_text=True)[:300]}")
            else:
                data = rv.get_json()
                total = data.get("meta", {}).get("total", 0)
                items = data.get("response", [])
                print(f"5. List projects (client={client_id}): total={total} items={len(items)}")
                for row in items:
                    print(f"   - id={row.get('id')} name={row.get('name')} client={row.get('client')}")
                if total == 0:
                    print("   >>> BUG: New project not found in list!")
            print()

        # Server logs
        log_output = log_buf.getvalue()
        if log_output:
            print("SERVER LOGS:")
            print("-" * 40)
            for line in log_output.strip().split("\n"):
                if "[create_project]" in line or "[update_project]" in line or "[list_projects]" in line:
                    print(line)
        print("=" * 60)


if __name__ == "__main__":
    main()
