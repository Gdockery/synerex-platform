Write-Host "=== Service Status Check ===" -ForegroundColor Cyan
Write-Host ""

$services = @(
    @{Name="License Service"; Port=8000; Path="/admin/login"},
    @{Name="Website Backend"; Port=3001; Path="/health"},
    @{Name="Website Frontend"; Port=5173; Path="/"},
    @{Name="EMV Main App"; Port=8082; Path="/api/health"},
    @{Name="PDF Generator"; Port=8083; Path="/health"},
    @{Name="HTML Reports"; Port=8084; Path="/health"},
    @{Name="Weather Service"; Port=8200; Path="/health"},
    @{Name="Utility Rate Service"; Port=8202; Path="/health"},
    @{Name="Chart Service"; Port=8086; Path="/health"},
    @{Name="Service Manager"; Port=9000; Path="/health"}
)

foreach ($svc in $services) {
    Write-Host "$($svc.Name) (port $($svc.Port)):" -NoNewline
    try {
        $url = "http://localhost:$($svc.Port)$($svc.Path)"
        $response = Invoke-WebRequest -Uri $url -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
        Write-Host " RUNNING" -ForegroundColor Green
    } catch {
        $conn = Get-NetTCPConnection -LocalPort $svc.Port -ErrorAction SilentlyContinue
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
