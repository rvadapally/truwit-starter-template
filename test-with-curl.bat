@echo off
echo.
echo ========================================
echo   Testing with CURL (bypassing PowerShell)
echo ========================================
echo.

echo [Step 1] Creating proof with curl...
curl -X POST http://127.0.0.1:5001/v1/proofs/url ^
  -H "Content-Type: application/json" ^
  -d "{\"Url\":\"https://youtu.be/CURL_TEST_%RANDOM%\"}" ^
  -w "\nHTTP Status: %%{http_code}\n"

echo.
echo.
echo [Step 2] Checking Docker logs immediately...
docker logs api-api-1 --tail 20

echo.
echo ========================================

