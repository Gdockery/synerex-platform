#!/usr/bin/env python3
"""
Test script to simulate and verify the ESG Case Study Report endpoint
"""

import requests
import sys

BASE_URL = "http://127.0.0.1:8082"
ESG_ENDPOINT = "/api/generate-esg-case-study-report"

def print_section(title):
    print("\n" + "="*80)
    print(f"  {title}")
    print("="*80)

def test_esg_route():
    """Test the ESG Case Study Report endpoint"""
    
    print_section("TEST 1: Check if route exists (GET request)")
    
    try:
        response = requests.get(f"{BASE_URL}{ESG_ENDPOINT}", timeout=5)
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 404:
            print("❌ ERROR: Route returns 404 - Route is NOT registered!")
            print("This means Flask didn't register the route during startup.")
            return False
        elif response.status_code == 400:
            print("✅ Route EXISTS! (400 is expected if no analysis results)")
            print(f"Response: {response.text[:500]}")
            return True
        elif response.status_code == 200:
            print("✅ Route EXISTS and returned HTML!")
            print(f"Response length: {len(response.text)} characters")
            return True
        else:
            print(f"⚠️  Unexpected status code: {response.status_code}")
            print(f"Response: {response.text[:500]}")
            return True  # Route exists, just unexpected response
            
    except requests.exceptions.ConnectionError:
        print("❌ ERROR: Cannot connect to server!")
        print("Make sure the server is running on http://127.0.0.1:8082")
        return False
    except Exception as e:
        print(f"❌ ERROR: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_route_registration():
    """Check if we can list all registered routes"""
    print_section("TEST 2: Check Flask route registration")
    
    # We can't directly access Flask's route list from outside,
    # but we can test a known working route for comparison
    try:
        # Test a known working route
        test_response = requests.get(f"{BASE_URL}/api/serve-template-report", timeout=5)
        print(f"Known route '/api/serve-template-report' status: {test_response.status_code}")
        
        if test_response.status_code != 404:
            print("✅ Known route works - server is responding")
        else:
            print("❌ Even known routes return 404 - server issue!")
            
    except Exception as e:
        print(f"⚠️  Could not test known route: {e}")

def test_route_list():
    """Try to get a list of routes if possible"""
    print_section("TEST 3: Check for route listing endpoint")
    
    # Some Flask apps expose route lists, but this one probably doesn't
    # We'll just note this
    print("Note: Cannot directly list Flask routes from external script")
    print("Route registration happens at Flask app startup")

if __name__ == "__main__":
    print_section("ESG Route Test Simulation")
    print(f"Testing endpoint: {BASE_URL}{ESG_ENDPOINT}")
    
    # Test route registration
    test_route_registration()
    
    # Test ESG route
    route_exists = test_esg_route()
    
    print_section("SUMMARY")
    if route_exists:
        print("✅ Route appears to be registered (not 404)")
        print("If you're still getting 404 in browser, check:")
        print("  1. Browser cache (try hard refresh: Ctrl+F5)")
        print("  2. JavaScript console for actual error")
        print("  3. Server logs for route registration")
    else:
        print("❌ Route is NOT registered!")
        print("Possible causes:")
        print("  1. Server wasn't restarted after adding route")
        print("  2. Syntax error preventing route registration")
        print("  3. Route defined inside a conditional block")
        print("  4. Import error during module load")
        print("  5. Route path mismatch (typo in route definition)")

