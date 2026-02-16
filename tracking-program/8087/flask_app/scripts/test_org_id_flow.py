#!/usr/bin/env python3
"""
Test script to simulate and verify the org_id flow for Tracking + License.
Run from tracking-program/8087/flask_app with venv activated:
  python scripts/test_org_id_flow.py

Uses Flask test client. Optionally starts License service for integration test.
"""
import os
import sys
import time
import subprocess
import tempfile
import urllib.request
import json
import bcrypt

# Add app to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configure for test before importing app
os.environ.setdefault("TRACKING_DB_URL", "sqlite:///")  # :memory: by default for empty
os.environ.setdefault("LICENSE_SERVICE_URL", "http://localhost:8000")
os.environ.setdefault("SECRET_KEY", "test-secret")
os.environ.setdefault("FLASK_ENV", "development")


def wait_for_url(url, timeout=15):
    for _ in range(timeout):
        try:
            with urllib.request.urlopen(url, timeout=2) as r:
                if r.status < 500:
                    return True
        except Exception:
            pass
        time.sleep(1)
    return False


def main():
    print("=" * 60)
    print("Org ID Flow Verification Test")
    print("=" * 60)

    # Use temp sqlite file so we can run migrations and have persistence
    db_path = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
    db_path.close()
    db_uri = f"sqlite:///{db_path.name}"
    os.environ["TRACKING_DB_URL"] = db_uri

    from app import create_app
    from app.extensions import db
    from app.models.user import User
    from app.models.client import Client
    from app.db_migrations import add_client_org_id_column, add_project_org_id_column

    app = create_app()
    with app.app_context():
        # Create tables
        db.create_all()
        add_client_org_id_column()
        add_project_org_id_column()

        # Seed: create client with org_id, then user
        c = Client(
            name="Test Client Org",
            org_id="CUSTOMER-TEST-CLIENT",
            isDeleted=False,
        )
        db.session.add(c)
        db.session.commit()
        client_id = c.id

        hashed = bcrypt.hashpw(b"testpass123", bcrypt.gensalt(rounds=8))
        u = User(
            firstName="Test",
            lastName="User",
            email="testorg@example.com",
            role=2,  # CLIENT_ADMIN
            client=client_id,
            hashedPassword=hashed.decode("utf-8"),
            isDeleted=False,
        )
        db.session.add(u)
        db.session.commit()
        user_id = u.id

        print(f"\nSeeded: client id={client_id} org_id={c.org_id}, user id={user_id}")

        # Test 1: Login and verify session has orgId
        print("\n--- Test 1: Email/password login sets session orgId ---")
        with app.test_client() as client:
            rv = client.post(
                "/login",
                json={"email": "testorg@example.com", "password": "testpass123"},
                follow_redirects=False,
            )
            if rv.status_code not in (200, 302):
                print(f"FAIL: Login returned {rv.status_code}: {rv.get_data(as_text=True)[:200]}")
            else:
                with client.session_transaction() as sess:
                    org_id = sess.get("orgId")
                    user_org = (sess.get("user") or {}).get("orgId")
                if org_id == "CUSTOMER-TEST-CLIENT":
                    print(f"PASS: session['orgId'] = {org_id}")
                else:
                    print(f"FAIL: expected session orgId=CUSTOMER-TEST-CLIENT, got {org_id}")
                if user_org == "CUSTOMER-TEST-CLIENT":
                    print(f"PASS: session['user']['orgId'] = {user_org}")
                else:
                    print(f"FAIL: expected session user orgId=CUSTOMER-TEST-CLIENT, got {user_org}")

        # Test 2: User without client - no orgId set
        print("\n--- Test 2: User without client - no orgId (expected) ---")
        u2 = User(
            firstName="No",
            lastName="Client",
            email="noclient@example.com",
            role=2,
            client=None,
            hashedPassword=bcrypt.hashpw(b"pass123", bcrypt.gensalt(rounds=8)).decode("utf-8"),
            isDeleted=False,
        )
        db.session.add(u2)
        db.session.commit()
        with app.test_client() as client:
            client.post(
                "/login",
                json={"email": "noclient@example.com", "password": "pass123"},
                follow_redirects=False,
            )
            with client.session_transaction() as sess:
                org_id = sess.get("orgId")
            if org_id is None:
                print("PASS: session orgId is None (user has no client)")
            else:
                print(f"FAIL: expected None, got {org_id}")

        # Test 3: Client without org_id - no orgId set
        print("\n--- Test 3: Client without org_id - no orgId (expected) ---")
        c2 = Client(name="No Org Client", org_id=None, isDeleted=False)
        db.session.add(c2)
        db.session.commit()
        u3 = User(
            firstName="Legacy",
            lastName="User",
            email="legacy@example.com",
            role=2,
            client=c2.id,
            hashedPassword=bcrypt.hashpw(b"pass123", bcrypt.gensalt(rounds=8)).decode("utf-8"),
            isDeleted=False,
        )
        db.session.add(u3)
        db.session.commit()
        with app.test_client() as client:
            client.post(
                "/login",
                json={"email": "legacy@example.com", "password": "pass123"},
                follow_redirects=False,
            )
            with client.session_transaction() as sess:
                org_id = sess.get("orgId")
            if org_id is None:
                print("PASS: session orgId is None (client has no org_id)")
            else:
                print(f"FAIL: expected None, got {org_id}")

    # Cleanup
    try:
        os.unlink(db_path.name)
    except Exception:
        pass

    print("\n" + "=" * 60)
    print("Test complete. To verify with real servers and see org_id in logs:")
    print("  1. License: cd license-service/... && DB_URL=sqlite:///./licensing.db uvicorn app.main:app --port 8000 &")
    print("  2. Tracking: LOG_LEVEL=INFO TRACKING_DB_URL=... LICENSE_SERVICE_URL=http://localhost:8000 python run.py")
    print("     (Set LOG_LEVEL=INFO to see org_id and license_required messages)")
    print("  3. Login: curl -X POST -H 'Content-Type: application/json' -d '{\"email\":\"...\",\"password\":\"...\"}' -c c.txt http://localhost:8088/login")
    print("  4. Then: curl -b c.txt -H 'Accept: application/json' http://localhost:8088/api/client")
    print("=" * 60)


if __name__ == "__main__":
    main()
