#!/usr/bin/env python3
"""
Quick script to restart the Main App (8082) via Service Manager API
Requires Service Manager (port 9000) to be running
"""

import requests
import sys
import time

def restart_8082():
    """Restart the Main App (8082) using Service Manager API"""
    service_manager_url = "http://localhost:9000"
    service_id = "main_app"
    
    print("=" * 60)
    print("Restarting Main App (8082) via Service Manager")
    print("=" * 60)
    print()
    
    # First, check if Service Manager is running
    print("Step 1: Checking if Service Manager is running...")
    try:
        health_response = requests.get(f"{service_manager_url}/health", timeout=5)
        if health_response.status_code == 200:
            print("✓ Service Manager is running")
        else:
            print(f"✗ Service Manager returned status {health_response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("✗ Cannot connect to Service Manager (port 9000)")
        print("  Please start the Service Manager first!")
        return False
    except Exception as e:
        print(f"✗ Error checking Service Manager: {e}")
        return False
    
    print()
    print("Step 2: Restarting Main App (8082)...")
    
    # Call the restart API
    restart_url = f"{service_manager_url}/api/services/restart/{service_id}"
    
    try:
        response = requests.post(restart_url, timeout=60)
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print("✓ Main App restart initiated successfully")
                print(f"  Message: {result.get('message', 'N/A')}")
                
                # Wait a bit and check status
                print()
                print("Step 3: Waiting for service to restart...")
                time.sleep(5)
                
                # Check service status
                status_url = f"{service_manager_url}/api/services/status"
                try:
                    status_response = requests.get(status_url, timeout=5)
                    if status_response.status_code == 200:
                        status_data = status_response.json()
                        if service_id in status_data:
                            service_info = status_data[service_id]
                            if service_info.get('running'):
                                print(f"✓ Main App is now running (PID: {service_info.get('pid', 'N/A')})")
                                print(f"  Port: {service_info.get('port', 'N/A')}")
                                return True
                            else:
                                print("⚠ Main App restart initiated but not yet running")
                                print("  Please check logs for details")
                                return False
                except Exception as e:
                    print(f"⚠ Could not verify status: {e}")
                    print("  Restart was initiated, but status check failed")
                    return True  # Assume success if restart was accepted
                
                return True
            else:
                print(f"✗ Restart failed: {result.get('message', 'Unknown error')}")
                if 'error' in result:
                    print(f"  Error details: {result['error']}")
                return False
        else:
            print(f"✗ Service Manager API returned status {response.status_code}")
            try:
                error_data = response.json()
                print(f"  Error: {error_data.get('message', response.text)}")
            except:
                print(f"  Error: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print("✗ Request timed out (Service Manager may be overloaded)")
        return False
    except requests.exceptions.ConnectionError:
        print("✗ Cannot connect to Service Manager")
        print("  The Service Manager may have stopped during restart")
        return False
    except Exception as e:
        print(f"✗ Error restarting service: {e}")
        return False

if __name__ == "__main__":
    success = restart_8082()
    print()
    if success:
        print("=" * 60)
        print("Restart completed successfully!")
        print("=" * 60)
        sys.exit(0)
    else:
        print("=" * 60)
        print("Restart failed. Please check the errors above.")
        print("=" * 60)
        sys.exit(1)
