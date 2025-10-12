@echo off
echo ========================================
echo    Starting Truwit Verification App
echo      (Docker + Angular Development)
echo ========================================
echo.

REM Check if we're in the right directory
if not exist "api\HumanProof.Api.csproj" (
    echo ERROR: Please run this script from the humanproof-starter root directory
    echo Current directory: %CD%
    pause
    exit /b 1
)

echo [1/5] Checking prerequisites...
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker not found. Please install Docker Desktop
    echo Download from: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running. Please start Docker Desktop
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

echo [2/5] Cleaning up existing services...
REM Clean up any existing Docker containers
cd api
docker-compose down >nul 2>&1
cd ..

REM Clean up Angular processes on port 4200
netstat -ano | findstr :4200 >nul 2>&1
if not errorlevel 1 (
    echo Stopping process on port 4200...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :4200') do taskkill /f /pid %%a >nul 2>&1
)

echo ✅ Cleanup completed
echo.

echo [3/5] Installing Angular dependencies...
cd app
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install Angular dependencies
    cd ..
    pause
    exit /b 1
)
cd ..
echo ✅ Angular dependencies installed
echo.

echo [4/5] Starting API in Docker (Linux environment)...
cd api
start "Truwit API (Docker)" cmd /k "echo Starting API in Docker container... && echo. && docker-compose up --build"
cd ..
echo ✅ API container starting on http://localhost:5001
echo ⏳ Waiting for API to be ready (15 seconds)...
timeout /t 15 /nobreak >nul
echo.

echo [5/5] Starting Angular development server...
start "Truwit Angular" cmd /k "cd app && echo Starting Angular app... && echo. && npm start"
echo ✅ Angular app starting on http://localhost:4200
echo ⏳ Waiting for Angular to be ready (10 seconds)...
timeout /t 10 /nobreak >nul
echo.

echo ========================================
echo    Servers are running!
echo ========================================
echo.
echo 🌐 Frontend:     http://localhost:4200
echo 🔧 API:          http://localhost:5001
echo ❤️  Health:       http://localhost:5001/health
echo 📋 Docker Logs:  docker-compose -f api\docker-compose.yml logs -f
echo.
echo 🐳 API running in Docker (same as production!)
echo.
echo Press any key to run automated tests...
pause >nul

echo.
echo Running comprehensive automated tests...
powershell -ExecutionPolicy Bypass -File test-comprehensive.ps1 -Environment local
echo.

pause
