#!/usr/bin/env python3
"""Check if the SYNEREX service is running"""
import requests
import socket
import sys
import os
from urllib.parse import urlparse

EMV_BASE_URL = os.getenv("EMV_BASE_URL")
LOCAL_HOSTNAMES = [h.strip() for h in os.getenv("LOCAL_HOSTNAMES", "").split(",") if h.strip()]
DEFAULT_HOST = LOCAL_HOSTNAMES[0] if LOCAL_HOSTNAMES else ""
parsed_emv_url = urlparse(EMV_BASE_URL) if EMV_BASE_URL else None
EMV_HOST = parsed_emv_url.hostname if parsed_emv_url and parsed_emv_url.hostname else DEFAULT_HOST
EMV_PORT = parsed_emv_url.port if parsed_emv_url and parsed_emv_url.port else 8082

def check_port(port):
    """Check if a port is open"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(2)
        result = sock.connect_ex((EMV_HOST, port))
        sock.close()
        return result == 0
    except:
        return False

def check_health_endpoint():
    """Check the health endpoint"""
    try:
        response = requests.get(f"{EMV_BASE_URL}/api/health", timeout=3)
        return response.status_code == 200, response.text
    except:
        return False, None

print("=" * 60)
print("SYNEREX Service Status Check")
print("=" * 60)
print()

# Check port
port_open = check_port(EMV_PORT)
print(f"Port {EMV_PORT}: {'✅ OPEN' if port_open else '❌ CLOSED'}")

if port_open:
    # Check health endpoint
    healthy, response_text = check_health_endpoint()
    if healthy:
        print(f"Health Endpoint: ✅ RESPONDING")
        print()
        print("=" * 60)
        print("✅ SERVICE IS RUNNING!")
        print("=" * 60)
        print()
        print("You can access:")
        print(f"  - Main App: {EMV_BASE_URL}")
        print(f"  - Admin Panel: {EMV_BASE_URL}/admin")
        print(f"  - Health Check: {EMV_BASE_URL}/api/health")
        sys.exit(0)
    else:
        print(f"Health Endpoint: ⏳ Not responding yet (service may still be starting)")
        print()
        print("The service is starting but not fully ready yet.")
        print("Please wait a few more seconds and try again.")
        sys.exit(1)
else:
    print()
    print("=" * 60)
    print("❌ SERVICE IS NOT RUNNING")
    print("=" * 60)
    print()
    print("The service has not started or failed to start.")
    print("Please check:")
    print("  1. Is there a command window open with the service?")
    print("  2. Are there any error messages?")
    print("  3. Try running: python 8082/main_hardened_ready_fixed.py")
    sys.exit(1)




