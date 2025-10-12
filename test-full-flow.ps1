$apiUrl = "http://localhost:5000"
$testUrl = "https://youtu.be/NH2_-4iZEn8"

Write-Host "Step 1: Creating proof..." -ForegroundColor Cyan

try {
    $createBody = @{ Url = $testUrl } | ConvertTo-Json
    $createResponse = Invoke-RestMethod -Uri "$apiUrl/v1/proofs/url" -Method POST -Body $createBody -ContentType "application/json" -TimeoutSec 120
    
    Write-Host "SUCCESS! Proof created" -ForegroundColor Green
    Write-Host "ProofId: $($createResponse.proofId)"
    Write-Host "TrustmarkId: $($createResponse.trustmarkId)"
    Write-Host "VerifyUrl: $($createResponse.verifyUrl)"
    
    $trustmarkId = $createResponse.trustmarkId
    
    Write-Host "`nStep 2: Verifying proof with trustmarkId: $trustmarkId..." -ForegroundColor Cyan
    Start-Sleep -Seconds 2
    
    try {
        $verifyResponse = Invoke-RestMethod -Uri "$apiUrl/v1/proofs/verify/$trustmarkId" -Method GET -TimeoutSec 10
        Write-Host "SUCCESS! Proof verified" -ForegroundColor Green
        Write-Host "Verify Response:"
        $verifyResponse | ConvertTo-Json -Depth 3
        
        Write-Host "`n====================" -ForegroundColor Yellow
        Write-Host "FRONTEND URL TO TEST:" -ForegroundColor Yellow
        Write-Host "http://localhost:4200/#/t/$trustmarkId" -ForegroundColor Yellow
        Write-Host "====================" -ForegroundColor Yellow
    }
    catch {
        Write-Host "FAILED! Cannot verify proof" -ForegroundColor Red
        Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)"
        Write-Host "Error: $($_.Exception.Message)"
    }
}
catch {
    Write-Host "FAILED! Cannot create proof" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)"
}

