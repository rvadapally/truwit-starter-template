# Detailed debug script
$apiUrl = "http://localhost:5000"
$testUrl = "https://youtu.be/NH2_-4iZEn8"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  DETAILED DEBUG" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "[Step 1] Check API Health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$apiUrl/health" -Method GET
    Write-Host "[PASS] API is healthy" -ForegroundColor Green
    Write-Host "Health: $($health | ConvertTo-Json -Compress)" -ForegroundColor Gray
}
catch {
    Write-Host "[FAIL] API health check failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n[Step 2] Creating proof..." -ForegroundColor Yellow
$createBody = @{ Url = $testUrl } | ConvertTo-Json
Write-Host "Request body: $createBody" -ForegroundColor Gray

try {
    $createResponse = Invoke-RestMethod -Uri "$apiUrl/v1/proofs/url" -Method POST -Body $createBody -ContentType "application/json" -TimeoutSec 120
    Write-Host "[PASS] Proof created successfully!" -ForegroundColor Green
    Write-Host "Full response: $($createResponse | ConvertTo-Json -Depth 5)" -ForegroundColor Magenta
    $trustmarkId = $createResponse.trustmarkId
    $proofId = $createResponse.proofId
    Write-Host "`nTrustmarkId: $trustmarkId" -ForegroundColor Cyan
    Write-Host "ProofId: $proofId" -ForegroundColor Cyan
}
catch {
    Write-Host "[FAIL] Proof creation failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n[Step 3] Waiting 2 seconds..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

Write-Host "`n[Step 4] Trying to verify with TrustmarkId: $trustmarkId..." -ForegroundColor Yellow
try {
    $verifyResponse = Invoke-RestMethod -Uri "$apiUrl/v1/proofs/verify/$trustmarkId" -Method GET -TimeoutSec 10
    Write-Host "[PASS] Verify succeeded!" -ForegroundColor Green
    Write-Host "Full response: $($verifyResponse | ConvertTo-Json -Depth 5)" -ForegroundColor Magenta
}
catch {
    Write-Host "[FAIL] Verify failed with status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host "`n[Step 5] Checking Docker logs for our logging messages..." -ForegroundColor Yellow
$logs = docker logs api-api-1 --tail 100 2>&1 | Out-String
if ($logs -match "InsertAsync called") {
    Write-Host "[FOUND] InsertAsync log message" -ForegroundColor Green
}
else {
    Write-Host "[NOT FOUND] InsertAsync log message - NO REQUESTS ARE BEING LOGGED!" -ForegroundColor Red
}

if ($logs -match "GetByTrustmarkIdAsync called") {
    Write-Host "[FOUND] GetByTrustmarkIdAsync log message" -ForegroundColor Green
}
else {
    Write-Host "[NOT FOUND] GetByTrustmarkIdAsync log message" -ForegroundColor Red
}

if ($logs -match "POST /v1/proofs/url") {
    Write-Host "[FOUND] POST request log" -ForegroundColor Green
}
else {
    Write-Host "[NOT FOUND] POST request log - Request not reaching API!" -ForegroundColor Red
}

Write-Host "`n[Step 6] Last 20 lines of Docker logs:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Gray
docker logs api-api-1 --tail 20
Write-Host "========================================" -ForegroundColor Gray

Write-Host "`nDEBUG COMPLETE`n" -ForegroundColor Cyan

