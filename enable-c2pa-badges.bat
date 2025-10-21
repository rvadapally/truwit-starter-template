@echo off
echo Switching YouTube verification to full_video mode for C2PA badges...

curl -X PUT "https://truwit-starter-template-production.up.railway.app/api/v1/admin/settings/YOUTUBE_VERIFICATION_MODE" ^
  -H "Content-Type: application/json" ^
  -d "{\"value\": \"full_video\", \"updatedBy\": \"admin\"}"

echo.
echo ✅ YouTube verification mode changed to 'full_video'
echo.
echo Now when you verify YouTube videos, you'll get:
echo - 🟢 Green badges with "✓ Signed & Verified" (if C2PA found)
echo - 🔵 Blue badges with "Verified by Truwit" (if no C2PA)
echo.
echo Note: Full video mode is slower but provides C2PA verification
