@echo off
REM Mobile Screenshot Capture Tool for Truwit
REM Takes mobile-only screenshots of all key pages (375x667)

echo.
echo ======================================
echo  Truwit Mobile Screenshot Tool
echo ======================================
echo.

REM Check if PowerShell is available
powershell -Command "Get-Host" >nul 2>&1
if errorlevel 1 (
    echo ERROR: PowerShell is required but not found
    pause
    exit /b 1
)

REM Run the PowerShell script with mobile viewport
powershell -ExecutionPolicy Bypass -File "%~dp0take-screenshots.ps1" -Environment production -ViewportType mobile

if errorlevel 1 (
    echo.
    echo ERROR: Screenshot capture failed
    pause
    exit /b 1
)

echo.
echo Mobile screenshot capture completed successfully!
pause
