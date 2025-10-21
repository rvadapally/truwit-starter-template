@echo off
REM Comprehensive E2E Test Runner for Windows
REM Tests the complete badge system and catches real issues

echo 🧪 TruWit Comprehensive E2E Test Suite
echo ======================================

REM Check if Python is available
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is required but not installed
    exit /b 1
)

REM Install Playwright if not available
python -c "import playwright" >nul 2>&1
if errorlevel 1 (
    echo 📦 Installing Playwright...
    pip install playwright
    python -m playwright install --with-deps chromium
)

REM Set environment variables
set E2E_BASE_URL=https://truwit.ai
set E2E_API_URL=https://truwit-starter-template-production.up.railway.app

echo 🌐 Frontend URL: %E2E_BASE_URL%
echo 🔗 API URL: %E2E_API_URL%
echo.

REM Run the comprehensive test suite
python tools/comprehensive_e2e_test.py

echo.
echo ✅ E2E test suite completed!
echo 📄 Check test-results\ directory for detailed reports
