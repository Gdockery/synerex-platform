#!/usr/bin/env python3
"""
Synerex OneForm - Main Application (Port 8000)
"""

import os
import sys
from flask import Flask, jsonify, request, render_template
from flask_cors import CORS

app = Flask(__name__, 
            template_folder='8082/templates',
            static_folder='8082/static')
CORS(app)

@app.route('/health')
def health():
    return jsonify({
        "status": "healthy",
        "service": "Synerex OneForm Main App",
        "port": 8000,
        "version": "2.0.0"
    })

@app.route('/')
def index():
    import time
    cache_bust = int(time.time())
    return render_template('main_dashboard.html', cache_bust=cache_bust)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=False)
