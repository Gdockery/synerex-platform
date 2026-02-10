#!/usr/bin/env python3
"""Validate JavaScript syntax and find the exact error"""
import sys
from pathlib import Path

def find_syntax_errors(js_file_path):
    """Find syntax errors in JavaScript file"""
    with open(js_file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    lines = content.split('\n')
    
    # Check around line 9791 (which corresponds to ~17815 in rendered HTML)
    print(f"Checking JavaScript file: {js_file_path}")
    print(f"Total lines: {len(lines)}")
    print(f"\nChecking lines 9785-9800 (around the problematic area):")
    print("-" * 80)
    
    for i in range(9784, min(9800, len(lines))):
        line = lines[i]
        line_num = i + 1
        print(f"Line {line_num:5d}: {repr(line[:100])}")
        
        # Check for common syntax errors
        if line.strip().startswith('if') and '(' not in line and '{' not in line:
            print(f"  ⚠️  POTENTIAL ISSUE: 'if' statement without condition")
        if line.count('(') != line.count(')'):
            print(f"  ⚠️  POTENTIAL ISSUE: Unbalanced parentheses")
        if line.count('[') != line.count(']'):
            print(f"  ⚠️  POTENTIAL ISSUE: Unbalanced brackets")
        if line.count('{') != line.count('}'):
            print(f"  ⚠️  POTENTIAL ISSUE: Unbalanced braces")
    
    # Try to use Node.js to validate if available
    import subprocess
    import tempfile
    
    try:
        result = subprocess.run(['node', '--version'], capture_output=True, timeout=2, text=True)
        if result.returncode == 0:
            print(f"\nNode.js is available. Validating syntax...")
            with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False, encoding='utf-8') as tmp:
                tmp.write(content)
                tmp_path = tmp.name
            
            try:
                result = subprocess.run(['node', '--check', tmp_path], 
                                      capture_output=True, timeout=10, text=True)
                if result.returncode != 0:
                    print(f"\n❌ Node.js syntax validation found errors:")
                    print(result.stderr)
                    print(result.stdout)
                else:
                    print(f"\n✅ Node.js syntax validation passed")
            finally:
                import os
                try:
                    os.unlink(tmp_path)
                except:
                    pass
    except (subprocess.TimeoutExpired, FileNotFoundError):
        print(f"\n⚠️  Node.js not available - skipping syntax validation")

if __name__ == '__main__':
    js_file = Path(__file__).parent / "static" / "javascript_functions.js"
    if not js_file.exists():
        print(f"Error: {js_file} not found")
        sys.exit(1)
    find_syntax_errors(js_file)
