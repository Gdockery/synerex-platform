#!/usr/bin/env python3
import sqlite3
import os

def find_att_now():
    backup_file = '8082/results/backups/app_latest.db'
    
    if os.path.exists(backup_file):
        conn = sqlite3.connect(backup_file)
        cursor = conn.cursor()
        
        # Check for AT&T projects
        cursor.execute("SELECT name FROM projects WHERE name LIKE '%att%' OR name LIKE '%AT&T%'")
        results = cursor.fetchall()
        
        print(f"AT&T projects found: {len(results)}")
        for result in results:
            print(f"- {result[0]}")
        
        conn.close()
    else:
        print("Backup file not found")

if __name__ == "__main__":
    find_att_now()

