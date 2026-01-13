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

echo Python found. Starting main application...

REM Start main application on port 8000
echo Starting Main Application (Port 8000)...
cd 8082
start "Main App" python main_hardened_ready_fixed.py

echo.
echo Service started successfully!
echo.
echo The application is available at:
echo   http://127.0.0.1:8000
echo   http://localhost:8000
echo.

REM Open browser
timeout /t 3 /nobreak >nul
start "" "http://127.0.0.1:8000"

echo Press any key to stop the service...
pause >nul

REM Stop service
taskkill /f /im python.exe >nul 2>&1
echo Service stopped.
pause
