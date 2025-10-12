# Test on port 5001 with logging
$apiUrl = "http://127.0.0.1:5001"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Testing on Port 5001" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "[Step 1] Creating proof..." -ForegroundColor Yellow
$body = @{ Url = "https://youtu.be/NH2_-4iZEn8" } | ConvertTo-Json
$create = Invoke-RestMethod -Uri "$apiUrl/v1/proofs/url" -Method POST -Body $body -ContentType "application/json"
Write-Host "[SUCCESS] Created proof:" -ForegroundColor Green
Write-Host "  TrustmarkId: $($create.trustmarkId)" -ForegroundColor White
Write-Host "  ProofId: $($create.proofId)" -ForegroundColor White

Write-Host "`n[Step 2] Waiting 2 seconds..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

Write-Host "`n[Step 3] Verifying proof..." -ForegroundColor Yellow
try {
    $verify = Invoke-RestMethod -Uri "$apiUrl/v1/proofs/verify/$($create.trustmarkId)" -Method GET
    Write-Host "[SUCCESS] Proof verified!" -ForegroundColor Green
    Write-Host ($verify | ConvertTo-Json -Depth 3) -ForegroundColor Gray
}
catch {
    Write-Host "[FAILED] Verification failed: $_" -ForegroundColor Red
}

Write-Host "`n[Step 4] Checking Docker logs..." -ForegroundColor Yellow
$logs = docker logs api-api-1 --tail 30 2>&1

if ($logs -match "InsertAsync called") {
    Write-Host "[FOUND] InsertAsync logging!" -ForegroundColor Green
}
else {
    Write-Host "[NOT FOUND] InsertAsync logging" -ForegroundColor Red
}

if ($logs -match "GetByTrustmarkIdAsync called") {
    Write-Host "[FOUND] GetByTrustmarkIdAsync logging!" -ForegroundColor Green
}
else {
    Write-Host "[NOT FOUND] GetByTrustmarkIdAsync logging" -ForegroundColor Red
}

if ($logs -match "POST") {
    Write-Host "[FOUND] POST request logged!" -ForegroundColor Green
}
else {
    Write-Host "[NOT FOUND] POST request" -ForegroundColor Red
}

Write-Host "`n[Last 15 Docker log lines]:" -ForegroundColor Cyan
$logs | Select-Object -Last 15 | ForEach-Object { Write-Host "  $_" }

Write-Host "`n========================================`n" -ForegroundColor Cyan


