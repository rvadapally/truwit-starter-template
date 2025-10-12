@echo off
echo ========================================
echo    Stopping Truwit Verification App
echo ========================================
echo.

echo [1/3] Stopping Angular development server...
taskkill /f /im node.exe >nul 2>&1
if errorlevel 1 (
    echo No Node.js processes found
) else (
    echo ✅ Angular server stopped
)
echo.

echo [2/3] Stopping Docker API containers...
cd api
docker-compose down >nul 2>&1
if errorlevel 1 (
    echo No Docker containers found
) else (
    echo ✅ Docker API container stopped
)
cd ..
echo.

echo [3/3] Cleaning up any remaining processes...
REM Kill any dotnet processes (in case running without Docker)
taskkill /f /im dotnet.exe >nul 2>&1

REM Clean up Docker resources (optional)
REM docker system prune -f >nul 2>&1

echo ✅ All servers stopped successfully!
echo.
echo To view stopped containers: docker ps -a
echo To remove all stopped containers: docker container prune
echo.
pause
