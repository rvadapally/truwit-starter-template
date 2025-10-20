@echo off
setlocal

if "%E2E_BASE_URL%"=="" (
  set "E2E_BASE_URL=http://127.0.0.1:4321"
)

echo ==================================================
echo   Truwit Starter Template - Full Route Validation
echo   Target base URL: %E2E_BASE_URL%
echo ==================================================

echo.
echo [1/2] Ensuring Playwright browsers are installed...
python -m playwright install --with-deps >nul 2>&1
if errorlevel 1 (
  echo Failed to install Playwright browsers.
  exit /b 1
)

echo.
echo [2/2] Running navigation audit...
python tools\e2e_full_navigation.py
set "RESULT=%ERRORLEVEL%"

echo.
if "%RESULT%"=="0" (
  echo ✅ Navigation audit completed successfully.
) else (
  echo ❌ Navigation audit reported failures. See log above.
)

exit /b %RESULT%
