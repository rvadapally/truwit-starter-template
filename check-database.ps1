# Check what's in the database
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  DATABASE CONTENTS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Checking Proofs table..." -ForegroundColor Yellow
docker exec api-api-1 sh -c "sqlite3 /app/truwit.db 'SELECT Id, TrustmarkId, CreatedAt FROM Proofs ORDER BY CreatedAt DESC LIMIT 10;'" 2>&1

Write-Host "`nChecking LinkIndex table (for deduplication)..." -ForegroundColor Yellow
docker exec api-api-1 sh -c "sqlite3 /app/truwit.db 'SELECT Platform, CanonicalId, ProofId, CreatedAt FROM LinkIndex ORDER BY CreatedAt DESC LIMIT 10;'" 2>&1

Write-Host "`nChecking IdempotencyRecords table..." -ForegroundColor Yellow
docker exec api-api-1 sh -c "sqlite3 /app/truwit.db 'SELECT IdempotencyKey, ProofId, CreatedAt FROM IdempotencyRecords ORDER BY CreatedAt DESC LIMIT 10;'" 2>&1

Write-Host "`nCount of proofs by TrustmarkId..." -ForegroundColor Yellow
docker exec api-api-1 sh -c "sqlite3 /app/truwit.db 'SELECT TrustmarkId, COUNT(*) as count FROM Proofs GROUP BY TrustmarkId HAVING count > 1;'" 2>&1

Write-Host "`n========================================`n" -ForegroundColor Cyan

