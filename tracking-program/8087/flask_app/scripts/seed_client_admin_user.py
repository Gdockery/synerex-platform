#!/usr/bin/env python3
"""
Seed a Client Admin user for testing the Tracking program.
Creates Cloud Kitchen client if needed, then creates a Client Admin (role 2) with a known password.

Usage (from tracking-program/8087/flask_app):
    python scripts/seed_client_admin_user.py [email] [password]

Examples:
    python scripts/seed_client_admin_user.py
    python scripts/seed_client_admin_user.py clientadmin@example.com client123

Default credentials (same as ensure_client_admin_user in db_migrations):
    Email: clientadmin@example.com
    Password: client123

Note: When running via Docker, ensure_client_admin_user() runs automatically on startup.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app import create_app
from app.db.request_session import get_session
from app.models.client import Client
from app.models.user import User
import bcrypt


DEFAULT_EMAIL = "clientadmin@example.com"
DEFAULT_PASSWORD = "client123"


def seed_client_admin(email: str = DEFAULT_EMAIL, password: str = DEFAULT_PASSWORD):
    """Create or update Client Admin user for testing. Uses Cloud Kitchen as client."""
    app = create_app()
    with app.app_context():
        sess = get_session()

        # Get or create Cloud Kitchen client (legacy org_id or sponsor_org_id)
        client = sess.query(Client).filter(
            Client.isDeleted == False,
            Client.name.ilike("%Cloud Kitchen%"),
        ).first()
        if not client:
            # Create a test client with org_id for License check
            client = Client(
                name="Cloud Kitchen",
                org_id="OEM-HARMONIQ",
                isDeleted=False,
            )
            sess.add(client)
            sess.flush()
            sess.commit()
            print(f"[OK] Created client: {client.name} (id={client.id})")
        else:
            print(f"[OK] Using client: {client.name} (id={client.id})")

        # Get or create user
        user = sess.query(User).filter_by(email=email, isDeleted=False).first()
        hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=8)).decode("utf-8")

        if user:
            user.client = client.id
            user.role = 2  # Client Admin
            user.hashedPassword = hashed
            user.resetPasswordToken = ""
            sess.commit()
            print(f"[OK] Updated user {email} -> Client Admin (role 2), client {client.id}")
        else:
            user = User(
                firstName="Client",
                lastName="Admin",
                email=email,
                hashedPassword=hashed,
                role=2,  # Client Admin
                client=client.id,
                isDeleted=False,
            )
            sess.add(user)
            sess.commit()
            print(f"[OK] Created user {email} (role 2, client {client.id})")

        print(f"\nClient Admin login:")
        print(f"  Email:    {email}")
        print(f"  Password: {password}")
        print(f"\nLog in at the Tracking app to test Client Admin features.")
        return True


def main():
    email = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_EMAIL
    password = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_PASSWORD

    print(f"\n{'='*60}")
    print("Seed Client Admin User for Testing")
    print(f"{'='*60}\n")
    print(f"Email: {email}")
    print(f"Client: Cloud Kitchen (created if missing)\n")

    seed_client_admin(email, password)


if __name__ == "__main__":
    main()
