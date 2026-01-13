#!/usr/bin/env python3
import sqlite3
import os

def find_lineage_winsor():
    db_path = '../results/app.db'
    
    if not os.path.exists(db_path):
        print(f"Database file {db_path} does not exist!")
        return
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Search for projects with "Lineage" or "Winsor" in the name
        cursor.execute("SELECT name, created_at, updated_at FROM projects WHERE name LIKE '%Lineage%' OR name LIKE '%Winsor%' OR name LIKE '%lineage%' OR name LIKE '%winsor%'")
        projects = cursor.fetchall()
        
        if projects:
            print("Found matching projects:")
            for row in projects:
                print(f"  {row[0]} - Created: {row[1]}, Updated: {row[2]}")
        else:
            print("No projects found with 'Lineage' or 'Winsor' in the name")
            
        # Also show all projects to see what's there
        cursor.execute("SELECT name, created_at, updated_at FROM projects ORDER BY updated_at DESC")
        all_projects = cursor.fetchall()
        
        if all_projects:
            print(f"\nAll projects in database ({len(all_projects)} total):")
            for row in all_projects:
                print(f"  {row[0]} - Created: {row[1]}, Updated: {row[2]}")
        else:
            print("No projects found in database")
            
        conn.close()
        
    except Exception as e:
        print(f"Error searching database: {e}")

if __name__ == "__main__":
    find_lineage_winsor()

























