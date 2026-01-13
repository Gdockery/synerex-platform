#!/usr/bin/env python3
"""
Sync UI files from remote server to localhost while preserving local projects
"""

import os
import shutil
import subprocess
import sys
from datetime import datetime

# Configuration
REMOTE_SERVER = "134.209.14.71"
REMOTE_USER = "root"
SSH_KEY = "~/.ssh/calc_rsa"
REMOTE_PATH = "/root/"
LOCAL_PATH = "."

# Files to sync from remote (UI-related files)
UI_FILES = [
    "8082/html_head.html",
    "8082/html_body.html", 
    "8082/css_styles.css",
    "8082/javascript_functions.js",
    "8082/main_hardened_ready_fixed.py"
]

# Files to preserve locally (project data)
PRESERVE_FILES = [
    "results/app.db",
    "8082/results/app.db",
    "8082/uploads/",
    "8082/data/",
    "8084/generated_reports/",
    "8084/generated_pdfs_8084/"
]

def run_command(cmd, description):
    """Run a command and handle errors"""
    print(f"🔄 {description}...")
    try:
        result = subprocess.run(cmd, shell=True, check=True, capture_output=True, text=True)
        print(f"✅ {description} completed successfully")
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed: {e.stderr}")
        return None

def backup_local_files():
    """Create backup of local files before syncing"""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_dir = f"backup_before_sync_{timestamp}"
    
    print(f"📦 Creating backup in {backup_dir}/")
    os.makedirs(backup_dir, exist_ok=True)
    
    for file_path in UI_FILES:
        if os.path.exists(file_path):
            # Create directory structure in backup
            backup_file_path = os.path.join(backup_dir, file_path)
            os.makedirs(os.path.dirname(backup_file_path), exist_ok=True)
            shutil.copy2(file_path, backup_file_path)
            print(f"  📄 Backed up {file_path}")
    
    return backup_dir

def sync_file_from_server(remote_file, local_file):
    """Sync a single file from server to local"""
    remote_full_path = f"{REMOTE_USER}@{REMOTE_SERVER}:{REMOTE_PATH}{remote_file}"
    local_dir = os.path.dirname(local_file)
    
    # Create local directory if it doesn't exist
    if local_dir and not os.path.exists(local_dir):
        os.makedirs(local_dir, exist_ok=True)
    
    # Use scp to copy file
    cmd = f"scp -i {SSH_KEY} {remote_full_path} {local_file}"
    return run_command(cmd, f"Syncing {remote_file}")

def preserve_local_projects():
    """Ensure local project files are preserved"""
    print("🔒 Preserving local project files...")
    
    for preserve_path in PRESERVE_FILES:
        if os.path.exists(preserve_path):
            print(f"  📁 Preserving {preserve_path}")
        else:
            print(f"  ⚠️  {preserve_path} not found (will be created if needed)")

def main():
    """Main sync process"""
    print("🚀 Starting UI sync from remote server to localhost")
    print(f"📡 Remote server: {REMOTE_SERVER}")
    print(f"💻 Local path: {LOCAL_PATH}")
    print()
    
    # Step 1: Backup local files
    backup_dir = backup_local_files()
    print()
    
    # Step 2: Preserve local projects
    preserve_local_projects()
    print()
    
    # Step 3: Sync UI files from server
    print("📥 Syncing UI files from remote server...")
    success_count = 0
    total_files = len(UI_FILES)
    
    for file_path in UI_FILES:
        if sync_file_from_server(file_path, file_path):
            success_count += 1
        print()
    
    # Step 4: Summary
    print("=" * 60)
    print("📊 SYNC SUMMARY")
    print("=" * 60)
    print(f"✅ Successfully synced: {success_count}/{total_files} files")
    print(f"📦 Local backup created: {backup_dir}/")
    print(f"🔒 Local projects preserved")
    print()
    
    if success_count == total_files:
        print("🎉 All files synced successfully!")
        print("💡 You can now test the UI locally with the latest server version")
    else:
        print("⚠️  Some files failed to sync. Check the errors above.")
        print("💡 You can restore from backup if needed:")
        print(f"   cp -r {backup_dir}/* .")
    
    print()
    print("🔄 Next steps:")
    print("1. Start your local Flask application")
    print("2. Test the UI functionality")
    print("3. Your local projects and data are preserved")

if __name__ == "__main__":
    main()


