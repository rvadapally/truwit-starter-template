# Check where URLs are actually stored in the new C2PA system
# The URLs are NOT in VerificationRequests - they're in the new system tables

param(
    [string]$Host = "localhost",
    [string]$Database = "truwit", 
    [string]$Username = "postgres",
    [string]$Password = "password",
    [string]$Port = "5432"
)

$ConnectionString = "Host=$Host;Database=$Database;Username=$Username;Password=$Password;Port=$Port"

Write-Host "🔍 Finding Where Test URLs Are Actually Stored" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Try to find psql
$psqlCmd = $null
try {
    $null = Get-Command psql -ErrorAction Stop
    $psqlCmd = "psql"
} catch {
    # Try common PostgreSQL installation paths
    $commonPaths = @(
        "C:\Program Files\PostgreSQL\*\bin\psql.exe",
        "C:\Program Files (x86)\PostgreSQL\*\bin\psql.exe"
    )
    
    foreach ($path in $commonPaths) {
        $found = Get-ChildItem -Path $path -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($found) {
            $psqlCmd = $found.FullName
            break
        }
    }
}

if (-not $psqlCmd) {
    Write-Host "❌ PostgreSQL client not found. Here are the queries to run manually:" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔍 Check NEW C2PA System Tables:" -ForegroundColor Yellow
    Write-Host "   SELECT * FROM \"LinkIndex\";" -ForegroundColor White
    Write-Host "   SELECT * FROM \"Receipts\";" -ForegroundColor White
    Write-Host "   SELECT * FROM \"Proofs\";" -ForegroundColor White
    Write-Host ""
    Write-Host "🔍 Extract URLs from Receipt JSON:" -ForegroundColor Yellow
    Write-Host "   SELECT \"Id\", \"ProofId\", \"Json\"->>'url' as \"OriginalUrl\" FROM \"Receipts\" WHERE \"Json\" ? 'url';" -ForegroundColor White
    Write-Host ""
    Write-Host "🔍 Check Canonical Mappings:" -ForegroundColor Yellow
    Write-Host "   SELECT \"Platform\", \"CanonicalId\", \"ProofId\" FROM \"LinkIndex\";" -ForegroundColor White
    exit 1
}

Write-Host "✅ Using PostgreSQL client: $psqlCmd" -ForegroundColor Green
Write-Host ""

# Function to run query
function Run-Query {
    param([string]$Query, [string]$Description)
    
    Write-Host "📊 $Description" -ForegroundColor Green
    Write-Host "Query: $Query" -ForegroundColor Gray
    Write-Host "----------------------------------------" -ForegroundColor Gray
    
    try {
        $result = & $psqlCmd -c "$Query" "$ConnectionString" 2>&1
        
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

# Check the NEW C2PA system tables where URLs are actually stored
Write-Host "🎯 The URLs are in the NEW C2PA system, NOT VerificationRequests!" -ForegroundColor Yellow
Write-Host ""

Run-Query "SELECT * FROM \"LinkIndex\";" "Canonical URL Mappings (Platform + CanonicalId)"

Run-Query "SELECT \"Id\", \"ProofId\", \"Json\"->>'url' as \"OriginalUrl\", \"CreatedAt\" FROM \"Receipts\" WHERE \"Json\" ? 'url';" "Original URLs in Receipt JSON"

Run-Query "SELECT \"Id\", \"TrustmarkId\", \"CreatedAt\" FROM \"Proofs\" ORDER BY \"CreatedAt\" DESC LIMIT 5;" "Recent Proofs Created"

Run-Query "SELECT \"Platform\", \"CanonicalId\", \"ProofId\", \"CreatedAt\" FROM \"LinkIndex\" ORDER BY \"CreatedAt\" DESC;" "Recent Canonical Mappings"

# Check if VerificationRequests has ANY URL entries
Run-Query "SELECT COUNT(*) as \"LegacyUrlCount\" FROM \"VerificationRequests\" WHERE \"Url\" IS NOT NULL;" "Legacy System URL Count"

# Show the difference between old and new systems
Write-Host "💡 EXPLANATION:" -ForegroundColor Cyan
Write-Host "   - OLD system: URLs stored in VerificationRequests.Url" -ForegroundColor White
Write-Host "   - NEW system: URLs stored in LinkIndex + Receipts.Json" -ForegroundColor White
Write-Host "   - The /v1/proofs/url endpoint uses the NEW system" -ForegroundColor White
Write-Host "   - That's why VerificationRequests shows 0 results!" -ForegroundColor White

