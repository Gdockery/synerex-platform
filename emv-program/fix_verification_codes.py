#!/usr/bin/env python3
"""
Utility to check and fix verification codes in the database
"""
import sqlite3
import sys
import os
from datetime import datetime

# Database path
db_path = os.path.join("8082", "results", "app.db")

if not os.path.exists(db_path):
    print(f"❌ Database not found at: {db_path}")
    sys.exit(1)

print(f"✅ Database found at: {db_path}")
print("=" * 60)

try:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Check recent sessions without verification codes
    print("\n1. Recent sessions WITHOUT verification codes:")
    print("-" * 60)
    cursor.execute("""
        SELECT id, project_name, before_file_id, after_file_id, created_at 
        FROM analysis_sessions 
        WHERE verification_code IS NULL 
        ORDER BY created_at DESC 
        LIMIT 10
    """)
    
    rows = cursor.fetchall()
    if rows:
        print(f"Found {len(rows)} recent sessions without verification codes:\n")
        for i, row in enumerate(rows, 1):
            print(f"  {i}. Session: {row['id']}")
            print(f"     Project: {row['project_name'] or 'N/A'}")
            print(f"     Created: {row['created_at']}")
            print()
    else:
        print("  All sessions have verification codes (or no sessions found).")
    
    # Check if we should add verification codes
    if len(sys.argv) > 1 and sys.argv[1] == "--add-codes":
        print("\n2. Adding verification codes to sessions without them...")
        print("-" * 60)
        
        import secrets
        import string
        
        cursor.execute("""
            SELECT id, project_name 
            FROM analysis_sessions 
            WHERE verification_code IS NULL 
            ORDER BY created_at DESC
        """)
        
        sessions = cursor.fetchall()
        added = 0
        
        for session in sessions:
            # Generate unique verification code
            verification_code = ''.join(secrets.choice(string.ascii_uppercase) for _ in range(3)) + \
                               ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(9))
            
            # Check if code already exists (very unlikely, but check anyway)
            cursor.execute("SELECT COUNT(*) FROM analysis_sessions WHERE verification_code = ?", (verification_code,))
            if cursor.fetchone()[0] > 0:
                continue  # Skip if code exists
            
            # Update session with verification code
            try:
                cursor.execute("""
                    UPDATE analysis_sessions 
                    SET verification_code = ? 
                    WHERE id = ?
                """, (verification_code, session['id']))
                if cursor.rowcount > 0:
                    print(f"  ✅ Added code {verification_code} to session {session['id']} ({session['project_name'] or 'N/A'})")
                    added += 1
            except Exception as e:
                print(f"  ❌ Failed to add code to session {session['id']}: {e}")
        
        if added > 0:
            conn.commit()
            print(f"\n✅ Successfully added {added} verification codes!")
        else:
            print("\n⚠️ No codes were added (may already exist or error occurred)")
    else:
        print("\n2. To add verification codes to sessions without them, run:")
        print("   python fix_verification_codes.py --add-codes")
    
    # Show statistics
    print("\n3. Statistics:")
    print("-" * 60)
    cursor.execute("SELECT COUNT(*) FROM analysis_sessions WHERE verification_code IS NOT NULL")
    with_codes = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM analysis_sessions WHERE verification_code IS NULL")
    without_codes = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM analysis_sessions")
    total = cursor.fetchone()[0]
    
    print(f"  Total sessions: {total}")
    print(f"  With verification codes: {with_codes}")
    print(f"  Without verification codes: {without_codes}")
    
    conn.close()
    
except sqlite3.Error as e:
    print(f"❌ Database error: {e}")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)




