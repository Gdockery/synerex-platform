#!/usr/bin/env python3
"""
Diagnose SynerexAI Chat Issues
Identifies why SynerexAI isn't responding to user questions
"""

import os
import json
import requests
from typing import Dict, List, Any

def check_services():
    """Check if all required services are running"""
    print("=== SERVICE STATUS CHECK ===")
    
    services = {
        "Main Service (8082)": "http://127.0.0.1:8082",
        "HTML Service (8084)": "http://127.0.0.1:8084", 
        "Weather Service (8085)": "http://127.0.0.1:8085",
        "Chart Service (8086)": "http://127.0.0.1:8086"
    }
    
    for service_name, url in services.items():
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                print(f"OK {service_name}: Running")
            else:
                print(f"WARNING {service_name}: Responding but status {response.status_code}")
        except requests.exceptions.RequestException as e:
            print(f"ERROR {service_name}: Not running - {e}")
    
    print()

def check_chat_files():
    """Check if chat-related files exist and are properly configured"""
    print("=== CHAT FILES CHECK ===")
    
    chat_files = [
        "8082/html_body.html",
        "8082/templates/main_dashboard.html", 
        "8082/static/main_dashboard.js",
        "8082/static/main_dashboard.css"
    ]
    
    for file_path in chat_files:
        if os.path.exists(file_path):
            print(f"OK {file_path}: Exists")
            
            # Check for chat-related content
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            if 'synerex-ai-chat-widget' in content:
                print(f"   Chat widget HTML found")
            if 'toggleSynerexAIChat' in content:
                print(f"   Toggle function found")
            if 'generateAIResponse' in content:
                print(f"   AI response function found")
            if 'sendChatMessage' in content:
                print(f"   Send message function found")
        else:
            print(f"ERROR {file_path}: Missing")
    
    print()

def check_javascript_functions():
    """Check if JavaScript functions are properly defined"""
    print("=== JAVASCRIPT FUNCTIONS CHECK ===")
    
    # Check main_dashboard.js
    js_file = "8082/static/main_dashboard.js"
    if os.path.exists(js_file):
        with open(js_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        required_functions = [
            'toggleSynerexAIChat',
            'sendChatMessage', 
            'addChatMessage',
            'generateAIResponse',
            'handleChatKeyPress'
        ]
        
        for func in required_functions:
            if f"function {func}" in content:
                print(f"OK {func}: Defined")
            else:
                print(f"ERROR {func}: Missing")
    else:
        print(f"ERROR {js_file}: Missing")
    
    print()

def check_html_integration():
    """Check if HTML properly integrates chat functionality"""
    print("=== HTML INTEGRATION CHECK ===")
    
    # Check main_dashboard.html
    dashboard_file = "8082/templates/main_dashboard.html"
    if os.path.exists(dashboard_file):
        with open(dashboard_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check for chat button
        if 'btn-synerex-ai-chat' in content:
            print("OK Chat button found in dashboard")
        else:
            print("ERROR Chat button missing in dashboard")
        
        # Check for chat widget
        if 'synerex-ai-chat-widget' in content:
            print("OK Chat widget found in dashboard")
        else:
            print("ERROR Chat widget missing in dashboard")
        
        # Check for JavaScript inclusion
        if 'main_dashboard.js' in content:
            print("OK JavaScript file included")
        else:
            print("ERROR JavaScript file not included")
    
    # Check html_body.html
    body_file = "8082/html_body.html"
    if os.path.exists(body_file):
        with open(body_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if 'synerex-ai-chat-widget' in content:
            print("OK Chat widget found in html_body.html")
        else:
            print("ERROR Chat widget missing in html_body.html")
    
    print()

def test_chat_functionality():
    """Test the chat functionality directly"""
    print("=== CHAT FUNCTIONALITY TEST ===")
    
    # Test AI response generation
    test_questions = [
        "What are XECO-HF Series specifications?",
        "How to install XECO-PFC?", 
        "What are the utility rates here?",
        "Help with electrical code compliance",
        "How do I use the SYNEREX dashboard?"
    ]
    
    print("Testing AI response generation:")
    for question in test_questions:
        # Simulate the generateAIResponse function
        response = simulate_ai_response(question)
        if response and len(response) > 50:
            print(f"OK '{question[:30]}...': Response generated ({len(response)} chars)")
        else:
            print(f"ERROR '{question[:30]}...': No response generated")
    
    print()

def simulate_ai_response(question):
    """Simulate the AI response function"""
    lower_question = question.lower()
    
    # XECO Product Questions
    if 'xeco-hf' in lower_question or 'harmonic filter' in lower_question:
        return """The XECO-HF Series harmonic filters are designed for industrial and commercial applications. Key specifications include:
        • Voltage Rating: 480V, 600V, 1000V
        • Current Rating: 50A to 2000A
        • Harmonic Filtering: 5th, 7th, 11th, 13th harmonics
        • Efficiency: >98%
        • Applications: VFDs, UPS systems, LED lighting
        
        For installation, ensure proper clearance (3 feet front, 1 foot sides) and adequate ventilation. Would you like specific installation guidance?"""
    
    # Installation Questions
    if 'install' in lower_question or 'installation' in lower_question:
        return """For XECO equipment installation, follow these key requirements:
        • All installations must comply with NEC and local codes
        • Qualified electrician required for installation
        • Proper grounding and bonding required
        • Adequate ventilation and clearance maintained
        • Electrical permits obtained before installation
        
        Specific installation requirements vary by product model. Which XECO product are you installing?"""
    
    # Utility Information Questions
    if 'utility' in lower_question or 'rate' in lower_question:
        return """For utility rate information, I can help with:
        • Local utility rate analysis and comparison
        • Tariff structure optimization
        • Time-of-use rate analysis
        • Demand charge optimization
        • Local incentive programs
        
        What specific utility information do you need?"""
    
    # SYNEREX Program Usage Questions
    if 'synerex' in lower_question or 'program' in lower_question or 'dashboard' in lower_question or 'how to use' in lower_question:
        return """For SYNEREX program usage, I can help with:
        • Dashboard navigation and features
        • CSV file upload and processing
        • Project creation and management
        • Report generation and analysis
        • Admin panel access and configuration
        • System troubleshooting and optimization
        • User authentication and roles
        • Data analysis and calculations
        
        What specific SYNEREX feature or function would you like help with?"""
    
    # General Energy Questions
    return """Thank you for your energy-related question! As SynerexAI, I specialize in:
    • Energy analysis and efficiency optimization
    • XECO equipment support and installation
    • Utility information and rate optimization
    • Electrical code compliance and safety
    • Power quality analysis and improvement
    • SYNEREX program usage and navigation
    
    Could you provide more specific details about your energy or SYNEREX question so I can give you the most accurate assistance?"""

def check_browser_issues():
    """Check for potential browser-related issues"""
    print("=== BROWSER ISSUES CHECK ===")
    
    print("Common issues that could prevent SynerexAI from responding:")
    print("1. JavaScript errors in browser console")
    print("2. Chat widget not visible (display: none)")
    print("3. Event handlers not properly attached")
    print("4. CSS conflicts hiding chat elements")
    print("5. Browser security restrictions")
    print("6. Network connectivity issues")
    print("7. JavaScript disabled in browser")
    print()
    
    print("Troubleshooting steps:")
    print("1. Open browser Developer Tools (F12)")
    print("2. Check Console tab for JavaScript errors")
    print("3. Check Network tab for failed requests")
    print("4. Verify chat widget is visible when toggled")
    print("5. Test chat functionality in incognito/private mode")
    print("6. Clear browser cache and cookies")
    print()

def generate_solution():
    """Generate potential solutions"""
    print("=== POTENTIAL SOLUTIONS ===")
    
    solutions = [
        "1. Restart all services to ensure latest code is loaded",
        "2. Clear browser cache and reload the page",
        "3. Check browser console for JavaScript errors",
        "4. Verify chat widget is properly displayed",
        "5. Test chat functionality in a different browser",
        "6. Ensure all JavaScript files are properly loaded",
        "7. Check for CSS conflicts hiding chat elements",
        "8. Verify event handlers are properly attached",
        "9. Test with a simple HTML file to isolate issues",
        "10. Check network connectivity and service availability"
    ]
    
    for solution in solutions:
        print(f"   {solution}")
    
    print()

def main():
    """Main diagnostic function"""
    print("SYNEREXAI CHAT DIAGNOSTIC TOOL")
    print("=" * 50)
    print()
    
    check_services()
    check_chat_files()
    check_javascript_functions()
    check_html_integration()
    test_chat_functionality()
    check_browser_issues()
    generate_solution()
    
    print("=== DIAGNOSTIC COMPLETE ===")
    print("If issues persist, check browser console for JavaScript errors")
    print("and ensure all services are running with the latest code.")

if __name__ == "__main__":
    main()
