# Test idempotency - create same proof twice
$apiUrl = "http://127.0.0.1:5001"
$testUrl = "https://youtu.be/NH2_-4iZEn8"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  IDEMPOTENCY TEST" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "[Step 1] Creating FIRST proof for URL..." -ForegroundColor Yellow
Write-Host "URL: $testUrl`n" -ForegroundColor Gray

$body1 = @{ Url = $testUrl } | ConvertTo-Json
$proof1 = Invoke-RestMethod -Uri "$apiUrl/v1/proofs/url" -Method POST -Body $body1 -ContentType "application/json" -TimeoutSec 120

Write-Host "First Proof Response:" -ForegroundColor Green
Write-Host "  ProofId:      $($proof1.proofId)" -ForegroundColor White
Write-Host "  TrustmarkId:  $($proof1.trustmarkId)" -ForegroundColor White
Write-Host "  Deduped:      $($proof1.deduped)" -ForegroundColor White
Write-Host ""

Write-Host "[Step 2] Waiting 3 seconds..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host "`n[Step 3] Creating SECOND proof for SAME URL..." -ForegroundColor Yellow
Write-Host "URL: $testUrl`n" -ForegroundColor Gray

$body2 = @{ Url = $testUrl } | ConvertTo-Json
$proof2 = Invoke-RestMethod -Uri "$apiUrl/v1/proofs/url" -Method POST -Body $body2 -ContentType "application/json" -TimeoutSec 120

Write-Host "Second Proof Response:" -ForegroundColor Green
Write-Host "  ProofId:      $($proof2.proofId)" -ForegroundColor White
Write-Host "  TrustmarkId:  $($proof2.trustmarkId)" -ForegroundColor White
Write-Host "  Deduped:      $($proof2.deduped)" -ForegroundColor White
Write-Host ""

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  IDEMPOTENCY CHECK" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($proof1.proofId -eq $proof2.proofId) {
    Write-Host "[PASS] ProofIds match! $($proof1.proofId)" -ForegroundColor Green
} else {
    Write-Host "[FAIL] ProofIds are DIFFERENT!" -ForegroundColor Red
    Write-Host "  First:  $($proof1.proofId)" -ForegroundColor Red
    Write-Host "  Second: $($proof2.proofId)" -ForegroundColor Red
}

if ($proof1.trustmarkId -eq $proof2.trustmarkId) {
    Write-Host "[PASS] TrustmarkIds match! $($proof1.trustmarkId)" -ForegroundColor Green
} else {
    Write-Host "[FAIL] TrustmarkIds are DIFFERENT!" -ForegroundColor Red
    Write-Host "  First:  $($proof1.trustmarkId)" -ForegroundColor Red
    Write-Host "  Second: $($proof2.trustmarkId)" -ForegroundColor Red
}

if ($proof2.deduped -eq $true) {
    Write-Host "[PASS] Second request was marked as deduped!" -ForegroundColor Green
} else {
    Write-Host "[WARN] Second request was NOT marked as deduped (deduped=$($proof2.deduped))" -ForegroundColor Yellow
}

Write-Host "`n[Step 4] Checking database..." -ForegroundColor Yellow
Write-Host "Looking for proofs in LinkIndex table...`n" -ForegroundColor Gray

# Check Docker logs for database operations
$logs = docker logs api-api-1 --tail 50 2>&1
$insertLogs = $logs | Select-String "InsertAsync"
$getLogs = $logs | Select-String "GetByTrustmarkIdAsync"
$linkIndexLogs = $logs | Select-String -Pattern "LinkIndex|Idempotency|dedup" -CaseSensitive:$false

Write-Host "Recent database operations:" -ForegroundColor Gray
if ($insertLogs) {
    Write-Host "  Insert operations: $($insertLogs.Count)" -ForegroundColor White
}
if ($getLogs) {
    Write-Host "  Get operations: $($getLogs.Count)" -ForegroundColor White
}
if ($linkIndexLogs) {
    Write-Host "`nDeduplication logs:" -ForegroundColor Cyan
    $linkIndexLogs | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
}

Write-Host "`n========================================`n" -ForegroundColor Cyan

