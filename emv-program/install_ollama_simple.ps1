# Simple Ollama Installation Guide for SYNEREX
# This script guides you through installation and verifies it

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Ollama Installation Guide for SYNEREX" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if already installed
Write-Host "Step 1: Checking if Ollama is already installed..." -ForegroundColor Yellow
try {
    $null = ollama --version 2>$null
    Write-Host "[OK] Ollama is already installed!" -ForegroundColor Green
    
    # Check if service is running
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
        Write-Host "[OK] Ollama service is running!" -ForegroundColor Green
        
        # Check for model
        $models = ($response.Content | ConvertFrom-Json).models
        $modelNames = $models | ForEach-Object { $_.name }
        if ($modelNames -contains "llama3.2:1b") {
            Write-Host "[OK] Model 'llama3.2:1b' is available!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Ollama is fully configured and ready to use!" -ForegroundColor Green
            exit 0
        } else {
            Write-Host "[INFO] Model 'llama3.2:1b' not found. We'll download it next." -ForegroundColor Yellow
        }
    } catch {
        Write-Host "[WARNING] Ollama is installed but service is not running." -ForegroundColor Yellow
        Write-Host "Please start Ollama from the Start menu." -ForegroundColor Yellow
    }
} catch {
    Write-Host "[INFO] Ollama is not installed. Let's install it now..." -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host "  Installation Instructions" -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. The download page should have opened in your browser." -ForegroundColor Yellow
    Write-Host "2. Click 'Download for Windows' on the Ollama website" -ForegroundColor Yellow
    Write-Host "3. Run the downloaded OllamaSetup.exe installer" -ForegroundColor Yellow
    Write-Host "4. Follow the installation wizard" -ForegroundColor Yellow
    Write-Host "5. Ollama will start automatically after installation" -ForegroundColor Yellow
    Write-Host ""
    
    $continue = Read-Host "Press Enter after you have completed the installation, or type 'cancel' to exit"
    if ($continue -eq "cancel") {
        Write-Host "Installation cancelled." -ForegroundColor Yellow
        exit 0
    }
    
    # Wait a moment for installation
    Write-Host ""
    Write-Host "Verifying installation..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
    
    # Check if installed
    try {
        $null = ollama --version 2>$null
        Write-Host "[OK] Ollama installed successfully!" -ForegroundColor Green
    } catch {
        Write-Host "[ERROR] Ollama installation not detected." -ForegroundColor Red
        Write-Host "Please:" -ForegroundColor Yellow
        Write-Host "  1. Make sure you completed the installation" -ForegroundColor Yellow
        Write-Host "  2. Close and reopen this PowerShell window" -ForegroundColor Yellow
        Write-Host "  3. Run this script again" -ForegroundColor Yellow
        exit 1
    }
}

# Step 2: Verify service is running
Write-Host ""
Write-Host "Step 2: Verifying Ollama service is running..." -ForegroundColor Yellow
$maxRetries = 10
$retryCount = 0
$serviceRunning = $false

while ($retryCount -lt $maxRetries -and -not $serviceRunning) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
        $serviceRunning = $true
        Write-Host "[OK] Ollama service is running!" -ForegroundColor Green
    } catch {
        $retryCount++
        if ($retryCount -lt $maxRetries) {
            Write-Host "Waiting for Ollama service to start... (attempt $retryCount/$maxRetries)" -ForegroundColor Yellow
            Start-Sleep -Seconds 2
        } else {
            Write-Host "[WARNING] Ollama service is not running." -ForegroundColor Yellow
            Write-Host "Please start Ollama from the Start menu or run 'ollama serve'" -ForegroundColor Yellow
            Write-Host ""
            $startManually = Read-Host "Have you started Ollama manually? (Y/N)"
            if ($startManually -eq "Y" -or $startManually -eq "y") {
                Start-Sleep -Seconds 3
                try {
                    $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
                    $serviceRunning = $true
                    Write-Host "[OK] Ollama service is now running!" -ForegroundColor Green
                } catch {
                    Write-Host "[ERROR] Still cannot connect to Ollama service." -ForegroundColor Red
                    exit 1
                }
            } else {
                exit 1
            }
        }
    }
}

# Step 3: Download model
Write-Host ""
Write-Host "Step 3: Checking for required model 'llama3.2:1b'..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    $models = ($response.Content | ConvertFrom-Json).models
    $modelNames = $models | ForEach-Object { $_.name }
    
    if ($modelNames -contains "llama3.2:1b") {
        Write-Host "[OK] Model 'llama3.2:1b' is already available!" -ForegroundColor Green
    } else {
        Write-Host "[INFO] Model 'llama3.2:1b' not found." -ForegroundColor Yellow
        Write-Host "This model is required for SYNEREX. Size: ~1.3 GB" -ForegroundColor Yellow
        Write-Host ""
        
        $downloadModel = Read-Host "Download model 'llama3.2:1b' now? (Y/N)"
        if ($downloadModel -eq "Y" -or $downloadModel -eq "y") {
            Write-Host ""
            Write-Host "Downloading llama3.2:1b..." -ForegroundColor Yellow
            Write-Host "This may take several minutes depending on your internet speed..." -ForegroundColor Yellow
            Write-Host ""
            
            ollama pull llama3.2:1b
            
            Write-Host ""
            Write-Host "[OK] Model downloaded successfully!" -ForegroundColor Green
        } else {
            Write-Host "[INFO] Model download skipped. You can download it later with:" -ForegroundColor Yellow
            Write-Host "  ollama pull llama3.2:1b" -ForegroundColor Cyan
        }
    }
} catch {
    Write-Host "[ERROR] Could not check for models. Ollama service may not be running." -ForegroundColor Red
    exit 1
}

# Step 4: Final verification
Write-Host ""
Write-Host "Step 4: Final verification..." -ForegroundColor Yellow
Write-Host ""

# Test Ollama with a simple request
try {
    $testPayload = @{
        model = "llama3.2:1b"
        prompt = "Say 'OK' if you can read this."
        stream = $false
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "http://localhost:11434/api/generate" -Method Post -Body $testPayload -ContentType "application/json" -TimeoutSec 30
    $testResponse = $response.response
    
    Write-Host "[OK] Ollama is responding correctly!" -ForegroundColor Green
    Write-Host "   Test response: $($testResponse.Substring(0, [Math]::Min(50, $testResponse.Length)))..." -ForegroundColor Gray
} catch {
    Write-Host "[WARNING] Could not test Ollama response. It may still be initializing." -ForegroundColor Yellow
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Installation Complete!" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Run diagnostic: python check_ollama.py" -ForegroundColor Cyan
Write-Host "  2. Restart SYNEREX services: start_services.bat" -ForegroundColor Cyan
Write-Host "  3. Test SynerexAI in the web interface" -ForegroundColor Cyan
Write-Host ""

