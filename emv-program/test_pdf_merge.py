#!/usr/bin/env python3
"""
Test script to simulate PDF merging functionality
"""

import os
import sys
import tempfile
import shutil
from pathlib import Path

# Add the 8082 directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '8082'))

print("=" * 60)
print("PDF MERGE SIMULATION TEST")
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
    from main_hardened_ready_fixed import merge_pdfs
    print("   [OK] merge_pdfs function imported successfully")
except ImportError as e:
    print(f"   [ERROR] Could not import merge_pdfs: {e}")
    sys.exit(1)
except Exception as e:
    print(f"   [ERROR] Error importing: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Test 3: Check if we can create a simple test PDF
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
    
    for i, title in enumerate(["Test PDF 1", "Test PDF 2", "Test PDF 3"], 1):
        pdf_path = os.path.join(temp_dir, f"test_{i:02d}_{title.replace(' ', '_')}.pdf")
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        story = []
        story.append(Paragraph(f"<b>{title}</b>", styles['Title']))
        story.append(Spacer(1, 0.5))
        story.append(Paragraph(f"This is test PDF number {i}.", styles['Normal']))
        story.append(Paragraph(f"Generated for testing PDF merging functionality.", styles['Normal']))
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
    merged_pdf_path = os.path.join(temp_dir, "00_MERGED_TEST.pdf")
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

# Test 5: Simulate the actual Audit package PDF collection logic
print("\n5. Simulating Audit package PDF collection logic...")
try:
    # Simulate the PDF order list from the actual code
    pdf_order = [
        "00_Submission_Checklist.pdf",
        "03_audit_compliance_summary.pdf",
        "04_complete_analysis_results.pdf",
        "05_calculation_methodologies.pdf",
        "06_standards_compliance_documentation.pdf",
        "07_data_validation_report.pdf",
        "08_quality_assurance_documentation.pdf",
        "09_system_configuration_documentation.pdf",
        "10_risk_assessment_documentation.pdf",
        "10b_Financial_Analysis_Report.pdf",
        "12a_Weather_Normalization_Report.pdf",
        "14_synerex_standards_compliance_analysis.pdf",
        "15_system_architecture_overview.pdf",
        "16_client_audit_summary.pdf",
    ]
    
    # Collect PDFs in the specified order
    pdf_files_to_merge = []
    pdf_files_found = set()
    
    print(f"   Checking for {len(pdf_order)} PDFs in order...")
    for pdf_name in pdf_order:
        pdf_path = os.path.join(temp_dir, pdf_name)
        if os.path.exists(pdf_path) and pdf_path.endswith('.pdf'):
            pdf_files_to_merge.append(pdf_path)
            pdf_files_found.add(pdf_name)
            print(f"   [FOUND] {pdf_name}")
        else:
            print(f"   [NOT FOUND] {pdf_name}")
    
    # Check for additional PDFs
    print(f"\n   Checking for additional PDFs in temp directory...")
    for file in os.listdir(temp_dir):
        if file.endswith('.pdf') and file not in pdf_files_found:
            pdf_path = os.path.join(temp_dir, file)
            pdf_files_to_merge.append(pdf_path)
            print(f"   [ADDITIONAL] {file}")
    
    print(f"\n   Total PDFs found: {len(pdf_files_to_merge)}")
    
    if pdf_files_to_merge:
        merged_pdf_path = os.path.join(temp_dir, "00_COMPLETE_AUDIT_PACKAGE.pdf")
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

# Test 6: Check what PDFs actually exist in a real Audit package scenario
print("\n6. Checking for actual PDF files in 8082 directory...")
try:
    # Look for any PDF files that might exist
    pdf_dir = Path("8082")
    if pdf_dir.exists():
        pdf_files = list(pdf_dir.glob("**/*.pdf"))
        print(f"   Found {len(pdf_files)} PDF files in 8082 directory")
        for pdf_file in pdf_files[:10]:  # Show first 10
            print(f"   - {pdf_file.relative_to(pdf_dir)}")
        if len(pdf_files) > 10:
            print(f"   ... and {len(pdf_files) - 10} more")
    else:
        print(f"   [WARNING] 8082 directory not found")
except Exception as e:
    print(f"   [ERROR] Error checking for PDFs: {e}")

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

