#!/usr/bin/env python3
"""
Fix the Project Type field structure - ensure Load Project field closes properly
"""

import re
from pathlib import Path

script_dir = Path(__file__).parent
html_file = script_dir / "html_body.html"

with open(html_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix: Ensure Load Project field closes before Project Type field
# Pattern: help text closes, then Project Type field starts (missing closing div)
pattern = r'(<div class="help">Pick a saved project[^<]*</div>)\s*(<div class="field">\s*<label>Project Type</label>)'

if re.search(pattern, content):
    # Add the missing closing div for Load Project field
    content = re.sub(
        pattern,
        r'\1\n        </div>\n        \2',
        content
    )
    print("Fixed: Added missing closing div for Load Project field")
    
    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Structure fixed successfully!")
else:
    print("Pattern not found - structure may already be correct")
