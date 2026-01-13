#!/usr/bin/env python3
"""
SYNEREX OneForm - Preview Cleanup Script
Shows what files would be removed without actually removing them
"""

import os
from pathlib import Path

def preview_cleanup(project_root):
    """Preview what files would be removed"""
    project_path = Path(project_root)
    
    # Patterns to match
    patterns = {
        "test_": "Test files",
        "_test": "Test files", 
        "debug_": "Debug files",
        "debug": "Debug files",
        "backup": "Backup files",
        "check_": "Check files",
        "demo_": "Demo files",
        "demo": "Demo files",
        "temp": "Temp files",
        "sample_": "Sample files",
        "sample": "Sample files",
    }
    
    # Directories to remove
    dirs_to_remove = [
        "backup_before_port_update_20251004_231017",
        "cleanup_backup", 
        "generated_reports",
    ]
    
    # Files to keep
    keep_files = [
        "check_services.sh",
        "8086/test_chart_service.py",
    ]
    
    results = {}
    total_files = 0
    total_dirs = 0
    
    print("🔍 SYNEREX OneForm - Cleanup Preview")
    print("=" * 50)
    
    # Check directories to remove
    print("\n📁 Directories to remove:")
    for dir_name in dirs_to_remove:
        dir_path = project_path / dir_name
        if dir_path.exists():
            print(f"  ✅ {dir_name}")
            total_dirs += 1
        else:
            print(f"  ❌ {dir_name} (not found)")
    
    # Check files by pattern
    print("\n📄 Files to remove by pattern:")
    for pattern, description in patterns.items():
        matching_files = []
        
        for root, dirs, files in os.walk(project_path):
            # Skip directories we're removing
            if any(dir_name in root for dir_name in dirs_to_remove):
                continue
                
            for file in files:
                if pattern in file.lower():
                    file_path = Path(root) / file
                    relative_path = file_path.relative_to(project_path)
                    
                    # Check if file should be kept
                    if str(relative_path) in keep_files:
                        continue
                        
                    matching_files.append(str(relative_path))
        
        if matching_files:
            print(f"\n  {description} ({len(matching_files)} files):")
            for file_path in sorted(matching_files)[:10]:  # Show first 10
                print(f"    - {file_path}")
            if len(matching_files) > 10:
                print(f"    ... and {len(matching_files) - 10} more files")
            total_files += len(matching_files)
        else:
            print(f"\n  {description}: No files found")
    
    # Check for duplicate service files
    print("\n🔄 Duplicate service files to remove:")
    duplicate_files = [
        "8084/pdf_generator_8086_working.py",
        "8084/pdf_generator_8086_simple.py", 
        "8084/pdf_generator_8086_fixed.py",
        "8084/pdf_generator_8084.py",
        "8084/simple_flask_service.py",
        "8084/simple_http_server.py",
        "8084/simple_html_processor.py",
        "8084/simple_html_report_generator.py",
        "8084/simple_report_generator.py",
        "8084/simple_template_processor.py",
    ]
    
    for file_path in duplicate_files:
        full_path = project_path / file_path
        if full_path.exists():
            print(f"  ✅ {file_path}")
            total_files += 1
        else:
            print(f"  ❌ {file_path} (not found)")
    
    # Migration files
    print("\n🚀 Migration files to remove:")
    migration_files = [
        "migrate_ports.py",
        "update_all_port_references.py", 
        "simple_port_update.py",
    ]
    
    for file_path in migration_files:
        full_path = project_path / file_path
        if full_path.exists():
            print(f"  ✅ {file_path}")
            total_files += 1
        else:
            print(f"  ❌ {file_path} (not found)")
    
    print("\n" + "=" * 50)
    print(f"📊 SUMMARY:")
    print(f"  Total files to remove: {total_files}")
    print(f"  Total directories to remove: {total_dirs}")
    print(f"  Estimated space savings: Significant")
    print("\n💡 To proceed with cleanup, run:")
    print(f"  python cleanup_codebase.py {project_root}")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) != 2:
        print("Usage: python preview_cleanup.py <project_root>")
        sys.exit(1)
        
    project_root = sys.argv[1]
    if not os.path.exists(project_root):
        print(f"Error: Project root {project_root} does not exist")
        sys.exit(1)
        
    preview_cleanup(project_root)
