# PowerShell script to check URLs in the database
# This script will run SQL queries to show where URLs are stored

param(
    [string]$ConnectionString = "Host=localhost;Database=truwit;Username=postgres;Password=password",
    [string]$ApiUrl = "http://localhost:5000"
)

Write-Host "🔍 Checking URLs in PostgreSQL Database..." -ForegroundColor Cyan
Write-Host "Connection: $ConnectionString" -ForegroundColor Yellow
Write-Host "API URL: $ApiUrl" -ForegroundColor Yellow
Write-Host ""

# Check if psql is available
try {
    $null = Get-Command psql -ErrorAction Stop
    Write-Host "✅ PostgreSQL client (psql) found" -ForegroundColor Green
} catch {
    Write-Host "❌ PostgreSQL client (psql) not found. Please install PostgreSQL client tools." -ForegroundColor Red
    Write-Host "You can also use pgAdmin or any PostgreSQL client to run the queries manually." -ForegroundColor Yellow
    exit 1
}

# Function to run SQL query and display results
function Invoke-SqlQuery {
    param([string]$Query, [string]$Description)
    
    Write-Host "📊 $Description" -ForegroundColor Green
    Write-Host "Query: $Query" -ForegroundColor Gray
    Write-Host "----------------------------------------" -ForegroundColor Gray
    
    try {
        # Use psql command line tool
        $result = psql -c "$Query" "$ConnectionString" 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host $result -ForegroundColor White
        } else {
            Write-Host "❌ Error running query: $result" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Error running query: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
}

# 1. Check Legacy URLs
Invoke-SqlQuery @"
SELECT 
    'Legacy URLs' as Type,
    COUNT(*) as Count
FROM "VerificationRequests" 
WHERE "Url" IS NOT NULL
"@ "Legacy System URLs Count"

# 2. Check Canonical Mappings
Invoke-SqlQuery @"
SELECT 
    'Canonical Mappings' as Type,
    COUNT(*) as Count
FROM "LinkIndex"
"@ "New C2PA System Canonical Mappings Count"

# 3. Check Receipts with URLs
Invoke-SqlQuery @"
SELECT 
    'Receipts with URLs' as Type,
    COUNT(*) as Count
FROM "Receipts"
WHERE "Json" LIKE '%"url"%'
"@ "Receipts Containing URLs Count"

# 4. Show actual Legacy URLs
Invoke-SqlQuery @"
SELECT 
    "Id",
    "Url",
    "FileName",
    "Status",
    "CreatedAt"
FROM "VerificationRequests" 
WHERE "Url" IS NOT NULL
ORDER BY "CreatedAt" DESC
LIMIT 10
"@ "Recent Legacy URLs (Last 10)"

# 5. Show Canonical Mappings
Invoke-SqlQuery @"
SELECT 
    "Platform",
    "CanonicalId",
    "ProofId",
    "CreatedAt"
FROM "LinkIndex"
ORDER BY "CreatedAt" DESC
LIMIT 10
"@ "Recent Canonical Mappings (Last 10)"

# 6. Show Receipt JSON (first few characters)
Invoke-SqlQuery @"
SELECT 
    "Id",
    "ProofId",
    LEFT("Json", 100) || '...' as "JsonPreview",
    "CreatedAt"
FROM "Receipts"
WHERE "Json" LIKE '%"url"%'
ORDER BY "CreatedAt" DESC
LIMIT 5
"@ "Receipt JSON Previews (Last 5)"

# 7. Check Proof Cards
Invoke-SqlQuery @"
SELECT 
    'Proof Cards (New)' as Type,
    COUNT(*) as Count
FROM "Proofs"
WHERE "ProofCardSmallUrl" IS NOT NULL
"@ "New System Proof Cards Count"

Invoke-SqlQuery @"
SELECT 
    'Proof Cards (Legacy)' as Type,
    COUNT(*) as Count
FROM "VerificationProofs"
WHERE "ProofCardSmallUrl" IS NOT NULL
"@ "Legacy System Proof Cards Count"

# 8. Overall Summary
Write-Host "📈 OVERALL SUMMARY" -ForegroundColor Cyan
Write-Host "=================" -ForegroundColor Cyan

Invoke-SqlQuery @"
SELECT 
    'Legacy URLs' as Type,
    COUNT(*) as Count
FROM VerificationRequests 
WHERE Url IS NOT NULL

UNION ALL

SELECT 
    'Canonical Mappings' as Type,
    COUNT(*) as Count
FROM LinkIndex

UNION ALL

SELECT 
    'Receipts with URLs' as Type,
    COUNT(*) as Count
FROM Receipts
WHERE Json LIKE '%"url"%'

UNION ALL

SELECT 
    'Proof Cards (New)' as Type,
    COUNT(*) as Count
FROM Proofs
WHERE ProofCardSmallUrl IS NOT NULL

UNION ALL

SELECT 
    'Proof Cards (Legacy)' as Type,
    COUNT(*) as Count
FROM VerificationProofs
WHERE ProofCardSmallUrl IS NOT NULL
"@ "Complete Summary"

# 8. Overall Summary
Write-Host "📈 OVERALL SUMMARY" -ForegroundColor Cyan
Write-Host "=================" -ForegroundColor Cyan

Invoke-SqlQuery @"
SELECT 
    'Legacy URLs' as Type,
    COUNT(*) as Count
FROM "VerificationRequests" 
WHERE "Url" IS NOT NULL

UNION ALL

SELECT 
    'Canonical Mappings' as Type,
    COUNT(*) as Count
FROM "LinkIndex"

UNION ALL

SELECT 
    'Receipts with URLs' as Type,
    COUNT(*) as Count
FROM "Receipts"
WHERE "Json" LIKE '%"url"%'

UNION ALL

SELECT 
    'Proof Cards (New)' as Type,
    COUNT(*) as Count
FROM "Proofs"
WHERE "ProofCardSmallUrl" IS NOT NULL

UNION ALL

SELECT 
    'Proof Cards (Legacy)' as Type,
    COUNT(*) as Count
FROM "VerificationProofs"
WHERE "ProofCardSmallUrl" IS NOT NULL
"@ "Complete Summary"

Write-Host "✅ URL check completed!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Tips:" -ForegroundColor Yellow
Write-Host "   - Legacy URLs are in VerificationRequests.Url" -ForegroundColor White
Write-Host "   - New system uses LinkIndex for canonical mappings" -ForegroundColor White
Write-Host "   - Original URLs are preserved in Receipts.Json" -ForegroundColor White
Write-Host "   - Proof cards have their own URL fields" -ForegroundColor White
Write-Host ""
Write-Host "🔧 PostgreSQL Commands:" -ForegroundColor Cyan
Write-Host "   psql -c \"SELECT * FROM \\\"VerificationRequests\\\" WHERE \\\"Url\\\" IS NOT NULL;\" \"$ConnectionString\"" -ForegroundColor White
Write-Host "   psql -c \"SELECT * FROM \\\"LinkIndex\\\";\" \"$ConnectionString\"" -ForegroundColor White
Write-Host "   psql -c \"SELECT * FROM \\\"Receipts\\\" WHERE \\\"Json\\\" LIKE '%url%';\" \"$ConnectionString\"" -ForegroundColor White
