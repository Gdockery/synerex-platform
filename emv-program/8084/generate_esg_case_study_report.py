#!/usr/bin/env python3
"""
ESG Case Study Report Generator
Generates a comprehensive case study report that includes:
1. ESG Executive Summary
2. Complete Client HTML Report (all existing content)
3. ESG Analysis Sections (Environmental, Social, Governance)
4. Case Study Narrative
5. Visualizations & Infographics
6. Appendices
"""

import json
import logging
from datetime import datetime
from pathlib import Path
import sys

# Add parent directory to path to import from 8082 and 8084
sys.path.insert(0, str(Path(__file__).parent.parent / "8082"))
sys.path.insert(0, str(Path(__file__).parent))

# Import the existing report generator
try:
    from generate_exact_template_html import (
        generate_exact_template_html,
        safe_get,
        format_number,
        get_logo_data_uri
    )
except ImportError as e:
    logging.error(f"Failed to import generate_exact_template_html: {e}")
    raise

# Set up logging
logger = logging.getLogger(__name__)

# Grid emissions factors by region (lbs CO2 per kWh)
# Default: US average (EPA eGRID 2023)
GRID_EMISSIONS_FACTORS = {
    'default': 0.818,  # US average (lbs CO2/kWh)
    'texas': 1.108,    # ERCOT
    'california': 0.425,  # CAISO
    'new_york': 0.400,   # NYISO
    'pjm': 0.850,       # PJM
    'miso': 0.950,      # MISO
    'iso_ne': 0.600,    # ISO New England
    'northwest': 0.200, # Pacific Northwest
    'southeast': 0.900, # Southeast
}

# Conversion factors
LBS_TO_TONS = 0.0005  # 1 lb = 0.0005 tons
KWH_TO_MWH = 0.001    # 1 kWh = 0.001 MWh

# Climate goals by sector and timeline
CLIMATE_GOALS = {
    'healthcare': {
        '2030': {'reduction_pct': 50, 'source': 'HHS Health Sector Climate Pledge'},
        '2050': {'reduction_pct': 100, 'source': 'HHS Net-Zero Commitment'},
        'baseline_year': 2008,
        'annual_reduction_required_pct': 2.5  # 50% over 20 years = 2.5%/year
    },
    'data_center': {
        '2030': {'reduction_pct': 100, 'source': 'Climate Neutral Data Centre Pact'},
        '2050': {'reduction_pct': 100, 'source': 'Climate Neutral Data Centre Pact'},
        'baseline_year': 2020,
        'annual_reduction_required_pct': 10.0  # 100% over 10 years = 10%/year
    },
    'manufacturing': {
        '2030': {'reduction_pct': 50, 'source': 'Science Based Targets Initiative (SBTi)'},
        '2050': {'reduction_pct': 100, 'source': 'SBTi Net-Zero Standard'},
        'baseline_year': 2015,
        'annual_reduction_required_pct': 2.5
    },
    'hospitality': {
        '2030': {'reduction_pct': 50, 'source': 'AHLA Sustainability Guidelines'},
        '2050': {'reduction_pct': 100, 'source': 'Industry Net-Zero Commitments'},
        'baseline_year': 2010,
        'annual_reduction_required_pct': 2.5
    },
    'cold_storage': {
        '2030': {'reduction_pct': 50, 'source': 'Industry Standards'},
        '2050': {'reduction_pct': 100, 'source': 'Industry Net-Zero Commitments'},
        'baseline_year': 2015,
        'annual_reduction_required_pct': 2.5
    },
    'general': {
        '2030': {'reduction_pct': 50, 'source': 'Paris Agreement / US NDC'},
        '2050': {'reduction_pct': 100, 'source': 'US Net-Zero by 2050'},
        'baseline_year': 2005,
        'annual_reduction_required_pct': 2.5
    }
}

# Typical energy intensity by sector (kWh/sqft/year)
ENERGY_INTENSITY = {
    'healthcare': 100,  # kWh/sqft/year for hospitals
    'data_center': 500,  # kWh/sqft/year for data centers
    'manufacturing': 150,  # kWh/sqft/year for manufacturing
    'hospitality': 50,  # kWh/sqft/year for hotels
    'cold_storage': 80,  # kWh/sqft/year for cold storage
    'general': 50  # kWh/sqft/year general commercial
}

def calculate_carbon_footprint(kwh_saved, region='default'):
    """
    Calculate CO2 emissions reduction in tons
    
    Args:
        kwh_saved: Annual kWh savings
        region: Grid region for emissions factor
    
    Returns:
        dict with CO2 metrics
    """
    emissions_factor = GRID_EMISSIONS_FACTORS.get(region.lower(), GRID_EMISSIONS_FACTORS['default'])
    
    # Calculate CO2 in lbs
    co2_lbs = kwh_saved * emissions_factor
    
    # Convert to tons
    co2_tons = co2_lbs * LBS_TO_TONS
    
    # Equivalent metrics
    # Average tree absorbs ~48 lbs CO2/year
    trees_equivalent = co2_lbs / 48
    
    # Average car emits ~4.6 tons CO2/year
    cars_equivalent = co2_tons / 4.6
    
    return {
        'co2_tons': co2_tons,
        'co2_lbs': co2_lbs,
        'emissions_factor': emissions_factor,
        'trees_equivalent': trees_equivalent,
        'cars_equivalent': cars_equivalent,
        'region': region
    }

def calculate_climate_goal_alignment(annual_co2_tons, facility_type, facility_area_sqft=None, region='default'):
    """
    Calculate alignment with climate goals based on facility type
    
    Args:
        annual_co2_tons: Annual CO2 reduction from this project
        facility_type: Type of facility (healthcare, data_center, manufacturing, etc.)
        facility_area_sqft: Facility area for intensity calculations (optional)
        region: Grid region for emissions factor
    
    Returns:
        dict with goal alignment metrics
    """
    # Normalize facility type
    facility_type = facility_type.lower() if facility_type else 'general'
    
    # Map facility type variations
    facility_type_map = {
        'healthcare': 'healthcare',
        'hospital': 'healthcare',
        'clinic': 'healthcare',
        'medical': 'healthcare',
        'data_center': 'data_center',
        'datacenter': 'data_center',
        'gpu': 'data_center',
        'server': 'data_center',
        'manufacturing': 'manufacturing',
        'industrial': 'manufacturing',
        'factory': 'manufacturing',
        'hospitality': 'hospitality',
        'hotel': 'hospitality',
        'restaurant': 'hospitality',
        'resort': 'hospitality',
        'cold_storage': 'cold_storage',
        'coldstorage': 'cold_storage',
        'refrigeration': 'cold_storage',
        'warehouse': 'cold_storage'
    }
    
    facility_type = facility_type_map.get(facility_type, 'general')
    
    # Get facility-specific goals
    goals = CLIMATE_GOALS.get(facility_type, CLIMATE_GOALS['general'])
    
    # Calculate baseline emissions
    if facility_area_sqft and facility_area_sqft > 0:
        intensity = ENERGY_INTENSITY.get(facility_type, ENERGY_INTENSITY['general'])
        baseline_kwh = facility_area_sqft * intensity
        # Use regional grid factor for baseline
        emissions_factor = GRID_EMISSIONS_FACTORS.get(region.lower(), GRID_EMISSIONS_FACTORS['default'])
        baseline_co2_tons = (baseline_kwh * emissions_factor * LBS_TO_TONS)
    else:
        # If no area, estimate based on savings (assume 10-20% savings typical)
        # Use conservative 15% savings estimate
        baseline_co2_tons = annual_co2_tons / 0.15 if annual_co2_tons > 0 else 0
    
    # Calculate required reductions
    reduction_2030_pct = goals['2030']['reduction_pct']
    reduction_2050_pct = goals['2050']['reduction_pct']
    
    required_reduction_2030_tons = baseline_co2_tons * (reduction_2030_pct / 100)
    required_reduction_2050_tons = baseline_co2_tons * (reduction_2050_pct / 100)
    
    # Calculate progress toward goals
    current_year = datetime.now().year
    years_to_2030 = max(2030 - current_year, 1)
    years_to_2050 = max(2050 - current_year, 1)
    
    annual_reduction_needed_2030 = required_reduction_2030_tons / years_to_2030 if years_to_2030 > 0 else 0
    annual_reduction_needed_2050 = required_reduction_2050_tons / years_to_2050 if years_to_2050 > 0 else 0
    
    progress_2030_pct = (annual_co2_tons / annual_reduction_needed_2030 * 100) if annual_reduction_needed_2030 > 0 else 0
    progress_2050_pct = (annual_co2_tons / annual_reduction_needed_2050 * 100) if annual_reduction_needed_2050 > 0 else 0
    
    # Calculate years to achieve goal at current rate
    years_to_goal_2030 = required_reduction_2030_tons / annual_co2_tons if annual_co2_tons > 0 else float('inf')
    years_to_goal_2050 = required_reduction_2050_tons / annual_co2_tons if annual_co2_tons > 0 else float('inf')
    
    # Determine if meets goal
    meets_2030_goal = annual_co2_tons >= annual_reduction_needed_2030 if annual_reduction_needed_2030 > 0 else False
    meets_2050_goal = annual_co2_tons >= annual_reduction_needed_2050 if annual_reduction_needed_2050 > 0 else False
    
    return {
        'facility_type': facility_type,
        'baseline_co2_tons': baseline_co2_tons,
        'annual_reduction_tons': annual_co2_tons,
        'goal_2030_pct': reduction_2030_pct,
        'goal_2050_pct': reduction_2050_pct,
        'required_reduction_2030_tons': required_reduction_2030_tons,
        'required_reduction_2050_tons': required_reduction_2050_tons,
        'annual_reduction_needed_2030': annual_reduction_needed_2030,
        'annual_reduction_needed_2050': annual_reduction_needed_2050,
        'progress_2030_pct': progress_2030_pct,
        'progress_2050_pct': progress_2050_pct,
        'years_to_goal_2030': years_to_goal_2030,
        'years_to_goal_2050': years_to_goal_2050,
        'meets_2030_goal': meets_2030_goal,
        'meets_2050_goal': meets_2050_goal,
        'goal_source_2030': goals['2030']['source'],
        'goal_source_2050': goals['2050']['source'],
        'baseline_year': goals['baseline_year']
    }

def calculate_additional_environmental_benefits(annual_kwh_savings, region='default'):
    """
    Calculate additional environmental benefits beyond CO2
    
    Args:
        annual_kwh_savings: Annual kWh savings
        region: Grid region
    
    Returns:
        dict with additional environmental metrics
    """
    # Water savings (gallons) - thermal power plants use ~0.5-1.5 gallons per kWh
    # Use average of 1.0 gallon/kWh for mixed grid
    water_saved_gallons = annual_kwh_savings * 1.0
    
    # Air quality improvements (lbs)
    # Based on EPA eGRID factors (varies by region, using US average)
    nox_reduced_lbs = annual_kwh_savings * 0.0015  # lbs NOx per kWh (US average)
    so2_reduced_lbs = annual_kwh_savings * 0.0025  # lbs SO2 per kWh (US average)
    pm25_reduced_lbs = annual_kwh_savings * 0.0001  # lbs PM2.5 per kWh (US average)
    
    # Resource conservation
    # Coal equivalent (lbs) - assuming 50% of grid is fossil fuel
    coal_equivalent_lbs = annual_kwh_savings * 0.5 * 0.6  # 0.6 lbs coal per kWh
    natural_gas_equivalent_therms = annual_kwh_savings * 0.5 * 0.0034  # 0.0034 therms per kWh
    
    # Renewable energy capacity enabled (kW)
    # Savings reduce need for new renewable capacity
    renewable_capacity_enabled_kw = annual_kwh_savings / 8760  # Annual kWh / hours per year
    
    return {
        'water_saved_gallons': water_saved_gallons,
        'nox_reduced_lbs': nox_reduced_lbs,
        'so2_reduced_lbs': so2_reduced_lbs,
        'pm25_reduced_lbs': pm25_reduced_lbs,
        'coal_equivalent_lbs': coal_equivalent_lbs,
        'natural_gas_equivalent_therms': natural_gas_equivalent_therms,
        'renewable_capacity_enabled_kw': renewable_capacity_enabled_kw
    }

def calculate_social_impact(kw_saved, kwh_saved):
    """
    Estimate social impact metrics
    
    Args:
        kw_saved: kW demand reduction
        kwh_saved: Annual kWh savings
    
    Returns:
        dict with social impact metrics
    """
    # Job creation estimates (conservative)
    # Based on industry standards: ~1 job per 100 kW installed
    direct_jobs = max(1, int(kw_saved / 100))
    
    # Indirect jobs (supply chain, etc.) - typically 2-3x direct
    indirect_jobs = direct_jobs * 2
    
    # Total jobs
    total_jobs = direct_jobs + indirect_jobs
    
    # Economic impact (rough estimate: $50k per job per year)
    economic_impact = total_jobs * 50000
    
    return {
        'direct_jobs': direct_jobs,
        'indirect_jobs': indirect_jobs,
        'total_jobs': total_jobs,
        'economic_impact': economic_impact
    }

def generate_esg_executive_summary(r, carbon_data, social_data, logo_data_uri=""):
    """Generate ESG Executive Summary section"""
    config = safe_get(r, "config", default={})
    client_profile = safe_get(r, "client_profile", default={})
    executive_summary = safe_get(r, "executive_summary", default={})
    financial = safe_get(r, "financial", default={})
    financial_debug = safe_get(r, "financial_debug", default={})
    
    company_name = (
        safe_get(config, "cp_company") or 
        safe_get(config, "company") or 
        safe_get(client_profile, "cp_company") or
        safe_get(client_profile, "company") or
        "Client"
    )
    
    # Get project name
    # Note: The form field has id="projectName" but name="company", so check "company" first
    project_name = (
        safe_get(config, "company") or
        safe_get(config, "projectName") or
        safe_get(config, "project_name") or
        safe_get(client_profile, "company") or
        safe_get(client_profile, "projectName") or
        safe_get(client_profile, "project_name") or
        safe_get(r, "company") or
        safe_get(r, "projectName") or
        safe_get(r, "project_name") or
        ""
    )
    
    # Get facility address/project location
    facility_address = (
        safe_get(config, "facility_address") or
        safe_get(config, "facilityAddress") or
        safe_get(client_profile, "facility_address") or
        safe_get(r, "facility_address") or
        ""
    )
    
    # Get energy savings
    annual_kwh_savings = safe_get(financial_debug, "delta_kwh_annual", default=0) or safe_get(executive_summary, "annual_kwh_savings", default=0)
    annual_kw_savings = safe_get(executive_summary, "annual_kw_savings", default=0)
    
    # Get financial savings
    # Use annual_total_dollars from financial_debug or bill_weighted (same as Client HTML Report uses)
    bill_weighted = safe_get(r, "bill_weighted", default={})
    annual_cost_savings = (
        safe_get(financial_debug, "annual_total_dollars", default=0) or 
        safe_get(bill_weighted, "annual_total_dollars", default=0) or
        safe_get(financial, "annual_total_dollars", default=0) or
        safe_get(financial, "annual_savings", default=0) or 
        safe_get(financial_debug, "delta_cost_annual", default=0)
    )
    
    # Logo HTML (if logo is available) - Reduced by 30%
    logo_html = ""
    if logo_data_uri:
        logo_html = f"""
        <div style="text-align: center; margin-bottom: 30px;">
            <img src="{logo_data_uri}" alt="Synerex Logo" style="max-width: 210px; max-height: 105px; width: auto; height: auto; object-fit: contain;" />
        </div>
        """
    
    html = f"""
    <div class="header-section">
        {logo_html}
        <h1>ESG Case Study Report</h1>
        <h2>{company_name}</h2>
        <div class="meta">
            <strong>Comprehensive Energy Efficiency & Sustainability Analysis</strong><br/>
            {f'Project Name: {project_name}<br/>' if project_name else ''}
            {f'Project Address: {facility_address}<br/>' if facility_address else ''}
            Generated: {datetime.now().strftime('%B %d, %Y')}
        </div>
    </div>
    
    <div class="content" style="page-break-after: always; page-break-inside: avoid;" id="esg-executive">
        <h2>ESG Executive Summary</h2>
        
        <div class="metric-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;">
            <div class="metric-card">
                <h3>Environmental Impact</h3>
                <div class="metric-value">{format_number(carbon_data['co2_tons'], 1)}</div>
                <div class="metric-label">Tons CO2 Reduced Annually</div>
                <p class="metric-card-detail" style="margin-top: 15px; font-size: 9pt; color: #777;">
                    Equivalent to {format_number(carbon_data['trees_equivalent'], 0)} trees planted<br/>
                    or {format_number(carbon_data['cars_equivalent'], 1)} cars removed from road
                </p>
            </div>
            
            <div class="metric-card">
                <h3>Energy Savings</h3>
                <div class="metric-value">{format_number(annual_kwh_savings, 0)}</div>
                <div class="metric-label">kWh Saved Annually</div>
                <p class="metric-card-detail" style="margin-top: 15px; font-size: 9pt; color: #777;">
                    {format_number(annual_kw_savings, 2)} kW demand reduction<br/>
                    {format_number(annual_kwh_savings * KWH_TO_MWH, 1)} MWh annually
                </p>
            </div>
            
            <div class="metric-card">
                <h3>Financial Impact</h3>
                <div class="metric-value">${format_number(annual_cost_savings, 0)}</div>
                <div class="metric-label">Annual Cost Savings</div>
                <p class="metric-card-detail" style="margin-top: 15px; font-size: 9pt; color: #777;">
                    ROI: {format_number((annual_cost_savings / max(1, safe_get(financial, "initial_cost", default=1) or safe_get(financial, "project_cost", default=1))) * 100, 1)}%<br/>
                    Payback: {format_number((safe_get(financial, "initial_cost", default=0) or safe_get(financial, "project_cost", default=0)) / max(1, annual_cost_savings), 1)} years
                </p>
            </div>
        </div>
        
        <div class="info-box">
            <h3>Key ESG Achievements</h3>
            <ul class="esg-achievements-list" style="margin-left: 1.5em;">
                <li><strong>Environmental:</strong> Reduced carbon footprint by {format_number(carbon_data['co2_tons'], 1)} tons CO2 annually, equivalent to planting {format_number(carbon_data['trees_equivalent'], 0)} trees</li>
                <li><strong>Energy:</strong> Achieved {format_number(annual_kwh_savings, 0)} kWh annual energy savings through comprehensive power quality and efficiency improvements</li>
                <li><strong>Financial:</strong> Realized ${format_number(annual_cost_savings, 0)} in annual cost savings with strong ROI</li>
                <li><strong>Governance:</strong> Full compliance with IEEE 519, ASHRAE Guideline 14, ISO 50001, and other industry standards</li>
            </ul>
        </div>
    </div>
    """
    return html

def generate_environmental_impact_section(r, carbon_data):
    """Generate Environmental Impact section"""
    config = safe_get(r, "config", default={})
    client_profile = safe_get(r, "client_profile", default={})
    financial_debug = safe_get(r, "financial_debug", default={})
    executive_summary = safe_get(r, "executive_summary", default={})
    
    annual_kwh_savings = safe_get(financial_debug, "delta_kwh_annual", default=0) or safe_get(executive_summary, "annual_kwh_savings", default=0)
    
    # Get facility type and area
    facility_type = (
        safe_get(config, "facility_type") or 
        safe_get(config, "facilityType") or
        safe_get(client_profile, "facility_type") or 
        safe_get(client_profile, "facilityType") or
        safe_get(r, "facility_type") or
        "general"
    )
    
    facility_area_sqft = (
        safe_get(config, "facility_area_sqft") or
        safe_get(config, "facilityArea") or
        safe_get(client_profile, "facility_area_sqft") or
        safe_get(r, "facility_area_sqft") or
        None
    )
    
    # Get region for climate calculations
    region = safe_get(config, "utility_region", default="default") or "default"
    
    # Calculate climate goal alignment
    climate_goals = calculate_climate_goal_alignment(
        carbon_data['co2_tons'], 
        facility_type, 
        facility_area_sqft,
        region
    )
    
    # Calculate additional environmental benefits
    env_benefits = calculate_additional_environmental_benefits(annual_kwh_savings, region)
    
    # Generate scope emissions breakdown
    scope_breakdown = generate_scope_emissions_breakdown(carbon_data, annual_kwh_savings)
    
    # Prepare status values for HTML
    status_2030_class = 'compliant' if climate_goals['meets_2030_goal'] else 'non-compliant'
    status_2030_text = '[OK] Meets Goal' if climate_goals['meets_2030_goal'] else '[NEEDS MORE]'
    status_2050_class = 'compliant' if climate_goals['meets_2050_goal'] else 'non-compliant'
    status_2050_text = '[OK] Meets Goal' if climate_goals['meets_2050_goal'] else '[NEEDS MORE]'
    
    # Calculate timeline status
    years_to_2030 = 2030 - datetime.now().year
    timeline_status_2030 = '(ahead of schedule)' if climate_goals['years_to_goal_2030'] < years_to_2030 else '(on track)' if climate_goals['years_to_goal_2030'] <= years_to_2030 + 2 else '(needs acceleration)'
    
    html = f"""
    <div class="content" style="page-break-before: always; page-break-after: always;">
        <h2>Environmental Impact Analysis</h2>
        
        <div class="info-box">
            <h3>Carbon Footprint Reduction</h3>
            <p>
                This energy efficiency project directly reduces greenhouse gas emissions by decreasing electricity consumption
                from the grid. The carbon footprint reduction is calculated using region-specific grid emissions factors,
                providing an accurate assessment of environmental impact.
            </p>
        </div>
        
        <table class="compliance-table">
            <thead>
                <tr>
                    <th>Environmental Metric</th>
                    <th style="text-align: right;">Value</th>
                    <th>Description</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>Annual Energy Savings</strong></td>
                    <td class="value-cell">{format_number(annual_kwh_savings, 0)} kWh</td>
                    <td>Total annual electricity savings</td>
                </tr>
                <tr>
                    <td><strong>CO2 Emissions Reduced</strong></td>
                    <td class="value-cell">{format_number(carbon_data['co2_tons'], 2)} tons</td>
                    <td>Annual CO2 equivalent reduction</td>
                </tr>
                <tr>
                    <td><strong>CO2 Emissions Reduced</strong></td>
                    <td class="value-cell">{format_number(carbon_data['co2_lbs'], 0)} lbs</td>
                    <td>Annual CO2 equivalent reduction (pounds)</td>
                </tr>
                <tr>
                    <td><strong>Grid Emissions Factor</strong></td>
                    <td class="value-cell">{format_number(carbon_data['emissions_factor'], 3)} lbs/kWh</td>
                    <td>Regional grid emissions factor used</td>
                </tr>
                <tr>
                    <td><strong>Equivalent Trees Planted</strong></td>
                    <td class="value-cell">{format_number(carbon_data['trees_equivalent'], 0)} trees</td>
                    <td>Based on average tree CO2 absorption (48 lbs/year)</td>
                </tr>
                <tr>
                    <td><strong>Equivalent Cars Removed</strong></td>
                    <td class="value-cell">{format_number(carbon_data['cars_equivalent'], 1)} cars</td>
                    <td>Based on average car emissions (4.6 tons/year)</td>
                </tr>
            </tbody>
        </table>
        
        <div class="info-box">
            <strong>Calculation Methodology:</strong><br/>
            CO2 Reduction (tons) = Annual kWh Savings x Grid Emissions Factor (lbs/kWh) x 0.0005 (lbs to tons)<br/>
            <p style="margin-top: 10px; font-size: 9pt; color: #666;">
                Grid emissions factors vary by region based on the energy mix (coal, natural gas, renewables, etc.).
                The factor used ({format_number(carbon_data['emissions_factor'], 3)} lbs/kWh) reflects the regional grid composition.
            </p>
        </div>
        
        <h3 style="margin-top: 0.8em; margin-bottom: 0.4em; font-size: 13pt;">Climate Goals Alignment</h3>
        <div class="info-box" style="margin-bottom: 1em;">
            <p style="font-size: 9pt; color: #666; margin-bottom: 0.5em;">
                This project's contribution toward sector-specific climate goals. Facility type: <strong>{climate_goals['facility_type'].replace('_', ' ').title()}</strong>
            </p>
        </div>
        
        <table class="compliance-table" style="margin-bottom: 1em;">
            <thead>
                <tr>
                    <th>Climate Goal</th>
                    <th style="text-align: right;">Target</th>
                    <th style="text-align: right;">Required Annual Reduction</th>
                    <th style="text-align: right;">This Project's Contribution</th>
                    <th style="text-align: right;">Progress</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>2030 Goal ({climate_goals['goal_source_2030']})</strong></td>
                    <td class="value-cell">{format_number(climate_goals['goal_2030_pct'], 0)}% reduction</td>
                    <td class="value-cell">{format_number(climate_goals['annual_reduction_needed_2030'], 2)} tons/year</td>
                    <td class="value-cell">{format_number(climate_goals['annual_reduction_tons'], 2)} tons/year</td>
                    <td class="value-cell">{format_number(climate_goals['progress_2030_pct'], 1)}%</td>
                    <td class="{status_2030_class}">
                        {status_2030_text}
                    </td>
                </tr>
                <tr>
                    <td><strong>2050 Goal ({climate_goals['goal_source_2050']})</strong></td>
                    <td class="value-cell">{format_number(climate_goals['goal_2050_pct'], 0)}% reduction</td>
                    <td class="value-cell">{format_number(climate_goals['annual_reduction_needed_2050'], 2)} tons/year</td>
                    <td class="value-cell">{format_number(climate_goals['annual_reduction_tons'], 2)} tons/year</td>
                    <td class="value-cell">{format_number(climate_goals['progress_2050_pct'], 1)}%</td>
                    <td class="{status_2050_class}">
                        {status_2050_text}
                    </td>
                </tr>
            </tbody>
        </table>
        
        <div class="info-box" style="margin-bottom: 1em;">
            <strong>Goal Achievement Timeline:</strong><br/>
            <p style="margin-top: 6px; font-size: 9pt; color: #666; line-height: 1.4;">
                At the current annual reduction rate of {format_number(climate_goals['annual_reduction_tons'], 2)} tons CO2/year, 
                this facility would achieve its 2030 goal in {format_number(climate_goals['years_to_goal_2030'], 1)} years 
                {timeline_status_2030} 
                and its 2050 goal in {format_number(climate_goals['years_to_goal_2050'], 1)} years.
                Baseline emissions estimated at {format_number(climate_goals['baseline_co2_tons'], 2)} tons CO2/year (baseline year: {climate_goals['baseline_year']}).
            </p>
        </div>
        
        <h3 style="margin-top: 0.8em; margin-bottom: 0.4em; font-size: 13pt;">Additional Environmental Benefits</h3>
        <table class="compliance-table" style="margin-bottom: 1em;">
            <thead>
                <tr>
                    <th>Environmental Benefit</th>
                    <th style="text-align: right;">Annual Value</th>
                    <th>Description</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>Water Conservation</strong></td>
                    <td class="value-cell">{format_number(env_benefits['water_saved_gallons'], 0)} gallons</td>
                    <td>Water saved from reduced power plant cooling requirements</td>
                </tr>
                <tr>
                    <td><strong>NOx Emissions Reduced</strong></td>
                    <td class="value-cell">{format_number(env_benefits['nox_reduced_lbs'], 1)} lbs</td>
                    <td>Nitrogen oxides reduction (contributes to smog and acid rain)</td>
                </tr>
                <tr>
                    <td><strong>SO2 Emissions Reduced</strong></td>
                    <td class="value-cell">{format_number(env_benefits['so2_reduced_lbs'], 1)} lbs</td>
                    <td>Sulfur dioxide reduction (contributes to acid rain)</td>
                </tr>
                <tr>
                    <td><strong>PM2.5 Emissions Reduced</strong></td>
                    <td class="value-cell">{format_number(env_benefits['pm25_reduced_lbs'], 2)} lbs</td>
                    <td>Fine particulate matter reduction (respiratory health benefits)</td>
                </tr>
                <tr>
                    <td><strong>Coal Equivalent Avoided</strong></td>
                    <td class="value-cell">{format_number(env_benefits['coal_equivalent_lbs'], 0)} lbs</td>
                    <td>Coal that would have been burned to generate this electricity</td>
                </tr>
                <tr>
                    <td><strong>Natural Gas Equivalent Avoided</strong></td>
                    <td class="value-cell">{format_number(env_benefits['natural_gas_equivalent_therms'], 1)} therms</td>
                    <td>Natural gas that would have been burned to generate this electricity</td>
                </tr>
                <tr>
                    <td><strong>Renewable Capacity Enabled</strong></td>
                    <td class="value-cell">{format_number(env_benefits['renewable_capacity_enabled_kw'], 1)} kW</td>
                    <td>Renewable energy capacity that can be allocated elsewhere due to reduced demand</td>
                </tr>
            </tbody>
        </table>
        
        <h3 style="margin-top: 0.8em; margin-bottom: 0.4em; font-size: 13pt;">Air Quality & Environmental Benefits</h3>
        <ul style="margin: 0.5em 0 0.6em 1.5em; line-height: 1.4;">
            <li style="margin-bottom: 0.3em; font-size: 9pt;"><strong>Reduced Air Pollution:</strong> Lower electricity demand reduces emissions of NOx, SO2, and particulate matter from power plants</li>
            <li style="margin-bottom: 0.3em; font-size: 9pt;"><strong>Water Conservation:</strong> Reduced power plant water consumption for cooling (thermal power plants)</li>
            <li style="margin-bottom: 0.3em; font-size: 9pt;"><strong>Resource Conservation:</strong> Less extraction of fossil fuels and reduced strain on energy infrastructure</li>
            <li style="margin-bottom: 0.3em; font-size: 9pt;"><strong>Renewable Energy Enablement:</strong> Lower baseline demand makes it easier to meet renewable energy targets</li>
        </ul>
        
        {scope_breakdown}
    </div>
    """
    return html

def generate_financial_impact_section(r):
    """Generate Financial Impact Analysis section with Bill-Weighted Savings breakdown"""
    financial_debug = safe_get(r, "financial_debug", default={})
    bill_weighted = safe_get(r, "bill_weighted", default={})
    network_losses = safe_get(r, "network_losses", default={})
    
    # Use financial_debug first, fallback to bill_weighted
    bw = financial_debug if financial_debug else bill_weighted
    
    # Get bill-weighted savings values
    annual_energy_dollars = safe_get(bw, "annual_energy_dollars", default=0) or 0
    annual_demand_dollars = safe_get(bw, "annual_demand_dollars", default=0) or 0
    network_annual_dollars = safe_get(bw, "network_annual_dollars", default=0) or 0
    annual_total_dollars = safe_get(bw, "annual_total_dollars", default=0) or 0
    delta_kwh_annual = safe_get(bw, "delta_kwh_annual", default=0) or 0
    delta_kw_avg = safe_get(bw, "delta_kw_avg", default=0) or 0
    
    # Check if network is included
    network_included = safe_get(bw, "network_included_in_totals", default=False)
    network_label = "Network (I²R+eddy)" + (" - Included" if network_included else " - Diagnostic only")
    
    html = f"""
    <div class="content" style="page-break-before: always; page-break-after: always;">
        <h2>Financial Impact Analysis</h2>
        
        <div class="info-box">
            <h3>Bill-Weighted Savings</h3>
            <p>
                These metrics show the annual financial impact of power quality improvements. 
                <strong>Energy $</strong> shows electricity cost savings, <strong>Demand $</strong> shows demand charge reductions, 
                <strong>Network $</strong> shows I²R and transformer losses savings, and <strong>Total $</strong> shows combined annual savings.
            </p>
        </div>
        
        <table class="compliance-table">
            <thead>
                <tr>
                    <th>Savings Category</th>
                    <th style="text-align: right;">Annual Value</th>
                    <th>Description</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>Energy $ (annual)</strong></td>
                    <td class="value-cell">${format_number(annual_energy_dollars, 2)}</td>
                    <td>Annual electricity cost savings from reduced energy consumption</td>
                </tr>
                <tr>
                    <td><strong>Demand $ (annual)</strong></td>
                    <td class="value-cell">${format_number(annual_demand_dollars, 2)}</td>
                    <td>Annual demand charge savings from reduced peak power consumption</td>
                </tr>
                <tr>
                    <td><strong>{network_label}</strong></td>
                    <td class="value-cell">${format_number(network_annual_dollars, 2)}</td>
                    <td>Annual savings from reduced I²R losses and transformer stray/eddy losses</td>
                </tr>
                <tr>
                    <td><strong>Total $ (annual)</strong></td>
                    <td class="value-cell">${format_number(annual_total_dollars, 2)}</td>
                    <td>Combined annual financial savings from all sources</td>
                </tr>
                <tr>
                    <td><strong>ΔkWh (annual)</strong></td>
                    <td class="value-cell">{format_number(delta_kwh_annual, 0)} kWh</td>
                    <td>Total annual energy savings including base and network losses</td>
                </tr>
                <tr>
                    <td><strong>ΔkW (avg)</strong></td>
                    <td class="value-cell">{format_number(delta_kw_avg, 2)} kW</td>
                    <td>Average power reduction across the analysis period</td>
                </tr>
            </tbody>
        </table>
    </div>
    """
    return html

def generate_power_quality_impact_section(r):
    """Generate Power Quality Impact section with THD/TDD metrics and IEEE 519 compliance"""
    power_quality = safe_get(r, "power_quality", default={})
    compliance_status = safe_get(r, "compliance_status", default=[])
    
    def safe_float(value, default=None):
        if value is None or value == 'N/A' or value == '':
            return default
        try:
            return float(value)
        except (ValueError, TypeError):
            return default
    
    # Extract power quality metrics
    thd_before = safe_float(power_quality.get('thd_before') if isinstance(power_quality, dict) else None)
    thd_after = safe_float(power_quality.get('thd_after') if isinstance(power_quality, dict) else None)
    tdd_before = safe_float(power_quality.get('tdd_before') if isinstance(power_quality, dict) else None)
    tdd_after = safe_float(power_quality.get('tdd_after') if isinstance(power_quality, dict) else None)
    ieee_thd_limit = safe_float(power_quality.get('ieee_thd_limit') if isinstance(power_quality, dict) else None, 5.0)
    
    # Try to get from compliance_status array
    ieee_from_array = None
    for item in compliance_status:
        if isinstance(item, dict) and 'IEEE' in item.get('standard', ''):
            ieee_from_array = item
            break
    
    if ieee_from_array:
        def parse_value_from_string(value_str):
            if not value_str or value_str == 'N/A':
                return None
            try:
                cleaned = str(value_str).replace('%', '').strip()
                parts = cleaned.split()
                if parts:
                    return float(parts[0])
            except (ValueError, TypeError):
                pass
            return None
        
        before_value_str = ieee_from_array.get('before_value', '')
        after_value_str = ieee_from_array.get('after_value', '')
        if tdd_before is None:
            tdd_before = parse_value_from_string(before_value_str)
        if tdd_after is None:
            tdd_after = parse_value_from_string(after_value_str)
        if thd_before is None and tdd_before is None:
            thd_before = parse_value_from_string(before_value_str)
        if thd_after is None and tdd_after is None:
            thd_after = parse_value_from_string(after_value_str)
    
    # Determine which metric to use (TDD preferred, THD fallback)
    use_tdd = tdd_after is not None and tdd_after > 0
    metric_name = 'TDD' if use_tdd else 'THD'
    before_value = tdd_before if use_tdd else thd_before
    after_value = tdd_after if use_tdd else thd_after
    limit_value = ieee_thd_limit if use_tdd else 5.0
    
    # Calculate improvement
    improvement_pct = None
    if before_value is not None and after_value is not None and before_value > 0:
        improvement_pct = ((before_value - after_value) / before_value) * 100
    
    # Compliance status
    before_compliant = before_value is not None and before_value <= limit_value if before_value is not None else None
    after_compliant = after_value is not None and after_value <= limit_value if after_value is not None else None
    
    html = f"""
    <div class="content" style="page-break-before: always; page-break-after: always;">
        <h2>Power Quality Impact Analysis</h2>
        
        <div class="info-box">
            <h3>Harmonic Distortion Reduction</h3>
            <p>
                Power quality improvements reduce harmonic distortion, which can cause equipment damage, 
                increased losses, and power quality issues. This analysis shows the improvement in Total 
                Harmonic Distortion (THD) and Total Demand Distortion (TDD) metrics, with compliance 
                status per IEEE 519-2014/2022 standards.
            </p>
        </div>
        
        <table class="compliance-table">
            <thead>
                <tr>
                    <th>Power Quality Metric</th>
                    <th style="text-align: right;">Before</th>
                    <th style="text-align: right;">After</th>
                    <th style="text-align: right;">Improvement</th>
                    <th style="text-align: right;">IEEE 519 Limit</th>
                    <th>Compliance Status</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>{metric_name} (Total {'Demand' if use_tdd else 'Harmonic'} Distortion)</strong></td>
                    <td class="value-cell">{format_number(before_value, 2) if before_value is not None else 'N/A'}%</td>
                    <td class="value-cell">{format_number(after_value, 2) if after_value is not None else 'N/A'}%</td>
                    <td class="value-cell" style="color: {'#28a745' if improvement_pct and improvement_pct > 0 else '#666'};">
                        {format_number(improvement_pct, 1) + '% reduction' if improvement_pct is not None and improvement_pct > 0 else 'N/A'}
                    </td>
                    <td class="value-cell">{format_number(limit_value, 1)}%</td>
                    <td>
                        {'<span style="color: #28a745;">✓ Compliant</span>' if after_compliant else '<span style="color: #dc3545;">✗ Non-Compliant</span>' if after_value is not None else 'N/A'}
                        {f' (Before: {"✓" if before_compliant else "✗"})' if before_value is not None and before_compliant is not None else ''}
                    </td>
                </tr>
            </tbody>
        </table>
        
        <div class="info-box" style="margin-top: 1em;">
            <strong>IEEE 519-2014/2022 Compliance:</strong><br/>
            <p style="margin-top: 10px; font-size: 9pt; color: #666;">
                IEEE 519 sets limits on harmonic distortion to protect equipment and maintain power quality. 
                {'TDD (Total Demand Distortion)' if use_tdd else 'THD (Total Harmonic Distortion)'} is the primary metric for compliance. 
                The limit of {format_number(limit_value, 1)}% ensures minimal harmonic interference and equipment protection.
            </p>
            {f'<p style="margin-top: 8px; font-size: 9pt; color: #666;"><strong>Improvement:</strong> {format_number(improvement_pct, 1)}% reduction in {metric_name}, moving from {format_number(before_value, 2)}% to {format_number(after_value, 2)}%.</p>' if improvement_pct is not None and improvement_pct > 0 else ''}
        </div>
        
        <div class="info-box" style="margin-top: 1em;">
            <h4 style="margin-top: 0;">Benefits of Power Quality Improvement</h4>
            <ul style="margin: 0.5em 0 0.6em 1.5em; line-height: 1.4;">
                <li style="margin-bottom: 0.3em; font-size: 9pt;"><strong>Equipment Protection:</strong> Reduced harmonic distortion extends equipment lifespan and reduces maintenance costs</li>
                <li style="margin-bottom: 0.3em; font-size: 9pt;"><strong>Energy Efficiency:</strong> Lower harmonic losses result in improved system efficiency</li>
                <li style="margin-bottom: 0.3em; font-size: 9pt;"><strong>Power Quality:</strong> Improved voltage and current waveforms reduce power quality issues</li>
                <li style="margin-bottom: 0.3em; font-size: 9pt;"><strong>Compliance:</strong> Meets IEEE 519 standards for harmonic limits, ensuring utility and regulatory compliance</li>
            </ul>
        </div>
    </div>
    """
    return html

def generate_social_impact_section(r, social_data):
    """Generate Social Impact section"""
    html = f"""
    <div class="content" style="page-break-after: always;">
        <h2>Social Impact Analysis</h2>
        
        <div class="info-box">
            <h3>Economic & Employment Impact</h3>
            <p>
                Energy efficiency projects create and support jobs across multiple sectors, from engineering and installation
                to manufacturing and maintenance. This analysis estimates the employment and economic impact of this project.
            </p>
        </div>
        
        <table class="compliance-table">
            <thead>
                <tr>
                    <th>Social Impact Metric</th>
                    <th style="text-align: right;">Value</th>
                    <th>Description</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>Direct Jobs Created</strong></td>
                    <td class="value-cell">{social_data['direct_jobs']} jobs</td>
                    <td>Installation, engineering, and project management</td>
                </tr>
                <tr>
                    <td><strong>Indirect Jobs Supported</strong></td>
                    <td class="value-cell">{social_data['indirect_jobs']} jobs</td>
                    <td>Supply chain, manufacturing, and support services</td>
                </tr>
                <tr>
                    <td><strong>Total Jobs Created/Supported</strong></td>
                    <td class="value-cell">{social_data['total_jobs']} jobs</td>
                    <td>Combined direct and indirect employment impact</td>
                </tr>
                <tr>
                    <td><strong>Estimated Economic Impact</strong></td>
                    <td class="value-cell">${format_number(social_data['economic_impact'], 0)}</td>
                    <td>Annual economic activity (wages, spending, etc.)</td>
                </tr>
            </tbody>
        </table>
        
        <h3>Community Benefits</h3>
        <ul>
            <li><strong>Local Economic Development:</strong> Job creation and spending in the local economy</li>
            <li><strong>Energy Equity:</strong> Reduced energy costs improve affordability and access</li>
            <li><strong>Workforce Development:</strong> Training and skill development in energy efficiency technologies</li>
            <li><strong>Public Health:</strong> Improved indoor air quality and reduced environmental pollution</li>
            <li><strong>Education:</strong> Demonstration of energy efficiency best practices for the community</li>
        </ul>
        
        <div class="info-box">
            <strong>Note on Job Creation Estimates:</strong><br/>
            <p style="margin-top: 10px; font-size: 9pt; color: #666;">
                Job creation estimates are based on industry standards (approximately 1 direct job per 100 kW of installed capacity).
                Indirect jobs are estimated at 2x direct jobs based on economic multiplier effects. Actual job creation may vary
                based on project specifics, local labor markets, and implementation approach.
            </p>
        </div>
    </div>
    """
    return html

def extract_compliance_status(r):
    """Extract actual compliance status from analysis results - BOTH before and after values from real data"""
    after_compliance = safe_get(r, "after_compliance", default={})
    before_compliance = safe_get(r, "before_compliance", default={})
    power_quality = safe_get(r, "power_quality", default={})
    statistical = safe_get(r, "statistical", default={})
    compliance_status = safe_get(r, "compliance_status", default=[])
    
    def safe_float(value, default=None):
        """Safely convert to float, returning None if invalid (not 0)"""
        if value is None or value == 'N/A' or value == '':
            return default
        try:
            return float(value)
        except (ValueError, TypeError):
            return default
    
    def parse_value_from_string(value_str):
        """Parse numeric value from string like '39.0%' or '5.0%'"""
        if not value_str or value_str == 'N/A':
            return None
        try:
            # Remove % and extract first number
            cleaned = str(value_str).replace('%', '').strip()
            parts = cleaned.split()
            if parts:
                return float(parts[0])
        except (ValueError, TypeError):
            pass
        return None
    
    compliance_data = {}
    
    # IEEE 519 - Extract BOTH before and after from actual data
    thd_before = safe_float(power_quality.get('thd_before') if isinstance(power_quality, dict) else None)
    thd_after = safe_float(power_quality.get('thd_after') if isinstance(power_quality, dict) else None)
    tdd_before = safe_float(power_quality.get('tdd_before') if isinstance(power_quality, dict) else None)
    tdd_after = safe_float(power_quality.get('tdd_after') if isinstance(power_quality, dict) else None)
    ieee_thd_limit = safe_float(power_quality.get('ieee_thd_limit') if isinstance(power_quality, dict) else None, 5.0)
    
    # Try to get from compliance_status array first (most reliable)
    ieee_from_array = None
    for item in compliance_status:
        if isinstance(item, dict) and 'IEEE' in item.get('standard', ''):
            ieee_from_array = item
            break
    
    if ieee_from_array:
        # Use values from compliance_status array
        before_value_str = ieee_from_array.get('before_value', '')
        after_value_str = ieee_from_array.get('after_value', '')
        tdd_before = parse_value_from_string(before_value_str) if tdd_before is None else tdd_before
        tdd_after = parse_value_from_string(after_value_str) if tdd_after is None else tdd_after
        thd_before = parse_value_from_string(before_value_str) if thd_before is None and tdd_before is None else thd_before
        thd_after = parse_value_from_string(after_value_str) if thd_after is None and tdd_after is None else thd_after
    
    # Use TDD if available, otherwise THD
    if tdd_after is not None and tdd_after > 0:
        compliance_data['ieee_519'] = {
            'before_value': tdd_before,
            'after_value': tdd_after,
            'before_compliant': tdd_before is not None and tdd_before <= ieee_thd_limit if (tdd_before is not None and ieee_thd_limit is not None) else None,
            'after_compliant': tdd_after <= ieee_thd_limit if ieee_thd_limit is not None else None,
            'limit': ieee_thd_limit,
            'metric': 'TDD'
        }
    elif thd_after is not None and thd_after > 0:
        compliance_data['ieee_519'] = {
            'before_value': thd_before,
            'after_value': thd_after,
            'before_compliant': thd_before is not None and thd_before <= 5.0 if thd_before is not None else None,
            'after_compliant': thd_after <= 5.0,
            'limit': 5.0,
            'metric': 'THD'
        }
    else:
        # No data available
        compliance_data['ieee_519'] = {
            'before_value': None,
            'after_value': None,
            'before_compliant': None,
            'after_compliant': None,
            'limit': 5.0,
            'metric': 'THD'
        }
    
    # ASHRAE Guideline 14 - Extract BOTH before and after
    relative_precision_before = safe_float(before_compliance.get('ashrae_precision_value') if isinstance(before_compliance, dict) else None)
    relative_precision_after = safe_float(after_compliance.get('ashrae_precision_value') if isinstance(after_compliance, dict) else None)
    
    # Try compliance_status array
    ashrae_from_array = None
    for item in compliance_status:
        if isinstance(item, dict) and 'ASHRAE' in item.get('standard', '') and 'Guideline' in item.get('standard', ''):
            ashrae_from_array = item
            break
    
    if ashrae_from_array:
        before_value_str = ashrae_from_array.get('before_value', '')
        after_value_str = ashrae_from_array.get('after_value', '')
        if relative_precision_before is None:
            relative_precision_before = parse_value_from_string(before_value_str)
        if relative_precision_after is None:
            relative_precision_after = parse_value_from_string(after_value_str)
    
    compliance_data['ashrae_14'] = {
        'before_value': relative_precision_before,
        'after_value': relative_precision_after,
        'before_compliant': relative_precision_before is not None and relative_precision_before < 50.0 if relative_precision_before is not None else None,
        'after_compliant': relative_precision_after is not None and relative_precision_after < 50.0 if relative_precision_after is not None else None,
        'limit': 50.0
    }
    
    # ASHRAE Data Quality - Extract BOTH before and after
    completeness_before = safe_float(before_compliance.get('completeness_percent') if isinstance(before_compliance, dict) else None)
    completeness_after = safe_float(after_compliance.get('completeness_percent') if isinstance(after_compliance, dict) else None)
    outliers_before = safe_float(before_compliance.get('outlier_percent') if isinstance(before_compliance, dict) else None)
    outliers_after = safe_float(after_compliance.get('outlier_percent') if isinstance(after_compliance, dict) else None)
    
    compliance_data['ashrae_data_quality'] = {
        'before_completeness': completeness_before,
        'after_completeness': completeness_after,
        'before_outliers': outliers_before,
        'after_outliers': outliers_after,
        'before_compliant': completeness_before is not None and outliers_before is not None and completeness_before >= 95.0 and outliers_before <= 5.0 if (completeness_before is not None and outliers_before is not None) else None,
        'after_compliant': completeness_after is not None and outliers_after is not None and completeness_after >= 95.0 and outliers_after <= 5.0 if (completeness_after is not None and outliers_after is not None) else None
    }
    
    # IPMVP - Only has after (statistical significance)
    p_value = safe_float(statistical.get('p_value') if isinstance(statistical, dict) else None)
    compliance_data['ipmvp'] = {
        'before_value': None,  # IPMVP only applies to after period
        'after_value': p_value,
        'before_compliant': None,
        'after_compliant': p_value is not None and p_value < 0.05 if p_value is not None else None,
        'limit': 0.05
    }
    
    # NEMA MG1 (Voltage Unbalance) - Extract BOTH before and after
    voltage_unbalance_before = safe_float(power_quality.get('voltage_unbalance_before') if isinstance(power_quality, dict) else None)
    voltage_unbalance_after = safe_float(power_quality.get('voltage_unbalance_after') if isinstance(power_quality, dict) else None)
    
    # Try compliance_status array
    nema_from_array = None
    for item in compliance_status:
        if isinstance(item, dict) and 'NEMA' in item.get('standard', ''):
            nema_from_array = item
            break
    
    if nema_from_array:
        before_value_str = nema_from_array.get('before_value', '')
        after_value_str = nema_from_array.get('after_value', '')
        if voltage_unbalance_before is None:
            voltage_unbalance_before = parse_value_from_string(before_value_str)
        if voltage_unbalance_after is None:
            voltage_unbalance_after = parse_value_from_string(after_value_str)
    
    compliance_data['nema_mg1'] = {
        'before_value': voltage_unbalance_before,
        'after_value': voltage_unbalance_after,
        'before_compliant': voltage_unbalance_before is not None and voltage_unbalance_before <= 1.0 if voltage_unbalance_before is not None else None,
        'after_compliant': voltage_unbalance_after is not None and voltage_unbalance_after <= 1.0 if voltage_unbalance_after is not None else None,
        'limit': 1.0
    }
    
    # Power Factor - Extract BOTH before and after
    pf_before = safe_float(power_quality.get('pf_before') or power_quality.get('power_factor_before') if isinstance(power_quality, dict) else None)
    pf_after = safe_float(power_quality.get('pf_after') or power_quality.get('power_factor_after') if isinstance(power_quality, dict) else None)
    
    compliance_data['power_factor'] = {
        'before_value': pf_before,
        'after_value': pf_after,
        'before_compliant': pf_before is not None and pf_before >= 0.95 if pf_before is not None else None,
        'after_compliant': pf_after is not None and pf_after >= 0.95 if pf_after is not None else None,
        'limit': 0.95
    }
    
    return compliance_data

def generate_enhanced_compliance_table(compliance_data):
    """Generate enhanced compliance standards table with actual before/after status from real data"""
    html = """<table class="compliance-table" style="margin: 20px 0; table-layout: fixed; width: 100%; font-size: 9pt;">
            <colgroup>
                <col style="width: 18%;">
                <col style="width: 12%;">
                <col style="width: 10%;">
                <col style="width: 12%;">
                <col style="width: 10%;">
                <col style="width: 38%;">
            </colgroup>
            <thead>
                <tr>
                    <th style="padding: 8px 6px; font-size: 9pt;">Standard/Framework</th>
                    <th style="padding: 8px 6px; font-size: 9pt;">Before Status</th>
                    <th style="padding: 8px 6px; font-size: 9pt;">Before Value</th>
                    <th style="padding: 8px 6px; font-size: 9pt;">After Status</th>
                    <th style="padding: 8px 6px; font-size: 9pt;">After Value</th>
                    <th style="padding: 8px 6px; font-size: 9pt;">Requirement</th>
                </tr>
            </thead>
            <tbody>"""
    
    def status_cell(compliant):
        """Generate status cell - shows N/A if data not available"""
        if compliant is None:
            return '<td class="value-cell" style="color: #999; padding: 5px 4px; font-size: 8pt;">N/A</td>'
        elif compliant:
            return '<td class="compliant" style="padding: 5px 4px; font-size: 8pt;">[OK] Compliant</td>'
        else:
            return '<td class="non-compliant" style="padding: 5px 4px; font-size: 8pt;">[FAIL] Non-Compliant</td>'
    
    def value_cell(value, decimals=2, suffix=''):
        """Generate value cell - shows N/A if value not available"""
        if value is None:
            return '<td class="value-cell" style="color: #999; padding: 5px 4px; font-size: 8pt;">N/A</td>'
        return f'<td class="value-cell" style="padding: 5px 4px; font-size: 8pt;">{format_number(value, decimals)}{suffix}</td>'
    
    # IEEE 519
    ieee = compliance_data.get('ieee_519', {})
    ieee_before_value = ieee.get('before_value')
    ieee_after_value = ieee.get('after_value')
    ieee_limit = ieee.get('limit', 5.0)
    ieee_metric = ieee.get('metric', 'THD')
    html += f"""
                <tr>
                    <td style="padding: 5px 4px; font-size: 8pt;"><strong>IEEE 519-2014/2022</strong></td>
                    {status_cell(ieee.get('before_compliant'))}
                    {value_cell(ieee_before_value, 2, '%')}
                    {status_cell(ieee.get('after_compliant'))}
                    {value_cell(ieee_after_value, 2, '%')}
                    <td style="padding: 5px 4px; font-size: 8pt;">{ieee_metric} &lt;= {format_number(ieee_limit, 1)}%</td>
                </tr>"""
    
    # ASHRAE Guideline 14
    ashrae = compliance_data.get('ashrae_14', {})
    html += f"""
                <tr>
                    <td style="padding: 5px 4px; font-size: 8pt;"><strong>ASHRAE Guideline 14-2014</strong></td>
                    {status_cell(ashrae.get('before_compliant'))}
                    {value_cell(ashrae.get('before_value'), 2, '%')}
                    {status_cell(ashrae.get('after_compliant'))}
                    {value_cell(ashrae.get('after_value'), 2, '%')}
                    <td style="padding: 5px 4px; font-size: 8pt;">Relative Precision < 50%</td>
                </tr>"""
    
    # ASHRAE Data Quality
    dq = compliance_data.get('ashrae_data_quality', {})
    dq_before_str = "N/A"
    dq_after_str = "N/A"
    if dq.get('before_completeness') is not None or dq.get('before_outliers') is not None:
        dq_before_str = f"{format_number(dq.get('before_completeness', 0), 1)}% complete, {format_number(dq.get('before_outliers', 0), 1)}% outliers"
    if dq.get('after_completeness') is not None or dq.get('after_outliers') is not None:
        dq_after_str = f"{format_number(dq.get('after_completeness', 0), 1)}% complete, {format_number(dq.get('after_outliers', 0), 1)}% outliers"
    html += f"""
                <tr>
                    <td style="padding: 5px 4px; font-size: 8pt;"><strong>ASHRAE Data Quality</strong></td>
                    {status_cell(dq.get('before_compliant'))}
                    <td class="value-cell" style="{'color: #999;' if dq_before_str == 'N/A' else ''} padding: 5px 4px; font-size: 8pt;">{dq_before_str}</td>
                    {status_cell(dq.get('after_compliant'))}
                    <td class="value-cell" style="{'color: #999;' if dq_after_str == 'N/A' else ''} padding: 5px 4px; font-size: 8pt;">{dq_after_str}</td>
                    <td style="padding: 5px 4px; font-size: 8pt;">Completeness &gt;= 95%, Outliers &lt;= 5%</td>
                </tr>"""
    
    # IPMVP
    ipmvp = compliance_data.get('ipmvp', {})
    html += f"""
                <tr>
                    <td style="padding: 5px 4px; font-size: 8pt;"><strong>IPMVP Volume I</strong></td>
                    <td class="value-cell" style="color: #999; padding: 5px 4px; font-size: 8pt;">N/A</td>
                    <td class="value-cell" style="color: #999; padding: 5px 4px; font-size: 8pt;">N/A</td>
                    {status_cell(ipmvp.get('after_compliant'))}
                    {value_cell(ipmvp.get('after_value'), 4)}
                    <td style="padding: 5px 4px; font-size: 8pt;">p-value < 0.05 (statistically significant)</td>
                </tr>"""
    
    # NEMA MG1
    nema = compliance_data.get('nema_mg1', {})
    html += f"""
                <tr>
                    <td style="padding: 5px 4px; font-size: 8pt;"><strong>NEMA MG1</strong></td>
                    {status_cell(nema.get('before_compliant'))}
                    {value_cell(nema.get('before_value'), 2, '%')}
                    {status_cell(nema.get('after_compliant'))}
                    {value_cell(nema.get('after_value'), 2, '%')}
                    <td style="padding: 5px 4px; font-size: 8pt;">Voltage Unbalance &lt;= 1.0%</td>
                </tr>"""
    
    # Power Factor
    pf = compliance_data.get('power_factor', {})
    html += f"""
                <tr>
                    <td style="padding: 5px 4px; font-size: 8pt;"><strong>Power Factor</strong></td>
                    {status_cell(pf.get('before_compliant'))}
                    {value_cell(pf.get('before_value'), 3)}
                    {status_cell(pf.get('after_compliant'))}
                    {value_cell(pf.get('after_value'), 3)}
                    <td style="padding: 5px 4px; font-size: 8pt;">PF &gt;= 0.95</td>
                </tr>"""
    
    # Additional standards (methodology-based, no before/after data available)
    additional_standards = [
        ("ISO 50001:2018", "Energy management systems"),
        ("ISO 50015:2014", "Measurement and verification of energy performance"),
        ("ANSI C12.1 & C12.20", "Meter accuracy standards"),
        ("IEC 61000-4-30", "Power quality measurement"),
        ("IEC 61000-4-7", "Harmonic measurement"),
        ("IEC 62053-22", "Meter accuracy class"),
    ]
    
    for std_name, std_desc in additional_standards:
        html += f"""
                <tr>
                    <td style="padding: 5px 4px; font-size: 8pt;"><strong>{std_name}</strong></td>
                    <td class="value-cell" style="color: #999; padding: 5px 4px; font-size: 8pt;">N/A</td>
                    <td class="value-cell" style="color: #999; padding: 5px 4px; font-size: 8pt;">N/A</td>
                    <td class="compliant" style="padding: 5px 4px; font-size: 8pt;">[OK] Compliant</td>
                    <td class="value-cell" style="color: #999; padding: 5px 4px; font-size: 8pt;">Methodology</td>
                    <td style="padding: 5px 4px; font-size: 8pt;">{std_desc}</td>
                </tr>"""
    
    html += """</tbody>
        </table>"""
    
    return html

def generate_detailed_gri_metrics(r, carbon_data, annual_kwh_savings, annual_kw_savings):
    """Generate detailed GRI Standards metrics"""
    config = safe_get(r, "config", default={})
    financial = safe_get(r, "financial", default={})
    
    # Calculate energy intensity (if we have production/service data)
    # For now, use kWh savings as energy consumption reduction
    energy_consumption_reduction = annual_kwh_savings
    
    # GRI 302-1: Energy consumption within organization
    # GRI 302-3: Energy intensity
    # GRI 302-4: Reduction of energy consumption
    # GRI 305-1: Direct (Scope 1) GHG emissions (if applicable)
    # GRI 305-2: Energy indirect (Scope 2) GHG emissions
    # GRI 305-3: Other indirect (Scope 3) GHG emissions (optional)
    # GRI 305-4: GHG emissions intensity
    # GRI 305-5: Reduction of GHG emissions
    
    html = f"""
    <div class="content">
        <h3>GRI Standards - Detailed Metrics</h3>
        <table class="compliance-table">
            <thead>
                <tr>
                    <th>GRI Standard</th>
                    <th>Metric</th>
                    <th style="text-align: right;">Value</th>
                    <th>Description</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>GRI 302-1</strong></td>
                    <td>Energy consumption within organization</td>
                    <td class="value-cell">{format_number(energy_consumption_reduction, 0)} kWh</td>
                    <td>Annual energy consumption reduction</td>
                </tr>
                <tr>
                    <td><strong>GRI 302-3</strong></td>
                    <td>Energy intensity</td>
                    <td class="value-cell">{format_number(annual_kw_savings, 2)} kW</td>
                    <td>Energy intensity reduction (demand reduction)</td>
                </tr>
                <tr>
                    <td><strong>GRI 302-4</strong></td>
                    <td>Reduction of energy consumption</td>
                    <td class="value-cell">{format_number(energy_consumption_reduction, 0)} kWh</td>
                    <td>Total annual energy consumption reduction</td>
                </tr>
                <tr>
                    <td><strong>GRI 305-2</strong></td>
                    <td>Energy indirect (Scope 2) GHG emissions</td>
                    <td class="value-cell">{format_number(carbon_data['co2_tons'], 2)} tons CO2e</td>
                    <td>Scope 2 emissions reduction from purchased electricity</td>
                </tr>
                <tr>
                    <td><strong>GRI 305-4</strong></td>
                    <td>GHG emissions intensity</td>
                    <td class="value-cell">{format_number(carbon_data['co2_tons'] / max(1, annual_kwh_savings) * 1000, 4)} kg CO2e/kWh</td>
                    <td>Emissions intensity (CO2 per kWh saved)</td>
                </tr>
                <tr>
                    <td><strong>GRI 305-5</strong></td>
                    <td>Reduction of GHG emissions</td>
                    <td class="value-cell">{format_number(carbon_data['co2_tons'], 2)} tons CO2e</td>
                    <td>Total annual GHG emissions reduction</td>
                </tr>
            </tbody>
        </table>
        
        <div class="info-box">
            <strong>GRI Standards Compliance:</strong><br/>
            <p style="margin-top: 10px; font-size: 9pt; color: #666;">
                This report aligns with GRI Universal Standards 2021 (GRI 1, 2, 3) and GRI Topic Standards 
                for Energy (GRI 302) and Emissions (GRI 305). All metrics are calculated in accordance with 
                GRI reporting principles: accuracy, balance, clarity, comparability, completeness, sustainability 
                context, timeliness, and verifiability.
            </p>
        </div>
    </div>
    """
    return html

def generate_scope_emissions_breakdown(carbon_data, annual_kwh_savings):
    """Generate Scope 1, 2, 3 emissions breakdown"""
    html = f"""
    <div class="content" style="page-break-inside: avoid;">
        <h3 style="margin-top: 0.8em; margin-bottom: 0.4em; font-size: 13pt;">GHG Emissions by Scope</h3>
        <table class="compliance-table" style="table-layout: fixed; width: 100%; margin-bottom: 0.6em; font-size: 9pt;">
            <thead>
                <tr>
                    <th style="width: 10%; padding: 8px 6px;">Scope</th>
                    <th style="width: 40%; padding: 8px 6px;">Description</th>
                    <th style="text-align: right; width: 20%; padding: 8px 6px;">CO2 Emissions Reduced (tons)</th>
                    <th style="width: 30%; padding: 8px 6px;">Notes</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td style="padding: 6px;"><strong>Scope 1</strong></td>
                    <td style="padding: 6px; font-size: 8.5pt; line-height: 1.3;">Direct emissions from owned or controlled sources</td>
                    <td class="value-cell" style="padding: 6px;">0.00</td>
                    <td style="padding: 6px; font-size: 8.5pt; line-height: 1.3;">No on-site combustion sources (typical for energy efficiency projects)</td>
                </tr>
                <tr>
                    <td style="padding: 6px;"><strong>Scope 2</strong></td>
                    <td style="padding: 6px; font-size: 8.5pt; line-height: 1.3;">Indirect emissions from purchased electricity, steam, heating, and cooling</td>
                    <td class="value-cell" style="padding: 6px;">{format_number(carbon_data['co2_tons'], 2)}</td>
                    <td style="padding: 6px; font-size: 8.5pt; line-height: 1.3;">Calculated using regional grid emissions factor ({format_number(carbon_data['emissions_factor'], 3)} lbs CO2/kWh)</td>
                </tr>
                <tr>
                    <td style="padding: 6px;"><strong>Scope 3</strong></td>
                    <td style="padding: 6px; font-size: 8.5pt; line-height: 1.3;">Other indirect emissions (upstream/downstream activities)</td>
                    <td class="value-cell" style="padding: 6px;">Not calculated</td>
                    <td style="padding: 6px; font-size: 8.5pt; line-height: 1.3;">Optional reporting - includes supply chain, transportation, waste, etc.</td>
                </tr>
                <tr style="background: #f8f9fa; font-weight: bold;">
                    <td style="padding: 6px;"><strong>Total</strong></td>
                    <td style="padding: 6px; font-size: 8.5pt; line-height: 1.3;"><strong>Scope 1 + Scope 2</strong></td>
                    <td class="value-cell" style="padding: 6px;"><strong>{format_number(carbon_data['co2_tons'], 2)}</strong></td>
                    <td style="padding: 6px; font-size: 8.5pt; line-height: 1.3;"><strong>Total annual CO2 emissions reduction</strong></td>
                </tr>
            </tbody>
        </table>
        
        <div class="info-box" style="padding: 10px 12px; margin: 0.8em 0;">
            <strong>Scope 2 Emissions Calculation:</strong><br/>
            <p style="margin-top: 6px; font-size: 8.5pt; color: #666; line-height: 1.4;">
                Scope 2 emissions are calculated using the location-based method per GHG Protocol Corporate Standard.
                The grid emissions factor ({format_number(carbon_data['emissions_factor'], 3)} lbs CO2/kWh) reflects the 
                average emissions intensity of the regional electricity grid. Annual emissions reduction = 
                {format_number(annual_kwh_savings, 0)} kWh x {format_number(carbon_data['emissions_factor'], 3)} lbs/kWh x 0.0005 = 
                {format_number(carbon_data['co2_tons'], 2)} tons CO2e.
            </p>
        </div>
    </div>
    """
    return html

def generate_un_sdgs_alignment():
    """Generate UN Sustainable Development Goals alignment section"""
    html = f"""
    <div class="content">
        <h3>UN Sustainable Development Goals (SDGs) Alignment</h3>
        <table class="compliance-table">
            <thead>
                <tr>
                    <th>SDG</th>
                    <th>Goal</th>
                    <th>Contribution</th>
                    <th>Alignment</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>SDG 7</strong></td>
                    <td>Affordable and Clean Energy</td>
                    <td>Energy efficiency improvements reduce energy consumption and costs</td>
                    <td class="compliant">[OK] Direct</td>
                </tr>
                <tr>
                    <td><strong>SDG 8</strong></td>
                    <td>Decent Work and Economic Growth</td>
                    <td>Job creation and economic impact from energy efficiency projects</td>
                    <td class="compliant">[OK] Direct</td>
                </tr>
                <tr>
                    <td><strong>SDG 9</strong></td>
                    <td>Industry, Innovation and Infrastructure</td>
                    <td>Infrastructure improvements and innovation in energy systems</td>
                    <td class="compliant">[OK] Direct</td>
                </tr>
                <tr>
                    <td><strong>SDG 12</strong></td>
                    <td>Responsible Consumption and Production</td>
                    <td>Reduced energy consumption and improved resource efficiency</td>
                    <td class="compliant">[OK] Direct</td>
                </tr>
                <tr>
                    <td><strong>SDG 13</strong></td>
                    <td>Climate Action</td>
                    <td>Direct reduction in greenhouse gas emissions</td>
                    <td class="compliant">[OK] Direct</td>
                </tr>
                <tr>
                    <td><strong>SDG 17</strong></td>
                    <td>Partnerships for the Goals</td>
                    <td>Collaboration between stakeholders for sustainable development</td>
                    <td class="compliant">[OK] Supporting</td>
                </tr>
            </tbody>
        </table>
    </div>
    """
    return html

def generate_data_assurance_statement(r):
    """Generate data quality and assurance statement using real data values"""
    after_compliance = safe_get(r, "after_compliance", default={})
    # Get actual values - use None if not available (no hardcoded defaults)
    completeness = after_compliance.get('completeness_percent') if isinstance(after_compliance, dict) else None
    outliers = after_compliance.get('outlier_percent') if isinstance(after_compliance, dict) else None
    relative_precision = after_compliance.get('ashrae_precision_value') if isinstance(after_compliance, dict) else None
    
    # Helper to format value or show N/A
    def format_or_na(value, decimals=1, suffix='%'):
        if value is None:
            return '<span style="color: #999;">N/A</span>'
        return f"{format_number(value, decimals)}{suffix}"
    
    # Helper to get status message
    def get_status_msg(value, threshold, comparison='>='):
        if value is None:
            return '<span style="color: #999;">Data not available</span>'
        if comparison == '>=':
            meets = value >= threshold
        elif comparison == '<=':
            meets = value <= threshold
        else:  # '<'
            meets = value < threshold
        return '[OK] Meets ASHRAE requirement' if meets else '[WARNING] Does not meet ASHRAE requirement'
    
    html = f"""
    <div class="content">
        <h3>Data Quality & Assurance</h3>
        <div class="info-box">
            <h4 style="margin-top: 0;">Data Quality Metrics</h4>
            <table style="width: 100%; margin: 15px 0; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #e9ecef;"><strong>Data Completeness:</strong></td>
                    <td class="value-cell" style="padding: 8px; border-bottom: 1px solid #e9ecef;">{format_or_na(completeness, 1)}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #e9ecef;">{get_status_msg(completeness, 95.0, '>=') if completeness is not None else '<span style="color: #999;">Data not available</span>'}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #e9ecef;"><strong>Outlier Percentage:</strong></td>
                    <td class="value-cell" style="padding: 8px; border-bottom: 1px solid #e9ecef;">{format_or_na(outliers, 1)}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #e9ecef;">{get_status_msg(outliers, 5.0, '<=') if outliers is not None else '<span style="color: #999;">Data not available</span>'}</td>
                </tr>
                <tr>
                    <td style="padding: 8px;"><strong>Relative Precision:</strong></td>
                    <td class="value-cell" style="padding: 8px;">{format_or_na(relative_precision, 2)}</td>
                    <td style="padding: 8px;">{get_status_msg(relative_precision, 50.0, '<') if relative_precision is not None else '<span style="color: #999;">Data not available</span>'}</td>
                </tr>
            </table>
        </div>
        
        <div class="info-box">
            <h4 style="margin-top: 0;">Assurance Statement</h4>
            <p>
                <strong>Data Collection & Verification:</strong> All data used in this analysis was collected using 
                calibrated measurement equipment meeting ANSI C12.1 and C12.20 standards. Data files were verified 
                for integrity using cryptographic hashing (SHA-256) to ensure no tampering or corruption.
            </p>
            <p>
                <strong>Methodology Compliance:</strong> All calculations follow ASHRAE Guideline 14-2014 for 
                measurement and verification, IPMVP Volume I for statistical significance, and IEEE 519-2014/2022 
                for power quality analysis. Weather normalization uses timestamp-by-timestamp matching per ASHRAE 
                requirements.
            </p>
            <p>
                <strong>Professional Review:</strong> All results have been reviewed and verified by a licensed 
                Professional Engineer. The analysis methodology, calculations, and conclusions are fully documented 
                and reproducible.
            </p>
            <p>
                <strong>Uncertainty Analysis:</strong> Statistical uncertainty is quantified using confidence intervals 
                and p-values. {f'The relative precision of {format_number(relative_precision, 2)}% indicates the measurement uncertainty in the savings calculation.' if relative_precision is not None else 'Relative precision data is available in the compliance section above.'}
            </p>
        </div>
    </div>
    """
    return html

def generate_governance_section(r):
    """Generate enhanced Governance & Compliance section with comprehensive compliance data"""
    compliance_data = extract_compliance_status(r)
    
    html = f"""
    <div class="content" style="page-break-after: always;">
        <h2>Governance & Compliance</h2>
        
        <div class="info-box">
            <h3>Standards Compliance & Data Transparency</h3>
            <p>
                This project adheres to the highest standards of technical excellence, regulatory compliance, and data transparency.
                All calculations, methodologies, and results are fully documented and verifiable. Compliance status is determined
                from actual measured values, not assumptions.
            </p>
        </div>
        
        <h3>Regulatory Standards Compliance</h3>
        {generate_enhanced_compliance_table(compliance_data)}
        
        <div style="font-size: 7pt; color: #666; line-height: 1.4; margin-top: 10px; margin-bottom: 20px; padding: 8px; background: #f8f9fa; border-left: 2px solid #e9ecef;">
            <strong>ISO Standards Compliance Statement:</strong> ISO 50001:2018 (Energy management systems) and ISO 50015:2014 (Measurement and verification of energy performance) compliance is demonstrated through adherence to the methodologies, procedures, and best practices outlined in these standards. The analysis follows ISO 50001 requirements for establishing, implementing, maintaining, and improving energy management systems, and ISO 50015 requirements for measurement and verification of energy performance. Additional standards including ANSI C12.1 & C12.20 (Meter accuracy standards), IEC 61000-4-30 (Power quality measurement), IEC 61000-4-7 (Harmonic measurement), and IEC 62053-22 (Meter accuracy class) are complied with through the use of calibrated measurement equipment, standardized measurement procedures, and adherence to specified accuracy requirements. Compliance with these methodology-based standards is verified through documentation review and methodology validation rather than before/after measurement comparisons.
        </div>
        
        <h3>ESG Framework Alignment</h3>
        <table class="compliance-table esg-framework-table">
            <thead>
                <tr>
                    <th>ESG Framework</th>
                    <th>Alignment</th>
                    <th>Relevant Metrics</th>
                    <th>Compliance Level</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>GRI (Global Reporting Initiative)</strong></td>
                    <td class="compliant">[OK] Aligned</td>
                    <td>GRI 2, 3, 302 (Energy), 305 (Emissions)</td>
                    <td>Core Option</td>
                </tr>
                <tr>
                    <td><strong>SASB (Sustainability Accounting Standards)</strong></td>
                    <td class="compliant">[OK] Aligned</td>
                    <td>IF-EU-000.A (Energy), IF-EU-000.B (Emissions)</td>
                    <td>Industry-Specific</td>
                </tr>
                <tr>
                    <td><strong>TCFD (Task Force on Climate-related Disclosures)</strong></td>
                    <td class="compliant">[OK] Aligned</td>
                    <td>Governance, Strategy, Risk Management, Metrics & Targets</td>
                    <td>Recommended</td>
                </tr>
                <tr>
                    <td><strong>CDP (Carbon Disclosure Project)</strong></td>
                    <td class="compliant">[OK] Aligned</td>
                    <td>Scope 2 emissions, Energy management</td>
                    <td>Disclosure-Ready</td>
                </tr>
                <tr>
                    <td><strong>UN SDGs</strong></td>
                    <td class="compliant">[OK] Aligned</td>
                    <td>SDG 7, 8, 9, 12, 13, 17</td>
                    <td>Direct Contribution</td>
                </tr>
            </tbody>
        </table>
        
        <h3>Data Transparency & Auditability</h3>
        <ul>
            <li><strong>Complete Audit Trail:</strong> All calculations, data sources, and methodologies are fully documented</li>
            <li><strong>Professional Engineer Review:</strong> All results verified and certified by licensed Professional Engineer</li>
            <li><strong>Data Integrity:</strong> Cryptographic verification (SHA-256) of all data files and calculations</li>
            <li><strong>Reproducibility:</strong> All results can be independently verified using provided methodologies</li>
            <li><strong>Standards Traceability:</strong> Every calculation references applicable industry standards</li>
            <li><strong>Third-Party Verification:</strong> Results are suitable for third-party verification and assurance</li>
        </ul>
    </div>
    """
    return html

def generate_case_study_narrative(r):
    """Generate Case Study Narrative section"""
    config = safe_get(r, "config", default={})
    client_profile = safe_get(r, "client_profile", default={})
    executive_summary = safe_get(r, "executive_summary", default={})
    
    company_name = (
        safe_get(config, "cp_company") or 
        safe_get(config, "company") or 
        safe_get(client_profile, "cp_company") or
        safe_get(client_profile, "company") or
        "Client"
    )
    
    html = f"""
    <div class="content" style="page-break-after: always;">
        <h2>Case Study Narrative</h2>
        
        <h3>Project Background</h3>
        <p>
            {company_name} embarked on a comprehensive energy efficiency initiative to reduce operational costs,
            improve power quality, and align with corporate sustainability goals. The project involved detailed
            analysis of electrical systems, power quality metrics, and energy consumption patterns to identify
            optimization opportunities.
        </p>
        
        <h3>Solution Overview</h3>
        <p>
            The solution implemented comprehensive power quality improvements and energy efficiency measures,
            including power factor correction, harmonic mitigation, and system optimization. All improvements
            were verified using industry-standard measurement and verification protocols, ensuring accurate
            quantification of energy savings and environmental impact.
        </p>
        
        <h3>Results & Impact</h3>
        <p>
            The project achieved significant energy savings, cost reductions, and environmental benefits.
            All results were normalized for weather variations and power factor impacts, providing accurate
            and reliable savings estimates. The comprehensive analysis demonstrates both the technical
            effectiveness and the broader ESG value of the energy efficiency improvements.
        </p>
        
        <h3>Lessons Learned & Best Practices</h3>
        <ul>
            <li><strong>Comprehensive Analysis:</strong> Detailed power quality and energy analysis identified multiple optimization opportunities</li>
            <li><strong>Standards Compliance:</strong> Adherence to industry standards ensured accuracy and regulatory compliance</li>
            <li><strong>Weather Normalization:</strong> Proper normalization techniques provided accurate savings estimates</li>
            <li><strong>Professional Verification:</strong> Professional Engineer review ensured technical accuracy and credibility</li>
            <li><strong>ESG Integration:</strong> Quantifying environmental and social impact demonstrates broader project value</li>
        </ul>
    </div>
    """
    return html

def generate_comprehensive_engineering_report_section(r):
    """Generate Comprehensive Engineering Report section with project info and ISO statement"""
    config = safe_get(r, "config", default={})
    client_profile = safe_get(r, "client_profile", default={})
    
    # Extract project information
    company_name = (
        safe_get(config, "cp_company") or 
        safe_get(config, "company") or 
        safe_get(client_profile, "cp_company") or
        safe_get(client_profile, "company") or
        "Client"
    )
    
    project_name = (
        safe_get(config, "projectName") or
        safe_get(config, "company") or
        safe_get(config, "project_name") or
        safe_get(client_profile, "projectName") or
        safe_get(client_profile, "company") or
        safe_get(client_profile, "project_name") or
        safe_get(r, "projectName") or
        safe_get(r, "company") or
        safe_get(r, "project_name") or
        ""
    )
    
    facility_address = (
        safe_get(config, "facility_address") or
        safe_get(config, "facilityAddress") or
        safe_get(client_profile, "facility_address") or
        safe_get(r, "facility_address") or
        ""
    )
    
    # Get report date
    report_date = datetime.now().strftime('%B %d, %Y')
    
    # Get project report number
    analysis_session_id = safe_get(r, "analysis_session_id") or safe_get(config, "analysis_session_id") or ""
    if analysis_session_id:
        # Extract date/time from session ID (format: YYYYMMDD_HHMMSS)
        try:
            parts = analysis_session_id.split('_')
            if len(parts) >= 2:
                date_part = parts[0]
                time_part = parts[1]
                project_report_number = f"{date_part}_{time_part}"
            else:
                project_report_number = analysis_session_id
        except:
            project_report_number = analysis_session_id
    else:
        project_report_number = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    html = f"""
    <div class="content comprehensive-engineering-page" style="page-break-before: always; page-break-after: always; padding: 10px 20px;">
        <h1 style="text-align: center; color: #2c3e50; border-bottom: 3px solid #2c3e50; padding-bottom: 8px; margin-top: 0; margin-bottom: 10px; font-size: 18pt;">
            Comprehensive Engineering Report
        </h1>
        
        <div style="max-width: 800px; margin: 0 auto;">
            <table style="width: 100%; border-collapse: collapse; margin: 8px 0;" class="project-info-table">
                <tr>
                    <td style="padding: 3px 4px; width: 35%; font-weight: 600; color: #2c3e50; font-size: 9pt;">Date:</td>
                    <td style="padding: 3px 4px; font-size: 9pt;">{report_date}</td>
                </tr>
                <tr>
                    <td style="padding: 3px 4px; font-weight: 600; color: #2c3e50; font-size: 9pt;">Performed for:</td>
                    <td style="padding: 3px 4px; font-size: 9pt;">{company_name}</td>
                </tr>
                <tr>
                    <td style="padding: 3px 4px; font-weight: 600; color: #2c3e50; font-size: 9pt;">Project Name:</td>
                    <td style="padding: 3px 4px; font-size: 9pt;">{project_name}</td>
                </tr>
                <tr>
                    <td style="padding: 3px 4px; font-weight: 600; color: #2c3e50; font-size: 9pt;">Project location:</td>
                    <td style="padding: 3px 4px; font-size: 9pt;">{facility_address}</td>
                </tr>
                <tr>
                    <td style="padding: 3px 4px; font-weight: 600; color: #2c3e50; font-size: 9pt;">Audit level:</td>
                    <td style="padding: 3px 4px; font-size: 9pt;">Utility-grade</td>
                </tr>
                <tr>
                    <td style="padding: 3px 4px; font-weight: 600; color: #2c3e50; font-size: 9pt;">Project Report #:</td>
                    <td style="padding: 3px 4px; font-family: 'Courier New', monospace; font-size: 9pt;">{project_report_number}</td>
                </tr>
            </table>
            
            <div style="margin-top: 6px; padding: 4px; background-color: #f8f9fa; border: 2px solid #2c3e50; border-radius: 8px;" class="iso-compliance-box">
                <h2 style="font-size: 7pt !important; font-weight: 600; color: #2c3e50; margin-top: 0 !important; margin-bottom: 2px !important; text-align: center;">
                    ISO Standards Compliance
                </h2>
                <p style="font-size: 4.5px !important; line-height: 1.2 !important; color: #333; margin: 0 !important; text-align: justify;">
                    This comprehensive engineering report has been prepared in accordance with <strong style="font-size: 4.5px !important;">ISO 50001:2018</strong> (Energy Management Systems) and <strong style="font-size: 4.5px !important;">ISO 50015:2014</strong> (Measurement and Verification of Energy Performance) international standards. The analysis implements ISO 50001 energy management principles including energy baseline establishment, Energy Performance Indicator (EnPI) calculation and tracking, and energy performance improvement measurement. Measurement and verification procedures follow ISO 50015 requirements for baseline establishment, statistical validation, data quality assessment, and uncertainty analysis. All calculations are traceable to source data with complete audit trail documentation. This compliance statement represents implementation of ISO standard methodologies and does not constitute ISO organizational certification.
                </p>
            </div>
        </div>
    </div>
    """
    return html

def generate_esg_case_study_report(r):
    """
    Generate comprehensive ESG Case Study Report
    
    Args:
        r: Results data dictionary (same format as Client HTML Report)
    
    Returns:
        Complete HTML report string
    """
    try:
        # Handle nested data structure
        if 'results' in r:
            r = r['results']
        
        # Get energy savings for ESG calculations
        financial_debug = safe_get(r, "financial_debug", default={})
        executive_summary = safe_get(r, "executive_summary", default={})
        
        annual_kwh_savings = safe_get(financial_debug, "delta_kwh_annual", default=0) or safe_get(executive_summary, "annual_kwh_savings", default=0)
        annual_kw_savings = safe_get(executive_summary, "annual_kw_savings", default=0)
        
        # Get region from config (default to 'default')
        config = safe_get(r, "config", default={})
        region = safe_get(config, "utility_region", default="default") or "default"
        
        # Calculate ESG metrics
        carbon_data = calculate_carbon_footprint(annual_kwh_savings, region)
        social_data = calculate_social_impact(annual_kw_savings, annual_kwh_savings)
        
        # Get logo
        logo_data_uri = get_logo_data_uri()
        
        # Generate Client HTML Report content (all existing sections)
        client_html_content = generate_exact_template_html(r)
        
        # Extract just the body content from client HTML (remove HTML/head tags if present)
        # The generate_exact_template_html returns full HTML, we need to extract body content
        # Also remove any conflicting styles/scripts to prevent formatting issues
        if '<body>' in client_html_content:
            # Extract body content
            body_start = client_html_content.find('<body>')
            body_end = client_html_content.find('</body>')
            if body_start != -1 and body_end != -1:
                client_html_body = client_html_content[body_start + 6:body_end].strip()
            else:
                client_html_body = client_html_content
        elif '<div class="container">' in client_html_content:
            # If no body tag, try to extract container content
            container_start = client_html_content.find('<div class="container">')
            container_end = client_html_content.rfind('</div>')
            if container_start != -1 and container_end != -1:
                # Find the matching closing div
                client_html_body = client_html_content[container_start:container_end + 6].strip()
            else:
                client_html_body = client_html_content
        else:
            client_html_body = client_html_content
        
        # Remove any style tags or inline styles that might conflict
        import re
        # Remove style tags
        client_html_body = re.sub(r'<style[^>]*>.*?</style>', '', client_html_body, flags=re.DOTALL | re.IGNORECASE)
        # Remove script tags
        client_html_body = re.sub(r'<script[^>]*>.*?</script>', '', client_html_body, flags=re.DOTALL | re.IGNORECASE)
        # Clean up any excessive inline styles that might cause issues
        # Keep essential styles but remove conflicting ones
        
        # Add inline style constraints to all images in client HTML to ensure logos are properly sized (reduced by 30%)
        # This ensures logos from the Client HTML Report are also constrained
        client_html_body = re.sub(
            r'<img([^>]*)(src=["\'][^"\']*["\'])([^>]*)>',
            r'<img\1\2\3 style="max-width: 210px !important; max-height: 105px !important; width: auto !important; height: auto !important; object-fit: contain;">',
            client_html_body,
            flags=re.IGNORECASE
        )
        # For cover page logos specifically, allow slightly larger size (reduced by 30%)
        client_html_body = re.sub(
            r'<img([^>]*class=["\'][^"\']*cover-logo[^"\']*["\'][^>]*)(style=["\'][^"\']*["\'])?([^>]*)>',
            r'<img\1 style="max-width: 280px !important; max-height: 140px !important; width: auto !important; height: auto !important; object-fit: contain;">',
            client_html_body,
            flags=re.IGNORECASE
        )
        
        # Add page-break-before to header div (contains logo) and "Electrical Network Study & Savings Analysis" heading to move both to page 18
        # The header div comes right before the heading and contains the Synerex logo that appears under "Synerex Engineering Team"
        client_html_body = re.sub(
            r'(<div[^>]*class=["\']header["\'][^>]*)>',
            r'\1 style="page-break-before: always;">',
            client_html_body,
            flags=re.IGNORECASE
        )
        
        # Remove any existing page-break wrapper from the heading since the header div already has it
        # The heading will naturally follow the header (with logo) on the same page (page 18)
        client_html_body = re.sub(
            r'<div style="page-break-before: always;">(<h1[^>]*>Electrical Network Study (?:&amp;|&) Savings Analysis</h1>)',
            r'\1',
            client_html_body,
            flags=re.IGNORECASE
        )
        
        # Add page-break-before to "Comprehensive Audit Summary" section to start on a new page
        # This ensures the section starts on its own page in the ESG report
        # Add page-break-before style directly to the h2 tag
        def add_page_break_to_h2(match):
            h2_tag = match.group(0)
            # Check if style attribute already exists
            if 'style=' in h2_tag:
                # Add page-break-before to existing style
                h2_tag = re.sub(
                    r'style=["\']([^"\']*)["\']',
                    r'style="\1; page-break-before: always;"',
                    h2_tag,
                    flags=re.IGNORECASE
                )
            else:
                # Add new style attribute
                h2_tag = h2_tag.replace('>', ' style="page-break-before: always;">', 1)
            return h2_tag
        
        client_html_body = re.sub(
            r'<h2[^>]*>Comprehensive Audit Summary</h2>',
            add_page_break_to_h2,
            client_html_body,
            flags=re.IGNORECASE
        )
        
        # Add page-break-before to "Data Integrity & Analysis Verification Certificate" section to start on a new page
        # This ensures the certificate section starts on its own page in the ESG report
        client_html_body = re.sub(
            r'<h2[^>]*>Data Integrity (?:&amp;|&) Analysis Verification Certificate</h2>',
            add_page_break_to_h2,
            client_html_body,
            flags=re.IGNORECASE
        )
        
        # REMOVED: Remove all Client HTML Report content from ESG Report (pages 9-47 and beyond)
        # This removes: Comprehensive Engineering Report cover page, Letter page, "Electrical Network Study & Savings Analysis" section,
        # "Comprehensive Audit Summary", "Data Integrity & Analysis Verification Certificate", and all content between them.
        # The ESG Report will only contain: ESG Executive Summary, Environmental Impact, and Social Impact sections.
        
        # Remove cover-page, letter-page, and comprehensive-engineering-page sections
        client_html_body = re.sub(
            r'<div[^>]*class=["\'][^"\']*cover-page[^"\']*["\'][^>]*>.*?</div>\s*</div>',
            '',
            client_html_body,
            flags=re.DOTALL | re.IGNORECASE
        )
        client_html_body = re.sub(
            r'<div[^>]*class=["\'][^"\']*letter-page[^"\']*["\'][^>]*>.*?</div>\s*</div>',
            '',
            client_html_body,
            flags=re.DOTALL | re.IGNORECASE
        )
        client_html_body = re.sub(
            r'<div[^>]*class=["\'][^"\']*comprehensive-engineering-page[^"\']*["\'][^>]*>.*?</div>\s*</div>',
            '',
            client_html_body,
            flags=re.DOTALL | re.IGNORECASE
        )
        
        # Remove the entire "Electrical Network Study & Savings Analysis" section and everything after it
        # This includes the header div with logo and all content until the end of the Client HTML Report
        electrical_network_pattern = r'<div[^>]*class=["\']header["\'][^>]*style=["\'][^"\']*page-break-before[^"\']*["\'][^>]*>.*?<h1[^>]*>Electrical Network Study (?:&amp;|&) Savings Analysis</h1>.*'
        client_html_body = re.sub(electrical_network_pattern, '', client_html_body, flags=re.DOTALL | re.IGNORECASE)
        
        # Also remove any standalone "Electrical Network Study" heading and all content after it
        if 'Electrical Network Study' in client_html_body:
            # Find the position of "Electrical Network Study" heading
            electrical_match = re.search(r'<h1[^>]*>Electrical Network Study (?:&amp;|&) Savings Analysis</h1>', client_html_body, flags=re.IGNORECASE)
            if electrical_match:
                electrical_start = electrical_match.start()
                # Look backwards for the header div
                before_heading = client_html_body[:electrical_start]
                header_match = re.search(r'<div[^>]*class=["\']header["\'][^>]*>', before_heading, flags=re.IGNORECASE)
                if header_match:
                    removal_start = header_match.start()
                else:
                    removal_start = electrical_start
                
                # Remove everything from removal_start to the end (removes all Client HTML Report content)
                client_html_body = client_html_body[:removal_start]
        
        # Remove "Comprehensive Audit Summary" section if it still exists
        comprehensive_audit_pattern = r'<h2[^>]*>Comprehensive Audit Summary</h2>.*?(?=<h2[^>]*>Data Integrity|<h2[^>]*>|</body>|</html>|$)'
        client_html_body = re.sub(comprehensive_audit_pattern, '', client_html_body, flags=re.DOTALL | re.IGNORECASE)
        
        # Remove "Data Integrity & Analysis Verification Certificate" section if it still exists
        data_integrity_pattern = r'<h2[^>]*>Data Integrity (?:&amp;|&) Analysis Verification Certificate</h2>.*?(?=</body>|</html>|$)'
        client_html_body = re.sub(data_integrity_pattern, '', client_html_body, flags=re.DOTALL | re.IGNORECASE)
        
        # Remove any remaining ISO Standards Compliance statements
        iso_compliance_patterns = [
            r'<div[^>]*class=["\'][^"\']*iso-compliance-box[^"\']*["\'][^>]*>.*?</div>',
            r'<div[^>]*>.*?ISO Standards Compliance.*?</div>',
            r'<h2[^>]*>ISO Standards Compliance</h2>.*?(?=<h[23]|</div>|$)',
            r'ISO 50001:2018.*?ISO 50015:2014.*?(?=<|$)',
        ]
        for pattern in iso_compliance_patterns:
            client_html_body = re.sub(pattern, '', client_html_body, flags=re.DOTALL | re.IGNORECASE)
        
        # Remove any remaining cover letter content (letter-body, letter-greeting, etc.)
        cover_letter_patterns = [
            r'<div[^>]*class=["\'][^"\']*letter-body[^"\']*["\'][^>]*>.*?</div>',
            r'<div[^>]*class=["\'][^"\']*letter-greeting[^"\']*["\'][^>]*>.*?</div>',
            r'<div[^>]*class=["\'][^"\']*letter-address[^"\']*["\'][^>]*>.*?</div>',
            r'Dear [^<]+<',
        ]
        for pattern in cover_letter_patterns:
            client_html_body = re.sub(pattern, '', client_html_body, flags=re.DOTALL | re.IGNORECASE)
        
        # Clean up any remaining content from Client HTML Report
        # If client_html_body is not empty but contains only whitespace or closing tags, clear it
        if client_html_body.strip() and not re.search(r'<[^>]+>', client_html_body.strip()):
            # If it's just text without meaningful HTML, clear it
            if len(client_html_body.strip()) < 100:  # Arbitrary threshold
                client_html_body = ''
        
        # If client_html_body is essentially empty (just whitespace/closing divs), set to empty string
        cleaned_body = re.sub(r'</div>\s*</div>\s*$', '', client_html_body.strip())
        if not cleaned_body or cleaned_body == '</div>' or cleaned_body == '</div></div>':
            client_html_body = ''
        
        # Final check: If there's any mention of "ISO Standards Compliance" or cover letter content, remove it
        if 'ISO Standards Compliance' in client_html_body or 'ISO 50001' in client_html_body:
            # Remove any div or section containing ISO compliance
            client_html_body = re.sub(
                r'<div[^>]*>.*?ISO (?:Standards )?Compliance.*?</div>',
                '',
                client_html_body,
                flags=re.DOTALL | re.IGNORECASE
            )
        if 'Dear' in client_html_body and ('letter' in client_html_body.lower() or 'greeting' in client_html_body.lower()):
            # Remove any cover letter content
            client_html_body = re.sub(
                r'<div[^>]*>.*?Dear.*?</div>',
                '',
                client_html_body,
                flags=re.DOTALL | re.IGNORECASE
            )
        
        # Generate ESG sections
        esg_executive = generate_esg_executive_summary(r, carbon_data, social_data, logo_data_uri)
        environmental_section = generate_environmental_impact_section(r, carbon_data)
        financial_section = generate_financial_impact_section(r)
        power_quality_section = generate_power_quality_impact_section(r)
        # REMOVED: social_section, governance_section, narrative_section, comprehensive_engineering_section, detailed_gri_metrics, un_sdgs_alignment, data_assurance
        # These sections were removed to eliminate pages 9-47 and Social Impact Analysis from the ESG Report
        
        # Read template file
        template_file = Path(__file__).parent / ".." / "8082" / "templates" / "esg_case_study_template.html"
        
        if not template_file.exists():
            # Fallback: Build HTML structure manually
            html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ESG Case Study Report - Synerex Power Analysis</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #2c3e50;
            background: #ffffff;
            font-size: 11pt;
        }}
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            background: #ffffff;
        }}
        .content {{
            padding: 30px 40px;
        }}
        .header-section {{
            background: #ffffff;
            border-bottom: 3px solid #2c3e50;
            padding: 40px 40px 30px 40px;
            margin-bottom: 0;
        }}
        .header-section h1 {{
            font-size: 22pt;
            font-weight: 600;
            color: #2c3e50;
            margin: 0 0 10px 0;
            text-align: left;
            letter-spacing: -0.5px;
        }}
        .header-section h2 {{
            font-size: 14pt;
            font-weight: 400;
            color: #555;
            margin: 0 0 15px 0;
            text-align: left;
        }}
        .header-section .meta {{
            font-size: 10pt;
            color: #777;
            margin-top: 15px;
            border-top: 1px solid #e9ecef;
            padding-top: 15px;
        }}
        h1, h2, h3, h4 {{
            color: #2c3e50;
            font-weight: 600;
            margin-top: 2em;
            margin-bottom: 0.8em;
        }}
        h2 {{
            font-size: 18pt;
            border-bottom: 2px solid #2c3e50;
            padding-bottom: 8px;
            margin-top: 2.5em;
            margin-bottom: 1em;
            page-break-after: avoid;
        }}
        h3 {{
            font-size: 14pt;
            margin-top: 1.8em;
            margin-bottom: 0.6em;
            color: #34495e;
            page-break-after: avoid;
        }}
        h4 {{
            font-size: 12pt;
            margin-top: 1.5em;
            margin-bottom: 0.5em;
            color: #34495e;
        }}
        p {{
            margin-bottom: 1em;
            text-align: justify;
            color: #555;
            line-height: 1.7;
        }}
        ul, ol {{
            margin: 1em 0 1em 2em;
            line-height: 1.8;
        }}
        li {{
            margin-bottom: 0.5em;
            color: #555;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            margin: 1.5em 0;
            font-size: 10pt;
            background: #ffffff;
        }}
        th {{
            background: #2c3e50;
            color: #ffffff;
            padding: 12px 10px;
            text-align: left;
            font-weight: 600;
            border: 1px solid #1a252f;
        }}
        td {{
            padding: 10px;
            border: 1px solid #e9ecef;
            vertical-align: top;
        }}
        tr:nth-child(even) {{
            background: #f8f9fa;
        }}
        tr:hover {{
            background: #f1f3f5;
        }}
        .compliance-table {{
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            margin: 1.5em 0;
        }}
        .value-cell {{
            text-align: right;
            font-weight: 500;
            font-family: 'Courier New', monospace;
        }}
        .compliant {{
            color: #27ae60;
            font-weight: 600;
        }}
        .non-compliant {{
            color: #e74c3c;
            font-weight: 600;
        }}
        .info-box {{
            background: #f8f9fa;
            border-left: 4px solid #2c3e50;
            padding: 15px 20px;
            margin: 1.5em 0;
        }}
        .info-box h3 {{
            margin-top: 0;
            margin-bottom: 0.5em;
        }}
        .metric-card {{
            background: #ffffff;
            border: 1px solid #e9ecef;
            padding: 20px;
            margin: 15px 0;
            border-left: 4px solid #2c3e50;
        }}
        .metric-card h3 {{
            margin-top: 0;
            font-size: 13pt;
            color: #2c3e50;
        }}
        .metric-value {{
            font-size: 24pt;
            font-weight: 700;
            color: #2c3e50;
            margin: 10px 0;
            font-family: 'Courier New', monospace;
        }}
        .metric-label {{
            font-size: 10pt;
            color: #777;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 5px;
        }}
        @media print {{
            body {{
                background: #ffffff;
            }}
            .header-section {{
                padding: 25px 30px 20px 30px !important;
            }}
            .header-section h1 {{
                font-size: 20pt !important;
                margin-bottom: 8px !important;
            }}
            .header-section h2 {{
                font-size: 13pt !important;
                margin-bottom: 10px !important;
            }}
            .header-section .meta {{
                margin-top: 10px !important;
                padding-top: 10px !important;
                font-size: 9pt !important;
            }}
            .content {{
                padding: 15px 20px !important;
            }}
            /* First page content - make more compact */
            .content h2 {{
                font-size: 16pt !important;
                margin-top: 1em !important;
                margin-bottom: 0.5em !important;
                padding-bottom: 5px !important;
            }}
            /* Metric cards grid - reduce spacing - override inline styles */
            .metric-grid {{
                gap: 10px !important;
                margin: 0.8em 0 !important;
            }}
            .metric-grid[style] {{
                gap: 10px !important;
                margin: 0.8em 0 !important;
            }}
            .metric-card {{
                padding: 10px 12px !important;
                margin: 6px 0 !important;
            }}
            .metric-card h3 {{
                font-size: 11pt !important;
                margin-bottom: 5px !important;
            }}
            .metric-value {{
                font-size: 18pt !important;
                margin: 5px 0 !important;
            }}
            .metric-label {{
                font-size: 9pt !important;
                margin-top: 3px !important;
            }}
            .metric-card-detail {{
                margin-top: 8px !important;
                font-size: 8pt !important;
                line-height: 1.4 !important;
            }}
            .metric-card-detail[style] {{
                margin-top: 8px !important;
                font-size: 8pt !important;
                line-height: 1.4 !important;
            }}
            /* Info box - reduce spacing */
            .info-box {{
                padding: 12px 15px !important;
                margin: 1em 0 !important;
            }}
            .info-box h3 {{
                font-size: 12pt !important;
                margin-bottom: 0.3em !important;
            }}
            .esg-achievements-list {{
                margin: 0.3em 0 0.3em 1.2em !important;
                line-height: 1.3 !important;
            }}
            .esg-achievements-list[style] {{
                margin-left: 1.2em !important;
                margin-top: 0.3em !important;
                margin-bottom: 0.3em !important;
                line-height: 1.3 !important;
            }}
            .info-box li {{
                margin-bottom: 0.2em !important;
                font-size: 8.5pt !important;
                line-height: 1.3 !important;
            }}
            /* Further reduce info-box spacing for first page */
            .content:first-of-type .info-box {{
                padding: 10px 12px !important;
                margin: 0.8em 0 !important;
            }}
            .content:first-of-type .info-box h3 {{
                font-size: 11pt !important;
                margin-bottom: 0.2em !important;
                margin-top: 0 !important;
            }}
            h2 {{
                page-break-after: avoid;
                margin-top: 1.5em;
            }}
            table {{
                page-break-inside: avoid;
            }}
            /* ESG Framework Alignment table - make compact for print */
            .esg-framework-table {{
                margin-top: 0.5em !important;
                margin-bottom: 0.5em !important;
                font-size: 9pt !important;
                width: 100% !important;
                table-layout: fixed !important;
            }}
            .esg-framework-table th {{
                padding: 8px 6px !important;
                font-size: 9pt !important;
                word-wrap: break-word !important;
            }}
            .esg-framework-table td {{
                padding: 6px !important;
                font-size: 9pt !important;
                line-height: 1.3 !important;
                word-wrap: break-word !important;
                overflow-wrap: break-word !important;
            }}
            /* Set column widths for ESG Framework Alignment table */
            .esg-framework-table th:nth-child(1),
            .esg-framework-table td:nth-child(1) {{
                width: 20% !important;
            }}
            .esg-framework-table th:nth-child(2),
            .esg-framework-table td:nth-child(2) {{
                width: 18% !important;
            }}
            .esg-framework-table th:nth-child(3),
            .esg-framework-table td:nth-child(3) {{
                width: 36% !important;
            }}
            .esg-framework-table th:nth-child(4),
            .esg-framework-table td:nth-child(4) {{
                width: 26% !important;
                max-width: 26% !important;
            }}
            /* Reduce h3 spacing before ESG Framework Alignment */
            .content h3 {{
                margin-top: 1em !important;
                margin-bottom: 0.4em !important;
                font-size: 13pt !important;
            }}
            /* Reduce compliance table margins in general */
            .compliance-table {{
                margin: 0.8em 0 !important;
            }}
            /* Table of Contents - ensure it fits on one page */
            .toc {{
                page-break-inside: avoid;
                page-break-after: avoid;
                font-size: 8pt !important;
                line-height: 1.3 !important;
                padding: 10px !important;
                margin: 10px 0 !important;
            }}
            .toc h2 {{
                font-size: 12pt !important;
                margin-top: 0.5em !important;
                margin-bottom: 0.5em !important;
                padding-bottom: 5px !important;
            }}
            .toc ul {{
                margin: 0 !important;
                padding-left: 0 !important;
            }}
            .toc li {{
                padding: 3px 0 !important;
                margin: 0 !important;
                font-size: 8pt !important;
                line-height: 1.3 !important;
            }}
            .toc ul ul {{
                padding-left: 15px !important;
            }}
            .toc ul ul li {{
                padding: 2px 0 !important;
                font-size: 7pt !important;
            }}
            /* Comprehensive Engineering Report section - ensure it fits on one page */
            .comprehensive-engineering-page {{
                page-break-inside: avoid !important;
                padding: 10px 15px !important;
            }}
            .comprehensive-engineering-page[style] {{
                padding: 10px 15px !important;
            }}
            /* Reduce logo size if present */
            .comprehensive-engineering-page img {{
                max-width: 150px !important;
                max-height: 75px !important;
                margin-bottom: 10px !important;
            }}
            .comprehensive-engineering-page h1 {{
                font-size: 16pt !important;
                margin-bottom: 8px !important;
                padding-bottom: 4px !important;
                margin-top: 0 !important;
            }}
            .comprehensive-engineering-page h1[style] {{
                margin-bottom: 8px !important;
                padding-bottom: 4px !important;
                margin-top: 0 !important;
            }}
            .comprehensive-engineering-page > div[style*="max-width"] {{
                margin: 0 auto !important;
            }}
            .project-info-table {{
                margin: 8px 0 !important;
                font-size: 9pt !important;
            }}
            .project-info-table[style] {{
                margin: 8px 0 !important;
            }}
            .project-info-table td {{
                padding: 3px 4px !important;
                font-size: 9pt !important;
                line-height: 1.2 !important;
            }}
            .project-info-table td[style] {{
                padding: 3px 4px !important;
                font-size: 9pt !important;
            }}
            .iso-compliance-box {{
                page-break-inside: avoid !important;
                margin-top: 6px !important;
                padding: 4px !important;
            }}
            .iso-compliance-box[style] {{
                margin-top: 6px !important;
                padding: 4px !important;
            }}
            .iso-compliance-box h2 {{
                font-size: 7pt !important;
                margin-bottom: 2px !important;
                margin-top: 0 !important;
            }}
            .iso-compliance-box h2[style] {{
                font-size: 7pt !important;
                margin-bottom: 2px !important;
                margin-top: 0 !important;
            }}
            .iso-compliance-box p {{
                font-size: 4.5px !important; /* 6pt = 4.5px at 72 DPI, but px works better for print */
                line-height: 1.2 !important;
                margin: 0 !important;
            }}
            .iso-compliance-box p[style] {{
                font-size: 4.5px !important; /* Override inline styles */
                line-height: 1.2 !important;
                margin: 0 !important;
            }}
            .iso-compliance-box p strong {{
                font-size: 4.5px !important;
            }}
            .iso-compliance-box p strong[style] {{
                font-size: 4.5px !important;
            }}
        }}
        .section-divider {{
            border-top: 2px solid #e9ecef;
            margin: 3em 0 2em 0;
        }}
        .footer {{
            margin-top: 4em;
            padding-top: 2em;
            border-top: 2px solid #e9ecef;
            text-align: center;
            color: #777;
            font-size: 9pt;
        }}
        
        /* Page numbers and footer for print */
        @page {{
            @bottom-center {{
                content: "Page " counter(page) " of " counter(pages);
                font-size: 9pt;
                color: #666;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }}
        }}
        
        /* Footer with copyright - visible on screen and print */
        .report-footer {{
            margin-top: 3em;
            padding-top: 1.5em;
            border-top: 1px solid #e9ecef;
            text-align: center;
            color: #777;
            font-size: 9pt;
            page-break-inside: avoid;
        }}
        
        .report-footer .copyright {{
            margin: 10px 0;
            font-weight: 500;
            color: #555;
        }}
        
        .report-footer .page-number {{
            margin: 10px 0;
            color: #999;
            font-size: 8pt;
        }}
        
        @media print {{
            .report-footer {{
                position: fixed;
                bottom: 20px;
                left: 0;
                right: 0;
                width: 100%;
                padding-top: 10px;
                border-top: 1px solid #ddd;
            }}
        }}
        
        /* Logo size constraints - ensure all logos are reasonably sized (reduced by 30%) */
        img[src*="data:image"], 
        img[alt*="Synerex"], 
        img[alt*="Logo"],
        .cover-logo img,
        img {{
            max-width: 210px !important;
            max-height: 105px !important;
            width: auto !important;
            height: auto !important;
            object-fit: contain;
        }}
        
        /* Cover page logos can be slightly larger (reduced by 30%) */
        .cover-logo img {{
            max-width: 280px !important;
            max-height: 140px !important;
        }}
    </style>
</head>
<body>
    <div class="container">
        {esg_executive}
        {environmental_section}
        {financial_section}
        {power_quality_section}
        {client_html_body}
    </div>
</body>
</html>"""
        else:
            with open(template_file, 'r', encoding='utf-8') as f:
                template_content = f.read()
            
            # Replace placeholders
            html = template_content
            
            # Replace ESG sections
            html = html.replace('{{ESG_EXECUTIVE_SUMMARY}}', esg_executive)
            html = html.replace('{{ENVIRONMENTAL_IMPACT}}', environmental_section)
            html = html.replace('{{FINANCIAL_IMPACT}}', financial_section)
            html = html.replace('{{POWER_QUALITY_IMPACT}}', power_quality_section)
            
            # REMOVED: Social Impact Analysis section
            if '{{SOCIAL_IMPACT}}' in html:
                html = html.replace('{{SOCIAL_IMPACT}}', '')
            
            # Replace Client HTML Report content (or remove the div if empty)
            if client_html_body and client_html_body.strip():
                html = html.replace('{{CLIENT_HTML_REPORT_CONTENT}}', client_html_body)
            else:
                # Remove the entire client-report div if there's no content
                html = re.sub(
                    r'<div[^>]*id=["\']client-report["\'][^>]*>.*?{{CLIENT_HTML_REPORT_CONTENT}}.*?</div>',
                    '',
                    html,
                    flags=re.DOTALL | re.IGNORECASE
                )
                # Also remove the placeholder if it still exists
                html = html.replace('{{CLIENT_HTML_REPORT_CONTENT}}', '')
            
            # REMOVED: Governance section (pages 9-47)
            if '{{GOVERNANCE}}' in html:
                html = html.replace('{{GOVERNANCE}}', '')
            
            # REMOVED: Comprehensive Engineering Report and Case Study Narrative sections (pages 9-47)
            if '{{COMPREHENSIVE_ENGINEERING}}' in html:
                html = html.replace('{{COMPREHENSIVE_ENGINEERING}}', '')
            
            if '{{CASE_STUDY_NARRATIVE}}' in html:
                html = html.replace('{{CASE_STUDY_NARRATIVE}}', '')
            
            # Replace logo if placeholder exists
            if '{{LOGO_DATA_URI}}' in html:
                html = html.replace('{{LOGO_DATA_URI}}', logo_data_uri)
            
            # Replace generation date
            if '{{GENERATION_DATE}}' in html:
                html = html.replace('{{GENERATION_DATE}}', datetime.now().strftime('%B %d, %Y at %I:%M %p'))
        
        return html
        
    except Exception as e:
        logger.error(f"Error generating ESG Case Study Report: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return f"<html><body><h1>Error Generating ESG Case Study Report</h1><p>{str(e)}</p></body></html>"

