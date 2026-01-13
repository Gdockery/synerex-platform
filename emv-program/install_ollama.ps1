# Ollama Installation Helper Script for SYNEREX
# This script helps download and install Ollama on Windows

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Ollama Installation Helper for SYNEREX" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Ollama is already installed
Write-Host "Checking if Ollama is already installed..." -ForegroundColor Yellow
try {
    $ollamaVersion = ollama --version 2>$null
    if ($ollamaVersion) {
        Write-Host "[OK] Ollama is already installed: $ollamaVersion" -ForegroundColor Green
        Write-Host ""
        Write-Host "Checking if Ollama service is running..." -ForegroundColor Yellow
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
            Write-Host "[OK] Ollama service is running!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Checking for required model 'llama3.2:1b'..." -ForegroundColor Yellow
            $models = ($response.Content | ConvertFrom-Json).models
            $modelNames = $models | ForEach-Object { $_.name }
            if ($modelNames -contains "llama3.2:1b") {
                Write-Host "[OK] Model 'llama3.2:1b' is available!" -ForegroundColor Green
                Write-Host ""
                Write-Host "Ollama is ready to use!" -ForegroundColor Green
                exit 0
            } else {
                Write-Host "[WARNING] Model 'llama3.2:1b' not found. Available models: $($modelNames -join ', ')" -ForegroundColor Yellow
                Write-Host "You need to run: ollama pull llama3.2:1b" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "[WARNING] Ollama is installed but service is not running." -ForegroundColor Yellow
            Write-Host "Please start Ollama from the Start menu or run 'ollama serve'" -ForegroundColor Yellow
        }
        exit 0
    }
} catch {
    Write-Host "[INFO] Ollama is not installed. Proceeding with installation..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 1: Downloading Ollama Installer..." -ForegroundColor Cyan
Write-Host ""

# Download URL for Ollama Windows installer
$downloadUrl = "https://ollama.com/download/windows"
$installerPath = "$env:TEMP\OllamaSetup.exe"

Write-Host "Download URL: $downloadUrl" -ForegroundColor Gray
Write-Host "Installer will be saved to: $installerPath" -ForegroundColor Gray
Write-Host ""

# Check if installer already exists
if (Test-Path $installerPath) {
    Write-Host "[INFO] Installer already exists at $installerPath" -ForegroundColor Yellow
    $useExisting = Read-Host "Use existing installer? (Y/N)"
    if ($useExisting -ne "Y" -and $useExisting -ne "y") {
        Remove-Item $installerPath -Force
    }
}

if (-not (Test-Path $installerPath)) {
    Write-Host "Downloading Ollama installer..." -ForegroundColor Yellow
    Write-Host "NOTE: You may need to download manually from: https://ollama.com/download/windows" -ForegroundColor Yellow
    Write-Host ""
    
    try {
        # Try to download using Invoke-WebRequest
        Write-Host "Attempting to download..." -ForegroundColor Yellow
        Invoke-WebRequest -Uri $downloadUrl -OutFile $installerPath -UseBasicParsing -ErrorAction Stop
        Write-Host "[OK] Download complete!" -ForegroundColor Green
    } catch {
        Write-Host "[WARNING] Automatic download failed. Please download manually:" -ForegroundColor Yellow
        Write-Host "  1. Open your browser and go to: https://ollama.com/download/windows" -ForegroundColor Cyan
        Write-Host "  2. Download OllamaSetup.exe" -ForegroundColor Cyan
        Write-Host "  3. Save it to: $installerPath" -ForegroundColor Cyan
        Write-Host ""
        $manualDownload = Read-Host "Press Enter after you have downloaded the installer, or type 'skip' to exit"
        if ($manualDownload -eq "skip") {
            exit 1
        }
        
        if (-not (Test-Path $installerPath)) {
            Write-Host "[ERROR] Installer not found at $installerPath" -ForegroundColor Red
            Write-Host "Please download it manually and run this script again." -ForegroundColor Yellow
            exit 1
        }
    }
}

Write-Host ""
Write-Host "Step 2: Installing Ollama..." -ForegroundColor Cyan
Write-Host ""
Write-Host "The installer will now launch. Please follow the on-screen instructions." -ForegroundColor Yellow
Write-Host "After installation, Ollama should start automatically." -ForegroundColor Yellow
Write-Host ""

$proceed = Read-Host "Ready to install? (Y/N)"
if ($proceed -ne "Y" -and $proceed -ne "y") {
    Write-Host "Installation cancelled." -ForegroundColor Yellow
    exit 0
}

# Run the installer
Write-Host "Launching installer..." -ForegroundColor Yellow
Start-Process -FilePath $installerPath -Wait

Write-Host ""
Write-Host "Step 3: Verifying Installation..." -ForegroundColor Cyan
Write-Host ""

# Wait a moment for installation to complete
Start-Sleep -Seconds 5

# Check if Ollama is now available
try {
    $ollamaVersion = ollama --version 2>$null
    if ($ollamaVersion) {
        Write-Host "[OK] Ollama installed successfully: $ollamaVersion" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] Ollama command not found. You may need to:" -ForegroundColor Yellow
        Write-Host "  1. Restart your terminal/PowerShell" -ForegroundColor Yellow
        Write-Host "  2. Add Ollama to your PATH manually" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[WARNING] Could not verify installation. Please check manually." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 4: Downloading Required Model..." -ForegroundColor Cyan
Write-Host ""

# Check if Ollama service is running
Write-Host "Checking if Ollama service is running..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

try {
    $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    Write-Host "[OK] Ollama service is running!" -ForegroundColor Green
    
    # Check if model is already available
    $models = ($response.Content | ConvertFrom-Json).models
    $modelNames = $models | ForEach-Object { $_.name }
    
    if ($modelNames -contains "llama3.2:1b") {
        Write-Host "[OK] Model 'llama3.2:1b' is already available!" -ForegroundColor Green
    } else {
        Write-Host "[INFO] Model 'llama3.2:1b' not found. Downloading..." -ForegroundColor Yellow
        Write-Host "This may take several minutes (model size: ~1.3 GB)..." -ForegroundColor Yellow
        Write-Host ""
        
        $downloadModel = Read-Host "Download model now? (Y/N)"
        if ($downloadModel -eq "Y" -or $downloadModel -eq "y") {
            Write-Host "Downloading llama3.2:1b..." -ForegroundColor Yellow
            ollama pull llama3.2:1b
            Write-Host "[OK] Model downloaded successfully!" -ForegroundColor Green
        } else {
            Write-Host "[INFO] You can download the model later by running: ollama pull llama3.2:1b" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "[WARNING] Ollama service is not running yet." -ForegroundColor Yellow
    Write-Host "Please:" -ForegroundColor Yellow
    Write-Host "  1. Check if Ollama is running in Task Manager" -ForegroundColor Yellow
    Write-Host "  2. Start Ollama from the Start menu" -ForegroundColor Yellow
    Write-Host "  3. Then run: ollama pull llama3.2:1b" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Installation Complete!" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Verify installation: python check_ollama.py" -ForegroundColor Cyan
Write-Host "  2. Restart SYNEREX services: start_services.bat" -ForegroundColor Cyan
Write-Host "  3. Test SynerexAI in the web interface" -ForegroundColor Cyan
Write-Host ""

