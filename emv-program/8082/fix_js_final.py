#!/usr/bin/env python3
"""Fix JavaScript denominator - final attempt"""

import re

js_file = 'static/javascript_functions.js'
with open(js_file, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find and replace line 8884 (0-indexed would be 8883)
for i, line in enumerate(lines):
    if 'totalNormalizedPercentStep4 = (pfNormalizedKwBeforeStep4 > 0)' in line:
        # Replace this line with the corrected version
        lines[i] = '        // CRITICAL: Use weather_normalized_kw_before as denominator (same as Weather Savings % and PF Contribution %)\n'
        lines.insert(i+1, '        // This ensures: Weather Savings % + PF Contribution % = Total Utility Billing Impact %\n')
        lines.insert(i+2, '        const totalNormalizedPercentStep4 = (weatherBeforeForStep4 > 0) ? (totalSavingsKwStep4 / weatherBeforeForStep4) * 100 : 0;\n')
        print(f"Fixed line {i+1} (was using pfNormalizedKwBeforeStep4, now uses weatherBeforeForStep4)")
        break
else:
    print("Pattern not found - checking current state...")
    # Check if already fixed
    content = ''.join(lines)
    if 'totalNormalizedPercentStep4 = (weatherBeforeForStep4 > 0)' in content:
        print("Already using weatherBeforeForStep4 - fix already applied!")
    else:
        print("ERROR: Could not find the line to fix")

with open(js_file, 'w', encoding='utf-8') as f:
    f.writelines(lines)
print("JavaScript file updated")
