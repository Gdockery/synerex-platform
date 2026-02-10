#!/usr/bin/env python3
"""
Check JavaScript file for balanced brackets, braces, and parentheses
"""
import sys
from pathlib import Path

def check_balance(content):
    """Check for balanced brackets, braces, and parentheses"""
    stack = []
    issues = []
    lines = content.split('\n')
    
    # Track positions
    line_num = 1
    char_pos = 0
    
    in_string = False
    string_char = None
    in_template = False
    template_depth = 0
    
    i = 0
    while i < len(content):
        char = content[i]
        
        # Track string literals
        if char in ('"', "'") and (i == 0 or content[i-1] != '\\'):
            if not in_string:
                in_string = True
                string_char = char
            elif char == string_char:
                in_string = False
                string_char = None
        
        # Track template literals
        if char == '`' and (i == 0 or content[i-1] != '\\'):
            if not in_string:
                in_template = not in_template
                if in_template:
                    template_depth += 1
                else:
                    template_depth -= 1
        
        # Track ${} in template literals
        if in_template and i < len(content) - 1 and content[i:i+2] == '${':
            template_depth += 1
        if in_template and char == '}' and template_depth > 0:
            # Check if this closes a ${}
            j = i - 1
            while j >= 0 and content[j] in ' \t':
                j -= 1
            if j >= 0 and content[j] != '{':  # Not part of ${
                template_depth -= 1
        
        # Only check brackets if not in string (but allow in template literals for ${})
        if not in_string or (in_template and char in '{}'):
            if char in ('(', '[', '{'):
                # Special handling for ${ in template literals
                if char == '{' and in_template and i > 0 and content[i-1] == '$':
                    # This is ${, don't push
                    pass
                else:
                    stack.append((char, line_num, char_pos))
            elif char in (')', ']', '}'):
                # Special handling for } in template literals
                if char == '}' and in_template:
                    # Check if this closes a ${}
                    if stack and stack[-1][0] == '{':
                        # Check if it's part of ${}
                        j = stack[-1][2] - 1
                        if j >= 0 and content[j] == '$':
                            stack.pop()
                            i += 1
                            if i < len(content):
                                if content[i] == '\n':
                                    line_num += 1
                                    char_pos = 0
                                else:
                                    char_pos += 1
                            continue
                
                if not stack:
                    issues.append(f"Line {line_num}, col {char_pos}: Unmatched closing '{char}'")
                else:
                    opening, open_line, open_pos = stack.pop()
                    expected = {'(': ')', '[': ']', '{': '}'}[opening]
                    if char != expected:
                        issues.append(f"Line {line_num}, col {char_pos}: Expected '{expected}' but found '{char}' (opened at line {open_line}, col {open_pos})")
        
        if char == '\n':
            line_num += 1
            char_pos = 0
        else:
            char_pos += 1
        
        i += 1
    
    # Check for unclosed brackets
    for opening, open_line, open_pos in stack:
        issues.append(f"Line {open_line}, col {open_pos}: Unclosed '{opening}'")
    
    return issues

def main():
    js_file = Path(__file__).parent / "static" / "javascript_functions.js"
    
    if not js_file.exists():
        print(f"File not found: {js_file}")
        return 1
    
    with open(js_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    print(f"Checking {js_file}...")
    print(f"File size: {len(content)} characters, {len(content.splitlines())} lines")
    print()
    
    issues = check_balance(content)
    
    if issues:
        print(f"Found {len(issues)} potential issues:")
        for issue in issues[:20]:  # Show first 20
            print(f"  {issue}")
        if len(issues) > 20:
            print(f"  ... and {len(issues) - 20} more")
        return 1
    else:
        print("✓ No bracket/brace/parenthesis balance issues found")
        return 0

if __name__ == '__main__':
    sys.exit(main())
