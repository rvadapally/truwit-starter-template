# Comprehensive Test Suite for Truwit Verification App
# Tests ALL critical functionality to prevent future regressions

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('local', 'production')]
    [string]$Environment = 'local'
)

# Configuration
$LocalApiUrl = "http://127.0.0.1:5001"
$LocalFrontendUrl = "http://localhost:4200"
$ProdApiUrl = "https://truwit-starter-template-production.up.railway.app"
$ProdFrontendUrl = "https://www.truwit.ai"

$ApiUrl = if ($Environment -eq 'local') { $LocalApiUrl } else { $ProdApiUrl }
$FrontendUrl = if ($Environment -eq 'local') { $LocalFrontendUrl } else { $ProdFrontendUrl }

# Test URLs
$TestUrls = @{
    YouTube = "https://www.youtube.com/watch?v=jNQXAC9IVRw"  # "Me at the zoo" - first YouTube video
    TikTok = "https://www.tiktok.com/@username/video/12345"   # Sample TikTok URL
}

# Test results storage
$TestResults = @()
$PassedTests = 0
$FailedTests = 0
$SkippedTests = 0

# Utilities
function Write-TestHeader {
    param([string]$Message)
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "  $Message" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
}

function Write-TestSection {
    param([string]$Section)
    Write-Host "`n--- $Section ---`n" -ForegroundColor Yellow
}

function Write-Pass {
    param([string]$Message)
    Write-Host "[PASS] $Message" -ForegroundColor Green
}

function Write-Fail {
    param([string]$Message)
    Write-Host "[FAIL] $Message" -ForegroundColor Red
}

function Write-Skip {
    param([string]$Message)
    Write-Host "[SKIP] $Message" -ForegroundColor Gray
}

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Add-TestResult {
    param(
        [string]$TestName,
        [bool]$Passed,
        [string]$Details = "",
        [bool]$Skipped = $false
    )
    
    $script:TestResults += [PSCustomObject]@{
        TestName = $TestName
        Passed = $Passed
        Skipped = $Skipped
        Details = $Details
        Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    }
    
    if ($Skipped) {
        $script:SkippedTests++
    } elseif ($Passed) {
        $script:PassedTests++
    } else {
        $script:FailedTests++
    }
}

function Invoke-ApiTest {
    param(
        [string]$Url,
        [string]$Method = "GET",
        [string]$Body = $null,
        [string]$ContentType = "application/json",
        [int]$TimeoutSec = 120
    )
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            TimeoutSec = $TimeoutSec
            ErrorAction = 'Stop'
        }
        
        if ($Body) {
            $params['Body'] = $Body
            $params['ContentType'] = $ContentType
        }
        
        $response = Invoke-WebRequest @params
        $content = $response.Content | ConvertFrom-Json
        
        return @{
            Success = $true
            StatusCode = $response.StatusCode
            Data = $content
            RawResponse = $response
        }
    }
    catch {
        $statusCode = $null
        $errorMessage = $_.Exception.Message
        
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $errorBody = $reader.ReadToEnd()
            $reader.Close()
            
            if ($errorBody) {
                try {
                    $errorJson = $errorBody | ConvertFrom-Json
                    $errorMessage = $errorJson.message -or $errorMessage
                } catch {
                    $errorMessage = $errorBody
                }
            }
        }
        
        return @{
            Success = $false
            StatusCode = $statusCode
            Error = $errorMessage
            Exception = $_
        }
    }
}

# ============================================
# TEST SUITE START
# ============================================

Write-TestHeader "TRUWIT VERIFICATION APP - COMPREHENSIVE TEST SUITE"
Write-Host "Environment: $Environment" -ForegroundColor White
Write-Host "API URL: $ApiUrl" -ForegroundColor White
Write-Host "Frontend URL: $FrontendUrl" -ForegroundColor White
Write-Host "Test Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor White

# ============================================
# TEST CATEGORY 1: INFRASTRUCTURE
# ============================================

Write-TestSection "CATEGORY 1: Infrastructure & Health Checks"

# Test 1.1: API Health Endpoint
Write-Info "Testing API health endpoint..."
$healthResult = Invoke-ApiTest -Url "$ApiUrl/health"

if ($healthResult.Success -and $healthResult.StatusCode -eq 200) {
    Write-Pass "API health endpoint returned 200 OK"
    Add-TestResult -TestName "API Health Endpoint" -Passed $true -Details "API is healthy"
} else {
    Write-Fail "API health endpoint failed: $($healthResult.Error)"
    Add-TestResult -TestName "API Health Endpoint" -Passed $false -Details $healthResult.Error
}

# Test 1.2: API CORS Headers
Write-Info "Testing CORS headers..."
try {
    $corsTest = Invoke-WebRequest -Uri "$ApiUrl/health" -Method OPTIONS -ErrorAction Stop
    $corsHeaders = $corsTest.Headers['Access-Control-Allow-Origin']
    
    if ($corsHeaders) {
        Write-Pass "CORS headers present: $corsHeaders"
        Add-TestResult -TestName "CORS Configuration" -Passed $true -Details "CORS headers: $corsHeaders"
    } else {
        Write-Fail "CORS headers missing"
        Add-TestResult -TestName "CORS Configuration" -Passed $false -Details "No CORS headers found"
    }
} catch {
    Write-Skip "CORS test skipped (OPTIONS method may not be supported)"
    Add-TestResult -TestName "CORS Configuration" -Passed $false -Skipped $true -Details "Test skipped"
}

# Test 1.3: Docker Container (Local Only)
if ($Environment -eq 'local') {
    Write-Info "Testing Docker container status..."
    try {
        $dockerPs = docker ps --filter "name=api" --format "{{.Names}}" 2>&1
        if ($LASTEXITCODE -eq 0 -and $dockerPs -like "*api*") {
            Write-Pass "Docker container 'api' is running"
            Add-TestResult -TestName "Docker Container Status" -Passed $true -Details "Container running"
        } else {
            Write-Fail "Docker container not found"
            Add-TestResult -TestName "Docker Container Status" -Passed $false -Details "Container not running"
        }
    } catch {
        Write-Fail "Docker command failed: $($_.Exception.Message)"
        Add-TestResult -TestName "Docker Container Status" -Passed $false -Details $_.Exception.Message
    }
}

# ============================================
# TEST CATEGORY 2: URL VERIFICATION
# ============================================

Write-TestSection "CATEGORY 2: URL Verification (TikTok)"

# Test 2.1: TikTok URL Processing
Write-Info "Testing TikTok URL processing..."
$tiktokUrl = "https://www.tiktok.com/@toptierlives/video/7555756163036433677"
$tiktokBody = @{ Url = $tiktokUrl } | ConvertTo-Json

$tiktokResult = Invoke-ApiTest -Url "$ApiUrl/v1/proofs/url" -Method POST -Body $tiktokBody -TimeoutSec 180

if ($tiktokResult.Success) {
    Write-Pass "TikTok URL processed successfully"
    $tiktokProof = $tiktokResult.Data
    Write-Host "  ProofId: $($tiktokProof.proofId)" -ForegroundColor Gray
    Write-Host "  TrustmarkId: $($tiktokProof.trustmarkId)" -ForegroundColor Gray
    Write-Host "  Deduped: $($tiktokProof.deduped)" -ForegroundColor Gray
    Add-TestResult -TestName "TikTok URL Processing" -Passed $true -Details "TrustmarkId: $($tiktokProof.trustmarkId)"
    
    # Store for later tests
    $script:TikTokTrustmarkId = $tiktokProof.trustmarkId
    $script:TikTokProofId = $tiktokProof.proofId
} else {
    Write-Fail "TikTok URL processing failed: $($tiktokResult.Error)"
    Add-TestResult -TestName "TikTok URL Processing" -Passed $false -Details $tiktokResult.Error
}

# Test 2.2: YouTube URL Processing (May fail without cookies)
Write-Info "Testing YouTube URL processing..."
$youtubeUrl = $TestUrls.YouTube
$youtubeBody = @{ Url = $youtubeUrl } | ConvertTo-Json

$youtubeResult = Invoke-ApiTest -Url "$ApiUrl/v1/proofs/url" -Method POST -Body $youtubeBody -TimeoutSec 180

if ($youtubeResult.Success) {
    Write-Pass "YouTube URL processed successfully"
    $youtubeProof = $youtubeResult.Data
    Write-Host "  ProofId: $($youtubeProof.proofId)" -ForegroundColor Gray
    Write-Host "  TrustmarkId: $($youtubeProof.trustmarkId)" -ForegroundColor Gray
    Add-TestResult -TestName "YouTube URL Processing" -Passed $true -Details "TrustmarkId: $($youtubeProof.trustmarkId)"
    
    $script:YouTubeTrustmarkId = $youtubeProof.trustmarkId
    $script:YouTubeProofId = $youtubeProof.proofId
} elseif ($youtubeResult.Error -like "*bot*" -or $youtubeResult.Error -like "*Sign in*") {
    Write-Skip "YouTube URL skipped (bot detection - cookies needed)"
    Add-TestResult -TestName "YouTube URL Processing" -Passed $false -Skipped $true -Details "YouTube bot detection"
} else {
    Write-Fail "YouTube URL processing failed: $($youtubeResult.Error)"
    Add-TestResult -TestName "YouTube URL Processing" -Passed $false -Details $youtubeResult.Error
}

# ============================================
# TEST CATEGORY 3: PROOF VERIFICATION
# ============================================

Write-TestSection "CATEGORY 3: Proof Verification & Retrieval"

if ($script:TikTokTrustmarkId) {
    # Test 3.1: Verify Proof Endpoint
    Write-Info "Testing proof verification endpoint..."
    $verifyResult = Invoke-ApiTest -Url "$ApiUrl/v1/proofs/verify/$($script:TikTokTrustmarkId)"
    
    if ($verifyResult.Success) {
        $verifyData = $verifyResult.Data
        Write-Pass "Proof verification successful"
        Write-Host "  ContentHash: $($verifyData.contentHash)" -ForegroundColor Gray
        Write-Host "  Verdict: $($verifyData.verdict)" -ForegroundColor Gray
        Write-Host "  IssuedAt: $($verifyData.issuedAt)" -ForegroundColor Gray
        Add-TestResult -TestName "Proof Verification Endpoint" -Passed $true -Details "Verdict: $($verifyData.verdict)"
        
        # Test 3.2: Validate Content Hash Format
        if ($verifyData.contentHash -match '^[a-f0-9]{64}$') {
            Write-Pass "Content hash is valid SHA-256 format (64 hex chars)"
            Add-TestResult -TestName "Content Hash Format" -Passed $true -Details "Valid SHA-256"
        } else {
            Write-Fail "Content hash format invalid: $($verifyData.contentHash)"
            Add-TestResult -TestName "Content Hash Format" -Passed $false -Details "Invalid format"
        }
        
        # Test 3.3: Validate IssuedAt Timestamp
        try {
            $issuedDate = [DateTime]::Parse($verifyData.issuedAt)
            $now = Get-Date
            $ageMinutes = ($now - $issuedDate).TotalMinutes
            
            if ($ageMinutes -ge 0 -and $ageMinutes -lt 60) {
                Write-Pass "IssuedAt timestamp is recent (within last hour)"
                Add-TestResult -TestName "IssuedAt Timestamp Validity" -Passed $true -Details "Age: $([math]::Round($ageMinutes, 1)) minutes"
            } else {
                Write-Fail "IssuedAt timestamp seems incorrect: $($verifyData.issuedAt)"
                Add-TestResult -TestName "IssuedAt Timestamp Validity" -Passed $false -Details "Age: $ageMinutes minutes"
            }
        } catch {
            Write-Fail "Failed to parse IssuedAt timestamp: $($verifyData.issuedAt)"
            Add-TestResult -TestName "IssuedAt Timestamp Validity" -Passed $false -Details "Parse error"
        }
        
        # Test 3.4: Validate Required Fields Present
        $requiredFields = @('proofId', 'contentHash', 'verdict', 'issuedAt', 'badgeUrl')
        $missingFields = @()
        
        foreach ($field in $requiredFields) {
            if (-not $verifyData.$field) {
                $missingFields += $field
            }
        }
        
        if ($missingFields.Count -eq 0) {
            Write-Pass "All required fields present in verification response"
            Add-TestResult -TestName "Verification Response Completeness" -Passed $true -Details "All fields present"
        } else {
            Write-Fail "Missing fields in verification response: $($missingFields -join ', ')"
            Add-TestResult -TestName "Verification Response Completeness" -Passed $false -Details "Missing: $($missingFields -join ', ')"
        }
    } else {
        Write-Fail "Proof verification failed: $($verifyResult.Error)"
        Add-TestResult -TestName "Proof Verification Endpoint" -Passed $false -Details $verifyResult.Error
    }
    
    # Test 3.5: Badge Endpoint
    Write-Info "Testing badge endpoint..."
    $badgeResult = Invoke-ApiTest -Url "$ApiUrl/v1/badge/$($script:TikTokTrustmarkId).svg"
    
    if ($badgeResult.Success -and $badgeResult.RawResponse.Content -like "*<svg*") {
        Write-Pass "Badge SVG generated successfully"
        Add-TestResult -TestName "Badge Generation" -Passed $true -Details "SVG returned"
    } else {
        Write-Fail "Badge generation failed: $($badgeResult.Error)"
        Add-TestResult -TestName "Badge Generation" -Passed $false -Details $badgeResult.Error
    }
} else {
    Write-Skip "Proof verification tests skipped (no proof created)"
    Add-TestResult -TestName "Proof Verification Endpoint" -Passed $false -Skipped $true
    Add-TestResult -TestName "Content Hash Format" -Passed $false -Skipped $true
    Add-TestResult -TestName "IssuedAt Timestamp Validity" -Passed $false -Skipped $true
    Add-TestResult -TestName "Verification Response Completeness" -Passed $false -Skipped $true
    Add-TestResult -TestName "Badge Generation" -Passed $false -Skipped $true
}

# ============================================
# TEST CATEGORY 4: DEDUPLICATION
# ============================================

Write-TestSection "CATEGORY 4: Deduplication & Idempotency"

# Test 4.1: URL Deduplication (Same URL = Same Proof)
Write-Info "Testing URL deduplication..."
$dedupeTestUrl = "https://www.tiktok.com/@toptierlives/video/7555756163036433677"
$dedupeBody = @{ Url = $dedupeTestUrl } | ConvertTo-Json

$firstRequest = Invoke-ApiTest -Url "$ApiUrl/v1/proofs/url" -Method POST -Body $dedupeBody -TimeoutSec 180

if ($firstRequest.Success) {
    Start-Sleep -Seconds 2  # Small delay
    
    $secondRequest = Invoke-ApiTest -Url "$ApiUrl/v1/proofs/url" -Method POST -Body $dedupeBody -TimeoutSec 180
    
    if ($secondRequest.Success) {
        $firstProof = $firstRequest.Data
        $secondProof = $secondRequest.Data
        
        if ($firstProof.trustmarkId -eq $secondProof.trustmarkId) {
            Write-Pass "URL deduplication working: Same TrustmarkId returned"
            Write-Host "  First:  $($firstProof.trustmarkId)" -ForegroundColor Gray
            Write-Host "  Second: $($secondProof.trustmarkId)" -ForegroundColor Gray
            Write-Host "  Deduped: $($secondProof.deduped)" -ForegroundColor Gray
            Add-TestResult -TestName "URL Deduplication" -Passed $true -Details "Same TrustmarkId: $($firstProof.trustmarkId)"
            
            # Test 4.2: Deduped Flag Check
            if ($secondProof.deduped -eq $true) {
                Write-Pass "Deduped flag correctly set to true"
                Add-TestResult -TestName "Deduped Flag Accuracy" -Passed $true -Details "Flag set correctly"
            } else {
                Write-Fail "Deduped flag should be true but is: $($secondProof.deduped)"
                Add-TestResult -TestName "Deduped Flag Accuracy" -Passed $false -Details "Flag incorrect"
            }
        } else {
            Write-Fail "Deduplication failed: Different TrustmarkIds"
            Write-Host "  First:  $($firstProof.trustmarkId)" -ForegroundColor Red
            Write-Host "  Second: $($secondProof.trustmarkId)" -ForegroundColor Red
            Add-TestResult -TestName "URL Deduplication" -Passed $false -Details "Different IDs returned"
        }
    } else {
        Write-Fail "Second request failed: $($secondRequest.Error)"
        Add-TestResult -TestName "URL Deduplication" -Passed $false -Details "Second request failed"
    }
} else {
    Write-Fail "First request failed: $($firstRequest.Error)"
    Add-TestResult -TestName "URL Deduplication" -Passed $false -Details "First request failed"
}

# ============================================
# TEST CATEGORY 5: ERROR HANDLING
# ============================================

Write-TestSection "CATEGORY 5: Error Handling & Validation"

# Test 5.1: Invalid URL Format
Write-Info "Testing invalid URL handling..."
$invalidUrlBody = @{ Url = "not-a-valid-url" } | ConvertTo-Json
$invalidResult = Invoke-ApiTest -Url "$ApiUrl/v1/proofs/url" -Method POST -Body $invalidUrlBody -TimeoutSec 30

if ($invalidResult.StatusCode -ge 400) {
    Write-Pass "Invalid URL correctly rejected with status $($invalidResult.StatusCode)"
    Add-TestResult -TestName "Invalid URL Rejection" -Passed $true -Details "Status: $($invalidResult.StatusCode)"
} else {
    Write-Fail "Invalid URL should be rejected but got status: $($invalidResult.StatusCode)"
    Add-TestResult -TestName "Invalid URL Rejection" -Passed $false -Details "Not rejected properly"
}

# Test 5.2: Missing Required Fields
Write-Info "Testing missing URL field..."
$emptyBody = @{} | ConvertTo-Json
$emptyResult = Invoke-ApiTest -Url "$ApiUrl/v1/proofs/url" -Method POST -Body $emptyBody -TimeoutSec 30

if ($emptyResult.StatusCode -ge 400) {
    Write-Pass "Missing URL field correctly rejected"
    Add-TestResult -TestName "Missing Field Validation" -Passed $true -Details "Status: $($emptyResult.StatusCode)"
} else {
    Write-Fail "Empty request should be rejected"
    Add-TestResult -TestName "Missing Field Validation" -Passed $false -Details "Not rejected"
}

# Test 5.3: Non-existent Proof Lookup
Write-Info "Testing non-existent proof lookup..."
$nonExistentId = "NOTFOUND"
$notFoundResult = Invoke-ApiTest -Url "$ApiUrl/v1/proofs/verify/$nonExistentId"

if ($notFoundResult.StatusCode -eq 404) {
    Write-Pass "Non-existent proof correctly returns 404"
    Add-TestResult -TestName "Not Found Handling" -Passed $true -Details "404 returned"
} else {
    Write-Fail "Expected 404 for non-existent proof but got: $($notFoundResult.StatusCode)"
    Add-TestResult -TestName "Not Found Handling" -Passed $false -Details "Status: $($notFoundResult.StatusCode)"
}

# ============================================
# TEST CATEGORY 6: DATABASE INTEGRITY
# ============================================

Write-TestSection "CATEGORY 6: Database Integrity (Local Only)"

if ($Environment -eq 'local') {
    # Test 6.1: Database File Exists
    Write-Info "Checking database file existence..."
    $dbPath = "api/data/truwit.db"
    
    if (Test-Path $dbPath) {
        Write-Pass "Database file exists at $dbPath"
        $dbSize = (Get-Item $dbPath).Length
        Write-Host "  Size: $([math]::Round($dbSize/1KB, 2)) KB" -ForegroundColor Gray
        Add-TestResult -TestName "Database File Exists" -Passed $true -Details "Size: $([math]::Round($dbSize/1KB, 2)) KB"
    } else {
        Write-Fail "Database file not found at $dbPath"
        Add-TestResult -TestName "Database File Exists" -Passed $false -Details "File not found"
    }
    
    # Test 6.2: Query Database for Proofs
    if ($script:TikTokTrustmarkId) {
        Write-Info "Verifying proof exists in database..."
        try {
            $containerName = "api-api-1"
            $query = "SELECT Id, TrustmarkId, AssetId FROM Proofs WHERE TrustmarkId='$($script:TikTokTrustmarkId)'"
            $dbQuery = docker exec $containerName sh -c "sqlite3 /app/data/truwit.db `"$query`"" 2>&1
            
            if ($LASTEXITCODE -eq 0 -and $dbQuery -like "*$($script:TikTokTrustmarkId)*") {
                Write-Pass "Proof record found in database"
                Add-TestResult -TestName "Database Record Integrity" -Passed $true -Details "Proof found"
            } else {
                Write-Fail "Proof not found in database"
                Add-TestResult -TestName "Database Record Integrity" -Passed $false -Details "Proof missing"
            }
        } catch {
            Write-Skip "Database query failed (Docker container may not be accessible)"
            Add-TestResult -TestName "Database Record Integrity" -Passed $false -Skipped $true
        }
    }
} else {
    Write-Skip "Database integrity tests skipped (production environment)"
    Add-TestResult -TestName "Database File Exists" -Passed $false -Skipped $true
    Add-TestResult -TestName "Database Record Integrity" -Passed $false -Skipped $true
}

# ============================================
# TEST CATEGORY 7: FRONTEND INTEGRATION
# ============================================

Write-TestSection "CATEGORY 7: Frontend Integration"

# Test 7.1: Frontend Homepage
Write-Info "Testing frontend homepage..."
try {
    $frontendTest = Invoke-WebRequest -Uri $FrontendUrl -TimeoutSec 30 -ErrorAction Stop
    
    if ($frontendTest.StatusCode -eq 200) {
        Write-Pass "Frontend homepage loads successfully"
        Add-TestResult -TestName "Frontend Homepage" -Passed $true -Details "HTTP 200"
        
        # Check if Angular loaded
        if ($frontendTest.Content -like "*<app-root*") {
            Write-Pass "Angular app root element found"
            Add-TestResult -TestName "Angular App Bootstrap" -Passed $true -Details "app-root present"
        } else {
            Write-Fail "Angular app root element not found"
            Add-TestResult -TestName "Angular App Bootstrap" -Passed $false -Details "app-root missing"
        }
    } else {
        Write-Fail "Frontend returned status: $($frontendTest.StatusCode)"
        Add-TestResult -TestName "Frontend Homepage" -Passed $false -Details "Status: $($frontendTest.StatusCode)"
    }
} catch {
    Write-Fail "Frontend not accessible: $($_.Exception.Message)"
    Add-TestResult -TestName "Frontend Homepage" -Passed $false -Details $_.Exception.Message
}

# Test 7.2: Frontend Routing (Verification Page)
if ($script:TikTokTrustmarkId) {
    Write-Info "Testing frontend verification page routing..."
    $verifyPageUrl = "$FrontendUrl/t/$($script:TikTokTrustmarkId)"
    
    try {
        $verifyPageTest = Invoke-WebRequest -Uri $verifyPageUrl -TimeoutSec 30 -ErrorAction Stop
        
        if ($verifyPageTest.StatusCode -eq 200) {
            Write-Pass "Verification page accessible"
            Add-TestResult -TestName "Verification Page Routing" -Passed $true -Details "HTTP 200"
        } else {
            Write-Fail "Verification page returned: $($verifyPageTest.StatusCode)"
            Add-TestResult -TestName "Verification Page Routing" -Passed $false -Details "Status: $($verifyPageTest.StatusCode)"
        }
    } catch {
        Write-Fail "Verification page not accessible: $($_.Exception.Message)"
        Add-TestResult -TestName "Verification Page Routing" -Passed $false -Details $_.Exception.Message
    }
} else {
    Write-Skip "Verification page routing test skipped (no TrustmarkId)"
    Add-TestResult -TestName "Verification Page Routing" -Passed $false -Skipped $true
}

# ============================================
# TEST SUMMARY
# ============================================

Write-TestHeader "TEST SUMMARY"

$totalTests = $PassedTests + $FailedTests + $SkippedTests
$passRate = if ($totalTests -gt 0) { [math]::Round(($PassedTests / $totalTests) * 100, 1) } else { 0 }

Write-Host "Total Tests:   $totalTests" -ForegroundColor White
Write-Host "Passed:        $PassedTests" -ForegroundColor Green
Write-Host "Failed:        $FailedTests" -ForegroundColor Red
Write-Host "Skipped:       $SkippedTests" -ForegroundColor Gray
Write-Host "Pass Rate:     $passRate%" -ForegroundColor $(if ($passRate -ge 80) { 'Green' } elseif ($passRate -ge 60) { 'Yellow' } else { 'Red' })

# Show failed tests
if ($FailedTests -gt 0) {
    Write-Host "`n--- FAILED TESTS ---" -ForegroundColor Red
    $TestResults | Where-Object { -not $_.Passed -and -not $_.Skipped } | ForEach-Object {
        Write-Host "  ❌ $($_.TestName): $($_.Details)" -ForegroundColor Red
    }
}

# Show skipped tests
if ($SkippedTests -gt 0) {
    Write-Host "`n--- SKIPPED TESTS ---" -ForegroundColor Gray
    $TestResults | Where-Object { $_.Skipped } | ForEach-Object {
        Write-Host "  ⊘ $($_.TestName): $($_.Details)" -ForegroundColor Gray
    }
}

# Export results to JSON
$resultsFile = "test-results-$Environment-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
$TestResults | ConvertTo-Json -Depth 10 | Out-File $resultsFile
Write-Host "`nResults exported to: $resultsFile" -ForegroundColor Cyan

# Exit code based on results
if ($FailedTests -eq 0) {
    Write-Host "`n✅ ALL TESTS PASSED!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n❌ SOME TESTS FAILED" -ForegroundColor Red
    exit 1
}

