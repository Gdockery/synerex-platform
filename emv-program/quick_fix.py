#!/usr/bin/env python3
import sqlite3
import os

# Quick fix for missing csv_fingerprints table
db_path = '8082/results/app.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Create csv_fingerprints table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS csv_fingerprints (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_name TEXT NOT NULL,
        file_path TEXT,
        content_hash TEXT NOT NULL,
        fingerprint TEXT NOT NULL UNIQUE,
        status TEXT DEFAULT 'created',
        created_at TEXT NOT NULL
    )
    """)
    
    conn.commit()
    conn.close()
    print("Database fixed - csv_fingerprints table created")
else:
    print("Database not found:", db_path)

