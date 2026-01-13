#!/usr/bin/env python3
import sqlite3
import os

# Database path
db_path = '8082/results/app.db'

# Create csv_fingerprints table if it doesn't exist
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Create the csv_fingerprints table
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

# Check if table was created
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='csv_fingerprints'")
table_exists = cursor.fetchone()
print(f"csv_fingerprints table created: {table_exists is not None}")

conn.commit()
conn.close()

print("Database fixed - csv_fingerprints table created")