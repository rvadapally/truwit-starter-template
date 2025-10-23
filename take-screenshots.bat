@echo off
REM Desktop Screenshot Capture Tool for Truwit
REM Takes desktop-only screenshots of all key pages (1920x1080)

echo.
echo ======================================
echo  Truwit Desktop Screenshot Tool
echo ======================================
echo.

REM Check if PowerShell is available
powershell -Command "Get-Host" >nul 2>&1
if errorlevel 1 (
    echo ERROR: PowerShell is required but not found
    pause
    exit /b 1
)

REM Run the PowerShell script with desktop-only viewport
powershell -ExecutionPolicy Bypass -File "%~dp0take-screenshots.ps1" -Environment production -ViewportType desktop

if errorlevel 1 (
    echo.
    echo ERROR: Screenshot capture failed
    pause
    exit /b 1
)

echo.
echo Desktop screenshot capture completed successfully!
pause

