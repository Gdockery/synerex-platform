@echo off
REM Quick script to restart Main App (8082) via Service Manager API
REM Requires Service Manager (port 9000) to be running

echo ============================================================
echo Restarting Main App (8082) via Service Manager
echo ============================================================
echo.

cd /d "%~dp0"

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not available in PATH
    echo Please ensure Python is installed and in your PATH
    pause
    exit /b 1
)

REM Run the Python script
python restart_8082.py

if errorlevel 1 (
    echo.
    echo Restart failed. Check the errors above.
    pause
    exit /b 1
) else (
    echo.
    echo Restart completed successfully!
    pause
)
