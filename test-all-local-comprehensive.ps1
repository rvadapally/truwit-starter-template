#############################################################################
# Comprehensive Local Testing Script
# Tests all features including database verification
#############################################################################

$ErrorActionPreference = "Stop"
$BASE_URL = "http://localhost:5000"

function Write-Header {
    param([string]$Text)
    Write-Host "`n════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  $Text" -ForegroundColor Cyan
    Write-Host "════════════════════════════════════════════`n" -ForegroundColor Cyan
}

function Write-Success { param([string]$Text) Write-Host "✅ $Text" -ForegroundColor Green }
function Write-Failure { param([string]$Text) Write-Host "❌ $Text" -ForegroundColor Red }
function Write-Info { param([string]$Text) Write-Host "ℹ️  $Text" -ForegroundColor Yellow }

# Test Results
$tests = @{
    Total = 0
    Passed = 0
    Failed = 0
    Results = @()
}

function Test-Endpoint {
    param(
        [string]$Name,
        [scriptblock]$TestBlock
    )
    
    $tests.Total++
    Write-Host "`n📝 Test $($tests.Total): $Name" -ForegroundColor Yellow
    
    try {
        & $TestBlock
        $tests.Passed++
        $tests.Results += @{Name=$Name; Status="PASSED"}
        Write-Success "PASSED"
    } catch {
        $tests.Failed++
        $tests.Results += @{Name=$Name; Status="FAILED"; Error=$_.Exception.Message}
        Write-Failure "FAILED: $($_.Exception.Message)"
    }
}

##########################################################################
Write-Header "COMPREHENSIVE LOCAL TESTING"
Write-Info "Testing API at: $BASE_URL"
Write-Info "Database: PostgreSQL (Docker)"

##########################################################################
Write-Header "1. HEALTH CHECK"

Test-Endpoint "API Health Check" {
    $health = Invoke-RestMethod -Uri "$BASE_URL/health" -TimeoutSec 10
    if ($health.status -ne "Healthy") { throw "Health check failed" }
}

##########################################################################
Write-Header "2. URL PROOF CREATION"

$tiktokUrl = "https://www.tiktok.com/@toptierlives/video/7560062313332591886"
$tiktokTrustmark = $null

Test-Endpoint "Create Proof from TikTok URL" {
    $body = @{ url = $tiktokUrl } | ConvertTo-Json
    $result = Invoke-RestMethod -Uri "$BASE_URL/v1/proofs/url" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 90
    if (!$result.trustmarkId) { throw "No trustmark returned" }
    $script:tiktokTrustmark = $result.trustmarkId
    Write-Info "Trustmark ID: $($result.trustmarkId)"
}

Test-Endpoint "Verify TikTok Proof" {
    if (!$script:tiktokTrustmark) { throw "No trustmark available" }
    $verify = Invoke-RestMethod -Uri "$BASE_URL/v1/proofs/verify/$script:tiktokTrustmark"
    if (!$verify.proofId) { throw "No proof data returned" }
    Write-Info "ProofId: $($verify.proofId)"
    Write-Info "IssuedAt: $($verify.issuedAt)"
}

##########################################################################
Write-Header "3. FILE UPLOAD PROOF"

Test-Endpoint "Upload MP4 File" {
    $testFile = "testFiles/test.mp4"
    if (!(Test-Path $testFile)) { throw "Test file not found: $testFile" }
    
    $boundary = [System.Guid]::NewGuid().ToString()
    $fileBytes = [System.IO.File]::ReadAllBytes((Resolve-Path $testFile))
    
    $bodyLines = @(
        "--$boundary",
        "Content-Disposition: form-data; name=`"file`"; filename=`"test.mp4`"",
        "Content-Type: video/mp4",
        "",
        [System.Text.Encoding]::GetEncoding("ISO-8859-1").GetString($fileBytes),
        "--$boundary--"
    ) -join "`r`n"
    
    $result = Invoke-RestMethod -Uri "$BASE_URL/v1/proofs/file-upload" `
        -Method Post `
        -ContentType "multipart/form-data; boundary=$boundary" `
        -Body $bodyLines `
        -TimeoutSec 120
    
    if (!$result.trustmarkId) { throw "No trustmark returned" }
    Write-Info "File Upload Trustmark: $($result.trustmarkId)"
}

##########################################################################
Write-Header "4. DATABASE VERIFICATION"

Write-Info "Querying PostgreSQL database directly..."

Test-Endpoint "Query Proofs Table" {
    $query = "SELECT COUNT(*) as count FROM `"Proofs`""
    $result = docker exec truwit-postgres psql -U postgres -d truwit -t -c $query 2>&1
    $count = ($result | Out-String).Trim()
    if (!$count -or $count -eq "0") { throw "No proofs found in database" }
    Write-Info "Total Proofs in DB: $count"
}

Test-Endpoint "Query LinkIndex Table" {
    $query = "SELECT COUNT(*) as count FROM `"LinkIndex`""
    $result = docker exec truwit-postgres psql -U postgres -d truwit -t -c $query 2>&1
    $count = ($result | Out-String).Trim()
    Write-Info "Total Links in DB: $count"
}

Test-Endpoint "Query Specific Proof by Trustmark" {
    if (!$script:tiktokTrustmark) { throw "No trustmark available" }
    $query = "SELECT `"Id`", `"TrustmarkId`", `"OriginUrl`", `"CreatedAt`" FROM `"Proofs`" WHERE `"TrustmarkId`" = '$($script:tiktokTrustmark)' LIMIT 1"
    $result = docker exec truwit-postgres psql -U postgres -d truwit -t -c $query 2>&1
    $data = ($result | Out-String).Trim()
    if (!$data) { throw "Proof not found in database" }
    Write-Info "Proof Data:`n$data"
}

Test-Endpoint "Verify No Duplicate URLs (Deduplication)" {
    # Try to create the same proof again
    $body = @{ url = $tiktokUrl } | ConvertTo-Json
    $result = Invoke-RestMethod -Uri "$BASE_URL/v1/proofs/url" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 60
    
    if ($result.trustmarkId -ne $script:tiktokTrustmark) {
        throw "Deduplication failed! New trustmark created: $($result.trustmarkId) vs $script:tiktokTrustmark"
    }
    Write-Info "Deduplication working - returned same trustmark"
}

##########################################################################
Write-Header "5. LOG FILE VERIFICATION"

Test-Endpoint "Check Log Files Exist" {
    $logCheck = docker exec truwit-api ls -la /app/logs/ 2>&1
    $logFiles = ($logCheck | Out-String)
    if ($logFiles -notmatch "nlog-") { throw "No log files found" }
    Write-Info "Log files:`n$logFiles"
}

Test-Endpoint "Read Recent Log Entries" {
    $logContent = docker exec truwit-api tail -20 /app/logs/nlog-own-*.log 2>&1
    $logs = ($logContent | Out-String)
    if (!$logs) { throw "Could not read log file" }
    Write-Info "Recent log entries (last 20 lines):`n$logs"
}

##########################################################################
Write-Header "6. YOUTUBE PROOF (If cookies valid)"

Test-Endpoint "YouTube URL (May fail if cookies expired)" {
    try {
        $body = @{ url = "https://youtu.be/K7uZuy41wlQ" } | ConvertTo-Json
        $result = Invoke-RestMethod -Uri "$BASE_URL/v1/proofs/url" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 120
        Write-Info "YouTube Trustmark: $($result.trustmarkId)"
    } catch {
        Write-Info "YouTube test skipped (cookies may be expired): $($_.Exception.Message)"
        # Don't fail the test, YouTube cookies expire frequently
    }
}

##########################################################################
Write-Header "TEST SUMMARY"

Write-Host "`nTotal Tests: $($tests.Total)" -ForegroundColor Cyan
Write-Host "✅ Passed: $($tests.Passed)" -ForegroundColor Green
Write-Host "❌ Failed: $($tests.Failed)" -ForegroundColor Red

Write-Host "`nDetailed Results:" -ForegroundColor Cyan
foreach ($result in $tests.Results) {
    if ($result.Status -eq "PASSED") {
        Write-Host "  ✅ $($result.Name)" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $($result.Name): $($result.Error)" -ForegroundColor Red
    }
}

if ($tests.Failed -eq 0) {
    Write-Header "ALL TESTS PASSED! 🎉"
    exit 0
} else {
    Write-Header "SOME TESTS FAILED"
    exit 1
}

