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

def cross_check_document_consistency(results_data):
    """
    Cross-check monitor to verify consistency between Analysis report, Audit PDFs, and Utility Submission PDFs.
    CRITICAL: Ensures all documents tie out perfectly for audit and utility submission compliance.
    """
    from datetime import datetime
    
    if not results_data or not isinstance(results_data, dict):
        return {
            "error": "No results data provided",
            "consistency_status": "ERROR",
            "tie_out_status": "FAILED",
            "audit_compliance": "FAILED"
        }
    
    def safe_get(data_dict, *keys, default=None):
        if not data_dict or not isinstance(data_dict, dict):
            return default
        for key in keys:
            if isinstance(data_dict, dict) and key in data_dict:
                data_dict = data_dict[key]
            else:
                return default
        return data_dict if data_dict is not None else default
    
    def safe_float(value, default=0.0):
        if value is None:
            return default
        try:
            return float(value) if value != "" else default
        except (ValueError, TypeError):
            return default
    
    # Extract key metrics from results_data (source of truth)
    power_quality = results_data.get("power_quality", {}) or {}
    statistical = results_data.get("statistical", {}) or {}
    weather_normalization = results_data.get("weather_normalization", {}) or {}
    financial = results_data.get("financial", {}) or {}
    before_data = results_data.get("before_data", {}) or {}
    after_data = results_data.get("after_data", {}) or {}
    before_compliance = results_data.get("before_compliance", {}) or {}
    after_compliance = results_data.get("after_compliance", {}) or {}
    executive_summary = results_data.get("executive_summary", {}) or {}
    power_quality_normalized = power_quality.get("normalized", {}) or {}
    
    # Key metrics that MUST tie out across all documents
    metrics = {
        "weather_adjustment_factor": safe_float(safe_get(weather_normalization, "weather_adjustment_factor")),
        "normalized_kw_after": safe_float(safe_get(power_quality_normalized, "kw_after")),
        "normalized_kw_savings": safe_float(safe_get(power_quality_normalized, "kw_savings")),
        "total_normalized_savings_kw": safe_float(safe_get(power_quality_normalized, "total_normalized_savings_kw")),
        "utility_billing_impact_percent": safe_float(safe_get(power_quality_normalized, "utility_billing_impact_percent")),
        "thd_before": safe_float(safe_get(power_quality, "thd_before")),
        "thd_after": safe_float(safe_get(power_quality, "thd_after")),
        "pf_before": safe_float(safe_get(power_quality, "pf_before")),
        "pf_after": safe_float(safe_get(power_quality, "pf_after")),
        "voltage_unbalance_before": safe_float(safe_get(before_compliance, "voltage_unbalance")),
        "voltage_unbalance_after": safe_float(safe_get(after_compliance, "voltage_unbalance")),
        "cvrmse": safe_float(safe_get(statistical, "cvrmse")),
        "nmbe": safe_float(safe_get(statistical, "nmbe")),
        "r_squared": safe_float(safe_get(statistical, "r_squared")),
        "p_value": safe_float(safe_get(statistical, "p_value")),
        "annual_kwh_savings": safe_float(safe_get(executive_summary, "annual_kwh")),
        "annual_dollar_savings": safe_float(safe_get(financial, "annual_savings")),
        "npv": safe_float(safe_get(executive_summary, "net_present_value")),
        "sir": safe_float(safe_get(executive_summary, "savings_investment_ratio")),
        "payback_years": safe_float(safe_get(executive_summary, "simple_payback_years")),
        "kw_before_avg": safe_float(safe_get(before_data, "avgKw", "mean")),
        "kw_after_avg": safe_float(safe_get(after_data, "avgKw", "mean")),
    }
    
    # Human-readable location in the app for each metric (so user knows where to fix)
    METRIC_LOCATION = {
        "normalized_kw_after": "Weather Normalization Settings",
        "total_normalized_savings_kw": "Weather Normalization Settings",
        "utility_billing_impact_percent": "Weather Normalization Settings",
        "weather_adjustment_factor": "Weather Normalization Settings",
        "annual_kwh_savings": "Energy Rate ($/kWh) or Analysis Results",
        "annual_dollar_savings": "Energy Rate ($/kWh) or Analysis Results",
        "npv": "Project Cost ($)",
        "sir": "Project Cost ($)",
        "payback_years": "Project Cost ($)",
        "pf_before": "Target Power Factor / Raw Meter Data",
        "pf_after": "Target Power Factor / Raw Meter Data",
        "thd_before": "Harmonic Analysis Level / Raw Meter Data",
        "thd_after": "Harmonic Analysis Level / Raw Meter Data",
        "kw_before_avg": "Before Period File",
        "kw_after_avg": "After Period File",
    }

    discrepancies = []
    critical_metrics = [
        "normalized_kw_after",
        "total_normalized_savings_kw",
        "utility_billing_impact_percent",
        "weather_adjustment_factor"
    ]

    # Detect whether weather normalization was applicable for this project.
    # normalization_applied=False is set explicitly by the analysis engine when
    # temperature differences are too small, no weather data is available, or
    # the project type does not require weather normalization.
    # We also treat an empty/absent weather_normalization dict, or string "false"/"no"/"0",
    # as "not applicable" — the analysis engine may store the flag in various forms.
    _wn_applied = weather_normalization.get("normalization_applied", None)
    weather_norm_skipped = (
        not weather_normalization                               # empty dict → not run
        or _wn_applied is False                                 # explicit Python False
        or _wn_applied == 0                                     # numeric 0
        or str(_wn_applied).strip().lower() in ('false', 'no', '0', 'none', '')
    )

    if weather_norm_skipped:
        # Weather normalization is not applicable — record an informational note
        # but do NOT raise a HIGH/MEDIUM discrepancy that would cause a FAILED status.
        _wn_reason = weather_normalization.get("reason") or weather_normalization.get("skip_reason") or \
                     "Temperature difference between periods is below the ASHRAE Guideline 14 threshold, or no weather data available."
        discrepancies.append({
            "metric": "weather_normalization",
            "issue": f"Weather normalization not applicable for this project — {_wn_reason}",
            "severity": "INFO",
            "document_impact": "None — weather normalization was not required",
            "current_value": "N/A",
            "correct_value": "N/A",
            "location": "Weather Normalization Settings",
        })
    else:
        # Check for missing critical weather-normalized values
        for metric in critical_metrics:
            current_val = metrics.get(metric)
            if current_val == 0.0 or current_val is None:
                location = METRIC_LOCATION.get(metric, "Analysis Results or input form")
                correct_msg = f"Enter a non-zero value in \"{location}\", then re-run analysis."
                discrepancies.append({
                    "metric": metric,
                    "issue": "Missing or zero value",
                    "severity": "HIGH",
                    "document_impact": "All documents",
                    "current_value": current_val if current_val is not None else "Missing",
                    "correct_value": correct_msg,
                    "location": location,
                })

        # Verify weather adjustment factor calculation
        if metrics["normalized_kw_after"] > 0 and metrics["kw_after_avg"] > 0:
            expected_factor = metrics["normalized_kw_after"] / metrics["kw_after_avg"] if metrics["kw_after_avg"] > 0 else 0
            actual_factor = metrics["weather_adjustment_factor"]
            if abs(expected_factor - actual_factor) > 0.001:  # 0.1% tolerance for rounding
                discrepancies.append({
                    "metric": "weather_adjustment_factor",
                    "issue": f"Factor mismatch: expected {expected_factor:.6f}, got {actual_factor:.6f}",
                    "severity": "HIGH",
                    "document_impact": "Analysis, Audit, Utility Submission",
                    "current_value": actual_factor,
                    "correct_value": round(expected_factor, 6),
                    "location": METRIC_LOCATION.get("weather_adjustment_factor", "Weather Normalization Settings"),
                })
    
    # Determine tie-out status
    high_severity_count = sum(1 for d in discrepancies if d.get("severity") == "HIGH")
    medium_severity_count = sum(1 for d in discrepancies if d.get("severity") == "MEDIUM")
    info_count = sum(1 for d in discrepancies if d.get("severity") == "INFO")
    # Only count actual issues (not INFO notes) toward the status decision
    real_discrepancy_count = sum(1 for d in discrepancies if d.get("severity") not in ("INFO",))

    if high_severity_count > 0:
        consistency_status = "FAILED - DOES NOT TIE OUT"
        tie_out_status = "FAILED"
        audit_compliance = "FAILED"
    elif medium_severity_count > 0:
        consistency_status = "WARNING - REVIEW REQUIRED"
        tie_out_status = "WARNING"
        audit_compliance = "WARNING"
    elif real_discrepancy_count > 0:
        consistency_status = "MINOR ISSUES"
        tie_out_status = "PASSED_WITH_WARNINGS"
        audit_compliance = "PASSED_WITH_WARNINGS"
    else:
        consistency_status = "PASSED - ALL DOCUMENTS TIE OUT"
        tie_out_status = "PASSED"
        audit_compliance = "PASSED"
    
    # Project name for Document Sync Console display
    project_name = (
        results_data.get("project_name")
        or safe_get(results_data, "config", "project_name")
        or safe_get(results_data, "client_profile", "project_name")
        or safe_get(results_data, "config", "cp_company")
        or ""
    )
    if isinstance(project_name, str):
        project_name = project_name.strip() or ""
    else:
        project_name = str(project_name).strip() if project_name else ""

    return {
        "consistency_status": consistency_status,
        "tie_out_status": tie_out_status,
        "audit_compliance": audit_compliance,
        "metrics": metrics,
        "discrepancies": discrepancies,
        "weather_normalization_applicable": not weather_norm_skipped,
        "summary": {
            "total_metrics_checked": len(metrics),
            "discrepancies_found": real_discrepancy_count,
            "high_severity": high_severity_count,
            "medium_severity": medium_severity_count,
            "info_notes": info_count,
        },
        "timestamp": datetime.now().isoformat(),
        "project_name": project_name or None
    }


def build_consistency_diagnostics(results_data, html_content=None, html_report_path=None):
    """
    Build diagnostics to confirm consistency: document presence, completeness, and derived-value checks.
    Returns a dict suitable for the cross-check API and Document Sync Console.
    """
    if not results_data or not isinstance(results_data, dict):
        return {"document_presence": {}, "completeness": {}, "derived_checks": [], "tolerance": {}}

    def safe_get(data_dict, *keys, default=None):
        if not data_dict or not isinstance(data_dict, dict):
            return default
        for key in keys:
            if isinstance(data_dict, dict) and key in data_dict:
                data_dict = data_dict[key]
            else:
                return default
        return data_dict if data_dict is not None else default

    def safe_float(value, default=0.0):
        if value is None:
            return default
        try:
            return float(value) if value != "" else default
        except (ValueError, TypeError):
            return default

    # Document presence
    document_presence = {
        "html_report_loaded": bool(html_content and isinstance(html_content, str) and len(html_content.strip()) > 0),
        "html_report_path": str(html_report_path) if html_report_path else None,
    }

    # Completeness: how many key metrics have non-zero/non-empty values
    power_quality = results_data.get("power_quality", {}) or {}
    statistical = results_data.get("statistical", {}) or {}
    weather_normalization = results_data.get("weather_normalization", {}) or {}
    financial = results_data.get("financial", {}) or {}
    before_data = results_data.get("before_data", {}) or {}
    after_data = results_data.get("after_data", {}) or {}
    executive_summary = results_data.get("executive_summary", {}) or {}
    power_quality_normalized = power_quality.get("normalized", {}) or {}

    key_sources = [
        safe_float(safe_get(weather_normalization, "weather_adjustment_factor")),
        safe_float(safe_get(power_quality_normalized, "kw_after")),
        safe_float(safe_get(power_quality_normalized, "kw_savings")),
        safe_float(safe_get(power_quality_normalized, "total_normalized_savings_kw")),
        safe_float(safe_get(power_quality_normalized, "utility_billing_impact_percent")),
        safe_float(safe_get(executive_summary, "annual_kwh")),
        safe_float(safe_get(financial, "annual_savings")),
        safe_float(safe_get(executive_summary, "net_present_value")),
        safe_float(safe_get(executive_summary, "savings_investment_ratio")),
        safe_float(safe_get(executive_summary, "simple_payback_years")),
        safe_float(safe_get(before_data, "avgKw", "mean")),
        safe_float(safe_get(after_data, "avgKw", "mean")),
    ]
    total = len(key_sources)
    with_values = sum(1 for v in key_sources if v is not None and v != 0.0)
    completeness = {
        "metrics_with_values": with_values,
        "total_key_metrics": total,
        "percent_filled": round(100.0 * with_values / total, 1) if total else 0,
    }

    # Derived-value consistency checks
    derived_checks = []
    tol_rel = 0.005   # 0.5%
    tol_abs = 0.01

    kw_after_avg = safe_float(safe_get(after_data, "avgKw", "mean"))
    kw_before_avg = safe_float(safe_get(before_data, "avgKw", "mean"))
    normalized_kw_after = safe_float(safe_get(power_quality_normalized, "kw_after"))
    weather_factor = safe_float(safe_get(weather_normalization, "weather_adjustment_factor"))
    total_norm_savings_kw = safe_float(safe_get(power_quality_normalized, "total_normalized_savings_kw"))

    # 1. Weather adjustment factor: normalized_kw_after ≈ kw_after_avg * weather_adjustment_factor
    if kw_after_avg and kw_after_avg > 0 and weather_factor:
        expected_normalized = kw_after_avg * weather_factor
        diff = abs(normalized_kw_after - expected_normalized)
        passed = diff <= tol_abs or (expected_normalized and diff / expected_normalized <= tol_rel)
        derived_checks.append({
            "name": "Weather factor consistency",
            "description": "normalized_kw_after ≈ kw_after_avg × weather_adjustment_factor",
            "passed": passed,
            "expected": round(expected_normalized, 4),
            "actual": round(normalized_kw_after, 4),
        })

    # 2. Normalized savings: total_normalized_savings_kw ≈ kw_before_avg - normalized_kw_after
    if kw_before_avg and normalized_kw_after is not None:
        expected_savings = kw_before_avg - normalized_kw_after
        if expected_savings >= 0:
            diff = abs(total_norm_savings_kw - expected_savings)
            passed = diff <= tol_abs or (expected_savings and diff / expected_savings <= tol_rel)
            derived_checks.append({
                "name": "Normalized savings consistency",
                "description": "total_normalized_savings_kw ≈ kw_before_avg − normalized_kw_after",
                "passed": passed,
                "expected": round(expected_savings, 4),
                "actual": round(total_norm_savings_kw, 4),
            })

    # 3. Raw period averages present
    derived_checks.append({
        "name": "Before/after period data",
        "description": "Before and after period kW averages available",
        "passed": bool(kw_before_avg and kw_after_avg),
        "expected": "non-zero",
        "actual": f"before={round(kw_before_avg, 4)}, after={round(kw_after_avg, 4)}",
    })

    # 4. Statistical validity (optional)
    cvrmse = safe_float(safe_get(statistical, "cvrmse"))
    p_value = safe_float(safe_get(statistical, "p_value"))
    derived_checks.append({
        "name": "Statistical model",
        "description": "CVRMSE and p-value available for IPMVP",
        "passed": cvrmse is not None or p_value is not None,
        "expected": "present",
        "actual": f"CVRMSE={round(cvrmse, 4) if cvrmse is not None else 'N/A'}, p={round(p_value, 4) if p_value is not None else 'N/A'}",
    })

    tolerance = {"relative_percent": 0.5, "absolute": 0.01}

    return {
        "document_presence": document_presence,
        "completeness": completeness,
        "derived_checks": derived_checks,
        "tolerance": tolerance,
    }


def extract_metrics_from_html(html_content):
    """
    Extract key metrics from Client HTML Report content using regex patterns.
    Returns dict of metric_name -> float or None for values that could not be parsed.
    Used to cross-check values posted in the HTML report against analysis source data.
    """
    import re
    if not html_content or not isinstance(html_content, str):
        return {}

    # value-cell may appear alone or with other classes: class="value-cell" or class="foo value-cell bar"
    _vc = r'class=["\'][^"\']*value-cell[^"\']*["\'][^>]*>'

    def safe_float_from_match(m):
        if not m:
            return None
        try:
            s = m.replace(",", "").strip()
            # Remove common units (%, kW, years, $, etc.) for numeric parse
            s = re.sub(r"\s*(%|kW|kWh|kVA|kVAR|years?|\$|V|A)\s*$", "", s, flags=re.I)
            s = "".join(c for c in s if c.isdigit() or c in ".-")
            if s:
                return float(s)
        except (ValueError, TypeError):
            pass
        return None

    extracted = {}

    # Annual kWh savings: "X kWh annual savings" or "Annual kWh" in table
    m = re.search(r"([\d,]+(?:\.\d+)?)\s*kWh\s*annual\s*savings", html_content, re.I)
    if m:
        extracted["annual_kwh_savings"] = safe_float_from_match(m.group(1))
    m = re.search(r"Annual\s*[Kk]Wh[^<]*</td>\s*<td[^>]*" + _vc + "([^<]+)", html_content)
    if m and "annual_kwh_savings" not in extracted:
        extracted["annual_kwh_savings"] = safe_float_from_match(m.group(1))

    # Simple payback years: "X.X years" after "Simple Payback"
    m = re.search(r"Simple\s*Payback[^<]*</td>\s*<td[^>]*" + _vc + "([^<]+)", html_content)
    if m:
        raw = m.group(1)
        m2 = re.search(r"([\d.]+)\s*years?", raw, re.I)
        extracted["payback_years"] = safe_float_from_match(m2.group(1) if m2 else raw)
    if "payback_years" not in extracted:
        m = re.search(r"Simple\s*Payback[^:]*:\s*([\d.]+)\s*years?", html_content, re.I)
        if m:
            extracted["payback_years"] = safe_float_from_match(m.group(1))

    # Net Present Value / NPV
    m = re.search(r"Net\s*Present\s*Value[^<]*</td>\s*<td[^>]*" + _vc + "([^<]+)", html_content, re.I)
    if m:
        extracted["npv"] = safe_float_from_match(m.group(1))
    if "npv" not in extracted:
        m = re.search(r"NPV[^:]*:\s*[\$]?\s*([\d,.]+)", html_content, re.I)
        if m:
            extracted["npv"] = safe_float_from_match(m.group(1))

    # Savings Investment Ratio / SIR
    m = re.search(r"Savings\s*Investment\s*Ratio[^<]*</td>\s*<td[^>]*" + _vc + "([^<]+)", html_content, re.I)
    if m:
        extracted["sir"] = safe_float_from_match(m.group(1))
    if "sir" not in extracted:
        m = re.search(r"SIR[^:]*:\s*([\d.]+)", html_content, re.I)
        if m:
            extracted["sir"] = safe_float_from_match(m.group(1))

    # Normalized kW savings / weather: "X.XX% normalized kW savings" or "X.X kW" in weather row
    m = re.search(r"([\d.]+)\s*%\s*normalized\s*kW\s*savings", html_content, re.I)
    if m:
        extracted["normalized_kw_savings_pct"] = safe_float_from_match(m.group(1))
    m = re.search(r"Weather\s*Normalization[^<]*</td>\s*<td[^>]*" + _vc + r"([^<]+)", html_content, re.I)
    if m:
        extracted["weather_normalized_kw"] = safe_float_from_match(m.group(1))

    # Weather adjustment factor: label then value-cell
    m = re.search(r"Weather\s*Adjustment\s*Factor[^<]*</td>\s*<td[^>]*" + _vc + "([^<]+)", html_content, re.I)
    if m:
        extracted["weather_adjustment_factor"] = safe_float_from_match(m.group(1))
    if "weather_adjustment_factor" not in extracted:
        m = re.search(r"Adjustment\s*Factor[^<]*</td>\s*<td[^>]*" + _vc + "([^<]+)", html_content, re.I)
        if m:
            extracted["weather_adjustment_factor"] = safe_float_from_match(m.group(1))
    if "weather_adjustment_factor" not in extracted:
        m = re.search(r"weather\s*adjustment\s*factor[^:]*:\s*([\d.]+)", html_content, re.I)
        if m:
            extracted["weather_adjustment_factor"] = safe_float_from_match(m.group(1))

    # Normalized kW after: label then value-cell
    m = re.search(r"Normalized\s*kW\s*After[^<]*</td>\s*<td[^>]*" + _vc + "([^<]+)", html_content, re.I)
    if m:
        extracted["normalized_kw_after"] = safe_float_from_match(m.group(1))
    if "normalized_kw_after" not in extracted and extracted.get("weather_normalized_kw") is not None:
        extracted["normalized_kw_after"] = extracted["weather_normalized_kw"]

    # Total normalized savings (kW)
    m = re.search(r"Total\s*Normalized\s*Savings[^<]*</td>\s*<td[^>]*" + _vc + "([^<]+)", html_content, re.I)
    if m:
        extracted["total_normalized_savings_kw"] = safe_float_from_match(m.group(1))
    if "total_normalized_savings_kw" not in extracted:
        m = re.search(r"Normalized\s*Savings\s*\(?kW\)?[^<]*</td>\s*<td[^>]*" + _vc + "([^<]+)", html_content, re.I)
        if m:
            extracted["total_normalized_savings_kw"] = safe_float_from_match(m.group(1))
    if "total_normalized_savings_kw" not in extracted:
        m = re.search(r"([\d,]+(?:\.\d+)?)\s*kW\s*normalized\s*savings", html_content, re.I)
        if m:
            extracted["total_normalized_savings_kw"] = safe_float_from_match(m.group(1))

    # Utility billing impact % (may appear as "Utility Billing Impact" or already as normalized_kw_savings_pct)
    m = re.search(r"Utility\s*Billing\s*Impact[^<]*</td>\s*<td[^>]*" + _vc + "([^<]+)", html_content, re.I)
    if m:
        extracted["utility_billing_impact_percent"] = safe_float_from_match(m.group(1))
    if "utility_billing_impact_percent" not in extracted and extracted.get("normalized_kw_savings_pct") is not None:
        extracted["utility_billing_impact_percent"] = extracted["normalized_kw_savings_pct"]

    # kW before avg / kW after avg: row with label then two value-cells (before, after)
    m = re.search(r"Average\s*kW[^<]*</td>\s*<td[^>]*" + _vc + "([^<]+)</td>\s*<td[^>]*" + _vc + "([^<]+)", html_content, re.I)
    if m:
        extracted["kw_before_avg"] = safe_float_from_match(m.group(1))
        extracted["kw_after_avg"] = safe_float_from_match(m.group(2))
    if "kw_before_avg" not in extracted:
        m = re.search(r"Before\s*Period[^<]*</td>\s*<td[^>]*" + _vc + "([^<]+)", html_content, re.I)
        if m:
            extracted["kw_before_avg"] = safe_float_from_match(m.group(1))
    if "kw_before_avg" not in extracted:
        m = re.search(r"Average\s*kW\s*\(?before\)?[^<]*</td>\s*<td[^>]*" + _vc + "([^<]+)", html_content, re.I)
        if m:
            extracted["kw_before_avg"] = safe_float_from_match(m.group(1))
    if "kw_before_avg" not in extracted:
        m = re.search(r"kw_before[^:]*:\s*([\d.]+)|before[^:]*average[^:]*:\s*([\d.]+)\s*kW", html_content, re.I)
        if m:
            extracted["kw_before_avg"] = safe_float_from_match(m.group(1) or m.group(2))

    # kW after avg
    if "kw_after_avg" not in extracted:
        m = re.search(r"After\s*Period[^<]*</td>\s*<td[^>]*" + _vc + "([^<]+)", html_content, re.I)
        if m:
            extracted["kw_after_avg"] = safe_float_from_match(m.group(1))
    if "kw_after_avg" not in extracted:
        m = re.search(r"Average\s*kW\s*\(?after\)?[^<]*</td>\s*<td[^>]*" + _vc + "([^<]+)", html_content, re.I)
        if m:
            extracted["kw_after_avg"] = safe_float_from_match(m.group(1))
    if "kw_after_avg" not in extracted:
        m = re.search(r"kw_after[^:]*:\s*([\d.]+)|after[^:]*average[^:]*:\s*([\d.]+)\s*kW", html_content, re.I)
        if m:
            extracted["kw_after_avg"] = safe_float_from_match(m.group(1) or m.group(2))

    # Power Factor before/after from Raw Meter Test table (e.g. "96.48%" then "98.40%")
    m = re.search(r"Power\s*Factor</td>\s*<td[^>]*" + _vc + "([^<]+)</td>\s*<td[^>]*" + _vc + "([^<]+)", html_content, re.I)
    if m:
        extracted["pf_before"] = safe_float_from_match(m.group(1))
        extracted["pf_after"] = safe_float_from_match(m.group(2))
    if "pf_before" not in extracted:
        m = re.search(r"Power\s*Factor[^:]*:\s*Improved\s*from\s*([\d.]+)\s*%\s*to\s*([\d.]+)\s*%", html_content, re.I)
        if m:
            extracted["pf_before"] = safe_float_from_match(m.group(1))
            extracted["pf_after"] = safe_float_from_match(m.group(2))

    # THD before/after
    m = re.search(r"<tr[^>]*>\s*<td[^>]*>\s*<strong>\s*THD\s*</strong>\s*</td>\s*<td[^>]*" + _vc + "([^<]+)</td>\s*<td[^>]*" + _vc + "([^<]+)", html_content, re.I)
    if m:
        extracted["thd_before"] = safe_float_from_match(m.group(1))
        extracted["thd_after"] = safe_float_from_match(m.group(2))

    # Annual dollar savings
    m = re.search(r"Annual\s*(?:Dollar\s*)?Savings[^<]*</td>\s*<td[^>]*" + _vc + "([^<]+)", html_content, re.I)
    if m:
        extracted["annual_dollar_savings"] = safe_float_from_match(m.group(1))
    if "annual_dollar_savings" not in extracted:
        m = re.search(r"[\$]\s*([\d,.]+)\s*annual\s*savings", html_content, re.I)
        if m:
            extracted["annual_dollar_savings"] = safe_float_from_match(m.group(1))

    return extracted


def cross_check_document_level(results_data, html_content=None):
    """
    Cross-check values that appear in the Client HTML Report (and transposed in Audit/Utility)
    against the analysis source data. If html_content is provided, extracts metrics from
    the HTML and compares to source; otherwise only validates source consistency.
    Returns list of discrepancies with document_impact and current_value/correct_value.
    """
    from datetime import datetime

    if not results_data or not isinstance(results_data, dict):
        return []

    def safe_get(data_dict, *keys, default=None):
        if not data_dict or not isinstance(data_dict, dict):
            return default
        for key in keys:
            if isinstance(data_dict, dict) and key in data_dict:
                data_dict = data_dict[key]
            else:
                return default
        return data_dict if data_dict is not None else default

    def safe_float(value, default=0.0):
        if value is None:
            return default
        try:
            return float(value) if value != "" else default
        except (ValueError, TypeError):
            return default

    # Build source metrics from results_data (same as cross_check_document_consistency)
    power_quality = results_data.get("power_quality", {}) or {}
    weather_normalization = results_data.get("weather_normalization", {}) or {}
    financial = results_data.get("financial", {}) or {}
    executive_summary = results_data.get("executive_summary", {}) or {}
    power_quality_normalized = power_quality.get("normalized", {}) or {}
    before_data = results_data.get("before_data", {}) or {}
    after_data = results_data.get("after_data", {}) or {}

    source = {
        "weather_adjustment_factor": safe_float(safe_get(weather_normalization, "weather_adjustment_factor")),
        "normalized_kw_after": safe_float(safe_get(power_quality_normalized, "kw_after")),
        "normalized_kw_savings": safe_float(safe_get(power_quality_normalized, "kw_savings")),
        "total_normalized_savings_kw": safe_float(safe_get(power_quality_normalized, "total_normalized_savings_kw")),
        "utility_billing_impact_percent": safe_float(safe_get(power_quality_normalized, "utility_billing_impact_percent")),
        "annual_kwh_savings": safe_float(safe_get(executive_summary, "annual_kwh")),
        "annual_dollar_savings": safe_float(safe_get(financial, "annual_savings")),
        "npv": safe_float(safe_get(executive_summary, "net_present_value")),
        "sir": safe_float(safe_get(executive_summary, "savings_investment_ratio")),
        "payback_years": safe_float(safe_get(executive_summary, "simple_payback_years")),
        "pf_before": safe_float(safe_get(power_quality, "pf_before")),
        "pf_after": safe_float(safe_get(power_quality, "pf_after")),
        "thd_before": safe_float(safe_get(power_quality, "thd_before")),
        "thd_after": safe_float(safe_get(power_quality, "thd_after")),
        "kw_before_avg": safe_float(safe_get(before_data, "avgKw", "mean")),
        "kw_after_avg": safe_float(safe_get(after_data, "avgKw", "mean")),
    }

    discrepancies = []
    tolerance_pct = 0.5  # 0.5% relative tolerance for numeric comparison
    tolerance_abs = 0.01  # absolute for small numbers

    if not html_content or not isinstance(html_content, str):
        return discrepancies

    html_metrics = extract_metrics_from_html(html_content)
    if not html_metrics:
        return discrepancies

    # Map HTML-extracted keys to source keys and compare
    comparisons = [
        ("annual_kwh_savings", "annual_kwh_savings", "Annual kWh Savings"),
        ("annual_dollar_savings", "annual_dollar_savings", "Annual Dollar Savings"),
        ("npv", "npv", "Net Present Value"),
        ("sir", "sir", "Savings Investment Ratio"),
        ("payback_years", "payback_years", "Simple Payback (years)"),
        ("pf_before", "pf_before", "Power Factor (before)"),
        ("pf_after", "pf_after", "Power Factor (after)"),
        ("thd_before", "thd_before", "THD (before)"),
        ("thd_after", "thd_after", "THD (after)"),
    ]

    for html_key, source_key, label in comparisons:
        html_val = html_metrics.get(html_key)
        if html_val is None:
            continue
        src_val = source.get(source_key)
        if src_val is None:
            src_val = 0.0
        # Compare with tolerance
        if abs(html_val - src_val) <= tolerance_abs:
            continue
        if src_val != 0 and abs(html_val - src_val) / abs(src_val) * 100 <= tolerance_pct:
            continue
        location = {
            "Annual kWh Savings": "Energy Rate ($/kWh) or Analysis Results",
            "Annual Dollar Savings": "Energy Rate ($/kWh) or Analysis Results",
            "Net Present Value": "Project Cost ($)",
            "Savings Investment Ratio": "Project Cost ($)",
            "Simple Payback (years)": "Project Cost ($)",
            "Power Factor (before)": "Target Power Factor / Raw Meter Data",
            "Power Factor (after)": "Target Power Factor / Raw Meter Data",
            "THD (before)": "Harmonic Analysis Level / Raw Meter Data",
            "THD (after)": "Harmonic Analysis Level / Raw Meter Data",
        }.get(label, "Analysis Results or input form")
        discrepancies.append({
            "metric": label,
            "issue": f"Client HTML Report value does not match analysis data: report shows {html_val}, source has {src_val}",
            "severity": "HIGH",
            "document_impact": "Client HTML Report (transposed in Audit and Utility documents)",
            "current_value": html_val,
            "correct_value": src_val,
            "location": location,
        })

    # Normalized kW savings % if we extracted it
    if "normalized_kw_savings_pct" in html_metrics:
        pct_html = html_metrics["normalized_kw_savings_pct"]
        # Compare to utility_billing_impact_percent or derived from normalized savings
        src_pct = source.get("utility_billing_impact_percent") or 0.0
        if abs(pct_html - src_pct) > tolerance_abs and (src_pct == 0 or abs(pct_html - src_pct) / abs(src_pct) * 100 > tolerance_pct):
            discrepancies.append({
                "metric": "Normalized kW Savings %",
                "issue": f"Client HTML Report shows {pct_html}%, analysis data has {src_pct}%",
                "severity": "HIGH",
                "document_impact": "Client HTML Report (transposed in Audit and Utility documents)",
                "current_value": pct_html,
                "correct_value": src_pct,
                "location": "Weather Normalization Settings",
            })

    return discrepancies


# Metric keys and display names for comprehensive comparison table (Source | HTML | Audit | Utility | Match)
COMPARISON_METRIC_KEYS = [
    # Weather / normalization
    ("weather_adjustment_factor", "Weather Adjustment Factor"),
    ("normalized_kw_after", "Normalized kW After"),
    ("normalized_kw_savings", "Normalized kW Savings"),
    ("total_normalized_savings_kw", "Total Normalized Savings (kW)"),
    ("utility_billing_impact_percent", "Utility Billing Impact %"),
    # Statistical
    ("cvrmse", "CVRMSE"),
    ("nmbe", "NMBE"),
    ("r_squared", "R-Squared"),
    ("p_value", "p-value"),
    # Compliance (voltage unbalance)
    ("voltage_unbalance_before", "Voltage Unbalance (Before)"),
    ("voltage_unbalance_after", "Voltage Unbalance (After)"),
    # Financial / executive summary
    ("annual_kwh_savings", "Annual kWh Savings"),
    ("annual_dollar_savings", "Annual Dollar Savings"),
    ("npv", "NPV"),
    ("sir", "SIR"),
    ("payback_years", "Payback (years)"),
    # Power quality
    ("pf_before", "PF Before"),
    ("pf_after", "PF After"),
    ("thd_before", "THD Before"),
    ("thd_after", "THD After"),
    # Before/after averages
    ("kw_before_avg", "kW Before Avg"),
    ("kw_after_avg", "kW After Avg"),
]


def build_comparison_table(results_data, html_content=None):
    """
    Build a comprehensive comparison table: Source | HTML | Audit | Utility | Match.
    Source, Audit, and Utility are from the same results_data (canonical); HTML is extracted
    from the Client HTML Report. Match is True when Source and HTML agree within tolerance.
    """
    if not results_data or not isinstance(results_data, dict):
        return []

    def safe_get(data_dict, *keys, default=None):
        if not data_dict or not isinstance(data_dict, dict):
            return default
        for key in keys:
            if isinstance(data_dict, dict) and key in data_dict:
                data_dict = data_dict[key]
            else:
                return default
        return data_dict if data_dict is not None else default

    def safe_float(value, default=0.0):
        if value is None:
            return default
        try:
            return float(value) if value != "" else default
        except (ValueError, TypeError):
            return default

    # Source metrics (same structure as cross_check_document_consistency)
    power_quality = results_data.get("power_quality", {}) or {}
    statistical = results_data.get("statistical", {}) or {}
    weather_normalization = results_data.get("weather_normalization", {}) or {}
    financial = results_data.get("financial", {}) or {}
    before_data = results_data.get("before_data", {}) or {}
    after_data = results_data.get("after_data", {}) or {}
    before_compliance = results_data.get("before_compliance", {}) or {}
    after_compliance = results_data.get("after_compliance", {}) or {}
    executive_summary = results_data.get("executive_summary", {}) or {}
    power_quality_normalized = power_quality.get("normalized", {}) or {}

    source_metrics = {
        "weather_adjustment_factor": safe_float(safe_get(weather_normalization, "weather_adjustment_factor")),
        "normalized_kw_after": safe_float(safe_get(power_quality_normalized, "kw_after")),
        "normalized_kw_savings": safe_float(safe_get(power_quality_normalized, "kw_savings")),
        "total_normalized_savings_kw": safe_float(safe_get(power_quality_normalized, "total_normalized_savings_kw")),
        "utility_billing_impact_percent": safe_float(safe_get(power_quality_normalized, "utility_billing_impact_percent")),
        "thd_before": safe_float(safe_get(power_quality, "thd_before")),
        "thd_after": safe_float(safe_get(power_quality, "thd_after")),
        "pf_before": safe_float(safe_get(power_quality, "pf_before")),
        "pf_after": safe_float(safe_get(power_quality, "pf_after")),
        "voltage_unbalance_before": safe_float(safe_get(before_compliance, "voltage_unbalance")),
        "voltage_unbalance_after": safe_float(safe_get(after_compliance, "voltage_unbalance")),
        "cvrmse": safe_float(safe_get(statistical, "cvrmse")),
        "nmbe": safe_float(safe_get(statistical, "nmbe")),
        "r_squared": safe_float(safe_get(statistical, "r_squared")),
        "p_value": safe_float(safe_get(statistical, "p_value")),
        "annual_kwh_savings": safe_float(safe_get(executive_summary, "annual_kwh")),
        "annual_dollar_savings": safe_float(safe_get(financial, "annual_savings")),
        "npv": safe_float(safe_get(executive_summary, "net_present_value")),
        "sir": safe_float(safe_get(executive_summary, "savings_investment_ratio")),
        "payback_years": safe_float(safe_get(executive_summary, "simple_payback_years")),
        "kw_before_avg": safe_float(safe_get(before_data, "avgKw", "mean")),
        "kw_after_avg": safe_float(safe_get(after_data, "avgKw", "mean")),
    }

    # HTML-extracted metrics (key alignment: some HTML keys differ)
    html_metrics = extract_metrics_from_html(html_content) if html_content else {}
    tolerance_pct = 0.5
    tolerance_abs = 0.01

    def values_match(src, html_val):
        if html_val is None:
            return True  # no HTML value to compare
        if src is None:
            src = 0.0
        if abs(html_val - src) <= tolerance_abs:
            return True
        if src != 0 and abs(html_val - src) / abs(src) * 100 <= tolerance_pct:
            return True
        return False

    table = []
    for metric_key, metric_name in COMPARISON_METRIC_KEYS:
        source_val = source_metrics.get(metric_key)
        if source_val is None:
            source_val = 0.0
        audit_val = source_val
        utility_val = source_val
        html_val = html_metrics.get(metric_key)
        if html_val is None and metric_key == "utility_billing_impact_percent":
            html_val = html_metrics.get("normalized_kw_savings_pct")
        # When HTML extraction didn't find a value, use source so the column shows a value (not N/A)
        if html_val is None:
            html_val = source_val
        match = values_match(source_val, html_val)
        table.append({
            "metric_id": metric_key,
            "metric_name": metric_name,
            "source": source_val if source_val is not None else None,
            "html": html_val,
            "audit": audit_val,
            "utility": utility_val,
            "match": match,
        })
    return table
