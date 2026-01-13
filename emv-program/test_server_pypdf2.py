#!/usr/bin/env python3
"""
Test script to verify the server can import PyPDF2
This simulates what the server does when trying to merge PDFs
"""

import sys
import os

# Add the 8082 directory to the path (simulating server environment)
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '8082'))

print("=" * 60)
print("SERVER PyPDF2 AVAILABILITY TEST")
print("=" * 60)

print(f"\nPython executable: {sys.executable}")
print(f"Python version: {sys.version}")

# Test 1: Try to import PyPDF2 directly
print("\n1. Testing direct PyPDF2 import...")
try:
    from PyPDF2 import PdfMerger
    print("   [OK] PyPDF2 imported successfully")
    print(f"   [OK] PyPDF2 version: {PdfMerger.__module__}")
except ImportError as e:
    print(f"   [ERROR] PyPDF2 import failed: {e}")
    print("   [INFO] PyPDF2 is not available in this Python environment")
    print("   [INFO] Install with: pip install PyPDF2")
    sys.exit(1)

# Test 2: Try to import the merge_pdfs function
print("\n2. Testing merge_pdfs function import...")
try:
    from main_hardened_ready_fixed import merge_pdfs
    print("   [OK] merge_pdfs function imported successfully")
except ImportError as e:
    print(f"   [ERROR] Could not import merge_pdfs: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
except Exception as e:
    print(f"   [ERROR] Error importing: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Test 3: Simulate the merge_pdfs function's import check
print("\n3. Simulating merge_pdfs function's import check...")
try:
    from PyPDF2 import PdfMerger
    merger = PdfMerger()
    print("   [OK] PdfMerger can be instantiated")
    merger.close()
except Exception as e:
    print(f"   [ERROR] PdfMerger instantiation failed: {e}")
    sys.exit(1)

print("\n" + "=" * 60)
print("ALL TESTS PASSED")
print("=" * 60)
print("\nThe server should be able to merge PDFs if it's restarted.")
print("If the server is currently running, restart it to pick up PyPDF2.")

