#!/usr/bin/env python3
"""
Seed the Test Client placeholder for an OEM org.
Test Client is a placeholder customer used for development and demo purposes.

Usage (from tracking-program/8087/flask_app):
    python scripts/seed_cloud_kitchen.py [org_id]

Examples:
    python scripts/seed_cloud_kitchen.py              # Default: OEM-DEMO
    python scripts/seed_cloud_kitchen.py OEM-ACME
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app import create_app
from app.db.request_session import get_session
from app.models.client import Client


def seed_test_client(org_id: str = "OEM-DEMO"):
    """Create Test Client placeholder for the given org if it doesn't exist."""
    app = create_app()
    with app.app_context():
        sess = get_session()
        existing = sess.query(Client).filter(
            Client.org_id == org_id,
            Client.name.ilike("%Test Client%"),
            Client.isDeleted == False,
        ).first()
        if existing:
            print(f"[OK] Test Client already exists: id={existing.id} name={existing.name!r} org_id={org_id}")
            return existing.id

        c = Client(
            name="Test Client",
            org_id=org_id,
            isDeleted=False,
        )
        sess.add(c)
        sess.commit()
        print(f"[OK] Created Test Client: id={c.id} org_id={org_id}")
        return c.id


# Keep backward-compatible alias
def seed_cloud_kitchen(org_id: str = "OEM-DEMO"):
    return seed_test_client(org_id)


def main():
    org_id = sys.argv[1] if len(sys.argv) > 1 else "OEM-DEMO"
    print(f"\n{'='*60}")
    print("Seed Test Client placeholder")
    print(f"{'='*60}\n")
    print(f"Org ID: {org_id}\n")
    seed_test_client(org_id)
    print("\nOEM users will see Test Client on the clients list.")


if __name__ == "__main__":
    main()
