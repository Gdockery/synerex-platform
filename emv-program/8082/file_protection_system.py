#!/usr/bin/env python3
"""
File Protection System for Synerex OneForm
Prevents accidental file overwrites and provides backup functionality
"""

import os
import shutil
import sqlite3
import json
from datetime import datetime
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

class FileProtectionSystem:
    def __init__(self, base_dir="results"):
        self.base_dir = Path(base_dir)
        self.backup_dir = self.base_dir / "backups"
        self.protected_files = set()
        self.create_backup_directories()
    
    def create_backup_directories(self):
        """Create necessary backup directories"""
        self.backup_dir.mkdir(parents=True, exist_ok=True)
        (self.backup_dir / "databases").mkdir(exist_ok=True)
        (self.backup_dir / "uploads").mkdir(exist_ok=True)
        (self.backup_dir / "reports").mkdir(exist_ok=True)
    
    def is_file_protected(self, file_path):
        """Check if a file is protected from overwrites"""
        return str(file_path) in self.protected_files
    
    def protect_file(self, file_path):
        """Mark a file as protected"""
        self.protected_files.add(str(file_path))
        logger.info(f"File protected: {file_path}")
    
    def unprotect_file(self, file_path):
        """Remove protection from a file"""
        self.protected_files.discard(str(file_path))
        logger.info(f"File protection removed: {file_path}")
    
    def create_backup(self, file_path, backup_type="manual"):
        """Create a timestamped backup of a file"""
        file_path = Path(file_path)
        if not file_path.exists():
            logger.warning(f"Cannot backup non-existent file: {file_path}")
            return None
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_name = f"{file_path.stem}_{backup_type}_{timestamp}{file_path.suffix}"
        
        # Determine backup location based on file type
        if file_path.suffix == '.db':
            backup_location = self.backup_dir / "databases" / backup_name
        elif file_path.suffix in ['.csv', '.xlsx', '.xls']:
            backup_location = self.backup_dir / "uploads" / backup_name
        elif file_path.suffix in ['.html', '.pdf']:
            backup_location = self.backup_dir / "reports" / backup_name
        else:
            backup_location = self.backup_dir / backup_name
        
        try:
            shutil.copy2(file_path, backup_location)
            logger.info(f"Backup created: {file_path} -> {backup_location}")
            return backup_location
        except Exception as e:
            logger.error(f"Failed to create backup: {e}")
            return None
    
    def safe_file_operation(self, file_path, operation_func, *args, **kwargs):
        """Safely perform a file operation with backup and protection checks"""
        file_path = Path(file_path)
        
        # Check if file is protected
        if self.is_file_protected(file_path) and file_path.exists():
            logger.warning(f"🚨 DANGER: Attempted to modify protected file: {file_path}")
            return {
                "success": False,
                "error": "🚨 DANGER: File is protected from modification",
                "danger": True,
                "file_path": str(file_path),
                "message": f"🚨 DANGER: Cannot overwrite protected file '{file_path.name}'. This file contains important data and is protected from accidental modification."
            }
        
        # Create backup if file exists
        backup_path = None
        if file_path.exists():
            backup_path = self.create_backup(file_path, "auto")
            if not backup_path:
                return {
                    "success": False,
                    "error": "Failed to create backup",
                    "file_path": str(file_path)
                }
        
        try:
            # Perform the operation
            result = operation_func(file_path, *args, **kwargs)
            logger.info(f"File operation successful: {file_path}")
            return {
                "success": True,
                "result": result,
                "backup_path": str(backup_path) if backup_path else None,
                "file_path": str(file_path)
            }
        except Exception as e:
            logger.error(f"File operation failed: {e}")
            # Restore from backup if operation failed
            if backup_path and backup_path.exists():
                try:
                    shutil.copy2(backup_path, file_path)
                    logger.info(f"File restored from backup: {file_path}")
                except Exception as restore_error:
                    logger.error(f"Failed to restore from backup: {restore_error}")
            
            return {
                "success": False,
                "error": str(e),
                "backup_path": str(backup_path) if backup_path else None,
                "file_path": str(file_path)
            }
    
    def list_backups(self, file_pattern="*"):
        """List all available backups"""
        backups = []
        for backup_type_dir in self.backup_dir.iterdir():
            if backup_type_dir.is_dir():
                for backup_file in backup_type_dir.glob(file_pattern):
                    if backup_file.is_file():
                        stat = backup_file.stat()
                        backups.append({
                            "path": str(backup_file),
                            "name": backup_file.name,
                            "size": stat.st_size,
                            "created": datetime.fromtimestamp(stat.st_ctime),
                            "modified": datetime.fromtimestamp(stat.st_mtime),
                            "type": backup_type_dir.name
                        })
        
        return sorted(backups, key=lambda x: x["created"], reverse=True)
    
    def restore_from_backup(self, backup_path, target_path=None):
        """Restore a file from backup"""
        backup_path = Path(backup_path)
        if not backup_path.exists():
            return {
                "success": False,
                "error": "Backup file does not exist"
            }
        
        if target_path is None:
            # Try to determine target path from backup name
            # Remove timestamp and backup type from filename
            name_parts = backup_path.stem.split('_')
            if len(name_parts) >= 3:
                original_name = '_'.join(name_parts[:-2]) + backup_path.suffix
                target_path = self.base_dir / original_name
            else:
                target_path = self.base_dir / backup_path.name
        
        target_path = Path(target_path)
        
        # Create backup of current file if it exists
        if target_path.exists():
            current_backup = self.create_backup(target_path, "pre_restore")
            if not current_backup:
                return {
                    "success": False,
                    "error": "Failed to backup current file before restore"
                }
        
        try:
            shutil.copy2(backup_path, target_path)
            logger.info(f"File restored: {backup_path} -> {target_path}")
            return {
                "success": True,
                "target_path": str(target_path),
                "backup_path": str(backup_path)
            }
        except Exception as e:
            logger.error(f"Restore failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def cleanup_old_backups(self, days_to_keep=30):
        """Clean up old backup files"""
        cutoff_date = datetime.now().timestamp() - (days_to_keep * 24 * 60 * 60)
        cleaned_count = 0
        
        for backup_type_dir in self.backup_dir.iterdir():
            if backup_type_dir.is_dir():
                for backup_file in backup_type_dir.iterdir():
                    if backup_file.is_file() and backup_file.stat().st_mtime < cutoff_date:
                        try:
                            backup_file.unlink()
                            cleaned_count += 1
                            logger.info(f"Cleaned up old backup: {backup_file}")
                        except Exception as e:
                            logger.error(f"Failed to clean up backup {backup_file}: {e}")
        
        logger.info(f"Cleaned up {cleaned_count} old backup files")
        return cleaned_count
    
    def check_database_overwrite_danger(self, file_path):
        """Check if a database file is about to be overwritten and return danger notice"""
        file_path = Path(file_path)
        
        # Check if it's a database file
        if file_path.suffix.lower() == '.db':
            if file_path.exists():
                # Get file size and modification time for context
                stat = file_path.stat()
                file_size = stat.st_size
                mod_time = datetime.fromtimestamp(stat.st_mtime)
                
                return {
                    "danger": True,
                    "file_type": "database",
                    "file_path": str(file_path),
                    "file_size": file_size,
                    "last_modified": mod_time.strftime("%Y-%m-%d %H:%M:%S"),
                    "warning_level": "CRITICAL",
                    "message": f"🚨 DANGER: Database file '{file_path.name}' will be overwritten!",
                    "details": f"This database file ({file_size:,} bytes, last modified: {mod_time.strftime('%Y-%m-%d %H:%M:%S')}) contains important project data and will be permanently replaced.",
                    "recommendation": "Create a backup before proceeding or use a different filename."
                }
        
        return {"danger": False}

# Global instance
file_protection = FileProtectionSystem()

def protect_database_file(db_path):
    """Protect the main database file from accidental overwrites"""
    file_protection.protect_file(db_path)
    logger.info(f"Database file protected: {db_path}")

def safe_database_operation(db_path, operation_func, *args, **kwargs):
    """Safely perform database operations with backup"""
    return file_protection.safe_file_operation(db_path, operation_func, *args, **kwargs)

def create_manual_backup(file_path):
    """Create a manual backup of a file"""
    return file_protection.create_backup(file_path, "manual")

def list_available_backups():
    """List all available backups"""
    return file_protection.list_backups()

def restore_from_backup(backup_path, target_path=None):
    """Restore a file from backup"""
    return file_protection.restore_from_backup(backup_path, target_path)

def check_database_overwrite_danger(file_path):
    """Check if a database file is about to be overwritten"""
    return file_protection.check_database_overwrite_danger(file_path)

if __name__ == "__main__":
    # Example usage
    logging.basicConfig(level=logging.INFO)
    
    # Test the system
    test_file = "test_file.txt"
    
    # Create a test file
    with open(test_file, 'w') as f:
        f.write("Test content")
    
    # Protect the file
    file_protection.protect_file(test_file)
    
    # Try to modify it (should fail)
    result = file_protection.safe_file_operation(
        test_file, 
        lambda path: open(path, 'w').write("Modified content")
    )
    
    print(f"Modification result: {result}")
    
    # Create backup
    backup = file_protection.create_backup(test_file)
    print(f"Backup created: {backup}")
    
    # List backups
    backups = file_protection.list_backups()
    print(f"Available backups: {len(backups)}")
    
    # Clean up
    os.remove(test_file)
    if backup:
        os.remove(backup)
