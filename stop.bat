@echo off
echo ========================================
echo    Stopping Truwit Verification App
echo ========================================
echo.

echo [1/4] Stopping Angular development server...
taskkill /f /im node.exe >nul 2>&1
if errorlevel 1 (
    echo No Node.js processes found
) else (
    echo ✅ Angular server stopped
)
echo.

echo [2/4] Stopping Docker API containers...
cd api
docker-compose down >nul 2>&1
if errorlevel 1 (
    echo No Docker containers found
) else (
    echo ✅ Docker API container stopped
)
cd ..
echo.

echo [3/4] Cleaning up any remaining processes...
REM Kill any dotnet processes (in case running without Docker)
taskkill /f /im dotnet.exe >nul 2>&1
echo.

echo [4/4] Closing console windows...
REM Close the Angular console window
taskkill /FI "WINDOWTITLE eq Truwit Angular*" /F >nul 2>&1
if errorlevel 1 (
    echo Angular console window not found
) else (
    echo ✅ Angular console window closed
)

REM Close the API (Docker) console window
taskkill /FI "WINDOWTITLE eq Truwit API (Docker)*" /F >nul 2>&1
if errorlevel 1 (
    echo API console window not found
) else (
    echo ✅ API console window closed
)
echo.

REM Clean up Docker resources (optional)
REM docker system prune -f >nul 2>&1

echo ========================================
echo    All servers stopped successfully!
echo ========================================
echo.
echo 💡 Tip: To view stopped containers: docker ps -a
echo 💡 Tip: To remove stopped containers: docker container prune
echo.
pause
