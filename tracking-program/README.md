# ECBS Intelligence Platform

Flask backend with Angular frontend for the Synerex Tracking (SYNEREX) application.

## Structure

```
tracking-program/
├── 8087/                 # Main app directory
│   ├── flask_app/        # Flask backend (API, auth, web routes)
│   ├── assets/           # Static assets, uploads
│   ├── whitelabel/       # Branding per hostname
│   └── [Angular source]  # Frontend build input
├── 8087-rollup/          # Rollup service (port 1339)
└── 8087-errands/        # Errands service (port 1340)
```

## Quick Start

### Local development
```bash
cd 8087/flask_app
. venv/bin/activate
python run.py
```

Or use the launcher script to start main + rollup + errands:
```bash
cd 8087/flask_app
./scripts/launch_flask_stack.sh
```

### Docker
The tracking services are defined in the root `docker-compose.yml`:
- `tracking-program` (port 8087)
- `tracking-rollup` (1339)
- `tracking-errands` (1340)
- `tracking-cron` (alerts every 5 min)

```bash
# From repo root
docker-compose up -d tracking-program tracking-rollup tracking-errands
```

## Configuration

Copy `8087/flask_app/.env.example` to `.env` and set:
- `TRACKING_DB_URL` – MySQL connection
- `LICENSE_SERVICE_URL` – License service for JWT/auth
- `STORAGE_LOCAL_PATH` – Optional; defaults to `../assets`
