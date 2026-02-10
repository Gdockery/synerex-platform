# Troubleshooting

## Login doesn't work (redirects back to login or "Invalid credentials")

**Symptom:** You enter admin / admin123 at `http://localhost/license/admin/login?return_url=...` but stay on the login page or get "Invalid credentials".

**Fixes:**

1. **Use the same host and port every time.** The session cookie is tied to the origin (e.g. `http://localhost` or `http://localhost:8080`). If you open the login page from a link that uses port **8080** but later open the license admin on port **80** (or vice versa), the cookie from the first origin is not sent to the other.  
   - Use one base URL for the license admin and stick to it, e.g. always `http://localhost:8080/license/admin/login` or always `http://localhost/license/admin/login`.

2. **Credentials:** Default is username `admin`, password `admin123`. They are set in `.env` as `ADMIN_USERNAME` and `ADMIN_PASSWORD`. Restart the license-service after changing `.env`.

3. **Restart license-service** after any config or code change so the new session and login logic are loaded.

4. **Verify the backend and credentials:** Open in a browser or curl:
   ```bash
   curl -s http://localhost/license/admin/login/status
   ```
   You should see `{"admin_configured":true,"ok":true}`. If `admin_configured` is `false`, set `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `.env` and restart the container.

5. **Test credentials directly (bypass browser/cookies):**
   ```bash
   curl -s -X POST http://localhost/license/admin/login/check \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"admin123"}'
   ```
   If you see `{"ok":true,"valid":true,...}`, the server accepts admin/admin123 and the problem is likely the browser (cookies, same-origin, or form POST not reaching the license service). If you see `"valid":false`, the server’s expected credentials differ; check `.env` and restart.

6. **Watch server logs while trying to log in:** In one terminal run:
   ```bash
   docker compose logs -f license-service
   ```
   Then try to log in in the browser. You should see either `License admin login success for user=admin` or `License admin login failed: username_match=... password_match=... received_user_len=...`. If you see no log line at all, the POST is not reaching the license service (wrong URL or nginx routing).

---

## 502 Bad Gateway on /license/admin or /license/admin/login

**Symptom:** Opening `http://localhost:8080/license/admin` (or `/license/admin/login`) shows **502 Bad Gateway**.

**Cause:** Nginx is proxying `/license/` to the license-service container, but the license-service is not responding (not running, crashed, or unreachable).

### Fix (Docker)

1. **Start the full stack** so MySQL and license-service are up:
   ```bash
   cd /path/to/synerex-platform
   docker compose up -d mysql
   # wait ~15s for MySQL to be healthy
   docker compose up -d license-service
   docker compose up -d proxy
   ```

2. **Check that license-service is running and healthy:**
   ```bash
   docker compose ps license-service
   docker compose logs license-service --tail 50
   ```
   If the container is `Exited` or `unhealthy`, read the logs (often DB connection or missing env).

3. **Test the service directly** (bypass nginx):
   ```bash
   curl -s http://localhost:8000/health
   ```
   Should return `{"ok":true}`. If that fails, the app inside the container is not listening on 8000 or has crashed.

### Common causes

- **MySQL not running:** license-service `depends_on: mysql` and uses `DB_URL` from `.env`. Start MySQL first: `docker compose up -d mysql`, wait for it to be healthy, then start license-service.
- **Wrong DB_URL in .env:** For Docker, use host `mysql` (e.g. `mysql+pymysql://user:pass@mysql:3306/licensing`). For local runs use `localhost`.
- **Container crash on startup:** Run `docker compose logs license-service` and fix any Python/import or config errors.

### Why is MySQL not running?

MySQL is a separate container in `docker-compose.yml`. It will not be running if:

1. **You didn’t start it**  
   Only the services you start (or their dependencies) run. If you ran e.g. `docker compose up -d proxy`, Docker also starts `license-service` (proxy depends on it) and `mysql` (license-service depends on it). If something failed earlier (e.g. proxy or license-service failed to create), MySQL might never have been started.  
   **Fix:** Start the stack (or at least MySQL) explicitly:
   ```bash
   docker compose up -d mysql
   # wait until healthy (e.g. 30–60s first time), then:
   docker compose up -d license-service proxy
   ```

2. **MySQL is still starting**  
   MySQL 8.0 can take 30–60 seconds (longer on first run) before it accepts connections. The compose file uses a healthcheck with `start_period: 40s` and 15 retries so it can become “healthy” after a slow start.  
   **Fix:** Wait and check:
   ```bash
   docker compose ps mysql
   docker compose logs mysql --tail 30
   ```
   If status stays `starting (health: starting)` for 1–2 minutes, check logs for errors (e.g. disk, permissions).

3. **Port 3306 is in use**  
   If another MySQL or process is using port 3306 on the host, the container may fail to start. (The current compose does not publish 3306 to the host, so this is only an issue if you added `ports: ["3306:3306"]` or run MySQL on the host.)  
   **Fix:** Stop the other process or change the host port in `docker-compose.yml`.

4. **Volume or disk issues**  
   The `mysql_data` volume holds the data. If the disk is full or there are permission problems, MySQL can exit.  
   **Fix:** Run `docker compose logs mysql` and fix disk/permissions; if the volume is corrupt you may need to remove it and re-create the DB (data loss).

5. **Docker Compose errors**  
   If `docker compose up` fails with errors (e.g. `ContainerConfig`, unhealthy proxy), some containers may never start or may be recreated in a bad state.  
   **Fix:** Try a clean bring-up:
   ```bash
   docker compose down
   docker compose up -d mysql
   sleep 60
   docker compose up -d
   ```

**Check MySQL status:**
```bash
docker compose ps mysql
docker compose logs mysql --tail 50
```

---

### Fix (run license-service locally without Docker)

If you prefer to run the app on your machine:

```bash
cd license-service/services/license-service
# Use .env with DB_URL pointing to your MySQL (e.g. localhost)
python -m uvicorn app.main:app --reload --port 8000
```

Then ensure nginx (or your proxy) forwards `http://localhost:8080/license/` to `http://localhost:8000/`. If nginx runs in Docker and the app is on the host, use `host.docker.internal:8000` instead of `license-service:8000` in nginx, or access the app at `http://localhost:8000/admin` directly.

---

## "Not Found" Error on New Endpoints

## Issue
After implementing new enterprise features, endpoints like `/api/stats`, `/api/lifecycle/*`, etc. return `{"detail":"Not Found"}`.

## Root Cause
The server needs to be **fully restarted** to load the new routes. The restart endpoint (`/admin/server/restart`) won't work if the server hasn't loaded the new code yet.

## Solution

### Step 1: Stop All Server Processes
```powershell
# Find and stop all processes on port 8000
$processes = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
foreach ($procId in $processes) {
    Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 3
```

### Step 2: Verify Imports Work
```powershell
cd C:\Users\Admin\OneDrive\Documents\synerex-platform-scaffold-v15\services\license-service
python -c "from app.main import app; print('Import successful')"
```

If you see import errors, fix them first:
- ✅ Fixed: `metadata` field renamed to `event_metadata` in `UsageEvent` model
- ✅ Fixed: `metadata` field renamed to `payment_metadata` in `Payment` model  
- ✅ Fixed: Missing `Body` and `Depends` imports in `downloads.py`

### Step 3: Start Server Manually
```powershell
cd C:\Users\Admin\OneDrive\Documents\synerex-platform-scaffold-v15\services\license-service
python -m uvicorn app.main:app --reload --port 8000
```

Or use the restart script (after fixing the `$pid` variable issue):
```powershell
.\restart_server.ps1
```

### Step 4: Verify Endpoints Work
```powershell
# Test health endpoint (should work)
Invoke-WebRequest -Uri "$env:LICENSE_SERVICE_URL/health"

# Test stats endpoint (should now work)
Invoke-WebRequest -Uri "$env:LICENSE_SERVICE_URL/api/stats"

# Check OpenAPI docs
Start-Process "$env:LICENSE_SERVICE_URL/docs"
```

## Fixed Issues

1. **SQLAlchemy Reserved Word Error**
   - Problem: `metadata` is a reserved word in SQLAlchemy
   - Fix: Renamed `metadata` to `event_metadata` in `UsageEvent` model
   - Fix: Renamed `metadata` to `payment_metadata` in `Payment` model

2. **Missing Imports**
   - Problem: `Body` and `Depends` not imported in `downloads.py`
   - Fix: Added `Body, Depends` to imports

3. **PowerShell Script Issue**
   - Problem: `$pid` is a read-only variable in PowerShell
   - Fix: Changed to `$procId` in `restart_server.ps1`

## Verification Checklist

- [ ] All server processes on port 8000 are stopped
- [ ] Python imports work without errors
- [ ] Server starts without errors
- [ ] `/health` endpoint returns `{"ok": true}`
- [ ] `/api/stats` endpoint returns statistics
- [ ] `/docs` shows all new endpoints
- [ ] `/api/lifecycle/run-tasks` is accessible (with admin auth)
- [ ] `/api/webhooks` is accessible (with admin auth)
- [ ] `/api/analytics/revenue` is accessible (with admin auth)

## If Endpoints Still Don't Work

1. **Check Server Logs**: Look for import errors or route registration issues
2. **Verify Route Registration**: Check that all routers are included in `main.py`
3. **Check Middleware**: Ensure middleware isn't blocking routes
4. **Database Issues**: Ensure database tables are created (they auto-create on first start)
5. **Cache Issues**: Clear browser cache or use incognito mode

## Next Steps After Server Restart

1. Login to admin panel: `${LICENSE_SERVICE_URL}/admin/login`
2. Test the restart endpoint: Navigate to `/admin/server` and click "Restart Server"
3. Test new endpoints using the test script: `python test_new_endpoints.py`


