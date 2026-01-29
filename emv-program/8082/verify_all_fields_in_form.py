#!/usr/bin/env python3
"""Verify all fields are properly in form structure"""
from pathlib import Path

html_file = Path(__file__).parent / "html_body.html"
content = html_file.read_text(encoding="utf-8")

# Find form boundaries
form_start = content.find('<form')
form_end = content.find('</form>')

# Count all form elements
all_inputs = content.count('<input')
all_selects = content.count('<select')
all_textareas = content.count('<textarea')
all_fields = content.count('<div class="field">')

print(f"Form boundaries: {form_start} to {form_end}")
print(f"Total inputs: {all_inputs}")
print(f"Total selects: {all_selects}")
print(f"Total textareas: {all_textareas}")
print(f"Total field divs: {all_fields}")
print(f"Total form elements: {all_inputs + all_selects + all_textareas}")

# Check if first and last fields are inside form
first_field = content.find('<div class="field">', form_start)
last_field = content.rfind('<div class="field">', 0, form_end)

print(f"\nFirst field at: {first_field} (inside form: {form_start < first_field < form_end})")
print(f"Last field at: {last_field} (inside form: {form_start < last_field < form_end})")

# Check Saved Projects form-grid structure
saved_start = content.find('Saved Projects')
form_grid_start = content.find('form-grid three-col', saved_start)
form_grid_end = content.find('</div>', content.find('exclude UPS Predictive Failure Analysis', saved_start) + 300)
form_grid_end = content.find('</div>', form_grid_end + 10)

print(f"\nSaved Projects form-grid: {form_grid_start} to {form_grid_end}")
print(f"Actions inside form-grid: {form_grid_start < content.find('label>Actions', saved_start) < form_grid_end}")
print(f"Report Options inside form-grid: {form_grid_start < content.find('Report Options', saved_start) < form_grid_end}")
