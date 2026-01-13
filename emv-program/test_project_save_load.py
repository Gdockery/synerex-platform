#!/usr/bin/env python3
"""
Simulation script to test complete project save/load transaction
This simulates what happens when a user saves and loads a project
"""

import json
import requests
import sys

# Configuration
BASE_URL = "http://127.0.0.1:8082"
TEST_PROJECT_NAME = "TEST_SAVE_LOAD_SIMULATION"

def print_section(title):
    print("\n" + "="*80)
    print(f"  {title}")
    print("="*80)

def test_save_load():
    """Test complete save/load cycle"""
    
    print_section("STEP 1: Prepare Test Data")
    
    # Simulate the payload that JavaScript would send
    test_payload = {
        "company": "Test Company",
        "facility_address": "123 Test Street",
        "location": "Test City",
        "facility_state": "TX",
        "facility_zip": "75240",
        "contact": "Test Contact",
        "phone": "(555) 123-4567",
        "email": "test@example.com",
        "before_file_id": "68",
        "after_file_id": "67",
        "currency_code": "USD",
        "utility": "Test Utility",
        "account": "123456",
        "energy_rate": "0.10",
        "demand_rate": "15.00",
        "projectList": TEST_PROJECT_NAME,
        "show_methods_card": True,
        "include_bess": False,
        "include_itic_cbema": False
    }
    
    print(f"Test payload contains {len(test_payload)} fields")
    print(f"Project Information fields:")
    for field in ['company', 'facility_address', 'location', 'facility_state', 'facility_zip', 'contact', 'phone', 'email']:
        print(f"  {field}: '{test_payload.get(field)}'")
    
    print_section("STEP 2: Save Project (Simulating Frontend Request)")
    
    # Simulate FormData that JavaScript would send
    form_data = {
        'project_name': TEST_PROJECT_NAME,
        'payload': json.dumps(test_payload)
    }
    
    print(f"Sending save request to {BASE_URL}/api/projects/save")
    print(f"Project name: {TEST_PROJECT_NAME}")
    print(f"Payload JSON length: {len(form_data['payload'])} characters")
    print(f"Payload preview (first 200 chars): {form_data['payload'][:200]}")
    
    try:
        response = requests.post(f"{BASE_URL}/api/projects/save", data=form_data, timeout=10)
        print(f"\nResponse status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"Save result: {json.dumps(result, indent=2)}")
            project_id = None
            
            # Try to get project ID by loading project list
            list_response = requests.get(f"{BASE_URL}/api/projects", timeout=10)
            if list_response.status_code == 200:
                projects = list_response.json()
                for project in projects:
                    if project.get('name') == TEST_PROJECT_NAME:
                        project_id = project.get('id')
                        print(f"\n✅ Found project ID: {project_id}")
                        break
            
            if not project_id:
                print("\n⚠️  Could not find project ID, trying to load by name...")
                # Try loading by name
                load_response = requests.post(
                    f"{BASE_URL}/api/projects/load",
                    json={"project_name": TEST_PROJECT_NAME},
                    headers={"Content-Type": "application/json"},
                    timeout=10
                )
                if load_response.status_code == 200:
                    load_data = load_response.json()
                    project_id = load_data.get('project', {}).get('id')
                    print(f"✅ Got project ID from load: {project_id}")
            
            if project_id:
                print_section("STEP 3: Debug - Check Raw Database Contents")
                
                debug_response = requests.get(f"{BASE_URL}/api/projects/debug/{project_id}", timeout=10)
                if debug_response.status_code == 200:
                    debug_data = debug_response.json()
                    print(f"Project ID: {debug_data.get('project_id')}")
                    print(f"Project Name: {debug_data.get('project_name')}")
                    print(f"Raw data length: {debug_data.get('raw_data_length')}")
                    print(f"Raw data preview: {debug_data.get('raw_data_preview', '')[:300]}")
                    
                    parsed = debug_data.get('parsed_data')
                    if parsed:
                        print(f"\nParsed data structure:")
                        print(f"  Top level keys: {list(parsed.keys())}")
                        if 'payload' in parsed:
                            print(f"  Payload type: {type(parsed['payload'])}")
                            if isinstance(parsed['payload'], str):
                                print(f"  Payload string length: {len(parsed['payload'])}")
                                print(f"  Payload preview: {parsed['payload'][:200]}")
                        
                        if 'payload_parsed' in parsed:
                            payload_parsed = parsed['payload_parsed']
                            print(f"\n  Payload parsed keys: {list(payload_parsed.keys())[:20]}")
                            
                            project_info = parsed.get('project_info_fields', {})
                            print(f"\n  Project Information fields in database:")
                            for field, value in project_info.items():
                                print(f"    {field}: '{value}' (type: {type(value).__name__})")
                
                print_section("STEP 4: Load Project (Simulating Frontend Request)")
                
                load_response = requests.post(
                    f"{BASE_URL}/api/projects/load",
                    json={"project_id": project_id},
                    headers={"Content-Type": "application/json"},
                    timeout=10
                )
                
                print(f"Load response status: {load_response.status_code}")
                
                if load_response.status_code == 200:
                    load_data = load_response.json()
                    project = load_data.get('project', {})
                    
                    print(f"Loaded project: {project.get('name')} (ID: {project.get('id')})")
                    
                    # Parse the data structure (simulating JavaScript)
                    data_str = project.get('data')
                    if data_str:
                        print(f"\nData string length: {len(data_str)}")
                        print(f"Data string preview: {data_str[:200]}")
                        
                        # First parse (simulating JavaScript)
                        parsed_data = json.loads(data_str)
                        print(f"\nAfter first parse - type: {type(parsed_data)}, keys: {list(parsed_data.keys())}")
                        
                        if isinstance(parsed_data, dict) and "payload" in parsed_data:
                            # Second parse (simulating JavaScript)
                            project_data = json.loads(parsed_data["payload"])
                            print(f"After second parse - type: {type(project_data)}, keys: {list(project_data.keys())[:20]}")
                            
                            print(f"\n📥 Loaded Project Information fields:")
                            for field in ['company', 'facility_address', 'location', 'facility_state', 'facility_zip', 'contact', 'phone', 'email']:
                                value = project_data.get(field)
                                expected = test_payload.get(field)
                                match = "✅" if value == expected else "❌"
                                print(f"  {match} {field}: '{value}' (expected: '{expected}')")
                            
                            print_section("STEP 5: Comparison")
                            
                            all_match = True
                            for field in ['company', 'facility_address', 'location', 'facility_state', 'facility_zip', 'contact', 'phone', 'email']:
                                saved = test_payload.get(field)
                                loaded = project_data.get(field)
                                if saved != loaded:
                                    print(f"❌ MISMATCH: {field}")
                                    print(f"   Saved:   '{saved}' (type: {type(saved).__name__})")
                                    print(f"   Loaded:  '{loaded}' (type: {type(loaded).__name__})")
                                    all_match = False
                            
                            if all_match:
                                print("\n✅ SUCCESS: All Project Information fields match!")
                            else:
                                print("\n❌ FAILURE: Some fields do not match!")
                        else:
                            print("❌ ERROR: Could not find 'payload' in parsed data")
                    else:
                        print("❌ ERROR: No data in project response")
                else:
                    print(f"❌ ERROR: Load failed with status {load_response.status_code}")
                    print(f"Response: {load_response.text}")
            else:
                print("❌ ERROR: Could not determine project ID")
        else:
            print(f"❌ ERROR: Save failed with status {response.status_code}")
            print(f"Response: {response.text}")
    
    except requests.exceptions.ConnectionError:
        print(f"❌ ERROR: Could not connect to {BASE_URL}")
        print("Make sure the server is running on port 8082")
        sys.exit(1)
    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    print("\n" + "="*80)
    print("  PROJECT SAVE/LOAD TRANSACTION SIMULATION")
    print("="*80)
    print(f"\nThis script will:")
    print("1. Save a test project with Project Information fields")
    print("2. Check the raw database contents")
    print("3. Load the project back")
    print("4. Compare saved vs loaded values")
    print("\nMake sure the server is running on port 8082")
    print("\nStarting simulation in 2 seconds...")
    import time
    time.sleep(2)
    
    test_save_load()
    
    print("\n" + "="*80)
    print("  SIMULATION COMPLETE")
    print("="*80)
    print("\nCheck the server logs for detailed information about:")
    print("  - What was saved to the database")
    print("  - What was retrieved from the database")
    print("  - How the data was parsed at each step")

