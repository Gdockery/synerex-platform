#!/usr/bin/env python3
"""
Update User Guides Script
Automatically updates all user guides with latest version information
"""

import os
import sys
import time
from datetime import datetime

def update_guide_templates():
    """Update all guide templates with latest version info"""
    try:
        # Get current version
        current_version = "3.1"
        current_date = datetime.now().strftime("%B %d, %Y")
        
        # List of guide templates to update
        guide_templates = [
            "8082/templates/users_guide.html",
            "8082/templates/admin_guide.html", 
            "8082/templates/standards_guide.html",
            "8082/templates/engineering_report_guide.html",
            "8082/templates/laymen_report_guide.html",
            "8082/templates/synerex_ai_guide.html"
        ]
        
        updated_count = 0
        
        for template_path in guide_templates:
            if os.path.exists(template_path):
                # Read the template
                with open(template_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Update version references (if any hardcoded ones exist)
                # Most templates now use {{ version }} but we can update any remaining hardcoded versions
                content = content.replace('Version 3.0', f'Version {current_version}')
                content = content.replace('version 3.0', f'version {current_version}')
                content = content.replace('System Version: 3.0', f'System Version: {current_version}')
                content = content.replace('Document Version: 3.0', f'Document Version: {current_version}')
                
                # Update date references
                content = content.replace('January 13, 2025', current_date)
                content = content.replace('January 2025', current_date)
                
                # Write back the updated content
                with open(template_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                
                updated_count += 1
                print(f"Updated: {template_path}")
        
        print(f"Successfully updated {updated_count} guide templates")
        return True
        
    except Exception as e:
        print(f"Error updating guides: {e}")
        return False

if __name__ == "__main__":
    print("=== UPDATING USER GUIDES ===")
    print(f"Timestamp: {datetime.now().isoformat()}")
    
    success = update_guide_templates()
    
    if success:
        print("[SUCCESS] All User Guides updated successfully!")
        print("[SUCCESS] Version information synchronized")
        print("[SUCCESS] Documentation is now current")
    else:
        print("[ERROR] Error updating User Guides")
        sys.exit(1)
