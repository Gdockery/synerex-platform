#!/usr/bin/env python3
"""
JavaScript Console Log Cleanup Script
Removes excessive console.log statements while preserving essential error logging
"""

import re
import os
import shutil
from datetime import datetime

def cleanup_js_file(file_path):
    """Clean up console logging in a JavaScript file"""
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return False
    
    # Create backup
    backup_path = f"{file_path}.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    shutil.copy2(file_path, backup_path)
    print(f"Created backup: {backup_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_lines = content.count('\n')
    
    # Remove excessive console.log statements but keep error logging
    # Keep console.error, console.warn, and important debug logs
    patterns_to_remove = [
        # Remove simple console.log statements
        (r'^\s*console\.log\([^;]*\);\s*$', ''),
        # Remove console.log statements with comments
        (r'^\s*console\.log\([^;]*\);\s*//.*$', ''),
        # Remove debug console.log blocks
        (r'^\s*console\.log\(\'=== .* ===\'\);\s*$', ''),
        (r'^\s*console\.log\(\'=== .* ===\'\);\s*$', ''),
        # Remove simple debug logs
        (r'^\s*console\.log\(\'[^\']*debug[^\']*\'\);\s*$', ''),
        (r'^\s*console\.log\(\'[^\']*DEBUG[^\']*\'\);\s*$', ''),
    ]
    
    # Apply patterns
    for pattern, replacement in patterns_to_remove:
        content = re.sub(pattern, replacement, content, flags=re.MULTILINE)
    
    # Clean up empty lines (more than 2 consecutive)
    content = re.sub(r'\n\s*\n\s*\n+', '\n\n', content)
    
    # Write cleaned content
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    new_lines = content.count('\n')
    removed_lines = original_lines - new_lines
    
    print(f"Cleaned {file_path}:")
    print(f"  Original lines: {original_lines}")
    print(f"  New lines: {new_lines}")
    print(f"  Removed lines: {removed_lines}")
    
    return True

def main():
    """Main cleanup function"""
    js_files = [
        '8082/javascript_functions.js',
        '8082/static/main_dashboard.js',
        '8082/static/file_selection.js',
        '8082/static/raw_files_list.js'
    ]
    
    print("JavaScript Console Log Cleanup")
    print("=" * 40)
    
    for js_file in js_files:
        if os.path.exists(js_file):
            print(f"\nProcessing: {js_file}")
            cleanup_js_file(js_file)
        else:
            print(f"\nSkipping (not found): {js_file}")
    
    print("\n" + "=" * 40)
    print("Cleanup complete!")
    print("Backup files created with timestamp suffix")

if __name__ == "__main__":
    main()












