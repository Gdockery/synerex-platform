#!/usr/bin/env python3
"""Fix the file ID assignment bug in generate_audit_package function."""

import re

file_path = 'main_hardened_ready_fixed.py'

# Read the file
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern to match the problematic code block
pattern = r'(\s+)# Use database file IDs as authoritative source \(like working version\)\n(\s+)if row\[0\]:\n(\s+)before_file_id = int\(row\[0\]\) if row\[0\] else None\n(\s+)if row\[1\]:\n(\s+)after_file_id = int\(row\[1\]\) if row\[1\] else None'

# Replacement with fixed code
replacement = r'\1# Use database file IDs as authoritative source (like working version)\n\1# Always assign from database when row exists (authoritative source)\n\1before_file_id = int(row[0]) if row[0] is not None and row[0] != "" else None\n\1after_file_id = int(row[1]) if row[1] is not None and row[1] != "" else None'

# Perform the replacement
new_content = re.sub(pattern, replacement, content)

# Check if replacement was made
if new_content != content:
    # Write the fixed content back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Fixed file ID assignment bug in {file_path}")
    print("  Removed conditional checks that prevented None values from being assigned")
else:
    print(f"Pattern not found in {file_path}")
    print("  The code may have already been fixed or the pattern doesn't match")
