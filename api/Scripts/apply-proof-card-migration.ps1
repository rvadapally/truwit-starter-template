# PowerShell script to apply PostgreSQL migration to Railway database
# This script connects to Railway PostgreSQL and runs the proof card migration

Write-Host "🔧 Applying PostgreSQL migration for proof card URLs..." -ForegroundColor Cyan

# Check if DATABASE_URL is set (Railway provides this)
if (-not $env:DATABASE_URL) {
    Write-Host "❌ DATABASE_URL environment variable not set" -ForegroundColor Red
    Write-Host "Please set DATABASE_URL to your Railway PostgreSQL connection string" -ForegroundColor Yellow
    Write-Host "Example: `$env:DATABASE_URL='postgresql://user:password@host:port/database'" -ForegroundColor Gray
    exit 1
}

# Run the migration using psql
Write-Host "📝 Executing migration: 2025-10-19_postgres_proof_card_urls.sql" -ForegroundColor Yellow

try {
    & psql $env:DATABASE_URL -f "Data/Migrations/2025-10-19_postgres_proof_card_urls.sql"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Migration applied successfully!" -ForegroundColor Green
        Write-Host "🎉 Proof card URL columns added to VerificationProofs table" -ForegroundColor Green
    } else {
        Write-Host "❌ Migration failed with exit code: $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error running migration: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
