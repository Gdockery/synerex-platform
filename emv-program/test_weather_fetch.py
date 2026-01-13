#!/usr/bin/env python3
"""
Test script to simulate weather fetch and verify timestamp matching functionality.
This script tests the new timestamp matching features.
"""

import sys
import os
import tempfile
import pandas as pd
from pathlib import Path
from datetime import datetime, timedelta
import requests
import json

# Add the main app directory to path
sys.path.insert(0, str(Path(__file__).parent / "8082"))

def create_test_csv(filepath, start_date, end_date, interval_minutes=15, timezone='UTC'):
    """Create a test CSV file with timestamps and energy data"""
    timestamps = pd.date_range(start=start_date, end=end_date, freq=f'{interval_minutes}min', tz=timezone)
    
    # Create some realistic energy data (varying with time of day)
    import numpy as np
    base_load = 100
    daily_variation = 50 * np.sin(2 * np.pi * np.arange(len(timestamps)) / (24 * 60 / interval_minutes))
    random_noise = np.random.normal(0, 10, len(timestamps))
    energy = base_load + daily_variation + random_noise
    energy = np.maximum(energy, 20)  # Minimum load
    
    df = pd.DataFrame({
        'Timestamp': timestamps,
        'kW': energy
    })
    
    df.to_csv(filepath, index=False)
    print(f"[OK] Created test CSV: {filepath}")
    print(f"   Timestamps: {len(timestamps)} points from {timestamps[0]} to {timestamps[-1]}")
    print(f"   Interval: {interval_minutes} minutes")
    return filepath

def test_timestamp_extraction():
    """Test the extract_csv_timestamps_and_data function"""
    print("\n" + "="*80)
    print("TEST 1: CSV Timestamp Extraction")
    print("="*80)
    
    # Create a temporary CSV file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
        csv_path = f.name
    
    try:
        # Create test CSV
        start_date = datetime(2024, 1, 15, 0, 0, 0)
        end_date = datetime(2024, 1, 17, 23, 45, 0)
        create_test_csv(csv_path, start_date, end_date, interval_minutes=15)
        
        # Import the function
        from main_hardened_ready_refactored import extract_csv_timestamps_and_data
        
        # Test extraction
        result = extract_csv_timestamps_and_data(csv_path)
        
        if result:
            print(f"\n[OK] Extraction successful!")
            print(f"   Timestamps extracted: {len(result['timestamps'])}")
            print(f"   Energy values extracted: {len(result['energy'])}")
            print(f"   Detected interval: {result['interval_minutes']} minutes")
            print(f"   First timestamp: {result['timestamps'][0]}")
            print(f"   Last timestamp: {result['timestamps'][-1]}")
            return result
        else:
            print("[FAIL] Extraction failed!")
            return None
            
    finally:
        # Clean up
        if os.path.exists(csv_path):
            os.unlink(csv_path)

def test_timestamp_matching():
    """Test the match_weather_to_csv_timestamps function"""
    print("\n" + "="*80)
    print("TEST 2: Timestamp Matching with Interpolation")
    print("="*80)
    
    # Create sample CSV timestamps (15-minute intervals)
    start = datetime(2024, 1, 15, 0, 0, 0)
    csv_timestamps = [start + timedelta(minutes=15*i) for i in range(96)]  # 24 hours of 15-min data
    
    # Create sample hourly weather data
    hourly_weather = []
    for i in range(24):
        hour = start + timedelta(hours=i)
        hourly_weather.append({
            'timestamp': hour.isoformat() + 'Z',  # ISO format with UTC
            'temp': 20 + 5 * (i % 12) / 12,  # Varying temperature
            'dewpoint': 15 + 3 * (i % 12) / 12,
            'humidity': 60 + 10 * (i % 12) / 12,
            'wind_speed': 5 + 2 * (i % 12) / 12,
            'solar_radiation': max(0, 800 - 400 * abs(i - 12) / 12)
        })
    
    print(f"CSV timestamps: {len(csv_timestamps)} points (15-min intervals)")
    print(f"   Range: {csv_timestamps[0]} to {csv_timestamps[-1]}")
    print(f"Weather data: {len(hourly_weather)} hourly points")
    print(f"   Range: {hourly_weather[0]['timestamp']} to {hourly_weather[-1]['timestamp']}")
    
    # Import the function
    from main_hardened_ready_refactored import match_weather_to_csv_timestamps
    
    # Test matching
    matched = match_weather_to_csv_timestamps(csv_timestamps, hourly_weather, meter_interval_minutes=15)
    
    if matched:
        print(f"\n[OK] Matching successful!")
        print(f"   Matched points: {len(matched)}")
        print(f"   First match: {matched[0]['timestamp']}, temp: {matched[0]['temp']:.2f}C")
        print(f"   Last match: {matched[-1]['timestamp']}, temp: {matched[-1]['temp']:.2f}C")
        
        # Verify interpolation is working (should have different values between hours)
        print(f"\n   Sample interpolated values:")
        for i in [0, 1, 2, 3, 4]:  # Show first 5 (should be interpolated)
            if i < len(matched):
                print(f"      {matched[i]['timestamp']}: temp={matched[i]['temp']:.2f}C")
        
        return matched
    else:
        print("[FAIL] Matching failed!")
        return None

def test_weather_service_health():
    """Test if weather service is running"""
    print("\n" + "="*80)
    print("TEST 3: Weather Service Health Check")
    print("="*80)
    
    try:
        response = requests.get("http://127.0.0.1:8200/health", timeout=5)
        if response.status_code == 200:
            print("[OK] Weather service is running on port 8200")
            return True
        else:
            print(f"[WARN] Weather service returned status {response.status_code}")
            return False
    except Exception as e:
        print(f"[FAIL] Weather service is not running: {e}")
        print("   Please start the weather service first (port 8200)")
        return False

def test_full_weather_fetch_simulation():
    """Simulate a full weather fetch with test CSV files"""
    print("\n" + "="*80)
    print("TEST 4: Full Weather Fetch Simulation")
    print("="*80)
    
    # Check if weather service is running
    if not test_weather_service_health():
        print("\n[WARN] Skipping full simulation - weather service not available")
        return
    
    # Create test CSV files
    with tempfile.NamedTemporaryFile(mode='w', suffix='_before.csv', delete=False) as f1, \
         tempfile.NamedTemporaryFile(mode='w', suffix='_after.csv', delete=False) as f2:
        before_path = f1.name
        after_path = f2.name
    
    try:
        # Create before period CSV (January 1-15, 2024)
        before_start = datetime(2024, 1, 1, 0, 0, 0)
        before_end = datetime(2024, 1, 15, 23, 45, 0)
        create_test_csv(before_path, before_start, before_end, interval_minutes=15)
        
        # Create after period CSV (February 1-15, 2024)
        after_start = datetime(2024, 2, 1, 0, 0, 0)
        after_end = datetime(2024, 2, 15, 23, 45, 0)
        create_test_csv(after_path, after_start, after_end, interval_minutes=15)
        
        # Test the weather service batch endpoint directly
        print("\n[TEST] Testing weather service batch endpoint...")
        weather_payload = {
            "address": "Windsor, CO 80550",
            "before_start": "2024-01-01",
            "before_end": "2024-01-15",
            "after_start": "2024-02-01",
            "after_end": "2024-02-15",
            "include_hourly": True
        }
        
        response = requests.post(
            "http://127.0.0.1:8200/weather/batch",
            json=weather_payload,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print("[OK] Weather service returned data successfully")
                print(f"   Location: {data.get('location', 'N/A')}")
                print(f"   Hourly data points: {len(data.get('hourly_data', []))}")
                
                if data.get('hourly_data'):
                    hourly = data['hourly_data']
                    print(f"   First hourly timestamp: {hourly[0].get('timestamp') if hourly else 'N/A'}")
                    print(f"   Last hourly timestamp: {hourly[-1].get('timestamp') if hourly else 'N/A'}")
                    print(f"   Sample temp: {hourly[0].get('temp', 'N/A')}C" if hourly else "")
                
                # Now test timestamp matching with real weather data
                print("\n[TEST] Testing timestamp matching with real weather data...")
                from main_hardened_ready_refactored import extract_csv_timestamps_and_data, match_weather_to_csv_timestamps
                
                before_csv = extract_csv_timestamps_and_data(before_path)
                after_csv = extract_csv_timestamps_and_data(after_path)
                
                if before_csv and after_csv and data.get('hourly_data'):
                    # Split hourly data by period
                    before_hourly = [w for w in data['hourly_data'] if w.get('period') == 'before']
                    after_hourly = [w for w in data['hourly_data'] if w.get('period') == 'after']
                    
                    if before_hourly:
                        print(f"\n   Matching {len(before_hourly)} before-period weather points...")
                        before_matched = match_weather_to_csv_timestamps(
                            before_csv['timestamps'],
                            before_hourly,
                            before_csv['interval_minutes']
                        )
                        print(f"   [OK] Matched {len(before_matched)} before-period timestamps")
                        if before_matched:
                            print(f"      Sample: {before_matched[0]['timestamp']}, temp={before_matched[0].get('temp', 'N/A')}C")
                    
                    if after_hourly:
                        print(f"\n   Matching {len(after_hourly)} after-period weather points...")
                        after_matched = match_weather_to_csv_timestamps(
                            after_csv['timestamps'],
                            after_hourly,
                            after_csv['interval_minutes']
                        )
                        print(f"   [OK] Matched {len(after_matched)} after-period timestamps")
                        if after_matched:
                            print(f"      Sample: {after_matched[0]['timestamp']}, temp={after_matched[0].get('temp', 'N/A')}C")
            else:
                print(f"[FAIL] Weather service returned error: {data.get('error', 'Unknown error')}")
        else:
            print(f"[FAIL] Weather service request failed: {response.status_code}")
            print(f"   Response: {response.text[:200]}")
            
    finally:
        # Clean up
        for path in [before_path, after_path]:
            if os.path.exists(path):
                os.unlink(path)

def main():
    """Run all tests"""
    print("\n" + "="*80)
    print("WEATHER FETCH TIMESTAMP MATCHING - TEST SUITE")
    print("="*80)
    
    # Test 1: CSV timestamp extraction
    csv_data = test_timestamp_extraction()
    
    # Test 2: Timestamp matching
    matched_data = test_timestamp_matching()
    
    # Test 3: Weather service health
    service_available = test_weather_service_health()
    
    # Test 4: Full simulation (only if service is available)
    if service_available:
        test_full_weather_fetch_simulation()
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    print(f"[OK] CSV Extraction: {'PASS' if csv_data else 'FAIL'}")
    print(f"[OK] Timestamp Matching: {'PASS' if matched_data else 'FAIL'}")
    print(f"{'[OK]' if service_available else '[WARN]'} Weather Service: {'AVAILABLE' if service_available else 'NOT AVAILABLE'}")
    print("\n" + "="*80)

if __name__ == "__main__":
    main()

