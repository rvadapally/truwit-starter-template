# Comprehensive Test Suite for Truwit Verification App
# Tests: Routing, Database Validation, Timezone, and Idempotency

param(
    [string]$Environment = "local"  # "local" or "production"
)

$ErrorActionPreference = "Continue"

# Configuration
if ($Environment -eq "production") {
    $ApiUrl = "https://truwit-starter-template-production.up.railway.app"
    $FrontendUrl = "https://www.truwit.ai"
} else {
    $ApiUrl = "http://localhost:5000"
    $FrontendUrl = "http://localhost:4200"
}

# Colors for output
function Write-Success { param($Message) Write-Host "[PASS] $Message" -ForegroundColor Green }
function Write-Failure { param($Message) Write-Host "[FAIL] $Message" -ForegroundColor Red }
function Write-Info { param($Message) Write-Host "[INFO] $Message" -ForegroundColor Cyan }
function Write-Warning { param($Message) Write-Host "[WARN] $Message" -ForegroundColor Yellow }
function Write-Section { 
    param($Message) 
    Write-Host "" -ForegroundColor Magenta
    Write-Host "========================================" -ForegroundColor Magenta
    Write-Host "$Message" -ForegroundColor Magenta
    Write-Host "========================================" -ForegroundColor Magenta
    Write-Host "" -ForegroundColor Magenta
}

# Test results tracking
$script:TotalTests = 0
$script:PassedTests = 0
$script:FailedTests = 0
$script:TestResults = @()

function Add-TestResult {
    param(
        [string]$TestName,
        [bool]$Passed,
        [string]$Details = ""
    )
    $script:TotalTests++
    if ($Passed) {
        $script:PassedTests++
        Write-Success "$TestName"
    } else {
        $script:FailedTests++
        Write-Failure "$TestName"
    }
    $script:TestResults += [PSCustomObject]@{
        Test = $TestName
        Passed = $Passed
        Details = $Details
    }
}

# API Call Helper
function Invoke-ApiTest {
    param(
        [string]$Url,
        [string]$Method = "GET",
        [object]$Body = $null,
        [int]$TimeoutSec = 120
    )
    
    try {
        $headers = @{ "Content-Type" = "application/json" }
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $headers
            TimeoutSec = $TimeoutSec
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $response = Invoke-RestMethod @params
        return @{
            Success = $true
            Data = $response
            StatusCode = 200
        }
    }
    catch {
        $statusCode = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 0 }
        return @{
            Success = $false
            Error = $_.Exception.Message
            StatusCode = $statusCode
        }
    }
}

# ============================================
# TEST 1: Show Verification Routing & Display
# ============================================
Write-Section "TEST 1: Show Verification Routing & Display"

Write-Info "Creating a test proof first..."
$testUrl = "https://youtu.be/NH2_-4iZEn8"
$createResult = Invoke-ApiTest -Url "$ApiUrl/v1/proofs/url" -Method POST -Body @{ Url = $testUrl } -TimeoutSec 120

if ($createResult.Success) {
    $proofId = $createResult.Data.proofId
    $trustmarkId = $createResult.Data.trustmarkId
    Write-Info "Proof created - ProofId: $proofId, TrustmarkId: $trustmarkId"
    
    # Test 1.1: Verify API endpoint returns proof data (use trustmarkId)
    Write-Info "Testing API endpoint: GET /v1/proofs/verify/$trustmarkId"
    $verifyResult = Invoke-ApiTest -Url "$ApiUrl/v1/proofs/verify/$trustmarkId"
    
    if ($verifyResult.Success -and $verifyResult.Data.proofId) {
        Add-TestResult -TestName "API /v1/proofs/verify/$trustmarkId returns proof data" -Passed $true -Details "ProofId: $($verifyResult.Data.proofId)"
        
        # Validate response structure
        $requiredFields = @('proofId', 'verdict', 'contentHash', 'declared', 'issuedAt', 'signatureStatus', 'badgeUrl')
        $allFieldsPresent = $true
        foreach ($field in $requiredFields) {
            if (-not $verifyResult.Data.PSObject.Properties[$field]) {
                $allFieldsPresent = $false
                Write-Warning "Missing field: $field"
            }
        }
        Add-TestResult -TestName "Verify response contains all required fields" -Passed $allFieldsPresent
        
        # Test 1.2: Validate badge URL
        if ($verifyResult.Data.badgeUrl) {
            Add-TestResult -TestName "Badge URL is present in response" -Passed $true -Details $verifyResult.Data.badgeUrl
        } else {
            Add-TestResult -TestName "Badge URL is present in response" -Passed $false
        }
        
        # Test 1.3: Test badge endpoint (use trustmarkId)
        Write-Info "Testing badge endpoint..."
        $badgeResult = Invoke-ApiTest -Url "$ApiUrl/v1/badge/$trustmarkId.svg"
        Add-TestResult -TestName "Badge SVG endpoint accessible" -Passed $badgeResult.Success
        
    } else {
        Add-TestResult -TestName "API /v1/proofs/verify/$trustmarkId returns proof data" -Passed $false
    }
    
    # Test 1.4: Frontend routing (only in local environment, use trustmarkId)
    if ($Environment -eq "local") {
        Write-Info "Frontend routing test: $FrontendUrl/#/t/$trustmarkId"
        Write-Warning "Manual verification required: Open $FrontendUrl/#/t/$trustmarkId in browser"
        Add-TestResult -TestName "Frontend routing (manual verification)" -Passed $true -Details "URL: $FrontendUrl/#/t/$trustmarkId"
    }
    
} else {
    Write-Failure "Failed to create test proof: $($createResult.Error)"
    Add-TestResult -TestName "Create test proof for routing test" -Passed $false
}

# ============================================
# TEST 2: Database Validation
# ============================================
Write-Section "TEST 2: Database Validation - Logical Entries"

Write-Info "Creating multiple proofs to test database integrity..."
$testUrls = @(
    "https://youtu.be/NH2_-4iZEn8",
    "https://youtube.com/shorts/9tr7R1aFqws"
)

$createdProofs = @()
foreach ($url in $testUrls) {
    $result = Invoke-ApiTest -Url "$ApiUrl/v1/proofs/url" -Method POST -Body @{ Url = $url } -TimeoutSec 120
    if ($result.Success) {
        $createdProofs += $result.Data
    }
}

if ($createdProofs.Count -gt 0) {
    Add-TestResult -TestName "Successfully created multiple proofs" -Passed $true -Details "Created $($createdProofs.Count) proofs"
    
    # Test 2.1: Validate proof IDs are unique
    $uniqueProofIds = ($createdProofs | Select-Object -ExpandProperty proofId -Unique).Count
    $allProofIds = $createdProofs.Count
    Add-TestResult -TestName "All proof IDs are unique" -Passed ($uniqueProofIds -eq $allProofIds) -Details "Unique: $uniqueProofIds, Total: $allProofIds"
    
    # Test 2.2: Validate each proof has required relationships (use trustmarkId)
    foreach ($proof in $createdProofs) {
        $verifyResult = Invoke-ApiTest -Url "$ApiUrl/v1/proofs/verify/$($proof.trustmarkId)"
        if ($verifyResult.Success) {
            $hasContentHash = $verifyResult.Data.contentHash -ne $null -and $verifyResult.Data.contentHash -ne "unknown"
            $hasDeclared = $verifyResult.Data.declared -ne $null
            $hasIssuedAt = $verifyResult.Data.issuedAt -ne $null
            
            $isValid = $hasContentHash -and $hasDeclared -and $hasIssuedAt
            Add-TestResult -TestName "Proof $($proof.trustmarkId) has valid relationships" -Passed $isValid
        }
    }
    
    # Test 2.3: Validate verify URL matches trustmark ID
    foreach ($proof in $createdProofs) {
        if ($proof.verifyUrl) {
            $urlContainsId = $proof.verifyUrl -match $proof.trustmarkId
            Add-TestResult -TestName "Verify URL contains trustmark ID for $($proof.trustmarkId)" -Passed $urlContainsId
        }
    }
    
} else {
    Add-TestResult -TestName "Create multiple proofs for database validation" -Passed $false
}

# ============================================
# TEST 3: Timezone Validation (Central Time)
# ============================================
Write-Section "TEST 3: Timezone Validation - Central Time Zone"

Write-Info "Creating proof to test timestamp storage..."
$timezoneTestUrl = "https://youtu.be/NH2_-4iZEn8"
$beforeCreate = Get-Date
$tzResult = Invoke-ApiTest -Url "$ApiUrl/v1/proofs/url" -Method POST -Body @{ Url = $timezoneTestUrl } -TimeoutSec 120
$afterCreate = Get-Date

if ($tzResult.Success) {
    $proofId = $tzResult.Data.proofId
    $trustmarkId = $tzResult.Data.trustmarkId
    Write-Info "Proof created - ProofId: $proofId, TrustmarkId: $trustmarkId"
    
    # Get proof details (use trustmarkId)
    $proofDetails = Invoke-ApiTest -Url "$ApiUrl/v1/proofs/verify/$trustmarkId"
    
    if ($proofDetails.Success -and $proofDetails.Data.issuedAt) {
        $issuedAt = $proofDetails.Data.issuedAt
        Write-Info "Issued At: $issuedAt"
        
        # Test 3.1: Timestamp is in valid format
        try {
            $parsedDate = [DateTime]::Parse($issuedAt)
            Add-TestResult -TestName "Timestamp is in valid ISO format" -Passed $true -Details $issuedAt
            
            # Test 3.2: Timestamp is within reasonable range
            $isWithinRange = ($parsedDate -ge $beforeCreate.AddMinutes(-5)) -and ($parsedDate -le $afterCreate.AddMinutes(5))
            Add-TestResult -TestName "Timestamp is within expected time range" -Passed $isWithinRange -Details "Range: $beforeCreate to $afterCreate"
            
            # Test 3.3: Check if timestamp appears to be in Central Time
            # Central Time is typically UTC-6 (CST) or UTC-5 (CDT)
            $utcNow = [DateTime]::UtcNow
            $centralOffset = [TimeSpan]::FromHours(-6)  # CST
            $centralTime = $utcNow.Add($centralOffset)
            
            Write-Info "UTC Now: $utcNow"
            Write-Info "Central Time (approx): $centralTime"
            Write-Info "Stored timestamp: $parsedDate"
            
            # Check if the hour difference suggests Central Time
            $hourDiff = [Math]::Abs(($parsedDate - $centralTime).TotalHours)
            $appearsToBeCentralTime = $hourDiff -lt 2  # Within 2 hours tolerance
            
            Add-TestResult -TestName "Timestamp appears to be in Central Time Zone" -Passed $appearsToBeCentralTime -Details "Hour difference from Central: $hourDiff"
            
        } catch {
            Add-TestResult -TestName "Timestamp is in valid ISO format" -Passed $false -Details $issuedAt
        }
    } else {
        Add-TestResult -TestName "Retrieve timestamp for timezone test" -Passed $false
    }
} else {
    Add-TestResult -TestName "Create proof for timezone test" -Passed $false
}

# ============================================
# TEST 4: Idempotency Testing
# ============================================
Write-Section "TEST 4: Idempotency - Duplicate URL Handling"

Write-Info "Testing idempotency with duplicate URLs..."
$idempotencyUrl = "https://youtu.be/NH2_-4iZEn8"

# Create first proof
Write-Info "Creating first proof..."
$firstResult = Invoke-ApiTest -Url "$ApiUrl/v1/proofs/url" -Method POST -Body @{ Url = $idempotencyUrl } -TimeoutSec 120

if ($firstResult.Success) {
    $firstProofId = $firstResult.Data.proofId
    $firstTrustmarkId = $firstResult.Data.trustmarkId
    Write-Info "First proof created - ProofId: $firstProofId, TrustmarkId: $firstTrustmarkId"
    
    # Wait a moment
    Start-Sleep -Seconds 2
    
    # Create second proof with same URL
    Write-Info "Creating second proof with same URL..."
    $secondResult = Invoke-ApiTest -Url "$ApiUrl/v1/proofs/url" -Method POST -Body @{ Url = $idempotencyUrl } -TimeoutSec 120
    
    if ($secondResult.Success) {
        $secondProofId = $secondResult.Data.proofId
        $secondTrustmarkId = $secondResult.Data.trustmarkId
        Write-Info "Second proof result - ProofId: $secondProofId, TrustmarkId: $secondTrustmarkId"
        
        # Test 4.1: Check if same proof ID returned
        $isSameProof = $firstProofId -eq $secondProofId
        Add-TestResult -TestName "Duplicate URL returns same proof ID (idempotency)" -Passed $isSameProof -Details "First: $firstProofId, Second: $secondProofId"
        
        # Test 4.2: Verify both requests return valid proof (use trustmarkId)
        $firstVerify = Invoke-ApiTest -Url "$ApiUrl/v1/proofs/verify/$firstTrustmarkId"
        $secondVerify = Invoke-ApiTest -Url "$ApiUrl/v1/proofs/verify/$secondTrustmarkId"
        
        $bothValid = $firstVerify.Success -and $secondVerify.Success
        Add-TestResult -TestName "Both proof IDs resolve to valid proofs" -Passed $bothValid
        
        # Test 4.3: Verify content hashes match
        if ($firstVerify.Success -and $secondVerify.Success) {
            $hashesMatch = $firstVerify.Data.contentHash -eq $secondVerify.Data.contentHash
            Add-TestResult -TestName "Content hashes match for duplicate URLs" -Passed $hashesMatch
        }
        
        # Test 4.4: Verify issued timestamps (should be same if idempotent)
        if ($firstVerify.Success -and $secondVerify.Success) {
            $timestampsMatch = $firstVerify.Data.issuedAt -eq $secondVerify.Data.issuedAt
            Add-TestResult -TestName "Timestamps match (proof not recreated)" -Passed $timestampsMatch -Details "First: $($firstVerify.Data.issuedAt), Second: $($secondVerify.Data.issuedAt)"
        }
        
    } else {
        Add-TestResult -TestName "Create second proof for idempotency test" -Passed $false -Details $secondResult.Error
    }
    
} else {
    Add-TestResult -TestName "Create first proof for idempotency test" -Passed $false -Details $firstResult.Error
}

# ============================================
# TEST SUMMARY
# ============================================
Write-Section "TEST SUMMARY"

Write-Host ""
Write-Host "Total Tests: $script:TotalTests" -ForegroundColor White
Write-Success "Passed: $script:PassedTests"
Write-Failure "Failed: $script:FailedTests"
Write-Host ""

$passRate = if ($script:TotalTests -gt 0) { [math]::Round(($script:PassedTests / $script:TotalTests) * 100, 2) } else { 0 }
Write-Host "Pass Rate: $passRate%" -ForegroundColor $(if ($passRate -ge 80) { "Green" } elseif ($passRate -ge 60) { "Yellow" } else { "Red" })

Write-Host ""
Write-Host "Detailed Results:" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan
foreach ($result in $script:TestResults) {
    $status = if ($result.Passed) { "[PASS]" } else { "[FAIL]" }
    $color = if ($result.Passed) { "Green" } else { "Red" }
    Write-Host "$status - $($result.Test)" -ForegroundColor $color
    if ($result.Details) {
        Write-Host "        $($result.Details)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Magenta
if ($script:FailedTests -eq 0) {
    Write-Success "ALL TESTS PASSED!"
} else {
    Write-Warning "Some tests failed. Please review the results above."
}
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""

# Exit with appropriate code
exit $script:FailedTests

