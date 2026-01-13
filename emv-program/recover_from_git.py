#!/usr/bin/env python3
import subprocess
import os
import sqlite3
from datetime import datetime

def recover_from_git():
    """Recover AT&T project data from Git commits"""
    
    print("🔍 RECOVERING AT&T PROJECT FROM GIT")
    print("=" * 50)
    
    # Check what files were in the most recent commit
    try:
        result = subprocess.run(['git', 'show', 'f0c5d1f', '--name-only'], 
                              capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            files = result.stdout.strip().split('\n')
            print(f"📋 Files in today's commit:")
            for file in files:
                if file.strip():
                    print(f"  - {file}")
            
            # Look for database files
            db_files = [f for f in files if f.endswith('.db')]
            if db_files:
                print(f"\n🎯 Found {len(db_files)} database files in commit:")
                for db_file in db_files:
                    print(f"  - {db_file}")
            else:
                print(f"\n❌ No database files found in today's commit")
        else:
            print(f"❌ Error getting commit files: {result.stderr}")
            
    except Exception as e:
        print(f"❌ Error checking Git: {e}")
    
    # Check if we can restore from a previous commit
    print(f"\n🔍 CHECKING FOR DATABASE FILES IN GIT HISTORY:")
    print("-" * 50)
    
    try:
        # Look for any .db files in the entire repository
        result = subprocess.run(['git', 'ls-files'], capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            all_files = result.stdout.strip().split('\n')
            db_files = [f for f in all_files if f.endswith('.db')]
            
            if db_files:
                print(f"📊 Database files tracked in Git:")
                for db_file in db_files:
                    print(f"  - {db_file}")
                    
                    # Check if this file exists and has content
                    if os.path.exists(db_file):
                        size = os.path.getsize(db_file)
                        print(f"    Size: {size:,} bytes")
                        
                        # Check if it has AT&T data
                        try:
                            conn = sqlite3.connect(db_file)
                            cursor = conn.cursor()
                            
                            # Check for AT&T projects
                            cursor.execute("""
                                SELECT COUNT(*) FROM projects 
                                WHERE name LIKE '%att%' OR name LIKE '%AT&T%'
                            """)
                            att_count = cursor.fetchone()[0]
                            
                            if att_count > 0:
                                print(f"    🎯 Contains {att_count} AT&T projects!")
                                
                                # Get the AT&T projects
                                cursor.execute("""
                                    SELECT id, name, created_at FROM projects 
                                    WHERE name LIKE '%att%' OR name LIKE '%AT&T%'
                                """)
                                att_projects = cursor.fetchall()
                                
                                for project in att_projects:
                                    print(f"      - {project[1]} (ID: {project[0]}, created: {project[2]})")
                            
                            conn.close()
                            
                        except Exception as e:
                            print(f"    ❌ Error checking database: {e}")
                    else:
                        print(f"    ❌ File not found")
            else:
                print(f"❌ No database files tracked in Git")
        else:
            print(f"❌ Error listing Git files: {result.stderr}")
            
    except Exception as e:
        print(f"❌ Error checking Git files: {e}")
    
    # Try to restore from the most recent commit
    print(f"\n🔧 ATTEMPTING TO RESTORE FROM GIT:")
    print("-" * 50)
    
    try:
        # Check out the database files from the most recent commit
        result = subprocess.run(['git', 'checkout', 'f0c5d1f', '--', '8082/results/app.db'], 
                              capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            print(f"✅ Restored 8082/results/app.db from Git")
            
            # Check if it now contains AT&T data
            if os.path.exists('8082/results/app.db'):
                try:
                    conn = sqlite3.connect('8082/results/app.db')
                    cursor = conn.cursor()
                    
                    cursor.execute("""
                        SELECT COUNT(*) FROM projects 
                        WHERE name LIKE '%att%' OR name LIKE '%AT&T%'
                    """)
                    att_count = cursor.fetchone()[0]
                    
                    if att_count > 0:
                        print(f"🎉 SUCCESS! Found {att_count} AT&T projects in restored database!")
                        
                        cursor.execute("""
                            SELECT id, name, created_at FROM projects 
                            WHERE name LIKE '%att%' OR name LIKE '%AT&T%'
                        """)
                        att_projects = cursor.fetchall()
                        
                        for project in att_projects:
                            print(f"  - {project[1]} (ID: {project[0]}, created: {project[2]})")
                    else:
                        print(f"❌ No AT&T projects found in restored database")
                    
                    conn.close()
                    
                except Exception as e:
                    print(f"❌ Error checking restored database: {e}")
        else:
            print(f"❌ Error restoring from Git: {result.stderr}")
            
    except Exception as e:
        print(f"❌ Error restoring from Git: {e}")

if __name__ == "__main__":
    recover_from_git()

