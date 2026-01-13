#!/usr/bin/env python3
"""
Test script for Chart Generation Service
"""

import requests
import json

def test_chart_service():
    """Test the chart generation service"""
    
    # Test data (simplified)
    test_data = {
        "power_quality": {
            "before": {
                "avgKw": {
                    "values": [100, 105, 98, 102, 110, 95, 108, 103, 97, 105]
                },
                "avgKva": {
                    "values": [120, 125, 118, 122, 130, 115, 128, 123, 117, 125]
                },
                "avgPf": {
                    "values": [0.85, 0.87, 0.83, 0.86, 0.88, 0.82, 0.89, 0.84, 0.81, 0.87]
                },
                "avgTHD": {
                    "values": [5.2, 5.5, 4.8, 5.1, 5.8, 4.5, 6.0, 5.3, 4.2, 5.6]
                }
            },
            "after": {
                "avgKw": {
                    "values": [95, 98, 92, 96, 102, 88, 100, 94, 90, 97]
                },
                "avgKva": {
                    "values": [98, 101, 95, 99, 105, 91, 103, 97, 93, 100]
                },
                "avgPf": {
                    "values": [0.97, 0.98, 0.96, 0.97, 0.99, 0.95, 0.99, 0.96, 0.94, 0.98]
                },
                "avgTHD": {
                    "values": [1.2, 1.5, 0.8, 1.1, 1.8, 0.5, 2.0, 1.3, 0.2, 1.6]
                }
            }
        },
        "envelope_analysis": {
            "smoothing_data": {
                "metric_details": {
                    "avgKw": {
                        "variance_improvement": 15.1,
                        "cv_improvement": 21.4
                    },
                    "avgKva": {
                        "variance_improvement": 59.5,
                        "cv_improvement": 21.7
                    },
                    "avgPf": {
                        "variance_improvement": 96.6,
                        "cv_improvement": 87.2
                    },
                    "avgTHD": {
                        "variance_improvement": 98.6,
                        "cv_improvement": 88.0
                    }
                }
            }
        }
    }
    
    # Test health check
    print("Testing health check...")
    try:
        response = requests.get("http://localhost:8201/health", timeout=10)
        print(f"Health check: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"Health check failed: {e}")
        return False
    
    # Test chart generation
    print("\nTesting chart generation...")
    try:
        response = requests.post(
            "http://localhost:8201/generate_charts",
            json=test_data,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"Chart generation successful: {result['message']}")
            print(f"Generated {result['chart_count']} charts")
            
            # List generated charts
            for chart_name in result['charts'].keys():
                print(f"  - {chart_name}")
            
            return True
        else:
            print(f"Chart generation failed: {response.status_code}")
            print(f"Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"Chart generation test failed: {e}")
        return False

if __name__ == "__main__":
    print("Chart Service Test")
    print("==================")
    
    success = test_chart_service()
    
    if success:
        print("\n✅ All tests passed!")
    else:
        print("\n❌ Tests failed!")

