$apiUrl = "http://localhost:5000"
$testUrl = "https://youtu.be/TEST-$(Get-Random)"

Write-Host "Step 1: Creating a unique proof..." -ForegroundColor Cyan
$createBody = @{ Url = $testUrl } | ConvertTo-Json
$createResponse = Invoke-RestMethod -Uri "$apiUrl/v1/proofs/url" -Method POST -Body $createBody -ContentType "application/json" -TimeoutSec 120

$trustmarkId = $createResponse.trustmarkId
Write-Host "Created TrustmarkId: $trustmarkId" -ForegroundColor Green

Write-Host "`nStep 2: Wait 3 seconds for database commit..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

Write-Host "`nStep 3: Try to retrieve it..." -ForegroundColor Cyan
try {
    $verifyResponse = Invoke-RestMethod -Uri "$apiUrl/v1/proofs/verify/$trustmarkId" -Method GET -TimeoutSec 10
    Write-Host "SUCCESS! Proof found!" -ForegroundColor Green
    Write-Host "ProofId: $($verifyResponse.proofId)"
}
catch {
    Write-Host "FAILED! 404 - Proof not found in database" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)"
    
    Write-Host "`nStep 4: Check if it's an old proof (from before latest code)..." -ForegroundColor Yellow
    Write-Host "Try with an older trustmarkId like '3aee4565' or 'F75lm0VR'"
}

Write-Host "`nStep 5: Checking Docker API logs..." -ForegroundColor Cyan
docker logs api-api-1 --tail 50 | Select-String -Pattern "verify|Trustmark|$trustmarkId"

