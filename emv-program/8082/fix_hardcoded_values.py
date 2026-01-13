#!/usr/bin/env python3
"""
Script to identify and fix all hardcoded values in the HTML report generation.
This script will help restore the system to a working state by removing
hardcoded values that should come from actual data.
"""

import re
import sys

def find_hardcoded_values():
    """Find all hardcoded values in the main application file."""
    
    with open('main_hardened_ready_fixed.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Patterns to find hardcoded values
    patterns = [
        # Financial values
        r'html_content\.replace\([\'"][\$]?[\d,]+\.?\d*[\'"][^)]*\)',
        # Percentage values
        r'html_content\.replace\([\'"][\d,]+\.?\d*%[\'"][^)]*\)',
        # Power values (kW, kVA, kVAR)
        r'html_content\.replace\([\'"][\d,]+\.?\d*\s+(kW|kVA|kVAR)[\'"][^)]*\)',
        # Voltage/Current values
        r'html_content\.replace\([\'"][\d,]+\.?\d*\s+(V|A)[\'"][^)]*\)',
        # Statistical values
        r'html_content\.replace\([\'"][\d,]+\.?\d*\s*±\s*[\d,]+\.?\d*[\'"][^)]*\)',
        # Confidence intervals
        r'html_content\.replace\([\'"][\d,]+\.?\d*\s*\([^)]*CI:[^)]*\)[\'"][^)]*\)',
    ]
    
    hardcoded_values = []
    
    for pattern in patterns:
        matches = re.finditer(pattern, content, re.MULTILINE)
        for match in matches:
            line_num = content[:match.start()].count('\n') + 1
            hardcoded_values.append({
                'line': line_num,
                'match': match.group(),
                'pattern': pattern
            })
    
    return hardcoded_values

def analyze_hardcoded_values():
    """Analyze and categorize hardcoded values."""
    
    hardcoded_values = find_hardcoded_values()
    
    print("=== HARDCODED VALUES ANALYSIS ===")
    print(f"Found {len(hardcoded_values)} hardcoded values that need to be fixed:")
    print()
    
    categories = {
        'Financial': [],
        'Power Quality': [],
        'Statistical': [],
        'Other': []
    }
    
    for item in hardcoded_values:
        match = item['match']
        if any(term in match for term in ['$', 'NPV', 'SIR', 'payback', 'IRR']):
            categories['Financial'].append(item)
        elif any(term in match for term in ['kW', 'kVA', 'kVAR', 'V', 'A', 'PF', 'THD']):
            categories['Power Quality'].append(item)
        elif any(term in match for term in ['CI', '±', 'p_value', 'CV']):
            categories['Statistical'].append(item)
        else:
            categories['Other'].append(item)
    
    for category, items in categories.items():
        if items:
            print(f"\n{category} Values ({len(items)} items):")
            for item in items[:10]:  # Show first 10
                print(f"  Line {item['line']}: {item['match'][:80]}...")
            if len(items) > 10:
                print(f"  ... and {len(items) - 10} more")
    
    return hardcoded_values

def generate_fix_recommendations():
    """Generate recommendations for fixing hardcoded values."""
    
    print("\n=== FIX RECOMMENDATIONS ===")
    print()
    print("1. REMOVE ALL HARDCODED VALUES FROM TEMPLATE")
    print("   - The HTML template should not contain any hardcoded numerical values")
    print("   - All values should come from the actual data passed to the function")
    print()
    print("2. USE PLACEHOLDER VARIABLES")
    print("   - Replace hardcoded values with placeholder variables like {{VALUE_NAME}}")
    print("   - Use consistent naming convention for placeholders")
    print()
    print("3. IMPLEMENT PROPER DATA VALIDATION")
    print("   - Check if data exists before trying to replace values")
    print("   - Provide default values only when data is truly missing")
    print()
    print("4. SIMPLIFY REPLACEMENT LOGIC")
    print("   - Use a single loop to replace all placeholders")
    print("   - Avoid complex conditional logic for each value")
    print()
    print("5. TEST WITH EMPTY DATA")
    print("   - Ensure the system works when no data is provided")
    print("   - Show appropriate messages for missing data")

if __name__ == "__main__":
    print("Analyzing hardcoded values in main_hardened_ready_fixed.py...")
    print()
    
    try:
        hardcoded_values = analyze_hardcoded_values()
        generate_fix_recommendations()
        
        print(f"\n=== SUMMARY ===")
        print(f"Total hardcoded values found: {len(hardcoded_values)}")
        print("These need to be replaced with dynamic data from the actual measurements.")
        
    except Exception as e:
        print(f"Error analyzing file: {e}")
        sys.exit(1)



















