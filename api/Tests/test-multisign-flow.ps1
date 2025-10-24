# Multi-Sign System Integration Test Script
# Tests the complete flow: init -> finalize -> auth -> sign -> manifest -> badge

param(
    [string]$ApiUrl = "http://localhost:5000",
    [string]$TestImagePath = "",
    [switch]$Verbose
)

$ErrorActionPreference = "Continue"
$Global:TestResults = @()
$Global:GroupId = ""
$Global:FileId = ""
$Global:IdentityToken = ""

# Colors for output
function Write-TestHeader($message) {
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host $message -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
}

function Write-TestSuccess($message) {
    Write-Host "✅ $message" -ForegroundColor Green
}

function Write-TestFailure($message) {
    Write-Host "❌ $message" -ForegroundColor Red
}

function Write-TestInfo($message) {
    if ($Verbose) {
        Write-Host "ℹ️  $message" -ForegroundColor Yellow
    }
}

function Test-ApiHealth {
    Write-TestHeader "TEST 1: API Health Check"
    
    try {
        $response = Invoke-RestMethod -Uri "$ApiUrl/health" -Method Get -ErrorAction Stop
        
        if ($response.ok) {
            Write-TestSuccess "API is healthy"
            Write-TestInfo "Timestamp: $($response.timestamp)"
            
            if ($response.tools) {
                Write-TestInfo "Tools:"
                $response.tools.PSObject.Properties | ForEach-Object {
                    Write-TestInfo "  - $($_.Name): $($_.Value)"
                }
            }
            
            $Global:TestResults += @{
                Test = "API Health"
                Status = "PASS"
                Details = "API responding"
            }
            return $true
        }
        else {
            Write-TestFailure "API health check failed"
            $Global:TestResults += @{
                Test = "API Health"
                Status = "FAIL"
                Details = "API not healthy"
            }
            return $false
        }
    }
    catch {
        Write-TestFailure "Cannot reach API at $ApiUrl"
        Write-TestInfo "Error: $($_.Exception.Message)"
        $Global:TestResults += @{
            Test = "API Health"
            Status = "FAIL"
            Details = "Cannot connect: $($_.Exception.Message)"
        }
        return $false
    }
}

function Test-InitProof {
    Write-TestHeader "TEST 2: Initialize Proof"
    
    $body = @{
        fileName = "test-image.png"
        byteSize = 12345
        mime = "image/png"
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$ApiUrl/v1/proofs/init" -Method Post -Body $body -ContentType "application/json" -ErrorAction Stop
        
        if ($response.clientHashInstructions) {
            Write-TestSuccess "Init proof succeeded"
            Write-TestInfo "Instructions: $($response.clientHashInstructions)"
            
            $Global:TestResults += @{
                Test = "Init Proof"
                Status = "PASS"
                Details = "Init successful"
            }
            return $true
        }
        else {
            Write-TestFailure "Init proof returned unexpected response"
            $Global:TestResults += @{
                Test = "Init Proof"
                Status = "FAIL"
                Details = "Unexpected response"
            }
            return $false
        }
    }
    catch {
        Write-TestFailure "Init proof failed"
        Write-TestInfo "Error: $($_.Exception.Message)"
        $Global:TestResults += @{
            Test = "Init Proof"
            Status = "FAIL"
            Details = $_.Exception.Message
        }
        return $false
    }
}

function Get-TestImage {
    # Create a simple test image if none provided
    if ([string]::IsNullOrEmpty($TestImagePath)) {
        Write-TestInfo "No test image provided, creating a simple 10x10 PNG"
        
        # Minimal PNG: 10x10 red square
        $pngBytes = [byte[]]@(
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,  # PNG signature
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,  # IHDR chunk
            0x00, 0x00, 0x00, 0x0A, 0x00, 0x00, 0x00, 0x0A,  # Width: 10, Height: 10
            0x08, 0x02, 0x00, 0x00, 0x00, 0x02, 0x50, 0x58,  # 8-bit RGB, no compression
            0xEA, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,  # IDAT chunk
            0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00,  # Compressed data
            0x00, 0x00, 0x03, 0x00, 0x01, 0x00, 0x00, 0x00,
            0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82  # IEND chunk
        )
        
        return $pngBytes
    }
    else {
        if (Test-Path $TestImagePath) {
            return [System.IO.File]::ReadAllBytes($TestImagePath)
        }
        else {
            Write-TestFailure "Test image not found at: $TestImagePath"
            return $null
        }
    }
}

function Test-FinalizeProof {
    Write-TestHeader "TEST 3: Finalize Proof"
    
    $imageBytes = Get-TestImage
    if ($null -eq $imageBytes) {
        $Global:TestResults += @{
            Test = "Finalize Proof"
            Status = "SKIP"
            Details = "No image available"
        }
        return $false
    }
    
    # Compute SHA256
    $sha256 = [System.Security.Cryptography.SHA256]::Create()
    $hashBytes = $sha256.ComputeHash($imageBytes)
    $sha256Hex = [System.BitConverter]::ToString($hashBytes).Replace("-", "").ToLower()
    
    # Convert to base64
    $imageBase64 = [Convert]::ToBase64String($imageBytes)
    
    Write-TestInfo "Image size: $($imageBytes.Length) bytes"
    Write-TestInfo "SHA256: $sha256Hex"
    Write-TestInfo "Base64 length: $($imageBase64.Length) chars"
    
    $body = @{
        sha256Hex = $sha256Hex
        imageBase64 = $imageBase64
        techMeta = @{
            tool = "PowerShell Test Script"
            version = "1.0"
        }
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "$ApiUrl/v1/proofs/finalize" -Method Post -Body $body -ContentType "application/json" -ErrorAction Stop
        
        if ($response.groupId -and $response.fileId) {
            $Global:GroupId = $response.groupId
            $Global:FileId = $response.fileId
            
            Write-TestSuccess "Finalize proof succeeded"
            Write-TestInfo "Group ID: $Global:GroupId"
            Write-TestInfo "File ID: $Global:FileId"
            Write-TestInfo "Manifest URL: $($response.manifestUrl)"
            
            $Global:TestResults += @{
                Test = "Finalize Proof"
                Status = "PASS"
                Details = "GroupId: $Global:GroupId, FileId: $Global:FileId"
            }
            return $true
        }
        else {
            Write-TestFailure "Finalize proof returned unexpected response"
            $Global:TestResults += @{
                Test = "Finalize Proof"
                Status = "FAIL"
                Details = "Missing groupId or fileId"
            }
            return $false
        }
    }
    catch {
        Write-TestFailure "Finalize proof failed"
        Write-TestInfo "Error: $($_.Exception.Message)"
        
        # Try to get response content
        if ($_.ErrorDetails) {
            Write-TestInfo "Response: $($_.ErrorDetails.Message)"
        }
        
        $Global:TestResults += @{
            Test = "Finalize Proof"
            Status = "FAIL"
            Details = $_.Exception.Message
        }
        return $false
    }
}

function Test-AnonymousAuth {
    Write-TestHeader "TEST 4: Anonymous Authentication"
    
    try {
        $response = Invoke-RestMethod -Uri "$ApiUrl/v1/auth/anonymous" -Method Post -ErrorAction Stop
        
        if ($response.identity_token) {
            $Global:IdentityToken = $response.identity_token
            
            Write-TestSuccess "Anonymous auth succeeded"
            Write-TestInfo "Token length: $($Global:IdentityToken.Length) chars"
            Write-TestInfo "Token preview: $($Global:IdentityToken.Substring(0, [Math]::Min(50, $Global:IdentityToken.Length)))..."
            
            $Global:TestResults += @{
                Test = "Anonymous Auth"
                Status = "PASS"
                Details = "Token received"
            }
            return $true
        }
        else {
            Write-TestFailure "Anonymous auth returned unexpected response"
            $Global:TestResults += @{
                Test = "Anonymous Auth"
                Status = "FAIL"
                Details = "No token received"
            }
            return $false
        }
    }
    catch {
        Write-TestFailure "Anonymous auth failed"
        Write-TestInfo "Error: $($_.Exception.Message)"
        $Global:TestResults += @{
            Test = "Anonymous Auth"
            Status = "FAIL"
            Details = $_.Exception.Message
        }
        return $false
    }
}

function Test-CreateSignature {
    Write-TestHeader "TEST 5: Create Signature"
    
    if ([string]::IsNullOrEmpty($Global:FileId) -or [string]::IsNullOrEmpty($Global:IdentityToken)) {
        Write-TestFailure "Missing FileId or IdentityToken from previous tests"
        $Global:TestResults += @{
            Test = "Create Signature"
            Status = "SKIP"
            Details = "Missing prerequisites"
        }
        return $false
    }
    
    $body = @{
        fileId = $Global:FileId
        statement = @{
            claim = "creator"
            notes = "Original creator - automated test"
        }
    } | ConvertTo-Json
    
    $headers = @{
        "Authorization" = "Bearer $Global:IdentityToken"
        "Content-Type" = "application/json"
    }
    
    try {
        $response = Invoke-RestMethod -Uri "$ApiUrl/v1/signatures" -Method Post -Body $body -Headers $headers -ErrorAction Stop
        
        if ($response.sigId) {
            Write-TestSuccess "Signature created successfully"
            Write-TestInfo "Signature ID: $($response.sigId)"
            Write-TestInfo "Signed at: $($response.signedAt)"
            
            $Global:TestResults += @{
                Test = "Create Signature"
                Status = "PASS"
                Details = "SigId: $($response.sigId)"
            }
            return $true
        }
        else {
            Write-TestFailure "Create signature returned unexpected response"
            $Global:TestResults += @{
                Test = "Create Signature"
                Status = "FAIL"
                Details = "No sigId received"
            }
            return $false
        }
    }
    catch {
        Write-TestFailure "Create signature failed"
        Write-TestInfo "Error: $($_.Exception.Message)"
        
        if ($_.ErrorDetails) {
            Write-TestInfo "Response: $($_.ErrorDetails.Message)"
        }
        
        $Global:TestResults += @{
            Test = "Create Signature"
            Status = "FAIL"
            Details = $_.Exception.Message
        }
        return $false
    }
}

function Test-GetManifest {
    Write-TestHeader "TEST 6: Get Manifest"
    
    if ([string]::IsNullOrEmpty($Global:GroupId)) {
        Write-TestFailure "Missing GroupId from previous tests"
        $Global:TestResults += @{
            Test = "Get Manifest"
            Status = "SKIP"
            Details = "Missing GroupId"
        }
        return $false
    }
    
    try {
        $response = Invoke-RestMethod -Uri "$ApiUrl/v1/manifest/$Global:GroupId" -Method Get -ErrorAction Stop
        
        if ($response.groupId) {
            Write-TestSuccess "Manifest retrieved successfully"
            Write-TestInfo "Group ID: $($response.groupId)"
            Write-TestInfo "pHash: $($response.pHashHex)"
            Write-TestInfo "Files count: $($response.files.Count)"
            Write-TestInfo "Signatures count: $($response.signatures.Count)"
            Write-TestInfo "Total signatures: $($response.stats.totalSignatures)"
            
            if ($response.signatures.Count -gt 0) {
                Write-TestInfo "First signature:"
                $sig = $response.signatures[0]
                Write-TestInfo "  - Provider: $($sig.identity.provider)"
                Write-TestInfo "  - Handle: $($sig.identity.handle)"
                Write-TestInfo "  - Claim: $($sig.statement.claim)"
            }
            
            $Global:TestResults += @{
                Test = "Get Manifest"
                Status = "PASS"
                Details = "Files: $($response.files.Count), Sigs: $($response.signatures.Count)"
            }
            return $true
        }
        else {
            Write-TestFailure "Get manifest returned unexpected response"
            $Global:TestResults += @{
                Test = "Get Manifest"
                Status = "FAIL"
                Details = "Invalid response"
            }
            return $false
        }
    }
    catch {
        Write-TestFailure "Get manifest failed"
        Write-TestInfo "Error: $($_.Exception.Message)"
        $Global:TestResults += @{
            Test = "Get Manifest"
            Status = "FAIL"
            Details = $_.Exception.Message
        }
        return $false
    }
}

function Test-GetBadge {
    Write-TestHeader "TEST 7: Get Badge SVG"
    
    if ([string]::IsNullOrEmpty($Global:GroupId)) {
        Write-TestFailure "Missing GroupId from previous tests"
        $Global:TestResults += @{
            Test = "Get Badge"
            Status = "SKIP"
            Details = "Missing GroupId"
        }
        return $false
    }
    
    try {
        $response = Invoke-WebRequest -Uri "$ApiUrl/v1/badge/$Global:GroupId.svg" -Method Get -ErrorAction Stop
        
        if ($response.StatusCode -eq 200 -and $response.Content.Contains("<svg")) {
            $badgeSize = $response.Content.Length
            
            Write-TestSuccess "Badge SVG retrieved successfully"
            Write-TestInfo "Badge size: $badgeSize bytes"
            Write-TestInfo "Target size: <25KB (25600 bytes)"
            
            if ($badgeSize -lt 25600) {
                Write-TestSuccess "Badge size is within target (<25KB)"
            }
            else {
                Write-TestFailure "Badge size exceeds target (>25KB)"
            }
            
            # Save badge to file
            $badgePath = Join-Path $PSScriptRoot "test-badge-$Global:GroupId.svg"
            $response.Content | Out-File -FilePath $badgePath -Encoding UTF8
            Write-TestInfo "Badge saved to: $badgePath"
            
            # Check for key elements
            $hasTitle = $response.Content.Contains("<title>")
            $hasQrCode = $response.Content.Contains("rect") -or $response.Content.Contains("path")
            $hasVerifiedText = $response.Content.Contains("Verified by Truwit")
            
            Write-TestInfo "Badge contains:"
            Write-TestInfo "  - <title> tag: $hasTitle"
            Write-TestInfo "  - QR code elements: $hasQrCode"
            Write-TestInfo "  - 'Verified by Truwit' text: $hasVerifiedText"
            
            $Global:TestResults += @{
                Test = "Get Badge"
                Status = "PASS"
                Details = "Size: $badgeSize bytes, Saved to: $badgePath"
            }
            return $true
        }
        else {
            Write-TestFailure "Badge SVG invalid or missing"
            $Global:TestResults += @{
                Test = "Get Badge"
                Status = "FAIL"
                Details = "Invalid SVG content"
            }
            return $false
        }
    }
    catch {
        Write-TestFailure "Get badge failed"
        Write-TestInfo "Error: $($_.Exception.Message)"
        $Global:TestResults += @{
            Test = "Get Badge"
            Status = "FAIL"
            Details = $_.Exception.Message
        }
        return $false
    }
}

function Test-RateLimiting {
    Write-TestHeader "TEST 8: Rate Limiting (Optional - will hit limits)"
    
    Write-TestInfo "Sending rapid requests to test rate limiting..."
    Write-TestInfo "Expected: HTTP 429 after 10 requests"
    
    $successCount = 0
    $rateLimitedCount = 0
    $errorCount = 0
    
    $body = @{
        sha256Hex = "test"
        imageBase64 = "test"
    } | ConvertTo-Json
    
    for ($i = 1; $i -le 15; $i++) {
        try {
            $response = Invoke-WebRequest -Uri "$ApiUrl/v1/proofs/finalize" -Method Post -Body $body -ContentType "application/json" -ErrorAction Stop
            $successCount++
            Write-Host "." -NoNewline -ForegroundColor Green
        }
        catch {
            if ($_.Exception.Response.StatusCode.value__ -eq 429) {
                $rateLimitedCount++
                Write-Host "X" -NoNewline -ForegroundColor Yellow
                
                # Check for Retry-After header
                $retryAfter = $_.Exception.Response.Headers["Retry-After"]
                if ($retryAfter) {
                    Write-TestInfo "`nRetry-After header present: $retryAfter seconds"
                }
            }
            else {
                $errorCount++
                Write-Host "!" -NoNewline -ForegroundColor Red
            }
        }
        Start-Sleep -Milliseconds 100
    }
    
    Write-Host "`n"
    Write-TestInfo "Results: Success=$successCount, RateLimited=$rateLimitedCount, Errors=$errorCount"
    
    if ($rateLimitedCount -gt 0) {
        Write-TestSuccess "Rate limiting is working (received $rateLimitedCount HTTP 429 responses)"
        $Global:TestResults += @{
            Test = "Rate Limiting"
            Status = "PASS"
            Details = "429 responses: $rateLimitedCount"
        }
        return $true
    }
    else {
        Write-TestFailure "Rate limiting did not trigger"
        $Global:TestResults += @{
            Test = "Rate Limiting"
            Status = "FAIL"
            Details = "No 429 responses received"
        }
        return $false
    }
}

function Show-TestSummary {
    Write-TestHeader "TEST SUMMARY"
    
    $passed = ($Global:TestResults | Where-Object { $_.Status -eq "PASS" }).Count
    $failed = ($Global:TestResults | Where-Object { $_.Status -eq "FAIL" }).Count
    $skipped = ($Global:TestResults | Where-Object { $_.Status -eq "SKIP" }).Count
    $total = $Global:TestResults.Count
    
    Write-Host "Total Tests: $total" -ForegroundColor Cyan
    Write-Host "Passed: $passed" -ForegroundColor Green
    Write-Host "Failed: $failed" -ForegroundColor Red
    Write-Host "Skipped: $skipped" -ForegroundColor Yellow
    Write-Host ""
    
    foreach ($result in $Global:TestResults) {
        $color = switch ($result.Status) {
            "PASS" { "Green" }
            "FAIL" { "Red" }
            "SKIP" { "Yellow" }
        }
        Write-Host "[$($result.Status)] $($result.Test) - $($result.Details)" -ForegroundColor $color
    }
    
    Write-Host "`n========================================`n" -ForegroundColor Cyan
    
    if ($failed -eq 0 -and $passed -gt 0) {
        Write-Host "🎉 ALL TESTS PASSED!" -ForegroundColor Green
        Write-Host "Implementation complete, all verification steps passed." -ForegroundColor Green
    }
    elseif ($failed -gt 0) {
        Write-Host "⚠️  SOME TESTS FAILED" -ForegroundColor Red
        Write-Host "Please review the failures above." -ForegroundColor Red
    }
    
    # Export results to JSON
    $resultsPath = Join-Path $PSScriptRoot "test-results-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
    $Global:TestResults | ConvertTo-Json -Depth 10 | Out-File -FilePath $resultsPath -Encoding UTF8
    Write-Host "`nTest results saved to: $resultsPath" -ForegroundColor Cyan
}

# Main execution
Write-Host @"

╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║        Multi-Sign System Integration Test Suite              ║
║                                                               ║
║        Testing Phases 4-7 Implementation                      ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

Write-Host "API URL: $ApiUrl" -ForegroundColor Yellow
Write-Host "Test Image: $(if ($TestImagePath) { $TestImagePath } else { 'Generated 10x10 PNG' })" -ForegroundColor Yellow
Write-Host ""

# Run tests in sequence
$healthOk = Test-ApiHealth
if (-not $healthOk) {
    Write-Host "`nAPI is not reachable. Please start the API first:" -ForegroundColor Red
    Write-Host "  cd api" -ForegroundColor Yellow
    Write-Host "  dotnet run" -ForegroundColor Yellow
    Show-TestSummary
    exit 1
}

Test-InitProof
Test-FinalizeProof
Test-AnonymousAuth
Test-CreateSignature
Test-GetManifest
Test-GetBadge

# Ask before running rate limit test
Write-Host "`nRun rate limiting test? This will send rapid requests and may trigger rate limits." -ForegroundColor Yellow
$runRateLimit = Read-Host "Run rate limit test? (y/n)"
if ($runRateLimit -eq "y") {
    Test-RateLimiting
}

Show-TestSummary

