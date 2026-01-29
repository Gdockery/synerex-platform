#!/usr/bin/env python3
"""Fix denominator issue and nominal voltage lookup"""

import re
import sys

# Fix encoding for Windows console
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Fix 1: JavaScript - Change denominator from pfNormalizedKwBeforeStep4 to weatherBeforeForStep4
js_file = 'static/javascript_functions.js'
with open(js_file, 'r', encoding='utf-8') as f:
    js_content = f.read()

# Replace line 8884
old_js = '        const totalNormalizedPercentStep4 = (pfNormalizedKwBeforeStep4 > 0) ? (totalSavingsKwStep4 / pfNormalizedKwBeforeStep4) * 100 : 0;'
new_js = '''        // CRITICAL: Use weather_normalized_kw_before as denominator (same as Weather Savings % and PF Contribution %)
        // This ensures: Weather Savings % + PF Contribution % = Total Utility Billing Impact %
        const totalNormalizedPercentStep4 = (weatherBeforeForStep4 > 0) ? (totalSavingsKwStep4 / weatherBeforeForStep4) * 100 : 0;'''

if old_js in js_content:
    js_content = js_content.replace(old_js, new_js)
    with open(js_file, 'w', encoding='utf-8') as f:
        f.write(js_content)
    print("Fixed JavaScript denominator on line 8884")
else:
    print("WARNING: JavaScript pattern not found - may already be fixed")

# Fix 2 & 3: Python - Fix nominal voltage lookup (two locations)
# CRITICAL: No default value - must use the field value from form/config
py_file = 'main_hardened_ready_refactored.py'
with open(py_file, 'r', encoding='utf-8') as f:
    py_content = f.read()

# Fix location 1 (around line 7277)
old_py1 = '''                # Get nominal voltage from form/config (default 120V for residential, 480V for commercial)
                voltage_level_str = form.get('voltage_level') or (data.get('voltage_level') if request.is_json and 'data' in locals() else None)
                try:
                    nominal_voltage = float(voltage_level_str) if voltage_level_str else 120.0
                except (ValueError, TypeError):
                    nominal_voltage = 120.0'''

new_py1 = '''                # Get nominal voltage from config first, then form
                # CRITICAL: Check config for voltage_nominal (not voltage_level), use field value only (no default)
                nominal_voltage = None
                if 'cfg' in locals() and isinstance(cfg, dict) and cfg.get('voltage_nominal'):
                    try:
                        nominal_voltage = float(cfg.get('voltage_nominal'))
                    except (ValueError, TypeError):
                        pass
                
                if nominal_voltage is None:
                    voltage_nominal_str = form.get('voltage_nominal') or (data.get('voltage_nominal') if request.is_json and 'data' in locals() else None)
                    if voltage_nominal_str:
                        try:
                            nominal_voltage = float(voltage_nominal_str)
                        except (ValueError, TypeError):
                            nominal_voltage = None
                
                # If still None, log warning but don't use default - let the calling function handle it
                if nominal_voltage is None:
                    logger.warning("voltage_nominal not found in config or form - voltage calculations may fail")'''

if old_py1 in py_content:
    py_content = py_content.replace(old_py1, new_py1)
    print("Fixed Python nominal voltage lookup #1 (around line 7277)")
else:
    print("WARNING: Python pattern #1 not found - may already be fixed")

# Fix location 2 (around line 7441)
old_py2 = '''                # Get nominal voltage from form/config
                voltage_level_str = form.get('voltage_level') or (data.get('voltage_level') if request.is_json and 'data' in locals() else None)
                try:
                    nominal_voltage = float(voltage_level_str) if voltage_level_str else 120.0
                except (ValueError, TypeError):
                    nominal_voltage = 120.0'''

new_py2 = '''                # Get nominal voltage from config first, then form
                # CRITICAL: Check config for voltage_nominal (not voltage_level), use field value only (no default)
                nominal_voltage = None
                if 'cfg' in locals() and isinstance(cfg, dict) and cfg.get('voltage_nominal'):
                    try:
                        nominal_voltage = float(cfg.get('voltage_nominal'))
                    except (ValueError, TypeError):
                        pass
                
                if nominal_voltage is None:
                    voltage_nominal_str = form.get('voltage_nominal') or (data.get('voltage_nominal') if request.is_json and 'data' in locals() else None)
                    if voltage_nominal_str:
                        try:
                            nominal_voltage = float(voltage_nominal_str)
                        except (ValueError, TypeError):
                            nominal_voltage = None
                
                # If still None, log warning but don't use default - let the calling function handle it
                if nominal_voltage is None:
                    logger.warning("voltage_nominal not found in config or form - voltage calculations may fail")'''

if old_py2 in py_content:
    py_content = py_content.replace(old_py2, new_py2)
    print("Fixed Python nominal voltage lookup #2 (around line 7441)")
else:
    print("WARNING: Python pattern #2 not found - may already be fixed")

with open(py_file, 'w', encoding='utf-8') as f:
    f.write(py_content)
print("All fixes applied successfully!")
