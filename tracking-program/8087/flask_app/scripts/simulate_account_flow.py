#!/usr/bin/env python3
"""
Simulate the /api/account flow for an OEM user to debug orgDisplayName.
Uses Flask test client with a mock session.
Run: cd flask_app && python3 scripts/simulate_account_flow.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("LICENSE_SERVICE_URL", "http://localhost:8000")
os.environ.setdefault("TRACKING_DB_URL", "sqlite:///")  # Use in-memory if not set

from app import create_app
from app.models.user import User
from app.models.client import Client
from app.db.request_session import get_session

def main():
    app = create_app()
    with app.app_context():
        sess = get_session()
        # Find an OEM user (role 9 or 10) in the database
        oem_users = sess.query(User).filter(User.role.in_([9, 10]), User.isDeleted == False).limit(5).all()
        print("=== OEM users in DB (role 9 or 10) ===")
        for u in oem_users:
            client = sess.query(Client).get(u.client) if u.client else None
            org_id = getattr(client, "org_id", None) if client else None
            print(f"  id={u.id} email={u.email} role={u.role} client={u.client} client.org_id={org_id}")

        if not oem_users:
            print("  (No OEM users found - seed with seed_oem_user_for_tracking.py)")
            return

        # Simulate request with session
        with app.test_client() as c:
            with c.session_transaction() as sess_obj:
                sess_obj["_user_id"] = str(oem_users[0].id)
                sess_obj["userId"] = oem_users[0].id
                sess_obj["orgId"] = "OEM-HARMONIQ"  # Simulate SSO setting this
                sess_obj["user"] = {"id": oem_users[0].id, "orgId": "OEM-HARMONIQ"}

            # Need to bypass login_required - use a different approach
            # Instead, call the logic directly
            from flask import session
            from app.api.web_routes import _oem_org_to_display_name

        print("\n=== Simulated session ===")
        print("  orgId from session: OEM-HARMONIQ")
        print("  _oem_org_to_display_name('OEM-HARMONIQ'):", repr(_oem_org_to_display_name("OEM-HARMONIQ")))

        # Simulate get_account logic
        print("\n=== Simulated get_account logic ===")
        org_id = "OEM-HARMONIQ"  # From simulated session
        display_name = _oem_org_to_display_name(org_id)
        print(f"  org_id={org_id!r} -> orgDisplayName={display_name!r}")

if __name__ == "__main__":
    main()
