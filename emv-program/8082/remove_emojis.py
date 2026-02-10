#!/usr/bin/env python3
import re

# Read the file
file_path = r'c:\Users\Admin\OneDrive\Documents\synerex-platform\emv-program\8082\static\javascript_functions.js'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Define emoji replacements
replacements = {
    '⏱️': '[TIMEOUT]',
    '🌡️': '[TEMP]',
    '⚠️': '[WARNING]',
    '💧': '[HUMIDITY]',
    '🌫️': '[DEWPOINT]',
    '⏭️': '[SKIP]',
    'ℹ️': '[INFO]',
    '🖱️': '[CLICK]',
    '👁️': '[VIEW]',
    '🏷️': '[LABEL]',
    '❄️': '[COLD]',
    '🖥️': '[DATACENTER]',
    '🔴': '[CRITICAL]',
    '✅': '[OK]',
    '❌': '[ERROR]',
    '🔧': '[DEBUG]',
    '💾': '[SAVE]',
    '🔍': '[SEARCH]',
    '🗑️': '[DELETE]',
    '🌤️': '[WEATHER]',
    '📐': '[FORMULA]',
    '✓': '[PASS]',
    '✗': '[FAIL]',
    '⚠': '[WARNING]',  # Without variation selector
}

# Replace all emojis
for emoji, replacement in replacements.items():
    content = content.replace(emoji, replacement)

# Write back
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Emojis replaced successfully")
