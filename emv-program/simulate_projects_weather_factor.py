#!/usr/bin/env python3
"""
Simulate AT&T and Ochsner projects to verify weather normalization factors are different.
This script loads both projects, runs analysis, and compares the weather adjustment factors.
"""

import sqlite3
import json
import sys
import os

# Add the 8082 directory to the path so we can import the analysis functions
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '8082'))

def get_db_connection():
    """Get database connection"""
    # Try multiple possible database locations
    db_paths = [
        'synerex.db',
        os.path.join('8082', 'synerex.db'),
        os.path.join('8082', 'results', 'app.db'),
        os.path.join(os.path.dirname(__file__), 'synerex.db'),
        os.path.join(os.path.dirname(__file__), '8082', 'synerex.db'),
        os.path.join(os.path.dirname(__file__), '8082', 'results', 'app.db'),
    ]
    
    db_path = None
    for path in db_paths:
        if os.path.exists(path):
            db_path = path
            break
    
    if not db_path:
        print(f"❌ Database not found. Tried: {db_paths}")
        return None
    
    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        return conn
    except Exception as e:
        print(f"❌ Error connecting to database: {e}")
        return None

def find_projects():
    """Find AT&T and Ochsner projects in the database"""
    conn = get_db_connection()
    if not conn:
        return []
    
    try:
        cursor = conn.cursor()
        # Search for projects with AT&T or Ochsner in the name
        cursor.execute("""
            SELECT id, name, data, created_at 
            FROM projects 
            WHERE name LIKE '%AT%' OR name LIKE '%Ochsner%' OR name LIKE '%ochsner%' OR name LIKE '%ATT%'
            ORDER BY created_at DESC
        """)
        projects = cursor.fetchall()
        return [dict(row) for row in projects]
    except Exception as e:
        print(f"❌ Error querying projects: {e}")
        return []
    finally:
        conn.close()

def extract_project_data(project):
    """Extract project data from the database record"""
    try:
        data_str = project.get('data', '{}')
        parsed = json.loads(data_str)
        
        # Handle nested payload structure
        if isinstance(parsed, dict) and "payload" in parsed:
            if isinstance(parsed["payload"], str):
                project_data = json.loads(parsed["payload"])
            else:
                project_data = parsed["payload"]
        else:
            project_data = parsed
        
        return project_data
    except Exception as e:
        print(f"❌ Error parsing project data for {project.get('name')}: {e}")
        return {}

def simulate_weather_normalization(project_name, project_data):
    """Simulate weather normalization calculation for a project"""
    print(f"\n{'='*80}")
    print(f"🔍 SIMULATING PROJECT: {project_name}")
    print(f"{'='*80}")
    
    # Extract key values
    before_file_id = project_data.get('before_file_id') or project_data.get('beforeFileId')
    after_file_id = project_data.get('after_file_id') or project_data.get('afterFileId')
    
    print(f"📁 Before File ID: {before_file_id}")
    print(f"📁 After File ID: {after_file_id}")
    
    if not before_file_id or not after_file_id:
        print(f"❌ Missing file IDs - cannot simulate")
        return None
    
    # Try to import and use the actual weather normalization class
    try:
        # Import the weather normalization class
        from main_hardened_ready_refactored import WeatherNormalizationML, get_db_connection
        
        # Get file data from database
        db_conn = get_db_connection()
        if not db_conn:
            print("❌ Cannot connect to database to get file data")
            return None
        
        # Use context manager if it's a generator, otherwise use directly
        try:
            # Try to use as context manager
            with db_conn as conn:
                cursor = conn.cursor()
                
                # Get before file
                cursor.execute("SELECT file_path, file_name FROM raw_meter_data WHERE id = ?", (before_file_id,))
                before_file = cursor.fetchone()
                
                # Get after file
                cursor.execute("SELECT file_path, file_name FROM raw_meter_data WHERE id = ?", (after_file_id,))
                after_file = cursor.fetchone()
                
                if not before_file or not after_file:
                    print(f"❌ Files not found in database")
                    return None
                
                print(f"📄 Before File: {before_file[1]} ({before_file[0]})")
                print(f"📄 After File: {after_file[1]} ({after_file[0]})")
                
                # Check analysis_sessions table for recent results
                cursor.execute("""
                    SELECT results_data 
                    FROM analysis_sessions 
                    WHERE before_file_id = ? AND after_file_id = ?
                    ORDER BY created_at DESC
                    LIMIT 1
                """, (before_file_id, after_file_id))
                
                session = cursor.fetchone()
        except TypeError:
            # Not a context manager, use directly
            conn = db_conn
            cursor = conn.cursor()
            
            # Get before file
            cursor.execute("SELECT file_path, file_name FROM raw_meter_data WHERE id = ?", (before_file_id,))
            before_file = cursor.fetchone()
            
            # Get after file
            cursor.execute("SELECT file_path, file_name FROM raw_meter_data WHERE id = ?", (after_file_id,))
            after_file = cursor.fetchone()
            
            if not before_file or not after_file:
                print(f"❌ Files not found in database")
                conn.close()
                return None
            
            print(f"📄 Before File: {before_file[1]} ({before_file[0]})")
            print(f"📄 After File: {after_file[1]} ({after_file[0]})")
            
            # Check analysis_sessions table for recent results
            cursor.execute("""
                SELECT results_data 
                FROM analysis_sessions 
                WHERE before_file_id = ? AND after_file_id = ?
                ORDER BY created_at DESC
                LIMIT 1
            """, (before_file_id, after_file_id))
            
            session = cursor.fetchone()
            conn.close()
        
        if session:
            results = json.loads(session[0]) if isinstance(session[0], str) else session[0]
            
            # Extract weather normalization data
            weather_norm = results.get('weather_normalization', {})
            power_quality = results.get('power_quality', {})
            
            print(f"\n📊 WEATHER NORMALIZATION RESULTS:")
            print(f"   Method: {weather_norm.get('method', 'N/A')}")
            print(f"   Raw kW Before: {weather_norm.get('raw_kw_before', 'N/A')}")
            print(f"   Raw kW After: {weather_norm.get('raw_kw_after', 'N/A')}")
            print(f"   Normalized kW Before: {weather_norm.get('normalized_kw_before', 'N/A')}")
            print(f"   Normalized kW After: {weather_norm.get('normalized_kw_after', 'N/A')}")
            print(f"   Weather Adjustment Factor: {weather_norm.get('weather_adjustment_factor', 'N/A')}")
            print(f"   Base Temperature: {weather_norm.get('base_temp_celsius', 'N/A')}°C")
            print(f"   Temp Sensitivity: {weather_norm.get('temp_sensitivity_used', 'N/A')}")
            print(f"   Dewpoint Sensitivity: {weather_norm.get('dewpoint_sensitivity_used', 'N/A')}")
            
            print(f"\n📊 POWER QUALITY RESULTS:")
            print(f"   kw_after: {power_quality.get('kw_after', 'N/A')}")
            print(f"   weather_normalized_kw_after: {power_quality.get('weather_normalized_kw_after', 'N/A')}")
            
            # Calculate the factor that would be used
            kw_after = power_quality.get('kw_after')
            weather_normalized_kw_after = power_quality.get('weather_normalized_kw_after')
            
            if kw_after and weather_normalized_kw_after and kw_after > 0:
                calculated_factor = weather_normalized_kw_after / kw_after
                print(f"\n🔢 CALCULATED FACTOR (weather_normalized_kw_after / kw_after):")
                print(f"   {weather_normalized_kw_after:.4f} / {kw_after:.4f} = {calculated_factor:.4f}")
                print(f"   Backend Factor: {weather_norm.get('weather_adjustment_factor', 'N/A')}")
                
                if abs(calculated_factor - weather_norm.get('weather_adjustment_factor', 0)) > 0.0001:
                    print(f"   ⚠️ WARNING: Calculated factor differs from backend factor!")
                
                return {
                    'project_name': project_name,
                    'kw_after': kw_after,
                    'weather_normalized_kw_after': weather_normalized_kw_after,
                    'calculated_factor': calculated_factor,
                    'backend_factor': weather_norm.get('weather_adjustment_factor'),
                    'normalized_kw_after': weather_norm.get('normalized_kw_after'),
                    'raw_kw_after': weather_norm.get('raw_kw_after')
                }
            else:
                print(f"❌ Missing required values for factor calculation")
                return None
        else:
            print(f"⚠️ No analysis session found for these file IDs")
            print(f"   You may need to run analysis first")
            return None
            
    except Exception as e:
        print(f"❌ Error during simulation: {e}")
        import traceback
        traceback.print_exc()
        return None

def main():
    """Main simulation function"""
    print("🔍 WEATHER NORMALIZATION FACTOR SIMULATION")
    print("=" * 80)
    print("Searching for AT&T and Ochsner projects...")
    
    projects = find_projects()
    
    if not projects:
        print("❌ No projects found matching AT&T or Ochsner")
        print("   Available projects:")
        conn = get_db_connection()
        if conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id, name FROM projects ORDER BY created_at DESC LIMIT 10")
            all_projects = cursor.fetchall()
            for p in all_projects:
                print(f"     - {p[1]} (ID: {p[0]})")
            conn.close()
        return
    
    print(f"\n✅ Found {len(projects)} project(s):")
    for p in projects:
        print(f"   - {p['name']} (ID: {p['id']})")
    
    # Simulate each project
    results = []
    for project in projects:
        project_data = extract_project_data(project)
        result = simulate_weather_normalization(project['name'], project_data)
        if result:
            results.append(result)
    
    # Compare results
    if len(results) >= 2:
        print(f"\n{'='*80}")
        print("🔍 COMPARISON OF PROJECTS")
        print(f"{'='*80}")
        
        for i, result in enumerate(results):
            print(f"\n📊 {result['project_name']}:")
            print(f"   kw_after: {result['kw_after']:.4f}")
            print(f"   weather_normalized_kw_after: {result['weather_normalized_kw_after']:.4f}")
            print(f"   Calculated Factor: {result['calculated_factor']:.4f}")
            print(f"   Backend Factor: {result.get('backend_factor', 'N/A')}")
        
        # Check if factors are the same
        factors = [r['calculated_factor'] for r in results]
        if len(set([round(f, 4) for f in factors])) == 1:
            print(f"\n❌ PROBLEM DETECTED: All projects have the SAME factor: {factors[0]:.4f}")
            print(f"   This indicates a bug - each project should have a unique factor!")
            
            # Check if the actual values are the same
            kw_afters = [r['kw_after'] for r in results]
            normalized_kw_afters = [r['weather_normalized_kw_after'] for r in results]
            
            if len(set([round(k, 2) for k in kw_afters])) == 1:
                print(f"   ⚠️ kw_after values are also the same: {kw_afters[0]:.4f}")
            if len(set([round(n, 2) for n in normalized_kw_afters])) == 1:
                print(f"   ⚠️ weather_normalized_kw_after values are also the same: {normalized_kw_afters[0]:.4f}")
        else:
            print(f"\n✅ GOOD: Projects have DIFFERENT factors:")
            for r in results:
                print(f"   {r['project_name']}: {r['calculated_factor']:.4f}")
    elif len(results) == 1:
        print(f"\n⚠️ Only one project had results. Need at least 2 projects to compare.")
    else:
        print(f"\n❌ No projects produced results. Check if analysis has been run.")

if __name__ == "__main__":
    main()

