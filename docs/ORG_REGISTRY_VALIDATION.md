# Org Registry Implementation – Validation Summary

## Implementation Status

| Component | Status |
|-----------|--------|
| License `POST /api/orgs/ensure` | Done |
| Tracking Client.org_id, create_client → ensure_org | Done |
| Tracking Project.org_id, set from client on create | Done |
| Tracking license_required: store org_id in session from token | Done |
| Tracking email/password login: set session orgId from client.org_id | Done |
| Tracking license_required: fallback to session user orgId/org_id | Done |
| Backfill: `flask client-org-id-backfill` for clients with null org_id | Done |
| EMV: ensure_org when org_id missing (analysis-first flow) | Done |
| Migrations: client-org-id-migrate, project-org-id-migrate | Done |

## What Was Validated

### 1. License Service – `POST /api/orgs/ensure`

- **Create new org** (no org_id): 201, `created: true`
- **Adopt existing** (org_id provided, exists): 200, `created: false`
- **Create with custom org_id**: 201, `created: true`

```bash
# Run License service (MySQL required):
cd license-service/services/license-service
. venv/bin/activate
DB_URL="mysql+pymysql://user:pass@localhost:3306/licensing" ROOT_PATH="" uvicorn app.main:app --port 8000

# Test:
curl -X POST http://localhost:8000/api/orgs/ensure \
  -H "Content-Type: application/json" \
  -d '{"org_name": "Acme Corp", "org_type": "customer"}'
```

### 2. Tracking org_registry Client

- Calls License `/api/orgs/ensure` with `org_name`, `org_type`, optional `org_id`
- Returns `org_id` on success

### 3. Tracking Migration – `flask client-org-id-migrate`

- Adds `org_id` column to `client` table
- Idempotent: returns ok if column already exists
- Requires MySQL (TRACKING_DB_URL)

### 4. Config Fix (License)

- Added `root_path` to License `Settings` so `ROOT_PATH` from `.env` is accepted (fixes Pydantic validation error).

---

## Environment / DB Config

### License Service

| Var | Purpose |
|-----|---------|
| `DB_URL` | MySQL required (e.g. `mysql+pymysql://user:pass@host:3306/licensing`) |
| `ROOT_PATH` | URL prefix when behind proxy (e.g. `/license`). Can be `""` for standalone. |
| `CORS_ORIGINS` | Comma-separated allowed origins |

### ECBS Intelligence Platform

| Var | Purpose |
|-----|---------|
| `TRACKING_DB_URL` | MySQL required (e.g. `mysql://user:pass@host:port/db`) |
| `LICENSE_SERVICE_URL` | License base URL (e.g. `http://localhost:8000`) |

### Running With Docker Compose

- License uses MySQL from `mysql` service; `DB_URL` in `.env` should point to that.
- Tracking uses `tracking-program/8087` with Flask in `8087/flask_app`.

---

## Quick Validation Commands

```bash
# 1. License ensure endpoint
cd license-service/services/license-service && . venv/bin/activate
DB_URL="mysql+pymysql://user:pass@localhost:3306/licensing" python -m uvicorn app.main:app --port 8010 &
sleep 3 && curl -s -X POST http://localhost:8010/api/orgs/ensure \
  -H "Content-Type: application/json" -d '{"org_name":"Test","org_type":"customer"}'

# 2. Tracking migrations (MySQL)
cd tracking-program/8087/flask_app && . venv/bin/activate
TRACKING_DB_URL=mysql://user:pass@localhost:3306/tracking flask client-org-id-migrate
TRACKING_DB_URL=mysql://user:pass@localhost:3306/tracking flask project-org-id-migrate

# 3. Backfill existing clients without org_id (License service must be up)
LICENSE_SERVICE_URL=http://localhost:8000 TRACKING_DB_URL=mysql://... flask client-org-id-backfill

# 3. Tracking org_registry
LICENSE_SERVICE_URL=http://localhost:8010 python -c "
from app.services.org_registry import ensure_org
print(ensure_org(org_name='Test Client', org_type='customer'))
"
```
