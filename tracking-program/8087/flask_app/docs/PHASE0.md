# Phase 0: Preparation - Complete

## Step 0.1: Environment Variable Inventory

- **Created**: `tracking-program/8087/flask_app/.env.example`
- **Contents**: All required env vars from config/local.js, datastores.js, whitelabel.js, routes.js, storage.js
- **Action**: Copy to `.env` and fill in values before Phase 1

## Step 0.2: Project Location Decision

**Confirmed**: 
- Cutover complete: Flask backend at `tracking-program/8087/flask_app/`

## Step 0.3: API Contract Capture

- **Created**: `tracking-program/8087/flask_app/docs/api_contracts/README.md`
- **Purpose**: Document critical endpoints and format for capturing request/response samples
- **Action**: Before Phase 4, run Sails and capture samples for `/api/account`, `/api/project`, `/api/client`, meter data, ticker, whitelabel, verify-jwt

## Next: Phase 1

Create Flask scaffold: app factory, config, requirements.txt, run.py, wsgi.py.
