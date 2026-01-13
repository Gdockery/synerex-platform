#!/usr/bin/env python3
"""
Verify ESG route is in the code and can be registered
"""

import sys
from pathlib import Path

# Add 8082 to path
sys.path.insert(0, str(Path(__file__).parent / "8082"))

print("="*80)
print("VERIFYING ESG ROUTE IN CODE")
print("="*80)

# Check if route exists in file
with open("8082/main_hardened_ready_fixed.py", "r", encoding="utf-8") as f:
    content = f.read()
    if "/api/generate-esg-case-study-report" in content:
        print("✅ Route path found in file")
        # Find line number
        lines = content.split("\n")
        for i, line in enumerate(lines, 1):
            if "/api/generate-esg-case-study-report" in line and "@app.route" in line:
                print(f"✅ Route definition found at line {i}")
                print(f"   Line content: {line.strip()}")
                break
    else:
        print("❌ Route path NOT found in file!")
        sys.exit(1)

# Try to import and check route registration
print("\n" + "="*80)
print("TESTING ROUTE REGISTRATION")
print("="*80)

try:
    # Import the module
    import main_hardened_ready_fixed
    
    # Get all routes
    routes = [r.rule for r in main_hardened_ready_fixed.app.url_map.iter_rules()]
    esg_routes = [r for r in routes if "esg" in r.lower() or "generate-esg" in r.lower()]
    
    print(f"Total routes registered: {len(routes)}")
    print(f"ESG-related routes: {esg_routes}")
    
    if "/api/generate-esg-case-study-report" in routes:
        print("✅ Route IS registered when module is imported!")
        print("   This means the code is correct.")
        print("\n⚠️  If the running server still returns 404:")
        print("   1. The server is running old code")
        print("   2. You need to HARD RESTART the server:")
        print("      - Stop the server (Ctrl+C)")
        print("      - Wait 5 seconds")
        print("      - Start it again")
        print("   3. Clear browser cache (Ctrl+F5)")
    else:
        print("❌ Route is NOT registered even when module is imported!")
        print("   This means there's a code issue.")
        
except Exception as e:
    print(f"❌ Error importing module: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

