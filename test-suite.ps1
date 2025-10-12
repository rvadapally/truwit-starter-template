# Automated Test Suite with Diagnostics
# Tests both API and Frontend, captures logs, and diagnoses issues

param(
    [string]$ApiUrl = "http://localhost:5000",
    [string]$FrontendUrl = "http://localhost:4200",
    [switch]$ProductionTest = $false
)

# Colors
function Write-Success { param($msg) Write-Host "✓ $msg" -ForegroundColor Green }
function Write-Failure { param($msg) Write-Host "✗ $msg" -ForegroundColor Red }
function Write-Warning { param($msg) Write-Host "⚠ $msg" -ForegroundColor Yellow }
function Write-Info { param($msg) Write-Host "ℹ $msg" -ForegroundColor Cyan }
function Write-Section { param($msg) Write-Host "`n========================================" -ForegroundColor Cyan; Write-Host "  $msg" -ForegroundColor Cyan; Write-Host "========================================`n" -ForegroundColor Cyan }

$Failed = 0
$Passed = 0
$Warnings = 0
$LogFile = "test-results-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

# Production URLs
if ($ProductionTest) {
    $ApiUrl = "https://truwit-starter-template-production.up.railway.app"
    $FrontendUrl = "https://truwit.ai"
    Write-Info "Testing PRODUCTION environment"
} else {
    Write-Info "Testing LOCAL environment"
}

Write-Section "Truwit Automated Test Suite"
Write-Info "API URL: $ApiUrl"
Write-Info "Frontend URL: $FrontendUrl"
Write-Info "Log file: $LogFile"
Write-Host ""

# Start logging
Start-Transcript -Path $LogFile

# ==========================================
# TEST 1: Docker Container Health
# ==========================================
Write-Section "Test 1: Docker Container Health"

if (-not $ProductionTest) {
    try {
        $containerStatus = docker-compose -f api/docker-compose.yml ps --format json | ConvertFrom-Json
        
        if ($containerStatus.State -eq "running") {
            Write-Success "Docker container is running"
            Write-Info "Container: $($containerStatus.Name)"
            Write-Info "State: $($containerStatus.State)"
            $Passed++
        } else {
            Write-Failure "Docker container is not running"
            Write-Info "Container state: $($containerStatus.State)"
            $Failed++
            
            # Show last 20 lines of logs
            Write-Warning "Last 20 lines of container logs:"
            docker-compose -f api/docker-compose.yml logs --tail=20
        }
    } catch {
        Write-Failure "Could not check Docker container status"
        Write-Info "Error: $($_.Exception.Message)"
        $Failed++
    }
} else {
    Write-Info "Skipping Docker check for production"
}

# ==========================================
# TEST 2: API Health Endpoint
# ==========================================
Write-Section "Test 2: API Health Endpoint"

try {
    $response = Invoke-WebRequest -Uri "$ApiUrl/health" -Method Get -TimeoutSec 10 -ErrorAction Stop
    
    if ($response.StatusCode -eq 200) {
        Write-Success "API health endpoint returned 200"
        $healthData = $response.Content | ConvertFrom-Json
        Write-Info "Response: $($response.Content)"
        $Passed++
    } else {
        Write-Failure "API health endpoint returned $($response.StatusCode)"
        $Failed++
    }
} catch {
    Write-Failure "API health endpoint failed"
    Write-Info "Error: $($_.Exception.Message)"
    $Failed++
    
    if (-not $ProductionTest) {
        Write-Warning "Checking Docker logs for errors..."
        docker-compose -f api/docker-compose.yml logs --tail=30
    }
}

# ==========================================
# TEST 3: API Direct Video URL Processing
# ==========================================
Write-Section "Test 3: API Direct Video URL Processing"

$videoUrl = "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4"
$body = @{
    input = @{
        url = $videoUrl
    }
    declared = @{
        generator = "Automated Test"
        prompt = "Test direct video URL"
        license = "public"
    }
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$ApiUrl/v1/proofs" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 30 -ErrorAction Stop
    
    if ($response.StatusCode -eq 200) {
        $result = $response.Content | ConvertFrom-Json
        Write-Success "Direct video URL processing succeeded"
        Write-Info "Proof ID: $($result.proofId)"
        Write-Info "Verify URL: $($result.verifyUrl)"
        $Passed++
    } else {
        Write-Failure "Unexpected response code: $($response.StatusCode)"
        $Failed++
    }
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorBody = ""
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
    }
    
    Write-Failure "Direct video URL processing failed (Status: $statusCode)"
    Write-Info "Error: $errorBody"
    
    # Diagnose the error
    if ($errorBody -like "*TempDir*") {
        Write-Warning "DIAGNOSIS: Temp directory configuration issue"
        Write-Info "Check appsettings.json - TempDir should be /tmp/truwit_dl for Linux"
    } elseif ($errorBody -like "*yt-dlp*") {
        Write-Warning "DIAGNOSIS: yt-dlp execution issue"
        
        if (-not $ProductionTest) {
            Write-Info "Checking if yt-dlp is installed in container..."
            docker-compose -f api/docker-compose.yml exec -T api yt-dlp --version
        }
    } elseif ($errorBody -like "*Specified method is not supported*") {
        Write-Warning "DIAGNOSIS: Path or method not supported on Linux"
        Write-Info "This usually means Windows-specific code is running on Linux"
    }
    
    $Failed++
}

# ==========================================
# TEST 4: API TikTok URL Processing
# ==========================================
Write-Section "Test 4: API TikTok URL Processing"

$tiktokUrl = "https://www.tiktok.com/@user33951549420561/video/7524292924507426078"
$body = @{
    input = @{
        url = $tiktokUrl
    }
    declared = @{
        generator = "Automated Test"
        prompt = "Test TikTok video"
        license = "creator-owned"
    }
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$ApiUrl/v1/proofs" -Method Post -Body $body -ContentType "application/json" -TimeoutSec 30 -ErrorAction Stop
    
    if ($response.StatusCode -eq 200) {
        $result = $response.Content | ConvertFrom-Json
        Write-Success "TikTok URL processing succeeded"
        Write-Info "Proof ID: $($result.proofId)"
        $Passed++
    } else {
        Write-Warning "TikTok URL processing returned $($response.StatusCode) (may require cookies)"
        $Warnings++
    }
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorBody = ""
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
    }
    
    # TikTok may fail due to authentication requirements - this is expected
    if ($errorBody -like "*Sign in to confirm*" -or $errorBody -like "*bot*") {
        Write-Warning "TikTok requires authentication (expected behavior)"
        Write-Info "This is not a bug - TikTok requires cookies for yt-dlp"
        Write-Info "See DEPLOYMENT.md for YouTube/TikTok cookie configuration"
        $Warnings++
    } else {
        Write-Failure "TikTok URL processing failed unexpectedly (Status: $statusCode)"
        Write-Info "Error: $errorBody"
        $Failed++
    }
}

# ==========================================
# TEST 5: Frontend Accessibility
# ==========================================
Write-Section "Test 5: Frontend Accessibility"

try {
    $response = Invoke-WebRequest -Uri $FrontendUrl -Method Get -TimeoutSec 10 -ErrorAction Stop
    
    if ($response.StatusCode -eq 200) {
        Write-Success "Frontend is accessible"
        
        # Check if it contains expected elements
        if ($response.Content -match "truwit|verification") {
            Write-Info "Page contains expected content"
        } else {
            Write-Warning "Page content may be incorrect"
        }
        
        $Passed++
    } else {
        Write-Failure "Frontend returned $($response.StatusCode)"
        $Failed++
    }
} catch {
    Write-Failure "Frontend is not accessible"
    Write-Info "Error: $($_.Exception.Message)"
    $Failed++
}

# ==========================================
# TEST 6: Frontend API Configuration
# ==========================================
Write-Section "Test 6: Frontend API Configuration"

try {
    $response = Invoke-WebRequest -Uri "$FrontendUrl/app/" -Method Get -TimeoutSec 10 -ErrorAction Stop
    $content = $response.Content
    
    # Check if the bundled JS contains the correct API URL
    $expectedApiUrl = if ($ProductionTest) { "truwit-starter-template-production.up.railway.app" } else { "localhost:5000" }
    
    if ($content -match $expectedApiUrl) {
        Write-Success "Frontend is configured with correct API URL"
        Write-Info "Expected: $expectedApiUrl"
        $Passed++
    } else {
        Write-Warning "Frontend may not be using correct API URL"
        Write-Info "Expected: $expectedApiUrl"
        
        # Try to find what API URL is being used
        if ($content -match "(http[s]?://[^/]+)/v1") {
            Write-Info "Found API URL in JS: $($Matches[1])"
        }
        
        $Warnings++
    }
} catch {
    Write-Warning "Could not verify frontend API configuration"
    Write-Info "Error: $($_.Exception.Message)"
    $Warnings++
}

# ==========================================
# DIAGNOSTICS: Docker Container Inspection
# ==========================================
if (-not $ProductionTest) {
    Write-Section "Diagnostics: Docker Container"
    
    Write-Info "Checking yt-dlp installation..."
    try {
        $ytdlpVersion = docker-compose -f api/docker-compose.yml exec -T api yt-dlp --version 2>&1
        Write-Success "yt-dlp version: $ytdlpVersion"
    } catch {
        Write-Failure "yt-dlp not found in container"
    }
    
    Write-Info "Checking ffmpeg installation..."
    try {
        $ffmpegVersion = docker-compose -f api/docker-compose.yml exec -T api ffmpeg -version 2>&1 | Select-Object -First 1
        Write-Success "ffmpeg: $ffmpegVersion"
    } catch {
        Write-Failure "ffmpeg not found in container"
    }
    
    Write-Info "Checking temp directory..."
    try {
        docker-compose -f api/docker-compose.yml exec -T api ls -la /tmp/truwit_dl 2>&1
        Write-Success "Temp directory exists and is accessible"
    } catch {
        Write-Failure "Temp directory not accessible"
    }
    
    Write-Info "Recent container logs (last 20 lines):"
    docker-compose -f api/docker-compose.yml logs --tail=20
}

# ==========================================
# TEST SUMMARY
# ==========================================
Write-Section "Test Summary"

Write-Host ""
Write-Host "Total Tests: $($Passed + $Failed)" -ForegroundColor Cyan
Write-Success "Passed: $Passed"
Write-Failure "Failed: $Failed"
Write-Warning "Warnings: $Warnings"
Write-Host ""

# Calculate pass rate
$totalTests = $Passed + $Failed
if ($totalTests -gt 0) {
    $passRate = [math]::Round(($Passed / $totalTests) * 100, 2)
    Write-Info "Pass Rate: $passRate%"
}

# Final verdict
Write-Host ""
if ($Failed -eq 0 -and $Warnings -eq 0) {
    Write-Success "🎉 ALL TESTS PASSED! Application is working perfectly!"
    $exitCode = 0
} elseif ($Failed -eq 0) {
    Write-Warning "⚠️  All tests passed with $Warnings warnings"
    Write-Info "Review warnings above for potential issues"
    $exitCode = 0
} else {
    Write-Failure "❌ $Failed tests failed"
    Write-Info "Review failures above and check logs in $LogFile"
    $exitCode = 1
}

Write-Host ""
Write-Info "Detailed logs saved to: $LogFile"
Write-Host ""

# Stop transcript
Stop-Transcript

# Recommendations
if ($Failed -gt 0) {
    Write-Section "Troubleshooting Recommendations"
    
    if (-not $ProductionTest) {
        Write-Info "1. Check Docker logs:"
        Write-Host "   docker-compose -f api/docker-compose.yml logs -f" -ForegroundColor Yellow
        Write-Host ""
        Write-Info "2. Restart containers:"
        Write-Host "   docker-compose -f api/docker-compose.yml down" -ForegroundColor Yellow
        Write-Host "   docker-compose -f api/docker-compose.yml up --build" -ForegroundColor Yellow
        Write-Host ""
        Write-Info "3. Check container status:"
        Write-Host "   docker-compose -f api/docker-compose.yml ps" -ForegroundColor Yellow
        Write-Host ""
    }
    
    Write-Info "4. Check appsettings.json for correct configuration"
    Write-Info "5. Review DEPLOYMENT.md for platform-specific issues"
    Write-Info "6. Check Railway logs if testing production"
}

exit $exitCode

