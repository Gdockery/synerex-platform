#!/usr/bin/env python3
"""
Common Validation Functions

This module contains extracted validation functions that were duplicated
throughout the main application. These functions provide a unified
validation interface for all data types.
"""

import logging
from typing import Dict, List, Any, Optional, Union
import numpy as np

logger = logging.getLogger(__name__)

class UnifiedValidator:
    """Unified validation framework for all data types"""
    
    def __init__(self):
        self.validators = {
            'power_factor': self._validate_power_factor,
            'power_relationship': self._validate_power_relationship,
            'power_data': self._validate_power_data,
            'compliance_inputs': self._validate_compliance_inputs,
            'data_quality': self._validate_data_quality,
            'weather_data': self._validate_weather_data,
            'config_data': self._validate_config_data,
        }
    
    def validate(self, validation_type: str, *args, **kwargs) -> Dict[str, Any]:
        """Unified validation interface"""
        if validation_type not in self.validators:
            raise ValueError(f"Unknown validation type: {validation_type}")
        
        try:
            result = self.validators[validation_type](*args, **kwargs)
            logger.debug(f"Validation {validation_type} completed successfully")
            return result
        except Exception as e:
            logger.error(f"Validation {validation_type} failed: {e}")
            return {"is_valid": False, "error": str(e)}
    
    def validate_all(self, before_data: Dict, after_data: Dict, config: Dict) -> Dict[str, Any]:
        """Validate all data types in one pass"""
        results = {
            'before_data': self._validate_power_data(before_data),
            'after_data': self._validate_power_data(after_data),
            'config': self._validate_config_data(config),
            'combined': self._validate_combined(before_data, after_data, config)
        }
        
        # Overall validation result
        results['overall_valid'] = all(
            result.get('is_valid', False) for result in results.values()
            if isinstance(result, dict)
        )
        
        return results
    
    def _validate_power_factor(self, pf: float) -> Dict[str, Any]:
        """Validate power factor per utility standards"""
        if pf is None or pf <= 0:
            logger.error(f"Invalid PF value: {pf} - must use actual CSV meter data")
            return {
                "is_valid": False,
                "value": 0,
                "error": "Invalid PF value - must use actual CSV meter data"
            }
        elif pf > 1.0:
            if pf <= 100:
                normalized_pf = pf / 100.0
                logger.info(f"PF value normalized from {pf}% to {normalized_pf}")
                return {
                    "is_valid": True,
                    "value": normalized_pf,
                    "normalized": True
                }
            else:
                logger.error(f"Invalid PF value: {pf} - must use actual CSV meter data")
                return {
                    "is_valid": False,
                    "value": 0,
                    "error": "Invalid PF value - must use actual CSV meter data"
                }
        
        return {
            "is_valid": True,
            "value": pf,
            "normalized": False
        }
    
    def _validate_power_relationship(self, kw: float, kva: float, kvar: float = None) -> Dict[str, Any]:
        """Validate power triangle per IEEE standards"""
        if kw <= 0 or kva <= 0:
            return {
                "is_valid": False,
                "error": "Power values must be positive"
            }
        
        if kw > kva:
            return {
                "is_valid": False,
                "error": "kW cannot exceed kVA"
            }
        
        # Calculate kvar if not provided
        if kvar is None:
            kvar = np.sqrt(kva**2 - kw**2)
        
        # Validate power triangle
        power_triangle_valid = abs(kw**2 + kvar**2 - kva**2) < 0.01
        
        return {
            "is_valid": power_triangle_valid,
            "kw": kw,
            "kva": kva,
            "kvar": kvar,
            "pf": kw / kva if kva > 0 else 0,
            "error": "Power triangle validation failed" if not power_triangle_valid else None
        }
    
    def _validate_power_data(self, data: Dict) -> Dict[str, Any]:
        """Validate power data structure and values"""
        if not isinstance(data, dict):
            return {
                "is_valid": False,
                "error": "Data must be a dictionary",
                "cleaned_data": {}
            }
        
        cleaned_data = {}
        errors = []
        
        # Validate required fields
        required_fields = ['avgKw', 'avgKva', 'avgPf']
        for field in required_fields:
            if field not in data:
                errors.append(f"Missing required field: {field}")
                continue
            
            field_data = data[field]
            if not isinstance(field_data, dict):
                errors.append(f"Field {field} must be a dictionary")
                continue
            
            # Validate field structure
            if 'mean' not in field_data:
                errors.append(f"Field {field} missing 'mean' value")
                continue
            
            mean_value = field_data['mean']
            if not isinstance(mean_value, (int, float)):
                errors.append(f"Field {field} mean must be numeric")
                continue
            
            cleaned_data[field] = field_data
        
        # Validate power factor
        if 'avgPf' in cleaned_data:
            pf_validation = self._validate_power_factor(cleaned_data['avgPf']['mean'])
            if not pf_validation['is_valid']:
                errors.append(f"Power factor validation failed: {pf_validation.get('error', 'Unknown error')}")
            else:
                cleaned_data['avgPf']['mean'] = pf_validation['value']
        
        # Calculate data quality score
        data_quality_score = max(0, 1.0 - len(errors) * 0.1)
        
        return {
            "is_valid": len(errors) == 0,
            "cleaned_data": cleaned_data,
            "data_quality_score": data_quality_score,
            "errors": errors
        }
    
    def _validate_compliance_inputs(self, data: Dict, config: Dict) -> Dict[str, Any]:
        """Validate compliance analysis inputs"""
        if not isinstance(data, dict) or not isinstance(config, dict):
            return {
                "is_valid": False,
                "error": "Data and config must be dictionaries"
            }
        
        errors = []
        
        # Validate required config fields
        required_config_fields = ['phases', 'voltage_nominal']
        for field in required_config_fields:
            if field not in config:
                errors.append(f"Missing required config field: {field}")
        
        # Validate data structure
        if 'avgKw' not in data:
            errors.append("Missing avgKw data")
        if 'avgKva' not in data:
            errors.append("Missing avgKva data")
        if 'avgPf' not in data:
            errors.append("Missing avgPf data")
        
        return {
            "is_valid": len(errors) == 0,
            "errors": errors
        }
    
    def _validate_data_quality(self, data: Dict, completeness_threshold: float = 0.95) -> Dict[str, Any]:
        """Validate data quality metrics"""
        if not isinstance(data, dict):
            return {
                "is_valid": False,
                "error": "Data must be a dictionary"
            }
        
        # Calculate completeness
        total_fields = len(data)
        valid_fields = sum(1 for value in data.values() if value is not None and value != "")
        completeness = valid_fields / total_fields if total_fields > 0 else 0
        
        # Check for outliers (simplified)
        numeric_values = []
        for value in data.values():
            if isinstance(value, (int, float)):
                numeric_values.append(value)
        
        outlier_count = 0
        if len(numeric_values) > 2:
            mean_val = np.mean(numeric_values)
            std_val = np.std(numeric_values)
            outlier_count = sum(1 for val in numeric_values if abs(val - mean_val) > 3 * std_val)
        
        outlier_percentage = outlier_count / len(numeric_values) if numeric_values else 0
        
        return {
            "is_valid": completeness >= completeness_threshold and outlier_percentage < 0.05,
            "completeness": completeness,
            "outlier_percentage": outlier_percentage,
            "total_fields": total_fields,
            "valid_fields": valid_fields,
            "outlier_count": outlier_count
        }
    
    def _validate_weather_data(self, weather_data: Dict) -> Dict[str, Any]:
        """Validate weather data structure and values"""
        if not isinstance(weather_data, dict):
            return {
                "is_valid": False,
                "error": "Weather data must be a dictionary"
            }
        
        required_fields = ['temp_before', 'temp_after', 'humidity_before', 'humidity_after']
        errors = []
        
        for field in required_fields:
            if field not in weather_data:
                errors.append(f"Missing weather field: {field}")
            elif weather_data[field] is None:
                errors.append(f"Weather field {field} is None")
        
        return {
            "is_valid": len(errors) == 0,
            "errors": errors
        }
    
    def _validate_config_data(self, config: Dict) -> Dict[str, Any]:
        """Validate configuration data"""
        if not isinstance(config, dict):
            return {
                "is_valid": False,
                "error": "Config must be a dictionary"
            }
        
        errors = []
        
        # Validate numeric fields
        numeric_fields = ['phases', 'voltage_nominal', 'energy_rate']
        for field in numeric_fields:
            if field in config:
                value = config[field]
                if not isinstance(value, (int, float)):
                    errors.append(f"Config field {field} must be numeric")
                elif value <= 0:
                    errors.append(f"Config field {field} must be positive")
        
        return {
            "is_valid": len(errors) == 0,
            "errors": errors
        }
    
    def _validate_combined(self, before_data: Dict, after_data: Dict, config: Dict) -> Dict[str, Any]:
        """Validate combined data for consistency"""
        errors = []
        
        # Check data consistency
        if 'avgKw' in before_data and 'avgKw' in after_data:
            before_kw = before_data['avgKw'].get('mean', 0)
            after_kw = after_data['avgKw'].get('mean', 0)
            
            if before_kw <= 0 or after_kw <= 0:
                errors.append("Power values must be positive")
        
        # Check config consistency
        if 'phases' in config:
            phases = config['phases']
            if phases not in [1, 3]:
                errors.append("Phases must be 1 or 3")
        
        return {
            "is_valid": len(errors) == 0,
            "errors": errors
        }

# Convenience functions for backward compatibility
def validate_power_factor(pf: float) -> float:
    """Validate power factor - backward compatibility"""
    validator = UnifiedValidator()
    result = validator._validate_power_factor(pf)
    return result['value'] if result['is_valid'] else 0.0

def validate_power_relationship(kw: float, kva: float, kvar: float = None) -> Dict[str, Any]:
    """Validate power relationship - backward compatibility"""
    validator = UnifiedValidator()
    return validator._validate_power_relationship(kw, kva, kvar)

def validate_power_data(data: Dict) -> Dict[str, Any]:
    """Validate power data - backward compatibility"""
    validator = UnifiedValidator()
    return validator._validate_power_data(data)

def validate_compliance_inputs(data: Dict, config: Dict) -> Dict[str, Any]:
    """Validate compliance inputs - backward compatibility"""
    validator = UnifiedValidator()
    return validator._validate_compliance_inputs(data, config)

def validate_data_quality(data: Dict, completeness_threshold: float = 0.95) -> Dict[str, Any]:
    """Validate data quality - backward compatibility"""
    validator = UnifiedValidator()
    return validator._validate_data_quality(data, completeness_threshold)
