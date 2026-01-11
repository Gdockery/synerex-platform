# Synerex License Service - Manual Restart Script
# This script stops the server on port 8000 and restarts it

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Synerex License Service - Restart" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Stop existing server processes on port 8000
Write-Host "Stopping server on port 8000..." -ForegroundColor Yellow
$processes = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($processes) {
    foreach ($procId in $processes) {
        try {
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
            Write-Host "  Stopped process $procId" -ForegroundColor Green
        } catch {
            Write-Host "  Could not stop process $procId" -ForegroundColor Red
        }
    }
    Start-Sleep -Seconds 2
} else {
    Write-Host "  No server found on port 8000" -ForegroundColor Gray
}

# Change to the license-service directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# Start the server
Write-Host ""
Write-Host "Starting server..." -ForegroundColor Yellow
Write-Host "  Directory: $scriptDir" -ForegroundColor Gray
Write-Host "  Command: python -m uvicorn app.main:app --reload --port 8000" -ForegroundColor Gray
Write-Host ""

# Start the server in a new window
Start-Process python -ArgumentList "-m", "uvicorn", "app.main:app", "--reload", "--port", "8000"

Write-Host "Server restart initiated!" -ForegroundColor Green
Write-Host "The server should be starting in a new window." -ForegroundColor Green
Write-Host ""
Write-Host "You can access the admin panel at: http://localhost:8000/admin/login" -ForegroundColor Cyan
Write-Host ""

