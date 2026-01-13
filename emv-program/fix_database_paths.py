#!/usr/bin/env python3
import sqlite3
import os
from pathlib import Path

def fix_database_paths():
    """Update database to point to verified files instead of analysis files"""
    
    # Connect to the database
    conn = sqlite3.connect('results/app.db')
    cursor = conn.cursor()
    
    # Get the most recent verified files
    verified_dir = Path('8082/files/protected/verified')
    if not verified_dir.exists():
        print("❌ Verified directory not found!")
        return
    
    # Get all verified files sorted by modification time
    verified_files = list(verified_dir.glob('*.csv'))
    verified_files.sort(key=lambda x: x.stat().st_mtime, reverse=True)
    
    print(f"Found {len(verified_files)} verified files:")
    for i, file in enumerate(verified_files[:5]):  # Show first 5
        print(f"  {i+1}. {file.name}")
    
    if len(verified_files) < 2:
        print("❌ Need at least 2 files (before and after)")
        return
    
    # Get the two most recent files
    before_file = verified_files[1]  # Second most recent
    after_file = verified_files[0]  # Most recent
    
    print(f"\nUsing files:")
    print(f"  Before: {before_file.name}")
    print(f"  After: {after_file.name}")
    
    # Update the database to point to these files
    try:
        # Get the most recent fingerprint IDs
        cursor.execute("SELECT id FROM csv_fingerprints ORDER BY id DESC LIMIT 2")
        recent_ids = cursor.fetchall()
        
        if len(recent_ids) < 2:
            print("❌ Not enough fingerprint records in database")
            return
        
        before_id = recent_ids[1][0]  # Second most recent
        after_id = recent_ids[0][0]   # Most recent
        
        print(f"\nUpdating database:")
        print(f"  Before ID {before_id} -> {before_file}")
        print(f"  After ID {after_id} -> {after_file}")
        
        # Update the file paths
        cursor.execute("""
            UPDATE csv_fingerprints 
            SET file_path = ? 
            WHERE id = ?
        """, (str(before_file), before_id))
        
        cursor.execute("""
            UPDATE csv_fingerprints 
            SET file_path = ? 
            WHERE id = ?
        """, (str(after_file), after_id))
        
        conn.commit()
        print("✅ Database updated successfully!")
        
        # Verify the update
        cursor.execute("SELECT id, file_path FROM csv_fingerprints WHERE id IN (?, ?)", (before_id, after_id))
        updated = cursor.fetchall()
        print("\nUpdated records:")
        for record in updated:
            print(f"  ID {record[0]}: {record[1]}")
            
    except Exception as e:
        print(f"❌ Error updating database: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    fix_database_paths()

