#!/usr/bin/env python3
"""
Fix Unicode characters in generate_exact_template_html.py
"""

import re

# Read the file
with open('generate_exact_template_html.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace Unicode characters with ASCII equivalents
replacements = {
    '✓': 'PASS',
    '✗': 'FAIL', 
    '°': 'deg',
    '²': '^2',
    '√': 'sqrt',
    'Σ': 'sum',
    '×': 'x',
    '±': '+/-'
}

# Apply replacements
for unicode_char, ascii_replacement in replacements.items():
    content = content.replace(unicode_char, ascii_replacement)

# Write the file back
with open('generate_exact_template_html.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Unicode characters replaced successfully")
