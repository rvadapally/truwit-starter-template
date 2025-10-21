@echo off
REM Quick Post-Deploy Validation Script for Windows
REM Run this after every deployment to catch critical issues

echo [VALIDATION] TruWit Post-Deploy Validation
echo ==========================================

echo.
echo [ASSETS] Checking Critical Assets...

REM Check Astro assets
if exist "public\logo.svg" (
    echo [OK] public\logo.svg exists
) else (
    echo [ERROR] public\logo.svg missing
)

if exist "public\images\verified-circular-badge.jpg" (
    echo [OK] public\images\verified-circular-badge.jpg exists
) else (
    echo [ERROR] public\images\verified-circular-badge.jpg missing
)

REM Check Angular assets
if exist "app\src\assets\logo.svg" (
    echo [OK] app\src\assets\logo.svg exists
) else (
    echo [ERROR] app\src\assets\logo.svg missing
)

if exist "app\src\assets\verified-circular-badge.jpg" (
    echo [OK] app\src\assets\verified-circular-badge.jpg exists
) else (
    echo [ERROR] app\src\assets\verified-circular-badge.jpg missing
)

echo.
echo [BUILD] Checking Build Status...

REM Check if builds work
if exist "dist" (
    echo [OK] Astro dist folder exists
) else (
    echo [WARNING] Astro dist folder missing - run 'npm run build'
)

if exist "app\dist" (
    echo [OK] Angular dist folder exists
) else (
    echo [WARNING] Angular dist folder missing - run 'cd app && npm run build'
)

echo.
echo [COMPONENTS] Component Integration Check...

REM Check if all Astro pages use Header component
set pages=about contact how-it-works investors pricing technology use-cases
for %%p in (%pages%) do (
    findstr /C:"import Header from" "src\pages\%%p.astro" >nul
    if !errorlevel! equ 0 (
        echo [OK] %%p.astro uses Header component
    ) else (
        echo [ERROR] %%p.astro still uses old Nav component
    )
)

echo.
echo [THEME] Theme Variables Check...

findstr /C:"theme-variables.css" "src\styles\global.css" >nul
if !errorlevel! equ 0 (
    echo [OK] Theme variables imported in global.css
) else (
    echo [ERROR] Theme variables not imported in global.css
)

echo.
echo [HOMEPAGE] Homepage Content Check...

findstr /C:"home-hero" "src\pages\index.astro" >nul
if !errorlevel! equ 0 (
    echo [ERROR] Homepage still has old hero content
) else (
    echo [OK] Homepage cleaned up (no old hero)
)

echo.
echo [PATHS] Asset Path Check...

REM Check Astro components
findstr /C:"src=\"/logo.svg\"" "src\components\Logo.astro" >nul
if !errorlevel! equ 0 (
    echo [OK] Astro Logo uses correct path
) else (
    echo [ERROR] Astro Logo uses wrong path
)

findstr /C:"src=\"/images/verified-circular-badge.jpg\"" "src\components\Footer.astro" >nul
if !errorlevel! equ 0 (
    echo [OK] Astro Footer uses correct path
) else (
    echo [ERROR] Astro Footer uses wrong path
)

REM Check Angular components
findstr /C:"src=\"assets/logo.svg\"" "app\src\app\shared\components\logo\logo.component.ts" >nul
if !errorlevel! equ 0 (
    echo [OK] Angular Logo uses correct path
) else (
    echo [ERROR] Angular Logo uses wrong path
)

findstr /C:"src=\"assets/verified-circular-badge.jpg\"" "app\src\app\layout\footer\footer.component.ts" >nul
if !errorlevel! equ 0 (
    echo [OK] Angular Footer uses correct path
) else (
    echo [ERROR] Angular Footer uses wrong path
)

echo.
echo [SUMMARY] Validation Complete
echo ============================
echo Run this script after every deployment to catch issues early.
echo If any checks fail, fix them before considering deployment successful.
echo.
echo For detailed validation, see POST-DEPLOY-CHECKLIST.md
echo For automated testing, run: run-comprehensive-e2e-tests.bat
