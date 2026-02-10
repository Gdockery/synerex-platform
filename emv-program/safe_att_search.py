#!/usr/bin/env python3
import sqlite3
import os

def safe_att_search():
    """SAFE READ-ONLY search for AT&T project data - NO CHANGES MADE"""
    
    print("🔍 SAFE READ-ONLY SEARCH FOR AT&T PROJECT")
    print("=" * 60)
    print("⚠️  NO CHANGES WILL BE MADE - READ-ONLY ONLY")
    print("=" * 60)
    
    # Check all possible database locations - READ ONLY
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
    best_location = None
    max_att_projects = 0
    
    print("🔍 SEARCHING ALL DATABASE LOCATIONS (READ-ONLY):")
    print("-" * 50)
    
    for db_path in db_locations:
        if os.path.exists(db_path):
            try:
                conn = sqlite3.connect(db_path)
                cursor = conn.cursor()
                
                # Check for AT&T projects - READ ONLY
                cursor.execute("""
                    SELECT COUNT(*) FROM projects 
                    WHERE name LIKE '%att%' OR name LIKE '%AT&T%' OR name LIKE '%at&t%'
                """)
                att_count = cursor.fetchone()[0]
                
                if att_count > 0:
                    print(f"🎯 FOUND {att_count} AT&T PROJECTS IN: {db_path}")
                    
                    # Get details - READ ONLY
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
                        best_location = db_path
                        att_found = True
                else:
                    print(f"❌ No AT&T projects in: {db_path}")
                
                conn.close()
                
            except Exception as e:
                print(f"❌ Error checking {db_path}: {e}")
        else:
            print(f"❌ Not found: {db_path}")
    
    if att_found and best_location:
        print(f"\n🎯 BEST LOCATION FOUND: {best_location}")
        print(f"📊 Contains {max_att_projects} AT&T projects")
        print(f"\n✅ YOUR AT&T PROJECT DATA EXISTS!")
        print(f"📁 Location: {best_location}")
        print(f"🔧 We can restore it safely without losing your fixes")
        return True
    else:
        print(f"\n❌ NO AT&T PROJECTS FOUND IN ANY DATABASE!")
        print(f"🚨 Your AT&T project data may be permanently lost!")
        return False

if __name__ == "__main__":
    success = safe_att_search()
    
    if success:
        print(f"\n🎉 AT&T PROJECT DATA FOUND!")
        print(f"✅ We can recover it safely!")
        print(f"✅ Your fixes will be preserved!")
    else:
        print(f"\n💀 AT&T PROJECT DATA NOT FOUND!")
        print(f"🚨 Your AT&T project may be permanently lost!")

