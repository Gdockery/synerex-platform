@echo off
echo Starting Weather Service on port 8200...
cd /d %~dp0
cd 8085
start "Weather Service" /min cmd /c "python weather_service.py"
timeout /t 3 /nobreak >nul
curl.exe -s http://127.0.0.1:8200/health
if %errorlevel% equ 0 (
    echo Weather service started successfully
) else (
    echo Weather service failed to start
)
pause


