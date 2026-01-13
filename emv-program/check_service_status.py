#!/usr/bin/env python3
"""Check if the SYNEREX service is running"""
import requests
import socket
import sys

def check_port(port):
    """Check if a port is open"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(2)
        result = sock.connect_ex(('localhost', port))
        sock.close()
        return result == 0
    except:
        return False

def check_health_endpoint():
    """Check the health endpoint"""
    try:
        response = requests.get('http://localhost:8082/api/health', timeout=3)
        return response.status_code == 200, response.text
    except:
        return False, None

print("=" * 60)
print("SYNEREX Service Status Check")
print("=" * 60)
print()

# Check port
port_open = check_port(8082)
print(f"Port 8082: {'✅ OPEN' if port_open else '❌ CLOSED'}")

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
        print("  - Main App: http://localhost:8082")
        print("  - Admin Panel: http://localhost:8082/admin")
        print("  - Health Check: http://localhost:8082/api/health")
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
    print("  3. Try running: python 8082\\main_hardened_ready_fixed.py")
    sys.exit(1)




