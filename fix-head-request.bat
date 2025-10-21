@echo off
echo Fixing HEAD request issue in DynamicBadgeComponent...

git add app/src/app/shared/components/dynamic-badge/dynamic-badge.component.ts
git commit -m "Fix: Change HEAD requests to GET requests for badge endpoint

- Badge endpoint only supports GET, not HEAD requests
- Changed loadBadge() and pollUntilAvailable() to use GET
- This fixes the 405 Method Not Allowed error
- Badge loading should now work properly"

git push origin main

echo.
echo ✅ Fix pushed! The badge loading should now work.
echo.
echo The issue was that the API badge endpoint only supports GET requests,
echo but the frontend was trying to use HEAD requests to check if badges exist.
echo Now it uses GET requests which are properly supported.
