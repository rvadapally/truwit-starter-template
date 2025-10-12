# Test with real-time Docker logs
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  REAL-TIME LOG TEST" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "[INFO] Starting to follow Docker logs..." -ForegroundColor Yellow
Write-Host "[INFO] In another window, run: docker logs -f api-api-1" -ForegroundColor Yellow
Write-Host ""

# Start docker logs in background
$logJob = Start-Job -ScriptBlock {
    docker logs -f api-api-1 2>&1
}

Start-Sleep -Seconds 2

Write-Host "[Step 1] Making health check request..." -ForegroundColor Cyan
$health = Invoke-RestMethod -Uri "http://localhost:5000/health" -Method GET
Write-Host "Health check done: $($health.ok)" -ForegroundColor Green

Start-Sleep -Seconds 1

Write-Host "`n[Step 2] Creating proof..." -ForegroundColor Cyan
$body = @{ Url = "https://youtu.be/NH2_-4iZEn8" } | ConvertTo-Json
$create = Invoke-RestMethod -Uri "http://localhost:5000/v1/proofs/url" -Method POST -Body $body -ContentType "application/json"
Write-Host "Proof created: $($create.trustmarkId)" -ForegroundColor Green

Start-Sleep -Seconds 1

Write-Host "`n[Step 3] Getting logs from background job..." -ForegroundColor Cyan
$logs = Receive-Job -Job $logJob
Stop-Job -Job $logJob
Remove-Job -Job $logJob

Write-Host "`n========================================" -ForegroundColor Yellow
Write-Host "  DOCKER LOGS DURING TEST:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
if ($logs) {
    $logs | Select-Object -Last 30 | ForEach-Object { Write-Host $_ }
} else {
    Write-Host "[EMPTY - NO LOGS CAPTURED]" -ForegroundColor Red
}
Write-Host "========================================`n" -ForegroundColor Yellow

if ($logs -match "POST /v1/proofs/url" -or $logs -match "GET /health") {
    Write-Host "[SUCCESS] Docker container IS receiving requests!" -ForegroundColor Green
} else {
    Write-Host "[PROBLEM] Docker container is NOT receiving requests!" -ForegroundColor Red
    Write-Host "[INFO] Requests are going somewhere else (cached API? old process?)" -ForegroundColor Yellow
}


