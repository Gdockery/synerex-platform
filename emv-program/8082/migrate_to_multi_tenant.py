#!/usr/bin/env python3
"""
Migration Script: Move existing data from results/app.db to org-specific database

This script migrates all data from the old shared database (results/app.db) 
to a new org-specific database (results/org_{org_id}/app.db).

Usage:
    python migrate_to_multi_tenant.py <org_id>

Example:
    python migrate_to_multi_tenant.py my_company_org_123
"""

import sqlite3
import os
import shutil
import sys
from datetime import datetime
from pathlib import Path

# Configuration
BASE_DIR = Path(__file__).parent
RESULTS_DIR = BASE_DIR / "results"
OLD_DB_PATH = RESULTS_DIR / "app.db"
BACKUP_DIR = RESULTS_DIR / "backups"

def get_all_tables(conn):
    """Get list of all tables in the database"""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
        ORDER BY name
    """)
    return [row[0] for row in cursor.fetchall()]

def get_table_schema(conn, table_name):
    """Get the CREATE TABLE statement for a table"""
    cursor = conn.cursor()
    cursor.execute(f"SELECT sql FROM sqlite_master WHERE type='table' AND name='{table_name}'")
    result = cursor.fetchone()
    return result[0] if result else None

def get_table_row_count(conn, table_name):
    """Get the number of rows in a table"""
    cursor = conn.cursor()
    try:
        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        return cursor.fetchone()[0]
    except:
        return 0

def copy_table_data(source_conn, target_conn, table_name):
    """Copy all data from source table to target table"""
    source_cursor = source_conn.cursor()
    target_cursor = target_conn.cursor()
    
    try:
        # Get all data from source
        source_cursor.execute(f"SELECT * FROM {table_name}")
        rows = source_cursor.fetchall()
        
        if not rows:
            return 0
        
        # Get column names
        columns = [description[0] for description in source_cursor.description]
        placeholders = ','.join(['?' for _ in columns])
        column_names = ','.join(columns)
        
        # Insert data into target
        insert_sql = f"INSERT OR REPLACE INTO {table_name} ({column_names}) VALUES ({placeholders})"
        target_cursor.executemany(insert_sql, rows)
        target_conn.commit()
        
        return len(rows)
    except Exception as e:
        print(f"  [WARNING] Error copying {table_name}: {e}")
        target_conn.rollback()
        return 0

def create_backup():
    """Create a backup of the old database"""
    if not OLD_DB_PATH.exists():
        print(f"[ERROR] Old database not found at {OLD_DB_PATH}")
        return False
    
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = BACKUP_DIR / f"app.db.backup_{timestamp}"
    
    print(f"[INFO] Creating backup: {backup_path}")
    shutil.copy2(OLD_DB_PATH, backup_path)
    print(f"[OK] Backup created: {backup_path}")
    return True

def migrate_database(org_id):
    """Migrate all data from old database to org-specific database"""
    
    if not OLD_DB_PATH.exists():
        print(f"[ERROR] Old database not found at {OLD_DB_PATH}")
        print("   Nothing to migrate. The database may have already been migrated or doesn't exist.")
        return False
    
    # Create org-specific directory
    org_dir = RESULTS_DIR / f"org_{org_id}"
    org_dir.mkdir(parents=True, exist_ok=True)
    new_db_path = org_dir / "app.db"
    
    print(f"\n{'='*60}")
    print(f"Migration: {OLD_DB_PATH} -> {new_db_path}")
    print(f"{'='*60}\n")
    
    # Connect to old database
    print("[INFO] Reading old database...")
    old_conn = sqlite3.connect(str(OLD_DB_PATH))
    old_conn.row_factory = sqlite3.Row
    
    # Get all tables
    tables = get_all_tables(old_conn)
    if not tables:
        print("[WARNING] No tables found in old database")
        old_conn.close()
        return False
    
    print(f"   Found {len(tables)} tables: {', '.join(tables)}\n")
    
    # Create new database
    print(f"[INFO] Creating new database: {new_db_path}")
    new_conn = sqlite3.connect(str(new_db_path))
    new_conn.row_factory = sqlite3.Row
    
    # Migrate each table
    total_rows = 0
    migrated_tables = []
    failed_tables = []
    
    for table in tables:
        print(f"[INFO] Migrating table: {table}")
        
        # Get row count
        row_count = get_table_row_count(old_conn, table)
        print(f"   Rows to migrate: {row_count}")
        
        if row_count == 0:
            print(f"   [SKIP] Skipping empty table")
            continue
        
        # Get schema and create table
        schema = get_table_schema(old_conn, table)
        if schema:
            try:
                new_conn.execute(schema)
                new_conn.commit()
                print(f"   [OK] Table created")
            except Exception as e:
                print(f"   [WARNING] Table may already exist: {e}")
        
        # Copy data
        rows_copied = copy_table_data(old_conn, new_conn, table)
        if rows_copied > 0:
            print(f"   [OK] Copied {rows_copied} rows")
            total_rows += rows_copied
            migrated_tables.append(table)
        else:
            print(f"   [WARNING] No rows copied")
            failed_tables.append(table)
        
        print()
    
    # Close connections
    old_conn.close()
    new_conn.close()
    
    # Summary
    print(f"{'='*60}")
    print("Migration Summary")
    print(f"{'='*60}")
    print(f"[OK] Successfully migrated: {len(migrated_tables)} tables")
    print(f"   Total rows migrated: {total_rows}")
    print(f"   Tables: {', '.join(migrated_tables)}")
    
    if failed_tables:
        print(f"\n[WARNING] Failed or empty tables: {len(failed_tables)}")
        print(f"   Tables: {', '.join(failed_tables)}")
    
    print(f"\n[INFO] New database location: {new_db_path}")
    print(f"[OK] Migration complete!\n")
    
    return True

def verify_migration(org_id):
    """Verify that the migration was successful"""
    old_db_path = RESULTS_DIR / "app.db"
    new_db_path = RESULTS_DIR / f"org_{org_id}" / "app.db"
    
    if not new_db_path.exists():
        print(f"[ERROR] New database not found at {new_db_path}")
        return False
    
    print(f"\n{'='*60}")
    print("Verification")
    print(f"{'='*60}\n")
    
    # Compare table counts
    old_conn = sqlite3.connect(str(old_db_path))
    new_conn = sqlite3.connect(str(new_db_path))
    
    old_tables = get_all_tables(old_conn)
    new_tables = get_all_tables(new_conn)
    
    print(f"Old database tables: {len(old_tables)}")
    print(f"New database tables: {len(new_tables)}")
    
    if len(old_tables) != len(new_tables):
        print(f"[WARNING] Table count mismatch!")
        print(f"   Missing in new DB: {set(old_tables) - set(new_tables)}")
        print(f"   Extra in new DB: {set(new_tables) - set(old_tables)}")
    else:
        print(f"[OK] Table count matches")
    
    # Compare row counts for each table
    print(f"\nRow count comparison:")
    all_match = True
    for table in old_tables:
        old_count = get_table_row_count(old_conn, table)
        new_count = get_table_row_count(new_conn, table) if table in new_tables else 0
        
        status = "[OK]" if old_count == new_count else "[ERROR]"
        print(f"   {status} {table}: {old_count} -> {new_count}")
        
        if old_count != new_count:
            all_match = False
    
    old_conn.close()
    new_conn.close()
    
    if all_match:
        print(f"\n[OK] Verification passed! All data migrated successfully.")
    else:
        print(f"\n[WARNING] Verification found discrepancies. Please review.")
    
    return all_match

def main():
    """Main migration function"""
    if len(sys.argv) < 2:
        print("Usage: python migrate_to_multi_tenant.py <org_id>")
        print("\nExample:")
        print("  python migrate_to_multi_tenant.py my_company_org_123")
        print("\nNote: You need to get your org_id from the License Service.")
        print("      It's usually in format like 'org_abc123' or similar.")
        sys.exit(1)
    
    org_id = sys.argv[1].strip()
    
    if not org_id:
        print("[ERROR] Error: org_id cannot be empty")
        sys.exit(1)
    
    # Remove 'org_' prefix if user included it
    if org_id.startswith('org_'):
        org_id = org_id[4:]
    
    print(f"\n{'='*60}")
    print(f"Multi-Tenant Database Migration")
    print(f"{'='*60}")
    print(f"Organization ID: {org_id}")
    print(f"Source: {OLD_DB_PATH}")
    print(f"Target: results/org_{org_id}/app.db")
    print(f"{'='*60}\n")
    
    # Confirm
    response = input("[WARNING] This will migrate all data to the org-specific database.\n   Continue? (yes/no): ")
    if response.lower() not in ['yes', 'y']:
        print("Migration cancelled.")
        sys.exit(0)
    
    # Create backup
    if not create_backup():
        print("[WARNING] Backup failed, but continuing with migration...")
    
    # Migrate
    success = migrate_database(org_id)
    
    if success:
        # Verify
        verify_migration(org_id)
        
        print(f"\n{'='*60}")
        print("Next Steps")
        print(f"{'='*60}")
        print("1. [OK] Migration complete!")
        print("2. Update your login to use org_id:", org_id)
        print("3. Test accessing your projects with the new org_id")
        print("4. Once verified, you can archive the old database:")
        print(f"   mv {OLD_DB_PATH} {RESULTS_DIR / 'app.db.old'}")
        print("\n[WARNING] Important: Keep the backup until you've verified everything works!")
        print(f"   Backup location: {BACKUP_DIR}")
    else:
        print("\n[ERROR] Migration failed. Please check the errors above.")
        sys.exit(1)

if __name__ == "__main__":
    main()