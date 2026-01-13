#!/usr/bin/env python3
import sqlite3
import os
import glob

def deep_att_search():
    """Deep search for AT&T project data in all possible locations"""
    
    print("🔍 DEEP SEARCH FOR AT&T PROJECT DATA")
    print("=" * 60)
    
    # Find ALL database files in the system
    db_files = []
    for root, dirs, files in os.walk('.'):
        for file in files:
            if file.endswith('.db'):
                db_path = os.path.join(root, file)
                db_files.append(db_path)
    
    print(f"📊 Found {len(db_files)} database files to search:")
    for db_file in db_files:
        print(f"  - {db_file}")
    
    print(f"\n🔍 SEARCHING ALL DATABASES FOR AT&T PROJECTS:")
    print("-" * 60)
    
    att_found = False
    best_db = None
    max_att_count = 0
    
    for db_file in db_files:
        try:
            conn = sqlite3.connect(db_file)
            cursor = conn.cursor()
            
            # Check if projects table exists
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='projects'")
            if not cursor.fetchone():
                conn.close()
                continue
            
            # Search for AT&T projects
            cursor.execute("""
                SELECT COUNT(*) FROM projects 
                WHERE name LIKE '%att%' OR name LIKE '%AT&T%' OR name LIKE '%at&t%'
            """)
            att_count = cursor.fetchone()[0]
            
            if att_count > 0:
                print(f"\n🎯 FOUND {att_count} AT&T PROJECTS IN: {db_file}")
                
                # Get AT&T projects with full details
                cursor.execute("""
                    SELECT id, name, description, created_at, updated_at, data 
                    FROM projects 
                    WHERE name LIKE '%att%' OR name LIKE '%AT&T%' OR name LIKE '%at&t%'
                """)
                att_projects = cursor.fetchall()
                
                for project in att_projects:
                    project_id, name, description, created_at, updated_at, data = project
                    print(f"  🆔 ID: {project_id}")
                    print(f"  📝 Name: {name}")
                    print(f"  📄 Description: {description or 'No description'}")
                    print(f"  📅 Created: {created_at}")
                    print(f"  🔄 Updated: {updated_at}")
                    if data:
                        print(f"  💾 Has data: {len(data)} characters")
                    print()
                
                if att_count > max_att_count:
                    max_att_count = att_count
                    best_db = db_file
                    att_found = True
            else:
                print(f"❌ No AT&T projects in: {db_file}")
            
            conn.close()
            
        except Exception as e:
            print(f"❌ Error checking {db_file}: {e}")
    
    # Also check for AT&T files in the file system
    print(f"\n🔍 CHECKING FILE SYSTEM FOR AT&T FILES:")
    print("-" * 50)
    
    att_files = []
    for root, dirs, files in os.walk('.'):
        for file in files:
            if 'att' in file.lower() or 'at&t' in file.lower():
                att_files.append(os.path.join(root, file))
    
    if att_files:
        print(f"📁 Found {len(att_files)} AT&T files in file system:")
        for file in att_files:
            print(f"  - {file}")
    else:
        print(f"❌ No AT&T files found in file system")
    
    if att_found and best_db:
        print(f"\n🎯 BEST DATABASE FOUND: {best_db}")
        print(f"📊 Contains {max_att_count} AT&T projects")
        print(f"✅ YOUR AT&T PROJECT DATA EXISTS!")
        return best_db
    else:
        print(f"\n❌ NO AT&T PROJECTS FOUND IN ANY DATABASE!")
        print(f"🚨 This is very suspicious - AT&T should be there!")
        return None

if __name__ == "__main__":
    best_db = deep_att_search()
    
    if best_db:
        print(f"\n🎉 AT&T PROJECT DATA FOUND!")
        print(f"📁 Location: {best_db}")
        print(f"✅ We can restore your AT&T project!")
    else:
        print(f"\n💀 AT&T PROJECT DATA NOT FOUND!")
        print(f"🚨 This is very suspicious - something is wrong!")

