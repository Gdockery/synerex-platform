#!/usr/bin/env python3
"""
Debug script to simulate org display name flow.
Run from flask_app: python scripts/debug_org_display.py
"""
import os
import sys

# Ensure we can import app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set env for License service (Docker uses license-service:8000)
os.environ.setdefault("LICENSE_SERVICE_URL", "http://localhost:8000")

from app import create_app
from app.services.org_registry import get_org_by_id

def main():
    app = create_app()
    with app.app_context():
        print("=== Testing get_org_by_id ===")
        for org_id in ["OEM-HARMONIQ", "OEM-OTHER", "INVALID"]:
            result = get_org_by_id(org_id)
            print(f"  {org_id!r} -> {result}")

        print("\n=== Testing _oem_org_to_display_name ===")
        from app.api.web_routes import _oem_org_to_display_name
        for org_id in ["OEM-HARMONIQ", "oem-harmoniq", "OEM-ACME", None, ""]:
            name = _oem_org_to_display_name(org_id)
            print(f"  {org_id!r} -> {name!r}")

        print("\n=== Simulating bootstrap (no session) ===")
        print("  Session org_id would come from login - cannot simulate without request context")
        print("  In real flow: session.get('orgId') or user.client.org_id")

if __name__ == "__main__":
    main()
