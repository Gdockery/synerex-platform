#!/usr/bin/env python3
"""
Seed a Tracking program User for an OEM that exists in the License Service.
Required for SSO: Tracking looks up User by email from JWT; if no match, login fails.

Usage:
    python seed_oem_user_for_tracking.py [license_email] [org_id]

Examples:
    # Seed Harmoniq OEM user (admin@harmoniq.com, org OEM-HARMONIQ)
    python seed_oem_user_for_tracking.py admin@harmoniq.com OEM-HARMONIQ

    # Default: admin@harmoniq.com, OEM-HARMONIQ
    python seed_oem_user_for_tracking.py
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.client import Client
import bcrypt


def seed_oem_user(email: str = "admin@harmoniq.com", org_id: str = "OEM-HARMONIQ"):
    """Create or update Tracking User for OEM SSO. Creates Client if needed."""
    app = create_app()
    with app.app_context():
        sess = db.session
        # Get or create client for org
        client = sess.query(Client).filter(
            Client.org_id == org_id,
            Client.isDeleted == False,
        ).first()
        if not client:
            client = Client(
                name="HarmoniQ",
                org_id=org_id,
                isDeleted=False,
            )
            sess.add(client)
            sess.flush()
            print(f"[OK] Created client: {client.name} (org_id={org_id})")

        # Get or create user
        user = sess.query(User).filter_by(email=email, isDeleted=False).first()
        if user:
            user.client = client.id
            user.role = 9  # OEM Admin
            sess.commit()
            print(f"[OK] Updated user {email} -> client {client.id}, role 9")
        else:
            # Create with placeholder password (SSO only - not used for login)
            hashed = bcrypt.hashpw(b"unused-sso-only", bcrypt.gensalt(rounds=8)).decode("utf-8")
            user = User(
                firstName="HarmoniQ",
                lastName="Admin",
                email=email,
                hashedPassword=hashed,
                role=9,  # OEM Admin
                client=client.id,
                isDeleted=False,
            )
            sess.add(user)
            sess.commit()
            print(f"[OK] Created user {email} (role 9, client {client.id})")

        print(f"\nSSO will work: License Service user with email {email} can now access Tracking.")
        return True


def main():
    email = sys.argv[1] if len(sys.argv) > 1 else "admin@harmoniq.com"
    org_id = sys.argv[2] if len(sys.argv) > 2 else "OEM-HARMONIQ"

    print(f"\n{'='*60}")
    print("Seed OEM User for Tracking SSO")
    print(f"{'='*60}\n")
    print(f"Email: {email}")
    print(f"Org ID: {org_id}\n")

    seed_oem_user(email, org_id)


if __name__ == "__main__":
    main()
