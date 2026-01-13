#!/usr/bin/env python3
"""
8084 HTML Report Service - Simple and Reliable
Uses generate_exact_template_html for Client HTML Report generation
"""

from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import json
import os
import requests
from datetime import datetime
from pathlib import Path
import importlib
import sys
import logging
import re
from generate_exact_template_html import generate_exact_template_html, generate_layman_report_html

# Set up logging
logger = logging.getLogger(__name__)

# Force reload to get the latest version
if 'generate_exact_template_html' in sys.modules:
    importlib.reload(sys.modules['generate_exact_template_html'])
    from generate_exact_template_html import generate_exact_template_html, generate_layman_report_html

app = Flask(__name__)
CORS(app, origins=["*"])  # Allow all origins

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        "service": "8084 HTML Report Service", 
        "status": "healthy", 
        "version": "1.0.0",
        "port": 8084
    })

@app.route('/generate', methods=['GET', 'POST', 'OPTIONS'])
def generate_report():
    if request.method == 'OPTIONS':
        response = jsonify({"status": "ok"})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST')
        return response
    
    try:
        # ALWAYS use GET to fetch data from main app (Direct GET Approach)
        # This ensures we get the complete stored data structure with all form data merged
        try:
            print("8084 Service: Fetching data from main app via GET /api/analysis/results...")
            response = requests.get('http://127.0.0.1:8082/api/analysis/results', timeout=10)
            if response.status_code == 200:
                data = response.json()
                results = data.get('results', data)
                
                # DEBUG: Log data retrieved from main app
                print(f"8084 Service: Retrieved data keys: {list(results.keys()) if isinstance(results, dict) else 'Not a dict'}")
                print(f"8084 Service: Has 'energy_flow': {'energy_flow' in results if isinstance(results, dict) else 'N/A'}")
                if isinstance(results, dict) and 'energy_flow' in results:
                    ef = results.get('energy_flow', {})
                    print(f"8084 Service: energy_flow type: {type(ef)}, keys: {list(ef.keys()) if isinstance(ef, dict) else 'not a dict'}")
                if 'power_quality' in results:
                    retrieved_kw_before = results['power_quality'].get('kw_before', 'NOT_FOUND')
                    retrieved_kw_after = results['power_quality'].get('kw_after', 'NOT_FOUND')
                    retrieved_current_improvement_pct = results['power_quality'].get('current_improvement_pct', 'NOT_FOUND')
                    print(f"*** DEBUG STEP 9 - HTML SERVICE DATA RETRIEVAL: kw_before = {retrieved_kw_before}, kw_after = {retrieved_kw_after} ***")
                    print(f"*** DEBUG STEP 9 - HTML SERVICE DATA RETRIEVAL: current_improvement_pct = {retrieved_current_improvement_pct} ***")
            else:
                return jsonify({"error": "No analysis results available. Please run an analysis first."}), 404
        except Exception as e:
            print(f"8084 Service: Error fetching from main app: {e}")
            return jsonify({"error": f"Could not fetch data from UI service: {str(e)}"}), 500
        
        print(f"8084 Service: Processing data with keys: {list(results.keys()) if isinstance(results, dict) else 'Not a dict'}")
        print(f"8084 Service: Config keys in results: {list(results.get('config', {}).keys()) if isinstance(results, dict) else 'No config'}")
        print(f"8084 Service: Client profile keys in results: {list(results.get('client_profile', {}).keys()) if isinstance(results, dict) else 'No client_profile'}")
        
        # Generate the HTML report using the exact template function
        print("8084 Service: Calling generate_exact_template_html...")
        try:
            import signal
            import sys
            
            # Set a timeout for report generation (60 seconds)
            def timeout_handler(signum, frame):
                raise TimeoutError("Report generation timed out after 60 seconds")
            
            # Only set timeout on Unix systems
            if hasattr(signal, 'SIGALRM'):
                signal.signal(signal.SIGALRM, timeout_handler)
                signal.alarm(60)
            
            try:
                html_content = generate_exact_template_html(results)
                print(f"8084 Service: Generated HTML content length: {len(html_content)}")
            finally:
                # Cancel timeout
                if hasattr(signal, 'SIGALRM'):
                    signal.alarm(0)
                    
        except TimeoutError as te:
            print(f"8084 Service: Report generation timed out: {te}")
            return jsonify({"error": "Report generation timed out. The report may be too large. Please try again or contact support."}), 500
        except Exception as e:
            print(f"8084 Service: ERROR in generate_exact_template_html: {e}")
            import traceback
            traceback.print_exc()
            # Fallback: try to replace variables manually
            template_file = Path(__file__).parent.parent / "8082" / "report_template.html"
            if template_file.exists():
                with open(template_file, 'r', encoding='utf-8') as f:
                    html_content = f.read()
                # Force replace ALL template variables with empty string
                html_content = re.sub(r'\{\{[A-Za-z0-9_]+\}\}', '', html_content)
                print("8084 Service: Used fallback - replaced all template variables with empty string")
            else:
                return jsonify({"error": f"Could not generate HTML report: {str(e)}"}), 500
        
        # Debug: Check if template variables were replaced
        remaining_vars = re.findall(r'\{\{([A-Za-z0-9_]+)\}\}', html_content)
        if remaining_vars:
            unique_vars = list(set(remaining_vars))
            print(f"[WARN] CRITICAL WARNING: {len(unique_vars)} template variables still remain: {unique_vars[:20]}")
            # FORCE REPLACEMENT: Replace ALL remaining variables
            html_content = re.sub(r'\{\{[A-Za-z0-9_]+\}\}', '', html_content)
            print(f"[WARN] FORCED REPLACEMENT: Removed all remaining {len(unique_vars)} template variables")
        else:
            print("[OK] All template variables successfully replaced")
        
        # FORCE CORRECT SIGN: Fix IEEE kW improvement sign if negative
        if 'ieee_kw_normalized_improvement_pct' in results.get('power_quality', {}):
            improvement = results['power_quality']['ieee_kw_normalized_improvement_pct']
            if isinstance(improvement, str) and improvement.startswith('-'):
                # Remove the negative sign and ensure it shows as positive improvement
                corrected_improvement = improvement[1:]  # Remove the '-'
                if not corrected_improvement.endswith('reduction'):
                    corrected_improvement += ' reduction'
                # Replace in the HTML content
                html_content = html_content.replace(improvement, corrected_improvement)
                print(f"8084 Service: Fixed sign from '{improvement}' to '{corrected_improvement}'")
        
        # Return the HTML content
        return Response(
            html_content,
            mimetype='text/html',
            headers={
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        )
        
    except Exception as e:
        print(f"8084 Service Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/generate-layman', methods=['GET', 'POST', 'OPTIONS'])
def generate_layman_report():
    """Generate layman-friendly executive summary report"""
    if request.method == 'OPTIONS':
        response = jsonify({"status": "ok"})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'GET, POST')
        return response
    
    try:
        # Fetch data from main app
        try:
            print("8084 Service: Fetching data for layman report from main app...")
            response = requests.get('http://127.0.0.1:8082/api/analysis/results', timeout=10)
            if response.status_code == 200:
                data = response.json()
                results = data.get('results', data)
            else:
                return jsonify({"error": "No analysis results available. Please run an analysis first."}), 404
        except Exception as e:
            print(f"8084 Service: Error fetching from main app: {e}")
            return jsonify({"error": f"Could not fetch data from main app: {str(e)}"}), 500
        
        # Generate the layman report
        print("8084 Service: Calling generate_layman_report_html...")
        try:
            html_content = generate_layman_report_html(results)
            print(f"8084 Service: Generated layman HTML content length: {len(html_content)}")
        except Exception as e:
            print(f"8084 Service: ERROR in generate_layman_report_html: {e}")
            import traceback
            traceback.print_exc()
            raise
        
        # Return the HTML content
        return Response(
            html_content,
            mimetype='text/html',
            headers={
                'Content-Type': 'text/html; charset=utf-8',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        )
        
    except Exception as e:
        print(f"8084 Service Error (Layman Report): {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Server error: {str(e)}"}), 500

if __name__ == '__main__':
    print("Starting 8084 HTML Report Service...")
    print("Health check: http://localhost:8084/health")
    print("Generate Report: GET/POST http://localhost:8084/generate")
    print("Generate Layman Report: GET/POST http://localhost:8084/generate-layman")
    print("Press Ctrl+C to stop")
    print("--------------------------------------------------")
    # Windows-compatible Flask configuration
    app.run(host='0.0.0.0', port=8084, debug=False, use_reloader=False, threaded=True)
