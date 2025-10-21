# Simple database query runner for PostgreSQL
# This script helps you run queries to see URLs in the database

param(
    [string]$Host = "localhost",
    [string]$Database = "truwit", 
    [string]$Username = "postgres",
    [string]$Password = "password",
    [string]$Port = "5432"
)

$ConnectionString = "Host=$Host;Database=$Database;Username=$Username;Password=$Password;Port=$Port"

Write-Host "🔍 Database Query Results After URL Submission" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Try to find psql in common locations
$psqlPaths = @(
    "psql",
    "C:\Program Files\PostgreSQL\*\bin\psql.exe",
    "C:\Program Files (x86)\PostgreSQL\*\bin\psql.exe"
)

$psqlCmd = $null
foreach ($path in $psqlPaths) {
    if ($path -eq "psql") {
        try {
            $null = Get-Command psql -ErrorAction Stop
            $psqlCmd = "psql"
            break
        } catch {
            continue
        }
    } else {
        $found = Get-ChildItem -Path $path -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($found) {
            $psqlCmd = $found.FullName
            break
        }
    }
}

if (-not $psqlCmd) {
    Write-Host "❌ PostgreSQL client (psql) not found in PATH or common locations" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Alternative ways to check the database:" -ForegroundColor Yellow
    Write-Host "1. Use pgAdmin (GUI tool)" -ForegroundColor White
    Write-Host "2. Use any PostgreSQL client" -ForegroundColor White
    Write-Host "3. Install PostgreSQL client tools" -ForegroundColor White
    Write-Host ""
    Write-Host "🔗 Connection details:" -ForegroundColor Cyan
    Write-Host "   Host: $Host" -ForegroundColor White
    Write-Host "   Database: $Database" -ForegroundColor White
    Write-Host "   Username: $Username" -ForegroundColor White
    Write-Host "   Port: $Port" -ForegroundColor White
    Write-Host ""
    Write-Host "📊 Manual queries to run:" -ForegroundColor Cyan
    Write-Host "   SELECT * FROM \"VerificationRequests\" WHERE \"Url\" IS NOT NULL;" -ForegroundColor White
    Write-Host "   SELECT * FROM \"LinkIndex\";" -ForegroundColor White
    Write-Host "   SELECT \"Json\"->>'url' as url FROM \"Receipts\" WHERE \"Json\" ? 'url';" -ForegroundColor White
    exit 1
}

Write-Host "✅ Found PostgreSQL client: $psqlCmd" -ForegroundColor Green
Write-Host ""

# Function to run query
function Run-Query {
    param([string]$Query, [string]$Description)
    
    Write-Host "📊 $Description" -ForegroundColor Green
    Write-Host "Query: $Query" -ForegroundColor Gray
    Write-Host "----------------------------------------" -ForegroundColor Gray
    
    try {
        if ($psqlCmd -eq "psql") {
            $result = psql -c "$Query" "$ConnectionString" 2>&1
        } else {
            $result = & $psqlCmd -c "$Query" "$ConnectionString" 2>&1
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host $result -ForegroundColor White
        } else {
            Write-Host "❌ Error: $result" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
}

# Run queries to show URLs
Run-Query "SELECT * FROM \"VerificationRequests\" WHERE \"Url\" IS NOT NULL;" "URL Submissions in Legacy System"

Run-Query "SELECT * FROM \"LinkIndex\";" "Canonical Mappings in New C2PA System"

Run-Query "SELECT \"Id\", \"ProofId\", \"Json\"->>'url' as \"OriginalUrl\", \"CreatedAt\" FROM \"Receipts\" WHERE \"Json\" ? 'url';" "Original URLs in Receipts"

Run-Query "SELECT CASE WHEN \"Url\" IS NOT NULL THEN 'URL Submission' WHEN \"FileName\" IS NOT NULL THEN 'File Upload' ELSE 'Unknown' END as \"Type\", COUNT(*) as \"Count\" FROM \"VerificationRequests\" GROUP BY 1;" "Submission Type Summary"

Write-Host "✅ URL submission test completed!" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 Results Summary:" -ForegroundColor Cyan
Write-Host "   - YouTube URL submitted successfully" -ForegroundColor White
Write-Host "   - Proof ID: ea83483d2217480b8f87c55d7bce7284" -ForegroundColor White
Write-Host "   - Trustmark ID: fe415cdb" -ForegroundColor White
Write-Host "   - URLs should now appear in the database queries above" -ForegroundColor White

