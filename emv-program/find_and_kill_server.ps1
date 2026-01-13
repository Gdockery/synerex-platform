# Script to find and kill the Synerex server process
# This identifies which Python process is running the server on port 8082

Write-Host "="*80
Write-Host "FINDING SYNEREX SERVER PROCESS"
Write-Host "="*80

# Get all Python processes with their command lines
$pythonProcesses = Get-CimInstance Win32_Process -Filter "Name = 'python.exe'" | 
    Select-Object ProcessId, CommandLine, WorkingDirectory, CreationDate

Write-Host "`nFound $($pythonProcesses.Count) Python processes:`n"

$serverProcesses = @()
$index = 1

foreach ($proc in $pythonProcesses) {
    $isServer = $false
    $reason = ""
    
    # Check if it's the server based on command line
    if ($proc.CommandLine -like "*main_hardened_ready_fixed.py*") {
        $isServer = $true
        $reason = "Running main_hardened_ready_fixed.py"
    }
    elseif ($proc.CommandLine -like "*8082*" -and $proc.CommandLine -like "*python*") {
        $isServer = $true
        $reason = "Running in 8082 directory"
    }
    elseif ($proc.WorkingDirectory -like "*8082*") {
        $isServer = $true
        $reason = "Working directory is 8082"
    }
    
    $status = if ($isServer) { "[SERVER]" } else { "[Other]" }
    
    Write-Host "[$index] Process ID: $($proc.ProcessId) - $status"
    Write-Host "     Command: $($proc.CommandLine)"
    Write-Host "     Working Dir: $($proc.WorkingDirectory)"
    if ($isServer) {
        Write-Host "     Reason: $reason" -ForegroundColor Yellow
        $serverProcesses += $proc
    }
    Write-Host ""
    
    $index++
}

if ($serverProcesses.Count -eq 0) {
    Write-Host "⚠️  No server processes identified automatically." -ForegroundColor Yellow
    Write-Host "`nTo manually check, look for processes running:" -ForegroundColor Cyan
    Write-Host "  - main_hardened_ready_fixed.py"
    Write-Host "  - In the 8082 directory"
    Write-Host ""
    
    $manual = Read-Host "Enter process ID to kill (or press Enter to skip)"
    if ($manual -match '^\d+$') {
        Write-Host "`nKilling process $manual..."
        try {
            Stop-Process -Id $manual -Force
            Write-Host "✅ Process $manual stopped" -ForegroundColor Green
        } catch {
            Write-Host "❌ Error: $_" -ForegroundColor Red
        }
    }
} else {
    Write-Host "="*80
    Write-Host "SERVER PROCESSES FOUND: $($serverProcesses.Count)" -ForegroundColor Yellow
    Write-Host "="*80
    
    foreach ($server in $serverProcesses) {
        Write-Host "`nProcess ID: $($server.ProcessId)"
        Write-Host "Command: $($server.CommandLine)"
    }
    
    Write-Host "`n" + "="*80
    $kill = Read-Host "Kill these server processes? (Y/N)"
    
    if ($kill -eq 'Y' -or $kill -eq 'y') {
        foreach ($server in $serverProcesses) {
            Write-Host "`nKilling process $($server.ProcessId)..."
            try {
                Stop-Process -Id $server.ProcessId -Force
                Write-Host "✅ Process $($server.ProcessId) stopped" -ForegroundColor Green
            } catch {
                Write-Host "❌ Error killing process $($server.ProcessId): $_" -ForegroundColor Red
            }
        }
        
        Write-Host "`n✅ Server processes stopped. Wait 3 seconds, then restart the server." -ForegroundColor Green
        Start-Sleep -Seconds 3
        
        Write-Host "`nTo restart, run:" -ForegroundColor Cyan
        Write-Host "  cd 8082"
        Write-Host "  python main_hardened_ready_fixed.py"
        Write-Host "`nOr use:"
        Write-Host "  8082\launch_synerex.bat"
    } else {
        Write-Host "`nProcesses not killed. You can manually kill them using:" -ForegroundColor Yellow
        foreach ($server in $serverProcesses) {
            Write-Host "  Stop-Process -Id $($server.ProcessId) -Force"
        }
    }
}

Write-Host "`n" + "="*80

