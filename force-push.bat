@echo off
echo ========================================
echo    FORCE PUSH TO TRIGGER BUILDS
echo ========================================
echo.

echo Checking git status...
git status

echo.
echo Adding all changes...
git add .

echo.
echo Committing changes...
git commit -m "Fix badge loading issue and GitHub Actions workflow"

echo.
echo Pushing to main branch...
git push origin main

echo.
echo ========================================
echo    CHECK BUILD STATUS
echo ========================================
echo.
echo 1. Railway Dashboard: https://railway.app/dashboard
echo 2. Cloudflare Pages: https://dash.cloudflare.com/pages
echo 3. GitHub Actions: https://github.com/rvadapally/truwit-starter-template/actions
echo.
pause
