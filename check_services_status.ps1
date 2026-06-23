# Phase 4 Docker stack only. 8084 (HTML Reports) and 3001 (Website Backend) are not in Docker.
Write-Host "=== Service Status Check (Docker Phase 4) ===" -ForegroundColor Cyan
Write-Host ""

$services = @(
    @{Name="Proxy (nginx)"; BaseUrl="http://localhost:8080"; Path="/"},
    @{Name="License Service"; BaseUrl=$env:LICENSE_SERVICE_URL; Path="/admin/login"},
    @{Name="Website Frontend"; BaseUrl=$env:WEBSITE_FRONTEND_URL; Path="/"},
    @{Name="EMV Main App"; BaseUrl=$env:EMV_BASE_URL; Path="/api/health"},
    @{Name="ECBS Intelligence Platform"; BaseUrl=$env:TRACKING_PROGRAM_URL; Path="/login"},
    @{Name="Service Manager"; BaseUrl=$env:SERVICE_MANAGER_URL; Path="/health"}
)
# Default URLs when env not set
if (-not $services[1].BaseUrl) { $services[1].BaseUrl = "http://localhost:8000" }
if (-not $services[2].BaseUrl) { $services[2].BaseUrl = "http://localhost:8080" }
if (-not $services[3].BaseUrl) { $services[3].BaseUrl = "http://localhost:8082" }
if (-not $services[4].BaseUrl) { $services[4].BaseUrl = "http://localhost:8087" }
if (-not $services[5].BaseUrl) { $services[5].BaseUrl = "http://localhost:9000" }

foreach ($svc in $services) {
    $baseUrl = $svc.BaseUrl
    if (-not $baseUrl) {
        Write-Host "$($svc.Name): SKIPPED (BaseUrl not set)" -ForegroundColor Yellow
        continue
    }
    $url = "$baseUrl$($svc.Path)"
    $uri = [System.Uri]$url
    $port = $uri.Port
    Write-Host "$($svc.Name) (port $port):" -NoNewline
    try {
        $response = Invoke-WebRequest -Uri $url -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
        Write-Host " RUNNING" -ForegroundColor Green
    } catch {
        $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        if ($conn) {
            Write-Host " STARTING (port in use, may still be initializing)" -ForegroundColor Yellow
        } else {
            Write-Host " NOT RUNNING" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "=== Process Check ===" -ForegroundColor Cyan
$pythonProcs = Get-Process -Name python -ErrorAction SilentlyContinue
$nodeProcs = Get-Process -Name node -ErrorAction SilentlyContinue
Write-Host "Python processes: $($pythonProcs.Count)" -ForegroundColor $(if ($pythonProcs.Count -gt 0) { "Green" } else { "Red" })
Write-Host "Node processes: $($nodeProcs.Count)" -ForegroundColor $(if ($nodeProcs.Count -gt 0) { "Green" } else { "Red" })
