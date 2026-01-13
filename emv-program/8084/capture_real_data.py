#!/usr/bin/env python3
"""
Capture and analyze the real data structure from the UI
"""

import json
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["*"])

@app.route('/capture', methods=['POST', 'OPTIONS'])
def capture_data():
    if request.method == 'OPTIONS':
        response = jsonify({"status": "ok"})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        return response
    
    try:
        # Get raw data
        raw_data = request.get_data()
        print(f"=== CAPTURED REAL DATA STRUCTURE ===")
        print(f"Received {len(raw_data)} bytes of data")
        
        # Try to parse JSON
        data = None
        try:
            data = request.get_json(force=True)
            print("Successfully parsed using Flask's get_json()")
        except Exception as e:
            print(f"Flask get_json() failed: {e}")
        
        if data is None:
            try:
                data = json.loads(raw_data.decode('utf-8'))
                print("Successfully parsed using manual json.loads()")
            except json.JSONDecodeError as e:
                print(f"Manual JSON decode error: {e}")
                return jsonify({"error": f"Invalid JSON: {str(e)}"}), 400
        
        if data is None:
            return jsonify({"error": "Could not parse JSON data"}), 400
        
        print(f"Data type: {type(data)}")
        print(f"Top level keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
        
        # Print the entire data structure
        print("=== FULL DATA STRUCTURE ===")
        print(json.dumps(data, indent=2))
        print("=== END DATA STRUCTURE ===")
        
        # Save to file for analysis
        with open("captured_real_data.json", "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        
        print("Data saved to captured_real_data.json")
        
        return jsonify({"status": "captured", "keys": list(data.keys()) if isinstance(data, dict) else []})
        
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

if __name__ == '__main__':
    print("🚀 Starting Data Capture Service on port 8089...")
    print("📱 Capture Data: POST http://localhost:8089/capture")
    print("🛑 Press Ctrl+C to stop")
    print("--------------------------------------------------")
    app.run(host='0.0.0.0', port=8089, debug=False)
