#!/usr/bin/env python3
"""
Simple Template Processor - No Flask, Direct HTML Processing
This processes the template variables directly without Flask complications
"""

import json
import re
from datetime import datetime

def process_template_variables(html_content, data):
    """Process template variables in HTML content - Simple approach like this morning"""
    
    print("=" * 80)
    print("DEBUG: Simple Template Processor - Processing Data")
    print("=" * 80)
    print(f"Data type: {type(data)}")
    print(f"Data keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
    
    # Handle wrapped data format
    if isinstance(data, dict) and 'results' in data:
        print("Data wrapped in 'results' key, extracting...")
        data = data['results']
        print(f"Extracted data keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
    
    # Simple approach: convert uppercase template variables to lowercase and use data directly
    def replace_placeholder(match):
        key = match.group(1).strip()
        # Convert uppercase template key to lowercase for data lookup
        lowercase_key = key.lower()
        
        # Try to get value from data
        value = data.get(lowercase_key, f"{{{{{key}}}}}")
        
        print(f"Template: {{{{key}}}} -> Data key: {lowercase_key} -> Value: {value}")
        return str(value)
    
    # Replace all {{VARIABLE}} with actual values
    processed_html = re.sub(r'\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}', replace_placeholder, html_content)
    
    print("=" * 80)
    print("DEBUG: Template processing complete")
    print("=" * 80)
    
    return processed_html

def process_template(template_path, data):
    """Process template file with data"""
    try:
        with open(template_path, 'r', encoding='utf-8') as f:
            template_content = f.read()
    except FileNotFoundError:
        return f"Error: Template file not found at {template_path}"
    except Exception as e:
        return f"Error reading template file: {e}"
    
    return process_template_variables(template_content, data)

if __name__ == '__main__':
    # Example usage for testing
    test_data = {
        "test_name": "Example Test",
        "circuit_name": "Main Circuit",
        "test_period": "Jan-Dec 2024",
        "test_duration": "365 Days",
        "company": "Synerex Corp",
        "facility": "Headquarters",
        "location": "Boulder, CO",
        "p_value": 0.0001,
        "sample_size_before": 700,
        "sample_size_after": 702,
        "statistically_significant": "YES",
        "cohens_d": -1.553,
        "t_statistic": -29.08,
        "relative_precision": "-6.75%",
        "meets_ashrae_precision": "YES"
    }
    
    # Test with a simple template
    test_template = """
    Test: {{TEST_NAME}}
    Circuit: {{CIRCUIT_NAME}}
    Period: {{TEST_PERIOD}}
    Duration: {{TEST_DURATION}}
    Company: {{company}}
    Facility: {{facility}}
    Location: {{location}}
    p-value: {{P_VALUE}}
    Sample Size (Before): {{SAMPLE_SIZE_BEFORE}}
    Sample Size (After): {{SAMPLE_SIZE_AFTER}}
    Statistically Significant: {{STATISTICALLY_SIGNIFICANT}}
    Cohen's d: {{COHENS_D}}
    T-Statistic: {{T_STATISTIC}}
    Relative Precision: {{RELATIVE_PRECISION}}
    Meets ASHRAE Precision: {{MEETS_ASHRAE_PRECISION}}
    """
    
    print("Testing template processor...")
    result = process_template_variables(test_template, test_data)
    print("Result:")
    print(result)