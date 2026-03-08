#!/usr/bin/env python3
"""
Seed the Cloud Kitchen client for HarmoniQ (OEM-HARMONIQ).
Cloud Kitchen is a customer of HarmoniQ - HarmoniQ OEM users see it on the clients list.

Usage (from tracking-program/8087/flask_app):
    python scripts/seed_cloud_kitchen.py [org_id]

Examples:
    python scripts/seed_cloud_kitchen.py              # Default: OEM-HARMONIQ
    python scripts/seed_cloud_kitchen.py OEM-HARMONIQ
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app import create_app
from app.db.request_session import get_session
from app.models.client import Client


def seed_cloud_kitchen(org_id: str = "OEM-HARMONIQ"):
    """Create Cloud Kitchen client for the given org if it doesn't exist."""
    app = create_app()
    with app.app_context():
        sess = get_session()
        existing = sess.query(Client).filter(
            Client.org_id == org_id,
            Client.name.ilike("%Cloud Kitchen%"),
            Client.isDeleted == False,
        ).first()
        if existing:
            print(f"[OK] Cloud Kitchen already exists: id={existing.id} name={existing.name!r} org_id={org_id}")
            return existing.id

        c = Client(
            name="Cloud Kitchen",
            org_id=org_id,
            isDeleted=False,
        )
        sess.add(c)
        sess.commit()
        print(f"[OK] Created Cloud Kitchen client: id={c.id} org_id={org_id}")
        return c.id


def main():
    org_id = sys.argv[1] if len(sys.argv) > 1 else "OEM-HARMONIQ"
    print(f"\n{'='*60}")
    print("Seed Cloud Kitchen for HarmoniQ")
    print(f"{'='*60}\n")
    print(f"Org ID: {org_id}\n")
    seed_cloud_kitchen(org_id)
    print("\nHarmoniQ OEM users will see Cloud Kitchen on the clients list.")


if __name__ == "__main__":
    main()
