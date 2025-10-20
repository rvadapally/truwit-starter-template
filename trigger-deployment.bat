@echo off
echo ========================================
echo    Triggering Deployment
echo ========================================
echo.

echo [1/3] Adding changes to git...
git add .

echo [2/3] Committing changes...
git commit -m "Fix badge loading issue - use correct API endpoint /v1/badge/{id}.svg"

echo [3/3] Pushing to trigger builds...
git push origin main

echo.
echo ========================================
echo    Deployment Triggered!
echo ========================================
echo.
echo 🚀 Railway build should start automatically
echo 🌐 Cloudflare Pages build should start automatically
echo.
echo Check the GitHub Actions tab for build progress:
echo https://github.com/[your-repo]/actions
echo.
pause
