# Check status of all Synerex services

Write-Host "Checking service status..." -ForegroundColor Cyan
Write-Host ""

$services = @(
    @{Name='License Service'; Port=8000; Path='/admin/login'},
    @{Name='Website Backend'; Port=3001; Path='/health'},
    @{Name='Website Frontend'; Port=5173; Path='/'},
    @{Name='EMV Main App'; Port=8082; Path='/api/health'},
    @{Name='PDF Generator'; Port=8083; Path='/'},
    @{Name='HTML Reports'; Port=8084; Path='/'},
    @{Name='Weather Service'; Port=8200; Path='/health'},
    @{Name='Chart Service'; Port=8086; Path='/'},
    @{Name='Service Manager'; Port=9000; Path='/health'}
)

foreach ($svc in $services) {
    $port = $svc.Port
    $name = $svc.Name
    $path = $svc.Path
    $url = "http://localhost:$port$path"
    
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
