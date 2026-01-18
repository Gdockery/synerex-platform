#!/usr/bin/env python3
"""
Create Admin Organization Script

This script creates an organization in the License Service database for the admin user.
This allows the admin to have an org_id for multi-tenant database isolation.

Usage:
    python create_admin_org.py [org_id] [org_name]

Example:
    python create_admin_org.py admin "Admin Organization"
"""

import sys
import os
from pathlib import Path

# Add parent directory to path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.db import SessionLocal
from app.models.org import Organization
from app.models.user import User
from datetime import datetime
import bcrypt

def create_admin_organization(org_id=None, org_name=None):
    """Create an organization for admin user"""
    
    db = SessionLocal()
    try:
        # Default values
        if not org_id:
            org_id = "ADMIN"
        if not org_name:
            org_name = "Admin Organization"
        
        # Check if org already exists
        existing_org = db.get(Organization, org_id)
        if existing_org:
            print(f"[OK] Organization '{org_id}' already exists!")
            print(f"   Org Name: {existing_org.org_name}")
            print(f"   Org Type: {existing_org.org_type}")
            print(f"   Email: {existing_org.email}")
            return org_id
        
        # Create organization
        org = Organization(
            org_id=org_id,
            org_name=org_name,
            org_type="customer",  # Admin is a customer type
            email="admin@synerex.com",
            contact_name="System Administrator"
        )
        
        db.add(org)
        db.commit()
        
        print(f"[OK] Organization created successfully!")
        print(f"   Org ID: {org_id}")
        print(f"   Org Name: {org_name}")
        print(f"   Org Type: customer")
        print(f"   Email: admin@synerex.com")
        
        return org_id
        
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Error creating organization: {e}")
        import traceback
        traceback.print_exc()
        return None
    finally:
        db.close()

def create_admin_user(org_id, username="admin", password="admin123", email="admin@synerex.com"):
    """Create an admin user in the EMV program database"""
    
    from pathlib import Path
    import sqlite3
    
    # Path to EMV program results directory
    # Go up from scripts/ to license-service/services/license-service/ to synerex-platform root
    script_dir = Path(__file__).parent.resolve()  # scripts/
    license_service_dir = script_dir.parent  # license-service/services/license-service/
    platform_root = license_service_dir.parent.parent.parent  # synerex-platform/
    emv_results_dir = platform_root / "emv-program" / "8082" / "results"
    org_db_path = emv_results_dir / f"org_{org_id}" / "app.db"
    
    # Create directory if it doesn't exist
    org_db_path.parent.mkdir(parents=True, exist_ok=True)
    
    print(f"\n[INFO] Creating admin user in EMV program database...")
    print(f"   Database: {org_db_path}")
    
    try:
        conn = sqlite3.connect(str(org_db_path))
        cursor = conn.cursor()
        
        # Create users table if it doesn't exist
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'user',
                status TEXT DEFAULT 'active',
                full_name TEXT,
                pe_license_number TEXT,
                state TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT
            )
        """)
        
        # Check if user already exists
        cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
        existing = cursor.fetchone()
        
        if existing:
            print(f"   [OK] User '{username}' already exists in org database")
        else:
            # Hash password
            import hashlib
            password_hash = hashlib.sha256(password.encode()).hexdigest()
            
            # Create user
            cursor.execute("""
                INSERT INTO users (username, email, password_hash, role, full_name, status)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (username, email, password_hash, "administrator", "System Administrator", "active"))
            
            conn.commit()
            print(f"   [OK] Admin user '{username}' created in org database")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"   [ERROR] Error creating admin user: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main function"""
    print(f"\n{'='*60}")
    print("Create Admin Organization")
    print(f"{'='*60}\n")
    
    # Get org_id and org_name from command line or use defaults
    org_id = sys.argv[1] if len(sys.argv) > 1 else None
    org_name = sys.argv[2] if len(sys.argv) > 2 else None
    
    if org_id:
        print(f"Using provided org_id: {org_id}")
    else:
        print("Using default org_id: ADMIN")
    
    if org_name:
        print(f"Using provided org_name: {org_name}")
    else:
        print("Using default org_name: Admin Organization")
    
    print()
    
    # Create organization in License Service
    org_id = create_admin_organization(org_id, org_name)
    
    if org_id:
        # Create admin user in EMV program database
        create_admin_user(org_id)
        
        print(f"\n{'='*60}")
        print("Next Steps")
        print(f"{'='*60}")
        print(f"1. [OK] Organization '{org_id}' created in License Service")
        print(f"2. [OK] Admin user created in EMV program database")
        print(f"\n3. Run the migration script to move your existing projects:")
        print(f"   cd emv-program/8082")
        print(f"   python migrate_to_multi_tenant.py {org_id}")
        print(f"\n4. When logging in, use org_id: {org_id}")
        print(f"\n[NOTE] The admin user password is 'admin123' (default)")
        print(f"   You can change this after logging in.")
    else:
        print("\n[ERROR] Failed to create organization. Please check the errors above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
