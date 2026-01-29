#!/usr/bin/env python3
"""
Test the actual audit package file addition flow
"""

import sys
import os
from pathlib import Path

# Add the directory to the path so we can import
sys.path.insert(0, str(Path(__file__).parent))

# Simulate the exact data structure from frontend
test_data = {
    "before_file_id": 77,
    "after_file_id": 78,
    "analysis_session_id": "ANALYSIS_20260122_172941_e755f4d7",
    "config": {
        "company": "Trouw",
        "facility_address": "Lethbridge"
    }
}

print("=" * 80)
print("TESTING AUDIT PACKAGE FILE ADDITION FLOW")
print("=" * 80)
print()

# Simulate the code logic
base_dir = Path(__file__).parent
print(f"Base directory: {base_dir}")

# Extract file IDs (simulating line 29923-29924)
before_file_id = test_data.get('before_file_id') or (test_data.get('config', {}) or {}).get('before_file_id')
after_file_id = test_data.get('after_file_id') or (test_data.get('config', {}) or {}).get('after_file_id')
analysis_session_id = test_data.get('analysis_session_id')

print(f"Extracted file IDs:")
print(f"  before_file_id: {before_file_id}")
print(f"  after_file_id: {after_file_id}")
print(f"  analysis_session_id: {analysis_session_id}")
print()

if before_file_id or after_file_id:
    print("File IDs found, proceeding to database lookup...")
    print()
    
    # Try to query database (simulating the code)
    import sqlite3
    org_ids_to_try = ['admin', 'ADMIN', None]
    
    for file_id, prefix in [(before_file_id, 'before'), (after_file_id, 'after')]:
        if file_id:
            print(f"Processing {prefix} file ID: {file_id}")
            row = None
            found_org_id = None
            
            for try_org_id in org_ids_to_try:
                # Get database path
                results_dir = base_dir / "results"
                if try_org_id:
                    org_dir = results_dir / f"org_{try_org_id}"
                    db_path = org_dir / "app.db"
                else:
                    db_path = results_dir / "app.db"
                
                print(f"  Trying database: {db_path} (exists: {db_path.exists()})")
                
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
                        print(f"  [FOUND] in database: {db_path.name}")
                        break
                    conn.close()
                except Exception as e:
                    print(f"  [ERROR] {e}")
                    continue
            
            if row:
                file_name, rel_path, file_size, stored_fingerprint, created_at = row
                print(f"  File Name: {file_name}")
                print(f"  File Path (stored): {rel_path}")
                print()
                
                # Normalize path
                rel_path_normalized = rel_path.replace("\\", "/") if rel_path else None
                abs_path = (base_dir / rel_path_normalized).resolve() if rel_path_normalized else None
                
                print(f"  Normalized path: {rel_path_normalized}")
                print(f"  Absolute path: {abs_path}")
                print(f"  Path.exists(): {abs_path.exists() if abs_path else 'N/A'}")
                print(f"  os.path.exists(): {os.path.exists(str(abs_path)) if abs_path else 'N/A'}")
                print()
                
                # Check if file would be found
                verified_file_found = False
                verified_file_path = None
                
                if abs_path and abs_path.exists():
                    verified_file_found = True
                    verified_file_path = abs_path
                    print(f"  [SUCCESS] File found at primary path")
                elif abs_path and os.path.exists(str(abs_path)):
                    verified_file_found = True
                    verified_file_path = abs_path
                    print(f"  [SUCCESS] File found using os.path.exists")
                else:
                    # Try direct path fallback
                    if rel_path_normalized:
                        direct_path = os.path.join(str(base_dir), rel_path_normalized)
                        if os.path.exists(direct_path):
                            verified_file_found = True
                            verified_file_path = Path(direct_path)
                            print(f"  [SUCCESS] File found using direct path fallback: {direct_path}")
                        else:
                            print(f"  [FAILED] File not found even with direct path: {direct_path}")
                    else:
                        print(f"  [FAILED] No path to check")
                
                print(f"  Final result: verified_file_found={verified_file_found}, verified_file_path={verified_file_path}")
                print()
            else:
                print(f"  [FAILED] File ID {file_id} not found in any database")
                print()
else:
    print("No file IDs found in test data")
    print()

print("=" * 80)
