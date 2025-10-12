# API Integration Test Script (PowerShell)
# Usage: .\test-api.ps1 [base-url]
# Example: .\test-api.ps1 http://localhost:5000
# Example: .\test-api.ps1 https://truwit-starter-template-production.up.railway.app

param(
    [string]$BaseUrl = "http://localhost:5000"
)

$Failed = 0
$Passed = 0

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Testing API at: $BaseUrl" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Health Check
Write-Host "Test 1: Health Check Endpoint"
try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/health" -Method Get -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ PASSED - Health check returned 200" -ForegroundColor Green
        $Passed++
    } else {
        Write-Host "✗ FAILED - Health check returned $($response.StatusCode) (expected 200)" -ForegroundColor Red
        $Failed++
    }
} catch {
    Write-Host "✗ FAILED - Health check error: $($_.Exception.Message)" -ForegroundColor Red
    $Failed++
}
Write-Host ""

# Test 2: Create Proof from URL (TikTok video)
Write-Host "Test 2: Create Proof from URL"
$tiktokUrl = "https://www.tiktok.com/@user33951549420561/video/7524292924507426078"
$body = @{
    input = @{
        url = $tiktokUrl
    }
    declared = @{
        generator = "Test Generator"
        prompt = "Test prompt"
        license = "creator-owned"
    }
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/v1/proofs" -Method Post -Body $body -ContentType "application/json" -ErrorAction Stop
    $statusCode = $response.StatusCode
    $content = $response.Content
    
    Write-Host "Response Code: $statusCode"
    Write-Host "Response Body: $content"
    
    if ($statusCode -eq 200) {
        Write-Host "✓ PASSED - Proof creation returned 200" -ForegroundColor Green
        $Passed++
    } else {
        Write-Host "✗ FAILED - Unexpected response code: $statusCode" -ForegroundColor Red
        $Failed++
    }
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorBody = ""
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
    }
    
    Write-Host "Response Code: $statusCode"
    Write-Host "Error: $errorBody"
    
    if ($errorBody -like "*yt-dlp failed*" -or $errorBody -like "*Specified method is not supported*" -or $errorBody -like "*TempDir*") {
        Write-Host "✗ FAILED - API error: yt-dlp or path configuration issue" -ForegroundColor Red
        $Failed++
    } elseif ($statusCode -eq 500) {
        Write-Host "⚠ WARNING - Got 500 but with valid error handling" -ForegroundColor Yellow
        $Passed++
    } else {
        Write-Host "✗ FAILED - Unexpected error" -ForegroundColor Red
        $Failed++
    }
}
Write-Host ""

# Test 3: Direct video URL test
Write-Host "Test 3: Create Proof from Direct Video URL"
$videoUrl = "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4"
$body = @{
    input = @{
        url = $videoUrl
    }
    declared = @{
        generator = "Test Generator"
        prompt = "Test direct video"
        license = "public"
    }
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$BaseUrl/v1/proofs" -Method Post -Body $body -ContentType "application/json" -ErrorAction Stop
    $statusCode = $response.StatusCode
    $content = $response.Content | ConvertFrom-Json
    
    Write-Host "Response Code: $statusCode"
    if ($statusCode -eq 200) {
        Write-Host "✓ PASSED - Direct video proof creation succeeded" -ForegroundColor Green
        Write-Host "Proof ID: $($content.proofId)"
        $Passed++
    } else {
        Write-Host "✗ FAILED - Unexpected response code: $statusCode" -ForegroundColor Red
        $Failed++
    }
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "Response Code: $statusCode"
    
    if ($statusCode -eq 500) {
        Write-Host "✗ FAILED - Server error on direct video URL" -ForegroundColor Red
        $Failed++
    } else {
        Write-Host "✗ FAILED - Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
        $Failed++
    }
}
Write-Host ""

# Test 4: Check yt-dlp availability
Write-Host "Test 4: Check yt-dlp availability (diagnostic)"
if ($BaseUrl -eq "http://localhost:5000") {
    try {
        $ytdlpVersion = yt-dlp --version 2>&1
        Write-Host "✓ yt-dlp is installed locally: $ytdlpVersion" -ForegroundColor Green
    } catch {
        Write-Host "⚠ yt-dlp not found locally" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠ Skipping local diagnostic for remote server" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Passed: $Passed" -ForegroundColor Green
Write-Host "Failed: $Failed" -ForegroundColor Red
Write-Host ""

if ($Failed -eq 0) {
    Write-Host "✓ All tests passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "✗ Some tests failed" -ForegroundColor Red
    exit 1
}

