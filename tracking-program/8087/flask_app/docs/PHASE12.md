# Phase 12: Cutover Planning & Migration

Phase 12 covers the transition from Sails to Flask for the ECBS Intelligence Platform.

## 12.1 Pre-Cutover Checklist

### Environment
- [ ] `TRACKING_DB_URL` – Same MySQL database as Sails (shared schema)
- [ ] Run `scripts/add_user_logo_column.py` with TRACKING_DB_URL if user.userLogo column missing
- [ ] `SECRET_KEY` – New key for Flask sessions (or match Sails for cookie compatibility)
- [ ] `LICENSE_SERVICE_URL` – License service endpoint
- [ ] `S3_BUCKET_NAME`, `S3_REGION` – If using S3 for files
- [ ] `STORAGE_LOCAL_PATH` – Points to 8087/assets or equivalent
- [ ] `WHITELABEL_BASE_PATH` – Points to 8087/whitelabel
- [ ] `DATASYNC_MASTER` / `DATASYNC_SLAVES` – If using DataSync

### Rollup & Errands Cron
- [ ] Rollup app (port 1339): `/schedule`, `/cache-instantaneous-readings`, `/perform-rollup`, `/calculate-tests`, `/accumulate-savings`, `/schedule-switches`
- [ ] Errands app (port 1340): `/check-payment`, `/sync-data`, `/schedule-switches`, `/check-alerts`, `/migrate-xuid`, `/undo-migrate-xuid`, `GET /test`, `GET /reload`
- [ ] Cron: POST to `/check-alerts` on errands (every 1–5 min) for meter/repeater/switch alerts (equivalent to Sails eb/apps/alerts)
- [ ] Cron configured to hit Flask apps instead of Sails

### Static / Angular
- [ ] Angular app (`tracking-program/8087/src/`) – API base URL updated to Flask (or proxy)

## 12.2 Dual-Run Configuration

Run Sails and Flask in parallel for validation:

```bash
# Sails on 8087 (existing)
cd tracking-program/8087 && node app.js

# Flask on 8088 (new)
cd tracking-program/8087/flask_app && PORT=8088 python run.py

# Rollup on 1339, Errands on 1340 (point to Flask DB)
cd tracking-program/8087-rollup && PORT=1339 python run.py
cd tracking-program/8087-errands && PORT=1340 python run.py
```

**Validation**: Use same DB. Compare responses for critical endpoints. Point Angular to 8088 temporarily.

## 12.3 Cutover Runbook

**Helper script** (from `tracking-program/`):
```bash
cd tracking-program/8087/flask_app
./scripts/launch_flask_stack.sh   # Starts main + rollup + errands
```

Or manually:
```bash
cd tracking-program/8087/flask_app && PORT=8087 python run.py &
cd tracking-program/8087-rollup && PORT=1339 python run.py &
cd tracking-program/8087-errands && PORT=1340 python run.py &
```

### Step 1: Stop Sails and Cron
- Stop Sails app (8087)
- Disable cron jobs that hit Sails rollup/errands

### Step 2: Final DB Sync
- Ensure no in-flight Sails transactions
- Verify Flask can connect and run rollup logic

### Step 3: Start Flask Stack
```bash
# Main app (8087)
cd tracking-program/8087/flask_app && PORT=8087 python run.py
# Or: gunicorn -k eventlet -w 1 wsgi:app --bind 0.0.0.0:8087

# Rollup (1339)
cd tracking-program/8087-rollup && python run.py

# Errands (1340)
cd tracking-program/8087-errands && python run.py
```

### Step 4: Re-enable Cron
- Update cron to hit Flask rollup/errands (ports 1339, 1340)

### Step 5: Update Frontend
- Set API base URL to Flask (or nginx/proxy routing)
- Clear browser cache; verify login, ticker, project list

### Step 6: Smoke Tests
- [ ] `GET /api/account` – Logged-in user
- [ ] `GET /api/project` – Project list
- [ ] `GET /api/project/ticker?project=X` – Ticker data
- [ ] Socket.IO connection for live updates
- [ ] Switch schedule create/delete
- [ ] Test report generation
- [ ] `GET /secure/view?budgetReport=TOKEN` – PDF (budgetReport, meterCertificate, budgetInvoice supported)

## 12.4 Reposition Flask App (Optional)

Per Phase 0, at cutover the Flask app can be moved to live alongside Sails:

```
tracking-program/8087/
  flask_app/          <-- Move 8087-flask contents here
    app/
    run.py
    wsgi.py
    ...
  8087-rollup/   <-- Sibling of 8087/
  8087-errands/
  api/                <-- Sails (can be deprecated)
```

**Action**: If desired, `mv tracking-program/8087-flask/* tracking-program/8087/flask_app/` and update import paths / scripts.

## 12.5 Rollback Plan

If issues arise:
1. Stop Flask stack
2. Restart Sails (8087)
3. Re-enable cron to hit Sails (if different)
4. Revert frontend API URL

## 12.6 Post-Cutover

- [ ] Monitor logs (Flask, rollup, errands)
- [ ] Verify DataSync if used
- [ ] Verify IoT/MQTT switch commands
- [ ] Retire Sails once stable
