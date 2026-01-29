# Quick script to restart Main App (8082) via Service Manager API
# Requires Service Manager (port 9000) to be running

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Restarting Main App (8082) via Service Manager" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$serviceManagerUrl = "http://localhost:9000"
$serviceId = "main_app"

# Step 1: Check if Service Manager is running
Write-Host "Step 1: Checking if Service Manager is running..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-WebRequest -Uri "$serviceManagerUrl/health" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    if ($healthResponse.StatusCode -eq 200) {
        Write-Host "[OK] Service Manager is running" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Service Manager returned status $($healthResponse.StatusCode)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "[ERROR] Cannot connect to Service Manager (port 9000)" -ForegroundColor Red
    Write-Host "  Please start the Service Manager first!" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Step 2: Restarting Main App (8082)..." -ForegroundColor Yellow

# Step 2: Restart the service
$restartUrl = "$serviceManagerUrl/api/services/restart/$serviceId"

try {
    $response = Invoke-RestMethod -Uri $restartUrl -Method Post -TimeoutSec 60 -ErrorAction Stop
    
    if ($response.success) {
        Write-Host "[OK] Main App restart initiated successfully" -ForegroundColor Green
        Write-Host "  Message: $($response.message)" -ForegroundColor Gray
        
        Write-Host ""
        Write-Host "Step 3: Waiting for service to restart..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
        
        # Check service status
        $statusUrl = "$serviceManagerUrl/api/services/status"
        try {
            $statusResponse = Invoke-RestMethod -Uri $statusUrl -Method Get -TimeoutSec 5 -ErrorAction Stop
            if ($statusResponse.$serviceId) {
                $serviceInfo = $statusResponse.$serviceId
                if ($serviceInfo.running) {
                    Write-Host "[OK] Main App is now running (PID: $($serviceInfo.pid))" -ForegroundColor Green
                    Write-Host "  Port: $($serviceInfo.port)" -ForegroundColor Gray
                    Write-Host ""
                    Write-Host "============================================================" -ForegroundColor Green
                    Write-Host "Restart completed successfully!" -ForegroundColor Green
                    Write-Host "============================================================" -ForegroundColor Green
                    exit 0
                } else {
                    Write-Host "[WARNING] Main App restart initiated but not yet running" -ForegroundColor Yellow
                    Write-Host "  Please check logs for details" -ForegroundColor Yellow
                    exit 1
                }
            }
        } catch {
            Write-Host "[WARNING] Could not verify status: $_" -ForegroundColor Yellow
            Write-Host "  Restart was initiated, but status check failed" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "============================================================" -ForegroundColor Yellow
            Write-Host "Restart initiated (status verification failed)" -ForegroundColor Yellow
            Write-Host "============================================================" -ForegroundColor Yellow
            exit 0
        }
    } else {
        Write-Host "[ERROR] Restart failed: $($response.message)" -ForegroundColor Red
        if ($response.error) {
            Write-Host "  Error details: $($response.error)" -ForegroundColor Red
        }
        exit 1
    }
} catch {
    Write-Host "[ERROR] Error restarting service: $_" -ForegroundColor Red
    exit 1
}
