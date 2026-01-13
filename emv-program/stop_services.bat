@echo off
echo Stopping SYNEREX Services...

echo Stopping Python services...
taskkill /f /im python.exe 2>nul

echo All services stopped.