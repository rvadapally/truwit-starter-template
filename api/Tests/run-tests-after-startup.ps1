# Wait for API to start, then run tests
param(
    [int]$WaitSeconds = 10,
    [string]$ApiUrl = "http://localhost:5000"
)

Write-Host "Waiting $WaitSeconds seconds for API to start..." -ForegroundColor Yellow

Start-Sleep -Seconds $WaitSeconds

Write-Host "Testing API health..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "$ApiUrl/health" -Method Get -ErrorAction Stop
    Write-Host "API is ready!" -ForegroundColor Green
    
    Write-Host "`nStarting integration tests..." -ForegroundColor Cyan
    & "$PSScriptRoot\test-multisign-flow.ps1" -ApiUrl $ApiUrl -Verbose
}
catch {
    Write-Host "API is not ready yet. Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please check that the API is running at: $ApiUrl" -ForegroundColor Yellow
    exit 1
}

