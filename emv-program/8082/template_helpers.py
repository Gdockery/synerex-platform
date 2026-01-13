#!/usr/bin/env python3
"""
Template Helper Functions

This module contains extracted template processing functions that were
duplicated throughout the main application. These functions provide a
unified template processing interface for HTML report generation.
"""

import logging
from typing import Dict, List, Any, Optional, Union
from pathlib import Path

logger = logging.getLogger(__name__)

class TemplateProcessor:
    """Unified template processing framework"""
    
    def __init__(self):
        self.template_vars = {}
        self.replacement_count = 0
    
    def set_template_variables(self, variables: Dict[str, Any]) -> None:
        """Set all template variables at once"""
        self.template_vars.update(variables)
        logger.debug(f"Set {len(variables)} template variables")
    
    def add_variable(self, placeholder: str, value: Any) -> None:
        """Add single template variable"""
        self.template_vars[placeholder] = value
        logger.debug(f"Added template variable: {placeholder}")
    
    def process_template(self, html_content: str) -> str:
        """Process template with all variables in one pass"""
        if not html_content:
            logger.warning("Empty HTML content provided")
            return html_content
        
        original_content = html_content
        self.replacement_count = 0
        
        for placeholder, value in self.template_vars.items():
            if placeholder in html_content:
                html_content = html_content.replace(placeholder, str(value))
                self.replacement_count += 1
                logger.debug(f"Replaced {placeholder} with {value}")
        
        logger.info(f"Processed template with {self.replacement_count} replacements")
        return html_content
    
    def clear_variables(self) -> None:
        """Clear all template variables"""
        self.template_vars.clear()
        self.replacement_count = 0
        logger.debug("Cleared all template variables")
    
    def get_replacement_count(self) -> int:
        """Get number of replacements made in last processing"""
        return self.replacement_count

class HTMLTemplateProcessor(TemplateProcessor):
    """Specialized HTML template processor"""
    
    def __init__(self):
        super().__init__()
        self.template_cache = {}
    
    def load_template(self, template_path: str) -> str:
        """Load HTML template from file"""
        try:
            template_file = Path(template_path)
            if template_file.exists():
                content = template_file.read_text(encoding='utf-8')
                self.template_cache[template_path] = content
                logger.info(f"Loaded template from {template_path}")
                return content
            else:
                logger.error(f"Template file not found: {template_path}")
                return ""
        except Exception as e:
            logger.error(f"Error loading template {template_path}: {e}")
            return ""
    
    def get_cached_template(self, template_path: str) -> str:
        """Get cached template content"""
        return self.template_cache.get(template_path, "")
    
    def process_html_template(self, template_path: str, variables: Dict[str, Any]) -> str:
        """Process HTML template with variables"""
        # Load template if not cached
        if template_path not in self.template_cache:
            self.load_template(template_path)
        
        template_content = self.get_cached_template(template_path)
        if not template_content:
            logger.error(f"Template content not available: {template_path}")
            return ""
        
        # Set variables and process
        self.set_template_variables(variables)
        processed_content = self.process_template(template_content)
        
        return processed_content

class ReportTemplateProcessor(HTMLTemplateProcessor):
    """Specialized report template processor"""
    
    def __init__(self):
        super().__init__()
        self.report_sections = {}
    
    def add_financial_data(self, financial_data: Dict[str, Any]) -> None:
        """Add financial data to template variables"""
        financial_vars = {
            "{{TOTAL_ATTRIBUTED_DOLLARS}}": f"${financial_data.get('total_savings', 0):,.0f}",
            "{{ENERGY_DOLLARS}}": f"${financial_data.get('energy_dollars', 0):,.2f}",
            "{{DEMAND_DOLLARS}}": f"${financial_data.get('demand_dollars', 0):,.2f}",
            "{{PF_DOLLARS}}": f"${financial_data.get('pf_dollars', 0):,.2f}",
            "{{CP_DOLLARS}}": f"${financial_data.get('cp_dollars', 0):,.2f}",
            "{{OM_DOLLARS}}": f"${financial_data.get('om_dollars', 0):,.2f}",
            "{{ENVELOPE_DOLLARS}}": f"${financial_data.get('envelope_dollars', 0):,.2f}",
        }
        self.set_template_variables(financial_vars)
    
    def add_technical_data(self, technical_data: Dict[str, Any]) -> None:
        """Add technical data to template variables"""
        technical_vars = {
            "{{IEEE_519_ISC_IL_RATIO}}": f"{technical_data.get('isc_il_ratio', 0):.1f}",
            "{{IEEE_519_TDD_LIMIT}}": f"{technical_data.get('ieee_tdd_limit', 5.0):.1f}",
            "{{IEEE_519_BEFORE_TDD}}": f"{technical_data.get('thd_before', 0):.1f}%",
            "{{IEEE_519_AFTER_TDD}}": f"{technical_data.get('thd_after', 0):.1f}%",
            "{{NEMA_MG1_BEFORE_IMBALANCE}}": f"{technical_data.get('imbalance_before', 0):.2f}%",
            "{{NEMA_MG1_AFTER_IMBALANCE}}": f"{technical_data.get('imbalance_after', 0):.2f}%",
        }
        self.set_template_variables(technical_vars)
    
    def add_statistical_data(self, statistical_data: Dict[str, Any]) -> None:
        """Add statistical data to template variables"""
        statistical_vars = {
            "{{ASHRAE_CVRMSE}}": f"{statistical_data.get('cvrmse', 0):.3f}",
            "{{ASHRAE_NMBE}}": f"{statistical_data.get('nmbe', 0):.3f}",
            "{{ASHRAE_R_SQUARED}}": f"{statistical_data.get('r_squared', 0):.3f}",
            "{{COHENS_D}}": f"{statistical_data.get('cohens_d', 0):.3f}",
            "{{T_STATISTIC}}": f"{statistical_data.get('t_statistic', 0):.2f}",
            "{{RELATIVE_PRECISION}}": f"{statistical_data.get('relative_precision', 0):.2f}%",
        }
        self.set_template_variables(statistical_vars)
    
    def add_compliance_data(self, compliance_data: Dict[str, Any]) -> None:
        """Add compliance data to template variables"""
        compliance_vars = {
            "{{BEFORE_CV}}": f"{compliance_data.get('before_cv', 0):.2f}%",
            "{{AFTER_CV}}": f"{compliance_data.get('after_cv', 0):.2f}%",
            "{{IPMVP_STATUS}}": compliance_data.get('ipmvp_status', '✗ FAIL'),
            "{{IPMVP_VALUE}}": compliance_data.get('ipmvp_value', 'N/A'),
            "{{ANSI_C12_STATUS}}": compliance_data.get('ansi_c12_status', '✗ FAIL'),
            "{{ANSI_C12_VALUE}}": compliance_data.get('ansi_c12_value', 'N/A'),
        }
        self.set_template_variables(compliance_vars)
    
    def add_energy_data(self, energy_data: Dict[str, Any]) -> None:
        """Add energy data to template variables"""
        energy_vars = {
            "{{ENERGY_KWH}}": f"{energy_data.get('energy_kwh', 0):,.2f} kWh",
            "{{BASE_KWH}}": f"{energy_data.get('base_kwh', 0):,.2f} kWh",
            "{{NETWORK_KWH}}": f"{energy_data.get('network_kwh', 0):,.2f} kWh",
            "{{ENERGY_RATE}}": f"${energy_data.get('energy_rate', 0):.4f}/kWh",
            "{{KW_SAVINGS}}": f"{energy_data.get('kw_savings', 0):.2f} kW",
            "{{CP_KW}}": f"{energy_data.get('cp_kw', 0):.2f} kW",
        }
        self.set_template_vars(energy_vars)
    
    def add_power_data(self, power_data: Dict[str, Any]) -> None:
        """Add power data to template variables"""
        power_vars = {
            "{{CURRENT_BEFORE}}": f"{power_data.get('current_before', 0):.1f} A",
            "{{CURRENT_AFTER}}": f"{power_data.get('current_after', 0):.1f} A",
            "{{VOLTAGE_BEFORE}}": f"{power_data.get('voltage_before', 0):.0f} V",
            "{{VOLTAGE_AFTER}}": f"{power_data.get('voltage_after', 0):.0f} V",
            "{{PF_BEFORE}}": f"{power_data.get('pf_before', 0):.2f}",
            "{{PF_AFTER}}": f"{power_data.get('pf_after', 0):.2f}",
        }
        self.set_template_variables(power_vars)
    
    def process_report_template(self, template_path: str, report_data: Dict[str, Any]) -> str:
        """Process complete report template with all data types"""
        # Clear existing variables
        self.clear_variables()
        
        # Add all data types
        if 'financial' in report_data:
            self.add_financial_data(report_data['financial'])
        
        if 'technical' in report_data:
            self.add_technical_data(report_data['technical'])
        
        if 'statistical' in report_data:
            self.add_statistical_data(report_data['statistical'])
        
        if 'compliance' in report_data:
            self.add_compliance_data(report_data['compliance'])
        
        if 'energy' in report_data:
            self.add_energy_data(report_data['energy'])
        
        if 'power' in report_data:
            self.add_power_data(report_data['power'])
        
        # Add any additional variables
        if 'additional' in report_data:
            self.set_template_variables(report_data['additional'])
        
        # Process template
        return self.process_html_template(template_path, {})

# Convenience functions for backward compatibility
def process_html_template(html_content: str, variables: Dict[str, Any]) -> str:
    """Process HTML template with variables - backward compatibility"""
    processor = TemplateProcessor()
    processor.set_template_variables(variables)
    return processor.process_template(html_content)

def replace_template_variables(html_content: str, variables: Dict[str, Any]) -> str:
    """Replace template variables in HTML content - backward compatibility"""
    processor = TemplateProcessor()
    processor.set_template_variables(variables)
    return processor.process_template(html_content)

def load_html_template(template_path: str) -> str:
    """Load HTML template from file - backward compatibility"""
    processor = HTMLTemplateProcessor()
    return processor.load_template(template_path)

def process_report_template(template_path: str, report_data: Dict[str, Any]) -> str:
    """Process report template with all data types - backward compatibility"""
    processor = ReportTemplateProcessor()
    return processor.process_report_template(template_path, report_data)

# Template variable constants
class TemplateVariables:
    """Constants for common template variables"""
    
    # Financial variables
    TOTAL_ATTRIBUTED_DOLLARS = "{{TOTAL_ATTRIBUTED_DOLLARS}}"
    ENERGY_DOLLARS = "{{ENERGY_DOLLARS}}"
    DEMAND_DOLLARS = "{{DEMAND_DOLLARS}}"
    PF_DOLLARS = "{{PF_DOLLARS}}"
    CP_DOLLARS = "{{CP_DOLLARS}}"
    OM_DOLLARS = "{{OM_DOLLARS}}"
    ENVELOPE_DOLLARS = "{{ENVELOPE_DOLLARS}}"
    
    # Technical variables
    IEEE_519_ISC_IL_RATIO = "{{IEEE_519_ISC_IL_RATIO}}"
    IEEE_519_TDD_LIMIT = "{{IEEE_519_TDD_LIMIT}}"
    IEEE_519_BEFORE_TDD = "{{IEEE_519_BEFORE_TDD}}"
    IEEE_519_AFTER_TDD = "{{IEEE_519_AFTER_TDD}}"
    NEMA_MG1_BEFORE_IMBALANCE = "{{NEMA_MG1_BEFORE_IMBALANCE}}"
    NEMA_MG1_AFTER_IMBALANCE = "{{NEMA_MG1_AFTER_IMBALANCE}}"
    
    # Statistical variables
    ASHRAE_CVRMSE = "{{ASHRAE_CVRMSE}}"
    ASHRAE_NMBE = "{{ASHRAE_NMBE}}"
    ASHRAE_R_SQUARED = "{{ASHRAE_R_SQUARED}}"
    COHENS_D = "{{COHENS_D}}"
    T_STATISTIC = "{{T_STATISTIC}}"
    RELATIVE_PRECISION = "{{RELATIVE_PRECISION}}"
    
    # Compliance variables
    BEFORE_CV = "{{BEFORE_CV}}"
    AFTER_CV = "{{AFTER_CV}}"
    IPMVP_STATUS = "{{IPMVP_STATUS}}"
    IPMVP_VALUE = "{{IPMVP_VALUE}}"
    ANSI_C12_STATUS = "{{ANSI_C12_STATUS}}"
    ANSI_C12_VALUE = "{{ANSI_C12_VALUE}}"
    
    # Energy variables
    ENERGY_KWH = "{{ENERGY_KWH}}"
    BASE_KWH = "{{BASE_KWH}}"
    NETWORK_KWH = "{{NETWORK_KWH}}"
    ENERGY_RATE = "{{ENERGY_RATE}}"
    KW_SAVINGS = "{{KW_SAVINGS}}"
    CP_KW = "{{CP_KW}}"
    
    # Power variables
    CURRENT_BEFORE = "{{CURRENT_BEFORE}}"
    CURRENT_AFTER = "{{CURRENT_AFTER}}"
    VOLTAGE_BEFORE = "{{VOLTAGE_BEFORE}}"
    VOLTAGE_AFTER = "{{VOLTAGE_AFTER}}"
    PF_BEFORE = "{{PF_BEFORE}}"
    PF_AFTER = "{{PF_AFTER}}"
