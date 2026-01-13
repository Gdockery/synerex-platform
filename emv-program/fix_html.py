#!/usr/bin/env python3

import re

# Read the file
with open('generate_exact_html.py', 'r') as f:
    content = f.read()

# Find and replace the corrupted kW (Normalized) line
# Look for the pattern and replace it with the correct format
pattern = r'<tr><td><strong>kW \(Normalized\)</strong></td><td class="value-cell" style="text-align: center;">\{safe_get\(r, \'power_quality\.normalized_kw_before\', default=18\.8\):\.1f\}%</td></tr>'
replacement = '<tr><td><strong>kW (Normalized)</strong></td><td class="value-cell" style="text-align: center;">{safe_get(r, \'power_quality\', \'normalized_kw_before\', default=246.8):.1f} kW</td><td class="value-cell" style="text-align: center;">{safe_get(r, \'power_quality\', \'normalized_kw_after\', default=200.4):.1f} kW</td><td class="value-cell" style="text-align: center;">{safe_get(r, \'power_quality\', \'normalized_kw_savings\', default=18.8):.1f}%</td></tr>'

content = re.sub(pattern, replacement, content)

# Write the file back
with open('generate_exact_html.py', 'w') as f:
    f.write(content)

print('Fixed kW (Normalized) line in generate_exact_html.py')
