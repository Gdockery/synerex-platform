#!/usr/bin/env python3
"""
Synerex OneForm - Backup Application (Port 8001)
"""

import os
import sys
from flask import Flask, jsonify, request, render_template
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/health')
def health():
    return jsonify({
        "status": "healthy",
        "service": "Synerex OneForm Backup App",
        "port": 8001,
        "version": "2.0.0"
    })

@app.route('/')
def index():
    return render_template('main_dashboard.html')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8001))
    app.run(host='0.0.0.0', port=port, debug=False)
