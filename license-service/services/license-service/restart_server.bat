@echo off
REM Synerex License Service - Manual Restart Script (Windows Batch)
REM This script stops the server on port 8000 and restarts it

echo ========================================
echo Synerex License Service - Restart
echo ========================================
echo.

REM Stop existing server processes on port 8000
echo Stopping server on port 8000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') do (
    echo   Stopping process %%a
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 2 /nobreak >nul

REM Change to the license-service directory
cd /d "%~dp0"

REM Start the server
echo.
echo Starting server...
echo   Directory: %CD%
echo   Command: python -m uvicorn app.main:app --reload --port 8000
echo.

start "Synerex License Service" python -m uvicorn app.main:app --reload --port 8000

echo Server restart initiated!
echo The server should be starting in a new window.
echo.
echo You can access the admin panel at: http://localhost:8000/admin/login
echo.
pause


