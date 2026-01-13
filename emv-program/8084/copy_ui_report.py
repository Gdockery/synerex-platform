#!/usr/bin/env python3
"""
Copy UI's generated HTML report and add missing sections
"""

import requests
from pathlib import Path

def copy_ui_report():
    """Copy the UI's generated HTML report and add missing sections"""
    
    # Get the UI's generated HTML report
    try:
        response = requests.get('http://localhost:8082/legacy', timeout=10)
        if response.status_code == 200:
            ui_html = response.text
            
            # Add Test Parameters and Client Information sections at the top
            test_params_section = """
            <div class="content">
                <h2>Test Parameters</h2>
                <div class="card">
                    <div><strong>Test:</strong> Main Circuit</div>
                    <div><strong>Period:</strong> Before Period | After Period</div>
                    <div><strong>Duration:</strong> 30 Days</div>
                    <div><strong>Meter Spec:</strong> Main Switchgear</div>
                    <div><strong>Int. Data:</strong> I-Minute Interval Data</div>
                    <div><strong>% of Total PK Load:</strong> 100%</div>
                </div>
                
                <h2>Client Information</h2>
                <div class="card">
                    <div><strong>Company:</strong> Synerex Power Analysis</div>
                    <div><strong>Facility:</strong> Industrial Facility</div>
                    <div><strong>Location:</strong> Denver, CO</div>
                    <div><strong>Contact:</strong> Engineering Team</div>
                    <div><strong>Email:</strong> info@synerex.com</div>
                    <div><strong>Phone:</strong> (555) 123-4567</div>
                    <div><strong>Equipment:</strong> Main Switchgear 4</div>
                    <div><strong>Meter Name:</strong> PQM</div>
                    <div><strong>Utility:</strong> Poudre Valley</div>
                    <div><strong>Account:</strong> 81681001</div>
                </div>
            </div>
            """
            
            # Find the main content area and insert the sections
            if '<div class="content">' in ui_html:
                # Insert after the first content div
                ui_html = ui_html.replace('<div class="content">', test_params_section + '<div class="content">', 1)
            else:
                # If no content div found, insert after the header
                ui_html = ui_html.replace('</head>', '</head>' + test_params_section)
            
            # Save the complete report
            output_file = Path(__file__).parent / ".." / "8082" / "report_template.html"
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(ui_html)
            
            print(f"Successfully copied UI report and added missing sections to {output_file}")
            return True
            
        else:
            print(f"Failed to get UI report: HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print(f"Error copying UI report: {e}")
        return False

if __name__ == "__main__":
    copy_ui_report()
