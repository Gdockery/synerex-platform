# Hard restart script for Synerex server
# This kills all Python processes and clears cache, then restarts

Write-Host "="*80
Write-Host "HARD RESTART SYNEREX SERVER"
Write-Host "="*80

# Step 1: Kill all Python processes
Write-Host "`n[1/4] Stopping all Python processes..."
$pythonProcesses = Get-Process python -ErrorAction SilentlyContinue
if ($pythonProcesses) {
    $pythonProcesses | ForEach-Object {
        Write-Host "  Stopping process $($_.Id)..."
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
    Write-Host "  ✅ Python processes stopped"
} else {
    Write-Host "  ℹ️  No Python processes found"
}

# Step 2: Clear Python cache
Write-Host "`n[2/4] Clearing Python bytecode cache..."
if (Test-Path "8082\__pycache__") {
    Remove-Item "8082\__pycache__\*.pyc" -Force -ErrorAction SilentlyContinue
    Write-Host "  ✅ Cache cleared"
} else {
    Write-Host "  ℹ️  No cache found"
}

# Step 3: Wait a moment
Write-Host "`n[3/4] Waiting 3 seconds..."
Start-Sleep -Seconds 3

# Step 4: Instructions
Write-Host "`n[4/4] Ready to restart"
Write-Host "="*80
Write-Host "Now manually start the server using:"
Write-Host "  cd 8082"
Write-Host "  python main_hardened_ready_fixed.py"
Write-Host ""
Write-Host "Or use the batch file:"
Write-Host "  8082\launch_synerex.bat"
Write-Host "="*80

