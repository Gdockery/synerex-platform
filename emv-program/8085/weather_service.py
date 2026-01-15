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
try:
    CORS(app)
    logger.info("CORS initialized successfully")
except Exception as e:
    logger.warning(f"Failed to initialize CORS (non-critical): {e}")
    # Continue without CORS if it fails - service can still work

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
        
        logger.info(f"Making Open-Meteo API request: {url} with params: {params}")
        logger.info(f"Request timeout: 60 seconds")
        
        try:
            response = requests.get(url, params=params, timeout=60)  # Increased timeout to 60 seconds for large date ranges
            logger.info(f"Open-Meteo API response status: {response.status_code}")
            response.raise_for_status()
            
            data = response.json()
            logger.info(f"Open-Meteo API response received, keys: {list(data.keys())}")
        except requests.exceptions.Timeout:
            logger.error(f"Open-Meteo API request timed out after 60 seconds for {start_date} to {end_date}")
            return {"error": f"Open-Meteo API request timed out. The date range may be too large or the API is slow."}
        except requests.exceptions.RequestException as e:
            logger.error(f"Open-Meteo API request failed: {e}")
            return {"error": f"Open-Meteo API request failed: {str(e)}"}
        
        # Extract hourly data if available (for timestamp matching)
        hourly_data_list = []
        if include_hourly and "hourly" in data:
            hourly_times = data["hourly"].get("time", [])
            # Check if we have time data (not just if it's truthy, but if it's a non-empty list)
            if hourly_times and len(hourly_times) > 0:
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
            else:
                logger.warning(f"Hourly data requested but time array is empty or missing. Available hourly keys: {list(data.get('hourly', {}).keys())}")
        
        if "daily" in data and data["daily"].get("time") and len(data["daily"]["time"]) > 0:
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
            
            # Log if arrays are empty
            if not valid_temps:
                logger.warning(f"⚠️ Temperature array is empty or all None values! Array length: {len(temps)}, None count: {temps.count(None) if temps else 0}")
            if not valid_humidity:
                logger.warning(f"⚠️ Humidity array is empty or all None values! Array length: {len(humidity)}, None count: {humidity.count(None) if humidity else 0}")
            if not valid_dewpoint:
                logger.warning(f"⚠️ Dewpoint array is empty or all None values! Array length: {len(dewpoint)}, None count: {dewpoint.count(None) if dewpoint else 0}")
            
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
            
            # Calculate from daily data first
            temp_avg = sum(valid_temps) / len(valid_temps) if valid_temps else None
            humidity_avg = sum(valid_humidity) / len(valid_humidity) if valid_humidity else None
            dewpoint_avg = sum(valid_dewpoint) / len(valid_dewpoint) if valid_dewpoint else None
            wind_speed_avg = sum(valid_wind) / len(valid_wind) if valid_wind else None
            solar_radiation_avg = sum(valid_solar) / len(valid_solar) if valid_solar else None
            
            # CRITICAL: ALWAYS use hourly data if available - it's more accurate and reliable
            if hourly_data_list and len(hourly_data_list) > 0:
                logger.info(f"Using hourly data: {len(hourly_data_list)} points available")
                hourly_temps = [h.get('temp') for h in hourly_data_list if h.get('temp') is not None]
                hourly_humidity = [h.get('humidity') for h in hourly_data_list if h.get('humidity') is not None]
                hourly_dewpoint = [h.get('dewpoint') for h in hourly_data_list if h.get('dewpoint') is not None]
                hourly_wind = [h.get('wind_speed') for h in hourly_data_list if h.get('wind_speed') is not None]
                hourly_solar = [h.get('solar_radiation') for h in hourly_data_list if h.get('solar_radiation') is not None]
                
                if hourly_temps:
                    temp_avg = sum(hourly_temps) / len(hourly_temps)
                    logger.info(f"✅ Calculated temp_avg from {len(hourly_temps)} hourly points: {temp_avg:.2f}°C")
                if hourly_humidity:
                    humidity_avg = sum(hourly_humidity) / len(hourly_humidity)
                    logger.info(f"✅ Calculated humidity_avg from {len(hourly_humidity)} hourly points: {humidity_avg:.2f}%")
                if hourly_dewpoint:
                    dewpoint_avg = sum(hourly_dewpoint) / len(hourly_dewpoint)
                    logger.info(f"✅ Calculated dewpoint_avg from {len(hourly_dewpoint)} hourly points: {dewpoint_avg:.2f}°C")
                if hourly_wind:
                    wind_speed_avg = sum(hourly_wind) / len(hourly_wind)
                    logger.info(f"✅ Calculated wind_speed_avg from {len(hourly_wind)} hourly points: {wind_speed_avg:.2f} m/s")
                if hourly_solar:
                    solar_radiation_avg = sum(hourly_solar) / len(hourly_solar)
                    logger.info(f"✅ Calculated solar_radiation_avg from {len(hourly_solar)} hourly points: {solar_radiation_avg:.2f}")
            
            # Final fallback: If still None and we have hourly data, try one more time
            if (temp_avg is None or humidity_avg is None) and hourly_data_list:
                logger.warning(f"⚠️ Daily averages are None (temp={temp_avg}, humidity={humidity_avg}), attempting immediate calculation from {len(hourly_data_list)} hourly data points...")
                if temp_avg is None:
                    hourly_temps = [h.get('temp') for h in hourly_data_list if h.get('temp') is not None]
                    if hourly_temps:
                        temp_avg = sum(hourly_temps) / len(hourly_temps)
                        logger.info(f"Immediate hourly fallback: Calculated temp_avg from {len(hourly_temps)} hourly points: {temp_avg:.2f}°C")
                if humidity_avg is None:
                    hourly_humidity = [h.get('humidity') for h in hourly_data_list if h.get('humidity') is not None]
                    if hourly_humidity:
                        humidity_avg = sum(hourly_humidity) / len(hourly_humidity)
                        logger.info(f"Immediate hourly fallback: Calculated humidity_avg from {len(hourly_humidity)} hourly points: {humidity_avg:.2f}%")
                if dewpoint_avg is None:
                    hourly_dewpoint = [h.get('dewpoint') for h in hourly_data_list if h.get('dewpoint') is not None]
                    if hourly_dewpoint:
                        dewpoint_avg = sum(hourly_dewpoint) / len(hourly_dewpoint)
                        logger.info(f"Immediate hourly fallback: Calculated dewpoint_avg from {len(hourly_dewpoint)} hourly points: {dewpoint_avg:.2f}°C")
            
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
            
            # Fallback: If daily averages are None but we have hourly data, calculate from hourly
            if temp_avg is None and hourly_data_list:
                hourly_temps = [h.get('temp') for h in hourly_data_list if h.get('temp') is not None]
                if hourly_temps:
                    temp_avg = sum(hourly_temps) / len(hourly_temps)
                    logger.info(f"Fallback: Calculated temp_avg from {len(hourly_temps)} hourly points: {temp_avg:.2f}°C")
            
            if humidity_avg is None and hourly_data_list:
                hourly_humidity = [h.get('humidity') for h in hourly_data_list if h.get('humidity') is not None]
                if hourly_humidity:
                    humidity_avg = sum(hourly_humidity) / len(hourly_humidity)
                    logger.info(f"Fallback: Calculated humidity_avg from {len(hourly_humidity)} hourly points: {humidity_avg:.2f}%")
            
            if dewpoint_avg is None and hourly_data_list:
                hourly_dewpoint = [h.get('dewpoint') for h in hourly_data_list if h.get('dewpoint') is not None]
                if hourly_dewpoint:
                    dewpoint_avg = sum(hourly_dewpoint) / len(hourly_dewpoint)
                    logger.info(f"Fallback: Calculated dewpoint_avg from {len(hourly_dewpoint)} hourly points: {dewpoint_avg:.2f}°C")
            
            if wind_speed_avg is None and hourly_data_list:
                hourly_wind = [h.get('wind_speed') for h in hourly_data_list if h.get('wind_speed') is not None]
                if hourly_wind:
                    wind_speed_avg = sum(hourly_wind) / len(hourly_wind)
                    logger.info(f"Fallback: Calculated wind_speed_avg from {len(hourly_wind)} hourly points: {wind_speed_avg:.2f} m/s")
            
            if solar_radiation_avg is None and hourly_data_list:
                hourly_solar = [h.get('solar_radiation') for h in hourly_data_list if h.get('solar_radiation') is not None]
                if hourly_solar:
                    solar_radiation_avg = sum(hourly_solar) / len(hourly_solar)
                    logger.info(f"Fallback: Calculated solar_radiation_avg from {len(hourly_solar)} hourly points: {solar_radiation_avg:.2f}")
            
            result = {
                "temp_avg": temp_avg,
                "humidity_avg": humidity_avg,
                "dewpoint_avg": dewpoint_avg,
                "wind_speed_avg": wind_speed_avg,
                "solar_radiation_avg": solar_radiation_avg,
                "days_count": int(len(valid_temps)) if valid_temps else (len(hourly_data_list) // 24 if hourly_data_list else 0)
            }
            
            # Add hourly data if available
            if hourly_data_list:
                result["hourly_data"] = hourly_data_list
                logger.info(f"Added {len(hourly_data_list)} hourly data points to weather response")
            
            logger.info(f"Weather data fetched for {start_date} to {end_date}: temp_avg={temp_avg}, humidity_avg={humidity_avg}, dewpoint_avg={dewpoint_avg}")
            return result
        else:
            # No daily data - calculate from hourly if available
            if hourly_data_list:
                logger.info(f"No daily data available, but found {len(hourly_data_list)} hourly data points - calculating averages from hourly data")
                hourly_temps = [h.get('temp') for h in hourly_data_list if h.get('temp') is not None]
                hourly_humidity = [h.get('humidity') for h in hourly_data_list if h.get('humidity') is not None]
                hourly_dewpoint = [h.get('dewpoint') for h in hourly_data_list if h.get('dewpoint') is not None]
                hourly_wind = [h.get('wind_speed') for h in hourly_data_list if h.get('wind_speed') is not None]
                hourly_solar = [h.get('solar_radiation') for h in hourly_data_list if h.get('solar_radiation') is not None]
                
                temp_avg = sum(hourly_temps) / len(hourly_temps) if hourly_temps else None
                humidity_avg = sum(hourly_humidity) / len(hourly_humidity) if hourly_humidity else None
                dewpoint_avg = sum(hourly_dewpoint) / len(hourly_dewpoint) if hourly_dewpoint else None
                wind_speed_avg = sum(hourly_wind) / len(hourly_wind) if hourly_wind else None
                solar_radiation_avg = sum(hourly_solar) / len(hourly_solar) if hourly_solar else None
                
                result = {
                    "temp_avg": temp_avg,
                    "humidity_avg": humidity_avg,
                    "dewpoint_avg": dewpoint_avg,
                    "wind_speed_avg": wind_speed_avg,
                    "solar_radiation_avg": solar_radiation_avg,
                    "days_count": len(hourly_data_list) // 24,  # Approximate days from hourly data
                    "hourly_data": hourly_data_list
                }
                logger.info(f"Calculated weather averages from hourly data: {result}")
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
    try:
        return jsonify({"status": "healthy", "service": "weather-service"})
    except Exception as e:
        logger.error(f"Health check error: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return jsonify({"status": "error", "service": "weather-service", "error": str(e)}), 500

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
        # CRITICAL: Always request hourly data as fallback if daily data is missing
        include_hourly = data.get('include_hourly', True)  # Default to True for fallback support
        if not include_hourly:
            logger.warning("include_hourly was False, forcing to True for fallback support")
            include_hourly = True  # Force to True to ensure we can calculate from hourly if needed
        
        logger.info(f"Weather batch - include_hourly: {include_hourly}")
        
        # Fetch weather data for both periods
        # Log the date ranges to help debug timeout issues
        logger.info(f"Fetching before period: {before_start_date} to {before_end_date}")
        logger.info(f"Fetching after period: {after_start_date} to {after_end_date}")
        
        # CRITICAL FIX: Always fetch with hourly data to ensure we have fallback
        # This ensures we can always calculate from hourly data if daily is None
        try:
            logger.info("Attempting to fetch before weather data (with hourly for fallback)...")
            before_weather = fetch_weather_data(lat, lon, before_start_date, before_end_date, include_hourly=True)  # Always include hourly for fallback
            logger.info(f"Before weather data received: temp_avg={before_weather.get('temp_avg')}, humidity_avg={before_weather.get('humidity_avg')}")
            logger.info(f"Before weather hourly_data count: {len(before_weather.get('hourly_data', []))}")
            
            # If daily data is None, calculate from hourly data immediately (hourly data should already be in before_weather)
            if (before_weather.get('temp_avg') is None or before_weather.get('humidity_avg') is None):
                logger.warning(f"⚠️ BEFORE PERIOD: Daily data is None - temp_avg={before_weather.get('temp_avg')}, humidity_avg={before_weather.get('humidity_avg')}")
                logger.info(f"Before period has {len(before_weather.get('hourly_data', []))} hourly data points available for calculation")
                
                # CRITICAL FIX: Calculate averages from hourly data immediately (already fetched above)
                hourly_list = before_weather.get('hourly_data', [])
                logger.info(f"Calculating from {len(hourly_list)} hourly data points for before period...")
                if hourly_list:
                        temps = [h.get('temp') for h in hourly_list if h.get('temp') is not None]
                        humidity = [h.get('humidity') for h in hourly_list if h.get('humidity') is not None]
                        dewpoint = [h.get('dewpoint') for h in hourly_list if h.get('dewpoint') is not None]
                        wind = [h.get('wind_speed') for h in hourly_list if h.get('wind_speed') is not None]
                        solar = [h.get('solar_radiation') for h in hourly_list if h.get('solar_radiation') is not None]
                        
                        if temps and before_weather.get('temp_avg') is None:
                            before_weather['temp_avg'] = sum(temps) / len(temps)
                            logger.info(f"Calculated temp_avg from hourly: {before_weather['temp_avg']:.2f}°C")
                        if humidity and before_weather.get('humidity_avg') is None:
                            before_weather['humidity_avg'] = sum(humidity) / len(humidity)
                            logger.info(f"Calculated humidity_avg from hourly: {before_weather['humidity_avg']:.2f}%")
                        if dewpoint and before_weather.get('dewpoint_avg') is None:
                            before_weather['dewpoint_avg'] = sum(dewpoint) / len(dewpoint)
                            logger.info(f"Calculated dewpoint_avg from hourly: {before_weather['dewpoint_avg']:.2f}°C")
                        if wind and before_weather.get('wind_speed_avg') is None:
                            before_weather['wind_speed_avg'] = sum(wind) / len(wind)
                            logger.info(f"Calculated wind_speed_avg from hourly: {before_weather['wind_speed_avg']:.2f} m/s")
                        if solar and before_weather.get('solar_radiation_avg') is None:
                            before_weather['solar_radiation_avg'] = sum(solar) / len(solar)
                            logger.info(f"Calculated solar_radiation_avg from hourly: {before_weather['solar_radiation_avg']:.2f}")
                else:
                    logger.warning(f"⚠️ BEFORE PERIOD: No hourly data available to calculate from! Hourly list is empty.")
        except Exception as e:
            logger.error(f"Error fetching before weather data: {e}")
            logger.error(traceback.format_exc())
            before_weather = {"error": str(e)}
        
        try:
            logger.info("Attempting to fetch after weather data (with hourly for fallback)...")
            after_weather = fetch_weather_data(lat, lon, after_start_date, after_end_date, include_hourly=True)  # Always include hourly for fallback
            logger.info(f"After weather data received: temp_avg={after_weather.get('temp_avg')}, humidity_avg={after_weather.get('humidity_avg')}")
            logger.info(f"After weather hourly_data count: {len(after_weather.get('hourly_data', []))}")
            
            # If daily data is None, calculate from hourly data immediately (hourly data should already be in after_weather)
            if (after_weather.get('temp_avg') is None or after_weather.get('humidity_avg') is None):
                logger.warning(f"⚠️ AFTER PERIOD: Daily data is None - temp_avg={after_weather.get('temp_avg')}, humidity_avg={after_weather.get('humidity_avg')}")
                logger.info(f"After period has {len(after_weather.get('hourly_data', []))} hourly data points available for calculation")
                
                # CRITICAL FIX: Calculate averages from hourly data immediately (already fetched above)
                hourly_list = after_weather.get('hourly_data', [])
                logger.info(f"Calculating from {len(hourly_list)} hourly data points for after period...")
                if hourly_list:
                        temps = [h.get('temp') for h in hourly_list if h.get('temp') is not None]
                        humidity = [h.get('humidity') for h in hourly_list if h.get('humidity') is not None]
                        dewpoint = [h.get('dewpoint') for h in hourly_list if h.get('dewpoint') is not None]
                        wind = [h.get('wind_speed') for h in hourly_list if h.get('wind_speed') is not None]
                        solar = [h.get('solar_radiation') for h in hourly_list if h.get('solar_radiation') is not None]
                        
                        if temps and after_weather.get('temp_avg') is None:
                            after_weather['temp_avg'] = sum(temps) / len(temps)
                            logger.info(f"Calculated temp_avg from hourly: {after_weather['temp_avg']:.2f}°C")
                        if humidity and after_weather.get('humidity_avg') is None:
                            after_weather['humidity_avg'] = sum(humidity) / len(humidity)
                            logger.info(f"Calculated humidity_avg from hourly: {after_weather['humidity_avg']:.2f}%")
                        if dewpoint and after_weather.get('dewpoint_avg') is None:
                            after_weather['dewpoint_avg'] = sum(dewpoint) / len(dewpoint)
                            logger.info(f"Calculated dewpoint_avg from hourly: {after_weather['dewpoint_avg']:.2f}°C")
                        if wind and after_weather.get('wind_speed_avg') is None:
                            after_weather['wind_speed_avg'] = sum(wind) / len(wind)
                            logger.info(f"Calculated wind_speed_avg from hourly: {after_weather['wind_speed_avg']:.2f} m/s")
                        if solar and after_weather.get('solar_radiation_avg') is None:
                            after_weather['solar_radiation_avg'] = sum(solar) / len(solar)
                            logger.info(f"Calculated solar_radiation_avg from hourly: {after_weather['solar_radiation_avg']:.2f}")
                else:
                    logger.warning(f"⚠️ AFTER PERIOD: No hourly data available to calculate from! Hourly list is empty.")
        except Exception as e:
            logger.error(f"Error fetching after weather data: {e}")
            logger.error(traceback.format_exc())
            after_weather = {"error": str(e)}
        
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
        
        # FINAL SAFETY CHECK: Ensure we have values before building result
        # This catches any edge cases where calculations might have been missed
        if before_weather.get('temp_avg') is None and before_weather.get('hourly_data'):
            logger.warning("temp_before still None after all attempts, calculating from hourly_data one more time...")
            hourly_list = before_weather.get('hourly_data', [])
            if hourly_list:
                temps = [h.get('temp') for h in hourly_list if h.get('temp') is not None]
                humidity = [h.get('humidity') for h in hourly_list if h.get('humidity') is not None]
                dewpoint = [h.get('dewpoint') for h in hourly_list if h.get('dewpoint') is not None]
                wind = [h.get('wind_speed') for h in hourly_list if h.get('wind_speed') is not None]
                solar = [h.get('solar_radiation') for h in hourly_list if h.get('solar_radiation') is not None]
                
                if temps:
                    before_weather['temp_avg'] = sum(temps) / len(temps)
                    logger.info(f"Final fallback: Calculated temp_avg: {before_weather['temp_avg']:.2f}°C")
                if humidity:
                    before_weather['humidity_avg'] = sum(humidity) / len(humidity)
                    logger.info(f"Final fallback: Calculated humidity_avg: {before_weather['humidity_avg']:.2f}%")
                if dewpoint:
                    before_weather['dewpoint_avg'] = sum(dewpoint) / len(dewpoint)
                    logger.info(f"Final fallback: Calculated dewpoint_avg: {before_weather['dewpoint_avg']:.2f}°C")
                if wind:
                    before_weather['wind_speed_avg'] = sum(wind) / len(wind)
                    logger.info(f"Final fallback: Calculated wind_speed_avg: {before_weather['wind_speed_avg']:.2f} m/s")
                if solar:
                    before_weather['solar_radiation_avg'] = sum(solar) / len(solar)
                    logger.info(f"Final fallback: Calculated solar_radiation_avg: {before_weather['solar_radiation_avg']:.2f}")
        
        if after_weather.get('temp_avg') is None and after_weather.get('hourly_data'):
            logger.warning("temp_after still None after all attempts, calculating from hourly_data one more time...")
            hourly_list = after_weather.get('hourly_data', [])
            if hourly_list:
                temps = [h.get('temp') for h in hourly_list if h.get('temp') is not None]
                humidity = [h.get('humidity') for h in hourly_list if h.get('humidity') is not None]
                dewpoint = [h.get('dewpoint') for h in hourly_list if h.get('dewpoint') is not None]
                wind = [h.get('wind_speed') for h in hourly_list if h.get('wind_speed') is not None]
                solar = [h.get('solar_radiation') for h in hourly_list if h.get('solar_radiation') is not None]
                
                if temps:
                    after_weather['temp_avg'] = sum(temps) / len(temps)
                    logger.info(f"Final fallback: Calculated temp_avg: {after_weather['temp_avg']:.2f}°C")
                if humidity:
                    after_weather['humidity_avg'] = sum(humidity) / len(humidity)
                    logger.info(f"Final fallback: Calculated humidity_avg: {after_weather['humidity_avg']:.2f}%")
                if dewpoint:
                    after_weather['dewpoint_avg'] = sum(dewpoint) / len(dewpoint)
                    logger.info(f"Final fallback: Calculated dewpoint_avg: {after_weather['dewpoint_avg']:.2f}°C")
                if wind:
                    after_weather['wind_speed_avg'] = sum(wind) / len(wind)
                    logger.info(f"Final fallback: Calculated wind_speed_avg: {after_weather['wind_speed_avg']:.2f} m/s")
                if solar:
                    after_weather['solar_radiation_avg'] = sum(solar) / len(solar)
                    logger.info(f"Final fallback: Calculated solar_radiation_avg: {after_weather['solar_radiation_avg']:.2f}")
        
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
        
        # CRITICAL FIX: Apply fallback calculation if daily averages are None but hourly data exists
        # This ensures we always have values if hourly data is available
        if hourly_data_combined:
            # Separate before and after hourly data
            before_hourly = [h for h in hourly_data_combined if h.get("period") == "before"]
            after_hourly = [h for h in hourly_data_combined if h.get("period") == "after"]
            
            logger.info(f"Batch fallback check: {len(before_hourly)} before points, {len(after_hourly)} after points")
            if before_hourly:
                logger.info(f"Before hourly sample: {before_hourly[0]}")
            if after_hourly:
                logger.info(f"After hourly sample: {after_hourly[0]}")
            
            # Calculate temp_before from hourly if None
            if result.get("temp_before") is None and before_hourly:
                before_temps = [h.get("temp") for h in before_hourly if h.get("temp") is not None]
                if before_temps:
                    result["temp_before"] = sum(before_temps) / len(before_temps)
                    logger.info(f"Batch fallback: Calculated temp_before from {len(before_temps)} hourly points: {result['temp_before']:.2f}°C")
            
            # Calculate humidity_before from hourly if None
            if result.get("humidity_before") is None and before_hourly:
                before_humidity = [h.get("humidity") for h in before_hourly if h.get("humidity") is not None]
                if before_humidity:
                    result["humidity_before"] = sum(before_humidity) / len(before_humidity)
                    logger.info(f"Batch fallback: Calculated humidity_before from {len(before_humidity)} hourly points: {result['humidity_before']:.2f}%")
            
            # Calculate dewpoint_before from hourly if None
            if result.get("dewpoint_before") is None and before_hourly:
                before_dewpoint = [h.get("dewpoint") for h in before_hourly if h.get("dewpoint") is not None]
                if before_dewpoint:
                    result["dewpoint_before"] = sum(before_dewpoint) / len(before_dewpoint)
                    logger.info(f"Batch fallback: Calculated dewpoint_before from {len(before_dewpoint)} hourly points: {result['dewpoint_before']:.2f}°C")
            
            # Calculate wind_speed_before from hourly if None
            if result.get("wind_speed_before") is None and before_hourly:
                before_wind = [h.get("wind_speed") for h in before_hourly if h.get("wind_speed") is not None]
                if before_wind:
                    result["wind_speed_before"] = sum(before_wind) / len(before_wind)
                    logger.info(f"Batch fallback: Calculated wind_speed_before from {len(before_wind)} hourly points: {result['wind_speed_before']:.2f} m/s")
            
            # Calculate solar_radiation_before from hourly if None
            if result.get("solar_radiation_before") is None and before_hourly:
                before_solar = [h.get("solar_radiation") for h in before_hourly if h.get("solar_radiation") is not None]
                if before_solar:
                    result["solar_radiation_before"] = sum(before_solar) / len(before_solar)
                    logger.info(f"Batch fallback: Calculated solar_radiation_before from {len(before_solar)} hourly points: {result['solar_radiation_before']:.2f}")
            
            # Calculate temp_after from hourly if None
            if result.get("temp_after") is None and after_hourly:
                after_temps = [h.get("temp") for h in after_hourly if h.get("temp") is not None]
                if after_temps:
                    result["temp_after"] = sum(after_temps) / len(after_temps)
                    logger.info(f"Batch fallback: Calculated temp_after from {len(after_temps)} hourly points: {result['temp_after']:.2f}°C")
            
            # Calculate humidity_after from hourly if None
            if result.get("humidity_after") is None and after_hourly:
                after_humidity = [h.get("humidity") for h in after_hourly if h.get("humidity") is not None]
                if after_humidity:
                    result["humidity_after"] = sum(after_humidity) / len(after_humidity)
                    logger.info(f"Batch fallback: Calculated humidity_after from {len(after_humidity)} hourly points: {result['humidity_after']:.2f}%")
            
            # Calculate dewpoint_after from hourly if None
            if result.get("dewpoint_after") is None and after_hourly:
                after_dewpoint = [h.get("dewpoint") for h in after_hourly if h.get("dewpoint") is not None]
                if after_dewpoint:
                    result["dewpoint_after"] = sum(after_dewpoint) / len(after_dewpoint)
                    logger.info(f"Batch fallback: Calculated dewpoint_after from {len(after_dewpoint)} hourly points: {result['dewpoint_after']:.2f}°C")
            
            # Calculate wind_speed_after from hourly if None
            if result.get("wind_speed_after") is None and after_hourly:
                after_wind = [h.get("wind_speed") for h in after_hourly if h.get("wind_speed") is not None]
                if after_wind:
                    result["wind_speed_after"] = sum(after_wind) / len(after_wind)
                    logger.info(f"Batch fallback: Calculated wind_speed_after from {len(after_wind)} hourly points: {result['wind_speed_after']:.2f} m/s")
            
            # Calculate solar_radiation_after from hourly if None
            if result.get("solar_radiation_after") is None and after_hourly:
                after_solar = [h.get("solar_radiation") for h in after_hourly if h.get("solar_radiation") is not None]
                if after_solar:
                    result["solar_radiation_after"] = sum(after_solar) / len(after_solar)
                    logger.info(f"Batch fallback: Calculated solar_radiation_after from {len(after_solar)} hourly points: {result['solar_radiation_after']:.2f}")
        
        # AGGRESSIVE FINAL FALLBACK: Calculate from hourly_data_combined if result still has None values
        # This ensures we ALWAYS have values if any hourly data exists
        if hourly_data_combined:
            before_hourly_final = [h for h in hourly_data_combined if h.get("period") == "before"]
            after_hourly_final = [h for h in hourly_data_combined if h.get("period") == "after"]
            
            # Force calculation for temp_before if still None
            if result.get("temp_before") is None and before_hourly_final:
                temps = [h.get("temp") or h.get("temp_c") or h.get("temperature") for h in before_hourly_final]
                temps = [t for t in temps if t is not None]
                if temps:
                    result["temp_before"] = sum(temps) / len(temps)
                    logger.info(f"AGGRESSIVE FALLBACK: Calculated temp_before from {len(temps)} points: {result['temp_before']:.2f}°C")
            
            # Force calculation for humidity_before if still None
            if result.get("humidity_before") is None and before_hourly_final:
                humidity = [h.get("humidity") or h.get("relative_humidity") for h in before_hourly_final]
                humidity = [h for h in humidity if h is not None]
                if humidity:
                    result["humidity_before"] = sum(humidity) / len(humidity)
                    logger.info(f"AGGRESSIVE FALLBACK: Calculated humidity_before from {len(humidity)} points: {result['humidity_before']:.2f}%")
            
            # Force calculation for dewpoint_before if still None
            if result.get("dewpoint_before") is None and before_hourly_final:
                dewpoint = [h.get("dewpoint") or h.get("dewpoint_c") or h.get("dew_point") for h in before_hourly_final]
                dewpoint = [d for d in dewpoint if d is not None]
                if dewpoint:
                    result["dewpoint_before"] = sum(dewpoint) / len(dewpoint)
                    logger.info(f"AGGRESSIVE FALLBACK: Calculated dewpoint_before from {len(dewpoint)} points: {result['dewpoint_before']:.2f}°C")
            
            # Force calculation for temp_after if still None
            if result.get("temp_after") is None and after_hourly_final:
                temps = [h.get("temp") or h.get("temp_c") or h.get("temperature") for h in after_hourly_final]
                temps = [t for t in temps if t is not None]
                if temps:
                    result["temp_after"] = sum(temps) / len(temps)
                    logger.info(f"AGGRESSIVE FALLBACK: Calculated temp_after from {len(temps)} points: {result['temp_after']:.2f}°C")
            
            # Force calculation for humidity_after if still None
            if result.get("humidity_after") is None and after_hourly_final:
                humidity = [h.get("humidity") or h.get("relative_humidity") for h in after_hourly_final]
                humidity = [h for h in humidity if h is not None]
                if humidity:
                    result["humidity_after"] = sum(humidity) / len(humidity)
                    logger.info(f"AGGRESSIVE FALLBACK: Calculated humidity_after from {len(humidity)} points: {result['humidity_after']:.2f}%")
            
            # Force calculation for dewpoint_after if still None
            if result.get("dewpoint_after") is None and after_hourly_final:
                dewpoint = [h.get("dewpoint") or h.get("dewpoint_c") or h.get("dew_point") for h in after_hourly_final]
                dewpoint = [d for d in dewpoint if d is not None]
                if dewpoint:
                    result["dewpoint_after"] = sum(dewpoint) / len(dewpoint)
                    logger.info(f"AGGRESSIVE FALLBACK: Calculated dewpoint_after from {len(dewpoint)} points: {result['dewpoint_after']:.2f}°C")
        
        logger.info(f"Weather batch response: {result}")
        logger.info(f"FINAL RESULT - temp_before: {result.get('temp_before')}, temp_after: {result.get('temp_after')}, humidity_before: {result.get('humidity_before')}, humidity_after: {result.get('humidity_after')}, dewpoint_before: {result.get('dewpoint_before')}, dewpoint_after: {result.get('dewpoint_after')}")
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Weather batch error: {e}")
        return jsonify({"success": False, "error": str(e)})

if __name__ == '__main__':
    try:
        import sys
        import os
        
        # Log startup immediately to both stdout and logger
        startup_msg = f"""
{'=' * 60}
Weather Service Starting...
Python: {sys.executable}
Working Directory: {os.getcwd()}
Script Location: {__file__}
Flask App: {app.name}
Port: 8200
{'=' * 60}
"""
        print(startup_msg)
        logger.info(startup_msg.strip())
        
        logger.info("Initializing Flask application...")
        logger.info(f"Flask debug mode: False")
        logger.info(f"Flask threaded: True")
        logger.info(f"Flask use_reloader: False")
        
        # Test that we can create the Flask app
        logger.info("Flask app created successfully")
        
        # Windows-compatible Flask configuration
        print("Starting Flask server on port 8200...")
        logger.info("Calling app.run() to start Flask server...")
        app.run(host='0.0.0.0', port=8200, debug=False, use_reloader=False, threaded=True)
    except KeyboardInterrupt:
        print("\nWeather Service stopped by user")
        logger.info("Weather Service stopped by user")
        sys.exit(0)
    except Exception as e:
        error_msg = f"CRITICAL ERROR: Failed to start Weather Service: {e}"
        print(error_msg)
        logger.error(error_msg)
        import traceback
        tb = traceback.format_exc()
        print(tb)
        logger.error(tb)
        sys.exit(1)
