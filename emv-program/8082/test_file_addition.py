#!/usr/bin/env python3
"""
Test script to simulate the file addition logic
"""

from pathlib import Path
import os

# Simulate the exact scenario from the diagnostic
base_dir = Path(r"C:\Users\Admin\OneDrive\Documents\synerex-platform\emv-program\8082")
rel_path = "files/protected/verified/20260121_115453_Trouw Lethbridge - OFF - 2025-12-19 to 2025-12-24 (1 minute intervals).csv"
file_name = "Trouw Lethbridge - OFF - 2025-12-19 to 2025-12-24 (1 minute intervals).csv"

print("=" * 80)
print("SIMULATING FILE ADDITION LOGIC")
print("=" * 80)
print()

# Step 1: Normalize path
rel_path_normalized = rel_path.replace("\\", "/")
print(f"1. rel_path_normalized: {rel_path_normalized}")

# Step 2: Create absolute path
abs_path = (base_dir / rel_path_normalized).resolve()
print(f"2. abs_path: {abs_path}")
print(f"3. abs_path.exists() (Path): {abs_path.exists()}")

# Step 3: Try os.path.exists
abs_path_str = str(abs_path)
print(f"4. abs_path_str: {abs_path_str}")
print(f"5. os.path.exists(abs_path_str): {os.path.exists(abs_path_str)}")

# Step 4: Check if file would be found
if abs_path and abs_path.exists():
    print("6. [SUCCESS] File found using Path.exists()")
    verified_file_found = True
    verified_file_path = abs_path
elif abs_path and os.path.exists(abs_path_str):
    print("6. [SUCCESS] File found using os.path.exists()")
    verified_file_found = True
    verified_file_path = abs_path
else:
    print("6. [FAILED] File not found")
    verified_file_found = False
    verified_file_path = None
    
    # Try alternative paths
    print("\n7. Trying alternative paths...")
    alternative_paths = [
        base_dir / "files" / "protected" / "verified" / file_name,
        base_dir / "files" / "verified" / file_name,
    ]
    if rel_path_normalized:
        exact_db_path = base_dir / rel_path_normalized
        alternative_paths.insert(0, exact_db_path)
    
    for alt_path in alternative_paths:
        if alt_path:
            path_str = str(alt_path)
            if os.path.exists(path_str):
                print(f"   [FOUND] {alt_path}")
                verified_file_found = True
                verified_file_path = Path(path_str)
                break
            elif alt_path.exists():
                print(f"   [FOUND] {alt_path} (Path.exists)")
                verified_file_found = True
                verified_file_path = alt_path
                break
            else:
                print(f"   [NOT FOUND] {alt_path}")

print()
print("=" * 80)
print("RESULT:")
print(f"verified_file_found: {verified_file_found}")
print(f"verified_file_path: {verified_file_path}")
print("=" * 80)

if verified_file_found and verified_file_path:
    print("\n[SUCCESS] File would be added to ZIP")
    print(f"File size: {verified_file_path.stat().st_size:,} bytes")
else:
    print("\n[FAILED] File would NOT be added to ZIP")
