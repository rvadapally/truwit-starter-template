@echo off
echo ========================================
echo    Truwit Production Comprehensive Test Suite
echo ========================================
echo.
echo 🌐 API:      https://truwit-starter-template-production.up.railway.app
echo 🌐 Frontend: https://www.truwit.ai
echo.
echo Running comprehensive tests against production...
echo   - Routing & Display Tests
echo   - Database Validation Tests
echo   - Timezone Tests (Central Time)
echo   - Idempotency Tests
echo.

powershell -ExecutionPolicy Bypass -File test-comprehensive.ps1 -Environment production

echo.
pause

