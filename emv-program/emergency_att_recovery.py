#!/usr/bin/env python3
import sqlite3
import os
import shutil
from datetime import datetime

def emergency_att_recovery():
    """Emergency recovery of AT&T project from all possible sources"""
    
    print("🚨 EMERGENCY AT&T PROJECT RECOVERY")
    print("=" * 60)
    
    # Check all possible database locations
    db_locations = [
        '8082/results/app.db',
        '8082/results/backups/app_latest.db',
        '8082/results/backups/app_backup_20251005_000718.db',
        '8082/results/backups/app_backup_20250930_095841.db',
        '8082/results/backups/app_backup_20250929_140230.db',
        'results/app.db',
        'synerex.db',
        '8082/synerex.db'
    ]
    
    att_found = False
    best_backup = None
    max_att_projects = 0
    
    print("🔍 SEARCHING ALL DATABASE LOCATIONS:")
    print("-" * 50)
    
    for db_path in db_locations:
        if os.path.exists(db_path):
            try:
                conn = sqlite3.connect(db_path)
                cursor = conn.cursor()
                
                # Check for AT&T projects
                cursor.execute("""
                    SELECT COUNT(*) FROM projects 
                    WHERE name LIKE '%att%' OR name LIKE '%AT&T%' OR name LIKE '%at&t%'
                """)
                att_count = cursor.fetchone()[0]
                
                if att_count > 0:
                    print(f"🎯 FOUND {att_count} AT&T PROJECTS IN: {db_path}")
                    
                    # Get details
                    cursor.execute("""
                        SELECT id, name, description, created_at, data 
                        FROM projects 
                        WHERE name LIKE '%att%' OR name LIKE '%AT&T%' OR name LIKE '%at&t%'
                    """)
                    att_projects = cursor.fetchall()
                    
                    for project in att_projects:
                        project_id, name, description, created_at, data = project
                        print(f"  🆔 ID: {project_id}")
                        print(f"  📝 Name: {name}")
                        print(f"  📄 Description: {description or 'No description'}")
                        print(f"  📅 Created: {created_at}")
                        if data:
                            print(f"  💾 Has data: {len(data)} characters")
                        print()
                    
                    if att_count > max_att_projects:
                        max_att_projects = att_count
                        best_backup = db_path
                        att_found = True
                else:
                    print(f"❌ No AT&T projects in: {db_path}")
                
                conn.close()
                
            except Exception as e:
                print(f"❌ Error checking {db_path}: {e}")
        else:
            print(f"❌ Not found: {db_path}")
    
    if att_found and best_backup:
        print(f"\n🎯 BEST BACKUP FOUND: {best_backup}")
        print(f"📊 Contains {max_att_projects} AT&T projects")
        
        # Restore the best backup
        print(f"\n🔧 RESTORING AT&T PROJECT FROM BEST BACKUP...")
        
        try:
            # Backup current database
            current_db = '8082/results/app.db'
            if os.path.exists(current_db):
                backup_name = f"{current_db}.emergency_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
                shutil.copy2(current_db, backup_name)
                print(f"📋 Backed up current database to: {backup_name}")
            
            # Restore from best backup
            shutil.copy2(best_backup, current_db)
            print(f"✅ Restored database from: {best_backup}")
            
            # Verify restoration
            conn = sqlite3.connect(current_db)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT COUNT(*) FROM projects 
                WHERE name LIKE '%att%' OR name LIKE '%AT&T%' OR name LIKE '%at&t%'
            """)
            restored_count = cursor.fetchone()[0]
            
            print(f"\n🎉 AT&T PROJECT RECOVERY SUCCESSFUL!")
            print(f"📊 Restored {restored_count} AT&T projects")
            
            # Show restored projects
            cursor.execute("""
                SELECT id, name, created_at FROM projects 
                WHERE name LIKE '%att%' OR name LIKE '%AT&T%' OR name LIKE '%at&t%'
            """)
            restored_projects = cursor.fetchall()
            
            print(f"\n📁 RESTORED AT&T PROJECTS:")
            for project in restored_projects:
                print(f"  - {project[1]} (ID: {project[0]}, created: {project[2]})")
            
            conn.close()
            return True
            
        except Exception as e:
            print(f"❌ Error restoring AT&T project: {e}")
            return False
    else:
        print(f"\n❌ NO AT&T PROJECTS FOUND IN ANY DATABASE!")
        print(f"🚨 Your AT&T project data appears to be permanently lost!")
        return False

if __name__ == "__main__":
    success = emergency_att_recovery()
    
    if success:
        print(f"\n🎉 AT&T PROJECT RECOVERY COMPLETE!")
        print(f"✅ Your AT&T project is restored!")
        print(f"✅ Check the UI - your AT&T project should be there!")
    else:
        print(f"\n💀 AT&T PROJECT RECOVERY FAILED!")
        print(f"🚨 Your AT&T project data is permanently lost!")

