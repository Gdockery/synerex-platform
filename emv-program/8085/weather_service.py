#!/usr/bin/env python3
"""
Weather Service for Synerex Power Analysis System
Provides weather data via Open-Meteo API
"""

import json
import logging
import requests
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

def geocode_address(address):
    """Geocode address to get coordinates using Open-Meteo Geocoding API with fallbacks"""
    try:
        import re
        import time
        
        # Static fallback coordinates for known project addresses
        static_coordinates = {
            "1680 Great Western Drive, Windsor, CO, 80550": (40.4772, -104.9014, "Windsor, CO"),
            "1680 Great Western Drive": (40.4772, -104.9014, "Windsor, CO"),
            "Windsor, CO, 80550": (40.4772, -104.9014, "Windsor, CO"),
            "80550": (40.4772, -104.9014, "Windsor, CO"),
            # Lafayette, LA coordinates
            "Lafayette, LA": (30.2241, -92.0198, "Lafayette, LA"),
            "Lafayette, LA 70506": (30.2241, -92.0198, "Lafayette, LA"),
            "70506": (30.2241, -92.0198, "Lafayette, LA"),
            "Ambassador Caffery Parkway": (30.2241, -92.0198, "Lafayette, LA"),
            # Frisco, TX coordinates
            "Frisco, TX": (33.1507, -96.8236, "Frisco, TX"),
            "Frisco, TX 75033": (33.1507, -96.8236, "Frisco, TX"),
            "75033": (33.1507, -96.8236, "Frisco, TX"),
            "Gateway Drive": (33.1507, -96.8236, "Frisco, TX"),
        }
        
        # Check static coordinates first
        for key, coords in static_coordinates.items():
            if key.lower() in address.lower():
                logger.info(f"Using static coordinates for: {key}")
                return coords[0], coords[1], coords[2]
        
        # Parse the address components
        # Expected formats: 
        #   "Street Address, City, State, ZIP" (comma-separated)
        #   "Street Address, City, State ZIP" (ZIP attached to state)
        parts = [part.strip() for part in address.split(',')]
        
        # Extract ZIP code from the last part if it contains a ZIP
        zip_code = None
        state = None
        city = None
        street_address = None
        
        if len(parts) >= 3:
            street_address = parts[0]
            city = parts[1]
            last_part = parts[2] if len(parts) > 2 else ""
            
            # Check if last part has ZIP code (5 digits, optionally with 4-digit extension)
            zip_match = re.search(r'\b(\d{5}(?:-\d{4})?)\b', last_part)
            if zip_match:
                zip_code = zip_match.group(1)
                # Extract state (everything before the ZIP)
                state = last_part.replace(zip_code, "").strip()
            else:
                # No ZIP found, treat entire last part as state
                state = last_part
        elif len(parts) == 2:
            # Format: "City, State ZIP" or "City, State"
            city = parts[0]
            last_part = parts[1]
            zip_match = re.search(r'\b(\d{5}(?:-\d{4})?)\b', last_part)
            if zip_match:
                zip_code = zip_match.group(1)
                state = last_part.replace(zip_code, "").strip()
            else:
                state = last_part
        elif len(parts) == 1:
            # Single part - could be just ZIP, city+state, or full address
            zip_match = re.search(r'\b(\d{5}(?:-\d{4})?)\b', address)
            if zip_match and len(address.strip()) == len(zip_match.group(1)):
                # Just a ZIP code
                zip_code = zip_match.group(1)
        
        # Build search attempts with available components
        search_attempts = []
        
        if street_address and city and state and zip_code:
            search_attempts = [
                f"{street_address}, {city}, {state} {zip_code}",  # Full address with zip
                f"{city}, {state} {zip_code}",  # City, state, zip
                f"{zip_code}",  # Just zip code
                f"{city}, {state}",  # City, state
                f"{street_address}, {city}, {state}",  # Street, city, state
                address  # Original full address
            ]
        elif city and state and zip_code:
            search_attempts = [
                f"{city}, {state} {zip_code}",  # City, state, zip
                f"{zip_code}",  # Just zip code
                f"{city}, {state}",  # City, state
                address  # Original address
            ]
        elif zip_code:
            search_attempts = [zip_code, address]
        else:
            # Fallback to original address
            search_attempts = [address]
        
        # Try Open-Meteo Geocoding API first
        url = "https://geocoding-api.open-meteo.com/v1/search"
        
        logger.info(f"Attempting to geocode address: {address}")
        logger.info(f"Search attempts: {search_attempts}")
        
        for attempt in search_attempts:
            try:
                params = {
                    "name": attempt,
                    "count": 1,
                    "language": "en",
                    "format": "json"
                }
                
                logger.info(f"Trying Open-Meteo geocoding for: {attempt}")
                response = requests.get(url, params=params, timeout=10)
                response.raise_for_status()
                
                data = response.json()
                if data.get("results") and len(data["results"]) > 0:
                    result = data["results"][0]
                    logger.info(f"✅ Geocoding successful via Open-Meteo for: {attempt}")
                    logger.info(f"   Result: {result.get('name', attempt)} at ({result['latitude']}, {result['longitude']})")
                    return result["latitude"], result["longitude"], result.get("name", attempt)
                else:
                    logger.warning(f"   Open-Meteo returned no results for: {attempt}")
                    
            except Exception as e:
                logger.warning(f"   Open-Meteo geocoding attempt failed for '{attempt}': {e}")
                continue
        
        # Fallback to Nominatim (OpenStreetMap) geocoding service
        logger.info("Open-Meteo geocoding failed, trying Nominatim (OpenStreetMap) as fallback...")
        nominatim_url = "https://nominatim.openstreetmap.org/search"
        
        for attempt in search_attempts:
            try:
                # Nominatim requires a User-Agent header
                headers = {
                    "User-Agent": "Synerex-Weather-Service/1.0 (contact@synerex.com)"
                }
                params = {
                    "q": attempt,
                    "format": "json",
                    "limit": 1,
                    "addressdetails": 1
                }
                
                logger.info(f"Trying Nominatim geocoding for: {attempt}")
                response = requests.get(nominatim_url, params=params, headers=headers, timeout=10)
                response.raise_for_status()
                
                data = response.json()
                if data and len(data) > 0:
                    result = data[0]
                    lat = float(result["lat"])
                    lon = float(result["lon"])
                    display_name = result.get("display_name", attempt)
                    logger.info(f"✅ Geocoding successful via Nominatim for: {attempt}")
                    logger.info(f"   Result: {display_name} at ({lat}, {lon})")
                    return lat, lon, display_name
                else:
                    logger.warning(f"   Nominatim returned no results for: {attempt}")
                    
                # Rate limiting: Nominatim requires max 1 request per second
                time.sleep(1)
                    
            except Exception as e:
                logger.warning(f"   Nominatim geocoding attempt failed for '{attempt}': {e}")
                # Rate limiting even on error
                time.sleep(1)
                continue
        
        logger.error(f"❌ No geocoding results found for address: {address}")
        logger.error(f"   Tried {len(search_attempts)} different search formats")
        return None, None, None
        
    except Exception as e:
        logger.error(f"Geocoding error for {address}: {e}")
        return None, None, None

def fetch_weather_data(lat, lon, start_date, end_date, include_hourly=False):
    """Fetch weather data from Open-Meteo Archive API
    
    Args:
        lat: Latitude
        lon: Longitude
        start_date: Start date (YYYY-MM-DD)
        end_date: End date (YYYY-MM-DD)
        include_hourly: If True, also fetch hourly data for timestamp matching
    """
    try:
        url = "https://archive-api.open-meteo.com/v1/archive"
        params = {
            "latitude": lat,
            "longitude": lon,
            "start_date": start_date,
            "end_date": end_date,
            "daily": "temperature_2m_mean,relative_humidity_2m_mean,dewpoint_2m_mean,wind_speed_10m_mean,shortwave_radiation_sum",
            "timezone": "UTC"  # Use UTC for consistent timestamp matching with CSV data
        }
        
        # Add hourly parameters if requested (for ASHRAE regression timestamp matching)
        if include_hourly:
            params["hourly"] = "temperature_2m,relative_humidity_2m,dewpoint_2m,wind_speed_10m,shortwave_radiation"
            logger.info(f"Fetching hourly weather data for timestamp matching: {start_date} to {end_date}")
        
        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        
        # Extract hourly data if available (for timestamp matching)
        hourly_data_list = []
        if include_hourly and "hourly" in data and data["hourly"].get("time"):
            hourly_times = data["hourly"]["time"]
            hourly_temps = data["hourly"].get("temperature_2m", [])
            hourly_dewpoints = data["hourly"].get("dewpoint_2m", [])
            hourly_humidity = data["hourly"].get("relative_humidity_2m", [])
            hourly_wind = data["hourly"].get("wind_speed_10m", [])
            hourly_solar = data["hourly"].get("shortwave_radiation", [])
            
            # Create list of hourly data points with timestamps
            # Convert numpy types to native Python types for JSON serialization
            def _convert_numpy_types(value):
                """Convert numpy types to native Python types"""
                if value is None:
                    return None
                try:
                    import numpy as np
                    if isinstance(value, (np.integer, np.int64, np.int32, np.int16, np.int8)):
                        return int(value)
                    elif isinstance(value, (np.floating, np.float64, np.float32, np.float16)):
                        return float(value) if not np.isnan(value) else None
                except ImportError:
                    pass
                return value
            
            for i, time_str in enumerate(hourly_times):
                if i < len(hourly_temps) and hourly_temps[i] is not None:
                    temp_val = _convert_numpy_types(hourly_temps[i])
                    dewpoint_val = _convert_numpy_types(hourly_dewpoints[i] if i < len(hourly_dewpoints) and hourly_dewpoints[i] is not None else None)
                    humidity_val = _convert_numpy_types(hourly_humidity[i] if i < len(hourly_humidity) and hourly_humidity[i] is not None else None)
                    wind_val = _convert_numpy_types(hourly_wind[i] if i < len(hourly_wind) and hourly_wind[i] is not None else None)
                    solar_val = _convert_numpy_types(hourly_solar[i] if i < len(hourly_solar) and hourly_solar[i] is not None else None)
                    
                    hourly_data_list.append({
                        "timestamp": time_str,
                        "time": time_str,
                        "datetime": time_str,
                        "temp_c": temp_val,
                        "temperature": temp_val,
                        "temp": temp_val,
                        "dewpoint_c": dewpoint_val,
                        "dewpoint": dewpoint_val,
                        "dew_point": dewpoint_val,
                        "humidity": humidity_val,
                        "relative_humidity": humidity_val,
                        "wind_speed": wind_val,
                        "solar_radiation": solar_val
                    })
            
            logger.info(f"Extracted {len(hourly_data_list)} hourly weather data points for timestamp matching")
            if len(hourly_data_list) > 0:
                logger.info(f"First hourly timestamp: {hourly_data_list[0].get('timestamp')}, temp: {hourly_data_list[0].get('temp')}°C")
                logger.info(f"Last hourly timestamp: {hourly_data_list[-1].get('timestamp')}, temp: {hourly_data_list[-1].get('temp')}°C")
                logger.info(f"Timestamp format: {type(hourly_data_list[0].get('timestamp'))}")
        
        if "daily" in data and data["daily"]["time"]:
            # Log the raw API response structure for debugging
            daily_keys = list(data['daily'].keys())
            logger.info(f"Open-Meteo API response keys: {daily_keys}")
            
            # Verify the API response structure - check if arrays exist and have data
            if "temperature_2m_mean" not in data["daily"]:
                logger.error("temperature_2m_mean not found in API response!")
                logger.error(f"Available keys: {daily_keys}")
            if "relative_humidity_2m_mean" not in data["daily"]:
                logger.error("relative_humidity_2m_mean not found in API response!")
                logger.error(f"Available keys: {daily_keys}")
            if "dewpoint_2m_mean" not in data["daily"]:
                logger.error("dewpoint_2m_mean not found in API response!")
                logger.error(f"Available keys: {daily_keys}")
            
            # Calculate averages - extract from the correct keys
            temps = data["daily"].get("temperature_2m_mean", [])
            humidity = data["daily"].get("relative_humidity_2m_mean", [])
            dewpoint = data["daily"].get("dewpoint_2m_mean", [])
            wind_speed = data["daily"].get("wind_speed_10m_mean", [])
            solar_radiation = data["daily"].get("shortwave_radiation_sum", [])
            
            # Log sample values to verify correct extraction - check first few values
            if temps and len(temps) > 0:
                logger.info(f"Temperature array (first 3): {temps[:3]}, length: {len(temps)}, type check: {type(temps[0]) if temps else 'N/A'}")
            if humidity and len(humidity) > 0:
                logger.info(f"Humidity array (first 3): {humidity[:3]}, length: {len(humidity)}, type check: {type(humidity[0]) if humidity else 'N/A'}")
            
            # CRITICAL: Verify we're not accidentally swapping arrays
            # Temperature should be in Celsius (typically -50 to 50 range)
            # Humidity should be percentage (typically 0-100 range)
            if temps and humidity and len(temps) > 0 and len(humidity) > 0:
                first_temp = temps[0] if temps[0] is not None else None
                first_humidity = humidity[0] if humidity[0] is not None else None
                if first_temp is not None and first_humidity is not None:
                    # Check if values seem swapped (temp > 50 or humidity < 10)
                    if first_temp > 50 or first_humidity < 10:
                        logger.warning(f"⚠️ POTENTIAL SWAP DETECTED: First temp={first_temp}, First humidity={first_humidity}")
                        logger.warning("Values may be swapped - temp should be -50 to 50, humidity should be 0-100")
            
            # Filter out None values and calculate averages
            valid_temps = [t for t in temps if t is not None]
            valid_humidity = [h for h in humidity if h is not None]
            valid_dewpoint = [d for d in dewpoint if d is not None]
            valid_wind = [w for w in wind_speed if w is not None]
            valid_solar = [s for s in solar_radiation if s is not None]
            
            # Calculate averages and convert numpy types to native Python types
            def _convert_numpy_types(value):
                """Convert numpy types to native Python types"""
                if value is None:
                    return None
                try:
                    import numpy as np
                    if isinstance(value, (np.integer, np.int64, np.int32, np.int16, np.int8)):
                        return int(value)
                    elif isinstance(value, (np.floating, np.float64, np.float32, np.float16)):
                        return float(value) if not np.isnan(value) else None
                except ImportError:
                    pass
                return value
            
            temp_avg = sum(valid_temps) / len(valid_temps) if valid_temps else None
            humidity_avg = sum(valid_humidity) / len(valid_humidity) if valid_humidity else None
            dewpoint_avg = sum(valid_dewpoint) / len(valid_dewpoint) if valid_dewpoint else None
            wind_speed_avg = sum(valid_wind) / len(valid_wind) if valid_wind else None
            solar_radiation_avg = sum(valid_solar) / len(valid_solar) if valid_solar else None
            
            # Convert to native Python types
            temp_avg = _convert_numpy_types(temp_avg)
            humidity_avg = _convert_numpy_types(humidity_avg)
            dewpoint_avg = _convert_numpy_types(dewpoint_avg)
            wind_speed_avg = _convert_numpy_types(wind_speed_avg)
            solar_radiation_avg = _convert_numpy_types(solar_radiation_avg)
            
            # Log calculated values to verify - check for swapped values
            logger.info(f"Calculated averages - Temp: {temp_avg}°C, Humidity: {humidity_avg}%, Dewpoint: {dewpoint_avg}°C, Wind: {wind_speed_avg} m/s, Solar: {solar_radiation_avg}")
            
            # Final validation check
            if temp_avg is not None and humidity_avg is not None:
                if temp_avg > 60 or humidity_avg < 5:
                    logger.error(f"❌ VALUES APPEAR SWAPPED: Temp={temp_avg}°C (should be -50 to 50), Humidity={humidity_avg}% (should be 0-100)")
                    logger.error("This suggests the arrays may be in the wrong order from the API")
            
            result = {
                "temp_avg": temp_avg,
                "humidity_avg": humidity_avg,
                "dewpoint_avg": dewpoint_avg,
                "wind_speed_avg": wind_speed_avg,
                "solar_radiation_avg": solar_radiation_avg,
                "days_count": int(len(valid_temps))  # Convert to int
            }
            
            # Add hourly data if available (for ASHRAE regression)
            if hourly_data_list:
                result["hourly_data"] = hourly_data_list
                logger.info(f"Added {len(hourly_data_list)} hourly data points to weather response")
            
            logger.info(f"Weather data fetched for {start_date} to {end_date}: {result}")
            return result
        else:
            logger.warning(f"No weather data available for {start_date} to {end_date}")
            return {"error": "No weather data available for the specified period"}
            
    except Exception as e:
        logger.error(f"Weather API error: {e}")
        return {"error": str(e)}

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "weather-service"})

@app.route('/weather/batch', methods=['POST'])
def weather_batch():
    """Fetch weather data for before and after periods"""
    try:
        data = request.get_json()
        
        address = data.get('address', '').strip()
        before_start = data.get('before_start', '')
        before_end = data.get('before_end', '')
        after_start = data.get('after_start', '')
        after_end = data.get('after_end', '')
        
        logger.info(f"Weather batch request: {address}, Before: {before_start} to {before_end}, After: {after_start} to {after_end}")
        
        if not address:
            return jsonify({"success": False, "error": "Address is required"})
        
        # Geocode the address
        lat, lon, location_name = geocode_address(address)
        if lat is None or lon is None:
            return jsonify({"success": False, "error": f"Could not geocode address: {address}"})
        
        # Extract date part from datetime strings and convert to YYYY-MM-DD format for Open-Meteo API
        def convert_date_format(date_str):
            """Convert date from MM/DD/YYYY or YYYY-MM-DD to YYYY-MM-DD format"""
            if not date_str:
                return None
            
            # Remove time component if present
            date_part = date_str.split(' ')[0] if ' ' in date_str else date_str
            
            # Check if already in YYYY-MM-DD format
            if len(date_part) == 10 and date_part[4] == '-' and date_part[7] == '-':
                try:
                    # Validate it's a valid date
                    datetime.strptime(date_part, '%Y-%m-%d')
                    return date_part
                except ValueError:
                    pass  # Not valid YYYY-MM-DD, try to convert
            
            # Try to parse MM/DD/YYYY format
            try:
                if '/' in date_part:
                    parts = date_part.split('/')
                    if len(parts) == 3:
                        month, day, year = parts
                        # Validate year is 4 digits
                        if len(year) == 4:
                            converted = f"{year}-{month.zfill(2)}-{day.zfill(2)}"
                            # Validate the converted date
                            datetime.strptime(converted, '%Y-%m-%d')
                            return converted
            except (ValueError, AttributeError, IndexError):
                pass
            
            # Try using datetime parsing as fallback
            try:
                # Try MM/DD/YYYY
                parsed_date = datetime.strptime(date_part, '%m/%d/%Y')
                return parsed_date.strftime('%Y-%m-%d')
            except ValueError:
                try:
                    # Try YYYY-MM-DD (in case it was already correct)
                    parsed_date = datetime.strptime(date_part, '%Y-%m-%d')
                    return parsed_date.strftime('%Y-%m-%d')
                except ValueError:
                    logger.warning(f"Could not parse date format: {date_str}, using as-is")
                    return date_part
        
        before_start_date = convert_date_format(before_start)
        before_end_date = convert_date_format(before_end)
        after_start_date = convert_date_format(after_start)
        after_end_date = convert_date_format(after_end)
        
        # Log converted dates for debugging
        logger.info(f"Date conversion - Before: {before_start} -> {before_start_date}, {before_end} -> {before_end_date}")
        logger.info(f"Date conversion - After: {after_start} -> {after_start_date}, {after_end} -> {after_end_date}")
        
        # Check if hourly data is requested (for ASHRAE regression)
        include_hourly = data.get('include_hourly', False)
        
        # Fetch weather data for both periods
        before_weather = fetch_weather_data(lat, lon, before_start_date, before_end_date, include_hourly=include_hourly)
        after_weather = fetch_weather_data(lat, lon, after_start_date, after_end_date, include_hourly=include_hourly)
        
        # Check for errors
        if "error" in before_weather or "error" in after_weather:
            error_msg = "Weather data fetch failed"
            if "error" in before_weather:
                error_msg += f" (Before period: {before_weather['error']})"
            if "error" in after_weather:
                error_msg += f" (After period: {after_weather['error']})"
            return jsonify({"success": False, "error": error_msg})
        
        # Combine hourly data from both periods with period markers
        hourly_data_combined = []
        if include_hourly:
            # Add before period hourly data with period marker
            before_hourly = before_weather.get("hourly_data", [])
            if before_hourly:
                for entry in before_hourly:
                    if isinstance(entry, dict):
                        entry_with_period = entry.copy()
                        entry_with_period["period"] = "before"
                        hourly_data_combined.append(entry_with_period)
            
            # Add after period hourly data with period marker
            after_hourly = after_weather.get("hourly_data", [])
            if after_hourly:
                for entry in after_hourly:
                    if isinstance(entry, dict):
                        entry_with_period = entry.copy()
                        entry_with_period["period"] = "after"
                        hourly_data_combined.append(entry_with_period)
            
            logger.info(f"Combined {len(before_hourly)} before + {len(after_hourly)} after = {len(hourly_data_combined)} total hourly data points")
        
        # Prepare response
        result = {
            "success": True,
            "location": location_name,
            "coordinates": {"lat": lat, "lon": lon},
            "temp_before": before_weather.get("temp_avg"),
            "temp_after": after_weather.get("temp_avg"),
            "humidity_before": before_weather.get("humidity_avg"),
            "humidity_after": after_weather.get("humidity_avg"),
            "dewpoint_before": before_weather.get("dewpoint_avg"),
            "dewpoint_after": after_weather.get("dewpoint_avg"),
            "wind_speed_before": before_weather.get("wind_speed_avg"),
            "wind_speed_after": after_weather.get("wind_speed_avg"),
            "solar_radiation_before": before_weather.get("solar_radiation_avg"),
            "solar_radiation_after": after_weather.get("solar_radiation_avg"),
            "before_days": before_weather.get("days_count", 0),
            "after_days": after_weather.get("days_count", 0)
        }
        
        # Add hourly data if available
        if hourly_data_combined:
            result["hourly_data"] = hourly_data_combined
        
        logger.info(f"Weather batch response: {result}")
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Weather batch error: {e}")
        return jsonify({"success": False, "error": str(e)})

if __name__ == '__main__':
    logger.info("Starting Weather Service on port 8200")
    # Windows-compatible Flask configuration
    app.run(host='0.0.0.0', port=8200, debug=False, use_reloader=False, threaded=True)
