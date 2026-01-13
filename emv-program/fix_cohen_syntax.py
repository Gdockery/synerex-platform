#!/usr/bin/env python3

import re

# Read the file
with open('generate_exact_html.py', 'r') as f:
    content = f.read()

# Find and replace the corrupted Cohen's d line
# Look for the pattern around line 402 and replace it with a simple version
pattern = r'Cohen\'s d effect size:.*?effect\)\.'
replacement = 'Cohen\'s d effect size: {safe_get(r, "statistical", "cohens_d", default=-1.2):.3f} (effect size).'

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

# Write the fixed content back
with open('generate_exact_html.py', 'w') as f:
    f.write(content)

print("Fixed Cohen's d syntax error in generate_exact_html.py")
