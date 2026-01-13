#!/usr/bin/env python3
"""
Direct simulation of AT&T and Ochsner projects by calling the analysis function.
This will show exactly what weather normalization values are calculated for each project.
"""

import sys
import os
import json
import sqlite3

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
            WHERE name LIKE '%AT%' OR name LIKE '%Ochsner%' OR name LIKE '%ochsner%' OR name LIKE '%ATT%'
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

def simulate_project_analysis(project_name, project_data):
    """Simulate analysis by directly calling the weather normalization"""
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
        # Import the analysis function
        from main_hardened_ready_fixed import get_db_connection, process_csv_file
        from main_hardened_ready_refactored import WeatherNormalizationML
        
        # Get file paths
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
            print("❌ Files not found")
            conn.close()
            return None
        
        before_path = before_file[0]
        after_path = after_file[0]
        
        print(f"📄 Before: {os.path.basename(before_path)}")
        print(f"📄 After: {os.path.basename(after_path)}")
        
        # Process the CSV files to get data
        print("\n📊 Processing CSV files...")
        before_data = process_csv_file(before_path, {})
        after_data = process_csv_file(after_path, {})
        
        if not before_data or not after_data:
            print("❌ Failed to process CSV files")
            conn.close()
            return None
        
        # Extract average kW values
        kw_before = before_data.get('avgKw', {}).get('mean', 0) if isinstance(before_data.get('avgKw'), dict) else before_data.get('avgKw', 0)
        kw_after = after_data.get('avgKw', {}).get('mean', 0) if isinstance(after_data.get('avgKw'), dict) else after_data.get('avgKw', 0)
        
        print(f"   Before avg kW: {kw_before:.2f}")
        print(f"   After avg kW: {kw_after:.2f}")
        
        # Get weather data (simplified - we'll use the weather service)
        from main_hardened_ready_refactored import WeatherServiceClient
        weather_client = WeatherServiceClient()
        
        # Extract address from project data
        address = project_data.get('address') or project_data.get('client_address') or 'Lafayette, LA' if 'Ochsner' in project_name else 'Addison, TX'
        
        # Get date ranges from file names or project data
        # For simulation, we'll use approximate dates
        print(f"\n🌤️ Fetching weather data for {address}...")
        
        # Try to get weather data
        try:
            # Use the project's date ranges if available
            before_start = project_data.get('before_start_date') or '2025-11-20'
            before_end = project_data.get('before_end_date') or '2025-11-21'
            after_start = project_data.get('after_start_date') or '2025-11-17'
            after_end = project_data.get('after_end_date') or '2025-11-18'
            
            if 'AT&T' in project_name or 'ATT' in project_name:
                before_start = '2025-08-07'
                before_end = '2025-09-03'
                after_start = '2025-09-05'
                after_end = '2025-09-29'
                address = 'Addison, TX'
            
            weather_before = weather_client.fetch_weather_data(address, before_start, before_end)
            weather_after = weather_client.fetch_weather_data(address, after_start, after_end)
            
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
        
        # Extract time series if available
        baseline_energy_series = None
        baseline_temp_series = None
        baseline_dewpoint_series = None
        after_energy_series = None
        after_temp_series = None
        after_dewpoint_series = None
        
        # Try to extract time series from the data
        if isinstance(before_data.get('avgKw'), dict) and 'values' in before_data['avgKw']:
            baseline_energy_series = before_data['avgKw']['values']
        if isinstance(after_data.get('avgKw'), dict) and 'values' in after_data['avgKw']:
            after_energy_series = after_data['avgKw']['values']
        
        result = weather_norm.normalize_consumption(
            temp_before=temp_before,
            temp_after=temp_after,
            dewpoint_before=dewpoint_before,
            dewpoint_after=dewpoint_after,
            kw_before=kw_before,
            kw_after=kw_after,
            baseline_energy_series=baseline_energy_series,
            baseline_temp_series=baseline_temp_series,
            baseline_dewpoint_series=baseline_dewpoint_series,
            after_energy_series=after_energy_series,
            after_temp_series=after_temp_series,
            after_dewpoint_series=after_dewpoint_series,
        )
        
        print(f"\n✅ WEATHER NORMALIZATION RESULTS:")
        print(f"   Method: {result.get('method', 'N/A')}")
        print(f"   Raw kW Before: {result.get('raw_kw_before', 0):.4f}")
        print(f"   Raw kW After: {result.get('raw_kw_after', 0):.4f}")
        print(f"   Normalized kW Before: {result.get('normalized_kw_before', 0):.4f}")
        print(f"   Normalized kW After: {result.get('normalized_kw_after', 0):.4f}")
        print(f"   Weather Adjustment Factor: {result.get('weather_adjustment_factor', 0):.4f}")
        
        # Calculate what the frontend would calculate
        normalized_kw_after = result.get('normalized_kw_after', 0)
        raw_kw_after = result.get('raw_kw_after', 0)
        
        if raw_kw_after > 0:
            calculated_factor = normalized_kw_after / raw_kw_after
            print(f"\n🔢 FRONTEND CALCULATION:")
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
        }
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return None

def main():
    """Main function"""
    print("🔍 DIRECT WEATHER NORMALIZATION SIMULATION")
    print("=" * 80)
    
    projects = find_projects()
    
    if not projects:
        print("❌ No projects found")
        return
    
    print(f"\n✅ Found {len(projects)} project(s)")
    
    results = []
    for project in projects:
        project_data = extract_project_data(project)
        result = simulate_project_analysis(project['name'], project_data)
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
        
        # Check if factors are the same
        factors = [r['calculated_factor'] for r in results]
        if len(set([round(f, 4) for f in factors])) == 1:
            print(f"\n❌ PROBLEM: All projects have SAME factor: {factors[0]:.4f}")
            print(f"   This is the bug - each should be unique!")
        else:
            print(f"\n✅ GOOD: Projects have DIFFERENT factors")
            for r in results:
                print(f"   {r['project_name']}: {r['calculated_factor']:.4f}")

if __name__ == "__main__":
    main()

