# Force a request and immediately check logs
Write-Host "`n[TEST] Making unique request with timestamp..." -ForegroundColor Cyan
$timestamp = Get-Date -Format "yyyy-MM-dd-HH-mm-ss-fff"
$uniqueUrl = "https://youtu.be/TEST_$timestamp"

try {
    $body = @{ Url = $uniqueUrl } | ConvertTo-Json
    Write-Host "Sending: $body" -ForegroundColor Gray
    
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:5000/v1/proofs/url" -Method POST -Body $body -ContentType "application/json" -ErrorAction Stop
    Write-Host "[SUCCESS] Got response:" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json) -ForegroundColor Gray
}
catch {
    Write-Host "[ERROR] $_" -ForegroundColor Red
}

Write-Host "`n[LOGS] Checking Docker logs for this request..." -ForegroundColor Cyan
Write-Host "Looking for: $uniqueUrl`n" -ForegroundColor Yellow

$logs = docker logs api-api-1 --tail 50 2>&1
if ($logs -match $timestamp -or $logs -match "TEST_") {
    Write-Host "[FOUND] Request logged in Docker!" -ForegroundColor Green
    $logs | Select-String -Pattern "POST", "$timestamp", "TEST_", "ERROR", "warn" | ForEach-Object { Write-Host $_ -ForegroundColor Yellow }
}
else {
    Write-Host "[NOT FOUND] Request NOT in Docker logs!" -ForegroundColor Red
    Write-Host "`nLast 10 log lines:" -ForegroundColor Gray
    $logs | Select-Object -Last 10 | ForEach-Object { Write-Host "  $_" }
}


