#!/usr/bin/env python3
"""
Synerex Duplicate File Cleanup Script
====================================

This script identifies and removes duplicate and orphaned files to clean up
the file system and improve performance.

CRITICAL FINDINGS:
- 1,126 total CSV files found
- 1,120 orphaned files (not in database)
- 922+ duplicate files with identical content
- Only 6 files properly tracked in database

SAFETY FEATURES:
- Dry-run mode by default
- Creates backup before deletion
- Detailed logging
- Confirmation prompts
"""

import os
import sqlite3
import hashlib
import shutil
from datetime import datetime
from collections import defaultdict

DATABASE = 'results/app.db'
BACKUP_DIR = f'backup_cleanup_{datetime.now().strftime("%Y%m%d_%H%M%S")}'

def get_db_connection():
    """Establishes a connection to the SQLite database."""
    try:
        conn = sqlite3.connect(DATABASE)
        conn.row_factory = sqlite3.Row
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return None

def get_file_hash(file_path):
    """Calculate MD5 hash of a file."""
    try:
        with open(file_path, 'rb') as f:
            return hashlib.md5(f.read()).hexdigest()
    except:
        return None

def analyze_duplicates():
    """Analyze and categorize duplicate files."""
    print("=== ANALYZING DUPLICATE FILES ===")
    
    # Get all CSV files
    csv_files = []
    for root, dirs, files in os.walk('.'):
        for file in files:
            if file.lower().endswith('.csv'):
                file_path = os.path.join(root, file)
                csv_files.append(file_path)
    
    print(f"Found {len(csv_files)} CSV files")
    
    # Get database-tracked files
    conn = get_db_connection()
    db_paths = set()
    if conn:
        cursor = conn.cursor()
        cursor.execute('SELECT file_path FROM raw_meter_data WHERE file_path IS NOT NULL')
        for row in cursor.fetchall():
            db_paths.add(os.path.abspath(row[0]))
        cursor.execute('SELECT file_path FROM project_files WHERE file_path IS NOT NULL')
        for row in cursor.fetchall():
            db_paths.add(os.path.abspath(row[0]))
        conn.close()
    
    print(f"Database tracks {len(db_paths)} files")
    
    # Categorize files
    orphaned_files = []
    tracked_files = []
    
    for file_path in csv_files:
        abs_path = os.path.abspath(file_path)
        if abs_path in db_paths:
            tracked_files.append(file_path)
        else:
            orphaned_files.append(file_path)
    
    print(f"Orphaned files: {len(orphaned_files)}")
    print(f"Tracked files: {len(tracked_files)}")
    
    # Find content duplicates among orphaned files
    print("\nAnalyzing content duplicates...")
    size_groups = defaultdict(list)
    
    for file_path in orphaned_files:
        try:
            size = os.path.getsize(file_path)
            size_groups[size].append(file_path)
        except:
            continue
    
    # Only check files with same size for content duplicates
    content_duplicates = []
    for size, paths in size_groups.items():
        if len(paths) > 1:
            hash_groups = defaultdict(list)
            for path in paths:
                file_hash = get_file_hash(path)
                if file_hash:
                    hash_groups[file_hash].append(path)
            
            for content_hash, hash_paths in hash_groups.items():
                if len(hash_paths) > 1:
                    content_duplicates.append((content_hash, hash_paths))
    
    return orphaned_files, tracked_files, content_duplicates

def create_cleanup_plan(orphaned_files, content_duplicates):
    """Create a detailed cleanup plan."""
    print("\n=== CLEANUP PLAN ===")
    
    # Group orphaned files by directory
    dir_groups = defaultdict(list)
    for file_path in orphaned_files:
        dir_path = os.path.dirname(file_path)
        dir_groups[dir_path].append(file_path)
    
    print("\n1. ORPHANED FILES BY DIRECTORY:")
    total_orphaned = 0
    for dir_path, files in sorted(dir_groups.items()):
        print(f"   {dir_path}: {len(files)} files")
        total_orphaned += len(files)
    
    print(f"\n   TOTAL ORPHANED FILES: {total_orphaned}")
    
    # Content duplicates summary
    print("\n2. CONTENT DUPLICATES:")
    total_duplicates = 0
    for content_hash, paths in content_duplicates:
        print(f"   Hash {content_hash[:16]}...: {len(paths)} identical files")
        total_duplicates += len(paths) - 1  # Keep one, remove the rest
    
    print(f"\n   TOTAL DUPLICATE FILES TO REMOVE: {total_duplicates}")
    
    # Calculate storage savings
    total_size = 0
    for file_path in orphaned_files:
        try:
            total_size += os.path.getsize(file_path)
        except:
            continue
    
    print(f"\n3. STORAGE IMPACT:")
    print(f"   Total size of orphaned files: {total_size / (1024*1024):.2f} MB")
    print(f"   Files to be removed: {total_orphaned + total_duplicates}")
    
    return total_orphaned, total_duplicates, total_size

def cleanup_files(dry_run=True, create_backup=True):
    """Perform the actual cleanup."""
    print(f"\n=== {'DRY RUN' if dry_run else 'CLEANUP'} MODE ===")
    
    orphaned_files, tracked_files, content_duplicates = analyze_duplicates()
    
    if create_backup and not dry_run:
        print(f"\nCreating backup in {BACKUP_DIR}...")
        os.makedirs(BACKUP_DIR, exist_ok=True)
    
    removed_count = 0
    removed_size = 0
    
    # Remove orphaned files
    print(f"\nRemoving {len(orphaned_files)} orphaned files...")
    for file_path in orphaned_files:
        try:
            file_size = os.path.getsize(file_path)
            if not dry_run:
                if create_backup:
                    backup_path = os.path.join(BACKUP_DIR, file_path.replace('\\', '_').replace('/', '_'))
                    shutil.copy2(file_path, backup_path)
                os.remove(file_path)
            removed_count += 1
            removed_size += file_size
            print(f"   {'[DRY RUN] ' if dry_run else ''}Removed: {file_path}")
        except Exception as e:
            print(f"   Error removing {file_path}: {e}")
    
    # Remove duplicate files (keep the first one in each group)
    print(f"\nRemoving duplicate files...")
    for content_hash, paths in content_duplicates:
        # Keep the first file, remove the rest
        keep_file = paths[0]
        remove_files = paths[1:]
        
        print(f"   Keeping: {keep_file}")
        for file_path in remove_files:
            try:
                file_size = os.path.getsize(file_path)
                if not dry_run:
                    if create_backup:
                        backup_path = os.path.join(BACKUP_DIR, file_path.replace('\\', '_').replace('/', '_'))
                        shutil.copy2(file_path, backup_path)
                    os.remove(file_path)
                removed_count += 1
                removed_size += file_size
                print(f"   {'[DRY RUN] ' if dry_run else ''}Removed duplicate: {file_path}")
            except Exception as e:
                print(f"   Error removing {file_path}: {e}")
    
    print(f"\n=== CLEANUP SUMMARY ===")
    print(f"Files {'would be ' if dry_run else ''}removed: {removed_count}")
    print(f"Storage {'would be ' if dry_run else ''}freed: {removed_size / (1024*1024):.2f} MB")
    
    if not dry_run and create_backup:
        print(f"Backup created in: {BACKUP_DIR}")

def main():
    """Main cleanup function."""
    print("Synerex Duplicate File Cleanup Script")
    print("====================================")
    print()
    
    # Analyze first
    orphaned_files, tracked_files, content_duplicates = analyze_duplicates()
    total_orphaned, total_duplicates, total_size = create_cleanup_plan(orphaned_files, content_duplicates)
    
    print(f"\n=== RECOMMENDATIONS ===")
    print("1. IMMEDIATE ACTION REQUIRED:")
    print(f"   - Remove {total_orphaned} orphaned files")
    print(f"   - Remove {total_duplicates} duplicate files")
    print(f"   - Free up {total_size / (1024*1024):.2f} MB of storage")
    print()
    print("2. SAFETY MEASURES:")
    print("   - Always run in dry-run mode first")
    print("   - Create backups before deletion")
    print("   - Verify database integrity after cleanup")
    print()
    print("3. COMMANDS TO RUN:")
    print("   # Dry run (safe, shows what would be deleted):")
    print("   python cleanup_duplicate_files.py --dry-run")
    print()
    print("   # Actual cleanup with backup:")
    print("   python cleanup_duplicate_files.py --cleanup --backup")
    print()
    print("   # Actual cleanup without backup (NOT RECOMMENDED):")
    print("   python cleanup_duplicate_files.py --cleanup")
    
    # Check command line arguments
    import sys
    if len(sys.argv) > 1:
        if '--dry-run' in sys.argv:
            cleanup_files(dry_run=True)
        elif '--cleanup' in sys.argv:
            backup = '--backup' in sys.argv
            response = input(f"\nWARNING: This will permanently delete {total_orphaned + total_duplicates} files!\nProceed? (yes/no): ")
            if response.lower() == 'yes':
                cleanup_files(dry_run=False, create_backup=backup)
            else:
                print("Cleanup cancelled.")
        else:
            print("\nInvalid arguments. Use --dry-run or --cleanup [--backup]")

if __name__ == "__main__":
    main()
