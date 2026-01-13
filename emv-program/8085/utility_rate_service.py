#!/usr/bin/env python3
"""
Utility Rate Service for SYNEREX
Provides real-time utility rate lookup with fallback to static data
"""

import json
import logging
import requests
import re
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS

try:
    from bs4 import BeautifulSoup
    BEAUTIFULSOUP_AVAILABLE = True
except ImportError:
    BEAUTIFULSOUP_AVAILABLE = False
    logging.warning("BeautifulSoup4 not available - web scraping disabled")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Static fallback rate data (from knowledge base)
STATIC_RATE_DATA = {
    "california": {
        "average_rate": 0.28,
        "peak_rate": 0.45,
        "off_peak_rate": 0.25,
        "demand_charge": 15.50,
        "time_of_use": True,
        "utilities": ["PG&E", "SCE", "SDG&E"],
        "source": "static_knowledge_base"
    },
    "texas": {
        "average_rate": 0.12,
        "peak_rate": 0.12,
        "off_peak_rate": 0.08,
        "demand_charge": 8.50,
        "time_of_use": False,
        "utilities": ["Oncor", "CenterPoint", "AEP"],
        "source": "static_knowledge_base"
    },
    "new_york": {
        "average_rate": 0.20,
        "peak_rate": 0.35,
        "off_peak_rate": 0.20,
        "demand_charge": 12.00,
        "time_of_use": True,
        "utilities": ["ConEd", "National Grid", "NYSEG"],
        "source": "static_knowledge_base"
    },
    "florida": {
        "average_rate": 0.12,
        "peak_rate": 0.15,
        "off_peak_rate": 0.10,
        "demand_charge": 6.50,
        "time_of_use": False,
        "utilities": ["FPL", "Duke Energy", "Tampa Electric"],
        "source": "static_knowledge_base"
    },
    "louisiana": {
        "average_rate": 0.10,
        "peak_rate": 0.12,
        "off_peak_rate": 0.08,
        "demand_charge": 7.00,
        "time_of_use": False,
        "utilities": ["Entergy", "CLECO", "SWEPCO"],
        "source": "static_knowledge_base"
    },
    "colorado": {
        "average_rate": 0.12,
        "peak_rate": 0.18,
        "off_peak_rate": 0.10,
        "demand_charge": 8.00,
        "time_of_use": True,
        "utilities": ["Xcel Energy", "Black Hills Energy"],
        "source": "static_knowledge_base"
    }
}

def normalize_state(state_input):
    """Normalize state name or abbreviation to lowercase state name"""
    state_mapping = {
        'ca': 'california', 'california': 'california',
        'tx': 'texas', 'texas': 'texas',
        'ny': 'new_york', 'new york': 'new_york', 'new_york': 'new_york',
        'fl': 'florida', 'florida': 'florida',
        'la': 'louisiana', 'louisiana': 'louisiana',
        'co': 'colorado', 'colorado': 'colorado',
        'az': 'arizona', 'arizona': 'arizona',
        'ga': 'georgia', 'georgia': 'georgia',
        'nc': 'north_carolina', 'north carolina': 'north_carolina', 'north_carolina': 'north_carolina',
        'wa': 'washington', 'washington': 'washington',
        'or': 'oregon', 'oregon': 'oregon',
        'nv': 'nevada', 'nevada': 'nevada',
        'ut': 'utah', 'utah': 'utah',
        'nm': 'new_mexico', 'new mexico': 'new_mexico', 'new_mexico': 'new_mexico',
        'ok': 'oklahoma', 'oklahoma': 'oklahoma',
        'ar': 'arkansas', 'arkansas': 'arkansas',
        'ms': 'mississippi', 'mississippi': 'mississippi',
        'al': 'alabama', 'alabama': 'alabama',
        'tn': 'tennessee', 'tennessee': 'tennessee',
        'ky': 'kentucky', 'kentucky': 'kentucky',
        'mo': 'missouri', 'missouri': 'missouri',
        'il': 'illinois', 'illinois': 'illinois',
        'in': 'indiana', 'indiana': 'indiana',
        'oh': 'ohio', 'ohio': 'ohio',
        'mi': 'michigan', 'michigan': 'michigan',
        'wi': 'wisconsin', 'wisconsin': 'wisconsin',
        'mn': 'minnesota', 'minnesota': 'minnesota',
        'ia': 'iowa', 'iowa': 'iowa',
        'ne': 'nebraska', 'nebraska': 'nebraska',
        'ks': 'kansas', 'kansas': 'kansas',
        'nd': 'north_dakota', 'north dakota': 'north_dakota', 'north_dakota': 'north_dakota',
        'sd': 'south_dakota', 'south dakota': 'south_dakota', 'south_dakota': 'south_dakota',
        'mt': 'montana', 'montana': 'montana',
        'wy': 'wyoming', 'wyoming': 'wyoming',
        'id': 'idaho', 'idaho': 'idaho',
        'pa': 'pennsylvania', 'pennsylvania': 'pennsylvania',
        'nj': 'new_jersey', 'new jersey': 'new_jersey', 'new_jersey': 'new_jersey',
        'de': 'delaware', 'delaware': 'delaware',
        'md': 'maryland', 'maryland': 'maryland',
        'va': 'virginia', 'virginia': 'virginia',
        'wv': 'west_virginia', 'west virginia': 'west_virginia', 'west_virginia': 'west_virginia',
        'vt': 'vermont', 'vermont': 'vermont',
        'nh': 'new_hampshire', 'new hampshire': 'new_hampshire', 'new_hampshire': 'new_hampshire',
        'me': 'maine', 'maine': 'maine',
        'ma': 'massachusetts', 'massachusetts': 'massachusetts',
        'ri': 'rhode_island', 'rhode island': 'rhode_island', 'rhode_island': 'rhode_island',
        'ct': 'connecticut', 'connecticut': 'connecticut',
        'hi': 'hawaii', 'hawaii': 'hawaii',
        'ak': 'alaska', 'alaska': 'alaska',
        'dc': 'district_of_columbia', 'district of columbia': 'district_of_columbia', 'district_of_columbia': 'district_of_columbia'
    }
    
    state_lower = state_input.lower().strip()
    return state_mapping.get(state_lower, state_lower.replace(' ', '_'))

def fetch_eia_rates(state):
    """Fetch utility rates from EIA (Energy Information Administration) API"""
    try:
        # EIA API endpoint for electricity prices by state
        # Note: EIA API requires registration but has free tier
        # This is a placeholder for future implementation
        logger.info(f"EIA API lookup for {state} (requires API key - not implemented)")
        return None
        
    except Exception as e:
        logger.warning(f"EIA API lookup failed: {e}")
        return None

def scrape_utility_website(state, city=None):
    """Scrape utility company websites for rate information"""
    if not BEAUTIFULSOUP_AVAILABLE:
        return None
        
    try:
        state_normalized = normalize_state(state)
        
        # Map states to major utility websites
        utility_websites = {
            'california': {
                'pge': 'https://www.pge.com/en/rates-and-plans/rate-plans/index.page',
                'sce': 'https://www.sce.com/residential/rates',
            },
            'texas': {
                'ercot': 'https://www.ercot.com/gridinfo/load',
            },
            'new_york': {
                'coned': 'https://www.coned.com/en/accounts-billing/rates-and-tariffs',
            },
            'florida': {
                'fpl': 'https://www.fpl.com/rates',
            },
            'louisiana': {
                'entergy': 'https://www.entergy.com/rates/',
            },
            'colorado': {
                'xcel': 'https://www.xcelenergy.com/rates_and_regulations/rates',
            }
        }
        
        if state_normalized not in utility_websites:
            return None
        
        # Try to scrape first utility website
        utilities = utility_websites[state_normalized]
        for utility_name, url in utilities.items():
            try:
                response = requests.get(url, timeout=10, headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                })
                
                if response.status_code == 200:
                    # Try to extract rate information
                    soup = BeautifulSoup(response.text, 'html.parser')
                    
                    # Look for common rate patterns
                    text = soup.get_text()
                    
                    # Pattern: $X.XX per kWh or X.XX cents per kWh
                    rate_patterns = [
                        r'\$(\d+\.\d+)\s*per\s*kwh',
                        r'(\d+\.\d+)\s*cents?\s*per\s*kwh',
                        r'rate[:\s]+[\$]?(\d+\.\d+)',
                    ]
                    
                    rates_found = []
                    for pattern in rate_patterns:
                        matches = re.findall(pattern, text, re.IGNORECASE)
                        if matches:
                            for match in matches[:3]:  # Get first 3 matches
                                try:
                                    rate = float(match)
                                    # Convert cents to dollars if needed
                                    if rate > 1.0:  # Likely in cents
                                        rate = rate / 100
                                    rates_found.append(rate)
                                except ValueError:
                                    continue
                    
                    if rates_found:
                        avg_rate = sum(rates_found) / len(rates_found)
                        logger.info(f"Scraped rate from {utility_name}: ${avg_rate:.4f}/kWh")
                        return {
                            "average_rate": round(avg_rate, 4),
                            "source": f"scraped_{utility_name}",
                            "utilities": [utility_name.upper()],
                            "last_updated": datetime.now().isoformat()
                        }
            except Exception as e:
                logger.debug(f"Failed to scrape {utility_name}: {e}")
                continue
        
        return None
        
    except Exception as e:
        logger.warning(f"Web scraping failed: {e}")
        return None

def get_utility_rates(location_data):
    """Get utility rates for a location with multiple fallback strategies"""
    try:
        # Extract state from location data
        state = None
        city = None
        
        if location_data:
            state = location_data.get('state', '')
            city = location_data.get('city', '')
            city_state = location_data.get('cityState', '')
            
            # Try to extract state from cityState if not directly provided
            if not state and city_state:
                # Parse "City, State" format
                parts = city_state.split(',')
                if len(parts) > 1:
                    state = parts[-1].strip()
                    city = parts[0].strip()
        
        if not state:
            logger.warning("No state information provided")
            return {
                "success": False,
                "error": "Location information required. Please provide state or city/state.",
                "fallback": None
            }
        
        state_normalized = normalize_state(state)
        logger.info(f"Looking up utility rates for: {state_normalized} (city: {city})")
        
        # Strategy 1: Try web scraping (free, no API key needed)
        scraped_data = scrape_utility_website(state_normalized, city)
        if scraped_data:
            return {
                "success": True,
                "data": scraped_data,
                "source": "web_scraping",
                "location": {"state": state, "city": city}
            }
        
        # Strategy 2: Try EIA API (requires API key - placeholder)
        eia_data = fetch_eia_rates(state_normalized)
        if eia_data:
            return {
                "success": True,
                "data": eia_data,
                "source": "eia_api",
                "location": {"state": state, "city": city}
            }
        
        # Strategy 3: Fallback to static knowledge base
        if state_normalized in STATIC_RATE_DATA:
            static_data = STATIC_RATE_DATA[state_normalized].copy()
            static_data["last_updated"] = "static_data"
            static_data["note"] = "Estimated rates from knowledge base. For current rates, check with local utility."
            
            return {
                "success": True,
                "data": static_data,
                "source": "static_knowledge_base",
                "location": {"state": state, "city": city},
                "fallback": True
            }
        
        # Strategy 4: Use average US rate if state not found
        return {
            "success": True,
            "data": {
                "average_rate": 0.13,  # US average
                "peak_rate": 0.18,
                "off_peak_rate": 0.10,
                "demand_charge": 10.00,
                "time_of_use": False,
                "utilities": ["Local Utility"],
                "source": "us_average",
                "note": "Using US average rate. Please check with local utility for accurate rates.",
                "last_updated": "static_data"
            },
            "source": "us_average_fallback",
            "location": {"state": state, "city": city},
            "fallback": True
        }
        
    except Exception as e:
        logger.error(f"Error getting utility rates: {e}")
        return {
            "success": False,
            "error": str(e),
            "fallback": None
        }

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "utility_rate_service",
        "port": 8202,
        "timestamp": datetime.now().isoformat()
    })

@app.route('/rates', methods=['POST'])
def get_rates():
    """Get utility rates for a location"""
    try:
        data = request.get_json() or {}
        location_data = data.get('location_data', {})
        
        result = get_utility_rates(location_data)
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in /rates endpoint: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/rates/state/<state>', methods=['GET'])
def get_rates_by_state(state):
    """Get utility rates by state (GET endpoint for convenience)"""
    try:
        location_data = {"state": state}
        result = get_utility_rates(location_data)
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in /rates/state endpoint: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == '__main__':
    print("Starting Utility Rate Service on port 8202")
    print("Endpoints:")
    print("  GET  /health")
    print("  POST /rates")
    print("  GET  /rates/state/<state>")
    app.run(host='0.0.0.0', port=8202, debug=True)

