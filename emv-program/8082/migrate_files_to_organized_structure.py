#!/usr/bin/env python3
"""
File Migration Script - Move existing files to organized structure
"""

import os
import shutil
import sqlite3
from datetime import datetime
from pathlib import Path

def get_db_connection():
    """Get database connection"""
    db_path = os.path.join(os.getcwd(), 'results', 'app.db')
    try:
        conn = sqlite3.connect(db_path)
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return None

def migrate_files():
    """Migrate existing files to organized structure"""
    print("Starting file migration to organized structure...")
    
    # Create organized directories
    organized_dirs = [
        'files/raw',
        'files/processed/ready_for_analysis', 
        'files/processed/archived',
        'files/projects',
        'files/temp'
    ]
    
    for dir_path in organized_dirs:
        os.makedirs(dir_path, exist_ok=True)
        print(f"Created directory: {dir_path}")
    
    # Get database connection
    conn = get_db_connection()
    if not conn:
        print("Could not connect to database")
        return
    
    cursor = conn.cursor()
    
    # Migrate raw_meter_data files
    print("\nMigrating raw meter data files...")
    cursor.execute("SELECT id, file_name, file_path FROM raw_meter_data")
    raw_files = cursor.fetchall()
    
    for file_id, file_name, file_path in raw_files:
        if os.path.exists(file_path):
            # Create date-based directory
            today = datetime.now().strftime('%Y-%m-%d')
            new_dir = os.path.join('files', 'raw', today)
            os.makedirs(new_dir, exist_ok=True)
            
            # Generate clean filename
            clean_filename = file_name.replace(' ', '_').replace('(', '').replace(')', '')
            new_filename = f"{today}_{clean_filename}"
            new_path = os.path.join(new_dir, new_filename)
            
            try:
                # Copy file to new location
                shutil.copy2(file_path, new_path)
                
                # Update database path
                cursor.execute("UPDATE raw_meter_data SET file_path = ? WHERE id = ?", (new_path, file_id))
                
                print(f"Migrated: {file_name} -> {new_path}")
                
            except Exception as e:
                print(f"Error migrating {file_name}: {e}")
    
    # Migrate project files
    print("\nMigrating project files...")
    cursor.execute("SELECT id, project_name, file_name, file_path FROM project_files")
    project_files = cursor.fetchall()
    
    for file_id, project_name, file_name, file_path in project_files:
        if os.path.exists(file_path):
            # Create project directory
            clean_project_name = project_name.replace(' ', '_').replace('(', '').replace(')', '').lower()
            new_dir = os.path.join('files', 'projects', clean_project_name)
            os.makedirs(new_dir, exist_ok=True)
            
            # Generate clean filename
            clean_filename = file_name.replace(' ', '_').replace('(', '').replace(')', '')
            new_path = os.path.join(new_dir, clean_filename)
            
            try:
                # Copy file to new location
                shutil.copy2(file_path, new_path)
                
                # Update database path
                cursor.execute("UPDATE project_files SET file_path = ? WHERE id = ?", (new_path, file_id))
                
                print(f"Migrated project file: {file_name} -> {new_path}")
                
            except Exception as e:
                print(f"Error migrating project file {file_name}: {e}")
    
    # Commit changes
    conn.commit()
    conn.close()
    
    print("\nFile migration completed!")
    print("\nNew organized structure:")
    print("   files/raw/YYYY-MM-DD/          - Original uploaded files")
    print("   files/processed/ready_for_analysis/ - Files ready for analysis")
    print("   files/processed/archived/      - Archived processed files")
    print("   files/projects/project_name/   - Project-specific files")
    print("   files/temp/                    - Temporary files")

if __name__ == "__main__":
    migrate_files()
