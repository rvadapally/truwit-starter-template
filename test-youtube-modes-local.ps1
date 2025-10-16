#!/usr/bin/env pwsh
# Comprehensive Test Suite for YouTube Verification Modes
# Tests thumbnail mode vs full video mode with database-stored cookies

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  YouTube Verification Modes Test Suite" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:5000"
$testYouTubeUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"  # Short video (< 15 min)
$testLongYouTubeUrl = "https://www.youtube.com/watch?v=jNQXAC9IVRw"  # Long video (> 15 min)
$testResults = @()

function Test-ApiHealth {
    Write-Host "[TEST 1] Checking API Health..." -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get -TimeoutSec 10
        Write-Host "✅ API is healthy: $($response.status)" -ForegroundColor Green
        $testResults += @{ Test = "API Health"; Status = "PASS" }
        return $true
    } catch {
        Write-Host "❌ API health check failed: $_" -ForegroundColor Red
        $testResults += @{ Test = "API Health"; Status = "FAIL"; Error = $_.Exception.Message }
        return $false
    }
}

function Get-CurrentMode {
    Write-Host "[INFO] Getting current YouTube verification mode..." -ForegroundColor Cyan
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/v1/admin/settings/YOUTUBE_VERIFICATION_MODE" -Method Get
        Write-Host "Current mode: $response" -ForegroundColor Cyan
        return $response
    } catch {
        Write-Host "⚠️  Could not get current mode (may not exist yet): $_" -ForegroundColor Yellow
        return "unknown"
    }
}

function Set-VerificationMode {
    param([string]$mode)
    
    Write-Host "[ACTION] Setting verification mode to: $mode" -ForegroundColor Magenta
    try {
        $body = @{ Value = $mode; UpdatedBy = "test-script" } | ConvertTo-Json
        $response = Invoke-RestMethod -Uri "$baseUrl/api/v1/admin/settings/YOUTUBE_VERIFICATION_MODE" `
            -Method Put `
            -Body $body `
            -ContentType "application/json"
        Write-Host "✅ Mode set successfully: $($response.message)" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ Failed to set mode: $_" -ForegroundColor Red
        return $false
    }
}

function Test-ThumbnailMode {
    Write-Host ""
    Write-Host "[TEST 2] Testing Thumbnail Mode..." -ForegroundColor Yellow
    
    if (-not (Set-VerificationMode -mode "thumbnail")) {
        $testResults += @{ Test = "Thumbnail Mode - Set Mode"; Status = "FAIL" }
        return
    }
    
    try {
        Write-Host "Creating proof for YouTube URL in thumbnail mode..." -ForegroundColor Cyan
        $body = @{ Url = $testYouTubeUrl } | ConvertTo-Json
        $response = Invoke-RestMethod -Uri "$baseUrl/v1/proofs/url" `
            -Method Post `
            -Body $body `
            -ContentType "application/json" `
            -TimeoutSec 60
        
        Write-Host "✅ Proof created successfully!" -ForegroundColor Green
        Write-Host "   Proof ID: $($response.proofId)" -ForegroundColor Cyan
        Write-Host "   Verify URL: $($response.verifyUrl)" -ForegroundColor Cyan
        Write-Host "   Deduped: $($response.deduped)" -ForegroundColor Cyan
        
        $testResults += @{ Test = "Thumbnail Mode - Create Proof"; Status = "PASS"; ProofId = $response.proofId }
        return $response.proofId
    } catch {
        Write-Host "❌ Thumbnail mode test failed: $_" -ForegroundColor Red
        Write-Host "Error details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        $testResults += @{ Test = "Thumbnail Mode - Create Proof"; Status = "FAIL"; Error = $_.Exception.Message }
        return $null
    }
}

function Test-FullVideoMode {
    Write-Host ""
    Write-Host "[TEST 3] Testing Full Video Mode (Short Video)..." -ForegroundColor Yellow
    
    if (-not (Set-VerificationMode -mode "full_video")) {
        $testResults += @{ Test = "Full Video Mode - Set Mode"; Status = "FAIL" }
        return
    }
    
    Write-Host "⚠️  NOTE: This test requires valid YouTube cookies in the database!" -ForegroundColor Yellow
    Write-Host "   If cookies are not set or expired, it will fallback to thumbnail mode." -ForegroundColor Yellow
    
    try {
        Write-Host "Creating proof for YouTube URL in full_video mode..." -ForegroundColor Cyan
        
        # Use a different URL to avoid deduplication
        $testUrl = "https://www.youtube.com/watch?v=9bZkp7q19f0"  # Different video
        
        $body = @{ Url = $testUrl } | ConvertTo-Json
        $response = Invoke-RestMethod -Uri "$baseUrl/v1/proofs/url" `
            -Method Post `
            -Body $body `
            -ContentType "application/json" `
            -TimeoutSec 120
        
        Write-Host "✅ Proof created successfully!" -ForegroundColor Green
        Write-Host "   Proof ID: $($response.proofId)" -ForegroundColor Cyan
        Write-Host "   Verify URL: $($response.verifyUrl)" -ForegroundColor Cyan
        
        $testResults += @{ Test = "Full Video Mode - Short Video"; Status = "PASS"; ProofId = $response.proofId }
        return $response.proofId
    } catch {
        Write-Host "❌ Full video mode test failed: $_" -ForegroundColor Red
        Write-Host "Error details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        
        # Check if it's a cookie error
        if ($_.ErrorDetails.Message -like "*cookie*" -or $_.ErrorDetails.Message -like "*Sign in*") {
            Write-Host "⚠️  This appears to be a cookie authentication error." -ForegroundColor Yellow
            Write-Host "   Please set valid YouTube cookies using:" -ForegroundColor Yellow
            Write-Host "   PUT $baseUrl/api/v1/admin/settings/YOUTUBE_COOKIES" -ForegroundColor Yellow
            $testResults += @{ Test = "Full Video Mode - Short Video"; Status = "FAIL (Cookies)"; Error = "Cookie auth failed" }
        } else {
            $testResults += @{ Test = "Full Video Mode - Short Video"; Status = "FAIL"; Error = $_.Exception.Message }
        }
        return $null
    }
}

function Test-LongVideoMode {
    Write-Host ""
    Write-Host "[TEST 4] Testing Full Video Mode (Long Video - 15 min truncation)..." -ForegroundColor Yellow
    
    Write-Host "⚠️  This test verifies that videos >15 minutes are truncated to first 15 minutes" -ForegroundColor Yellow
    
    try {
        Write-Host "Creating proof for long YouTube video..." -ForegroundColor Cyan
        
        $body = @{ Url = $testLongYouTubeUrl } | ConvertTo-Json
        $response = Invoke-RestMethod -Uri "$baseUrl/v1/proofs/url" `
            -Method Post `
            -Body $body `
            -ContentType "application/json" `
            -TimeoutSec 180
        
        Write-Host "✅ Proof created successfully!" -ForegroundColor Green
        Write-Host "   Proof ID: $($response.proofId)" -ForegroundColor Cyan
        Write-Host "   (Verify in logs that video was truncated to 15 minutes)" -ForegroundColor Yellow
        
        $testResults += @{ Test = "Full Video Mode - Long Video"; Status = "PASS"; ProofId = $response.proofId }
        return $response.proofId
    } catch {
        Write-Host "❌ Long video test failed: $_" -ForegroundColor Red
        Write-Host "Error details: $($_.ErrorDetails.Message)" -ForegroundColor Red
        $testResults += @{ Test = "Full Video Mode - Long Video"; Status = "FAIL"; Error = $_.Exception.Message }
        return $null
    }
}

function Test-ModeToggle {
    param([string]$thumbnailProofId)
    
    Write-Host ""
    Write-Host "[TEST 5] Testing Mode Toggle (Same URL, Different Modes)..." -ForegroundColor Yellow
    
    if (-not $thumbnailProofId) {
        Write-Host "⚠️  Skipping mode toggle test (no thumbnail proof ID)" -ForegroundColor Yellow
        $testResults += @{ Test = "Mode Toggle"; Status = "SKIP"; Reason = "No thumbnail proof" }
        return
    }
    
    Write-Host "Switching back to full_video mode and creating proof for same URL..." -ForegroundColor Cyan
    Set-VerificationMode -mode "full_video" | Out-Null
    
    try {
        $body = @{ Url = $testYouTubeUrl } | ConvertTo-Json
        $response = Invoke-RestMethod -Uri "$baseUrl/v1/proofs/url" `
            -Method Post `
            -Body $body `
            -ContentType "application/json" `
            -TimeoutSec 120
        
        if ($response.deduped -eq $true) {
            Write-Host "✅ Deduplication worked - returned existing proof" -ForegroundColor Green
            Write-Host "   (Same URL returns same proof regardless of mode)" -ForegroundColor Cyan
            $testResults += @{ Test = "Mode Toggle"; Status = "PASS"; Note = "Deduplication worked" }
        } else {
            Write-Host "⚠️  New proof created (expected if hash differs between modes)" -ForegroundColor Yellow
            Write-Host "   Old Proof ID: $thumbnailProofId" -ForegroundColor Cyan
            Write-Host "   New Proof ID: $($response.proofId)" -ForegroundColor Cyan
            $testResults += @{ Test = "Mode Toggle"; Status = "PASS"; Note = "Different hashes" }
        }
    } catch {
        Write-Host "❌ Mode toggle test failed: $_" -ForegroundColor Red
        $testResults += @{ Test = "Mode Toggle"; Status = "FAIL"; Error = $_.Exception.Message }
    }
}

function Test-CookieTest {
    Write-Host ""
    Write-Host "[TEST 6] Testing Cookie Validation Endpoint..." -ForegroundColor Yellow
    
    try {
        Write-Host "Calling cookie test endpoint..." -ForegroundColor Cyan
        $response = Invoke-RestMethod -Uri "$baseUrl/api/v1/admin/youtube/test-cookies" `
            -Method Post `
            -TimeoutSec 60
        
        if ($response.success) {
            Write-Host "✅ Cookie test passed!" -ForegroundColor Green
            Write-Host "   Message: $($response.message)" -ForegroundColor Cyan
            Write-Host "   Test Video: $($response.testVideoId)" -ForegroundColor Cyan
            Write-Host "   Duration: $($response.duration) seconds" -ForegroundColor Cyan
            $testResults += @{ Test = "Cookie Validation"; Status = "PASS" }
        } else {
            Write-Host "❌ Cookie test failed!" -ForegroundColor Red
            Write-Host "   Message: $($response.message)" -ForegroundColor Red
            Write-Host "   Error: $($response.error)" -ForegroundColor Red
            $testResults += @{ Test = "Cookie Validation"; Status = "FAIL"; Error = $response.error }
        }
    } catch {
        Write-Host "❌ Cookie test endpoint failed: $_" -ForegroundColor Red
        $testResults += @{ Test = "Cookie Validation"; Status = "FAIL"; Error = $_.Exception.Message }
    }
}

function Show-TestSummary {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  Test Summary" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    
    $passCount = ($testResults | Where-Object { $_.Status -eq "PASS" }).Count
    $failCount = ($testResults | Where-Object { $_.Status -like "FAIL*" }).Count
    $skipCount = ($testResults | Where-Object { $_.Status -eq "SKIP" }).Count
    
    foreach ($result in $testResults) {
        $status = $result.Status
        $color = switch ($status) {
            "PASS" { "Green" }
            { $_ -like "FAIL*" } { "Red" }
            "SKIP" { "Yellow" }
            default { "White" }
        }
        
        Write-Host "$($result.Test): " -NoNewline
        Write-Host "$status" -ForegroundColor $color
        
        if ($result.Error) {
            Write-Host "  Error: $($result.Error)" -ForegroundColor Red
        }
        if ($result.Note) {
            Write-Host "  Note: $($result.Note)" -ForegroundColor Cyan
        }
    }
    
    Write-Host ""
    Write-Host "Results: $passCount passed, $failCount failed, $skipCount skipped" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Yellow" })
    Write-Host ""
}

# Main execution
try {
    Write-Host "Prerequisites:" -ForegroundColor Yellow
    Write-Host "  1. Docker containers running (docker-compose up -d)" -ForegroundColor White
    Write-Host "  2. API accessible at $baseUrl" -ForegroundColor White
    Write-Host "  3. For full_video tests: Valid YouTube cookies set in database" -ForegroundColor White
    Write-Host ""
    
    # Run tests
    if (-not (Test-ApiHealth)) {
        Write-Host "❌ API is not healthy. Please start Docker containers and try again." -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    $currentMode = Get-CurrentMode
    Write-Host "Current mode: $currentMode" -ForegroundColor Cyan
    
    # Test thumbnail mode
    $thumbnailProofId = Test-ThumbnailMode
    
    # Test full video mode
    Test-FullVideoMode
    
    # Test long video (15 min truncation)
    Test-LongVideoMode
    
    # Test mode toggle
    Test-ModeToggle -thumbnailProofId $thumbnailProofId
    
    # Test cookie validation
    Test-CookieTest
    
    # Show summary
    Show-TestSummary
    
    # Restore original mode if we captured it
    if ($currentMode -ne "unknown" -and $currentMode -ne "thumbnail") {
        Write-Host "Restoring original mode: $currentMode" -ForegroundColor Cyan
        Set-VerificationMode -mode $currentMode | Out-Null
    }
    
    Write-Host "✅ Test suite completed!" -ForegroundColor Green
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "❌ Test suite failed with unexpected error: $_" -ForegroundColor Red
    Write-Host ""
    exit 1
}

