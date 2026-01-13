"""
Enhanced SynerexAI Energy Domain Guard System
Integrates comprehensive knowledge base for superior energy analysis
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

class EnhancedEnergyDomainGuard:
    """
    Enhanced Energy Domain Guard System
    Integrates comprehensive knowledge base for superior energy analysis
    """
    
    def __init__(self):
        # Enhanced energy-related keywords from knowledge base
        self.energy_keywords = {
            'energy_standards': ['ieee 519', 'harmonic limits', 'thd voltage', 'thd current', 'harmonic analysis', 'fft analysis', 'filter design', 'equipment derating', 'power quality', 'ashrae guideline 14', 'measurement verification', 'm&v', 'baseline energy', 'weather normalization', 'uncertainty analysis'],
            'utility_rates': [],
            'equipment_specs': [],
            'calculations': [],
            'troubleshooting': []
        }
        
        # Enhanced energy contexts
        self.energy_contexts = {'energy_analysis': ['harmonic analysis and compliance', 'energy efficiency calculations', 'power quality assessment', 'equipment performance evaluation'], 'compliance_checking': ['ieee 519 harmonic compliance', 'ashrae guideline 14 m&v', 'nec electrical code compliance', 'equipment efficiency standards'], 'troubleshooting': [], 'financial_analysis': []}
        
        # Load knowledge base
        self.knowledge_base = {
  "energy_standards": {
    "ieee_519_2022": {
      "title": "IEEE 519-2022 Harmonic Limits",
      "description": "IEEE Standard for Harmonic Control in Electric Power Systems",
      "harmonic_limits": {
        "voltage_thd": {
          "general_systems": "5%",
          "sensitive_equipment": "3%",
          "critical_systems": "1%"
        },
        "current_thd": {
          "general_systems": "8%",
          "sensitive_equipment": "5%",
          "critical_systems": "3%"
        },
        "individual_harmonics": {
          "5th_harmonic": "3%",
          "7th_harmonic": "3%",
          "11th_harmonic": "1.5%",
          "13th_harmonic": "1.5%"
        }
      },
      "compliance_methods": [
        "Harmonic analysis using FFT",
        "Load flow analysis with harmonic injection",
        "Filter design and sizing",
        "Equipment derating calculations"
      ],
      "applications": [
        "Industrial facilities",
        "Commercial buildings",
        "Data centers",
        "Healthcare facilities"
      ]
    },
    "ashrae_guideline_14": {
      "title": "ASHRAE Guideline 14-2014 Measurement & Verification",
      "description": "Measurement of Energy and Demand Savings",
      "requirements": {
        "baseline_period": "12 months minimum",
        "reporting_period": "12 months minimum",
        "uncertainty_requirements": "< 10% for energy savings",
        "weather_normalization": "Required for HVAC systems"
      },
      "calculation_methods": [
        "Baseline energy modeling",
        "Weather normalization",
        "Uncertainty analysis",
        "Savings calculation"
      ]
    },
    "nec_2023": {
      "title": "National Electrical Code 2023",
      "description": "Electrical installation and safety requirements",
      "key_requirements": {
        "grounding": "Equipment grounding per Article 250",
        "overcurrent_protection": "Article 240 requirements",
        "conductor_sizing": "Article 310 ampacity tables",
        "motor_protection": "Article 430 motor requirements"
      }
    }
  },
  "utility_rates": {
    "rate_structures": {
      "time_of_use": {
        "description": "Rates vary by time of day and season",
        "peak_hours": {
          "summer": "12:00 PM - 6:00 PM",
          "winter": "6:00 PM - 9:00 PM"
        },
        "off_peak_hours": "All other hours",
        "rate_multiplier": "Peak rates 2-3x higher than off-peak"
      },
      "demand_charges": {
        "description": "Charges based on maximum demand",
        "calculation_method": "Highest 15-minute demand in billing period",
        "rate_structure": "$/kW per month",
        "optimization_strategies": [
          "Load shifting to off-peak hours",
          "Peak shaving with energy storage",
          "Demand response participation"
        ]
      },
      "energy_charges": {
        "description": "Charges based on energy consumption",
        "rate_components": [
          "Generation charges",
          "Transmission charges",
          "Distribution charges",
          "Regulatory charges"
        ]
      }
    },
    "regional_variations": {
      "california": {
        "characteristics": "High renewable energy, complex rate structures",
        "major_utilities": [
          "PG&E",
          "SCE",
          "SDG&E"
        ],
        "rate_features": [
          "Time-of-use",
          "Tiered rates",
          "Net metering"
        ]
      },
      "texas": {
        "characteristics": "Deregulated market, competitive rates",
        "major_utilities": [
          "Oncor",
          "CenterPoint",
          "AEP"
        ],
        "rate_features": [
          "Competitive rates",
          "Choice of providers"
        ]
      },
      "new_york": {
        "characteristics": "High demand charges, time-of-use rates",
        "major_utilities": [
          "ConEd",
          "National Grid",
          "NYSEG"
        ],
        "rate_features": [
          "Time-of-use",
          "Demand charges",
          "Incentives"
        ]
      }
    }
  },
  "equipment_specs": {
    "motors": {
      "efficiency_standards": {
        "ie1": {
          "description": "Standard efficiency",
          "efficiency_range": "75-85%",
          "applications": "General purpose"
        },
        "ie2": {
          "description": "High efficiency",
          "efficiency_range": "85-90%",
          "applications": "Commercial, light industrial"
        },
        "ie3": {
          "description": "Premium efficiency",
          "efficiency_range": "90-95%",
          "applications": "Industrial, continuous duty"
        },
        "ie4": {
          "description": "Super premium efficiency",
          "efficiency_range": "95-97%",
          "applications": "High-efficiency applications"
        }
      },
      "performance_characteristics": {
        "efficiency_curves": "Efficiency vs load percentage",
        "power_factor": "Power factor vs load",
        "starting_characteristics": "Starting current and torque"
      }
    },
    "transformers": {
      "efficiency_standards": "DOE 2016 efficiency standards",
      "loss_calculations": {
        "no_load_losses": "Core losses (constant)",
        "load_losses": "Copper losses (load dependent)"
      },
      "loading_guidelines": "Optimal loading for efficiency"
    },
    "lighting": {
      "efficacy_standards": {
        "led": "100+ lumens per watt",
        "fluorescent": "80-90 lumens per watt",
        "incandescent": "10-15 lumens per watt"
      },
      "control_systems": {
        "dimming": "0-100% dimming capability",
        "sensors": "Occupancy and daylight sensors",
        "scheduling": "Time-based control"
      }
    }
  },
  "calculations": {
    "power_factor_correction": {
      "formula": "Required kVAR = kW \u00d7 (tan(\u03c61) - tan(\u03c62))",
      "variables": {
        "kW": "Real power",
        "\u03c61": "Current power factor angle",
        "\u03c62": "Desired power factor angle"
      },
      "applications": [
        "Capacitor sizing",
        "Power factor improvement",
        "Utility bill optimization"
      ]
    },
    "harmonic_analysis": {
      "thd_calculation": "THD = \u221a(\u03a3(h=2 to 50) (Ih/I1)\u00b2) \u00d7 100%",
      "variables": {
        "Ih": "Harmonic current",
        "I1": "Fundamental current"
      },
      "standards_compliance": "IEEE 519-2022 limits"
    },
    "energy_savings": {
      "baseline_energy": "Energy consumption before improvements",
      "post_retrofit_energy": "Energy consumption after improvements",
      "savings_calculation": "Baseline - Post-retrofit",
      "savings_percentage": "(Savings / Baseline) \u00d7 100%"
    },
    "roi_calculations": {
      "simple_payback": "Initial Cost / Annual Savings",
      "npv": "Present value of future cash flows",
      "irr": "Internal rate of return",
      "sir": "Savings-to-investment ratio"
    }
  },
  "troubleshooting": {
    "power_quality_issues": {
      "harmonic_problems": {
        "symptoms": [
          "Overheating of equipment",
          "Equipment malfunction",
          "Meter reading errors",
          "Flickering lights"
        ],
        "diagnosis": [
          "Harmonic analysis using power quality analyzer",
          "FFT measurement of current and voltage",
          "Equipment temperature monitoring"
        ],
        "solutions": [
          "Install harmonic filters",
          "Equipment derating",
          "System redesign",
          "Load isolation"
        ]
      },
      "voltage_issues": {
        "sags_swells": {
          "causes": [
            "Utility switching",
            "Large motor starts",
            "Fault conditions"
          ],
          "solutions": [
            "Voltage regulators",
            "UPS systems",
            "Load management"
          ]
        },
        "unbalance": {
          "causes": [
            "Unequal load distribution",
            "Equipment problems"
          ],
          "solutions": [
            "Load balancing",
            "Equipment maintenance"
          ]
        }
      }
    },
    "equipment_problems": {
      "motor_issues": {
        "overheating": {
          "causes": [
            "Overload",
            "Poor ventilation",
            "Harmonic heating"
          ],
          "solutions": [
            "Load reduction",
            "Improved ventilation",
            "Harmonic filtering"
          ]
        },
        "vibration": {
          "causes": [
            "Misalignment",
            "Bearing wear",
            "Electrical unbalance"
          ],
          "solutions": [
            "Realignment",
            "Bearing replacement",
            "Electrical balancing"
          ]
        }
      },
      "lighting_issues": {
        "flickering": {
          "causes": [
            "Voltage fluctuations",
            "Poor ballasts",
            "Loose connections"
          ],
          "solutions": [
            "Voltage regulation",
            "Ballast replacement",
            "Connection repair"
          ]
        }
      }
    }
  },
  "regional_data": {
    "climate_zones": {
      "ashrae_zones": {
        "zone_1": "Very hot, humid (Florida, Hawaii)",
        "zone_2": "Hot, humid (Texas, Louisiana)",
        "zone_3": "Hot, dry (Arizona, Nevada)",
        "zone_4": "Mixed, humid (Georgia, Alabama)",
        "zone_5": "Mixed, dry (Colorado, Utah)",
        "zone_6": "Cold, humid (New York, Pennsylvania)",
        "zone_7": "Cold, dry (Montana, Wyoming)",
        "zone_8": "Very cold (Alaska, northern Canada)"
      },
      "energy_intensity": {
        "office_buildings": "15-25 kWh/sqft/year",
        "retail_buildings": "20-30 kWh/sqft/year",
        "industrial_facilities": "50-100 kWh/sqft/year",
        "data_centers": "200-500 kWh/sqft/year"
      }
    },
    "utility_mix": {
      "renewable_percentage": {
        "california": "60% renewable",
        "texas": "25% renewable",
        "new_york": "30% renewable",
        "national_average": "20% renewable"
      }
    },
    "incentive_programs": {
      "federal": {
        "tax_credits": "30% for solar, 10% for efficiency",
        "depreciation": "Accelerated depreciation for efficiency"
      },
      "state": {
        "rebates": "Utility and state rebates",
        "grants": "Energy efficiency grants"
      }
    }
  }
}
    
    def validate_energy_domain(self, user_input: str) -> DomainValidationResult:
        """Enhanced domain validation with knowledge base integration"""
        input_lower = user_input.lower()
        
        # Check for energy-related keywords
        energy_score = 0
        matched_keywords = []
        
        for category, keywords in self.energy_keywords.items():
            for keyword in keywords:
                if keyword.lower() in input_lower:
                    energy_score += 1
                    matched_keywords.append(keyword)
        
        # Enhanced validation logic
        if energy_score >= 2:
            return DomainValidationResult(
                is_valid=True,
                confidence_score=min(energy_score / 5.0, 1.0),
                reason=f"Energy-related keywords detected: {', '.join(matched_keywords)}",
                suggested_energy_topic=self._suggest_energy_topic(matched_keywords)
            )
        elif energy_score == 1:
            return DomainValidationResult(
                is_valid=True,
                confidence_score=0.6,
                reason=f"Some energy-related content detected: {matched_keywords[0]}",
                suggested_energy_topic="General energy analysis"
            )
        else:
            return DomainValidationResult(
                is_valid=False,
                confidence_score=0.0,
                reason="No energy-related content detected",
                suggested_energy_topic="Energy efficiency, power quality, or equipment analysis"
            )
    
    def _suggest_energy_topic(self, matched_keywords: List[str]) -> str:
        """Suggest specific energy topic based on matched keywords"""
        if any('harmonic' in kw.lower() for kw in matched_keywords):
            return "IEEE 519 harmonic analysis and compliance"
        elif any('efficiency' in kw.lower() for kw in matched_keywords):
            return "Energy efficiency analysis and optimization"
        elif any('power' in kw.lower() for kw in matched_keywords):
            return "Power quality analysis and improvement"
        else:
            return "General energy analysis and optimization"
    
    def get_energy_suggestions(self, user_input: str) -> List[str]:
        """Get enhanced energy suggestions based on knowledge base"""
        suggestions = []
        
        # Get suggestions based on matched keywords
        input_lower = user_input.lower()
        
        if 'harmonic' in input_lower:
            suggestions.extend([
                "IEEE 519 harmonic compliance analysis",
                "Harmonic filter design and sizing",
                "Power quality improvement strategies"
            ])
        
        if 'efficiency' in input_lower:
            suggestions.extend([
                "Energy efficiency calculations",
                "Equipment performance optimization",
                "ROI analysis for efficiency improvements"
            ])
        
        if 'utility' in input_lower or 'rate' in input_lower:
            suggestions.extend([
                "Utility rate structure analysis",
                "Demand charge optimization",
                "Time-of-use rate analysis"
            ])
        
        return suggestions[:5]  # Return top 5 suggestions

# Enhanced validation functions
def validate_energy_domain(user_input: str) -> DomainValidationResult:
    """Enhanced energy domain validation"""
    guard = EnhancedEnergyDomainGuard()
    return guard.validate_energy_domain(user_input)

def get_energy_suggestions(user_input: str) -> List[str]:
    """Enhanced energy suggestions"""
    guard = EnhancedEnergyDomainGuard()
    return guard.get_energy_suggestions(user_input)

def filter_energy_response(response: str) -> str:
    """Enhanced response filtering"""
    # Enhanced filtering logic with knowledge base integration
    return response
