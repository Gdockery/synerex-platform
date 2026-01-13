@echo off
echo Installing PDF generation and email dependencies...
cd backend
npm install puppeteer nodemailer handlebars
echo.
echo Dependencies installed successfully!
echo.
echo Next steps:
echo 1. Configure email settings in backend/.env
echo 2. For Gmail: Set up App Password
echo 3. Restart backend server
echo.
pause
