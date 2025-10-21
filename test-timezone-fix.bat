@echo off
setlocal

REM Test timezone fix - verify API returns proper UTC timestamps

echo Testing timezone fix...
echo Checking if API returns proper UTC timestamps with Z suffix

REM Test a specific proof endpoint
set PROOF_ID=TW-967F2CA5
set API_URL=https://truwit-starter-template-production.up.railway.app

echo Testing proof endpoint: %API_URL%/v1/proofs/%PROOF_ID%

REM Get the proof data and extract the IssuedAt timestamp
curl -s "%API_URL%/v1/proofs/%PROOF_ID%" > temp_response.json

REM Extract IssuedAt timestamp using PowerShell
for /f "tokens=*" %%i in ('powershell -Command "(Get-Content temp_response.json | ConvertFrom-Json).issuedAt"') do set ISSUED_AT=%%i

echo IssuedAt timestamp: %ISSUED_AT%

REM Check if timestamp ends with 'Z' (UTC indicator)
echo %ISSUED_AT% | findstr "Z" >nul
if %errorlevel% equ 0 (
    echo ✅ SUCCESS: Timestamp has UTC 'Z' suffix
) else (
    echo ❌ FAILED: Timestamp missing UTC 'Z' suffix
)

echo Raw response:
type temp_response.json

REM Clean up
del temp_response.json
