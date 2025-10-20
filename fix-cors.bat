@echo off
echo ========================================
echo    FIXING CORS ISSUE
echo ========================================
echo.

echo [1/4] Adding CORS fix files...
git add api/Program.cs
git add api/appsettings.json

echo [2/4] Committing CORS fix...
git commit -m "Fix CORS: Add Cloudflare Pages domain to allowed origins"

echo [3/4] Pushing CORS fix...
git push origin main

echo [4/4] Done!
echo.
echo ========================================
echo    CORS ISSUE FIXED!
echo ========================================
echo.
echo ✅ Added https://6b7eb0da.truwit-starter-template.pages.dev to CORS
echo ✅ Added https://*.truwit-starter-template.pages.dev for future deployments
echo 🚀 Railway will rebuild and deploy the API with CORS fix
echo.
echo Once deployed, the badge loading should work!
echo.
pause
