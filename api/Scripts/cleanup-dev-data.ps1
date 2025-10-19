# =====================================================================
# TruWit Dev Database Cleanup Script (PowerShell)
# Purpose: Remove all test proof data before implementing TW- prefix
# WARNING: This will delete all proofs, assets, receipts, and links
# Only run in development/testing environments!
# =====================================================================

$ErrorActionPreference = "Stop"

Write-Host "🧹 TruWit Database Cleanup Script" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check if running from api directory
if (-not (Test-Path "truwit.db")) {
    Write-Host "❌ Error: truwit.db not found. Please run from api/ directory." -ForegroundColor Red
    exit 1
}

# Confirm cleanup
Write-Host "⚠️  WARNING: This will delete ALL proof records from the database!" -ForegroundColor Yellow
Write-Host ""
$confirm = Read-Host "Type 'DELETE' to confirm cleanup (or press Enter to cancel)"

if ($confirm -ne "DELETE") {
    Write-Host "❌ Cleanup cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "🗑️  Running cleanup..." -ForegroundColor Cyan

# Execute cleanup SQL
$sqlScript = Get-Content "Scripts/cleanup-dev-data.sql" -Raw
$output = sqlite3 truwit.db $sqlScript

Write-Host $output
Write-Host ""
Write-Host "✅ Cleanup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Update GenerateShortId() to use TW- prefix"
Write-Host "  2. Restart API"
Write-Host "  3. Create test proof to verify new format"
Write-Host ""

