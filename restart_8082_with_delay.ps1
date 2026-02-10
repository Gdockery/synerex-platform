# Stop service, wait 5 seconds, then restart
$serviceManagerUrl = $env:SERVICE_MANAGER_URL
$serviceId = "main_app"

Write-Host "Stopping service $serviceId..." -ForegroundColor Yellow
try {
    $stopUrl = "$serviceManagerUrl/api/services/stop/$serviceId"
    $stopResponse = Invoke-RestMethod -Uri $stopUrl -Method Post -TimeoutSec 30 -ErrorAction Stop
    Write-Host "[OK] Service stopped: $($stopResponse.message)" -ForegroundColor Green
} catch {
    Write-Host "[INFO] Stop request completed (service may have already been stopped)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Waiting 5 seconds for port to be released..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "Restarting service..." -ForegroundColor Yellow
& "$PSScriptRoot\restart_8082.ps1"
