#!/usr/bin/env python3
"""
Synerex OneForm - API Gateway (Port 8002)
"""

import os
import sys
import requests
from flask import Flask, jsonify, request, redirect, url_for
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Service endpoints
SERVICES = {
    'main_app': {
        'primary': 'http://localhost:8000',
        'backup': 'http://localhost:8001'
    },
    'pdf_service': {
        'envelope': 'http://localhost:8101',
        'standard': 'http://localhost:8102'
    },
    'weather': 'http://localhost:8200',
    'chart': 'http://localhost:8201'
}

@app.route('/health')
def health():
    return jsonify({
        "status": "healthy",
        "service": "API Gateway",
        "port": 8002,
        "services": SERVICES
    })

@app.route('/')
def index():
    # Route to main app
    try:
        response = requests.get(f"{SERVICES['main_app']['primary']}/", timeout=5)
        return response.content
    except:
        # Fallback to backup
        try:
            response = requests.get(f"{SERVICES['main_app']['backup']}/", timeout=5)
            return response.content
        except:
            return "Service temporarily unavailable", 503

@app.route('/api/<path:path>')
def api_proxy(path):
    # Route API calls to appropriate services
    if 'pdf' in path:
        # Route to PDF service
        try:
            response = requests.request(
                method=request.method,
                url=f"{SERVICES['pdf_service']['envelope']}/api/{path}",
                headers=dict(request.headers),
                data=request.get_data(),
                timeout=30
            )
            return response.content, response.status_code
        except:
            return "PDF service unavailable", 503
    else:
        # Route to main app
        try:
            response = requests.request(
                method=request.method,
                url=f"{SERVICES['main_app']['primary']}/api/{path}",
                headers=dict(request.headers),
                data=request.get_data(),
                timeout=30
            )
            return response.content, response.status_code
        except:
            return "Main service unavailable", 503

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8002))
    app.run(host='0.0.0.0', port=port, debug=False)
