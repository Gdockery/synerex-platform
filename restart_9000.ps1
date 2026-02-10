# Quick script to restart Service Manager (9000)
# Uses self-restart API if available, otherwise manually restarts

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Restarting Service Manager (Port 9000)" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$serviceManagerUrl = $env:SERVICE_MANAGER_URL

# Step 1: Check if Service Manager is running
Write-Host "Step 1: Checking if Service Manager is running..." -ForegroundColor Yellow
$isRunning = $false
try {
    $healthResponse = Invoke-WebRequest -Uri "$serviceManagerUrl/health" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    if ($healthResponse.StatusCode -eq 200) {
        Write-Host "[OK] Service Manager is running" -ForegroundColor Green
        $isRunning = $true
    }
} catch {
    Write-Host "[INFO] Service Manager is not running or not responding" -ForegroundColor Yellow
}

Write-Host ""

if ($isRunning) {
    # Step 2: Use self-restart API
    Write-Host "Step 2: Using self-restart API..." -ForegroundColor Yellow
    $restartUrl = "$serviceManagerUrl/api/services/restart-self"
    
    try {
        $response = Invoke-RestMethod -Uri $restartUrl -Method Post -TimeoutSec 10 -ErrorAction Stop
        
        if ($response.success) {
            Write-Host "[OK] Service Manager restart initiated via API" -ForegroundColor Green
            Write-Host "  Message: $($response.message)" -ForegroundColor Gray
            
            Write-Host ""
            Write-Host "Step 3: Waiting for service to restart..." -ForegroundColor Yellow
            Start-Sleep -Seconds 5
            
            # Check if service is back up
            $maxRetries = 6
            $retryCount = 0
            $restarted = $false
            
            while ($retryCount -lt $maxRetries) {
                try {
                    $healthResponse = Invoke-WebRequest -Uri "$serviceManagerUrl/health" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
                    if ($healthResponse.StatusCode -eq 200) {
                        Write-Host "[OK] Service Manager is now running" -ForegroundColor Green
                        $restarted = $true
                        break
                    }
                } catch {
                    # Service not ready yet, continue waiting
                }
                $retryCount++
                Write-Host "  Waiting... ($retryCount/$maxRetries)" -ForegroundColor Gray
                Start-Sleep -Seconds 2
            }
            
            if ($restarted) {
                Write-Host ""
                Write-Host "============================================================" -ForegroundColor Green
                Write-Host "Restart completed successfully!" -ForegroundColor Green
                Write-Host "============================================================" -ForegroundColor Green
                exit 0
            } else {
                Write-Host "[WARNING] Service Manager restart was initiated but may not have completed" -ForegroundColor Yellow
                Write-Host "  Please check if the service is running manually" -ForegroundColor Yellow
                exit 1
            }
        } else {
            Write-Host "[ERROR] Restart failed: $($response.message)" -ForegroundColor Red
            exit 1
        }
    } catch {
        Write-Host "[WARNING] Could not use self-restart API: $_" -ForegroundColor Yellow
        Write-Host "  Falling back to manual restart..." -ForegroundColor Yellow
        $isRunning = $false
    }
}

if (-not $isRunning) {
    # Step 2: Manual restart - stop existing process
    Write-Host "Step 2: Stopping existing Service Manager process..." -ForegroundColor Yellow
    
    $processes = Get-NetTCPConnection -LocalPort 9000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    if ($processes) {
        foreach ($procId in $processes) {
            try {
                $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
                if ($proc) {
                    Write-Host "  Stopping process $procId ($($proc.ProcessName))" -ForegroundColor Gray
                    Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
                }
            } catch {
                Write-Host "  Could not stop process $procId" -ForegroundColor Red
            }
        }
        Write-Host "[OK] Stopped existing processes" -ForegroundColor Green
        Start-Sleep -Seconds 3
    } else {
        Write-Host "[INFO] No process found on port 9000" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "Step 3: Starting Service Manager..." -ForegroundColor Yellow
    
    # Get the script directory (project root)
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $serviceManagerPath = Join-Path $scriptDir "emv-program\service_manager_daemon.py"
    
    if (Test-Path $serviceManagerPath) {
        $serviceManagerDir = Join-Path $scriptDir "emv-program"
        Write-Host "  Directory: $serviceManagerDir" -ForegroundColor Gray
        Write-Host "  Script: service_manager_daemon.py" -ForegroundColor Gray
        Write-Host ""
        
        # Start the Service Manager in a new window
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$serviceManagerDir'; python service_manager_daemon.py"
        
        Write-Host "[OK] Service Manager start command executed" -ForegroundColor Green
        
        Write-Host ""
        Write-Host "Step 4: Waiting for service to start..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
        
        # Check if service started
        $maxRetries = 6
        $retryCount = 0
        $started = $false
        
        while ($retryCount -lt $maxRetries) {
            try {
                $healthResponse = Invoke-WebRequest -Uri "$serviceManagerUrl/health" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
                if ($healthResponse.StatusCode -eq 200) {
                    Write-Host "[OK] Service Manager is now running" -ForegroundColor Green
                    $started = $true
                    break
                }
            } catch {
                # Service not ready yet, continue waiting
            }
            $retryCount++
            Write-Host "  Waiting... ($retryCount/$maxRetries)" -ForegroundColor Gray
            Start-Sleep -Seconds 2
        }
        
        if ($started) {
            Write-Host ""
            Write-Host "============================================================" -ForegroundColor Green
            Write-Host "Service Manager started successfully!" -ForegroundColor Green
            Write-Host "============================================================" -ForegroundColor Green
            Write-Host ""
            Write-Host "Service Manager URL: $serviceManagerUrl" -ForegroundColor Cyan
            exit 0
        } else {
            Write-Host "[WARNING] Service Manager may not have started properly" -ForegroundColor Yellow
            Write-Host "  Please check the service window for errors" -ForegroundColor Yellow
            exit 1
        }
    } else {
        Write-Host "[ERROR] Service Manager script not found: $serviceManagerPath" -ForegroundColor Red
        exit 1
    }
}
