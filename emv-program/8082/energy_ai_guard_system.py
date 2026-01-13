"""
SynerexAI Energy Domain Guard System
Ensures SynerexAI only operates within energy-related domains
"""

import re
import logging
from typing import Dict, List, Tuple, Any
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class DomainValidationResult:
    """Result of domain validation"""
    is_valid: bool
    confidence_score: float
    reason: str
    suggested_energy_topic: str = ""

class EnergyDomainGuard:
    """
    Energy Domain Guard System
    Ensures SynerexAI only processes energy-related requests
    """
    
    def __init__(self):
        # Energy-related keywords and phrases
        self.energy_keywords = {
            'power_systems': [
                'power', 'electrical', 'voltage', 'current', 'watt', 'kilowatt', 'kw', 'kwh',
                'power factor', 'power quality', 'harmonic', 'distortion', 'frequency', 'hz',
                'grid', 'transmission', 'distribution', 'substation', 'transformer'
            ],
            'energy_efficiency': [
                'energy', 'efficiency', 'consumption', 'savings', 'conservation', 'optimization',
                'baseline', 'weather normalization', 'energy modeling', 'load profile',
                'demand response', 'peak shaving', 'load shifting'
            ],
            'cost_analysis': [
                'cost', 'roi', 'payback', 'npv', 'irr', 'sir', 'lcca', 'life cycle cost',
                'utility rate', 'tariff', 'billing', 'demand charge', 'energy charge',
                'incentive', 'rebate', 'financing', 'investment'
            ],
            'equipment_analysis': [
                'motor', 'pump', 'fan', 'compressor', 'chiller', 'boiler', 'hvac',
                'lighting', 'led', 'ballast', 'driver', 'vfd', 'variable frequency',
                'efficiency', 'performance', 'degradation', 'maintenance'
            ],
            'renewable_energy': [
                'solar', 'photovoltaic', 'pv', 'wind', 'turbine', 'battery', 'storage',
                'renewable', 'clean energy', 'carbon', 'emissions', 'sustainability',
                'net zero', 'green energy', 'clean tech'
            ],
            'standards_compliance': [
                'ieee', 'ashrae', 'nema', 'iec', 'ansi', 'ul', 'ce', 'iso',
                'compliance', 'standard', 'regulation', 'code', 'specification',
                'audit', 'certification', 'validation', 'verification'
            ],
            'building_systems': [
                'building', 'facility', 'hvac', 'lighting', 'plumbing', 'mechanical',
                'electrical', 'controls', 'bms', 'building management', 'automation',
                'occupancy', 'scheduling', 'setpoint', 'temperature', 'humidity'
            ],
            'utility_information': [
                'utility', 'electric company', 'power company', 'electricity provider',
                'rate schedule', 'tariff', 'rate structure', 'time of use', 'tou',
                'demand rate', 'energy rate', 'connection fee', 'service charge',
                'utility bill', 'electricity bill', 'power bill', 'billing cycle'
            ],
            'location_energy_data': [
                'location', 'address', 'zip code', 'city', 'state', 'region',
                'local utility', 'area utility', 'regional rates', 'local rates',
                'weather data', 'climate data', 'temperature', 'humidity',
                'energy prices', 'electricity prices', 'local incentives', 'rebates'
            ],
        'xeco_equipment': [
            'xeco', 'xeco equipment', 'xeco installation', 'xeco setup',
            'xeco configuration', 'xeco programming', 'xeco maintenance',
            'xeco troubleshooting', 'xeco support', 'xeco training',
            'xeco documentation', 'xeco manual', 'xeco specifications',
            'xeco products', 'xeco catalog', 'xeco models', 'xeco series',
            'xeco power quality', 'xeco harmonic filters', 'xeco capacitors',
            'xeco reactors', 'xeco transformers', 'xeco switchgear',
            'xeco meters', 'xeco monitoring', 'xeco control systems',
            'xeco energy management', 'xeco power factor correction',
            'xeco voltage regulation', 'xeco load management',
            'xeco installation guide', 'xeco wiring diagrams',
            'xeco mounting requirements', 'xeco clearance requirements',
            'xeco electrical connections', 'xeco grounding requirements',
            'xeco commissioning', 'xeco testing procedures',
            'xeco maintenance schedules', 'xeco replacement parts',
            'xeco technical support', 'xeco warranty information'
        ],
        'synerex_program_usage': [
            'synerex', 'synerex program', 'synerex system', 'synerex software',
            'how to use synerex', 'synerex tutorial', 'synerex guide',
            'synerex help', 'synerex support', 'synerex documentation',
            'synerex user guide', 'synerex manual', 'synerex instructions',
            'synerex dashboard', 'synerex interface', 'synerex navigation',
            'synerex features', 'synerex functions', 'synerex capabilities',
            'synerex analysis', 'synerex reports', 'synerex data',
            'synerex csv', 'synerex files', 'synerex upload',
            'synerex projects', 'synerex management', 'synerex workflow',
            'synerex authentication', 'synerex login', 'synerex users',
            'synerex admin', 'synerex settings', 'synerex configuration',
            'synerex troubleshooting', 'synerex errors', 'synerex issues',
            'synerex maintenance', 'synerex updates', 'synerex installation',
            'synerex setup', 'synerex deployment', 'synerex security',
            'synerex compliance', 'synerex audit', 'synerex standards',
            'synerex ieee', 'synerex ashrae', 'synerex nec', 'synerex codes',
            'synerex calculations', 'synerex formulas', 'synerex methods',
            'synerex algorithms', 'synerex processing', 'synerex analysis',
            'synerex results', 'synerex output', 'synerex reports',
            'synerex html', 'synerex pdf', 'synerex excel', 'synerex export',
            'synerex import', 'synerex data flow', 'synerex workflow',
            'synerex step by step', 'synerex walkthrough', 'synerex demo',
            'synerex training', 'synerex learning', 'synerex education'
        ],
            'electrical_code': [
                'electrical code', 'nec', 'national electrical code', 'electrical installation',
                'wiring', 'conduit', 'grounding', 'bonding', 'electrical safety',
                'electrical permit', 'electrical inspection', 'electrical contractor',
                'electrical work', 'electrical system', 'electrical design',
                'electrical planning', 'electrical layout', 'electrical schematics'
            ],
            'installation_assistance': [
                'installation', 'install', 'setup', 'configuration', 'mounting',
                'wiring', 'connections', 'commissioning', 'startup', 'testing',
                'calibration', 'troubleshooting', 'maintenance', 'repair',
                'installation guide', 'installation manual', 'installation steps',
                'installation requirements', 'installation specifications'
            ]
        }
        
        # Non-energy keywords that should be blocked
        self.non_energy_keywords = {
            'healthcare': ['medical', 'health', 'doctor', 'patient', 'hospital', 'clinic', 'diagnosis'],
            'finance': ['banking', 'investment', 'stock', 'market', 'trading', 'portfolio', 'insurance'],
            'entertainment': ['movie', 'film', 'game', 'music', 'sport', 'entertainment', 'fun'],
            'personal': ['relationship', 'dating', 'marriage', 'family', 'personal', 'lifestyle'],
            'other_industries': ['retail', 'shopping', 'restaurant', 'travel', 'tourism', 'education'],
            'general_ai': ['general', 'anything', 'everything', 'help with', 'assist with']
        }
        
        # Energy-specific phrases and contexts
        self.energy_contexts = [
            'energy analysis', 'power analysis', 'electrical system', 'energy efficiency',
            'cost savings', 'energy consumption', 'power quality', 'harmonic analysis',
            'motor efficiency', 'hvac optimization', 'lighting efficiency', 'renewable energy',
            'energy management', 'utility analysis', 'demand response', 'load analysis',
            'utility information', 'tariff analysis', 'rate structure', 'utility rates',
            'location energy data', 'local utility', 'regional rates', 'weather data',
            'xeco equipment', 'xeco installation', 'xeco setup', 'xeco configuration',
            'electrical code', 'nec compliance', 'electrical installation', 'wiring',
            'installation assistance', 'equipment installation', 'electrical work',
            'utility bill analysis', 'energy pricing', 'local incentives', 'rebates',
            'synerex program', 'synerex usage', 'synerex help', 'synerex tutorial',
            'synerex dashboard', 'synerex features', 'synerex navigation', 'synerex support'
        ]
    
    def validate_input(self, user_input: str) -> DomainValidationResult:
        """
        Validate if user input is energy-related
        Returns DomainValidationResult with validation status and details
        """
        try:
            input_lower = user_input.lower().strip()
            
            # Check for empty or very short inputs
            if len(input_lower) < 3:
                return DomainValidationResult(
                    is_valid=False,
                    confidence_score=0.0,
                    reason="Input too short to determine energy relevance",
                    suggested_energy_topic="Please provide more details about your energy analysis needs"
                )
            
            # Check for non-energy keywords first (higher priority)
            non_energy_score = self._calculate_non_energy_score(input_lower)
            if non_energy_score > 0.3:  # Threshold for blocking
                return DomainValidationResult(
                    is_valid=False,
                    confidence_score=non_energy_score,
                    reason=f"Input contains non-energy topics. SynerexAI is specialized for energy analysis only.",
                    suggested_energy_topic="Please ask about energy efficiency, power analysis, cost savings, or electrical systems"
                )
            
            # Calculate energy relevance score
            energy_score = self._calculate_energy_score(input_lower)
            context_score = self._calculate_context_score(input_lower)
            
            # Combined confidence score
            total_score = (energy_score * 0.7) + (context_score * 0.3)
            
            if total_score >= 0.5:  # Energy relevance threshold
                return DomainValidationResult(
                    is_valid=True,
                    confidence_score=total_score,
                    reason="Input validated for energy domain",
                    suggested_energy_topic=""
                )
            else:
                return DomainValidationResult(
                    is_valid=False,
                    confidence_score=total_score,
                    reason="Input does not appear to be energy-related",
                    suggested_energy_topic="Please ask about energy efficiency, power analysis, electrical systems, or cost savings"
                )
                
        except Exception as e:
            logger.error(f"Error in domain validation: {e}")
            return DomainValidationResult(
                is_valid=False,
                confidence_score=0.0,
                reason="Error in domain validation",
                suggested_energy_topic="Please try again with an energy-related question"
            )
    
    def _calculate_non_energy_score(self, input_text: str) -> float:
        """Calculate score for non-energy keywords"""
        total_matches = 0
        total_keywords = 0
        
        for category, keywords in self.non_energy_keywords.items():
            for keyword in keywords:
                total_keywords += 1
                if keyword in input_text:
                    total_matches += 1
        
        return total_matches / total_keywords if total_keywords > 0 else 0.0
    
    def _calculate_energy_score(self, input_text: str) -> float:
        """Calculate score for energy keywords"""
        total_matches = 0
        total_keywords = 0
        
        for category, keywords in self.energy_keywords.items():
            for keyword in keywords:
                total_keywords += 1
                if keyword in input_text:
                    total_matches += 1
        
        return total_matches / total_keywords if total_keywords > 0 else 0.0
    
    def _calculate_context_score(self, input_text: str) -> float:
        """Calculate score for energy context"""
        context_matches = 0
        for context in self.energy_contexts:
            if context in input_text:
                context_matches += 1
        
        return context_matches / len(self.energy_contexts)
    
    def get_energy_suggestions(self, invalid_input: str) -> List[str]:
        """Get energy-related suggestions for non-energy inputs"""
        suggestions = [
            "Analyze the energy efficiency of this building",
            "Calculate the ROI for this energy project",
            "Assess the power quality of this electrical system",
            "Evaluate the energy consumption of this equipment",
            "Optimize the HVAC system for energy savings",
            "Analyze the lighting efficiency of this facility",
            "Calculate the payback period for this energy upgrade",
            "Assess compliance with IEEE 519 standards",
            "Evaluate the motor efficiency of this system",
            "Analyze the renewable energy potential of this site",
            "Get utility rate information for this location",
            "Analyze the tariff structure for this utility",
            "Provide XECO equipment installation guidance",
            "Assist with electrical code compliance",
            "Help with electrical installation planning",
            "Provide location-specific energy data",
            "Analyze utility bill and rate optimization",
            "Guide XECO equipment configuration",
            "Assist with electrical permit requirements",
            "Provide electrical safety guidance",
            "How do I use the SYNEREX dashboard?",
            "Help me navigate the SYNEREX program",
            "How do I upload CSV files in SYNEREX?",
            "How do I create a new project in SYNEREX?",
            "How do I generate reports in SYNEREX?",
            "How do I access the admin panel in SYNEREX?",
            "How do I troubleshoot SYNEREX issues?",
            "How do I configure SYNEREX settings?",
            "How do I use SYNEREX analysis features?"
        ]
        return suggestions[:10]  # Return top 10 suggestions
    
    def filter_response(self, ai_response: str) -> str:
        """Filter AI response to ensure energy focus"""
        try:
            # Check if response contains energy-related content
            energy_indicators = [
                'energy', 'power', 'electrical', 'efficiency', 'savings', 'cost',
                'voltage', 'current', 'watt', 'kwh', 'ieee', 'ashrae', 'nema',
                'motor', 'hvac', 'lighting', 'renewable', 'solar', 'wind'
            ]
            
            response_lower = ai_response.lower()
            has_energy_content = any(indicator in response_lower for indicator in energy_indicators)
            
            if not has_energy_content:
                return ("I apologize, but SynerexAI is specialized for energy analysis only. "
                       "Please ask about energy-related topics such as power analysis, "
                       "energy efficiency, electrical systems, or cost savings.")
            
            return ai_response
            
        except Exception as e:
            logger.error(f"Error filtering response: {e}")
            return ai_response
    
    def get_domain_status(self) -> Dict[str, Any]:
        """Get current domain guard status"""
        return {
            'energy_keywords_count': sum(len(keywords) for keywords in self.energy_keywords.values()),
            'non_energy_keywords_count': sum(len(keywords) for keywords in self.non_energy_keywords.values()),
            'energy_contexts_count': len(self.energy_contexts),
            'guard_active': True,
            'version': '1.0.0'
        }

# Global instance
energy_guard = EnergyDomainGuard()

def validate_energy_domain(user_input: str) -> DomainValidationResult:
    """Convenience function for domain validation"""
    return energy_guard.validate_input(user_input)

def filter_energy_response(ai_response: str) -> str:
    """Convenience function for response filtering"""
    return energy_guard.filter_response(ai_response)

def get_energy_suggestions(invalid_input: str) -> List[str]:
    """Convenience function for energy suggestions"""
    return energy_guard.get_energy_suggestions(invalid_input)
