import sqlite3
import json

# Connect to database
conn = sqlite3.connect('8082/results/app.db')
cursor = conn.cursor()

# Check AT&T project data
cursor.execute('SELECT data FROM projects WHERE name = ?', ('AT&T Central Office-Addison_Texas',))
row = cursor.fetchone()

if row and row[0]:
    print('✅ AT&T project data exists!')
    data = json.loads(row[0])
    print(f'Number of fields: {len(data)}')
    print('Sample fields:')
    for i, key in enumerate(list(data.keys())[:10]):
        print(f'  {i+1}. {key}: {data[key]}')
    
    # Check for key fields
    key_fields = ['facility_address', 'projectName', 'cp_company', 'cp_address']
    print('\nKey fields:')
    for field in key_fields:
        if field in data:
            print(f'  ✅ {field}: {data[field]}')
        else:
            print(f'  ❌ {field}: NOT FOUND')
else:
    print('❌ AT&T project data is missing or empty')

conn.close()
