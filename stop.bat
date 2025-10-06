@echo off
echo ========================================
echo    Stopping Truwit Verification App
echo ========================================
echo.

echo Stopping all Node.js processes (Angular dev server)...
taskkill /f /im node.exe >nul 2>&1
if errorlevel 1 (
    echo No Node.js processes found
) else (
    echo ✅ Angular server stopped
)

echo.
echo Stopping all .NET processes (API server)...
taskkill /f /im dotnet.exe >nul 2>&1
if errorlevel 1 (
    echo No .NET processes found
) else (
    echo ✅ API server stopped
)

echo.
echo ✅ All servers stopped successfully!
echo.
pause
