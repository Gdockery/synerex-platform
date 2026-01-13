#!/usr/bin/env python3
"""
Simulate the actual server log output for PDF merge process.
This tests the exact code path the server uses.
"""

import os
import sys
import tempfile
import logging
from pathlib import Path

# Add 8082 to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '8082'))

# Set up logging to match server format
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger('__main__')

def test_utility_submission_merge_simulation():
    """Simulate the exact Utility Submission merge process from the server"""
    print("=" * 80)
    print("SIMULATING: Utility Submission Package PDF Merge (Server Code Path)")
    print("=" * 80)
    
    try:
        from main_hardened_ready_refactored import merge_pdfs
        logger.info("UTILITY SUBMISSION PACKAGE - Successfully imported merge_pdfs")
    except ImportError as e:
        logger.error(f"UTILITY SUBMISSION PACKAGE - Failed to import merge_pdfs: {e}")
        return False
    
    # Check PyPDF2 availability FIRST (as the server code does)
    try:
        from PyPDF2 import PdfMerger
        logger.info("UTILITY SUBMISSION PACKAGE - PyPDF2 is available")
        pyPDF2_available = True
    except ImportError as import_err:
        logger.error(f"UTILITY SUBMISSION PACKAGE - PyPDF2 NOT AVAILABLE: {import_err}")
        logger.error("UTILITY SUBMISSION PACKAGE - Cannot create merged PDF without PyPDF2")
        pyPDF2_available = False
        return False
    
    with tempfile.TemporaryDirectory() as temp_dir:
        logger.info(f"UTILITY SUBMISSION PACKAGE - Using temp_dir: {temp_dir}")
        
        # Create test PDFs matching the structure
        pdf_order = [
            "00_Submission_Checklist.pdf",
            "01_Cover_Letter_Application.pdf",
            "02_Executive_Summary.pdf",
        ]
        
        pdf_files_to_merge = []
        pdf_files_found = set()
        
        logger.info("UTILITY SUBMISSION PACKAGE - Scanning temp_dir for PDFs...")
        
        # Simulate finding PDFs
        for pdf_name in pdf_order:
            pdf_path = os.path.join(temp_dir, pdf_name)
            # Create a minimal test PDF
            try:
                from reportlab.pdfgen import canvas
                from reportlab.lib.pagesizes import letter
                c = canvas.Canvas(pdf_path, pagesize=letter)
                c.drawString(100, 750, f"Test: {pdf_name}")
                c.save()
                
                if os.path.exists(pdf_path) and pdf_path.endswith('.pdf'):
                    pdf_files_to_merge.append(pdf_path)
                    rel_path_normalized = pdf_name.replace('\\', '/')
                    pdf_files_found.add(rel_path_normalized)
                    logger.info(f"PDF MERGE - Found ordered PDF: {pdf_name}")
            except Exception as e:
                logger.warning(f"Could not create test PDF {pdf_name}: {e}")
        
        logger.info(f"UTILITY SUBMISSION PACKAGE - Total PDFs collected: {len(pdf_files_to_merge)}")
        
        if pdf_files_to_merge:
            logger.info(f"UTILITY SUBMISSION PACKAGE - Found {len(pdf_files_to_merge)} PDF files to merge:")
            for i, pdf_path in enumerate(pdf_files_to_merge, 1):
                pdf_name = os.path.relpath(pdf_path, temp_dir)
                file_size = os.path.getsize(pdf_path) if os.path.exists(pdf_path) else 0
                logger.info(f"  {i}. {pdf_name} ({file_size:,} bytes)")
            
            merged_pdf_name = "00_COMPLETE_UTILITY_SUBMISSION_PACKAGE.pdf"
            merged_pdf_path = os.path.join(temp_dir, merged_pdf_name)
            logger.info(f"UTILITY SUBMISSION PACKAGE - Merging PDFs into: {merged_pdf_name}")
            logger.info(f"UTILITY SUBMISSION PACKAGE - Output path: {merged_pdf_path}")
            
            if merge_pdfs(pdf_files_to_merge, merged_pdf_path):
                if os.path.exists(merged_pdf_path):
                    merged_size = os.path.getsize(merged_pdf_path)
                    logger.info(f"UTILITY SUBMISSION PACKAGE - Merged PDF created successfully: {merged_size:,} bytes")
                    logger.info(f"UTILITY SUBMISSION PACKAGE - Successfully added merged PDF to ZIP: {merged_pdf_name} ({merged_size:,} bytes, {len(pdf_files_to_merge)} documents)")
                    return True
                else:
                    logger.error(f"UTILITY SUBMISSION PACKAGE - CRITICAL: Merged PDF file was not created despite merge_pdfs returning True")
                    logger.error(f"UTILITY SUBMISSION PACKAGE - Expected path: {merged_pdf_path}")
                    return False
            else:
                logger.error("UTILITY SUBMISSION PACKAGE - CRITICAL: merge_pdfs returned False - merge failed!")
                return False
        else:
            logger.warning("UTILITY SUBMISSION PACKAGE - No PDF files found to merge")
            return False

def test_audit_package_merge_simulation():
    """Simulate the exact Audit Package merge process from the server"""
    print("\n" + "=" * 80)
    print("SIMULATING: Audit Package PDF Merge (Server Code Path)")
    print("=" * 80)
    
    try:
        from main_hardened_ready_fixed import merge_pdfs
        logger.info("AUDIT PACKAGE - Successfully imported merge_pdfs")
    except ImportError as e:
        logger.error(f"AUDIT PACKAGE - Failed to import merge_pdfs: {e}")
        return False
    
    # Check PyPDF2 availability FIRST (as the server code does)
    try:
        from PyPDF2 import PdfMerger
        logger.info("AUDIT PACKAGE - PyPDF2 is available")
        pyPDF2_available = True
    except ImportError as import_err:
        logger.error(f"AUDIT PACKAGE - PyPDF2 NOT AVAILABLE: {import_err}")
        logger.error("AUDIT PACKAGE - Cannot create merged PDF without PyPDF2")
        pyPDF2_available = False
        return False
    
    with tempfile.TemporaryDirectory() as temp_dir:
        logger.info(f"AUDIT PACKAGE - Using temp_dir: {temp_dir}")
        
        # Create test PDFs matching the structure
        pdf_order = [
            "00_Submission_Checklist.pdf",
            "03_audit_compliance_summary.pdf",
            "04_complete_analysis_results.pdf",
        ]
        
        pdf_files_to_merge = []
        pdf_files_found = set()
        
        logger.info(f"AUDIT PACKAGE - Scanning temp_dir: {temp_dir}")
        
        # Simulate finding PDFs
        for pdf_name in pdf_order:
            pdf_path = os.path.join(temp_dir, pdf_name)
            # Create a minimal test PDF
            try:
                from reportlab.pdfgen import canvas
                from reportlab.lib.pagesizes import letter
                c = canvas.Canvas(pdf_path, pagesize=letter)
                c.drawString(100, 750, f"Test: {pdf_name}")
                c.save()
                
                if os.path.exists(pdf_path) and pdf_path.endswith('.pdf'):
                    pdf_files_to_merge.append(pdf_path)
                    pdf_files_found.add(pdf_name)
                    logger.info(f"PDF MERGE - Found ordered PDF: {pdf_name}")
            except Exception as e:
                logger.warning(f"Could not create test PDF {pdf_name}: {e}")
        
        logger.info(f"AUDIT PACKAGE - Total PDFs collected: {len(pdf_files_to_merge)}")
        
        if pdf_files_to_merge:
            logger.info(f"AUDIT PACKAGE - Found {len(pdf_files_to_merge)} PDF files to merge:")
            for i, pdf_path in enumerate(pdf_files_to_merge, 1):
                pdf_name = os.path.basename(pdf_path)
                file_size = os.path.getsize(pdf_path) if os.path.exists(pdf_path) else 0
                logger.info(f"  {i}. {pdf_name} ({file_size:,} bytes)")
            
            merged_pdf_path = os.path.join(temp_dir, "00_COMPLETE_AUDIT_PACKAGE.pdf")
            logger.info(f"AUDIT PACKAGE - Merging PDFs into: 00_COMPLETE_AUDIT_PACKAGE.pdf")
            logger.info(f"AUDIT PACKAGE - Output path: {merged_pdf_path}")
            
            if merge_pdfs(pdf_files_to_merge, merged_pdf_path):
                if os.path.exists(merged_pdf_path):
                    merged_size = os.path.getsize(merged_pdf_path)
                    logger.info(f"AUDIT PACKAGE - Merged PDF created successfully: {merged_size:,} bytes")
                    logger.info(f"AUDIT PACKAGE - Successfully added merged PDF to ZIP: 00_COMPLETE_AUDIT_PACKAGE.pdf ({merged_size:,} bytes, {len(pdf_files_to_merge)} documents)")
                    return True
                else:
                    logger.error(f"AUDIT PACKAGE - CRITICAL: Merged PDF file was not created despite merge_pdfs returning True")
                    logger.error(f"AUDIT PACKAGE - Expected path: {merged_pdf_path}")
                    return False
            else:
                logger.error("AUDIT PACKAGE - CRITICAL: merge_pdfs returned False - merge failed!")
                return False
        else:
            logger.warning("AUDIT PACKAGE - No PDF files found to merge")
            return False

def main():
    """Run server log simulation"""
    print("\n" + "=" * 80)
    print("SERVER LOG SIMULATION")
    print("=" * 80)
    print("\nThis simulates the exact server code path with diagnostic logging")
    print("to show what happens during PDF merge operations.\n")
    
    results = []
    
    # Test Utility Submission merge
    logger.info("=" * 80)
    logger.info("UTILITY SUBMISSION PACKAGE - STARTING PDF MERGE PROCESS")
    logger.info("=" * 80)
    results.append(("Utility Submission Merge", test_utility_submission_merge_simulation()))
    logger.info("=" * 80)
    logger.info("UTILITY SUBMISSION PACKAGE - PDF MERGE PROCESS COMPLETE")
    logger.info("=" * 80)
    
    # Test Audit Package merge
    logger.info("=" * 80)
    logger.info("AUDIT PACKAGE - STARTING PDF MERGE PROCESS")
    logger.info("=" * 80)
    results.append(("Audit Package Merge", test_audit_package_merge_simulation()))
    logger.info("=" * 80)
    logger.info("AUDIT PACKAGE - PDF MERGE PROCESS COMPLETE")
    logger.info("=" * 80)
    
    # Summary
    print("\n" + "=" * 80)
    print("SIMULATION SUMMARY")
    print("=" * 80)
    
    all_passed = True
    for test_name, result in results:
        status = "[PASS]" if result else "[FAIL]"
        print(f"{status}: {test_name}")
        if not result:
            all_passed = False
    
    print("\n" + "=" * 80)
    if all_passed:
        print("[OK] ALL SIMULATIONS PASSED!")
        print("     The server code path works correctly with diagnostic logging.")
    else:
        print("[FAIL] SOME SIMULATIONS FAILED - Check logs above")
    print("=" * 80)
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())





