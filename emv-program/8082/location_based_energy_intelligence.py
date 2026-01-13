#!/usr/bin/env python3
"""
Location-Based Energy Intelligence for SynerexAI
Uses UI field data (temperature, location) to provide regional energy information
"""

import json
import logging
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class LocationEnergyData:
    """Location-based energy data"""
    location: str
    climate_zone: str
    temperature_range: Tuple[float, float]
    energy_intensity: Dict[str, float]
    utility_rates: Dict[str, Any]
    renewable_percentage: float
    incentives: List[str]
    energy_trends: List[str]

@dataclass
class ProjectContext:
    """Project context from UI fields"""
    location: str
    temperature: float
    facility_type: str
    building_size: float
    energy_usage: float
    utility: str
    climate_zone: str

class LocationBasedEnergyIntelligence:
    """
    Location-Based Energy Intelligence System
    Analyzes project location and provides regional energy insights
    """
    
    def __init__(self):
        self.knowledge_base_path = "knowledge_base/location_energy"
        self.ensure_directories()
        self.climate_zones = self._initialize_climate_zones()
        self.regional_data = self._initialize_regional_data()
    
    def ensure_directories(self):
        """Create necessary directories"""
        os.makedirs(self.knowledge_base_path, exist_ok=True)
        os.makedirs(f"{self.knowledge_base_path}/climate_data", exist_ok=True)
        os.makedirs(f"{self.knowledge_base_path}/utility_rates", exist_ok=True)
        os.makedirs(f"{self.knowledge_base_path}/energy_trends", exist_ok=True)
        os.makedirs(f"{self.knowledge_base_path}/incentives", exist_ok=True)
    
    def _initialize_climate_zones(self) -> Dict[str, Any]:
        """Initialize ASHRAE climate zones with energy characteristics"""
        return {
            "zone_1": {
                "description": "Very Hot, Humid (Florida, Hawaii)",
                "states": ["FL", "HI", "Southern TX", "Southern LA"],
                "temperature_range": (70, 95),
                "heating_days": 0,
                "cooling_days": 300,
                "energy_characteristics": {
                    "primary_concern": "Cooling loads",
                    "energy_intensity": 25,  # kWh/sqft/year
                    "peak_demand": "Summer afternoons",
                    "efficiency_focus": "HVAC optimization, shading"
                }
            },
            "zone_2": {
                "description": "Hot, Humid (Texas, Louisiana)",
                "states": ["TX", "LA", "MS", "AL", "GA", "SC"],
                "temperature_range": (60, 90),
                "heating_days": 50,
                "cooling_days": 250,
                "energy_characteristics": {
                    "primary_concern": "Cooling and humidity",
                    "energy_intensity": 22,
                    "peak_demand": "Summer afternoons",
                    "efficiency_focus": "Dehumidification, ventilation"
                }
            },
            "zone_3": {
                "description": "Hot, Dry (Arizona, Nevada)",
                "states": ["AZ", "NV", "Southern CA", "NM"],
                "temperature_range": (50, 105),
                "heating_days": 100,
                "cooling_days": 200,
                "energy_characteristics": {
                    "primary_concern": "Cooling loads, solar gain",
                    "energy_intensity": 20,
                    "peak_demand": "Summer afternoons",
                    "efficiency_focus": "Solar shading, thermal mass"
                }
            },
            "zone_4": {
                "description": "Mixed, Humid (Georgia, Alabama)",
                "states": ["GA", "AL", "TN", "NC", "SC", "VA"],
                "temperature_range": (40, 85),
                "heating_days": 200,
                "cooling_days": 150,
                "energy_characteristics": {
                    "primary_concern": "Both heating and cooling",
                    "energy_intensity": 18,
                    "peak_demand": "Summer and winter",
                    "efficiency_focus": "Balanced HVAC, insulation"
                }
            },
            "zone_5": {
                "description": "Mixed, Dry (Colorado, Utah)",
                "states": ["CO", "UT", "WY", "MT", "ND", "SD"],
                "temperature_range": (20, 80),
                "heating_days": 300,
                "cooling_days": 100,
                "energy_characteristics": {
                    "primary_concern": "Heating loads",
                    "energy_intensity": 16,
                    "peak_demand": "Winter mornings",
                    "efficiency_focus": "Heating optimization, insulation"
                }
            },
            "zone_6": {
                "description": "Cold, Humid (New York, Pennsylvania)",
                "states": ["NY", "PA", "OH", "MI", "WI", "MN"],
                "temperature_range": (10, 75),
                "heating_days": 400,
                "cooling_days": 50,
                "energy_characteristics": {
                    "primary_concern": "Heating loads, humidity control",
                    "energy_intensity": 14,
                    "peak_demand": "Winter mornings",
                    "efficiency_focus": "Heating systems, air sealing"
                }
            },
            "zone_7": {
                "description": "Cold, Dry (Montana, Wyoming)",
                "states": ["MT", "WY", "ID", "Northern CO"],
                "temperature_range": (-10, 70),
                "heating_days": 500,
                "cooling_days": 25,
                "energy_characteristics": {
                    "primary_concern": "Heating loads",
                    "energy_intensity": 12,
                    "peak_demand": "Winter mornings",
                    "efficiency_focus": "High-efficiency heating, insulation"
                }
            },
            "zone_8": {
                "description": "Very Cold (Alaska, Northern Canada)",
                "states": ["AK", "Northern Canada"],
                "temperature_range": (-30, 60),
                "heating_days": 600,
                "cooling_days": 0,
                "energy_characteristics": {
                    "primary_concern": "Extreme heating loads",
                    "energy_intensity": 10,
                    "peak_demand": "Winter",
                    "efficiency_focus": "Maximum insulation, efficient heating"
                }
            }
        }
    
    def _initialize_regional_data(self) -> Dict[str, Any]:
        """Initialize regional energy data"""
        return {
            "utility_rates": {
                "california": {
                    "peak_rate": 0.45,  # $/kWh
                    "off_peak_rate": 0.25,
                    "demand_charge": 15.50,  # $/kW
                    "time_of_use": True,
                    "renewable_percentage": 60
                },
                "texas": {
                    "peak_rate": 0.12,
                    "off_peak_rate": 0.08,
                    "demand_charge": 8.50,
                    "time_of_use": False,
                    "renewable_percentage": 25
                },
                "new_york": {
                    "peak_rate": 0.35,
                    "off_peak_rate": 0.20,
                    "demand_charge": 12.00,
                    "time_of_use": True,
                    "renewable_percentage": 30
                },
                "florida": {
                    "peak_rate": 0.15,
                    "off_peak_rate": 0.10,
                    "demand_charge": 6.50,
                    "time_of_use": False,
                    "renewable_percentage": 20
                }
            },
            "incentives": {
                "federal": {
                    "solar_tax_credit": 30,
                    "efficiency_tax_credit": 10,
                    "depreciation": "Accelerated"
                },
                "state": {
                    "california": ["SGIP", "Self-Generation Incentive Program", "Rebates up to $1,000/kW"],
                    "texas": ["Property tax exemption", "Sales tax exemption"],
                    "new_york": ["NYSERDA incentives", "Rebates up to $500/kW"],
                    "florida": ["Property tax exemption", "Sales tax exemption"]
                }
            },
            "energy_trends": {
                "renewable_growth": "15% annually",
                "storage_adoption": "25% annually", 
                "efficiency_standards": "Increasing",
                "grid_modernization": "Active"
            }
        }
    
    def analyze_project_location(self, ui_data: Dict[str, Any]) -> ProjectContext:
        """Analyze project location from UI data"""
        location = ui_data.get('location', 'Unknown')
        temperature = ui_data.get('temperature', 70)
        facility_type = ui_data.get('facility_type', 'Commercial')
        building_size = ui_data.get('building_size', 10000)
        energy_usage = ui_data.get('energy_usage', 100000)
        utility = ui_data.get('utility', 'Unknown')
        
        # Determine climate zone based on location
        climate_zone = self._determine_climate_zone(location)
        
        return ProjectContext(
            location=location,
            temperature=temperature,
            facility_type=facility_type,
            building_size=building_size,
            energy_usage=energy_usage,
            utility=utility,
            climate_zone=climate_zone
        )
    
    def _determine_climate_zone(self, location: str) -> str:
        """Determine climate zone based on location"""
        location_lower = location.lower()
        
        # Zone 1: Very Hot, Humid
        if any(state in location_lower for state in ['florida', 'fl', 'hawaii', 'hi', 'miami', 'orlando', 'tampa']):
            return 'zone_1'
        
        # Zone 2: Hot, Humid
        elif any(state in location_lower for state in ['texas', 'tx', 'louisiana', 'la', 'mississippi', 'ms', 'alabama', 'al']):
            return 'zone_2'
        
        # Zone 3: Hot, Dry
        elif any(state in location_lower for state in ['arizona', 'az', 'nevada', 'nv', 'las vegas', 'phoenix', 'tucson']):
            return 'zone_3'
        
        # Zone 4: Mixed, Humid
        elif any(state in location_lower for state in ['georgia', 'ga', 'alabama', 'al', 'tennessee', 'tn', 'north carolina', 'nc']):
            return 'zone_4'
        
        # Zone 5: Mixed, Dry
        elif any(state in location_lower for state in ['colorado', 'co', 'utah', 'ut', 'wyoming', 'wy', 'montana', 'mt']):
            return 'zone_5'
        
        # Zone 6: Cold, Humid
        elif any(state in location_lower for state in ['new york', 'ny', 'pennsylvania', 'pa', 'ohio', 'oh', 'michigan', 'mi']):
            return 'zone_6'
        
        # Zone 7: Cold, Dry
        elif any(state in location_lower for state in ['montana', 'mt', 'wyoming', 'wy', 'idaho', 'id']):
            return 'zone_7'
        
        # Zone 8: Very Cold
        elif any(state in location_lower for state in ['alaska', 'ak', 'canada', 'northern']):
            return 'zone_8'
        
        # Default to Zone 4 (Mixed, Humid)
        else:
            return 'zone_4'
    
    def generate_location_insights(self, project_context: ProjectContext) -> Dict[str, Any]:
        """Generate location-specific energy insights"""
        climate_zone_data = self.climate_zones.get(project_context.climate_zone, {})
        regional_data = self._get_regional_data(project_context.location)
        
        insights = {
            "location_analysis": {
                "location": project_context.location,
                "climate_zone": project_context.climate_zone,
                "zone_description": climate_zone_data.get('description', 'Unknown'),
                "temperature_analysis": self._analyze_temperature(project_context.temperature, climate_zone_data),
                "energy_characteristics": climate_zone_data.get('energy_characteristics', {})
            },
            "regional_energy_data": {
                "utility_rates": regional_data.get('utility_rates', {}),
                "renewable_percentage": regional_data.get('renewable_percentage', 0),
                "incentives": regional_data.get('incentives', []),
                "energy_trends": regional_data.get('energy_trends', [])
            },
            "recommendations": self._generate_recommendations(project_context, climate_zone_data, regional_data),
            "energy_opportunities": self._identify_energy_opportunities(project_context, climate_zone_data)
        }
        
        return insights
    
    def _analyze_temperature(self, temperature: float, climate_zone_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze temperature in context of climate zone"""
        temp_range = climate_zone_data.get('temperature_range', (50, 80))
        min_temp, max_temp = temp_range
        
        return {
            "current_temperature": temperature,
            "climate_zone_range": temp_range,
            "temperature_analysis": {
                "above_normal": temperature > max_temp,
                "below_normal": temperature < min_temp,
                "optimal_range": min_temp <= temperature <= max_temp,
                "cooling_load_impact": max(0, temperature - 75),  # Cooling load above 75°F
                "heating_load_impact": max(0, 65 - temperature)   # Heating load below 65°F
            }
        }
    
    def _get_regional_data(self, location: str) -> Dict[str, Any]:
        """Get regional energy data for location"""
        location_lower = location.lower()
        
        # Determine region based on location
        if any(state in location_lower for state in ['california', 'ca', 'los angeles', 'san francisco', 'san diego']):
            return {
                "utility_rates": self.regional_data["utility_rates"]["california"],
                "renewable_percentage": 60,
                "incentives": self.regional_data["incentives"]["state"]["california"],
                "energy_trends": ["High renewable adoption", "Grid modernization", "Storage growth"]
            }
        elif any(state in location_lower for state in ['texas', 'tx', 'houston', 'dallas', 'austin']):
            return {
                "utility_rates": self.regional_data["utility_rates"]["texas"],
                "renewable_percentage": 25,
                "incentives": self.regional_data["incentives"]["state"]["texas"],
                "energy_trends": ["Wind energy growth", "Grid independence", "Storage adoption"]
            }
        elif any(state in location_lower for state in ['new york', 'ny', 'new york city', 'albany', 'buffalo']):
            return {
                "utility_rates": self.regional_data["utility_rates"]["new_york"],
                "renewable_percentage": 30,
                "incentives": self.regional_data["incentives"]["state"]["new_york"],
                "energy_trends": ["Clean energy goals", "Grid modernization", "Efficiency programs"]
            }
        elif any(state in location_lower for state in ['florida', 'fl', 'miami', 'orlando', 'tampa']):
            return {
                "utility_rates": self.regional_data["utility_rates"]["florida"],
                "renewable_percentage": 20,
                "incentives": self.regional_data["incentives"]["state"]["florida"],
                "energy_trends": ["Solar growth", "Hurricane resilience", "Grid hardening"]
            }
        else:
            # Default regional data
            return {
                "utility_rates": {"peak_rate": 0.20, "off_peak_rate": 0.12, "demand_charge": 10.00},
                "renewable_percentage": 25,
                "incentives": ["Federal tax credits", "State rebates"],
                "energy_trends": ["Renewable growth", "Efficiency improvements"]
            }
    
    def _generate_recommendations(self, project_context: ProjectContext, 
                                climate_zone_data: Dict[str, Any], 
                                regional_data: Dict[str, Any]) -> List[str]:
        """Generate location-specific recommendations"""
        recommendations = []
        
        # Climate-based recommendations
        energy_characteristics = climate_zone_data.get('energy_characteristics', {})
        primary_concern = energy_characteristics.get('primary_concern', 'General efficiency')
        
        if 'cooling' in primary_concern.lower():
            recommendations.extend([
                "Optimize HVAC systems for cooling efficiency",
                "Consider solar shading and thermal mass",
                "Implement demand response for peak cooling",
                "Evaluate chiller efficiency and controls"
            ])
        
        if 'heating' in primary_concern.lower():
            recommendations.extend([
                "Optimize heating systems for efficiency",
                "Improve building insulation and air sealing",
                "Consider heat recovery systems",
                "Evaluate boiler efficiency and controls"
            ])
        
        # Temperature-based recommendations
        if project_context.temperature > 80:
            recommendations.extend([
                "High cooling load detected - focus on HVAC optimization",
                "Consider thermal storage systems",
                "Evaluate building envelope improvements"
            ])
        elif project_context.temperature < 50:
            recommendations.extend([
                "High heating load detected - focus on heating optimization",
                "Consider heat recovery and cogeneration",
                "Evaluate building insulation upgrades"
            ])
        
        # Regional recommendations
        if regional_data.get('renewable_percentage', 0) > 30:
            recommendations.extend([
                "High renewable energy availability - consider grid-tied systems",
                "Evaluate time-of-use rate optimization",
                "Consider energy storage for grid services"
            ])
        
        return recommendations
    
    def _identify_energy_opportunities(self, project_context: ProjectContext, 
                                     climate_zone_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Identify energy opportunities based on location and context"""
        opportunities = []
        
        # Temperature-based opportunities
        if project_context.temperature > 75:
            opportunities.append({
                "type": "Cooling Optimization",
                "description": "High cooling load presents efficiency opportunities",
                "potential_savings": "15-25%",
                "technologies": ["High-efficiency chillers", "Thermal storage", "Demand response"]
            })
        
        if project_context.temperature < 60:
            opportunities.append({
                "type": "Heating Optimization", 
                "description": "High heating load presents efficiency opportunities",
                "potential_savings": "20-30%",
                "technologies": ["High-efficiency boilers", "Heat recovery", "Cogeneration"]
            })
        
        # Climate zone opportunities
        energy_characteristics = climate_zone_data.get('energy_characteristics', {})
        efficiency_focus = energy_characteristics.get('efficiency_focus', 'General efficiency')
        
        if 'HVAC' in efficiency_focus:
            opportunities.append({
                "type": "HVAC Optimization",
                "description": "Climate zone favors HVAC efficiency improvements",
                "potential_savings": "10-20%",
                "technologies": ["Variable speed drives", "Smart controls", "Energy recovery"]
            })
        
        if 'insulation' in efficiency_focus:
            opportunities.append({
                "type": "Building Envelope",
                "description": "Climate zone favors building envelope improvements",
                "potential_savings": "5-15%",
                "technologies": ["Insulation upgrades", "Air sealing", "High-performance windows"]
            })
        
        return opportunities
    
    def save_location_insights(self, insights: Dict[str, Any], project_context: ProjectContext):
        """Save location insights to knowledge base"""
        
        # Save location analysis
        location_file = f"{self.knowledge_base_path}/climate_data/{project_context.location.replace(' ', '_')}_analysis.json"
        with open(location_file, "w") as f:
            json.dump(insights, f, indent=2)
        
        # Update knowledge base index
        index_file = f"{self.knowledge_base_path}/location_energy_index.json"
        index_data = {
            "last_updated": datetime.now().isoformat(),
            "locations_analyzed": [project_context.location],
            "climate_zones": [project_context.climate_zone],
            "total_insights": 1
        }
        
        if os.path.exists(index_file):
            with open(index_file, "r") as f:
                existing_data = json.load(f)
                index_data["locations_analyzed"] = list(set(existing_data.get("locations_analyzed", []) + [project_context.location]))
                index_data["total_insights"] = existing_data.get("total_insights", 0) + 1
        
        with open(index_file, "w") as f:
            json.dump(index_data, f, indent=2)
        
        logger.info(f"Saved location insights for {project_context.location}")
    
    def generate_synerex_ai_response(self, ui_data: Dict[str, Any]) -> str:
        """Generate SynerexAI response based on location and temperature analysis"""
        
        # Analyze project location
        project_context = self.analyze_project_location(ui_data)
        
        # Generate insights
        insights = self.generate_location_insights(project_context)
        
        # Save insights
        self.save_location_insights(insights, project_context)
        
        # Generate response
        response = f"Location-Based Energy Analysis for {project_context.location}\\n\\n"
        
        # Location analysis
        location_analysis = insights["location_analysis"]
        response += f"Climate Zone: {location_analysis['climate_zone']} - {location_analysis['zone_description']}\\n"
        response += f"Current Temperature: {project_context.temperature}°F\\n\\n"
        
        # Temperature analysis
        temp_analysis = location_analysis["temperature_analysis"]
        if temp_analysis.get("above_normal", False):
            response += "Above normal temperature - High cooling load expected\\n"
        elif temp_analysis.get("below_normal", False):
            response += "Below normal temperature - High heating load expected\\n"
        else:
            response += "Temperature within normal range\\n"
        
        response += f"Cooling Load Impact: {temp_analysis.get('cooling_load_impact', 0):.1f}°F above 75°F\\n"
        response += f"Heating Load Impact: {temp_analysis.get('heating_load_impact', 0):.1f}°F below 65°F\\n\\n"
        
        # Energy characteristics
        energy_chars = location_analysis["energy_characteristics"]
        response += f"Primary Energy Concern: {energy_chars.get('primary_concern', 'General efficiency')}\\n"
        response += f"Typical Energy Intensity: {energy_chars.get('energy_intensity', 'Unknown')} kWh/sqft/year\\n"
        response += f"Peak Demand Period: {energy_chars.get('peak_demand', 'Unknown')}\\n\\n"
        
        # Regional data
        regional_data = insights["regional_energy_data"]
        response += f"Regional Renewable Energy: {regional_data.get('renewable_percentage', 0)}%\\n"
        response += f"Utility Peak Rate: ${regional_data.get('utility_rates', {}).get('peak_rate', 0):.2f}/kWh\\n"
        response += f"Demand Charge: ${regional_data.get('utility_rates', {}).get('demand_charge', 0):.2f}/kW\\n\\n"
        
        # Recommendations
        response += "Recommendations:\\n"
        for i, rec in enumerate(insights["recommendations"][:5], 1):
            response += f"{i}. {rec}\\n"
        
        response += "\\nEnergy Opportunities:\\n"
        for i, opp in enumerate(insights["energy_opportunities"][:3], 1):
            response += f"{i}. {opp['type']}: {opp['description']} (Potential savings: {opp['potential_savings']})\\n"
        
        return response

def main():
    """Main function to demonstrate location-based energy intelligence"""
    print("=== Location-Based Energy Intelligence for SynerexAI ===")
    print("Analyzing project location and temperature for regional energy insights")
    print()
    
    # Create intelligence system
    intelligence = LocationBasedEnergyIntelligence()
    
    # Example UI data from different locations
    example_projects = [
        {
            "location": "Miami, Florida",
            "temperature": 85,
            "facility_type": "Commercial",
            "building_size": 50000,
            "energy_usage": 500000,
            "utility": "FPL"
        },
        {
            "location": "Denver, Colorado", 
            "temperature": 45,
            "facility_type": "Industrial",
            "building_size": 100000,
            "energy_usage": 1000000,
            "utility": "Xcel Energy"
        },
        {
            "location": "Los Angeles, California",
            "temperature": 75,
            "facility_type": "Office",
            "building_size": 25000,
            "energy_usage": 250000,
            "utility": "LADWP"
        }
    ]
    
    for i, project_data in enumerate(example_projects, 1):
        print(f"PROJECT {i}: {project_data['location']}")
        print("=" * 50)
        
        # Generate SynerexAI response
        response = intelligence.generate_synerex_ai_response(project_data)
        print(response)
        print()
    
    print("=== Analysis Complete ===")
    print("Location-based energy intelligence provides regional insights for SynerexAI!")

if __name__ == "__main__":
    main()
