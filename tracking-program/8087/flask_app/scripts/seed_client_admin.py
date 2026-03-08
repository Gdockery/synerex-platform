#!/usr/bin/env python3
"""
Seed a Client Admin user for testing.
Creates a test client (if needed) and a Client Admin user with known credentials.

Usage (from tracking-program/8087/flask_app, with venv/Docker):
    python scripts/seed_client_admin.py [email] [password] [client_name] [org_id]

    # If using Docker:
    docker compose exec tracking-program python scripts/seed_client_admin.py

Examples:
    python scripts/seed_client_admin.py
    python scripts/seed_client_admin.py clientadmin@example.com client123
    python scripts/seed_client_admin.py clientadmin@example.com client123 "Test Company"
    python scripts/seed_client_admin.py clientadmin@example.com client123 "Cloud Kitchen" OEM-HARMONIQ
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.client import Client
import bcrypt


DEFAULT_EMAIL = "clientadmin@example.com"
DEFAULT_PASSWORD = "client123"
DEFAULT_CLIENT_NAME = "Test Client"
DEFAULT_ORG_ID = "CUSTOMER-TEST-CLIENT"


def seed_client_admin(
    email: str = DEFAULT_EMAIL,
    password: str = DEFAULT_PASSWORD,
    client_name: str = DEFAULT_CLIENT_NAME,
    org_id: str = DEFAULT_ORG_ID,
):
    """Create or update Client Admin user for testing. Creates client if needed."""
    app = create_app()
    with app.app_context():
        sess = db.session
        uri = app.config.get("SQLALCHEMY_DATABASE_URI", "")
        if ":memory:" in uri:
            print("[WARN] Using in-memory DB - changes will not persist.")
            return False

        # Get or create client (prefer by name when org has multiple clients)
        client = (
            sess.query(Client)
            .filter(
                Client.org_id == org_id,
                Client.isDeleted == False,
            )
            .filter(Client.name.ilike(f"%{client_name}%"))
            .first()
        )
        if not client:
            client = (
                sess.query(Client)
                .filter(Client.org_id == org_id, Client.isDeleted == False)
                .first()
            )
        if not client:
            client = Client(
                name=client_name,
                org_id=org_id,
                isDeleted=False,
            )
            sess.add(client)
            sess.flush()
            print(f"[OK] Created client: {client.name} (org_id={org_id})")
        else:
            print(f"[OK] Using existing client: {client.name} (id={client.id})")

        # Get or create user
        user = sess.query(User).filter_by(email=email, isDeleted=False).first()
        hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt(rounds=8)).decode("utf-8")

        if user:
            user.client = client.id
            user.role = 2  # Client Admin
            user.hashedPassword = hashed
            sess.commit()
            print(f"[OK] Updated user {email} -> Client Admin (role 2), client {client.id}")
        else:
            # Handle soft-deleted user
            existing_deleted = sess.query(User).filter_by(email=email, isDeleted=True).first()
            if existing_deleted:
                existing_deleted.isDeleted = False
                existing_deleted.client = client.id
                existing_deleted.role = 2
                existing_deleted.hashedPassword = hashed
                existing_deleted.firstName = "Client"
                existing_deleted.lastName = "Admin"
                sess.commit()
                print(f"[OK] Re-enabled user {email} -> Client Admin (role 2)")
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
                print(f"[OK] Created Client Admin: {email} (role 2, client {client.id})")

        print(f"\nLogin credentials:")
        print(f"  Email:    {email}")
        print(f"  Password: {password}")
        print(f"\nClient Admin can manage client '{client.name}' and create projects within it.")
        return True


def main():
    email = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_EMAIL
    password = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_PASSWORD
    client_name = sys.argv[3] if len(sys.argv) > 3 else DEFAULT_CLIENT_NAME
    org_id = sys.argv[4] if len(sys.argv) > 4 else DEFAULT_ORG_ID

    print(f"\n{'='*60}")
    print("Seed Client Admin for Testing")
    print(f"{'='*60}\n")
    print(f"Email: {email}")
    print(f"Client: {client_name}")
    print(f"Org ID: {org_id}\n")

    seed_client_admin(email=email, password=password, client_name=client_name, org_id=org_id)


if __name__ == "__main__":
    main()
