# Check status of Synerex services (Phase 4 Docker stack).
# Only services defined in docker-compose are listed; 8084 (HTML Reports) and 3001 (Website Backend) are not in the Docker stack.

Write-Host "Checking service status (Docker Phase 4 stack)..." -ForegroundColor Cyan
Write-Host ""

$services = @(
    @{Name='Proxy (nginx)'; BaseUrl='http://localhost:8080'; Path='/'},
    @{Name='License Service'; BaseUrl=$env:LICENSE_SERVICE_URL; Path='/admin/login'},
    @{Name='Website Frontend'; BaseUrl=$env:WEBSITE_FRONTEND_URL; Path='/'},
    @{Name='EMV Main App'; BaseUrl=$env:EMV_BASE_URL; Path='/api/health'},
    @{Name='Tracking Program'; BaseUrl=$env:TRACKING_PROGRAM_URL; Path='/login'},
    @{Name='Service Manager'; BaseUrl=$env:SERVICE_MANAGER_URL; Path='/health'}
)
# Fallbacks when env vars not set (Docker defaults)
if (-not $services[1].BaseUrl) { $services[1].BaseUrl = 'http://localhost:8000' }
if (-not $services[2].BaseUrl) { $services[2].BaseUrl = 'http://localhost:8080' }
if (-not $services[3].BaseUrl) { $services[3].BaseUrl = 'http://localhost:8082' }
if (-not $services[4].BaseUrl) { $services[4].BaseUrl = 'http://localhost:8087' }
if (-not $services[5].BaseUrl) { $services[5].BaseUrl = 'http://localhost:9000' }

foreach ($svc in $services) {
    $name = $svc.Name
    $path = $svc.Path
    $baseUrl = $svc.BaseUrl
    if (-not $baseUrl) {
        Write-Host "[SKIPPED] $name (BaseUrl not set)" -ForegroundColor Yellow
        continue
    }
    $url = "$baseUrl$path"
    $uri = [System.Uri]$url
    $port = $uri.Port
    
    # Check if port is listening
    $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    
    if ($conn) {
        # Port is listening, try to hit the endpoint
        try {
            $response = Invoke-WebRequest -Uri $url -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
            Write-Host "[OK] $name (port $port)" -ForegroundColor Green
        } catch {
            Write-Host "[LISTENING] $name (port $port) - endpoint check failed" -ForegroundColor Yellow
        }
    } else {
        Write-Host "[NOT RUNNING] $name (port $port)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Checking Python processes..." -ForegroundColor Cyan
$pythonProcs = Get-Process -Name python -ErrorAction SilentlyContinue
if ($pythonProcs) {
    Write-Host "  Found $($pythonProcs.Count) Python process(es)" -ForegroundColor Green
} else {
    Write-Host "  No Python processes found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Checking Node processes..." -ForegroundColor Cyan
$nodeProcs = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcs) {
    Write-Host "  Found $($nodeProcs.Count) Node process(es)" -ForegroundColor Green
} else {
    Write-Host "  No Node processes found" -ForegroundColor Yellow
}
