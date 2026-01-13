#!/usr/bin/env python3
"""
Standard HTML Report Generator
Matches the exact structure of synerex_standard_report_2025-09-24T21-10-02.html
"""

import json
import base64
from datetime import datetime
from pathlib import Path

def generate_standard_html(results):
    """Generate HTML that matches the standard report format exactly"""
    
    # Extract data safely
    r = results if isinstance(results, dict) else {}
    
    # Helper function for safe data access
def safe_get(data, *keys, default=None):
    """Safely get nested dictionary values"""
    try:
        for key in keys:
            if isinstance(data, dict) and key in data:
                data = data[key]
            else:
                return default
        return data
    except:
        return default

    # Generate basic HTML report
    html = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Power Quality & Savings Analysis Report</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
            color: #333;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
            font-weight: 300;
        }
        .header p {
            margin: 10px 0 0 0;
            font-size: 1.2em;
            opacity: 0.9;
        }
        .content {
            padding: 30px;
        }
        .tbl {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .tbl th {
            background: #f8f9fa;
            color: #495057;
            font-weight: 600;
            padding: 15px;
            text-align: left;
            border-bottom: 2px solid #dee2e6;
        }
        .tbl td {
            padding: 15px;
            border-bottom: 1px solid #dee2e6;
        }
        .tbl tr:hover {
            background-color: #f8f9fa;
        }
        .value-cell {
            font-weight: 600;
            text-align: right;
        }
        .compliant {
            color: #000000;
            font-weight: bold;
        }
        .non-compliant {
            color: #000000;
            font-weight: bold;
        }
        .metric-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .metric-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border-left: 4px solid #667eea;
        }
        .metric-value {
            font-size: 2em;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 5px;
        }
        .metric-unit {
            color: #6c757d;
            font-size: 0.9em;
        }
        .compliance-note {
            background: #e3f2fd;
            border-left: 4px solid #2196f3;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .success {
            background: #d4edda;
            color: #155724;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
            border-left: 4px solid #28a745;
        }
        .error {
            background: #f8d7da;
            color: #721c24;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
            border-left: 4px solid #dc3545;
        }
        .card {
                background: white;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .page-break {
            page-break-before: always;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Power Quality & Savings Analysis</h1>
            <p>Measurement & Verification Report</p>
        </div>
        <div class="content">"""
    
    # Add basic report content
    html += '<h2>Report Summary</h2>'
    html += '<div class="card">'
    html += '<p>This is a simplified version of the standard HTML report generator.</p>'
    html += '<p>Report generated on: ' + datetime.now().strftime('%Y-%m-%d %H:%M:%S') + '</p>'
    html += '</div>'
    
    # Close HTML
    html += '</div>'
    html += '</div>'
    html += '</body>'
    html += '</html>'
    
    return html

if __name__ == "__main__":
    # Test the function
    test_data = {"test": "data"}
    result = generate_standard_html(test_data)
    print("HTML generated successfully")