@echo off
echo ========================================
echo Starting SYNEREX Main App (Port 8082)
echo ========================================
echo.

cd /d "%~dp0\8082"

REM ========================================
REM PATH VALIDATION: Verify we're in the correct directory
REM ========================================
if not exist "main_hardened_ready_fixed.py" (
    echo.
    echo [ERROR] ========================================
    echo [ERROR] Cannot find main_hardened_ready_fixed.py!
    echo [ERROR] ========================================
    echo.
    echo Current directory: %CD%
    echo Expected location: emv-program\8082\main_hardened_ready_fixed.py
    echo.
    echo The batch file should be in: emv-program\
    echo And should change to: emv-program\8082\
    echo.
    echo Please check that:
    echo   1. The batch file is in the emv-program\ directory
    echo   2. The 8082\ directory exists with main_hardened_ready_fixed.py
    echo.
    pause
    exit /b 1
)

echo [OK] Path validation passed - main_hardened_ready_fixed.py found
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




