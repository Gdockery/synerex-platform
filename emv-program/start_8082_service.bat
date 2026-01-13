@echo off
echo ========================================
echo Starting SYNEREX Main App (Port 8082)
echo ========================================
echo.

cd /d "%~dp0\8082"

echo Current directory: %CD%
echo.

echo Starting Python service...
echo.

python main_hardened_ready_fixed.py

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ========================================
    echo ERROR: Service failed to start!
    echo ========================================
    echo.
    echo Check the error messages above.
    pause
) else (
    echo.
    echo ========================================
    echo Service stopped.
    echo ========================================
    pause
)




