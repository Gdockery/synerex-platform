# Troubleshooting: "Not Found" Error on New Endpoints

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
Invoke-WebRequest -Uri "http://localhost:8000/health"

# Test stats endpoint (should now work)
Invoke-WebRequest -Uri "http://localhost:8000/api/stats"

# Check OpenAPI docs
Start-Process "http://localhost:8000/docs"
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

1. Login to admin panel: `http://localhost:8000/admin/login`
2. Test the restart endpoint: Navigate to `/admin/server` and click "Restart Server"
3. Test new endpoints using the test script: `python test_new_endpoints.py`


