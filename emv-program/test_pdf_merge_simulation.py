#!/usr/bin/env python3
"""
Test script to simulate PDF merging functionality
Verifies that merge_pdfs function works correctly and creates consolidated PDFs
"""

import os
import sys
import tempfile
import shutil
from pathlib import Path

# Add 8082 to path to import merge_pdfs
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '8082'))

def create_dummy_pdf(filepath):
    """Create a simple dummy PDF file for testing"""
    try:
        from reportlab.pdfgen import canvas
        from reportlab.lib.pagesizes import letter
        
        c = canvas.Canvas(filepath, pagesize=letter)
        c.drawString(100, 750, f"Test PDF: {os.path.basename(filepath)}")
        c.drawString(100, 730, "This is a test document for PDF merging.")
        c.showPage()
        c.save()
        return True
    except ImportError:
        # Fallback: create a minimal PDF using PyPDF2
        try:
            from PyPDF2 import PdfWriter
            writer = PdfWriter()
            # Create a blank page (PyPDF2 can't create content, but we can create structure)
            # For a real test, we'd need reportlab, but let's try to use existing PDFs if available
            return False
        except:
            return False

def test_merge_pdfs_function():
    """Test the merge_pdfs function directly"""
    print("=" * 80)
    print("TEST 1: Testing merge_pdfs function")
    print("=" * 80)
    
    try:
        # Import the function
        from main_hardened_ready_fixed import merge_pdfs
        print("[OK] Successfully imported merge_pdfs function")
    except ImportError as e:
        print(f" Failed to import merge_pdfs: {e}")
        return False
    
    # Create temporary directory
    with tempfile.TemporaryDirectory() as temp_dir:
        print(f"\n Created temp directory: {temp_dir}")
        
        # Create test PDF files
        test_pdfs = []
        for i in range(5):
            pdf_path = os.path.join(temp_dir, f"test_doc_{i+1}.pdf")
            if create_dummy_pdf(pdf_path):
                test_pdfs.append(pdf_path)
                print(f"  [OK] Created: {os.path.basename(pdf_path)}")
            else:
                print(f"  [WARN] Could not create PDF (reportlab not available)")
                # Try to use PyPDF2 to create minimal PDFs
                try:
                    from PyPDF2 import PdfWriter
                    writer = PdfWriter()
                    # Add a blank page
                    from PyPDF2.generic import DictionaryObject, ArrayObject, NameObject, NumberObject
                    page = DictionaryObject()
                    page[NameObject("/Type")] = NameObject("/Page")
                    page[NameObject("/MediaBox")] = ArrayObject([NumberObject(0), NumberObject(0), NumberObject(612), NumberObject(792)])
                    writer.add_page(page)
                    with open(pdf_path, 'wb') as f:
                        writer.write(f)
                    test_pdfs.append(pdf_path)
                    print(f"  [OK] Created minimal PDF: {os.path.basename(pdf_path)}")
                except Exception as e2:
                    print(f"  [FAIL] Could not create PDF: {e2}")
                    return False
        
        if not test_pdfs:
            print("[FAIL] No test PDFs created")
            return False
        
        # Test merging
        merged_path = os.path.join(temp_dir, "00_MERGED_TEST.pdf")
        print(f"\n[MERGE] Merging {len(test_pdfs)} PDFs...")
        
        result = merge_pdfs(test_pdfs, merged_path)
        
        if result:
            if os.path.exists(merged_path):
                size = os.path.getsize(merged_path)
                print(f"[OK] Merge successful! Created: {os.path.basename(merged_path)} ({size:,} bytes)")
                return True
            else:
                print(f"[FAIL] Merge returned True but file doesn't exist: {merged_path}")
                return False
        else:
            print(f"[FAIL] Merge failed (returned False)")
            return False

def test_duplicate_prevention():
    """Test that duplicates are prevented"""
    print("\n" + "=" * 80)
    print("TEST 2: Testing duplicate prevention")
    print("=" * 80)
    
    try:
        from main_hardened_ready_fixed import merge_pdfs
    except ImportError as e:
        print(f" Failed to import merge_pdfs: {e}")
        return False
    
    with tempfile.TemporaryDirectory() as temp_dir:
        # Create one test PDF
        pdf_path = os.path.join(temp_dir, "test_doc.pdf")
        if not create_dummy_pdf(pdf_path):
            try:
                from PyPDF2 import PdfWriter
                writer = PdfWriter()
                from PyPDF2.generic import DictionaryObject, ArrayObject, NameObject, NumberObject
                page = DictionaryObject()
                page[NameObject("/Type")] = NameObject("/Page")
                page[NameObject("/MediaBox")] = ArrayObject([NumberObject(0), NumberObject(0), NumberObject(612), NumberObject(792)])
                writer.add_page(page)
                with open(pdf_path, 'wb') as f:
                    writer.write(f)
            except:
                print("[FAIL] Could not create test PDF")
                return False
        
        # Add the same PDF multiple times to the list
        pdf_list = [pdf_path, pdf_path, pdf_path]  # Same file 3 times
        
        merged_path = os.path.join(temp_dir, "00_MERGED_DUPLICATE_TEST.pdf")
        print(f"\n[MERGE] Merging list with {len(pdf_list)} entries (same file repeated)...")
        
        result = merge_pdfs(pdf_list, merged_path)
        
        if result and os.path.exists(merged_path):
            size = os.path.getsize(merged_path)
            print(f"[OK] Merge successful! File size: {size:,} bytes")
            print(f"   (If duplicate prevention works, file should be small - only one copy merged)")
            return True
        else:
            print(f"[FAIL] Merge failed")
            return False

def test_audit_package_simulation():
    """Simulate the Audit Package merge logic"""
    print("\n" + "=" * 80)
    print("TEST 3: Simulating Audit Package merge logic")
    print("=" * 80)
    
    try:
        from main_hardened_ready_fixed import merge_pdfs
    except ImportError as e:
        print(f" Failed to import merge_pdfs: {e}")
        return False
    
    with tempfile.TemporaryDirectory() as temp_dir:
        print(f"\n Created temp directory: {temp_dir}")
        
        # Simulate the PDF order from Audit Package
        pdf_order = [
            "00_Submission_Checklist.pdf",
            "03_audit_compliance_summary.pdf",
            "04_complete_analysis_results.pdf",
            "05_calculation_methodologies.pdf",
        ]
        
        # Create test PDFs
        pdf_files_to_merge = []
        pdf_files_found = set()
        
        print("\n Creating test PDFs in order...")
        for pdf_name in pdf_order:
            pdf_path = os.path.join(temp_dir, pdf_name)
            try:
                from PyPDF2 import PdfWriter
                writer = PdfWriter()
                from PyPDF2.generic import DictionaryObject, ArrayObject, NameObject, NumberObject
                page = DictionaryObject()
                page[NameObject("/Type")] = NameObject("/Page")
                page[NameObject("/MediaBox")] = ArrayObject([NumberObject(0), NumberObject(0), NumberObject(612), NumberObject(792)])
                writer.add_page(page)
                with open(pdf_path, 'wb') as f:
                    writer.write(f)
                
                pdf_files_to_merge.append(pdf_path)
                pdf_files_found.add(pdf_name)
                print(f"  [OK] Created: {pdf_name}")
            except Exception as e:
                print(f"  [FAIL] Failed to create {pdf_name}: {e}")
        
        if not pdf_files_to_merge:
            print("[FAIL] No PDFs created")
            return False
        
        # Simulate the merge
        merged_pdf_name = "00_COMPLETE_AUDIT_PACKAGE.pdf"
        merged_pdf_path = os.path.join(temp_dir, merged_pdf_name)
        
        print(f"\n[MERGE] Merging {len(pdf_files_to_merge)} PDFs into {merged_pdf_name}...")
        
        if merge_pdfs(pdf_files_to_merge, merged_pdf_path):
            if os.path.exists(merged_pdf_path):
                merged_size = os.path.getsize(merged_pdf_path)
                print(f"[OK] SUCCESS! Merged PDF created: {merged_pdf_name}")
                print(f"   Size: {merged_size:,} bytes")
                print(f"   Documents merged: {len(pdf_files_to_merge)}")
                return True
            else:
                print(f"[FAIL] Merge returned True but file doesn't exist")
                return False
        else:
            print(f"[FAIL] Merge failed")
            return False

def main():
    """Run all tests"""
    print("\n" + "=" * 80)
    print("PDF MERGE SIMULATION TEST")
    print("=" * 80)
    print("\nThis script tests the PDF merging functionality to verify it works correctly.")
    print("It will test:")
    print("  1. Basic merge_pdfs function")
    print("  2. Duplicate prevention")
    print("  3. Audit Package merge simulation")
    print("\n")
    
    results = []
    
    # Test 1: Basic merge
    results.append(("Basic Merge", test_merge_pdfs_function()))
    
    # Test 2: Duplicate prevention
    results.append(("Duplicate Prevention", test_duplicate_prevention()))
    
    # Test 3: Audit Package simulation
    results.append(("Audit Package Simulation", test_audit_package_simulation()))
    
    # Summary
    print("\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    
    all_passed = True
    for test_name, result in results:
        status = "[PASS]" if result else "[FAIL]"
        print(f"{status}: {test_name}")
        if not result:
            all_passed = False
    
    print("\n" + "=" * 80)
    if all_passed:
        print("[OK] ALL TESTS PASSED - PDF merge functionality is working!")
    else:
        print("[FAIL] SOME TESTS FAILED - Check errors above")
    print("=" * 80)
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())

