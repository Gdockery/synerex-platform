#!/usr/bin/env python3
"""
Create or reset an OEM user in the License Service for testing.

Usage:
    python create_or_reset_oem_user.py [org_id_or_name] [username] [password]

Examples:
    # Find Harmoniq OEM and create/reset user harmoniqadmin with password admin123
    python create_or_reset_oem_user.py harmoniq harmoniqadmin admin123

    # Use exact org_id
    python create_or_reset_oem_user.py Harmoniq harmoniqadmin admin123

If org_id_or_name is omitted, defaults to Harmoniq.
If username is omitted, defaults to harmoniqadmin.
If password is omitted, defaults to admin123.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.db import SessionLocal
from app.models.org import Organization
from app.models.user import User
import bcrypt


def create_or_reset_oem_user(org_id_or_name: str = "Harmoniq", username: str = "harmoniqadmin", password: str = "admin123"):
    """Find OEM org by id or name, create or reset user with given credentials."""
    db = SessionLocal()
    try:
        # Find org: exact org_id match, or org_name containing search (case-insensitive)
        org = db.get(Organization, org_id_or_name)
        if not org:
            orgs = db.query(Organization).filter(
                Organization.org_type == "oem",
                Organization.org_name.ilike(f"%{org_id_or_name}%")
            ).all()
            if not orgs:
                print(f"[ERROR] No OEM organization found with org_id or org_name containing '{org_id_or_name}'")
                orgs_all = db.query(Organization).filter(Organization.org_type == "oem").all()
                if orgs_all:
                    print("\nAvailable OEM orgs:")
                    for o in orgs_all:
                        print(f"  - {o.org_id}: {o.org_name}")
                return False
            org = orgs[0]
            print(f"[INFO] Found org by name: {org.org_id} ({org.org_name})")
        else:
            if org.org_type != "oem":
                print(f"[WARN] Org {org.org_id} ({org.org_name}) is org_type={org.org_type}, not oem. Proceeding anyway.")

        org_id = org.org_id

        # Check if user exists
        user = db.get(User, username)
        if user:
            if user.org_id != org_id:
                print(f"[ERROR] User '{username}' exists but belongs to org '{user.org_id}', not '{org_id}'.")
                return False
            # Reset password
            user.password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
            user.role = "oem_admin"
            user.is_active = True
            db.commit()
            print(f"[OK] Password reset for user '{username}' (org_id={org_id})")
        else:
            # Create user
            password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
            user = User(
                username=username,
                password_hash=password_hash,
                org_id=org_id,
                email=org.email or f"{username}@{org.org_id.lower()}.local",
                role="oem_admin",
                is_active=True,
            )
            db.add(user)
            db.commit()
            print(f"[OK] Created user '{username}' for org {org_id} ({org.org_name})")

        print(f"\nLogin credentials for Harmoniq OEM testing:")
        print(f"  Username: {username}")
        print(f"  Password: {password}")
        print(f"  Org: {org.org_name} ({org_id})")
        print(f"\nUse the License Service login (e.g. http://localhost:8080/license/auth/login) - not admin login.")
        return True

    except Exception as e:
        db.rollback()
        print(f"[ERROR] {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()


def main():
    org_arg = sys.argv[1] if len(sys.argv) > 1 else "Harmoniq"
    username_arg = sys.argv[2] if len(sys.argv) > 2 else "harmoniqadmin"
    password_arg = sys.argv[3] if len(sys.argv) > 3 else "admin123"

    print(f"\n{'='*60}")
    print("Create or Reset OEM User (for Harmoniq testing)")
    print(f"{'='*60}\n")

    ok = create_or_reset_oem_user(org_arg, username_arg, password_arg)
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
