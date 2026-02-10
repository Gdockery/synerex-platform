#!/usr/bin/env python3
"""
Script to check database file paths for file IDs 77 and 78
"""

import sqlite3
import os
from pathlib import Path

# Get the base directory
base_dir = Path(__file__).parent

# Try different database locations
org_ids_to_try = ['admin', None]

def get_db_path(org_id=None):
    """Get database path for org_id"""
    results_dir = base_dir / "results"
    if org_id:
        org_dir = results_dir / f"org_{org_id}"
        return org_dir / "app.db"
    else:
        return results_dir / "app.db"

def check_file_paths(file_ids):
    """Check file paths in database"""
    print("=" * 80)
    print("CHECKING FILE PATHS IN DATABASE")
    print("=" * 80)
    print()
    
    for file_id in file_ids:
        print(f"Checking file ID: {file_id}")
        print("-" * 80)
        
        found = False
        for org_id in org_ids_to_try:
            db_path = get_db_path(org_id)
            if not db_path.exists():
                print(f"  Database not found: {db_path}")
                continue
            
            try:
                conn = sqlite3.connect(str(db_path))
                cursor = conn.cursor()
                
                cursor.execute("""
                    SELECT id, file_name, file_path, file_size, fingerprint, created_at
                    FROM raw_meter_data
                    WHERE id = ?
                """, (file_id,))
                
                row = cursor.fetchone()
                if row:
                    found = True
                    file_id_db, file_name, file_path, file_size, fingerprint, created_at = row
                    print(f"  Found in database: {db_path.name}")
                    print(f"  File Name: {file_name}")
                    print(f"  File Path (stored): {file_path}")
                    print(f"  File Size: {file_size}")
                    print(f"  Created At: {created_at}")
                    
                    # Check if file exists
                    if file_path:
                        # Try relative path
                        abs_path = (base_dir / file_path).resolve()
                        print(f"  Absolute Path: {abs_path}")
                        print(f"  File Exists: {abs_path.exists()}")
                        
                        if not abs_path.exists():
                            # Try alternative locations
                            print(f"  File not found at stored path. Checking alternatives...")
                            alt_paths = [
                                base_dir / "files" / "protected" / "verified" / file_name,
                                base_dir / "files" / "verified" / file_name,
                                base_dir / file_path if file_path else None,
                            ]
                            
                            for alt_path in alt_paths:
                                if alt_path and alt_path.exists():
                                    print(f"  [OK] Found at alternative path: {alt_path}")
                                    break
                            else:
                                print(f"  [X] File not found in any expected location")
                    else:
                        print(f"  [WARNING] No file_path stored in database")
                    
                    print()
                    break
                
                conn.close()
            except Exception as e:
                print(f"  Error querying {db_path.name}: {e}")
                continue
        
        if not found:
            print(f"  [X] File ID {file_id} not found in any database")
            print()
    
    print("=" * 80)
    print("CHECKING VERIFIED DIRECTORY")
    print("=" * 80)
    verified_dir = base_dir / "files" / "protected" / "verified"
    print(f"Verified directory: {verified_dir}")
    print(f"Directory exists: {verified_dir.exists()}")
    
    if verified_dir.exists():
        csv_files = list(verified_dir.glob("*.csv"))
        print(f"CSV files found: {len(csv_files)}")
        print()
        print("Trouw Lethbridge files:")
        for csv_file in csv_files:
            if "Trouw" in csv_file.name:
                print(f"  - {csv_file.name} ({csv_file.stat().st_size:,} bytes)")
    else:
        print("  [X] Verified directory does not exist!")

if __name__ == "__main__":
    check_file_paths([77, 78])
