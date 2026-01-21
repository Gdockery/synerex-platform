# Synerex Platform - Restart All Services
# This script stops and restarts all Synerex platform services

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Synerex Platform - Restart All Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to stop processes on a specific port
function Stop-ServiceOnPort {
    param([int]$Port, [string]$ServiceName)
    
    Write-Host "Stopping $ServiceName on port $Port..." -ForegroundColor Yellow
    $processes = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    if ($processes) {
        foreach ($procId in $processes) {
            try {
                Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
                Write-Host "  Stopped process $procId" -ForegroundColor Green
            } catch {
                Write-Host "  Could not stop process $procId" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "  No service found on port $Port" -ForegroundColor Gray
    }
}

# Function to stop processes by name
function Stop-ServiceByName {
    param([string]$ProcessName, [string]$ServiceName)
    
    Write-Host "Stopping $ServiceName..." -ForegroundColor Yellow
    $processes = Get-Process -Name $ProcessName -ErrorAction SilentlyContinue
    if ($processes) {
        foreach ($proc in $processes) {
            try {
                Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
                Write-Host "  Stopped $ServiceName (PID: $($proc.Id))" -ForegroundColor Green
            } catch {
                Write-Host "  Could not stop process $($proc.Id)" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "  No $ServiceName process found" -ForegroundColor Gray
    }
}

Write-Host "Step 1: Stopping all services..." -ForegroundColor Cyan
Write-Host ""

# Stop License Service (port 8000)
Stop-ServiceOnPort -Port 8000 -ServiceName "License Service"

# Stop Website Backend (port 3001)
Stop-ServiceOnPort -Port 3001 -ServiceName "Website Backend"

# Stop Website Frontend (port 5173)
Stop-ServiceOnPort -Port 5173 -ServiceName "Website Frontend"

# Stop EMV Program services (multiple ports)
Write-Host "Stopping EMV Program services..." -ForegroundColor Yellow
$emvPorts = @(8082, 8083, 8084, 8200, 8202, 8203, 8086, 8090, 9000)
foreach ($port in $emvPorts) {
    Stop-ServiceOnPort -Port $port -ServiceName "EMV Service (port $port)"
}

# Stop any remaining Python processes (EMV services)
Stop-ServiceByName -ProcessName "python" -ServiceName "Python Services"

# Stop Node processes (website services)
Stop-ServiceByName -ProcessName "node" -ServiceName "Node.js Services"

Write-Host ""
Write-Host "Waiting 3 seconds for processes to fully terminate..." -ForegroundColor Gray
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "Step 2: Starting all services..." -ForegroundColor Cyan
Write-Host ""

# Get the script directory (project root)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Start License Service
Write-Host "Starting License Service on port 8000..." -ForegroundColor Yellow
$licenseServicePath = Join-Path $scriptDir "license-service\services\license-service"
if (Test-Path $licenseServicePath) {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$licenseServicePath'; python -m uvicorn app.main:app --reload --port 8000"
    Write-Host "  License Service started" -ForegroundColor Green
} else {
    Write-Host "  License Service directory not found: $licenseServicePath" -ForegroundColor Red
}

Start-Sleep -Seconds 2

# Start Website Backend
Write-Host "Starting Website Backend on port 3001..." -ForegroundColor Yellow
$websiteBackendPath = Join-Path $scriptDir "website\backend"
if (Test-Path $websiteBackendPath) {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$websiteBackendPath'; npm start"
    Write-Host "  Website Backend started" -ForegroundColor Green
} else {
    Write-Host "  Website Backend directory not found: $websiteBackendPath" -ForegroundColor Red
}

Start-Sleep -Seconds 2

# Start Website Frontend
Write-Host "Starting Website Frontend on port 5173..." -ForegroundColor Yellow
$websiteFrontendPath = Join-Path $scriptDir "website"
if (Test-Path $websiteFrontendPath) {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$websiteFrontendPath'; npm run dev"
    Write-Host "  Website Frontend started" -ForegroundColor Green
} else {
    Write-Host "  Website Frontend directory not found: $websiteFrontendPath" -ForegroundColor Red
}

Start-Sleep -Seconds 2

# Start EMV Program services
Write-Host "Starting EMV Program services..." -ForegroundColor Yellow
$emvProgramPath = Join-Path $scriptDir "emv-program"
if (Test-Path (Join-Path $emvProgramPath "start_services.bat")) {
    Start-Process cmd -ArgumentList "/c", "cd /d `"$emvProgramPath`" && start_services.bat"
    Write-Host "  EMV Program services started" -ForegroundColor Green
} else {
    Write-Host "  EMV Program start script not found" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "All services restart initiated!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Services should be starting in new windows." -ForegroundColor Green
Write-Host ""
Write-Host "Service URLs:" -ForegroundColor Cyan
Write-Host "  - License Service: http://localhost:8000/admin/login" -ForegroundColor White
Write-Host "  - Website Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "  - Website Backend: http://localhost:3001/health" -ForegroundColor White
Write-Host "  - EMV Main App: http://localhost:8082" -ForegroundColor White
Write-Host ""
Write-Host "Note: Services may take a few moments to fully start." -ForegroundColor Gray
Write-Host ""
