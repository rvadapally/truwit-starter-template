# PostgreSQL Connection Helper Script
# This script helps you connect to PostgreSQL and run URL queries

param(
    [string]$Host = "localhost",
    [string]$Database = "truwit",
    [string]$Username = "postgres",
    [string]$Password = "password",
    [string]$Port = "5432"
)

$ConnectionString = "Host=$Host;Database=$Database;Username=$Username;Password=$Password;Port=$Port"

Write-Host "🐘 PostgreSQL Connection Helper" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Connection Details:" -ForegroundColor Yellow
Write-Host "  Host: $Host" -ForegroundColor White
Write-Host "  Database: $Database" -ForegroundColor White
Write-Host "  Username: $Username" -ForegroundColor White
Write-Host "  Port: $Port" -ForegroundColor White
Write-Host ""

# Test connection
Write-Host "🔍 Testing connection..." -ForegroundColor Green
try {
    $testQuery = "SELECT version();"
    $result = psql -c "$testQuery" "$ConnectionString" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Connection successful!" -ForegroundColor Green
        Write-Host $result -ForegroundColor White
    } else {
        Write-Host "❌ Connection failed: $result" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Connection error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📊 Quick URL Queries:" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan

# Quick queries
$queries = @(
    @{
        Name = "Legacy URLs Count"
        Query = "SELECT COUNT(*) as count FROM \"VerificationRequests\" WHERE \"Url\" IS NOT NULL;"
    },
    @{
        Name = "Canonical Mappings Count"
        Query = "SELECT COUNT(*) as count FROM \"LinkIndex\";"
    },
    @{
        Name = "Receipts with URLs Count"
        Query = "SELECT COUNT(*) as count FROM \"Receipts\" WHERE \"Json\" ? 'url';"
    },
    @{
        Name = "Recent Legacy URLs (Top 5)"
        Query = "SELECT \"Url\", \"CreatedAt\" FROM \"VerificationRequests\" WHERE \"Url\" IS NOT NULL ORDER BY \"CreatedAt\" DESC LIMIT 5;"
    },
    @{
        Name = "Recent Canonical Mappings (Top 5)"
        Query = "SELECT \"Platform\", \"CanonicalId\", \"CreatedAt\" FROM \"LinkIndex\" ORDER BY \"CreatedAt\" DESC LIMIT 5;"
    }
)

foreach ($queryInfo in $queries) {
    Write-Host ""
    Write-Host "🔍 $($queryInfo.Name)" -ForegroundColor Green
    Write-Host "Query: $($queryInfo.Query)" -ForegroundColor Gray
    Write-Host "----------------------------------------" -ForegroundColor Gray
    
    try {
        $result = psql -c "$($queryInfo.Query)" "$ConnectionString" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host $result -ForegroundColor White
        } else {
            Write-Host "❌ Error: $result" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "💡 Useful Commands:" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Connect to database:" -ForegroundColor Yellow
Write-Host "  psql \"$ConnectionString\"" -ForegroundColor White
Write-Host ""
Write-Host "Run a single query:" -ForegroundColor Yellow
Write-Host "  psql -c \"SELECT * FROM \\\"VerificationRequests\\\" WHERE \\\"Url\\\" IS NOT NULL;\" \"$ConnectionString\"" -ForegroundColor White
Write-Host ""
Write-Host "Run queries from file:" -ForegroundColor Yellow
Write-Host "  psql -f check_urls.sql \"$ConnectionString\"" -ForegroundColor White
Write-Host ""
Write-Host "Export results to CSV:" -ForegroundColor Yellow
Write-Host "  psql -c \"\\copy (SELECT * FROM \\\"VerificationRequests\\\" WHERE \\\"Url\\\" IS NOT NULL) TO 'urls.csv' WITH CSV HEADER;\" \"$ConnectionString\"" -ForegroundColor White

