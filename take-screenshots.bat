@echo off
REM Screenshot Capture Tool for Truwit
REM Takes screenshots of all key pages in multiple viewports

echo.
echo ======================================
echo    Truwit Screenshot Capture Tool
echo ======================================
echo.

REM Check if PowerShell is available
powershell -Command "Get-Host" >nul 2>&1
if errorlevel 1 (
    echo ERROR: PowerShell is required but not found
    pause
    exit /b 1
)

REM Run the PowerShell script
powershell -ExecutionPolicy Bypass -File "%~dp0take-screenshots.ps1" -Environment production

if errorlevel 1 (
    echo.
    echo ERROR: Screenshot capture failed
    pause
    exit /b 1
)

echo.
echo Screenshot capture completed successfully!
pause

