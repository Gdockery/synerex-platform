#!/usr/bin/env python3
"""
Direct simulation of weather normalization for AT&T and Ochsner projects.
This script loads actual project data and runs weather normalization to verify factors are different.
"""

import sys
import os
import json
import sqlite3
import pandas as pd
import numpy as np

# Add the 8082 directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '8082'))

def get_db_connection():
    """Get database connection"""
    db_paths = [
        os.path.join('8082', 'results', 'app.db'),
        os.path.join('8082', 'synerex.db'),
        'synerex.db',
    ]
    
    for path in db_paths:
        if os.path.exists(path):
            try:
                conn = sqlite3.connect(path)
                conn.row_factory = sqlite3.Row
                return conn
            except Exception as e:
                print(f"❌ Error connecting to {path}: {e}")
                continue
    
    return None

def find_projects():
    """Find AT&T and Ochsner projects"""
    conn = get_db_connection()
    if not conn:
        return []
    
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, name, data 
            FROM projects 
            WHERE (name LIKE '%AT%' OR name LIKE '%Ochsner%' OR name LIKE '%ochsner%' OR name LIKE '%ATT%')
            AND data IS NOT NULL
            ORDER BY created_at DESC
        """)
        projects = cursor.fetchall()
        return [dict(row) for row in projects]
    except Exception as e:
        print(f"❌ Error: {e}")
        return []
    finally:
        conn.close()

def extract_project_data(project):
    """Extract project data"""
    try:
        data_str = project.get('data', '{}')
        parsed = json.loads(data_str)
        
        if isinstance(parsed, dict) and "payload" in parsed:
            if isinstance(parsed["payload"], str):
                return json.loads(parsed["payload"])
            else:
                return parsed["payload"]
        return parsed
    except Exception as e:
        print(f"❌ Error parsing data: {e}")
        return {}

def read_csv_kw_data(file_path):
    """Read CSV file and extract kW data"""
    try:
        # Try to read the CSV
        df = pd.read_csv(file_path)
        
        # Look for kW columns (case-insensitive)
        kw_columns = [col for col in df.columns if 'kw' in col.lower() and 'total' not in col.lower()]
        if not kw_columns:
            # Try avgKw, avg_kw, power, etc.
            for col in df.columns:
                if 'avg' in col.lower() and 'kw' in col.lower():
                    kw_columns = [col]
                    break
        
        if not kw_columns:
            # Try to find any numeric column that might be power
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            if len(numeric_cols) > 0:
                kw_columns = [numeric_cols[0]]  # Use first numeric column
        
        if not kw_columns:
            print(f"   ⚠️ No kW column found, using first numeric column")
            numeric_cols = df.select_dtypes(include=[np.number]).columns
            if len(numeric_cols) > 0:
                kw_columns = [numeric_cols[0]]
            else:
                return None, None
        
        kw_col = kw_columns[0]
        kw_values = pd.to_numeric(df[kw_col], errors='coerce').dropna().values
        
        if len(kw_values) == 0:
            return None, None
        
        avg_kw = float(np.mean(kw_values))
        return avg_kw, kw_values.tolist()
        
    except Exception as e:
        print(f"   ❌ Error reading CSV: {e}")
        return None, None

def simulate_project(project_name, project_data):
    """Simulate weather normalization for a project"""
    print(f"\n{'='*80}")
    print(f"🔍 SIMULATING: {project_name}")
    print(f"{'='*80}")
    
    before_file_id = project_data.get('before_file_id') or project_data.get('beforeFileId')
    after_file_id = project_data.get('after_file_id') or project_data.get('afterFileId')
    
    if not before_file_id or not after_file_id:
        print(f"❌ Missing file IDs")
        return None
    
    print(f"📁 Before File ID: {before_file_id}")
    print(f"📁 After File ID: {after_file_id}")
    
    try:
        # Get file paths from database
        conn = get_db_connection()
        if not conn:
            print("❌ Cannot connect to database")
            return None
        
        cursor = conn.cursor()
        cursor.execute("SELECT file_path FROM raw_meter_data WHERE id = ?", (before_file_id,))
        before_file = cursor.fetchone()
        cursor.execute("SELECT file_path FROM raw_meter_data WHERE id = ?", (after_file_id,))
        after_file = cursor.fetchone()
        
        if not before_file or not after_file:
            print("❌ Files not found in database")
            conn.close()
            return None
        
        before_path = before_file[0]
        after_path = after_file[0]
        
        # Handle relative paths
        if not os.path.isabs(before_path):
            before_path = os.path.join('8082', before_path)
        if not os.path.isabs(after_path):
            after_path = os.path.join('8082', after_path)
        
        print(f"📄 Before: {os.path.basename(before_path)}")
        print(f"📄 After: {os.path.basename(after_path)}")
        
        # Read CSV files to get actual kW data
        print(f"\n📊 Reading CSV files...")
        kw_before, kw_series_before = read_csv_kw_data(before_path)
        kw_after, kw_series_after = read_csv_kw_data(after_path)
        
        if kw_before is None or kw_after is None:
            print(f"❌ Failed to extract kW data from CSVs")
            conn.close()
            return None
        
        print(f"   Before avg kW: {kw_before:.4f} (from {len(kw_series_before) if kw_series_before else 0} data points)")
        print(f"   After avg kW: {kw_after:.4f} (from {len(kw_series_after) if kw_series_after else 0} data points)")
        
        # Get weather data
        from main_hardened_ready_refactored import WeatherServiceClient, WeatherNormalizationML
        
        weather_client = WeatherServiceClient()
        
        # Extract address and dates
        address = project_data.get('address') or project_data.get('client_address') or 'Lafayette, LA' if 'Ochsner' in project_name else 'Addison, TX'
        
        # Set date ranges based on project
        if 'AT&T' in project_name or 'ATT' in project_name:
            before_start = '2025-08-07'
            before_end = '2025-09-03'
            after_start = '2025-09-05'
            after_end = '2025-09-29'
            address = 'Addison, TX'
        else:
            # Ochsner
            before_start = '2025-11-20'
            before_end = '2025-11-21'
            after_start = '2025-11-17'
            after_end = '2025-11-18'
            address = 'Lafayette, LA'
        
        print(f"\n🌤️ Fetching weather data for {address}...")
        print(f"   Before: {before_start} to {before_end}")
        print(f"   After: {after_start} to {after_end}")
        
        try:
            # Fetch weather data with correct signature
            weather_before = weather_client.fetch_weather_data(address, before_start, before_end, after_start, after_end)
            # Extract before and after from the response
            if weather_before and 'temp_before' in weather_before:
                temp_before = weather_before.get('temp_before', 25.0)
                temp_after = weather_before.get('temp_after', 28.0)
                dewpoint_before = weather_before.get('dewpoint_before', 20.0)
                dewpoint_after = weather_before.get('dewpoint_after', 22.0)
            else:
                # Try separate calls if the combined call doesn't work
                weather_before = weather_client.fetch_weather_data(address, before_start, before_end, before_start, before_end)
                weather_after = weather_client.fetch_weather_data(address, after_start, after_end, after_start, after_end)
                
                if weather_before and weather_after:
                    temp_before = weather_before.get('temp_before', 25.0)
                    temp_after = weather_after.get('temp_after', 28.0)
                    dewpoint_before = weather_before.get('dewpoint_before', 20.0)
                    dewpoint_after = weather_after.get('dewpoint_after', 22.0)
                else:
                    raise Exception("Weather data not available")
            
            if not weather_before or not weather_after:
                print("⚠️ Could not fetch weather data - using defaults")
                temp_before = 25.0
                temp_after = 28.0
                dewpoint_before = 20.0
                dewpoint_after = 22.0
            else:
                temp_before = weather_before.get('temp_before', 25.0)
                temp_after = weather_after.get('temp_after', 28.0)
                dewpoint_before = weather_before.get('dewpoint_before', 20.0)
                dewpoint_after = weather_after.get('dewpoint_after', 22.0)
        except Exception as e:
            print(f"⚠️ Weather fetch error: {e} - using defaults")
            temp_before = 25.0
            temp_after = 28.0
            dewpoint_before = 20.0
            dewpoint_after = 22.0
        
        print(f"   Before: Temp {temp_before:.1f}°C, Dewpoint {dewpoint_before:.1f}°C")
        print(f"   After: Temp {temp_after:.1f}°C, Dewpoint {dewpoint_after:.1f}°C")
        
        # Run weather normalization
        print(f"\n🔬 Running Weather Normalization...")
        weather_norm = WeatherNormalizationML()
        
        # Use time series if available
        baseline_energy_series = kw_series_before if kw_series_before and len(kw_series_before) > 10 else None
        after_energy_series = kw_series_after if kw_series_after and len(kw_series_after) > 10 else None
        
        result = weather_norm.normalize_consumption(
            temp_before=temp_before,
            temp_after=temp_after,
            dewpoint_before=dewpoint_before,
            dewpoint_after=dewpoint_after,
            kw_before=kw_before,
            kw_after=kw_after,
            baseline_energy_series=baseline_energy_series,
            baseline_temp_series=None,  # Would need to fetch hourly weather for this
            baseline_dewpoint_series=None,
            after_energy_series=after_energy_series,
            after_temp_series=None,
            after_dewpoint_series=None,
        )
        
        print(f"\n✅ WEATHER NORMALIZATION RESULTS:")
        print(f"   Method: {result.get('method', 'N/A')}")
        print(f"   Raw kW Before: {result.get('raw_kw_before', 0):.4f}")
        print(f"   Raw kW After: {result.get('raw_kw_after', 0):.4f}")
        print(f"   Normalized kW Before: {result.get('normalized_kw_before', 0):.4f}")
        print(f"   Normalized kW After: {result.get('normalized_kw_after', 0):.4f}")
        print(f"   Weather Adjustment Factor: {result.get('weather_adjustment_factor', 0):.4f}")
        print(f"   Base Temperature: {result.get('base_temp_celsius', 'N/A')}°C")
        
        # Calculate what frontend would calculate
        normalized_kw_after = result.get('normalized_kw_after', 0)
        raw_kw_after = result.get('raw_kw_after', 0)
        
        if raw_kw_after > 0:
            calculated_factor = normalized_kw_after / raw_kw_after
            print(f"\n🔢 FRONTEND CALCULATION (what JavaScript would calculate):")
            print(f"   weather_normalized_kw_after / kw_after = {normalized_kw_after:.4f} / {raw_kw_after:.4f} = {calculated_factor:.4f}")
            print(f"   Backend Factor: {result.get('weather_adjustment_factor', 0):.4f}")
            
            if abs(calculated_factor - result.get('weather_adjustment_factor', 0)) > 0.0001:
                print(f"   ⚠️ DIFFERENCE: {abs(calculated_factor - result.get('weather_adjustment_factor', 0)):.6f}")
        
        conn.close()
        
        return {
            'project_name': project_name,
            'kw_after': raw_kw_after,
            'normalized_kw_after': normalized_kw_after,
            'weather_adjustment_factor': result.get('weather_adjustment_factor', 0),
            'calculated_factor': calculated_factor if raw_kw_after > 0 else 0,
            'temp_before': temp_before,
            'temp_after': temp_after,
            'dewpoint_before': dewpoint_before,
            'dewpoint_after': dewpoint_after,
            'base_temp': result.get('base_temp_celsius', 18.3),
        }
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        if 'conn' in locals():
            conn.close()
        return None

def main():
    """Main function"""
    print("🔍 WEATHER NORMALIZATION FACTOR SIMULATION")
    print("=" * 80)
    print("This will simulate weather normalization for AT&T and Ochsner projects")
    print("to verify that each project gets a unique weather adjustment factor.")
    print("=" * 80)
    
    projects = find_projects()
    
    if not projects:
        print("❌ No projects found")
        return
    
    print(f"\n✅ Found {len(projects)} project(s):")
    for p in projects:
        print(f"   - {p['name']}")
    
    results = []
    for project in projects:
        project_data = extract_project_data(project)
        result = simulate_project(project['name'], project_data)
        if result:
            results.append(result)
    
    # Compare results
    if len(results) >= 2:
        print(f"\n{'='*80}")
        print("🔍 COMPARISON OF PROJECTS")
        print(f"{'='*80}")
        
        for result in results:
            print(f"\n📊 {result['project_name']}:")
            print(f"   kw_after: {result['kw_after']:.4f}")
            print(f"   normalized_kw_after: {result['normalized_kw_after']:.4f}")
            print(f"   Calculated Factor: {result['calculated_factor']:.4f}")
            print(f"   Backend Factor: {result['weather_adjustment_factor']:.4f}")
            print(f"   Weather: {result['temp_before']:.1f}°C → {result['temp_after']:.1f}°C")
            print(f"   Base Temp: {result['base_temp']:.1f}°C")
        
        # Check if factors are the same
        factors = [r['calculated_factor'] for r in results]
        unique_factors = set([round(f, 4) for f in factors])
        
        print(f"\n{'='*80}")
        if len(unique_factors) == 1:
            print(f"❌ PROBLEM DETECTED: All projects have the SAME factor: {list(unique_factors)[0]:.4f}")
            print(f"   This indicates a bug - each project should have a unique factor!")
            print(f"\n   Possible causes:")
            print(f"   1. Same weather data being used for both projects")
            print(f"   2. Same kW values being used for both projects")
            print(f"   3. Weather normalization not using project-specific data")
            
            # Check if values are the same
            kw_afters = [r['kw_after'] for r in results]
            normalized_kw_afters = [r['normalized_kw_after'] for r in results]
            
            if len(set([round(k, 2) for k in kw_afters])) == 1:
                print(f"   ⚠️ kw_after values are also the same: {kw_afters[0]:.4f}")
            if len(set([round(n, 2) for n in normalized_kw_afters])) == 1:
                print(f"   ⚠️ weather_normalized_kw_after values are also the same: {normalized_kw_afters[0]:.4f}")
        else:
            print(f"✅ GOOD: Projects have DIFFERENT factors:")
            for r in results:
                print(f"   {r['project_name']}: {r['calculated_factor']:.4f}")
            print(f"\n   This is correct - each project should have a unique factor based on its data.")
    elif len(results) == 1:
        print(f"\n⚠️ Only one project had results. Need at least 2 projects to compare.")
    else:
        print(f"\n❌ No projects produced results. Check if CSV files exist and are readable.")

if __name__ == "__main__":
    main()

