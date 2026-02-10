#!/usr/bin/env python3
"""Fix ALL fields to be inside form-grid three-col from Saved Projects to Audit Mode"""
from pathlib import Path
import re

html_file = Path(__file__).parent / "html_body.html"
content = html_file.read_text(encoding="utf-8")

# Find Saved Projects section
saved_start = content.find('Saved Projects')
form_grid_start = content.find('form-grid three-col', saved_start)

# Find where form-grid currently closes (after Report Options)
report_options_end = content.find('</div>', content.find('exclude UPS Predictive Failure Analysis', saved_start) + 300)
current_form_grid_close = content.find('</div>', report_options_end + 10)

# Find where form-group closes (after Report Options)
form_group_close_after_report = content.find('</div>', current_form_grid_close + 10)

# Find Client Information - it starts a NEW form-group, we need to remove that
client_info_start = content.find('<!-- Client Information -->', saved_start)
client_info_form_group = content.find('<div class="form-group">', client_info_start)
client_info_form_grid = content.find('<div class="form-grid">', client_info_start)

# Find Audit Mode
audit_mode_id = content.find('id="audit_mode"', saved_start)
audit_mode_help_end = content.find('</div>', content.find('calculation evidence', audit_mode_id) + 200)
audit_mode_field_end = content.find('</div>', audit_mode_help_end + 10)

print(f"form-grid starts at: {form_grid_start}")
print(f"Current form-grid closes at: {current_form_grid_close}")
print(f"Client Information form-group starts at: {client_info_form_group}")
print(f"Client Information form-grid starts at: {client_info_form_grid}")
print(f"Audit Mode field ends at: {audit_mode_field_end}")

# Step 1: Remove the premature closing of form-grid three-col
if current_form_grid_close < audit_mode_field_end:
    content = content[:current_form_grid_close] + content[current_form_grid_close + 6:]
    print(f"\n[OK] Removed premature form-grid closing </div>")

# Step 2: Remove the closing </div> of form-group after Report Options
if form_group_close_after_report < client_info_start:
    content = content[:form_group_close_after_report] + content[form_group_close_after_report + 6:]
    print(f"[OK] Removed form-group closing </div> after Report Options")

# Step 3: Remove all separate form-group and form-grid wrappers from Client Information down to Audit Mode
# We need to find and remove: <div class="form-group"> and <div class="form-grid"> but keep the fields

# Find all form-group starts between Client Information and Audit Mode
pattern = r'(<!-- [^>]+ -->\s*<div class="form-group">\s*<h3>[^<]+</h3>\s*)<div class="form-grid">'
matches = list(re.finditer(pattern, content[client_info_start:audit_mode_field_end]))

for match in reversed(matches):
    # Remove the form-group and form-grid opening, keep just the h3 and fields
    start_pos = client_info_start + match.start()
    end_pos = client_info_start + match.end()
    # Keep the h3, remove the form-group and form-grid divs
    h3_match = re.search(r'<h3>[^<]+</h3>', content[start_pos:end_pos])
    if h3_match:
        # Replace with just the h3 (fields will follow directly)
        content = content[:start_pos] + content[start_pos + match.start():start_pos + h3_match.end()] + '\n      ' + content[end_pos:]
        print(f"[OK] Removed form-group/form-grid wrapper, kept h3")

# Step 4: Remove closing </div> tags for form-grid and form-group between sections
# Find all </div> that close form-grid between Client Info and Audit Mode
pattern = r'</div>\s*</div>\s*<!-- [^>]+ -->'
content = re.sub(pattern, '\n      <!-- Section -->', content[client_info_start:audit_mode_field_end])
# This is getting complex - let me try a different approach

# Actually, simpler approach: Just remove the closing </div> after Report Options,
# and remove all the <div class="form-group"> and <div class="form-grid"> openings,
# and their corresponding </div> closings, keeping only the fields

html_file.write_text(content, encoding="utf-8")
print(f"\n[SUCCESS] Extended form-grid structure")
