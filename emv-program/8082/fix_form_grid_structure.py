#!/usr/bin/env python3
"""Fix form-grid to include all fields like the backup"""
from pathlib import Path

html_file = Path(__file__).parent / "html_body.html"
content = html_file.read_text(encoding="utf-8")

# Find Saved Projects section
saved_start = content.find('Saved Projects')
form_grid_start = content.find('form-grid three-col', saved_start)

# Find where form-grid currently closes (too early, after Load Project)
load_project_help_end = content.find('</div>', content.find('Pick a saved project and click Load', saved_start) + 200)
premature_close = content.find('</div>', load_project_help_end + 10)

# Find where form-grid SHOULD close (after Report Options)
report_options_end = content.find('</div>', content.find('exclude UPS Predictive Failure Analysis', saved_start) + 300)
correct_close = content.find('</div>', report_options_end + 10)

print(f"form-grid starts at: {form_grid_start}")
print(f"Premature close at: {premature_close}")
print(f"Report Options ends at: {report_options_end}")
print(f"Correct close should be at: {correct_close}")

# Remove premature closing div
if premature_close < correct_close:
    content = content[:premature_close] + content[premature_close + 6:]
    print(f"\n[OK] Removed premature closing </div> at position {premature_close}")
    
    # Recalculate positions
    report_options_end = content.find('</div>', content.find('exclude UPS Predictive Failure Analysis', saved_start) + 300)
    correct_close = content.find('</div>', report_options_end + 10)
    
    # Add closing div after Report Options
    content = content[:correct_close] + '\n      </div>\n' + content[correct_close:]
    print(f"[OK] Added form-grid closing </div> after Report Options at position {correct_close}")

html_file.write_text(content, encoding="utf-8")
print(f"\n[SUCCESS] Fixed form-grid structure - all fields now inside")
