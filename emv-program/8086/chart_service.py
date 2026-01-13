#!/usr/bin/env python3
"""
Chart Generation Service
Handles matplotlib chart generation separately from main analysis
"""

import os
import sys
import json
import logging
import traceback
from flask import Flask, request, jsonify
from flask_cors import CORS
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import numpy as np
from io import StringIO
import warnings

# Suppress matplotlib warnings
warnings.filterwarnings('ignore', category=UserWarning)
warnings.filterwarnings('ignore', category=FutureWarning)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

class ChartGenerator:
    """Handles chart generation with proper error handling"""
    
    def __init__(self):
        self.setup_matplotlib()
    
    def setup_matplotlib(self):
        """Configure matplotlib for headless operation"""
        try:
            plt.style.use('default')
            plt.rcParams['figure.figsize'] = (10, 6)
            plt.rcParams['font.size'] = 10
            plt.rcParams['axes.linewidth'] = 0.5
            plt.rcParams['grid.alpha'] = 0.3
            logger.info("Matplotlib configured successfully")
        except Exception as e:
            logger.error(f"Error configuring matplotlib: {e}")
    
    def generate_envelope_chart_svg(self, data, metric, title):
        """Generate envelope chart as SVG"""
        try:
            logger.info(f"Generating envelope chart for {metric}")
            
            # Extract data
            before_data = data.get('before', {}).get(metric, {})
            after_data = data.get('after', {}).get(metric, {})
            
            if not before_data or not after_data:
                logger.warning(f"Missing data for {metric}")
                return None
            
            before_values = before_data.get('values', [])
            after_values = after_data.get('values', [])
            
            if not before_values or not after_values:
                logger.warning(f"Empty values for {metric}")
                return None
            
            # Create figure
            fig, ax = plt.subplots(figsize=(12, 8))
            
            # Plot data
            x_before = range(len(before_values))
            x_after = range(len(after_values))
            
            ax.plot(x_before, before_values, 'b-', linewidth=2, label='Before Synerex', alpha=0.8)
            ax.plot(x_after, after_values, 'r-', linewidth=2, label='After Synerex', alpha=0.8)
            
            # Customize chart
            ax.set_title(title, fontsize=14, fontweight='bold', pad=20)
            ax.set_xlabel('Time Points', fontsize=12)
            ax.set_ylabel(metric.upper(), fontsize=12)
            ax.grid(True, alpha=0.3)
            
            # Position legend outside the chart area using figure coordinates
            legend = fig.legend(['Before Synerex', 'After Synerex'], 
                              loc='lower center', 
                              bbox_to_anchor=(0.5, 0.02), 
                              bbox_transform=fig.transFigure,
                              ncol=2, 
                              fontsize=9, 
                              framealpha=0.9)
            
            # Adjust layout with extra space for legend outside the chart
            plt.tight_layout()
            plt.subplots_adjust(bottom=0.15)
            
            # Convert to SVG
            svg_buffer = StringIO()
            plt.savefig(svg_buffer, format='svg', bbox_inches='tight', dpi=100)
            svg_content = svg_buffer.getvalue()
            svg_buffer.close()
            plt.close(fig)
            
            logger.info(f"Successfully generated envelope chart for {metric}")
            return svg_content
            
        except Exception as e:
            logger.error(f"Error generating envelope chart for {metric}: {e}")
            logger.error(traceback.format_exc())
            return None
    
    def generate_smoothing_index_chart_svg(self, smoothing_data):
        """Generate smoothing index chart as SVG"""
        try:
            logger.info("Generating smoothing index chart")
            
            if not smoothing_data:
                logger.warning("No smoothing data provided")
                return None
            
            # Extract metrics
            metrics = list(smoothing_data.keys())
            if not metrics:
                logger.warning("No metrics in smoothing data")
                return None
            
            # Prepare data
            variance_improvements = []
            cv_improvements = []
            
            for metric in metrics:
                metric_data = smoothing_data.get(metric, {})
                variance_improvements.append(metric_data.get('variance_improvement', 0))
                cv_improvements.append(metric_data.get('cv_improvement', 0))
            
            # Create figure
            fig, ax1 = plt.subplots(1, 1, figsize=(8, 4))
            
            # Combined smoothing improvement chart
            x_pos = np.arange(len(metrics))
            width = 0.35

            bars1 = ax1.bar(x_pos - width/2, variance_improvements, width, label='Variance Reduction', color='skyblue', alpha=0.7)
            bars2 = ax1.bar(x_pos + width/2, cv_improvements, width, label='CV Reduction', color='lightcoral', alpha=0.7)

            ax1.set_title('Smoothing Improvement by Metric', fontsize=12, fontweight='bold')
            ax1.set_xlabel('Metrics')
            ax1.set_ylabel('Improvement (%)')
            ax1.set_xticks(x_pos)
            ax1.set_xticklabels(metrics, rotation=45, ha='right')
            ax1.legend()
            ax1.grid(True, alpha=0.3)
            
            # Set proper axis limits to ensure bars are visible
            ax1.set_xlim(-0.5, len(metrics) - 0.5)
            # Set y-axis limits based on data range with some padding
            all_values = variance_improvements + cv_improvements
            if all_values:
                y_min = min(all_values) - 5
                y_max = max(all_values) + 5
                ax1.set_ylim(y_min, y_max)

            # Add value labels on bars
            for bar, value in zip(bars1, variance_improvements):
                height = bar.get_height()
                ax1.text(bar.get_x() + bar.get_width()/2., height + 1,
                        f'{value:.1f}%', ha='center', va='bottom', fontsize=9)
            for bar, value in zip(bars2, cv_improvements):
                height = bar.get_height()
                ax1.text(bar.get_x() + bar.get_width()/2., height + 1,
                        f'{value:.1f}%', ha='center', va='bottom', fontsize=9)
            
            # Adjust layout
            plt.tight_layout()
            
            # Convert to SVG
            svg_buffer = StringIO()
            plt.savefig(svg_buffer, format='svg', bbox_inches='tight', dpi=100)
            svg_content = svg_buffer.getvalue()
            svg_buffer.close()
            plt.close(fig)
            
            logger.info("Successfully generated smoothing index chart")
            return svg_content
            
        except Exception as e:
            logger.error(f"Error generating smoothing index chart: {e}")
            logger.error(traceback.format_exc())
            return None

# Initialize chart generator
chart_generator = ChartGenerator()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "chart_generation"})

@app.route('/generate_charts', methods=['POST'])
def generate_charts():
    """Generate all charts from analysis data"""
    try:
        logger.info("Received chart generation request")
        
        # Get data from request
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        logger.info(f"Data keys: {list(data.keys())}")
        
        # Initialize results
        charts = {}
        
        # Generate envelope charts
        envelope_analysis = data.get('envelope_analysis', {})
        if envelope_analysis:
            logger.info("Generating envelope charts")
            
            # Get before/after data
            before_data = data.get('power_quality', {}).get('before', {})
            after_data = data.get('power_quality', {}).get('after', {})
            
            if before_data and after_data:
                chart_data = {
                    'before': before_data,
                    'after': after_data
                }
                
                # Generate charts for each metric
                metrics = ['avgKw', 'avgKva', 'avgPf', 'avgTHD']
                for metric in metrics:
                    if metric in before_data and metric in after_data:
                        title = f"{metric.upper()} Network Envelope"
                        svg_content = chart_generator.generate_envelope_chart_svg(chart_data, metric, title)
                        if svg_content:
                            charts[f"{metric}_envelope"] = svg_content
                            logger.info(f"Generated {metric} envelope chart")
                        else:
                            logger.warning(f"Failed to generate {metric} envelope chart")
                    else:
                        logger.warning(f"Missing {metric} data for chart generation")
            else:
                logger.warning("Missing before/after data for envelope charts")
        
        # Generate smoothing index chart
        smoothing_data = envelope_analysis.get('smoothing_data', {}).get('metric_details', {})
        if smoothing_data:
            logger.info("Generating smoothing index chart")
            svg_content = chart_generator.generate_smoothing_index_chart_svg(smoothing_data)
            if svg_content:
                charts['smoothing_index'] = svg_content
                logger.info("Generated smoothing index chart")
            else:
                logger.warning("Failed to generate smoothing index chart")
        else:
            logger.warning("No smoothing data for smoothing index chart")
        
        # Return results
        result = {
            "success": True,
            "charts": charts,
            "chart_count": len(charts),
            "message": f"Generated {len(charts)} charts successfully"
        }
        
        logger.info(f"Chart generation completed: {len(charts)} charts generated")
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in chart generation: {e}")
        logger.error(traceback.format_exc())
        return jsonify({
            "success": False,
            "error": str(e),
            "message": "Chart generation failed"
        }), 500

@app.route('/generate_single_chart', methods=['POST'])
def generate_single_chart():
    """Generate a single chart"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        chart_type = data.get('chart_type')
        chart_data = data.get('data')
        title = data.get('title', 'Chart')
        
        if not chart_type or not chart_data:
            return jsonify({"error": "Missing chart_type or data"}), 400
        
        svg_content = None
        
        if chart_type == 'envelope':
            metric = data.get('metric')
            if not metric:
                return jsonify({"error": "Missing metric for envelope chart"}), 400
            svg_content = chart_generator.generate_envelope_chart_svg(chart_data, metric, title)
        elif chart_type == 'smoothing_index':
            svg_content = chart_generator.generate_smoothing_index_chart_svg(chart_data)
        else:
            return jsonify({"error": f"Unknown chart type: {chart_type}"}), 400
        
        if svg_content:
            return jsonify({
                "success": True,
                "chart": svg_content,
                "chart_type": chart_type
            })
        else:
            return jsonify({
                "success": False,
                "error": "Failed to generate chart"
            }), 500
            
    except Exception as e:
        logger.error(f"Error in single chart generation: {e}")
        logger.error(traceback.format_exc())
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8086))
    logger.info(f"Starting Chart Generation Service on port {port}")
    # Windows-compatible Flask configuration
    app.run(host='0.0.0.0', port=port, debug=False, use_reloader=False, threaded=True)

