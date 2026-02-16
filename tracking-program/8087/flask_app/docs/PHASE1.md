# Phase 1: Flask Scaffold - Complete

## Created

- `app/` - Flask app factory, config, extensions, placeholder packages (models, api, services, helpers)
- `app/config.py` - Config from env (DB, license, storage, constants)
- `app/extensions.py` - Flask-SQLAlchemy, Flask-Login
- `requirements.txt` - Flask, PyMySQL (replacing mysqlclient for easier dev setup), flask-socketio, etc.
- `run.py`, `wsgi.py` - Entry points

## Verify

```bash
cd tracking-program/8087/flask_app
python3 -m venv venv
. venv/bin/activate
pip install -r requirements.txt
PORT=8088 python run.py
```

Then: `curl http://localhost:8088/health` → `{"status": "healthy"}`

## Note

- Uses **PyMySQL** instead of mysqlclient (no MySQL dev libraries needed)
- Empty `TRACKING_DB_URL` → sqlite `:memory:` fallback so app starts
- Port 8088 used for verification to avoid conflict with Sails on 8087

## Next: Phase 2

Convert Waterline models to SQLAlchemy.
