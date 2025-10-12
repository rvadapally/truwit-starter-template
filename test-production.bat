@echo off
echo ========================================
echo    Testing PRODUCTION Environment
echo ========================================
echo.
echo API: https://truwit-starter-template-production.up.railway.app
echo Frontend: https://www.truwit.ai
echo.
echo Running automated tests against production...
echo.

powershell -ExecutionPolicy Bypass -File test-suite-v2.ps1 -Environment production

echo.
pause

