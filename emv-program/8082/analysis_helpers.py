"""
Helper functions for breaking down complex analysis functions
"""
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

def safe_float(value, default=0.0):
    """Enhanced helper function to safely convert any data type to float"""
    try:
        if value is None:
            return default
        if isinstance(value, (int, float)):
            return float(value)
        if isinstance(value, str):
            # Remove units and any non-numeric characters except decimal point and minus
            # Handle common units: V, A, %, kW, kVA, kVAR, etc.
            cleaned = value.strip()
            # Remove common units from the end
            for unit in [
                "V", "A", "%", "kW", "kVA", "kVAR", "kWh", "years", "$", ","
            ]:
                if cleaned.endswith(unit):
                    cleaned = cleaned[: -len(unit)].strip()
            # Remove any remaining non-numeric characters except decimal point and minus
            cleaned = "".join(c for c in cleaned if c.isdigit() or c in ".-")
            if cleaned:
                return float(cleaned)
            return default
        if isinstance(value, (list, dict)):
            # For complex data types, return default
            return default
        # Try to convert to string first, then to float
        return float(str(value))
    except (ValueError, TypeError, AttributeError):
        return default

def validate_analysis_inputs(before_data: Dict, after_data: Dict, config: Dict) -> Dict[str, Any]:
    """Validate input data for analysis"""
    from main_hardened_ready_fixed import DataValidation, AuditTrail
    
    # Initialize audit trail for this analysis
    audit_trail = AuditTrail()
    logger.info("AUDIT TRAIL - Analysis session started")

    # Validate input data for audit compliance
    before_validation = DataValidation.validate_power_data(before_data)
    after_validation = DataValidation.validate_power_data(after_data)
    config_validation = DataValidation.validate_compliance_inputs(before_data, config)

    # Log validation results
    logger.info(
        f"AUDIT TRAIL - Before data validation: Valid={before_validation['is_valid']}, Quality Score={before_validation['data_quality_score']:.2f}"
    )
    logger.info(
        f"AUDIT TRAIL - After data validation: Valid={after_validation['is_valid']}, Quality Score={after_validation['data_quality_score']:.2f}"
    )
    logger.info(
        f"AUDIT TRAIL - Config validation: Valid={config_validation['is_valid']}"
    )

    return {
        "audit_trail": audit_trail,
        "before_validation": before_validation,
        "after_validation": after_validation,
        "config_validation": config_validation,
        "before_data": before_validation["cleaned_data"],
        "after_data": after_validation["cleaned_data"]
    }

def normalize_analysis_config(config: Dict) -> Dict:
    """Normalize and validate configuration parameters"""
    if not isinstance(config, dict):
        config = {
            "cp_event_mode": "auto_heuristic",
            "cp_region": "ERCOT",
            "phases": 3,
            "voltage_nominal": 480,
            "equipment_type": "Motor",
            "power_factor_not_included": False,
            "no_cp_event": False
        }
    
    # Set defaults for missing keys
    defaults = {
        "cp_event_mode": "auto_heuristic",
        "cp_region": "ERCOT", 
        "phases": 3,
        "voltage_nominal": 480,
        "equipment_type": "Motor",
        "power_factor_not_included": False,
        "no_cp_event": False,
        "confidence_level": 0.95,
        "target_power_factor": 0.95
    }
    
    for key, default_value in defaults.items():
        if key not in config:
            config[key] = default_value
    
    return config

def extract_report_data(data: Dict) -> Dict[str, Any]:
    """Extract and validate data for report generation"""
    if not data:
        return {"error": "No data provided"}
    
    # Debug: Log the received data structure
    logger.info(f"Report generation - Received data keys: {list(data.keys())}")
    logger.info(f"Report generation - Data values: {data}")
    
    # Extract main data sections
    before_data = data.get("before_data", {})
    after_data = data.get("after_data", {})
    config = data.get("config", {})
    analysis_results = data.get("analysis_results", {})
    
    return {
        "before_data": before_data,
        "after_data": after_data, 
        "config": config,
        "analysis_results": analysis_results,
        "raw_data": data
    }

def process_attribution_data(attribution: Dict) -> Dict[str, Any]:
    """Process attribution data for report generation"""
    processed = {}
    
    # Energy savings processing
    if "energy" in attribution and isinstance(attribution["energy"], dict):
        energy = attribution["energy"]
        energy_dollars = energy.get("dollars", 0)
        components = energy.get("components", {})
        processed["energy"] = {
            "dollars": energy_dollars,
            "kwh": components.get("energy_kwh", 0),
            "base_kwh": components.get("base_kwh", 0),
            "network_kwh": components.get("network_kwh", 0),
            "rate": components.get("energy_rate", 0)
        }
    
    # Demand reduction processing
    if "demand" in attribution and isinstance(attribution["demand"], dict):
        demand = attribution["demand"]
        processed["demand"] = {
            "dollars": demand.get("dollars", 0)
        }
    
    # Power factor penalty processing
    if "pf_reactive" in attribution and isinstance(attribution["pf_reactive"], dict):
        pf_reactive = attribution["pf_reactive"]
        processed["pf_reactive"] = {
            "dollars": pf_reactive.get("dollars", 0)
        }
    
    # Envelope smoothing processing
    if "envelope_smoothing" in attribution and isinstance(attribution["envelope_smoothing"], dict):
        envelope = attribution["envelope_smoothing"]
        processed["envelope_smoothing"] = {
            "dollars": envelope.get("dollars", 0)
        }
    
    return processed

def calculate_executive_summary(analysis_results: Dict) -> Dict[str, Any]:
    """Calculate executive summary metrics"""
    execsum = analysis_results.get("executive_summary", {})
    
    return {
        "kw_savings": execsum.get("kw_savings", 0),
        "annual_kwh": execsum.get("annual_kwh", 0),
        "npv": execsum.get("net_present_value", 0),
        "sir": execsum.get("savings_investment_ratio", 0),
        "payback": execsum.get("simple_payback_years", 0),
        "irr": execsum.get("internal_rate_of_return", 0)
    }

def calculate_power_quality_metrics(data: Dict) -> Dict[str, Any]:
    """Calculate power quality metrics for report"""
    pq = data.get("power_quality", {})
    
    return {
        "isc_il_ratio": pq.get("isc_il_ratio", 0),
        "tdd_before": pq.get("tdd_before", 0),
        "tdd_after": pq.get("tdd_after", 0),
        "thd_before": pq.get("thd_before", 0),
        "thd_after": pq.get("thd_after", 0)
    }

def calculate_data_quality_metrics(data: Dict) -> Dict[str, Any]:
    """Calculate data quality assessment metrics"""
    before_ci = data.get("before_ci", {})
    after_ci = data.get("after_ci", {})
    statistical = data.get("statistical", {})
    
    before_cv = before_ci.get("cv_percent", 0)
    after_cv = after_ci.get("cv_percent", 0)
    overall_compliant = (
        "Yes" if (
            before_ci.get("meets_ashrae_cv", False) and 
            after_ci.get("meets_ashrae_cv", False)
        ) else "No"
    )
    
    return {
        "before_cv": before_cv,
        "after_cv": after_cv,
        "overall_compliant": overall_compliant,
        "p_value": statistical.get("p_value", 0.0)
    }
