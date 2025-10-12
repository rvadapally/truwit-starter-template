# Test script that creates a proof and checks logs
$apiUrl = "http://localhost:5000"
$testUrl = "https://youtu.be/NH2_-4iZEn8"

Write-Host "========================================" -ForegroundColor Magenta
Write-Host "  Testing API with Detailed Logging" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta

Write-Host "`nStep 1: Creating proof..." -ForegroundColor Cyan
$createBody = @{ Url = $testUrl } | ConvertTo-Json
$createResponse = Invoke-RestMethod -Uri "$apiUrl/v1/proofs/url" -Method POST -Body $createBody -ContentType "application/json" -TimeoutSec 120

$trustmarkId = $createResponse.trustmarkId
Write-Host "✅ Created TrustmarkId: $trustmarkId" -ForegroundColor Green

Write-Host "`nStep 2: Waiting 2 seconds..." -ForegroundColor Cyan
Start-Sleep -Seconds 2

Write-Host "`nStep 3: Trying to verify..." -ForegroundColor Cyan
try {
    $verifyResponse = Invoke-RestMethod -Uri "$apiUrl/v1/proofs/verify/$trustmarkId" -Method GET -TimeoutSec 10
    Write-Host "✅ SUCCESS! Proof verified!" -ForegroundColor Green
}
catch {
    Write-Host "❌ FAILED! Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
}

Write-Host "`nStep 4: Docker API Logs (last 30 lines):" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
docker logs api-api-1 --tail 30

Write-Host "`n========================================" -ForegroundColor Magenta
Write-Host "Look for:" -ForegroundColor Cyan
Write-Host "  💾 InsertAsync called" -ForegroundColor White
Write-Host "  🔍 GetByTrustmarkIdAsync called" -ForegroundColor White
Write-Host "  📊 Total proofs in database" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Magenta

