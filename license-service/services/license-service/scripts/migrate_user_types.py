#!/usr/bin/env python3
"""
Migration: User Types Implementation
- Create admin_users table
- Add role column to users (if missing)
- Add approval_status column to billing_orders (if missing)

Run from license-service dir: python scripts/migrate_user_types.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import text
from app.db import engine
from app.config import settings


def column_exists(conn, table: str, column: str) -> bool:
    """Check if column exists in table (MySQL)."""
    r = conn.execute(text(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS "
        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :tbl AND COLUMN_NAME = :col"
    ), {"tbl": table, "col": column})
    return r.fetchone() is not None


def table_exists(conn, table: str) -> bool:
    """Check if table exists (MySQL)."""
    r = conn.execute(text(
        "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES "
        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :tbl"
    ), {"tbl": table})
    return r.fetchone() is not None


def migrate():
    if not settings.db_url or "mysql" not in settings.db_url.lower():
        print("This migration is for MySQL. DB_URL must be a MySQL connection string.")
        sys.exit(1)

    with engine.connect() as conn:
        # 1. Create admin_users table
        if not table_exists(conn, "admin_users"):
            print("Creating admin_users table...")
            conn.execute(text("""
                CREATE TABLE admin_users (
                    username VARCHAR(255) PRIMARY KEY,
                    password_hash VARCHAR(255) NOT NULL,
                    role VARCHAR(64) NOT NULL DEFAULT 'admin',
                    support_org_ids TEXT,
                    is_active TINYINT(1) NOT NULL DEFAULT 1,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
            """))
            conn.commit()
            print("  admin_users created.")
        else:
            print("  admin_users already exists.")

        # 2. Add role to users
        if not column_exists(conn, "users", "role"):
            print("Adding role column to users...")
            conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(64) NULL"))
            conn.commit()
            print("  role column added.")
        else:
            print("  users.role already exists.")

        # 3. Add sponsor_org_id to organizations (OEM sponsor for customer/pe)
        if not column_exists(conn, "organizations", "sponsor_org_id"):
            print("Adding sponsor_org_id column to organizations...")
            conn.execute(text("ALTER TABLE organizations ADD COLUMN sponsor_org_id VARCHAR(255) NULL"))
            conn.commit()
            print("  sponsor_org_id column added.")
        else:
            print("  organizations.sponsor_org_id already exists.")

        # 4. Add approval_status to billing_orders
        if not column_exists(conn, "billing_orders", "approval_status"):
            print("Adding approval_status column to billing_orders...")
            conn.execute(text("ALTER TABLE billing_orders ADD COLUMN approval_status VARCHAR(64) NULL"))
            conn.commit()
            print("  approval_status column added.")
        else:
            print("  billing_orders.approval_status already exists.")

    print("\nMigration complete.")


if __name__ == "__main__":
    migrate()
