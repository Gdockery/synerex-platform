"""Test script for new enterprise endpoints."""
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

def login():
    """Login and get session cookie."""
    session = requests.Session()
    response = session.post(
        f"{BASE_URL}/admin/login",
        data={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
    )
    if response.status_code == 303 or response.status_code == 200:
        return session
    else:
        print(f"Login failed: {response.status_code}")
        return None

def test_lifecycle_endpoints(session):
    """Test lifecycle management endpoints."""
    print("\n=== Testing Lifecycle Endpoints ===")
    
    # Test run-tasks
    print("1. Testing /api/lifecycle/run-tasks...")
    response = session.post(f"{BASE_URL}/api/lifecycle/run-tasks")
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        print(f"   Response: {json.dumps(response.json(), indent=2)}")
    else:
        print(f"   Error: {response.text}")
    
    # Test check-expiring
    print("\n2. Testing /api/lifecycle/check-expiring...")
    response = session.post(f"{BASE_URL}/api/lifecycle/check-expiring")
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        print(f"   Response: {json.dumps(response.json(), indent=2)}")
    
    # Test handle-expired
    print("\n3. Testing /api/lifecycle/handle-expired...")
    response = session.post(f"{BASE_URL}/api/lifecycle/handle-expired")
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        print(f"   Response: {json.dumps(response.json(), indent=2)}")

def test_webhook_endpoints(session):
    """Test webhook management endpoints."""
    print("\n=== Testing Webhook Endpoints ===")
    
    # Test list webhooks
    print("1. Testing GET /api/webhooks...")
    response = session.get(f"{BASE_URL}/api/webhooks")
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   Found {len(data.get('webhooks', []))} webhooks")
    
    # Test create webhook
    print("\n2. Testing POST /api/webhooks...")
    webhook_data = {
        "url": "https://example.com/webhook",
        "events": ["license.issued", "license.expired"],
        "org_id": None,
        "secret": "test_secret_123"
    }
    response = session.post(
        f"{BASE_URL}/api/webhooks",
        json=webhook_data
    )
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        webhook_id = response.json().get("webhook_id")
        print(f"   Created webhook ID: {webhook_id}")
        return webhook_id
    else:
        print(f"   Error: {response.text}")
        return None

def test_analytics_endpoints(session):
    """Test analytics endpoints."""
    print("\n=== Testing Analytics Endpoints ===")
    
    # Test revenue report
    print("1. Testing GET /api/analytics/revenue...")
    response = session.get(f"{BASE_URL}/api/analytics/revenue")
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        print(f"   Response: {json.dumps(response.json(), indent=2)}")
    
    # Test usage report
    print("\n2. Testing GET /api/analytics/usage...")
    response = session.get(f"{BASE_URL}/api/analytics/usage")
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        print(f"   Response: {json.dumps(response.json(), indent=2)}")
    
    # Test license utilization
    print("\n3. Testing GET /api/analytics/license-utilization...")
    response = session.get(f"{BASE_URL}/api/analytics/license-utilization")
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   Total licenses: {data.get('total_licenses')}")
        print(f"   Active licenses: {data.get('active_licenses')}")
        print(f"   Utilization rate: {data.get('utilization_rate'):.2f}%")

def test_export_endpoints(session):
    """Test export endpoints."""
    print("\n=== Testing Export Endpoints ===")
    
    # Test export licenses
    print("1. Testing GET /api/exports/licenses...")
    response = session.get(f"{BASE_URL}/api/exports/licenses")
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        print(f"   Content-Type: {response.headers.get('Content-Type')}")
        print(f"   Content-Disposition: {response.headers.get('Content-Disposition')}")
        print(f"   CSV length: {len(response.text)} characters")
    
    # Test export organizations
    print("\n2. Testing GET /api/exports/organizations...")
    response = session.get(f"{BASE_URL}/api/exports/organizations")
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        print(f"   CSV length: {len(response.text)} characters")
    
    # Test export billing
    print("\n3. Testing GET /api/exports/billing...")
    response = session.get(f"{BASE_URL}/api/exports/billing")
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        print(f"   CSV length: {len(response.text)} characters")

def test_stats_endpoint():
    """Test stats endpoint."""
    print("\n=== Testing Stats Endpoint ===")
    print("Testing GET /api/stats...")
    response = requests.get(f"{BASE_URL}/api/stats")
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   Organizations: {data.get('organizations')}")
        print(f"   Licenses: {data.get('licenses')}")
        print(f"   Authorizations: {data.get('authorizations')}")

def main():
    """Run all tests."""
    print("=" * 60)
    print("Testing New Enterprise Endpoints")
    print("=" * 60)
    
    # Check if server is running
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=2)
        if response.status_code != 200:
            print("ERROR: Server is not responding correctly")
            return
    except requests.exceptions.RequestException:
        print("ERROR: Server is not running. Please start it first:")
        print("  cd services/license-service")
        print("  uvicorn app.main:app --reload --port 8000")
        return
    
    # Login
    print("\nLogging in...")
    session = login()
    if not session:
        print("Failed to login. Exiting.")
        return
    
    print("Login successful!")
    
    # Run tests
    test_stats_endpoint()
    test_lifecycle_endpoints(session)
    test_webhook_endpoints(session)
    test_analytics_endpoints(session)
    test_export_endpoints(session)
    
    print("\n" + "=" * 60)
    print("Testing Complete!")
    print("=" * 60)

if __name__ == "__main__":
    main()


