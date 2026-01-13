#!/usr/bin/env python3
import sqlite3
import os

def find_att_data():
    """Find AT&T project data in backup databases"""
    
    print("🔍 SEARCHING FOR AT&T PROJECT DATA")
    print("=" * 50)
    
    # Check backup databases
    backup_files = [
        '8082/results/backups/app_latest.db',
        '8082/results/backups/app_backup_20251005_000718.db',
        '8082/results/backups/app_backup_20250930_095841.db',
        '8082/results/backups/app_backup_20250929_140230.db'
    ]
    
    for backup_file in backup_files:
        if os.path.exists(backup_file):
            print(f"\n📊 Checking: {backup_file}")
            try:
                conn = sqlite3.connect(backup_file)
                cursor = conn.cursor()
                
                # Check for AT&T projects
                cursor.execute("""
                    SELECT COUNT(*) FROM projects 
                    WHERE name LIKE '%att%' OR name LIKE '%AT&T%'
                """)
                att_count = cursor.fetchone()[0]
                
                if att_count > 0:
                    print(f"🎯 FOUND {att_count} AT&T PROJECTS!")
                    
                    # Get AT&T projects
                    cursor.execute("""
                        SELECT id, name, description, created_at, data 
                        FROM projects 
                        WHERE name LIKE '%att%' OR name LIKE '%AT&T%'
                    """)
                    att_projects = cursor.fetchall()
                    
                    for project in att_projects:
                        project_id, name, description, created_at, data = project
                        print(f"  🆔 ID: {project_id}")
                        print(f"  📝 Name: {name}")
                        print(f"  📄 Description: {description}")
                        print(f"  📅 Created: {created_at}")
                        if data:
                            print(f"  💾 Has data: {len(data)} characters")
                        print()
                    
                    conn.close()
                    return backup_file, att_projects
                else:
                    print(f"❌ No AT&T projects found")
                
                conn.close()
                
            except Exception as e:
                print(f"❌ Error: {e}")
        else:
            print(f"❌ Not found: {backup_file}")
    
    return None, None

if __name__ == "__main__":
    backup_file, att_projects = find_att_data()
    
    if backup_file and att_projects:
        print(f"\n🎉 AT&T PROJECT DATA FOUND!")
        print(f"📁 Location: {backup_file}")
        print(f"📊 Projects: {len(att_projects)}")
        print(f"✅ We can restore your AT&T project!")
    else:
        print(f"\n❌ AT&T PROJECT DATA NOT FOUND!")
        print(f"🚨 Your AT&T project may be permanently lost!")

