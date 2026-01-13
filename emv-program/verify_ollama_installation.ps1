# Verify Ollama Installation
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Verifying Ollama Installation" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Check 1: Command availability
Write-Host "1. Checking if 'ollama' command is available..." -ForegroundColor Yellow
try {
    $version = ollama --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   [OK] Ollama command found: $version" -ForegroundColor Green
    } else {
        Write-Host "   [FAIL] Ollama command not found" -ForegroundColor Red
        Write-Host "   This usually means:" -ForegroundColor Yellow
        Write-Host "     - Installation didn't complete" -ForegroundColor Yellow
        Write-Host "     - Need to restart PowerShell/terminal" -ForegroundColor Yellow
        Write-Host "     - Ollama not added to PATH" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   [FAIL] Ollama command not found" -ForegroundColor Red
}

# Check 2: Service running
Write-Host ""
Write-Host "2. Checking if Ollama service is running on port 11434..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
    Write-Host "   [OK] Ollama service is running!" -ForegroundColor Green
    $models = ($response.Content | ConvertFrom-Json).models
    Write-Host "   Available models: $($models.Count)" -ForegroundColor Gray
} catch {
    Write-Host "   [FAIL] Ollama service is not running" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
}

# Check 3: Common installation locations
Write-Host ""
Write-Host "3. Checking common installation locations..." -ForegroundColor Yellow
$locations = @(
    "$env:LOCALAPPDATA\Programs\Ollama",
    "C:\Program Files\Ollama",
    "C:\Program Files (x86)\Ollama",
    "$env:USERPROFILE\AppData\Local\Programs\Ollama"
)

$found = $false
foreach ($loc in $locations) {
    if (Test-Path "$loc\ollama.exe") {
        Write-Host "   [FOUND] Ollama at: $loc\ollama.exe" -ForegroundColor Green
        $found = $true
    }
}

if (-not $found) {
    Write-Host "   [NOT FOUND] Ollama not found in common locations" -ForegroundColor Red
    Write-Host "   This suggests Ollama was not installed" -ForegroundColor Yellow
}

# Check 4: Processes
Write-Host ""
Write-Host "4. Checking for Ollama processes..." -ForegroundColor Yellow
$processes = Get-Process | Where-Object { $_.ProcessName -like "*ollama*" }
if ($processes) {
    Write-Host "   [FOUND] Ollama processes running:" -ForegroundColor Green
    $processes | ForEach-Object { Write-Host "     - $($_.ProcessName) (PID: $($_.Id))" -ForegroundColor Gray }
} else {
    Write-Host "   [NOT FOUND] No Ollama processes running" -ForegroundColor Red
}

# Summary
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Summary" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$commandOk = $false
try {
    $null = ollama --version 2>&1
    if ($LASTEXITCODE -eq 0) { $commandOk = $true }
} catch { }

$serviceOk = $false
try {
    $null = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
    $serviceOk = $true
} catch { }

if ($commandOk -and $serviceOk) {
    Write-Host "[SUCCESS] Ollama is installed and running!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Download model: ollama pull llama3.2:1b" -ForegroundColor Cyan
    Write-Host "  2. Run diagnostic: python check_ollama.py" -ForegroundColor Cyan
} elseif ($commandOk -and -not $serviceOk) {
    Write-Host "[WARNING] Ollama is installed but service is not running" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To start Ollama:" -ForegroundColor Yellow
    Write-Host "  1. Open Start menu and search for 'Ollama'" -ForegroundColor Cyan
    Write-Host "  2. Click on Ollama to start it" -ForegroundColor Cyan
    Write-Host "  3. Or run: ollama serve" -ForegroundColor Cyan
} else {
    Write-Host "[ERROR] Ollama does not appear to be installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please:" -ForegroundColor Yellow
    Write-Host "  1. Download Ollama from: https://ollama.com/download/windows" -ForegroundColor Cyan
    Write-Host "  2. Run the installer (OllamaSetup.exe)" -ForegroundColor Cyan
    Write-Host "  3. Complete the installation wizard" -ForegroundColor Cyan
    Write-Host "  4. Restart this PowerShell window" -ForegroundColor Cyan
    Write-Host "  5. Run this script again to verify" -ForegroundColor Cyan
}

Write-Host ""

