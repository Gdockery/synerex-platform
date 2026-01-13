@echo off
echo Starting Synerex OneForm on new port structure...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python from https://python.org
    pause
    exit /b 1
)

echo Python found. Starting services...

REM Start main application on port 8000
echo Starting Main Application (Port 8000)...
start "Main App" python main_app_8000.py

REM Start backup application on port 8001
echo Starting Backup Application (Port 8001)...
start "Backup App" python main_app_8001.py

REM Start API Gateway on port 8002
echo Starting API Gateway (Port 8002)...
start "API Gateway" python api_gateway_8002.py

echo.
echo Services started successfully!
echo.
echo The application is available at:
echo   http://127.0.0.1:8002 (API Gateway - Recommended)
echo   http://127.0.0.1:8000 (Main App Direct)
echo   http://127.0.0.1:8001 (Backup App Direct)
echo.

REM Open browser to API Gateway
timeout /t 3 /nobreak >nul
start "" "http://127.0.0.1:8002"

echo Press any key to stop all services...
pause >nul

REM Stop all services
taskkill /f /im python.exe >nul 2>&1
echo All services stopped.
pause
