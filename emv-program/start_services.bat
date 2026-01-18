@echo off
setlocal enabledelayedexpansion
REM SYNEREX OneForm - Start All Services (Windows Batch)
REM This script starts all 8 SYNEREX services on Windows (including Ollama AI Backend, Utility Rate Service, and Incentive Service)

REM ========================================
REM PATH VALIDATION: Verify all service files exist
REM ========================================
echo.
echo [VALIDATION] Checking all service files...

REM Check Service Manager
if not exist "service_manager_daemon.py" (
    echo [ERROR] Cannot find service_manager_daemon.py
    echo Current directory: %CD%
    echo Expected: emv-program\service_manager_daemon.py
    goto :validation_failed
)

REM Check services.yaml
if not exist "services.yaml" (
    echo [ERROR] Cannot find services.yaml
    echo Current directory: %CD%
    echo Expected: emv-program\services.yaml
    goto :validation_failed
)

REM Check Main App (8082)
if not exist "8082\main_hardened_ready_refactored.py" (
    echo [ERROR] Cannot find 8082\main_hardened_ready_refactored.py
    echo Current directory: %CD%
    echo Expected: emv-program\8082\main_hardened_ready_refactored.py
    goto :validation_failed
)

REM Check PDF Generator (8083)
if not exist "8083\enhanced_pdf_service.py" (
    echo [ERROR] Cannot find 8083\enhanced_pdf_service.py
    echo Current directory: %CD%
    echo Expected: emv-program\8083\enhanced_pdf_service.py
    goto :validation_failed
)

REM Check HTML Reports (8084)
if not exist "8084\html_report_service.py" (
    echo [ERROR] Cannot find 8084\html_report_service.py
    echo Current directory: %CD%
    echo Expected: emv-program\8084\html_report_service.py
    goto :validation_failed
)

REM Check Weather Service (8085)
if not exist "8085\weather_service.py" (
    echo [ERROR] Cannot find 8085\weather_service.py
    echo Current directory: %CD%
    echo Expected: emv-program\8085\weather_service.py
    goto :validation_failed
)

REM Check Utility Rate Service (8085)
if not exist "8085\utility_rate_service.py" (
    echo [ERROR] Cannot find 8085\utility_rate_service.py
    echo Current directory: %CD%
    echo Expected: emv-program\8085\utility_rate_service.py
    goto :validation_failed
)

REM Check Utility Incentive Service (8085)
if not exist "8085\utility_incentive_service.py" (
    echo [ERROR] Cannot find 8085\utility_incentive_service.py
    echo Current directory: %CD%
    echo Expected: emv-program\8085\utility_incentive_service.py
    goto :validation_failed
)

REM Check Chart Service (8086)
if not exist "8086\chart_service.py" (
    echo [ERROR] Cannot find 8086\chart_service.py
    echo Current directory: %CD%
    echo Expected: emv-program\8086\chart_service.py
    goto :validation_failed
)

REM Check Ollama AI Backend (8082)
if not exist "8082\ollama_ai_backend.py" (
    echo [ERROR] Cannot find 8082\ollama_ai_backend.py
    echo Current directory: %CD%
    echo Expected: emv-program\8082\ollama_ai_backend.py
    goto :validation_failed
)

REM All validations passed
echo [OK] All service files found - path validation passed
echo.
goto :validation_passed

:validation_failed
echo.
echo [ERROR] ========================================
echo [ERROR] PATH VALIDATION FAILED
echo [ERROR] ========================================
echo.
echo Batch file must be run from: emv-program\
echo Current directory: %CD%
echo.
echo Please navigate to the emv-program directory and try again.
echo.
pause
exit /b 1

:validation_passed
REM Continue with service startup...

echo Starting SYNEREX OneForm Services v2...

REM First, stop any existing services (EXCEPT Main App 8082 - it will restart last)
echo Step 1: Stopping any existing services (except Main App 8082)...
REM Kill services by port, excluding 8082
echo Stopping services on ports 8083, 8084, 8086, 8090, 8200, 8202, 8203, 9000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8083 :8084 :8086 :8090 :8200 :8202 :8203 :9000" ^| findstr LISTENING') do (
    echo Found process %%a, killing...
    taskkill /f /pid %%a >nul 2>&1
)
REM Also kill by window title for services
taskkill /f /im python.exe /fi "WINDOWTITLE eq PDF Generator*" >nul 2>&1
taskkill /f /im python.exe /fi "WINDOWTITLE eq HTML Reports*" >nul 2>&1
taskkill /f /im python.exe /fi "WINDOWTITLE eq Chart Service*" >nul 2>&1
taskkill /f /im python.exe /fi "WINDOWTITLE eq Weather Service*" >nul 2>&1
taskkill /f /im python.exe /fi "WINDOWTITLE eq Ollama AI Backend*" >nul 2>&1
taskkill /f /im python.exe /fi "WINDOWTITLE eq Utility Rate Service*" >nul 2>&1
taskkill /f /im python.exe /fi "WINDOWTITLE eq Utility Incentive Service*" >nul 2>&1
taskkill /f /im python.exe /fi "WINDOWTITLE eq Service Manager*" >nul 2>&1
REM Wait a moment for ports to be released
timeout /t 2 /nobreak >nul

echo.
echo Step 2: Checking prerequisites...

REM Check if Python is available
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://python.org
    exit /b 1
)

echo [OK] Python found
python --version

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment (Windows style)
echo Activating virtual environment...
call venv\Scripts\activate.bat
REM Note: Service Manager uses system Python, not venv Python

REM Clean up corrupted numpy directory
echo Cleaning up corrupted packages...
if exist "venv\Lib\site-packages\~umpy" (
    rmdir /s /q "venv\Lib\site-packages\~umpy" 2>nul
)

REM Check if core dependencies are already installed
echo Checking dependencies...
pip show flask >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Core dependencies already installed, skipping installation...
    goto :skip_install
)

REM Install dependencies if needed
echo Installing dependencies...

REM First, upgrade pip and install setuptools to avoid build issues
echo Upgrading pip and installing build tools...
python -m pip install --upgrade pip --quiet
pip install setuptools wheel --quiet

REM Install core dependencies (use latest compatible versions, not pinned old ones)
echo Installing core dependencies...
pip install numpy --quiet
pip install pandas --quiet
pip install flask --quiet
pip install werkzeug --quiet
pip install flask-cors --quiet

REM Install other dependencies
echo Installing additional dependencies...
pip install openpyxl requests jinja2 markupsafe itsdangerous click blinker certifi charset-normalizer idna urllib3 colorama pyyaml psutil --quiet
pip install scipy scikit-learn matplotlib seaborn --quiet
REM Ensure sklearn is installed (required by Main App)
python -c "import sklearn" >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing scikit-learn (required by Main App)...
    pip install scikit-learn --quiet
)

REM Try to install service-specific requirements if they exist
echo Installing service-specific dependencies...
if exist "8083\requirements.txt" (
    echo Installing PDF service dependencies...
    pip install -r 8083\requirements.txt --quiet
)

if exist "8084\requirements.txt" (
    echo Installing HTML service dependencies...
    pip install -r 8084\requirements.txt --quiet
)

if exist "8086\requirements.txt" (
    echo Installing Chart service dependencies...
    pip install -r 8086\requirements.txt --quiet
)

if exist "8082\requirements_ollama.txt" (
    echo Installing Ollama AI Backend dependencies...
    pip install -r 8082\requirements_ollama.txt --quiet
)

REM Install Main App dependencies (including PyPDF2 for PDF merging)
if exist "8082\requirements.txt" (
    echo Installing Main App dependencies...
    pip install -r 8082\requirements.txt --quiet
)

REM Install utility rate service dependencies
if exist "8085\requirements.txt" (
    pip install -r 8085\requirements.txt --quiet
) else (
    pip install beautifulsoup4 lxml --quiet
)

REM Ensure PyPDF2 is installed (required for PDF merging)
python -c "import PyPDF2" >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing PyPDF2 (required for PDF merging)...
    pip install "PyPDF2>=3.0.0" --quiet
)

echo [OK] All dependencies installed successfully
:skip_install

echo.
echo Step 3: Starting services...

REM Create logs directory
if not exist "logs" mkdir logs

REM Step 3a: Restart Service Manager first (Port 9000)
echo Restarting Service Manager on port 9000...
REM Stop any existing Service Manager on port 9000
echo Checking for existing Service Manager on port 9000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :9000 ^| findstr LISTENING') do (
    echo Found process %%a on port 9000, killing...
    taskkill /f /pid %%a >nul 2>&1
    if !errorlevel! equ 0 (
        echo   [OK] Process %%a terminated
    )
    if !errorlevel! neq 0 (
        echo   [WARNING] Failed to terminate process %%a
    )
)
REM Also try to kill by process name as backup
taskkill /f /im python.exe /fi "WINDOWTITLE eq Service Manager*" >nul 2>&1
REM Wait longer for port to be released (Windows TIME_WAIT can take 30+ seconds)
echo Waiting 5 seconds for port 9000 to be released...
timeout /t 5 /nobreak >nul

REM Ensure pyyaml and psutil are installed in system Python before starting Service Manager
echo Ensuring Service Manager dependencies are installed...
python -c "import yaml, psutil" >nul 2>&1
if %errorlevel% neq 0 (
    echo "Installing Service Manager dependencies (pyyaml, psutil) for system Python..."
    python -m pip install --upgrade pyyaml psutil
    REM Verify installation
    python -c "import yaml, psutil; print('Dependencies verified')" >nul 2>&1
    if %errorlevel% neq 0 (
        echo   [ERROR] Failed to install Service Manager dependencies
        echo   [ERROR] Please manually run: python -m pip install pyyaml psutil
        exit /b 1
    )
)

REM Start Service Manager (ensure venv is activated in the new window if it exists)
echo Starting Service Manager daemon...
REM Get the full path to SYSTEM Python (not venv), skipping Windows Store stub
REM Windows Store python.exe is a stub that doesn't have modules - we need the real Python
REM We need system Python, not venv Python, for Service Manager
set PYTHON_EXE=
REM Temporarily deactivate venv to get system Python path
call venv\Scripts\deactivate.bat 2>nul
for /f "delims=" %%p in ('where python 2^>nul') do (
    REM Skip Windows Store stub - it's in WindowsApps folder
    echo %%p | findstr /i "WindowsApps" >nul
    if !errorlevel! neq 0 (
        REM Also skip venv Python - we want system Python
        echo %%p | findstr /i "venv" >nul
        if !errorlevel! neq 0 (
            set PYTHON_EXE=%%p
            goto :python_found
        )
    )
)
:python_found
REM Reactivate venv for other services
call venv\Scripts\activate.bat 2>nul
if not defined PYTHON_EXE (
    REM Fallback: try using python directly (might work if in PATH)
    call venv\Scripts\deactivate.bat 2>nul
    python -c "import sys; print(sys.executable)" >nul 2>&1
    if !errorlevel! equ 0 (
        for /f "delims=" %%p in ('python -c "import sys; print(sys.executable)" 2^>nul') do (
            echo %%p | findstr /i "venv" >nul
            if !errorlevel! neq 0 (
                set PYTHON_EXE=%%p
                goto :python_found2
            )
        )
    )
    :python_found2
    call venv\Scripts\activate.bat 2>nul
    if not defined PYTHON_EXE (
        echo   [ERROR] Real Python installation not found (only Windows Store stub found)
        echo   [ERROR] Please ensure Python is installed from python.org
        exit /b 1
    )
)
echo   Using Python: %PYTHON_EXE%
REM Verify this Python has yaml before starting
"%PYTHON_EXE%" -c "import yaml, psutil" >nul 2>&1
if %errorlevel% neq 0 (
    echo   [ERROR] Python at %PYTHON_EXE% does not have yaml module
    echo   [ERROR] Installing yaml and psutil...
    "%PYTHON_EXE%" -m pip install --upgrade pyyaml psutil
    "%PYTHON_EXE%" -c "import yaml, psutil" >nul 2>&1
    if %errorlevel% neq 0 (
        echo   [ERROR] Failed to install dependencies
        exit /b 1
    )
)
REM Ensure we're in the project root directory when starting
REM Use the full path to Python to guarantee we use the correct one
REM Remove quotes from PYTHON_EXE if present, then add them properly in the command
set PYTHON_EXE_CLEAN=%PYTHON_EXE:"=%
start "Service Manager" /min cmd /c "cd /d %~dp0 && %PYTHON_EXE% service_manager_daemon.py > logs\service_manager.log 2>&1"
echo Waiting 25 seconds for Service Manager to initialize (increased for reliability)...
ping 127.0.0.1 -n 26 >nul

REM Verify Service Manager is running and healthy before proceeding
echo Verifying Service Manager (port 9000) is running...
set SERVICE_MANAGER_READY=0
for /L %%i in (1,1,20) do (
    REM Use PowerShell to check health endpoint (more reliable than curl)
    REM Increased timeout to 3 seconds and total attempts to 20 (60 seconds total)
    powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://127.0.0.1:9000/health' -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop; exit 0 } catch { exit 1 }" >nul 2>&1
    set CHECK_RESULT=!errorlevel!
    if !CHECK_RESULT! equ 0 (
        echo   [OK] Service Manager is running and healthy (attempt %%i)
        set SERVICE_MANAGER_READY=1
        goto :service_manager_verified
    )
    if !CHECK_RESULT! neq 0 (
        echo   [WAITING] Waiting for Service Manager... (attempt %%i/20)
        timeout /t 3 /nobreak >nul
    )
)

:service_manager_verified
REM Check if SERVICE_MANAGER_READY is set to 1 (use string comparison to avoid delayed expansion issues)
if "!SERVICE_MANAGER_READY!"=="1" goto :service_manager_ready

REM If we get here, Service Manager is not ready
echo   [ERROR] Service Manager failed to start after 20 attempts (60 seconds)
echo   [ERROR] Cannot proceed without Service Manager. Check logs\service_manager.log
echo   [ERROR] Last few lines of service_manager.log:
powershell -Command "Get-Content logs\service_manager.log -Tail 10 -ErrorAction SilentlyContinue"
echo.
echo   Attempting to diagnose the issue...
echo   Checking if port 9000 is in use:
netstat -aon | findstr :9000
echo.
echo   Checking if Python can import required modules:
"%PYTHON_EXE%" -c "import yaml, psutil, flask; print('All modules available')" 2>&1
exit /b 1

:service_manager_ready
echo.
echo [OK] Service Manager confirmed running - proceeding to start other services...
echo.

REM Step 3b: Stop Main App (8082) now (after other services are stopped)
echo Stopping Main App on port 8082...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8082" ^| findstr LISTENING') do (
    echo Found Main App process %%a on port 8082, stopping...
    taskkill /f /pid %%a >nul 2>&1
    if !errorlevel! equ 0 (
        echo   [OK] Main App process %%a terminated
    )
)
REM Also try to kill by window title as backup
taskkill /f /im python.exe /fi "WINDOWTITLE eq Main App*" >nul 2>&1
echo Waiting 3 seconds for port 8082 to be released...
timeout /t 3 /nobreak >nul

REM Step 3c: Start Main App (8082) next
echo Starting Main App on port 8082...
REM Ensure PyPDF2 is available before starting (required for PDF merging)
python -c "import PyPDF2" >nul 2>&1
if errorlevel 1 (
    echo Installing PyPDF2 (required for PDF merging)...
    python -m pip install "PyPDF2>=3.0.0" --quiet
)
start "Main App" /min cmd /c "cd /d %~dp0\8082 && python main_hardened_ready_refactored.py > ..\logs\main_app.log 2>&1"

echo Waiting 15 seconds for Main App to start...
ping 127.0.0.1 -n 16 >nul

REM Verify Main App is running and healthy before proceeding
echo Verifying Main App (port 8082) is running...
set MAIN_APP_READY=0
for /L %%i in (1,1,20) do (
    REM Use PowerShell to check health endpoint (more reliable than curl)
    REM Increased timeout to 3 seconds and total attempts to 20 (60 seconds total)
    powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://127.0.0.1:8082/api/health' -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop; exit 0 } catch { exit 1 }" >nul 2>&1
    set CHECK_RESULT=!errorlevel!
    if !CHECK_RESULT! equ 0 (
        echo   [OK] Main App is running and healthy (attempt %%i)
        set MAIN_APP_READY=1
        goto :main_app_verified
    )
    if !CHECK_RESULT! neq 0 (
        echo   [WAITING] Waiting for Main App... (attempt %%i/20)
        timeout /t 3 /nobreak >nul
    )
)

:main_app_verified
REM Check if MAIN_APP_READY is set to 1 (use string comparison to avoid delayed expansion issues)
if "!MAIN_APP_READY!"=="1" goto :main_app_ready

REM If we get here, Main App is not ready
echo   [ERROR] Main App failed to start after 20 attempts (60 seconds)
echo   [ERROR] Cannot proceed without Main App. Check logs\main_app.log
echo   [ERROR] Last few lines of main_app.log:
powershell -Command "Get-Content logs\main_app.log -Tail 10 -ErrorAction SilentlyContinue"
echo.
echo   Attempting to diagnose the issue...
echo   Checking if port 8082 is in use:
netstat -aon | findstr :8082
echo.
echo   Checking if Python can import required modules:
"%PYTHON_EXE%" -c "import flask, sqlite3; print('All modules available')" 2>&1
exit /b 1

:main_app_ready
echo.
echo [OK] Main App confirmed running - proceeding to start other services...
echo.

REM Step 3d: Start remaining services
echo Starting PDF Generator on port 8083...
start "PDF Generator" /min cmd /c "cd /d %~dp0\8083 && python enhanced_pdf_service.py > ..\logs\pdf_generator.log 2>&1"

echo Starting HTML Reports on port 8084...
start "HTML Reports" /min cmd /c "cd /d %~dp0\8084 && python html_report_service.py > ..\logs\html_reports.log 2>&1"

echo Starting Weather Service on port 8200...
start "Weather Service" /min cmd /c "cd /d %~dp0\8085 && python weather_service.py > ..\logs\weather_service.log 2>&1"

echo Starting Utility Rate Service on port 8202...
start "Utility Rate Service" /min cmd /c "cd /d %~dp0\8085 && python utility_rate_service.py > ..\logs\utility_rate_service.log 2>&1"
timeout /t 2 /nobreak >nul

echo Starting Utility Incentive Service on port 8203...
start "Utility Incentive Service" /min cmd /c "cd /d %~dp0\8085 && python utility_incentive_service.py > ..\logs\utility_incentive_service.log 2>&1"
timeout /t 2 /nobreak >nul

echo Starting Chart Service on port 8086...
start "Chart Service" /min cmd /c "cd /d %~dp0\8086 && python chart_service.py > ..\logs\chart_service.log 2>&1"

echo Starting Ollama AI Backend on port 8090...
start "Ollama AI Backend" /min cmd /c "chcp 65001 >nul && cd /d %~dp0\8082 && python ollama_ai_backend.py > ..\logs\ollama_ai_backend.log 2>&1"

echo.
echo Step 4: Waiting for services to initialize...
echo Waiting 8 seconds for services to start...
ping 127.0.0.1 -n 9 >nul

echo.
echo Step 5: Verifying services...
echo.

REM Check each service
echo Checking Service Manager (9000)...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://127.0.0.1:9000/health' -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop; exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel% equ 0 (
    echo   [OK] Service Manager is running
) else (
    echo   [ERROR] Service Manager failed to start - check logs\service_manager.log
)

echo Checking Main App (8082)...
curl -s http://127.0.0.1:8082/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo   [OK] Main App is running
) else (
    echo   [ERROR] Main App failed to start - check logs\main_app.log
)

echo Checking Weather Service (8200)...
curl -s http://127.0.0.1:8200/health >nul 2>&1
if %errorlevel% equ 0 (
    echo   [OK] Weather Service is running
) else (
    echo   [ERROR] Weather Service failed to start - check logs\weather_service.log
)

echo Checking Utility Rate Service (8202)...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://127.0.0.1:8202/health' -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop; exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel% equ 0 (
    echo   [OK] Utility Rate Service is running
) else (
    echo   [WARNING] Utility Rate Service may not be ready yet
)

echo Checking Utility Incentive Service (8203)...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://127.0.0.1:8203/health' -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop; exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel% equ 0 (
    echo   [OK] Utility Incentive Service is running
) else (
    echo   [WARNING] Utility Incentive Service may not be ready yet
)

echo Checking HTML Reports (8084)...
curl -s http://127.0.0.1:8084/health >nul 2>&1
if %errorlevel% equ 0 (
    echo   [OK] HTML Reports is running
) else (
    echo   [ERROR] HTML Reports failed to start - check logs\html_reports.log
)

echo Checking Chart Service (8086)...
curl -s http://127.0.0.1:8086/health >nul 2>&1
if %errorlevel% equ 0 (
    echo   [OK] Chart Service is running
) else (
    echo   [ERROR] Chart Service failed to start - check logs\chart_service.log
)

echo Checking Ollama AI Backend (8090)...
powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://127.0.0.1:8090/health' -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop; exit 0 } catch { exit 1 }" >nul 2>&1
if %errorlevel% equ 0 (
    echo   [OK] Ollama AI Backend is running
) else (
    echo   [WARNING] Ollama AI Backend may not be ready yet (requires Ollama to be running on port 11434)
    echo   [WARNING] If Ollama is not installed, SynerexAI will use fallback responses
)

echo.
echo SYNEREX OneForm Services Started!
echo.
echo Service URLs:
echo   Service Manager: http://127.0.0.1:9000
echo   Main App:     http://127.0.0.1:8082
echo   PDF Service:  http://127.0.0.1:8083
echo   HTML Reports: http://127.0.0.1:8084
echo   Weather:      http://127.0.0.1:8200
echo   Utility Rates:    http://127.0.0.1:8202
echo   Utility Incentives: http://127.0.0.1:8203
echo   Charts:          http://127.0.0.1:8086
echo   Ollama AI:       http://127.0.0.1:8090
echo.
echo Logs are in the 'logs/' directory
echo.
echo To stop all services, run: stop_services.bat
echo.
echo Opening main application in browser...

REM No pause needed when run from subprocess - script will exit automatically