#!/usr/bin/env python3
"""
Test script to verify Utility Submission PDF merging functionality
"""

import os
import sys
import tempfile
import shutil

# Add the 8082 directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '8082'))

print("=" * 60)
print("UTILITY SUBMISSION PDF MERGE VERIFICATION")
print("=" * 60)

# Test 1: Check if PyPDF2 is available
print("\n1. Checking PyPDF2 availability...")
try:
    from PyPDF2 import PdfMerger
    print("   [OK] PyPDF2 is available")
    PYPDF2_AVAILABLE = True
except ImportError as e:
    print(f"   [ERROR] PyPDF2 is NOT available: {e}")
    print("   Install with: pip install PyPDF2")
    PYPDF2_AVAILABLE = False
    sys.exit(1)

# Test 2: Import the merge_pdfs function
print("\n2. Importing merge_pdfs function...")
try:
    from main_hardened_ready_refactored import merge_pdfs
    print("   [OK] merge_pdfs function imported successfully")
except ImportError as e:
    print(f"   [ERROR] Could not import merge_pdfs: {e}")
    sys.exit(1)
except Exception as e:
    print(f"   [ERROR] Error importing: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Test 3: Create test PDF files
print("\n3. Creating test PDF files...")
try:
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet
    from io import BytesIO
    
    # Create temporary directory
    temp_dir = tempfile.mkdtemp()
    print(f"   [OK] Created temp directory: {temp_dir}")
    
    # Create a few test PDFs
    test_pdfs = []
    styles = getSampleStyleSheet()
    
    for i, title in enumerate(["Submission Checklist", "Cover Letter", "Executive Summary"], 1):
        pdf_path = os.path.join(temp_dir, f"{i:02d}_{title.replace(' ', '_')}.pdf")
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        story = []
        story.append(Paragraph(f"<b>{title}</b>", styles['Title']))
        story.append(Spacer(1, 0.5))
        story.append(Paragraph(f"This is test PDF: {title}.", styles['Normal']))
        story.append(Paragraph(f"Generated for testing Utility Submission PDF merging.", styles['Normal']))
        doc.build(story)
        buffer.seek(0)
        
        with open(pdf_path, 'wb') as f:
            f.write(buffer.read())
        test_pdfs.append(pdf_path)
        print(f"   [OK] Created: {os.path.basename(pdf_path)}")
    
    print(f"   [OK] Created {len(test_pdfs)} test PDF files")
    
except Exception as e:
    print(f"   [ERROR] Could not create test PDFs: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Test 4: Test the merge_pdfs function
print("\n4. Testing merge_pdfs function...")
try:
    merged_pdf_path = os.path.join(temp_dir, "00_COMPLETE_UTILITY_SUBMISSION_PACKAGE.pdf")
    print(f"   Merging {len(test_pdfs)} PDFs into: {os.path.basename(merged_pdf_path)}")
    
    result = merge_pdfs(test_pdfs, merged_pdf_path)
    
    if result:
        if os.path.exists(merged_pdf_path):
            file_size = os.path.getsize(merged_pdf_path)
            print(f"   [OK] Merge successful! File size: {file_size:,} bytes")
            
            # Verify the merged PDF
            try:
                from PyPDF2 import PdfReader
                reader = PdfReader(merged_pdf_path)
                num_pages = len(reader.pages)
                print(f"   [OK] Merged PDF has {num_pages} pages (expected: {len(test_pdfs)})")
                
                if num_pages == len(test_pdfs):
                    print("   [OK] Page count matches expected number of PDFs")
                else:
                    print(f"   [WARNING] Page count mismatch: expected {len(test_pdfs)}, got {num_pages}")
            except Exception as e:
                print(f"   [WARNING] Could not verify merged PDF: {e}")
        else:
            print(f"   [ERROR] Merged PDF file was not created at: {merged_pdf_path}")
    else:
        print(f"   [ERROR] merge_pdfs returned False")
        
except Exception as e:
    print(f"   [ERROR] Error during merge test: {e}")
    import traceback
    traceback.print_exc()

# Test 5: Simulate the actual Utility Submission PDF collection logic
print("\n5. Simulating Utility Submission PDF collection logic...")
try:
    # Simulate the PDF order list from the actual code
    pdf_order = [
        "00_Submission_Checklist.pdf",
        "01_Cover_Letter_Application.pdf",
        "02_Executive_Summary.pdf",
    ]
    
    # Collect PDFs in the specified order
    pdf_files_to_merge = []
    pdf_files_found = set()
    
    print(f"   Checking for {len(pdf_order)} PDFs in order...")
    for pdf_name in pdf_order:
        pdf_path = os.path.join(temp_dir, pdf_name)
        if os.path.exists(pdf_path) and pdf_path.endswith('.pdf'):
            pdf_files_to_merge.append(pdf_path)
            rel_path_normalized = pdf_name.replace('\\', '/')
            pdf_files_found.add(rel_path_normalized)
            print(f"   [FOUND] {pdf_name}")
        else:
            print(f"   [NOT FOUND] {pdf_name}")
    
    # Check for additional PDFs
    print(f"\n   Checking for additional PDFs in temp directory...")
    merged_pdf_name = "00_COMPLETE_UTILITY_SUBMISSION_PACKAGE.pdf"
    for root, dirs, files in os.walk(temp_dir):
        for file in files:
            if file.endswith('.pdf') and file != merged_pdf_name:
                pdf_path = os.path.join(root, file)
                rel_path = os.path.relpath(pdf_path, temp_dir)
                rel_path_normalized = rel_path.replace('\\', '/')
                if rel_path_normalized not in pdf_files_found:
                    pdf_files_to_merge.append(pdf_path)
                    pdf_files_found.add(rel_path_normalized)
                    print(f"   [ADDITIONAL] {rel_path}")
    
    print(f"\n   Total PDFs found: {len(pdf_files_to_merge)}")
    
    if pdf_files_to_merge:
        merged_pdf_path = os.path.join(temp_dir, merged_pdf_name)
        print(f"\n   Attempting to merge {len(pdf_files_to_merge)} PDFs...")
        result = merge_pdfs(pdf_files_to_merge, merged_pdf_path)
        
        if result and os.path.exists(merged_pdf_path):
            file_size = os.path.getsize(merged_pdf_path)
            print(f"   [OK] Merged PDF created successfully!")
            print(f"   [OK] File: {os.path.basename(merged_pdf_path)}")
            print(f"   [OK] Size: {file_size:,} bytes")
        else:
            print(f"   [ERROR] Failed to create merged PDF")
    else:
        print(f"   [WARNING] No PDF files found to merge")
        
except Exception as e:
    print(f"   [ERROR] Error during simulation: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 60)
print("TEST COMPLETE")
print("=" * 60)

# Cleanup
try:
    print(f"\nCleaning up temp directory: {temp_dir}")
    shutil.rmtree(temp_dir, ignore_errors=True)
    print("   [OK] Cleanup complete")
except Exception as e:
    print(f"   [WARNING] Could not clean up: {e}")

