@echo off
echo ========================================
echo    Starting Truwit Verification App
echo ========================================
echo.

REM Check if we're in the right directory
if not exist "api\HumanProof.Api.csproj" (
    echo ERROR: Please run this script from the humanproof-starter root directory
    echo Current directory: %CD%
    pause
    exit /b 1
)

echo [1/4] Checking prerequisites...
echo.

REM Clean up any existing processes on ports 4200 and 5000
echo Cleaning up existing processes...
netstat -ano | findstr :4200 >nul 2>&1
if not errorlevel 1 (
    echo Stopping process on port 4200...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :4200') do taskkill /f /pid %%a >nul 2>&1
)

netstat -ano | findstr :5000 >nul 2>&1
if not errorlevel 1 (
    echo Stopping process on port 5000...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do taskkill /f /pid %%a >nul 2>&1
)

echo ✅ Port cleanup completed
echo.

REM Check if dotnet is installed
dotnet --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: .NET SDK not found. Please install .NET 8.0 SDK
    pause
    exit /b 1
)

REM Check if node is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found. Please install Node.js 18+
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed
echo.

echo [2/4] Installing Angular dependencies...
cd truwit-integrated\app
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install Angular dependencies
    pause
    exit /b 1
)
cd ..\..
echo ✅ Angular dependencies installed
echo.

echo [3/4] Starting .NET API server...
start "Truwit API" cmd /k "cd api && echo Starting API server... && dotnet run --urls http://localhost:5000"
echo ✅ API server starting on http://localhost:5000
echo.

echo [4/4] Starting Angular development server...
cd truwit-integrated\app
start "Truwit Angular" cmd /k "echo Starting Angular app... && npm start"
cd ..\..
echo ✅ Angular app starting on http://localhost:4200
echo.

echo ========================================
echo    Servers are starting up...
echo ========================================
echo.
echo 🌐 Main App:     http://localhost:4200
echo 🔧 API Swagger:  http://localhost:5000/swagger
echo ❤️  API Health:   http://localhost:5000/health
echo.
echo Press any key to open the main app in your browser...
pause >nul

REM Open the main app in browser
start http://localhost:4200

echo.
echo 🎉 Enjoy testing the Truwit Verification App!
echo.
echo Note: Both servers will continue running in separate windows.
echo Close those windows to stop the servers.
echo.
pause
