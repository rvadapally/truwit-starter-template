# Test the verify endpoint and check logs
$apiUrl = "http://localhost:5000"
$testUrl = "https://youtu.be/NH2_-4iZEn8"

Write-Host "Creating proof..." -ForegroundColor Cyan
$createBody = @{ Url = $testUrl } | ConvertTo-Json
$createResponse = Invoke-RestMethod -Uri "$apiUrl/v1/proofs/url" -Method POST -Body $createBody -ContentType "application/json" -TimeoutSec 120

$proofId = $createResponse.proofId
$trustmarkId = $createResponse.trustmarkId

Write-Host "ProofId: $proofId" -ForegroundColor Green
Write-Host "TrustmarkId: $trustmarkId" -ForegroundColor Green

Start-Sleep -Seconds 1

Write-Host "`nTesting verify endpoint..." -ForegroundColor Cyan
try {
    $verifyResponse = Invoke-RestMethod -Uri "$apiUrl/v1/proofs/verify/$trustmarkId" -Method GET -TimeoutSec 10
    Write-Host "SUCCESS!" -ForegroundColor Green
    $verifyResponse | ConvertTo-Json -Depth 2
}
catch {
    Write-Host "FAILED - Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    
    Write-Host "`nChecking Docker logs..." -ForegroundColor Yellow
    docker logs api-api-1 --tail 20
}

