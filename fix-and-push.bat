@echo off
echo ========================================
echo    Fixing GitHub Actions & Pushing
echo ========================================
echo.

echo [1/4] Adding all changes...
git add .

echo [2/4] Committing changes...
git commit -m "Fix GitHub Actions workflow and badge loading issue"

echo [3/4] Pushing to trigger builds...
git push origin main

echo [4/4] Done!
echo.
echo ========================================
echo    Builds Should Trigger Now!
echo ========================================
echo.
echo ✅ Fixed GitHub Actions workflow paths
echo ✅ Fixed badge loading issue
echo 🚀 Railway and Cloudflare builds should start
echo.
pause
