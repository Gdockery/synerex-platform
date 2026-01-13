#!/usr/bin/env python3
"""
SYNEREX OneForm - Codebase Cleanup Script
Safely removes test, debug, backup, demo, temp, and sample files
"""

import os
import shutil
import subprocess
import sys
from pathlib import Path
from datetime import datetime

class CodebaseCleanup:
    def __init__(self, project_root):
        self.project_root = Path(project_root)
        self.backup_dir = self.project_root / f"cleanup_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        self.removed_files = []
        self.removed_dirs = []
        
    def log(self, message):
        """Log cleanup actions"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        print(f"[{timestamp}] {message}")
        
    def create_backup(self):
        """Create backup of current state"""
        self.log("Creating backup of current state...")
        self.backup_dir.mkdir(exist_ok=True)
        
        # Create git commit
        try:
            subprocess.run(['git', 'add', '.'], cwd=self.project_root, check=True)
            subprocess.run(['git', 'commit', '-m', f'Pre-cleanup backup - {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}'], 
                         cwd=self.project_root, check=True)
            self.log("✅ Git backup created")
        except subprocess.CalledProcessError as e:
            self.log(f"⚠️ Git backup failed: {e}")
            
    def remove_files_by_pattern(self, pattern, description, keep_files=None):
        """Remove files matching pattern"""
        if keep_files is None:
            keep_files = []
            
        self.log(f"Removing {description}...")
        removed_count = 0
        
        for root, dirs, files in os.walk(self.project_root):
            # Skip backup directory
            if str(self.backup_dir) in root:
                continue
                
            for file in files:
                file_path = Path(root) / file
                relative_path = file_path.relative_to(self.project_root)
                
                # Check if file matches pattern
                if pattern in file.lower():
                    # Check if file should be kept
                    if str(relative_path) in keep_files:
                        self.log(f"  Keeping: {relative_path}")
                        continue
                        
                    try:
                        # Move to backup instead of deleting
                        backup_path = self.backup_dir / relative_path
                        backup_path.parent.mkdir(parents=True, exist_ok=True)
                        shutil.move(str(file_path), str(backup_path))
                        
                        self.removed_files.append(str(relative_path))
                        removed_count += 1
                        self.log(f"  Removed: {relative_path}")
                        
                    except Exception as e:
                        self.log(f"  Error removing {relative_path}: {e}")
                        
        self.log(f"✅ Removed {removed_count} {description}")
        
    def remove_directories(self, dir_patterns, description):
        """Remove directories matching patterns"""
        self.log(f"Removing {description}...")
        removed_count = 0
        
        for root, dirs, files in os.walk(self.project_root):
            # Skip backup directory
            if str(self.backup_dir) in root:
                continue
                
            for dir_name in dirs:
                dir_path = Path(root) / dir_name
                relative_path = dir_path.relative_to(self.project_root)
                
                # Check if directory matches any pattern
                should_remove = False
                for pattern in dir_patterns:
                    if pattern in dir_name.lower():
                        should_remove = True
                        break
                        
                if should_remove:
                    try:
                        # Move to backup instead of deleting
                        backup_path = self.backup_dir / relative_path
                        backup_path.parent.mkdir(parents=True, exist_ok=True)
                        shutil.move(str(dir_path), str(backup_path))
                        
                        self.removed_dirs.append(str(relative_path))
                        removed_count += 1
                        self.log(f"  Removed directory: {relative_path}")
                        
                    except Exception as e:
                        self.log(f"  Error removing directory {relative_path}: {e}")
                        
        self.log(f"✅ Removed {removed_count} {description}")
        
    def cleanup_phase_1_test_files(self):
        """Phase 1: Remove test files"""
        self.log("=== PHASE 1: Removing test files ===")
        
        # Keep essential test files
        keep_files = [
            "8086/test_chart_service.py",  # Needed for service testing
        ]
        
        self.remove_files_by_pattern("test_", "test files", keep_files)
        self.remove_files_by_pattern("_test", "test files", keep_files)
        
    def cleanup_phase_2_debug_files(self):
        """Phase 2: Remove debug files"""
        self.log("=== PHASE 2: Removing debug files ===")
        
        self.remove_files_by_pattern("debug_", "debug files")
        self.remove_files_by_pattern("debug", "debug files")
        
    def cleanup_phase_3_backup_files(self):
        """Phase 3: Remove backup files"""
        self.log("=== PHASE 3: Removing backup files ===")
        
        # Remove backup directories
        backup_dirs = [
            "backup_before_port_update_20251004_231017",
            "cleanup_backup",
            "generated_reports",  # Duplicate of 8084/generated_reports
        ]
        
        for dir_name in backup_dirs:
            dir_path = self.project_root / dir_name
            if dir_path.exists():
                try:
                    backup_path = self.backup_dir / dir_name
                    backup_path.parent.mkdir(parents=True, exist_ok=True)
                    shutil.move(str(dir_path), str(backup_path))
                    self.removed_dirs.append(dir_name)
                    self.log(f"  Removed directory: {dir_name}")
                except Exception as e:
                    self.log(f"  Error removing directory {dir_name}: {e}")
                    
        # Remove individual backup files
        self.remove_files_by_pattern("backup", "backup files")
        
    def cleanup_phase_4_check_files(self):
        """Phase 4: Remove check files (keep check_services.sh)"""
        self.log("=== PHASE 4: Removing check files ===")
        
        # Keep essential check files
        keep_files = [
            "check_services.sh",  # Needed for service management
        ]
        
        self.remove_files_by_pattern("check_", "check files", keep_files)
        
    def cleanup_phase_5_demo_temp_sample_files(self):
        """Phase 5: Remove demo, temp, and sample files"""
        self.log("=== PHASE 5: Removing demo, temp, and sample files ===")
        
        # Remove demo files
        self.remove_files_by_pattern("demo_", "demo files")
        self.remove_files_by_pattern("demo", "demo files")
        
        # Remove temp files
        self.remove_files_by_pattern("temp", "temp files")
        
        # Remove sample files
        self.remove_files_by_pattern("sample_", "sample files")
        self.remove_files_by_pattern("sample", "sample files")
        
    def cleanup_phase_6_duplicate_files(self):
        """Phase 6: Remove duplicate and unused files"""
        self.log("=== PHASE 6: Removing duplicate and unused files ===")
        
        # Remove duplicate service files in 8084
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
            full_path = self.project_root / file_path
            if full_path.exists():
                try:
                    backup_path = self.backup_dir / file_path
                    backup_path.parent.mkdir(parents=True, exist_ok=True)
                    shutil.move(str(full_path), str(backup_path))
                    self.removed_files.append(file_path)
                    self.log(f"  Removed duplicate: {file_path}")
                except Exception as e:
                    self.log(f"  Error removing {file_path}: {e}")
                    
        # Remove old port migration files
        migration_files = [
            "migrate_ports.py",
            "update_all_port_references.py",
            "simple_port_update.py",
        ]
        
        for file_path in migration_files:
            full_path = self.project_root / file_path
            if full_path.exists():
                try:
                    backup_path = self.backup_dir / file_path
                    backup_path.parent.mkdir(parents=True, exist_ok=True)
                    shutil.move(str(full_path), str(backup_path))
                    self.removed_files.append(file_path)
                    self.log(f"  Removed migration file: {file_path}")
                except Exception as e:
                    self.log(f"  Error removing {file_path}: {e}")
                    
    def generate_cleanup_report(self):
        """Generate cleanup report"""
        report_path = self.project_root / "CLEANUP_REPORT.md"
        
        with open(report_path, 'w') as f:
            f.write("# SYNEREX OneForm - Cleanup Report\n\n")
            f.write(f"**Cleanup Date**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            f.write(f"**Backup Location**: {self.backup_dir}\n\n")
            
            f.write("## Files Removed\n\n")
            f.write(f"**Total Files Removed**: {len(self.removed_files)}\n\n")
            for file_path in sorted(self.removed_files):
                f.write(f"- {file_path}\n")
                
            f.write("\n## Directories Removed\n\n")
            f.write(f"**Total Directories Removed**: {len(self.removed_dirs)}\n\n")
            for dir_path in sorted(self.removed_dirs):
                f.write(f"- {dir_path}\n")
                
            f.write("\n## Cleanup Summary\n\n")
            f.write("- ✅ Test files removed\n")
            f.write("- ✅ Debug files removed\n")
            f.write("- ✅ Backup files removed\n")
            f.write("- ✅ Check files removed\n")
            f.write("- ✅ Demo files removed\n")
            f.write("- ✅ Temp files removed\n")
            f.write("- ✅ Sample files removed\n")
            f.write("- ✅ Duplicate files removed\n")
            f.write("- ✅ Migration files removed\n")
            
            f.write("\n## Next Steps\n\n")
            f.write("1. Test all services: `./start_all_services.sh`\n")
            f.write("2. Verify main application functionality\n")
            f.write("3. Test PDF generation\n")
            f.write("4. Test HTML report generation\n")
            f.write("5. Test chart generation\n")
            f.write("6. Test weather service\n")
            
        self.log(f"✅ Cleanup report generated: {report_path}")
        
    def run_cleanup(self):
        """Run complete cleanup process"""
        self.log("🚀 Starting SYNEREX OneForm Codebase Cleanup")
        self.log(f"Project root: {self.project_root}")
        
        try:
            # Create backup
            self.create_backup()
            
            # Run cleanup phases
            self.cleanup_phase_1_test_files()
            self.cleanup_phase_2_debug_files()
            self.cleanup_phase_3_backup_files()
            self.cleanup_phase_4_check_files()
            self.cleanup_phase_5_demo_temp_sample_files()
            self.cleanup_phase_6_duplicate_files()
            
            # Generate report
            self.generate_cleanup_report()
            
            self.log("🎉 Cleanup completed successfully!")
            self.log(f"📁 Backup location: {self.backup_dir}")
            self.log(f"📊 Files removed: {len(self.removed_files)}")
            self.log(f"📊 Directories removed: {len(self.removed_dirs)}")
            
        except Exception as e:
            self.log(f"❌ Cleanup failed: {e}")
            sys.exit(1)

def main():
    if len(sys.argv) != 2:
        print("Usage: python cleanup_codebase.py <project_root>")
        sys.exit(1)
        
    project_root = sys.argv[1]
    if not os.path.exists(project_root):
        print(f"Error: Project root {project_root} does not exist")
        sys.exit(1)
        
    cleanup = CodebaseCleanup(project_root)
    cleanup.run_cleanup()

if __name__ == "__main__":
    main()
