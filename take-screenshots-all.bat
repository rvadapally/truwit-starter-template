@echo off
REM All Viewports Screenshot Capture Tool for Truwit
REM Takes screenshots of all key pages in desktop, tablet, and mobile viewports

echo.
echo ======================================
echo  Truwit All Viewports Screenshot Tool
echo ======================================
echo.

REM Check if PowerShell is available
powershell -Command "Get-Host" >nul 2>&1
if errorlevel 1 (
    echo ERROR: PowerShell is required but not found
    pause
    exit /b 1
)

REM Run the PowerShell script with all viewports
powershell -ExecutionPolicy Bypass -File "%~dp0take-screenshots.ps1" -Environment production -ViewportType all

if errorlevel 1 (
    echo.
    echo ERROR: Screenshot capture failed
    pause
    exit /b 1
)

echo.
echo All viewport screenshot capture completed successfully!
pause
