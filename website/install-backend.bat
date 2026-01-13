@echo off
echo Installing backend dependencies...
cd backend
npm install
echo.
echo Backend dependencies installed!
echo.
echo Next steps:
echo 1. Run: npm run setup
echo 2. Edit backend/.env with your DocuSign credentials
echo 3. Run: npm run dev
echo.
pause
