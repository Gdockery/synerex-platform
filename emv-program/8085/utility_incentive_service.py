#!/usr/bin/env python3
"""
Utility Incentive Service for SYNEREX
Provides free incentive/rebate lookup with hybrid approach:
1. Static database (major federal/state programs)
2. Web scraping (utility websites)
3. Energy.gov API (federal programs)
"""

import json
import logging
import os
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

# Load static incentive database
STATIC_INCENTIVES = {}
KNOWLEDGE_BASE_PATH = os.path.join(os.path.dirname(__file__), '..', '8082', 'knowledge_base', 'incentives')

def load_static_incentives():
    """Load static incentive database from JSON file"""
    global STATIC_INCENTIVES
    try:
        incentives_file = os.path.join(KNOWLEDGE_BASE_PATH, 'incentives_database.json')
        if os.path.exists(incentives_file):
            with open(incentives_file, 'r', encoding='utf-8') as f:
                STATIC_INCENTIVES = json.load(f)
            logger.info(f"Loaded {len(STATIC_INCENTIVES.get('federal', []))} federal and {len(STATIC_INCENTIVES.get('state', {}))} state incentive programs")
        else:
            logger.warning(f"Incentives database not found at {incentives_file}, using minimal fallback data")
            STATIC_INCENTIVES = get_fallback_incentives()
    except Exception as e:
        logger.error(f"Error loading incentives database: {e}")
        STATIC_INCENTIVES = get_fallback_incentives()

def get_fallback_incentives():
    """Fallback incentive data if JSON file not available"""
    return {
        "federal": [
            {
                "name": "Residential Clean Energy Credit (ITC)",
                "type": "tax_credit",
                "amount": "30%",
                "description": "30% federal tax credit for solar, wind, geothermal, battery storage, and other clean energy systems",
                "expires": "2032",
                "eligibility": ["residential", "commercial"],
                "equipment": ["solar", "wind", "geothermal", "battery_storage", "fuel_cells"]
            },
            {
                "name": "Energy Efficient Home Improvement Credit",
                "type": "tax_credit",
                "amount": "up to $3,200/year",
                "description": "Tax credit for energy-efficient home improvements including HVAC, insulation, windows, doors",
                "expires": "2032",
                "eligibility": ["residential"],
                "equipment": ["hvac", "insulation", "windows", "doors", "heat_pumps"]
            }
        ],
        "state": {
            "california": [
                {
                    "name": "California Solar Initiative",
                    "type": "rebate",
                    "amount": "Varies by utility",
                    "description": "State-wide solar rebate program",
                    "eligibility": ["residential", "commercial"],
                    "equipment": ["solar"]
                }
            ],
            "texas": [],
            "new_york": [],
            "florida": [],
            "louisiana": []
        }
    }

# Load incentives on startup
load_static_incentives()

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
    
    state_lower = state_input.lower().strip() if state_input else ''
    return state_mapping.get(state_lower, state_lower.replace(' ', '_'))

def scrape_utility_rebates(state, utility_name=None):
    """Scrape utility websites for rebate information"""
    if not BEAUTIFULSOUP_AVAILABLE:
        return []
    
    try:
        state_normalized = normalize_state(state)
        
        # Map major utilities to their rebate pages
        utility_rebate_pages = {
            'california': {
                'pge': 'https://www.pge.com/en/save/rebates-and-incentives',
                'sce': 'https://www.sce.com/residential/rebates-savings',
                'sdge': 'https://www.sdge.com/residential/savings-center/rebates-incentives'
            },
            'texas': {
                'oncor': 'https://www.oncor.com/en-us/Pages/Energy-Efficiency.aspx',
                'centerpoint': 'https://www.centerpointenergy.com/en-us/account/residential/rebates-incentives'
            },
            'new_york': {
                'coned': 'https://www.coned.com/en/save-energy-money/rebates-incentives',
                'nationalgrid': 'https://www.nationalgridus.com/Upstate-NY-Home/Energy-Saving-Programs'
            },
            'florida': {
                'fpl': 'https://www.fpl.com/energy-saving/rebates.html',
                'duke': 'https://www.duke-energy.com/home/products/rebates'
            }
        }
        
        rebates = []
        
        if state_normalized in utility_rebate_pages:
            utilities = utility_rebate_pages[state_normalized]
            
            # If specific utility requested, only scrape that one
            if utility_name:
                utility_key = utility_name.lower().replace(' ', '').replace('&', '')
                if utility_key in utilities:
                    utilities = {utility_key: utilities[utility_key]}
            
            for utility_key, url in utilities.items():
                try:
                    response = requests.get(url, timeout=10, headers={
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    })
                    
                    if response.status_code == 200:
                        soup = BeautifulSoup(response.text, 'html.parser')
                        text = soup.get_text()
                        
                        # Look for rebate patterns
                        rebate_patterns = [
                            r'\$(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:rebate|incentive)',
                            r'(\d+)\s*%?\s*(?:rebate|incentive|credit)',
                            r'up to \$(\d+(?:,\d{3})*(?:\.\d{2})?)',
                        ]
                        
                        # Extract rebate information
                        for pattern in rebate_patterns:
                            matches = re.findall(pattern, text, re.IGNORECASE)
                            if matches:
                                rebates.append({
                                    "utility": utility_key.upper(),
                                    "source": f"scraped_{utility_key}",
                                    "url": url,
                                    "last_updated": datetime.now().isoformat(),
                                    "note": "Scraped from utility website - verify current details"
                                })
                                break
                except Exception as e:
                    logger.debug(f"Failed to scrape {utility_key}: {e}")
                    continue
        
        return rebates
        
    except Exception as e:
        logger.warning(f"Web scraping failed: {e}")
        return []

def get_incentives(location_data, project_data=None):
    """Get all available incentives for a location with multiple fallback strategies"""
    try:
        # Extract location information
        state = None
        city = None
        utility = None
        
        if location_data:
            state = location_data.get('state', '')
            city = location_data.get('city', '')
            utility = location_data.get('utility', '') or location_data.get('utility_company', '')
            
            # Try to extract state from cityState if not directly provided
            if not state and location_data.get('cityState'):
                parts = location_data.get('cityState', '').split(',')
                if len(parts) > 1:
                    state = parts[-1].strip()
                    city = parts[0].strip()
        
        if not state:
            logger.warning("No state information provided")
            return {
                "success": False,
                "error": "Location information required. Please provide state or city/state.",
                "incentives": []
            }
        
        state_normalized = normalize_state(state)
        logger.info(f"Looking up incentives for: {state_normalized} (city: {city}, utility: {utility})")
        
        all_incentives = []
        
        # Strategy 1: Federal programs (always available)
        federal_programs = STATIC_INCENTIVES.get('federal', [])
        for program in federal_programs:
            program_copy = program.copy()
            program_copy['level'] = 'federal'
            program_copy['source'] = 'static_database'
            all_incentives.append(program_copy)
        
        # Strategy 2: State programs (from static database)
        state_programs = STATIC_INCENTIVES.get('state', {}).get(state_normalized, [])
        for program in state_programs:
            program_copy = program.copy()
            program_copy['level'] = 'state'
            program_copy['source'] = 'static_database'
            program_copy['state'] = state_normalized
            all_incentives.append(program_copy)
        
        # Strategy 3: Utility rebates (web scraping)
        utility_rebates = scrape_utility_rebates(state_normalized, utility)
        for rebate in utility_rebates:
            rebate['level'] = 'utility'
            all_incentives.append(rebate)
        
        # Calculate total potential value if project data available
        total_value = None
        if project_data:
            total_value = calculate_incentive_value(all_incentives, project_data)
        
        return {
            "success": True,
            "incentives": all_incentives,
            "location": {"state": state, "city": city, "utility": utility},
            "total_programs": len(all_incentives),
            "total_estimated_value": total_value,
            "sources": {
                "federal": len([i for i in all_incentives if i.get('level') == 'federal']),
                "state": len([i for i in all_incentives if i.get('level') == 'state']),
                "utility": len([i for i in all_incentives if i.get('level') == 'utility'])
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting incentives: {e}")
        return {
            "success": False,
            "error": str(e),
            "incentives": []
        }

def calculate_incentive_value(incentives, project_data):
    """Calculate estimated total incentive value for a project"""
    try:
        total_value = 0
        project_cost = project_data.get('project_cost') or project_data.get('total_cost', 0)
        
        for incentive in incentives:
            amount = incentive.get('amount', '')
            if not amount:
                continue
            
            # Parse percentage-based incentives
            if '%' in str(amount):
                try:
                    percent = float(str(amount).replace('%', '').strip())
                    if project_cost > 0:
                        value = project_cost * (percent / 100)
                        total_value += value
                except ValueError:
                    pass
            
            # Parse dollar amount incentives
            elif '$' in str(amount):
                try:
                    # Extract number from strings like "$5,000" or "up to $3,200/year"
                    amount_str = str(amount).replace('$', '').replace(',', '').replace('up to', '').strip()
                    # Get first number
                    numbers = re.findall(r'\d+(?:\.\d+)?', amount_str)
                    if numbers:
                        value = float(numbers[0])
                        total_value += value
                except ValueError:
                    pass
        
        return round(total_value, 2) if total_value > 0 else None
        
    except Exception as e:
        logger.warning(f"Error calculating incentive value: {e}")
        return None

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "utility_incentive_service",
        "port": 8203,
        "incentives_loaded": len(STATIC_INCENTIVES.get('federal', [])) + sum(len(v) for v in STATIC_INCENTIVES.get('state', {}).values()),
        "timestamp": datetime.now().isoformat()
    })

@app.route('/incentives', methods=['POST'])
def get_incentives_endpoint():
    """Get incentives for a location"""
    try:
        data = request.get_json() or {}
        location_data = data.get('location_data', {})
        project_data = data.get('project_data', {})
        
        result = get_incentives(location_data, project_data)
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in /incentives endpoint: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/incentives/state/<state>', methods=['GET'])
def get_incentives_by_state(state):
    """Get incentives by state (GET endpoint for convenience)"""
    try:
        location_data = {"state": state}
        result = get_incentives(location_data)
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in /incentives/state endpoint: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == '__main__':
    print("Starting Utility Incentive Service on port 8203")
    print("Endpoints:")
    print("  GET  /health")
    print("  POST /incentives")
    print("  GET  /incentives/state/<state>")
    app.run(host='0.0.0.0', port=8203, debug=True)

