#!/usr/bin/env python3
"""
Sankey Diagram Generator for Energy Flow Visualization
Generates interactive Sankey diagrams showing energy flow through facilities
"""

import json
import logging
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)

def extract_energy_flow_data(results: Dict, form_data: Dict = None, config: Dict = None) -> Dict:
    """
    Extract energy flow data from analysis results for Sankey diagram
    
    Args:
        results: Analysis results dictionary
        form_data: Form data containing facility information
        config: Configuration dictionary
        
    Returns:
        Dictionary with nodes, links, and flow data for Sankey diagram
    """
    try:
        # Try multiple locations for power data (results structure varies)
        avg_kw_before = 0
        avg_kw_after = 0
        
        # Method 1: Check top-level before_data/after_data
        before_data = results.get('before_data', {})
        after_data = results.get('after_data', {})
        
        logger.debug(f"Sankey debug - before_data keys: {list(before_data.keys())[:10] if isinstance(before_data, dict) else 'not a dict'}")
        logger.debug(f"Sankey debug - after_data keys: {list(after_data.keys())[:10] if isinstance(after_data, dict) else 'not a dict'}")
        
        if before_data.get('avgKw'):
            if isinstance(before_data['avgKw'], dict):
                avg_kw_before = before_data['avgKw'].get('mean', 0) or 0
            else:
                avg_kw_before = float(before_data['avgKw']) or 0
        
        if after_data.get('avgKw'):
            if isinstance(after_data['avgKw'], dict):
                avg_kw_after = after_data['avgKw'].get('mean', 0) or 0
            else:
                avg_kw_after = float(after_data['avgKw']) or 0
        
        # Method 1b: Check totalKw in before_data/after_data
        if avg_kw_before == 0 and before_data.get('totalKw'):
            if isinstance(before_data['totalKw'], dict):
                avg_kw_before = before_data['totalKw'].get('mean', 0) or 0
            else:
                avg_kw_before = float(before_data['totalKw']) or 0
        
        if avg_kw_after == 0 and after_data.get('totalKw'):
            if isinstance(after_data['totalKw'], dict):
                avg_kw_after = after_data['totalKw'].get('mean', 0) or 0
            else:
                avg_kw_after = float(after_data['totalKw']) or 0
        
        # Method 1c: Check 'power' field
        if avg_kw_before == 0 and before_data.get('power'):
            if isinstance(before_data['power'], dict):
                avg_kw_before = before_data['power'].get('mean', 0) or 0
            else:
                avg_kw_before = float(before_data['power']) or 0
        
        if avg_kw_after == 0 and after_data.get('power'):
            if isinstance(after_data['power'], dict):
                avg_kw_after = after_data['power'].get('mean', 0) or 0
            else:
                avg_kw_after = float(after_data['power']) or 0
        
        # Method 2: Check power_quality.before/after structure
        if avg_kw_before == 0 or avg_kw_after == 0:
            power_quality = results.get('power_quality', {})
            logger.debug(f"Sankey debug - power_quality keys: {list(power_quality.keys())[:10] if isinstance(power_quality, dict) else 'not a dict'}")
            
            pq_before = power_quality.get('before', {})
            pq_after = power_quality.get('after', {})
            
            if avg_kw_before == 0 and pq_before.get('avgKw'):
                if isinstance(pq_before['avgKw'], dict):
                    avg_kw_before = pq_before['avgKw'].get('mean', 0) or 0
                else:
                    avg_kw_before = float(pq_before['avgKw']) or 0
            
            if avg_kw_after == 0 and pq_after.get('avgKw'):
                if isinstance(pq_after['avgKw'], dict):
                    avg_kw_after = pq_after['avgKw'].get('mean', 0) or 0
                else:
                    avg_kw_after = float(pq_after['avgKw']) or 0
        
        # Method 3: Check flat power_quality structure (kw_before, kw_after)
        if avg_kw_before == 0 or avg_kw_after == 0:
            power_quality = results.get('power_quality', {})
            if avg_kw_before == 0:
                kw_before_val = power_quality.get('kw_before')
                if kw_before_val is not None:
                    avg_kw_before = float(kw_before_val) if kw_before_val != 0 else 0
            if avg_kw_after == 0:
                kw_after_val = power_quality.get('kw_after')
                if kw_after_val is not None:
                    avg_kw_after = float(kw_after_val) if kw_after_val != 0 else 0
        
        # Use after period as primary, fallback to before
        total_kw = avg_kw_after if avg_kw_after > 0 else avg_kw_before
        
        logger.debug(f"Sankey debug - Final values: before={avg_kw_before}, after={avg_kw_after}, total={total_kw}")
        
        if total_kw <= 0:
            logger.warning(f"No valid power data found for Sankey diagram. before={avg_kw_before}, after={avg_kw_after}, results keys: {list(results.keys())[:10]}")
            logger.warning(f"before_data sample: {str(before_data)[:200] if before_data else 'None'}")
            logger.warning(f"after_data sample: {str(after_data)[:200] if after_data else 'None'}")
            return None
        
        # Get facility type from config or form_data
        facility_type = None
        if config:
            facility_type = config.get('facility_type') or config.get('facilityType')
        if not facility_type and form_data:
            facility_type = form_data.get('facility_type') or form_data.get('facilityType')
        
        # Get network losses if available (check multiple locations)
        power_quality = results.get('power_quality', {})
        network_losses = power_quality.get('network_losses', {})
        total_losses_kw = 0
        
        logger.debug(f"Sankey debug - network_losses keys: {list(network_losses.keys())[:10] if isinstance(network_losses, dict) else 'not a dict'}")
        
        if isinstance(network_losses, dict):
            # Try different loss field names (kW values)
            total_losses_kw = (network_losses.get('total_losses_kw', 0) or
                               network_losses.get('total_losses', 0) or
                               network_losses.get('losses_kw', 0) or 0)
            
            # If not found, try summing individual loss components
            if total_losses_kw == 0:
                conductor_loss = network_losses.get('conductor_loss_reduction', 0) or network_losses.get('conductor_loss_kw', 0) or 0
                transformer_copper = network_losses.get('transformer_copper_loss_reduction', 0) or network_losses.get('transformer_copper_loss_kw', 0) or 0
                transformer_stray = network_losses.get('transformer_stray_loss_reduction', 0) or network_losses.get('transformer_stray_loss_kw', 0) or 0
                total_losses_kw = float(conductor_loss) + float(transformer_copper) + float(transformer_stray)
                logger.debug(f"Sankey debug - Summed losses: conductor={conductor_loss}, copper={transformer_copper}, stray={transformer_stray}, total={total_losses_kw}")
            
            # If still 0, try converting from annual kWh to average kW
            if total_losses_kw == 0:
                delta_kwh_annual = network_losses.get('delta_kwh_annual', 0) or network_losses.get('annual_losses_kwh', 0) or 0
                if delta_kwh_annual > 0:
                    # Convert annual kWh to average kW (assuming 8760 hours/year)
                    total_losses_kw = float(delta_kwh_annual) / 8760.0
                    logger.debug(f"Sankey debug - Converted from annual kWh: {delta_kwh_annual} kWh/year = {total_losses_kw:.3f} kW average")
        
        # Also check results.network_losses directly
        if total_losses_kw == 0:
            top_level_losses = results.get('network_losses', {})
            logger.debug(f"Sankey debug - top-level network_losses keys: {list(top_level_losses.keys())[:10] if isinstance(top_level_losses, dict) else 'not a dict'}")
            
            if isinstance(top_level_losses, dict):
                # Try kW values first
                total_losses_kw = (top_level_losses.get('total_losses_kw', 0) or
                                    top_level_losses.get('total_losses', 0) or 0)
                
                # If not found, try summing components
                if total_losses_kw == 0:
                    conductor_loss = top_level_losses.get('conductor_loss_reduction', 0) or top_level_losses.get('conductor_loss_kw', 0) or 0
                    transformer_copper = top_level_losses.get('transformer_copper_loss_reduction', 0) or top_level_losses.get('transformer_copper_loss_kw', 0) or 0
                    transformer_stray = top_level_losses.get('transformer_stray_loss_reduction', 0) or top_level_losses.get('transformer_stray_loss_kw', 0) or 0
                    total_losses_kw = float(conductor_loss) + float(transformer_copper) + float(transformer_stray)
                
                # If still 0, try converting from annual kWh
                if total_losses_kw == 0:
                    delta_kwh_annual = top_level_losses.get('delta_kwh_annual', 0) or top_level_losses.get('annual_losses_kwh', 0) or 0
                    if delta_kwh_annual > 0:
                        total_losses_kw = float(delta_kwh_annual) / 8760.0
        
        logger.debug(f"Sankey debug - Final losses: {total_losses_kw:.3f} kW")
        
        # Calculate useful energy (total - losses)
        useful_energy = max(0, total_kw - total_losses_kw)
        
        # Build nodes and links based on facility type
        nodes = []
        links = []
        node_index_map = {}
        
        def get_or_add_node(name: str, category: str = None) -> int:
            """Get node index, creating node if it doesn't exist"""
            if name not in node_index_map:
                node_index_map[name] = len(nodes)
                nodes.append({
                    'name': name,
                    'category': category or 'default'
                })
            return node_index_map[name]
        
        # Start with utility grid
        utility_idx = get_or_add_node('Utility Grid', 'source')
        
        # Add facility-specific flows
        if facility_type:
            facility_flows = _get_facility_specific_flows(facility_type, form_data, config, total_kw, useful_energy, total_losses_kw)
        else:
            # Generic facility flow
            facility_flows = _get_generic_flows(total_kw, useful_energy, total_losses_kw)
        
        # Build links from flows
        for flow in facility_flows:
            source_idx = get_or_add_node(flow['source'], flow.get('source_category', 'default'))
            target_idx = get_or_add_node(flow['target'], flow.get('target_category', 'default'))
            
            links.append({
                'source': source_idx,
                'target': target_idx,
                'value': flow['value'],
                'label': flow.get('label', ''),
                'color': flow.get('color', 'rgba(0,100,200,0.5)')
            })
        
        return {
            'nodes': nodes,
            'links': links,
            'total_energy_kw': total_kw,
            'useful_energy_kw': useful_energy,
            'losses_kw': total_losses_kw,
            'efficiency_pct': (useful_energy / total_kw * 100) if total_kw > 0 else 0
        }
        
    except Exception as e:
        logger.error(f"Error extracting energy flow data: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return None

def _get_generic_flows(total_kw: float, useful_energy: float, losses: float) -> List[Dict]:
    """Get generic energy flows for general facilities"""
    flows = []
    
    # Utility to main distribution
    flows.append({
        'source': 'Utility Grid',
        'target': 'Main Distribution',
        'value': total_kw,
        'source_category': 'source',
        'target_category': 'distribution',
        'color': 'rgba(0,100,200,0.6)'
    })
    
    # Distribution to loads (estimated breakdown)
    if total_kw > 0:
        # Production/Process (40%)
        process_kw = total_kw * 0.40
        flows.append({
            'source': 'Main Distribution',
            'target': 'Production/Process',
            'value': process_kw,
            'source_category': 'distribution',
            'target_category': 'load',
            'color': 'rgba(255,165,0,0.6)'
        })
        
        # HVAC (30%)
        hvac_kw = total_kw * 0.30
        flows.append({
            'source': 'Main Distribution',
            'target': 'HVAC System',
            'value': hvac_kw,
            'source_category': 'distribution',
            'target_category': 'load',
            'color': 'rgba(0,150,0,0.6)'
        })
        
        # Lighting (10%)
        lighting_kw = total_kw * 0.10
        flows.append({
            'source': 'Main Distribution',
            'target': 'Lighting',
            'value': lighting_kw,
            'source_category': 'distribution',
            'target_category': 'load',
            'color': 'rgba(255,255,0,0.6)'
        })
        
        # Other loads (20%)
        other_kw = total_kw * 0.20
        flows.append({
            'source': 'Main Distribution',
            'target': 'Other Loads',
            'value': other_kw,
            'source_category': 'distribution',
            'target_category': 'load',
            'color': 'rgba(150,150,150,0.6)'
        })
        
        # Losses
        if losses > 0:
            flows.append({
                'source': 'Main Distribution',
                'target': 'System Losses',
                'value': losses,
                'source_category': 'distribution',
                'target_category': 'loss',
                'color': 'rgba(255,0,0,0.6)'
            })
    
    return flows

def _get_facility_specific_flows(facility_type: str, form_data: Dict, config: Dict, 
                                total_kw: float, useful_energy: float, losses: float) -> List[Dict]:
    """Get facility-specific energy flows based on facility type"""
    flows = []
    
    # Common: Utility to Main Distribution
    flows.append({
        'source': 'Utility Grid',
        'target': 'Main Distribution',
        'value': total_kw,
        'source_category': 'source',
        'target_category': 'distribution',
        'color': 'rgba(0,100,200,0.6)'
    })
    
    # Manufacturing facilities
    if 'manufacturing' in facility_type.lower() or 'industrial' in facility_type.lower():
        if total_kw > 0:
            # Production equipment (50%)
            flows.append({
                'source': 'Main Distribution',
                'target': 'Production Equipment',
                'value': total_kw * 0.50,
                'color': 'rgba(255,165,0,0.6)'
            })
            # Compressed air (15%)
            flows.append({
                'source': 'Main Distribution',
                'target': 'Compressed Air',
                'value': total_kw * 0.15,
                'color': 'rgba(0,150,255,0.6)'
            })
            # HVAC (20%)
            flows.append({
                'source': 'Main Distribution',
                'target': 'HVAC',
                'value': total_kw * 0.20,
                'color': 'rgba(0,150,0,0.6)'
            })
            # Other (15%)
            flows.append({
                'source': 'Main Distribution',
                'target': 'Other Loads',
                'value': total_kw * 0.15,
                'color': 'rgba(150,150,150,0.6)'
            })
    
    # Data Center facilities
    elif 'data' in facility_type.lower() or 'gpu' in facility_type.lower():
        if total_kw > 0:
            # IT Equipment (40%)
            flows.append({
                'source': 'Main Distribution',
                'target': 'IT Equipment',
                'value': total_kw * 0.40,
                'color': 'rgba(0,100,200,0.6)'
            })
            # Cooling (35%)
            flows.append({
                'source': 'Main Distribution',
                'target': 'Cooling System',
                'value': total_kw * 0.35,
                'color': 'rgba(0,150,0,0.6)'
            })
            # UPS (15%)
            flows.append({
                'source': 'Main Distribution',
                'target': 'UPS System',
                'value': total_kw * 0.15,
                'color': 'rgba(255,165,0,0.6)'
            })
            # Other (10%)
            flows.append({
                'source': 'Main Distribution',
                'target': 'Other Loads',
                'value': total_kw * 0.10,
                'color': 'rgba(150,150,150,0.6)'
            })
    
    # Healthcare facilities
    elif 'healthcare' in facility_type.lower() or 'hospital' in facility_type.lower():
        if total_kw > 0:
            # Medical Equipment (30%)
            flows.append({
                'source': 'Main Distribution',
                'target': 'Medical Equipment',
                'value': total_kw * 0.30,
                'color': 'rgba(255,0,0,0.6)'
            })
            # HVAC (40% - 24/7 operation)
            flows.append({
                'source': 'Main Distribution',
                'target': 'HVAC System',
                'value': total_kw * 0.40,
                'color': 'rgba(0,150,0,0.6)'
            })
            # Lighting (10%)
            flows.append({
                'source': 'Main Distribution',
                'target': 'Lighting',
                'value': total_kw * 0.10,
                'color': 'rgba(255,255,0,0.6)'
            })
            # Other (20%)
            flows.append({
                'source': 'Main Distribution',
                'target': 'Other Loads',
                'value': total_kw * 0.20,
                'color': 'rgba(150,150,150,0.6)'
            })
    
    # Hospitality facilities
    elif 'hospitality' in facility_type.lower() or 'hotel' in facility_type.lower():
        if total_kw > 0:
            # HVAC (35%)
            flows.append({
                'source': 'Main Distribution',
                'target': 'HVAC System',
                'value': total_kw * 0.35,
                'color': 'rgba(0,150,0,0.6)'
            })
            # Kitchen (20%)
            flows.append({
                'source': 'Main Distribution',
                'target': 'Kitchen Equipment',
                'value': total_kw * 0.20,
                'color': 'rgba(255,165,0,0.6)'
            })
            # Lighting (15%)
            flows.append({
                'source': 'Main Distribution',
                'target': 'Lighting',
                'value': total_kw * 0.15,
                'color': 'rgba(255,255,0,0.6)'
            })
            # Other (30%)
            flows.append({
                'source': 'Main Distribution',
                'target': 'Other Loads',
                'value': total_kw * 0.30,
                'color': 'rgba(150,150,150,0.6)'
            })
    
    # Cold Storage facilities
    elif 'cold' in facility_type.lower() or 'storage' in facility_type.lower():
        if total_kw > 0:
            # Refrigeration (60%)
            flows.append({
                'source': 'Main Distribution',
                'target': 'Refrigeration',
                'value': total_kw * 0.60,
                'color': 'rgba(0,150,255,0.6)'
            })
            # HVAC (20%)
            flows.append({
                'source': 'Main Distribution',
                'target': 'HVAC',
                'value': total_kw * 0.20,
                'color': 'rgba(0,150,0,0.6)'
            })
            # Other (20%)
            flows.append({
                'source': 'Main Distribution',
                'target': 'Other Loads',
                'value': total_kw * 0.20,
                'color': 'rgba(150,150,150,0.6)'
            })
    
    else:
        # Fallback to generic flows
        return _get_generic_flows(total_kw, useful_energy, losses)
    
    # Add losses if available
    if losses > 0:
        flows.append({
            'source': 'Main Distribution',
            'target': 'System Losses',
            'value': losses,
            'source_category': 'distribution',
            'target_category': 'loss',
            'color': 'rgba(255,0,0,0.6)'
        })
    
    return flows

def generate_sankey_diagram_html(flow_data: Dict, chart_id: str = 'sankey_chart', 
                                 width: int = 800, height: int = 600) -> str:
    """
    Generate HTML/JavaScript for Plotly Sankey diagram
    
    Args:
        flow_data: Dictionary with nodes and links from extract_energy_flow_data
        chart_id: HTML element ID for the chart
        width: Chart width in pixels
        height: Chart height in pixels
        
    Returns:
        HTML string with embedded JavaScript for Plotly Sankey diagram
    """
    if not flow_data or not flow_data.get('nodes') or not flow_data.get('links'):
        return '<div class="sankey-placeholder">Energy flow data not available</div>'
    
    try:
        nodes = flow_data['nodes']
        links = flow_data['links']
        
        # Extract node names and colors
        node_names = [node['name'] for node in nodes]
        node_colors = _get_node_colors(nodes)
        
        # Extract link data
        source_indices = [link['source'] for link in links]
        target_indices = [link['target'] for link in links]
        values = [link['value'] for link in links]
        link_colors = [link.get('color', 'rgba(0,100,200,0.5)') for link in links]
        
        # Generate Plotly JavaScript
        html = f'''
        <div id="{chart_id}_container" style="width: 100%; height: {height}px; margin: 20px 0;">
            <div id="{chart_id}" style="width: 100%; height: 100%;"></div>
        </div>
        <script src="https://cdn.plot.ly/plotly-2.26.0.min.js"></script>
        <script>
            (function() {{
                var retryCount = 0;
                var maxRetries = 50; // 5 seconds max wait (50 * 100ms)
                
                function renderChart() {{
                    if (typeof Plotly === 'undefined') {{
                        // Plotly not loaded yet, wait a bit and try again
                        retryCount++;
                        if (retryCount < maxRetries) {{
                            setTimeout(renderChart, 100);
                        }} else {{
                            var errorDiv = document.getElementById('{chart_id}');
                            if (errorDiv) {{
                                errorDiv.innerHTML = '<div style="padding: 20px; background: #fff3cd; border-radius: 4px; text-align: center; color: #856404;">Could not load Plotly library for energy flow visualization</div>';
                            }}
                        }}
                        return;
                    }}
                    
                    var chartElement = document.getElementById('{chart_id}');
                    if (!chartElement) {{
                        // Element not found, wait for DOM
                        retryCount++;
                        if (retryCount < maxRetries) {{
                            setTimeout(renderChart, 100);
                        }} else {{
                            console.error('Sankey chart element not found after retries');
                        }}
                        return;
                    }}
                    
                    var data = {{
                        type: "sankey",
                        orientation: "h",
                        node: {{
                            pad: 15,
                            thickness: 20,
                            line: {{
                                color: "black",
                                width: 0.5
                            }},
                            label: {json.dumps(node_names)},
                            color: {json.dumps(node_colors)}
                        }},
                        link: {{
                            source: {json.dumps(source_indices)},
                            target: {json.dumps(target_indices)},
                            value: {json.dumps(values)},
                            color: {json.dumps(link_colors)}
                        }}
                    }};
                    
                    var layout = {{
                        title: {{
                            text: "Energy Flow Diagram",
                            font: {{ size: 16, color: "#2c3e50" }}
                        }},
                        font: {{ size: 12, color: "#333" }},
                        paper_bgcolor: "white",
                        plot_bgcolor: "white",
                        width: {width},
                        height: {height}
                    }};
                    
                    var config = {{
                        displayModeBar: true,
                        responsive: true,
                        modeBarButtonsToRemove: ['lasso2d', 'select2d']
                    }};
                    
                    try {{
                        Plotly.newPlot('{chart_id}', [data], layout, config);
                    }} catch (error) {{
                        console.error('Error rendering Sankey chart:', error);
                        var errorDiv = document.getElementById('{chart_id}');
                        if (errorDiv) {{
                            errorDiv.innerHTML = '<div style="padding: 20px; background: #f8d7da; border-radius: 4px; text-align: center; color: #721c24;">Error rendering energy flow diagram: ' + error.message + '</div>';
                        }}
                    }}
                }}
                
                // Wait for DOM and Plotly to be ready
                if (document.readyState === 'loading') {{
                    document.addEventListener('DOMContentLoaded', renderChart);
                }} else {{
                    // DOM already loaded, just wait for Plotly
                    renderChart();
                }}
            }})();
        </script>
        <div style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 4px;">
            <p style="margin: 0; font-size: 0.9em; color: #666;">
                <strong>Total Energy:</strong> {flow_data.get('total_energy_kw', 0):.1f} kW | 
                <strong>Useful Energy:</strong> {flow_data.get('useful_energy_kw', 0):.1f} kW | 
                <strong>System Losses:</strong> {flow_data.get('losses_kw', 0):.1f} kW | 
                <strong>Efficiency:</strong> {flow_data.get('efficiency_pct', 0):.1f}%
            </p>
        </div>
        '''
        
        return html
        
    except Exception as e:
        logger.error(f"Error generating Sankey diagram HTML: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return f'<div class="sankey-error">Error generating energy flow diagram: {str(e)}</div>'

def _get_node_colors(nodes: List[Dict]) -> List[str]:
    """Get colors for nodes based on category"""
    color_map = {
        'source': '#3498db',      # Blue
        'distribution': '#95a5a6', # Gray
        'load': '#2ecc71',        # Green
        'loss': '#e74c3c',         # Red
        'default': '#9b59b6'       # Purple
    }
    
    colors = []
    for node in nodes:
        category = node.get('category', 'default')
        colors.append(color_map.get(category, color_map['default']))
    
    return colors

def generate_sankey_diagram_json(flow_data: Dict) -> Dict:
    """
    Generate JSON data structure for Sankey diagram (for API responses)
    
    Args:
        flow_data: Dictionary with nodes and links
        
    Returns:
        JSON-serializable dictionary for Plotly Sankey
    """
    if not flow_data or not flow_data.get('nodes') or not flow_data.get('links'):
        return None
    
    try:
        nodes = flow_data['nodes']
        links = flow_data['links']
        
        node_names = [node['name'] for node in nodes]
        node_colors = _get_node_colors(nodes)
        
        return {
            'type': 'sankey',
            'orientation': 'h',
            'node': {
                'pad': 15,
                'thickness': 20,
                'line': {
                    'color': 'black',
                    'width': 0.5
                },
                'label': node_names,
                'color': node_colors
            },
            'link': {
                'source': [link['source'] for link in links],
                'target': [link['target'] for link in links],
                'value': [link['value'] for link in links],
                'color': [link.get('color', 'rgba(0,100,200,0.5)') for link in links]
            }
        }
    except Exception as e:
        logger.error(f"Error generating Sankey diagram JSON: {e}")
        return None

