#!/usr/bin/env python3
"""
Simple script to query the SYNEREX database
"""
import sqlite3
import sys
import os

# Database path
db_path = os.path.join("8082", "results", "app.db")

if not os.path.exists(db_path):
    print(f"❌ Database not found at: {db_path}")
    print("The database will be created when the service first uses it.")
    sys.exit(1)

print(f"✅ Database found at: {db_path}")
print("=" * 60)

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row  # Enable dict-like access
    cursor = conn.cursor()
    
    # Check if verification codes exist
    print("\n1. Checking for verification codes in analysis_sessions:")
    print("-" * 60)
    cursor.execute("""
        SELECT id, project_name, verification_code, created_at 
        FROM analysis_sessions 
        WHERE verification_code IS NOT NULL 
        ORDER BY created_at DESC 
        LIMIT 10
    """)
    
    rows = cursor.fetchall()
    if rows:
        print(f"Found {len(rows)} sessions with verification codes:\n")
        for row in rows:
            print(f"  Session ID: {row['id']}")
            print(f"  Project: {row['project_name'] or 'N/A'}")
            print(f"  Verification Code: {row['verification_code']}")
            print(f"  Created: {row['created_at']}")
            print()
    else:
        print("  No verification codes found in the database.")
    
    # Check total sessions
    print("\n2. Total analysis sessions:")
    print("-" * 60)
    cursor.execute("SELECT COUNT(*) as count FROM analysis_sessions")
    total = cursor.fetchone()['count']
    print(f"  Total sessions: {total}")
    
    # Check if verification_code column exists
    print("\n3. Database schema check:")
    print("-" * 60)
    cursor.execute("PRAGMA table_info(analysis_sessions)")
    columns = cursor.fetchall()
    has_verification_code = any(col[1] == 'verification_code' for col in columns)
    if has_verification_code:
        print("  ✅ verification_code column exists")
    else:
        print("  ❌ verification_code column does NOT exist")
        print("  The database may need to be migrated.")
    
    # List all tables
    print("\n4. Available tables:")
    print("-" * 60)
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    for table in tables:
        print(f"  - {table[0]}")
    
    # Interactive query option
    if len(sys.argv) > 1:
        query = " ".join(sys.argv[1:])
        print(f"\n5. Executing custom query:")
        print("-" * 60)
        print(f"  Query: {query}")
        try:
            cursor.execute(query)
            rows = cursor.fetchall()
            if rows:
                # Get column names
                columns = [description[0] for description in cursor.description]
                print(f"\n  Results ({len(rows)} rows):")
                print("  " + " | ".join(columns))
                print("  " + "-" * (len(" | ".join(columns))))
                for row in rows:
                    print("  " + " | ".join(str(val) if val is not None else "NULL" for val in row))
            else:
                print("  No results.")
        except Exception as e:
            print(f"  ❌ Error: {e}")
    else:
        print("\n5. To run a custom query, use:")
        print("   python query_database.py \"SELECT * FROM analysis_sessions LIMIT 5\"")
    
    conn.close()
    
except sqlite3.Error as e:
    print(f"❌ Database error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)




