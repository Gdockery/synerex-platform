import sqlite3
import json

# Connect to database
conn = sqlite3.connect('8082/results/app.db')
cursor = conn.cursor()

# Get AT&T project data
cursor.execute('SELECT name, data FROM projects WHERE name LIKE "%AT&T%"')
row = cursor.fetchone()

if row:
    name, data_str = row
    print(f'Project name: {name}')
    
    # Parse the JSON
    data = json.loads(data_str)
    print(f'Top-level keys: {list(data.keys())}')
    print(f'Has payload: {"payload" in data}')
    
    if 'payload' in data:
        payload = data['payload']
        print(f'Payload type: {type(payload)}')
        
        if isinstance(payload, str):
            # It's a JSON string, parse it
            inner_data = json.loads(payload)
            print(f'Inner data keys: {len(inner_data)} fields')
            print(f'Sample fields: {list(inner_data.keys())[:5]}')
        elif isinstance(payload, dict):
            print(f'Payload is already a dict with {len(payload)} fields')
            print(f'Sample fields: {list(payload.keys())[:5]}')
    
    print(f'Total fields in outer data: {len(data)}')
else:
    print('AT&T project not found')

conn.close()
