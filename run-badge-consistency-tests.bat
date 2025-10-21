@echo off
echo ========================================
echo BADGE CONSISTENCY E2E TEST SUITE
echo ========================================
echo.
echo This test suite validates the CRUX of the app:
echo - Unified circular badge system
echo - Badge consistency across all routes
echo - Proof card generation and display
echo - Badge fallback mechanisms
echo - Cross-browser compatibility
echo.

REM Set environment variables
set E2E_BASE_URL=https://truwit.ai
set E2E_API_URL=https://truwit-starter-template-production.up.railway.app

echo Testing against:
echo   Frontend: %E2E_BASE_URL%
echo   API: %E2E_API_URL%
echo.

REM Check if Python is available
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ and try again
    pause
    exit /b 1
)

REM Check if Playwright is installed
python -c "import playwright" >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing Playwright...
    pip install playwright
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install Playwright
        pause
        exit /b 1
    )
)

REM Install Playwright browsers if needed
echo Installing Playwright browsers...
python -m playwright install --with-deps
if %errorlevel% neq 0 (
    echo ERROR: Failed to install Playwright browsers
    pause
    exit /b 1
)

echo.
echo Starting Badge Consistency Tests...
echo ========================================

REM Run the badge consistency tests
python tools/badge_consistency_e2e_test.py

set test_result=%errorlevel%

echo.
echo ========================================
if %test_result% equ 0 (
    echo [SUCCESS] BADGE CONSISTENCY TESTS PASSED!
    echo The unified circular badge system is ROCK SOLID!
) else if %test_result% equ 1 (
    echo [WARNING] BADGE CONSISTENCY TESTS WARNING
    echo Badge consistency needs improvement
) else (
    echo [CRITICAL] BADGE CONSISTENCY TESTS FAILED
    echo CRITICAL: Badge consistency issues detected
)
echo ========================================

echo.
echo Test completed with exit code: %test_result%
echo Check test-results/ folder for detailed report
echo.
pause
exit /b %test_result%
