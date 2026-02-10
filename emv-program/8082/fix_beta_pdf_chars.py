#!/usr/bin/env python3
"""
Script to fix beta character issues in PDF generation.
Fixes "β■" and "- ■" appearing in PDF documents.
"""

import codecs
import sys
import os

# Configure output encoding for Windows
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

base = r"c:\Users\Admin\OneDrive\Documents\synerex-platform"

# Fix 1: main_hardened_ready_refactored.py
print("[1/4] Fixing clean_text_for_pdf() in main_hardened_ready_refactored.py...")
file1 = os.path.join(base, r"emv-program\8082\main_hardened_ready_refactored.py")

try:
    with codecs.open(file1, 'r', encoding='utf-8') as f:
        content1 = f.read()
    
    # Add beta pattern handling after line 20230
    old_pattern1 = "    for corrupted, proper in replacements.items():\n        text = text.replace(corrupted, proper)\n    \n    # Convert Unicode mathematical symbols"
    new_pattern1 = """    for corrupted, proper in replacements.items():
        text = text.replace(corrupted, proper)
    
    # Handle combined corrupted patterns FIRST (before individual symbol replacement)
    # This fixes "β■" and "- ■" appearing in PDFs
    text = text.replace("β■", "beta")  # Beta with black box
    text = text.replace("beta■", "beta")  # Beta text with black box
    text = text.replace("- ■", "- ")  # Dash with black box (remove black box, keep dash)
    text = text.replace("■", "")  # Remove any remaining black boxes
    
    # Convert Unicode mathematical symbols"""
    
    if old_pattern1 in content1:
        content1 = content1.replace(old_pattern1, new_pattern1)
        print("  [OK] Added combined pattern handling")
    else:
        print("  [WARN] Pattern 1 not found - may already be fixed or code changed")
    
    # Add beta symbols to math_symbols dictionary
    old_pattern2 = '        "∞": "inf",  # Infinity\n    }'
    new_pattern2 = """        "∞": "inf",  # Infinity
        "β": "beta",  # Beta symbol (Greek letter)
        "β₀": "beta0",  # Beta with subscript 0
        "β₁": "beta1",  # Beta with subscript 1
        "β₂": "beta2",  # Beta with subscript 2
        "β₃": "beta3",  # Beta with subscript 3
        "β₄": "beta4",  # Beta with subscript 4
        "■": "",  # Black box character (remove)
    }"""
    
    if old_pattern2 in content1:
        content1 = content1.replace(old_pattern2, new_pattern2)
        print("  [OK] Added beta symbols to math_symbols dictionary")
    else:
        print("  [WARN] Pattern 2 not found - may already be fixed or code changed")
    
    with codecs.open(file1, 'w', encoding='utf-8') as f:
        f.write(content1)
    print("  [SUCCESS] File 1 updated")
    
except Exception as e:
    print(f"  [ERROR] Failed to update file 1: {e}")
    sys.exit(1)

# Fix 2: main_hardened_ready_fixed.py
print("\n[2/4] Fixing text_to_pdf() in main_hardened_ready_fixed.py...")
file2 = os.path.join(base, r"emv-program\8082\main_hardened_ready_fixed.py")

try:
    with codecs.open(file2, 'r', encoding='utf-8') as f:
        content2 = f.read()
    
    # Add import for clean_text_for_pdf
    old_pattern3 = "        import re\n        \n        buffer = BytesIO()"
    new_pattern3 = """        from main_hardened_ready_refactored import clean_text_for_pdf
        import re
        
        buffer = BytesIO()"""
    
    if old_pattern3 in content2:
        content2 = content2.replace(old_pattern3, new_pattern3)
        print("  [OK] Added clean_text_for_pdf import")
    else:
        print("  [WARN] Pattern 3 not found - may already be fixed or code changed")
    
    # Update text processing to use clean_text_for_pdf
    old_pattern4 = """            else:
                # Regular text - escape HTML special characters
                # Escape HTML entities
                line = line.replace('&', '&amp;')
                line = line.replace('<', '&lt;')
                line = line.replace('>', '&gt;')
                story.append(Paragraph(line, styles['Normal']))"""
    new_pattern4 = """            else:
                # Regular text - clean and escape HTML special characters
                line = clean_text_for_pdf(line)  # Clean beta symbols and black boxes
                # Escape HTML entities
                line = line.replace('&', '&amp;')
                line = line.replace('<', '&lt;')
                line = line.replace('>', '&gt;')
                story.append(Paragraph(line, styles['Normal']))"""
    
    if old_pattern4 in content2:
        content2 = content2.replace(old_pattern4, new_pattern4)
        print("  [OK] Updated text_to_pdf to use clean_text_for_pdf")
    else:
        print("  [WARN] Pattern 4 not found - may already be fixed or code changed")
    
    with codecs.open(file2, 'w', encoding='utf-8') as f:
        f.write(content2)
    print("  [SUCCESS] File 2 updated")
    
except Exception as e:
    print(f"  [ERROR] Failed to update file 2: {e}")
    sys.exit(1)

print("\n[SUCCESS] All fixes applied!")
print("\nSummary:")
print("  - Fixed 'β■' → 'beta' in PDFs")
print("  - Fixed '- ■' → '- ' (removes black box)")
print("  - Added beta symbol handling (β, β₀, β₁, β₂, β₃, β₄)")
print("  - Integrated clean_text_for_pdf into text_to_pdf function")
print("\nPlease restart your Flask server for changes to take effect.")
