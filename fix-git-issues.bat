@echo off
echo ========================================
echo    FIXING GIT ISSUES
echo ========================================
echo.

echo [1/6] Cleaning git cache for problematic files...
git rm -r --cached tools/ProofCardGen/.vs/ 2>nul
git rm -r --cached tools/ProofCardGen/bin/ 2>nul
git rm -r --cached tools/ProofCardGen/obj/ 2>nul

echo [2/6] Adding updated .gitignore...
git add .gitignore

echo [3/6] Adding only essential files...
git add app/
git add api/
git add .github/
git add .cursorrules

echo [4/6] Checking status...
git status --porcelain

echo [5/6] Committing changes...
git commit -m "Fix badge loading issue and GitHub Actions workflow - Updated .gitignore"

echo [6/6] Pushing to main...
git push origin main

echo.
echo ========================================
echo    GIT ISSUES FIXED!
echo ========================================
echo.
echo ✅ Updated .gitignore to exclude Visual Studio files
echo ✅ Cleaned git cache
echo ✅ Committed only essential changes
echo ✅ Pushed to trigger builds
echo.
pause
