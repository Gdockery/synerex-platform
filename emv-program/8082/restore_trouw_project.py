#!/usr/bin/env python3
"""
Restore Trouw-Lethbridge project from HTML report
"""
import sqlite3
import pymysql
from urllib.parse import urlparse
import json
import os
import re
import os
from pathlib import Path
from datetime import datetime

# Paths
results_dir = Path(__file__).parent / "results"
report_path = Path(__file__).parent / "reports" / "Trouw-Lethbridge" / "Trouw-Lethbridge_Client_HTML_Report_20260121_172136.html"

def extract_project_data_from_report():
    """Extract project data from HTML report"""
    if not report_path.exists():
        print(f"Report not found: {report_path}")
        return None
    
    with open(report_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract data using regex
    data = {}
    
    # Company
    company_match = re.search(r'<div><strong>Company:</strong>\s*([^<]+)</div>', content)
    if company_match:
        data['company'] = company_match.group(1).strip()
    
    # Facility
    facility_match = re.search(r'<div><strong>Facility:</strong>\s*([^<]+)</div>', content)
    if facility_match:
        data['facility_address'] = facility_match.group(1).strip()
        data['location'] = facility_match.group(1).strip()
    
    # Contact
    contact_match = re.search(r'<div><strong>Contact:</strong>\s*([^<]+)</div>', content)
    if contact_match:
        data['contact'] = contact_match.group(1).strip()
    
    # Email
    email_match = re.search(r'<div><strong>Email:</strong>\s*([^<]+)</div>', content)
    if email_match:
        data['email'] = email_match.group(1).strip()
    
    # Phone
    phone_match = re.search(r'<div><strong>Phone:</strong>\s*([^<]+)</div>', content)
    if phone_match:
        data['phone'] = phone_match.group(1).strip()
    
    # Project name
    data['project_name'] = 'Trouw-Lethbridge'
    
    # Set defaults for required fields
    data.setdefault('facility_state', '')
    data.setdefault('facility_zip', '')
    data.setdefault('facility_city', '')
    
    return data

def _resolve_emv_db_url(url):
    """Apply EMV_DB_HOST/EMV_DB_PORT override for Docker (mysql-emv:3306)."""
    if not url:
        return url
    host = os.getenv("EMV_DB_HOST")
    port = os.getenv("EMV_DB_PORT")
    if host:
        url = re.sub(r"@[^:/]+", "@" + host, url, count=1)
    if port:
        url = re.sub(r":\d+(?=/)", ":" + str(port), url, count=1)
    return url


def restore_project_to_database(project_data, org_id=None):
    """Restore project to database"""
    mysql_url = os.getenv("EMV_DB_URL")
    if mysql_url:
        mysql_url = _resolve_emv_db_url(mysql_url)

    # Determine database path
    if mysql_url:
        parsed = urlparse(mysql_url)
        conn = pymysql.connect(
            host=parsed.hostname or "localhost",
            port=parsed.port or 3306,
            user=parsed.username or "",
            password=parsed.password or "",
            database=(parsed.path or "").lstrip("/"),
            cursorclass=pymysql.cursors.DictCursor,
        )
        cursor = conn.cursor()
        org_value = org_id or "default"
    else:
        if org_id:
            org_dir = results_dir / f"org_{org_id}"
            org_dir.mkdir(parents=True, exist_ok=True)
            db_path = org_dir / "app.db"
        else:
            # Use default database
            results_dir.mkdir(parents=True, exist_ok=True)
            db_path = results_dir / "app.db"

        print(f"Using database: {db_path}")

        conn = sqlite3.connect(str(db_path))
        cursor = conn.cursor()
        org_value = None
    
    # Ensure projects table exists
    if mysql_url:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS projects (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                data TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                archived INTEGER DEFAULT 0,
                org_id VARCHAR(255) NOT NULL
            )
        """)
    else:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                data TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                archived INTEGER DEFAULT 0
            )
        """)
    conn.commit()
    
    # Check if project already exists
    project_name = project_data.get('project_name', 'Trouw-Lethbridge')
    if mysql_url:
        cursor.execute("SELECT id, name FROM projects WHERE name = %s AND org_id = %s", (project_name, org_value))
    else:
        cursor.execute("SELECT id, name FROM projects WHERE name = ?", (project_name,))
    existing = cursor.fetchone()
    
    if existing:
        print(f"Project '{project_name}' already exists (ID: {existing[0]})")
        print("Updating existing project...")
        project_id = existing[0]
        
        # Update project data
        payload_str = json.dumps(project_data)
        data_to_save = json.dumps({"payload": payload_str})
        
        if mysql_url:
            cursor.execute("""
                UPDATE projects 
                SET data = %s, updated_at = NOW()
                WHERE id = %s AND org_id = %s
            """, (data_to_save, project_id, org_value))
        else:
            cursor.execute("""
                UPDATE projects 
                SET data = ?, updated_at = datetime('now')
                WHERE id = ?
            """, (data_to_save, project_id))
        conn.commit()
        print(f"Updated project ID {project_id}")
    else:
        print(f"Creating new project '{project_name}'...")
        
        # Create project with data
        payload_str = json.dumps(project_data)
        data_to_save = json.dumps({"payload": payload_str})
        
        if mysql_url:
            cursor.execute("""
                INSERT INTO projects (name, description, data, created_at, updated_at, org_id)
                VALUES (%s, %s, %s, NOW(), NOW(), %s)
            """, (project_name, "", data_to_save, org_value))
        else:
            cursor.execute("""
                INSERT INTO projects (name, description, data, created_at, updated_at)
                VALUES (?, ?, ?, datetime('now'), datetime('now'))
            """, (project_name, "", data_to_save))
        project_id = cursor.lastrowid
        conn.commit()
        print(f"Created project ID {project_id}")
    
    conn.close()
    return project_id

if __name__ == '__main__':
    print("=" * 60)
    print("Restoring Trouw-Lethbridge Project")
    print("=" * 60)
    
    # Extract data from report
    print("\n1. Extracting data from HTML report...")
    project_data = extract_project_data_from_report()
    
    if not project_data:
        print("ERROR: Could not extract project data from report")
        exit(1)
    
    print(f"Extracted project data:")
    for key, value in project_data.items():
        print(f"  {key}: {value}")
    
    # Restore to database
    print("\n2. Restoring to database...")
    # Try default database first (no org_id)
    project_id = restore_project_to_database(project_data, org_id=None)
    
    print(f"\n[OK] Project restored successfully!")
    print(f"  Project ID: {project_id}")
    print(f"  Project Name: {project_data.get('project_name')}")
    print(f"\nYou can now access this project in the dashboard at:")
    print(f"  {os.getenv('EMV_BASE_URL')}/main-dashboard")
