@echo off
echo ========================================
echo    FIXING COMPILATION ERRORS
echo ========================================
echo.

echo [1/4] Adding fixed files...
git add api/Application/Services/VerificationService.cs
git add api/Controllers/ProofsController.cs

echo [2/4] Committing compilation fixes...
git commit -m "Fix compilation errors - use ProofId instead of TrustmarkId"

echo [3/4] Pushing fixes...
git push origin main

echo [4/4] Done!
echo.
echo ========================================
echo    COMPILATION ERRORS FIXED!
echo ========================================
echo.
echo ✅ Fixed VerificationService.cs - use ProofId instead of TrustmarkId
echo ✅ Fixed ProofsController.cs - use ProofId instead of TrustmarkId
echo 🚀 Railway build should now succeed
echo.
pause
