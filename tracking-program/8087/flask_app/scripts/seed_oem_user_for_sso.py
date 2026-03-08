#!/usr/bin/env python3
"""
Seed a tracking User for License Service SSO (OEM admin).
The tracking program looks up User by email from the JWT - this user must exist.

Usage:
    python seed_oem_user_for_sso.py <email> [org_id] [--role 9]

Example (Harmoniq OEM):
    python seed_oem_user_for_sso.py admin@harmoniq.com OEM-HARMONIQ
"""
import sys
import os
from pathlib import Path

# Add app to path (run from 8087-flask dir)
sys.path.insert(0, str(Path(__file__).parent.parent))

from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.client import Client
import bcrypt


def seed_oem_user(email: str, org_id: str = "OEM-HARMONIQ", role: int = 9):
    """Create or update tracking User for SSO."""
    app = create_app()
    with app.app_context():
        sess = db.session
        # Find or create client for org
        client = sess.query(Client).filter(
            Client.org_id == org_id,
            Client.isDeleted == False,
        ).first()
        if not client:
            client = Client(
                name=org_id.replace("-", " ").title(),
                org_id=org_id,
                isDeleted=False,
            )
            sess.add(client)
            sess.flush()
            print(f"[OK] Created client: {client.name} ({org_id})")

        # Find or create user
        user = sess.query(User).filter_by(email=email, isDeleted=False).first()
        if user:
            user.client = client.id
            user.role = role
            sess.commit()
            print(f"[OK] Updated user {email} -> client={client.id}, role={role}")
        else:
            # Create with placeholder password (SSO uses JWT, no local login)
            hashed = bcrypt.hashpw(b"changeme", bcrypt.gensalt(rounds=8)).decode("utf-8")
            user = User(
                firstName="OEM",
                lastName="Admin",
                email=email,
                hashedPassword=hashed,
                role=role,
                client=client.id,
                isDeleted=False,
            )
            sess.add(user)
            sess.commit()
            print(f"[OK] Created user {email} (client={client.id}, role={role})")

        print(f"\nSSO login: user {email} will now work when accessing Tracking via My Account.")
        return True


def main():
    if len(sys.argv) < 2:
        print("Usage: python seed_oem_user_for_sso.py <email> [org_id]")
        print("Example: python seed_oem_user_for_sso.py admin@harmoniq.com OEM-HARMONIQ")
        sys.exit(1)
    email = sys.argv[1].strip()
    org_id = sys.argv[2].strip() if len(sys.argv) > 2 else "OEM-HARMONIQ"
    seed_oem_user(email, org_id)


if __name__ == "__main__":
    main()
