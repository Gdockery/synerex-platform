#!/usr/bin/env python3
"""Fix JavaScript denominator"""

js_file = 'static/javascript_functions.js'
with open(js_file, 'r', encoding='utf-8') as f:
    js_content = f.read()

# Replace the denominator calculation
old_line = '        const totalNormalizedPercentStep4 = (pfNormalizedKwBeforeStep4 > 0) ? (totalSavingsKwStep4 / pfNormalizedKwBeforeStep4) * 100 : 0;'
new_lines = '''        // CRITICAL: Use weather_normalized_kw_before as denominator (same as Weather Savings % and PF Contribution %)
        // This ensures: Weather Savings % + PF Contribution % = Total Utility Billing Impact %
        const totalNormalizedPercentStep4 = (weatherBeforeForStep4 > 0) ? (totalSavingsKwStep4 / weatherBeforeForStep4) * 100 : 0;'''

if old_line in js_content:
    js_content = js_content.replace(old_line, new_lines)
    with open(js_file, 'w', encoding='utf-8') as f:
        f.write(js_content)
    print("Fixed JavaScript denominator")
else:
    print("Pattern not found - checking if already fixed...")
    if 'weatherBeforeForStep4' in js_content and 'totalNormalizedPercentStep4' in js_content:
        # Check if it's already using weatherBeforeForStep4
        if 'totalNormalizedPercentStep4 = (weatherBeforeForStep4 > 0)' in js_content:
            print("Already fixed!")
        else:
            print("Pattern exists but format is different - manual fix needed")
