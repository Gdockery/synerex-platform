@echo off
echo ========================================
echo    SYNEREX Power Analysis System
echo ========================================
echo.
echo Starting the web service...
echo.

cd /d "%~dp0"

echo Checking if Python is installed...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8 or higher
    pause
    exit /b 1
)

echo Python found. Starting service...
echo.
echo The service will be available at:
echo   http://127.0.0.1:8082
echo   http://localhost:8082
echo.
echo Press Ctrl+C to stop the service
echo.

start "" "http://127.0.0.1:8082"

python main_hardened_ready_fixed.py

echo.
echo Service stopped.
pause
