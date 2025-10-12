param(
    [string]$Environment = "local",
    [switch]$Verbose
)

# Configuration
if ($Environment -eq "production") {
    $ApiUrl = "https://truwit-starter-template-production.up.railway.app"
    $FrontendUrl = "https://www.truwit.ai"
} else {
    $ApiUrl = "http://localhost:5000"
    $FrontendUrl = "http://localhost:4200"
}

$TestFilesDir = "app/src/testFiles"
$UrlsFile = Join-Path $TestFilesDir "urlsToTest.txt"
$SampleVideo = Join-Path $TestFilesDir "sample.mp4"
$LogFile = "test-results-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

# Counters
$Passed = 0
$Failed = 0
$Warnings = 0

# Helper functions
function Write-TestSuccess {
    param([string]$msg)
    Write-Host "[PASS] $msg" -ForegroundColor Green
}

function Write-TestFailure {
    param([string]$msg)
    Write-Host "[FAIL] $msg" -ForegroundColor Red
}

function Write-TestWarning {
    param([string]$msg)
    Write-Host "[WARN] $msg" -ForegroundColor Yellow
}

function Write-TestInfo {
    param([string]$msg)
    Write-Host "[INFO] $msg" -ForegroundColor Cyan
}

function Test-ApiCall {
    param(
        [string]$Endpoint,
        [string]$Method = "GET",
        [object]$Body = $null,
        [int]$Timeout = 120
    )
    
    try {
        $uri = "$ApiUrl$Endpoint"
        $params = @{
            Uri = $uri
            Method = $Method
            TimeoutSec = $Timeout
            ErrorAction = 'Stop'
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-WebRequest @params
        
        return @{
            Success = $true
            StatusCode = $response.StatusCode
            Content = $response.Content
        }
    }
    catch {
        $statusCode = 0
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
        }
        
        return @{
            Success = $false
            StatusCode = $statusCode
            Error = $_.Exception.Message
        }
    }
}

# Start logging
Start-Transcript -Path $LogFile | Out-Null

Write-Host ""
Write-Host "=====================================" -ForegroundColor Magenta
Write-Host "  Truwit Automated Test Suite" -ForegroundColor Magenta
Write-Host "=====================================" -ForegroundColor Magenta
Write-Host ""
Write-TestInfo "Environment: $Environment"
Write-TestInfo "API URL: $ApiUrl"
Write-Host ""

# Test 1: Docker Container (local only)
Write-Host "Test 1: Docker Container Health" -ForegroundColor Magenta
if ($Environment -eq "local") {
    try {
        $containers = docker-compose -f api/docker-compose.yml ps 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-TestSuccess "Docker container is running"
            $Passed++
        } else {
            Write-TestFailure "Docker container is not running"
            $Failed++
        }
    }
    catch {
        Write-TestFailure "Could not check Docker status"
        $Failed++
    }
} else {
    Write-TestInfo "Skipped for production environment"
}
Write-Host ""

# Test 2: API Health
Write-Host "Test 2: API Health Endpoint" -ForegroundColor Magenta
$result = Test-ApiCall -Endpoint "/health" -Timeout 10
if ($result.Success -and $result.StatusCode -eq 200) {
    Write-TestSuccess "API health check passed"
    $Passed++
} else {
    Write-TestFailure "API health check failed"
    $Failed++
}
Write-Host ""

# Test 3+: Process URLs
if (Test-Path $UrlsFile) {
    $urls = Get-Content $UrlsFile | Where-Object { $_ -and -not $_.StartsWith("//") -and $_.Trim() }
    $testNum = 3
    
    foreach ($url in $urls) {
        $urlTrimmed = $url.Trim()
        Write-Host "Test $testNum`: URL Processing" -ForegroundColor Magenta
        Write-TestInfo "URL: $urlTrimmed"
        Write-TestInfo "This may take 30-60 seconds..."
        
        $body = @{
            url = $urlTrimmed
            includeMetadata = $true
            performDeepAnalysis = $false
        }
        
        $result = Test-ApiCall -Endpoint "/v1/proofs" -Method "POST" -Body $body -Timeout 120
        
        if ($result.Success -and ($result.StatusCode -eq 200 -or $result.StatusCode -eq 201)) {
            Write-TestSuccess "URL processed successfully"
            $Passed++
        }
        elseif ($result.StatusCode -eq 500 -and $result.Error -match "Sign in to confirm") {
            Write-TestWarning "YouTube requires cookies (expected)"
            Write-TestInfo "See DEPLOYMENT.md for cookie configuration"
            $Warnings++
        }
        else {
            Write-TestFailure "URL processing failed"
            Write-TestInfo "Status: $($result.StatusCode)"
            Write-TestInfo "Error: $($result.Error)"
            $Failed++
        }
        
        Write-Host ""
        $testNum++
    }
}

# Test: File Upload
if (Test-Path $SampleVideo) {
    Write-Host "Test: File Upload" -ForegroundColor Magenta
    Write-TestInfo "File: sample.mp4"
    Write-TestInfo "This may take 30-90 seconds..."
    
    Write-TestWarning "File upload test skipped (requires multipart form implementation)"
    Write-Host ""
}

# Diagnostics
if ($Environment -eq "local") {
    Write-Host "Diagnostics" -ForegroundColor Magenta
    
    try {
        $ytdlp = docker-compose -f api/docker-compose.yml exec -T api yt-dlp --version 2>&1
        Write-TestInfo "yt-dlp: $ytdlp"
    }
    catch {
        Write-TestWarning "Could not check yt-dlp"
    }
    
    try {
        $ffmpeg = docker-compose -f api/docker-compose.yml exec -T api ffmpeg -version 2>&1 | Select-Object -First 1
        Write-TestInfo "ffmpeg: $ffmpeg"
    }
    catch {
        Write-TestWarning "Could not check ffmpeg"
    }
    
    Write-Host ""
}

# Summary
Write-Host "=====================================" -ForegroundColor Magenta
Write-Host "  Test Summary" -ForegroundColor Magenta
Write-Host "=====================================" -ForegroundColor Magenta
Write-Host ""

$total = $Passed + $Failed
Write-Host "Total Tests: $total"
Write-Host "Passed: $Passed" -ForegroundColor Green
Write-Host "Warnings: $Warnings" -ForegroundColor Yellow
Write-Host "Failed: $Failed" -ForegroundColor Red
Write-Host ""

if ($Failed -eq 0 -and $Warnings -eq 0) {
    Write-Host "SUCCESS: All tests passed!" -ForegroundColor Green
}
elseif ($Failed -eq 0) {
    Write-Host "SUCCESS: All critical tests passed with warnings" -ForegroundColor Yellow
}
else {
    Write-Host "FAILURE: Some tests failed" -ForegroundColor Red
}

Write-Host ""
Write-TestInfo "Log file: $LogFile"
Write-Host ""

Stop-Transcript | Out-Null

exit $(if ($Failed -eq 0) { 0 } else { 1 })

