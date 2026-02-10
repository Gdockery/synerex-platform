#!/usr/bin/env python3
"""
Simulate the license admin logout flow.
Run with the stack up on localhost:8080.
  python test_logout_flow.py
"""
import sys
try:
    import requests
except ImportError:
    print("pip install requests")
    sys.exit(1)

base = "http://localhost:8080"

print("1. GET /admin/logout -> expect 302 to /license/admin/logout")
r = requests.get(f"{base}/admin/logout", allow_redirects=False)
print(f"   {r.status_code} -> Location: {r.headers.get('Location', '')}")

print("\n2. GET /license/admin/logout -> expect 302 to login")
r = requests.get(f"{base}/license/admin/logout", allow_redirects=False)
print(f"   {r.status_code} -> Location: {r.headers.get('Location', '')}")

print("\n3. base.html logout form should have target=\"_self\"")
import os
p = os.path.join(os.path.dirname(__file__), "license-service/services/license-service/app/admin/templates/base.html")
try:
    t = open(p).read()
    print("   OK" if 'target="_self"' in t and "logout" in t else "   Check template")
except Exception as e:
    print(f"   Skip: {e}")

print("\n--- Manual test (same-tab logout) ---")
print("1. Restart: docker compose restart proxy license-service")
print("2. Open: " + base + "/license/admin/login")
print("3. Log in, then click Logout. Confirm no new tab opens (form has target=_self).")
