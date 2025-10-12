#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Automated test suite for Truwit Verification App
.DESCRIPTION
    Tests critical functionality including URL processing and file uploads
    Supports both local Docker and production Railway environments
#>

param(
    [string]$Environment = "local",  # "local" or "production"
    [switch]$Verbose
)

# Configuration
$script:ApiUrl = if ($Environment -eq "production") { 
    "https://truwit-starter-template-production.up.railway.app" 
} else { 
    "http://localhost:5000" 
}
$script:FrontendUrl = if ($Environment -eq "production") { 
    "https://www.truwit.ai" 
} else { 
    "http://localhost:4200" 
}
$script:TestFilesDir = "app/src/testFiles"
$script:UrlsFile = Join-Path $TestFilesDir "urlsToTest.txt"
$script:SampleVideo = Join-Path $TestFilesDir "sample.mp4"
$script:LogFile = "test-results-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

# Test results tracking
$script:Passed = 0
$script:Failed = 0
$script:Warnings = 0
$script:TestResults = @()

# Color output functions
function Write-Success { 
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Failure { 
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-TestWarning { 
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Info { 
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Cyan
}

function Write-TestHeader {
    param([string]$Title)
    Write-Host "`n========================================" -ForegroundColor Magenta
    Write-Host "  $Title" -ForegroundColor Magenta
    Write-Host "========================================`n" -ForegroundColor Magenta
}

# Helper function for API calls
function Invoke-ApiTest {
    param(
        [string]$Endpoint,
        [string]$Method = "GET",
        [object]$Body = $null,
        [string]$ContentType = "application/json",
        [int]$TimeoutSec = 120
    )
    
    try {
        $params = @{
            Uri = "$ApiUrl$Endpoint"
            Method = $Method
            TimeoutSec = $TimeoutSec
            ErrorAction = 'Stop'
        }
        
        if ($Body) {
            if ($ContentType -eq "application/json") {
                $params.Body = ($Body | ConvertTo-Json -Depth 10)
                $params.ContentType = $ContentType
            } else {
                $params.Body = $Body
                $params.ContentType = $ContentType
            }
        }
        
        if ($Verbose) {
            Write-Info "Request: $Method $($params.Uri)"
            if ($Body -and $ContentType -eq "application/json") {
                Write-Info "Body: $($params.Body)"
            }
        }
        
        $response = Invoke-WebRequest @params
        
        return @{
            Success = $true
            StatusCode = $response.StatusCode
            Content = $response.Content
            Response = $response
        }
    }
    catch {
        $statusCode = if ($_.Exception.Response) { 
            [int]$_.Exception.Response.StatusCode 
        } else { 
            0 
        }
        
        $errorMessage = if ($_.Exception.Response) {
            try {
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $reader.BaseStream.Position = 0
                $reader.ReadToEnd()
            } catch {
                $_.Exception.Message
            }
        } else {
            $_.Exception.Message
        }
        
        return @{
            Success = $false
            StatusCode = $statusCode
            Error = $errorMessage
            Exception = $_
        }
    }
}

# Test functions
function Test-DockerContainer {
    Write-TestHeader "Test 1: Docker Container Health"
    
    if ($Environment -eq "production") {
        Write-Info "Skipping Docker check for production environment"
        return $true
    }
    
    try {
        $containers = docker-compose -f api/docker-compose.yml ps --format json 2>&1 | ConvertFrom-Json
        
        if ($containers -and $containers.State -eq "running") {
            Write-Success "Docker container is running"
            $script:Passed++
            return $true
        } else {
            Write-Failure "Docker container is not running"
            Write-Info "Run 'docker-compose -f api/docker-compose.yml up' to start the container"
            $script:Failed++
            return $false
        }
    }
    catch {
        Write-Failure "Could not check Docker container status: $($_.Exception.Message)"
        $script:Failed++
        return $false
    }
}

function Test-ApiHealth {
    Write-TestHeader "Test 2: API Health Endpoint"
    
    $result = Invoke-ApiTest -Endpoint "/health" -TimeoutSec 10
    
    if ($result.Success -and $result.StatusCode -eq 200) {
        Write-Success "API health endpoint returned 200 OK"
        $script:Passed++
        
        if ($Verbose) {
            Write-Info "Response: $($result.Content)"
        }
        
        return $true
    }
    else {
        Write-Failure "API health endpoint failed (Status: $($result.StatusCode))"
        Write-Info "Error: $($result.Error)"
        $script:Failed++
        return $false
    }
}

function Test-UrlProcessing {
    param([string]$Url, [int]$TestNumber)
    
    Write-TestHeader "Test ${TestNumber}: URL Processing - $Url"
    
    $body = @{
        url = $Url
        includeMetadata = $true
        performDeepAnalysis = $false
    }
    
    Write-Info "Processing URL: $Url"
    Write-Info "This may take 30-60 seconds for video download and analysis..."
    
    $result = Invoke-ApiTest -Endpoint "/v1/proofs" -Method "POST" -Body $body -TimeoutSec 120
    
    if ($result.Success) {
        if ($result.StatusCode -eq 200 -or $result.StatusCode -eq 201) {
            Write-Success "URL processed successfully (Status: $($result.StatusCode))"
            
            try {
                $response = $result.Content | ConvertFrom-Json
                Write-Info "Proof ID: $($response.id)"
                Write-Info "Status: $($response.status)"
                Write-Info "Analysis: $($response.analysis)"
                
                $script:TestResults += @{
                    Test = "URL Processing: $Url"
                    Status = "PASSED"
                    ProofId = $response.id
                    Analysis = $response.analysis
                }
                
                $script:Passed++
                return $true
            }
            catch {
                Write-Info "Response: $($result.Content)"
                $script:Passed++
                return $true
            }
        }
        elseif ($result.StatusCode -eq 500) {
            # Check if it's a known YouTube bot protection issue
            if ($result.Error -match "Sign in to confirm you") {
                Write-TestWarning "YouTube requires authentication cookies"
                Write-Info "This is expected behavior for YouTube videos without cookies"
                Write-Info "Solution: Configure YouTube cookies in appsettings.json"
                Write-Info "See DEPLOYMENT.md for instructions"
                
                $script:TestResults += @{
                    Test = "URL Processing: $Url"
                    Status = "WARNING"
                    Message = "YouTube authentication required"
                }
                
                $script:Warnings++
                return $true
            }
            else {
                Write-Failure "API returned 500 error"
                Write-Info "Error: $($result.Error)"
                
                $script:TestResults += @{
                    Test = "URL Processing: $Url"
                    Status = "FAILED"
                    Error = $result.Error
                }
                
                $script:Failed++
                return $false
            }
        }
        else {
            Write-Failure "Unexpected status code: $($result.StatusCode)"
            Write-Info "Error: $($result.Error)"
            $script:Failed++
            return $false
        }
    }
    else {
        Write-Failure "Request failed"
        Write-Info "Error: $($result.Error)"
        
        $script:TestResults += @{
            Test = "URL Processing: $Url"
            Status = "FAILED"
            Error = $result.Error
        }
        
        $script:Failed++
        return $false
    }
}

function Test-FileUpload {
    param([int]$TestNumber)
    
    Write-TestHeader "Test ${TestNumber}: File Upload - sample.mp4"
    
    if (-not (Test-Path $SampleVideo)) {
        Write-Failure "Sample video file not found: $SampleVideo"
        $script:Failed++
        return $false
    }
    
    Write-Info "Uploading file: $SampleVideo"
    Write-Info "File size: $([math]::Round((Get-Item $SampleVideo).Length / 1MB, 2)) MB"
    Write-Info "This may take 30-90 seconds for upload and analysis..."
    
    try {
        # Create multipart form data
        $boundary = [System.Guid]::NewGuid().ToString()
        $contentType = "multipart/form-data; boundary=$boundary"
        
        # Read file content
        $fileContent = [System.IO.File]::ReadAllBytes($SampleVideo)
        $fileName = Split-Path $SampleVideo -Leaf
        
        # Build multipart form data manually
        $bodyLines = @(
            "--$boundary",
            "Content-Disposition: form-data; name=`"file`"; filename=`"$fileName`"",
            "Content-Type: video/mp4",
            "",
            [System.Text.Encoding]::GetEncoding("ISO-8859-1").GetString($fileContent),
            "--$boundary",
            "Content-Disposition: form-data; name=`"includeMetadata`"",
            "",
            "true",
            "--$boundary",
            "Content-Disposition: form-data; name=`"performDeepAnalysis`"",
            "",
            "false",
            "--$boundary--"
        )
        
        $body = [System.Text.Encoding]::GetEncoding("ISO-8859-1").GetBytes($bodyLines -join "`r`n")
        
        $result = Invoke-ApiTest -Endpoint "/v1/proofs" -Method "POST" -Body $body -ContentType $contentType -TimeoutSec 120
        
        if ($result.Success -and ($result.StatusCode -eq 200 -or $result.StatusCode -eq 201)) {
            Write-Success "File uploaded and processed successfully (Status: $($result.StatusCode))"
            
            try {
                $response = $result.Content | ConvertFrom-Json
                Write-Info "Proof ID: $($response.id)"
                Write-Info "Status: $($response.status)"
                Write-Info "Analysis: $($response.analysis)"
                
                $script:TestResults += @{
                    Test = "File Upload: $fileName"
                    Status = "PASSED"
                    ProofId = $response.id
                    Analysis = $response.analysis
                }
            }
            catch {
                Write-Info "Response: $($result.Content)"
            }
            
            $script:Passed++
            return $true
        }
        else {
            Write-Failure "File upload failed (Status: $($result.StatusCode))"
            Write-Info "Error: $($result.Error)"
            
            $script:TestResults += @{
                Test = "File Upload: $fileName"
                Status = "FAILED"
                Error = $result.Error
            }
            
            $script:Failed++
            return $false
        }
    }
    catch {
        Write-Failure "File upload failed with exception: $($_.Exception.Message)"
        
        $script:TestResults += @{
            Test = "File Upload"
            Status = "FAILED"
            Error = $_.Exception.Message
        }
        
        $script:Failed++
        return $false
    }
}

function Show-Diagnostics {
    Write-TestHeader "Diagnostics"
    
    if ($Environment -eq "production") {
        Write-Info "Testing production environment - diagnostics limited"
        return
    }
    
    Write-Info "Checking Docker container tools..."
    
    # Check yt-dlp
    try {
        $ytdlpVersion = docker-compose -f api/docker-compose.yml exec -T api yt-dlp --version 2>&1
        if ($ytdlpVersion -match "\d{4}\.\d{2}\.\d{2}") {
            Write-Success "yt-dlp version: $ytdlpVersion"
        }
    }
    catch {
        Write-Failure "yt-dlp check failed: $($_.Exception.Message)"
    }
    
    # Check ffmpeg
    try {
        $ffmpegVersion = docker-compose -f api/docker-compose.yml exec -T api ffmpeg -version 2>&1 | Select-Object -First 1
        if ($ffmpegVersion) {
            Write-Success "ffmpeg: $ffmpegVersion"
        }
    }
    catch {
        Write-Failure "ffmpeg check failed: $($_.Exception.Message)"
    }
    
    # Check temp directory
    try {
        $tempDir = docker-compose -f api/docker-compose.yml exec -T api ls -la /tmp/truwit_dl 2>&1
        if ($tempDir) {
            Write-Success "Temp directory exists and is accessible"
            if ($Verbose) {
                Write-Info "Contents:`n$tempDir"
            }
        }
    }
    catch {
        Write-Failure "Temp directory check failed: $($_.Exception.Message)"
    }
    
    # Show recent logs
    Write-Info "Recent container logs (last 20 lines):"
    docker-compose -f api/docker-compose.yml logs --tail=20 2>&1
}

function Show-Summary {
    Write-TestHeader "Test Summary"
    
    $total = $script:Passed + $script:Failed
    $passRate = if ($total -gt 0) { [math]::Round(($script:Passed / $total) * 100, 1) } else { 0 }
    
    Write-Host "`nTotal Tests: $total" -ForegroundColor Cyan
    Write-Success "Passed: $script:Passed"
    Write-TestWarning "Warnings: $script:Warnings"
    Write-Failure "Failed: $script:Failed"
    
    Write-Host "`n" -NoNewline
    
    if ($script:Failed -eq 0 -and $script:Warnings -eq 0) {
        Write-Host "🎉 " -NoNewline -ForegroundColor Green
        Write-Host "ALL TESTS PASSED! Application is working perfectly!" -ForegroundColor Green
        Write-Host "🚀 " -NoNewline -ForegroundColor Green
        Write-Host "Ready for production deployment!" -ForegroundColor Green
    }
    elseif ($script:Failed -eq 0) {
        Write-Host "✅ " -NoNewline -ForegroundColor Yellow
        Write-Host "All critical tests passed with $script:Warnings warning(s)" -ForegroundColor Yellow
        Write-Info "Pass Rate: $passRate percent"
        Write-Info "Warnings are typically non-blocking - e.g. YouTube authentication"
    }
    else {
        Write-Host "⛔ " -NoNewline -ForegroundColor Red
        Write-Host "TESTS FAILED - Application has issues that need fixing" -ForegroundColor Red
        Write-Info "Pass Rate: $passRate percent"
        Write-Info "Please review the errors above and check the logs"
    }
    
    # Show detailed results
    if ($script:TestResults.Count -gt 0) {
        Write-Host "`n" -NoNewline
        Write-Info "Detailed Results:"
        foreach ($result in $script:TestResults) {
            $status = $result.Status
            $color = switch ($status) {
                "PASSED" { "Green" }
                "WARNING" { "Yellow" }
                "FAILED" { "Red" }
            }
            Write-Host "  [$status] " -ForegroundColor $color -NoNewline
            Write-Host "$($result.Test)"
            
            if ($result.ProofId) {
                Write-Host "    Proof ID: $($result.ProofId)" -ForegroundColor Gray
            }
            if ($result.Message) {
                Write-Host "    $($result.Message)" -ForegroundColor Gray
            }
            if ($result.Error) {
                Write-Host "    Error: $($result.Error)" -ForegroundColor Gray
            }
        }
    }
    
    Write-Host "`n" -NoNewline
    Write-Info "Detailed logs saved to: $LogFile"
    Write-Host ""
}

# Main execution
try {
    # Start transcript for logging
    Start-Transcript -Path $LogFile -Append | Out-Null
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  Truwit Automated Test Suite" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    $envName = if ($Environment -eq "production") { "PRODUCTION" } else { "LOCAL" }
    Write-Info "Testing $envName environment"
    Write-Info "API URL: $ApiUrl"
    Write-Info "Frontend URL: $FrontendUrl"
    Write-Host ""
    
    # Verify test files exist
    if (-not (Test-Path $UrlsFile)) {
        Write-Failure "URLs file not found: $UrlsFile"
        exit 1
    }
    
    if (-not (Test-Path $SampleVideo)) {
        Write-TestWarning "Sample video not found: $SampleVideo (file upload tests will be skipped)"
    }
    
    # Run tests
    Test-DockerContainer
    Test-ApiHealth
    
    # Test URLs from file
    $urls = Get-Content $UrlsFile | Where-Object { $_ -and -not $_.StartsWith("//") -and $_.Trim() -ne "" }
    $testNumber = 3
    
    foreach ($url in $urls) {
        Test-UrlProcessing -Url $url.Trim() -TestNumber $testNumber
        $testNumber++
    }
    
    # Test file upload
    if (Test-Path $SampleVideo) {
        Test-FileUpload -TestNumber $testNumber
    }
    
    # Show diagnostics
    Show-Diagnostics
    
    # Show summary
    Show-Summary
    
    # Stop transcript
    Stop-Transcript | Out-Null
    
    # Exit with appropriate code
    exit $(if ($script:Failed -eq 0) { 0 } else { 1 })
}
catch {
    Write-Failure "Test suite failed with exception: $($_.Exception.Message)"
    Write-Host $_.ScriptStackTrace -ForegroundColor Red
    Stop-Transcript | Out-Null
    exit 1
}
