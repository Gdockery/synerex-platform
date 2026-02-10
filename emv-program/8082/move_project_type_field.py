#!/usr/bin/env python3
"""
Script to move Project Type field below LOAD PROJECT dropdown
and fix the Load Project help text
"""

import re
from pathlib import Path

# Get script directory
script_dir = Path(__file__).parent
html_file = script_dir / "html_body.html"
backup_file = script_dir / f"html_body.html.backup_{__import__('datetime').datetime.now().strftime('%Y%m%d_%H%M%S')}"

# Create backup
if html_file.exists():
    import shutil
    shutil.copy2(html_file, backup_file)
    print(f"Created backup: {backup_file}")

# Read the file
with open(html_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Project Type field HTML
project_type_field = """        <div class="field">
          <label>Project Type</label>
          <select id="project-type" name="project_type" aria-label="Project Type" required>
            <option value="">-- Select Project Type --</option>
            <option value="energy_audit">Energy Audit</option>
            <option value="power_quality">Power Quality Analysis</option>
            <option value="load_study">Load Study</option>
            <option value="measurement_verification">Measurement & Verification (M&V)</option>
            <option value="energy_savings">Energy Savings Analysis</option>
            <option value="harmonic_analysis">Harmonic Analysis</option>
            <option value="demand_reduction">Demand Reduction Study</option>
            <option value="power_factor_correction">Power Factor Correction</option>
            <option value="utility_submission">Utility Submission Package</option>
            <option value="compliance_audit">Compliance Audit</option>
            <option value="baseline_analysis">Baseline Energy Analysis</option>
            <option value="retrofit_analysis">Retrofit Analysis</option>
            <option value="custom">Custom</option>
          </select>
          <div class="help">Select the type of project analysis. This will appear in your Audit and Utility Submission PDF documents.</div>
        </div>
"""

# Step 1: Remove existing Project Type field if it exists
if 'id="project-type"' in content:
    print("Removing existing Project Type field...")
    # Remove the entire Project Type field div
    content = re.sub(
        r'\s*<div class="field">\s*<label>Project Type</label>.*?</div>\s*</div>',
        '',
        content,
        flags=re.DOTALL
    )

# Step 2: Fix Load Project help text
print("Fixing Load Project help text...")
content = re.sub(
    r'<div class="help">Select the type of project analysis[^<]*</div>',
    '<div class="help">Pick a saved project and click Load, or Re-analyze to run analysis with latest code</div>',
    content
)

# Step 3: Insert Project Type field after Load Project field
print("Inserting Project Type field below LOAD PROJECT...")

# Pattern: Load Project field closes, then closing divs, then Facility Address
# Look for: </div> (closes Load Project field), then </div></div>, then Facility Address
pattern = r'(</div>\s*</div>\s*</div>\s*<div class="field">\s*<label>Facility Address</label>)'

if re.search(pattern, content):
    content = re.sub(
        pattern,
        project_type_field + r'\n\n        \1',
        content
    )
    print("[OK] Successfully inserted Project Type field below LOAD PROJECT")
else:
    # Try alternative pattern - after Load Project help text closes
    alt_pattern = r'(<div class="help">Pick a saved project[^<]*</div>\s*</div>\s*)(</div>\s*</div>\s*<div class="field">\s*<label>Facility Address</label>)'
    if re.search(alt_pattern, content):
        content = re.sub(
            alt_pattern,
            r'\1' + project_type_field + r'\n\n        \2',
            content
        )
        print("[OK] Successfully inserted Project Type field (alternative pattern)")
    else:
        print("ERROR: Could not find insertion point")
        exit(1)

# Write the file
with open(html_file, 'w', encoding='utf-8') as f:
    f.write(content)

print("\n" + "="*60)
print("Project Type field moved successfully!")
print("="*60)
print("\nThe Project Type dropdown is now positioned:")
print("  • Below the LOAD PROJECT dropdown")
print("  • In the Saved Projects section")
print("  • With all enhanced options (13 project types)")
print("\nNext steps:")
print("1. Refresh your browser to see the updated layout")
print("2. The Project Type field should appear right below LOAD PROJECT")
