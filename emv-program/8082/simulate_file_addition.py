#!/usr/bin/env python3
"""
Simulate the actual file addition logic from generate_audit_package
"""

import os
import sqlite3
import shutil
import tempfile
import zipfile
from pathlib import Path
from datetime import datetime

# Simulate the exact scenario
base_dir = Path(__file__).parent
print(f"Base directory: {base_dir}")

# File IDs from the diagnostic
before_file_id = 77
after_file_id = 78

# Simulate org_id
org_id = 'admin'
org_ids_to_try = [org_id, 'admin', None]

# Create temp directory like the real code does
temp_dir = tempfile.mkdtemp()
source_data_dir = os.path.join(temp_dir, "11_Source_Data_Files")
os.makedirs(source_data_dir, exist_ok=True)

print(f"Temp directory: {temp_dir}")
print(f"Source data dir: {source_data_dir}")
print()

files_added_count = 0

for file_id, prefix in [(before_file_id, 'before'), (after_file_id, 'after')]:
    print(f"Processing {prefix} file ID: {file_id}")
    print("-" * 80)
    
    row = None
    found_org_id = None
    
    # Try each database location
    for try_org_id in org_ids_to_try:
        results_dir = base_dir / "results"
        if try_org_id:
            org_dir = results_dir / f"org_{try_org_id}"
            db_path = org_dir / "app.db"
        else:
            db_path = results_dir / "app.db"
        
        if not db_path.exists():
            continue
        
        try:
            conn = sqlite3.connect(str(db_path))
            cursor = conn.cursor()
            cursor.execute(
                "SELECT file_name, file_path, file_size, fingerprint, created_at FROM raw_meter_data WHERE id = ?",
                (int(file_id),)
            )
            row = cursor.fetchone()
            if row:
                found_org_id = try_org_id
                print(f"  Found in database: {db_path.name}")
                break
            conn.close()
        except Exception as e:
            print(f"  Error: {e}")
            continue
    
    if not row:
        print(f"  [FAILED] File ID {file_id} not found in any database")
        print()
        continue
    
    file_name, rel_path, file_size, stored_fingerprint, created_at = row
    print(f"  File Name: {file_name}")
    print(f"  File Path (from DB): {rel_path}")
    
    # Normalize path (exact code from main_hardened_ready_fixed.py)
    rel_path_normalized = None
    if rel_path:
        rel_path_normalized = rel_path.replace("\\", "/")
        abs_path = os.path.join(str(base_dir), rel_path_normalized)
        abs_path = Path(abs_path)
    else:
        abs_path = None
        rel_path_normalized = None
    
    print(f"  Normalized path: {rel_path_normalized}")
    print(f"  Absolute path: {abs_path}")
    
    # Check if file exists (exact code from main_hardened_ready_fixed.py)
    if rel_path_normalized:
        file_path = os.path.join(str(base_dir), rel_path_normalized)
        file_exists = os.path.exists(file_path)
        print(f"  File exists check: {file_exists}")
        print(f"  Full path: {file_path}")
        
        if file_exists:
            # Try to add file (exact code from main_hardened_ready_fixed.py)
            try:
                dest_file = os.path.join(source_data_dir, f"{prefix}_verified_data.csv")
                print(f"  Destination: {dest_file}")
                
                os.makedirs(os.path.dirname(dest_file), exist_ok=True)
                shutil.copy2(file_path, dest_file)
                
                # Verify copy
                if os.path.exists(dest_file):
                    file_size_copied = os.path.getsize(dest_file)
                    print(f"  [SUCCESS] File copied: {file_size_copied:,} bytes")
                    files_added_count += 1
                else:
                    print(f"  [FAILED] Copy verification failed")
            except Exception as e:
                print(f"  [ERROR] Copy failed: {e}")
                import traceback
                print(traceback.format_exc())
        else:
            print(f"  [FAILED] File does not exist at path")
    else:
        print(f"  [FAILED] No path to check")
    
    print()

print("=" * 80)
print(f"RESULT: {files_added_count} files added")
print("=" * 80)

# Test ZIP creation
if files_added_count > 0:
    zip_path = os.path.join(temp_dir, "test_audit_package.zip")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
        for file in os.listdir(source_data_dir):
            file_path = os.path.join(source_data_dir, file)
            if os.path.isfile(file_path):
                zipf.write(file_path, f"11_Source_Data_Files/{file}")
                print(f"Added to ZIP: 11_Source_Data_Files/{file}")
    
    print(f"\nZIP created: {zip_path}")
    print(f"ZIP size: {os.path.getsize(zip_path):,} bytes")
    
    # List contents
    with zipfile.ZipFile(zip_path, "r") as zipf:
        print("\nZIP contents:")
        for name in zipf.namelist():
            print(f"  - {name}")
else:
    print("\n[FAILED] No files were added, so no ZIP was created")
