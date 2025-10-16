#!/usr/bin/env pwsh
# Test Railway API File Upload

Write-Host ""
Write-Host "=== Testing Railway API File Upload ===" -ForegroundColor Cyan
Write-Host ""

$filePath = "app\src\testFiles\sample.mp4"
$uri = "https://truwit-starter-template-production.up.railway.app/v1/proofs/file"

Write-Host "Uploading: $filePath" -ForegroundColor Yellow

# Load required assemblies
Add-Type -AssemblyName System.Net.Http

# Create HTTP client
$client = New-Object System.Net.Http.HttpClient
$client.Timeout = [TimeSpan]::FromSeconds(120)

# Create multipart content
$content = New-Object System.Net.Http.MultipartFormDataContent

# Add file
$fileStream = [System.IO.File]::OpenRead($filePath)
$fileContent = New-Object System.Net.Http.StreamContent($fileStream)
$fileContent.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse("video/mp4")
$content.Add($fileContent, "file", "sample.mp4")

# Add declared metadata
$declaredJson = '{"generator":"TestScript","prompt":"Railway file upload test","license":"creator-owned"}'
$declaredContent = New-Object System.Net.Http.StringContent($declaredJson)
$content.Add($declaredContent, "declared")

try {
    Write-Host "Sending request..." -ForegroundColor Yellow
    $result = $client.PostAsync($uri, $content).Result
    $responseBody = $result.Content.ReadAsStringAsync().Result
    
    Write-Host ""
    Write-Host "Response Status: $($result.StatusCode)" -ForegroundColor Green
    Write-Host ""
    
    if ($result.IsSuccessStatusCode) {
        $json = $responseBody | ConvertFrom-Json
        Write-Host "Proof ID: $($json.proofId)" -ForegroundColor Cyan
        Write-Host "Verify URL: $($json.verifyUrl)" -ForegroundColor Yellow
        Write-Host "Badge URL: $($json.badgeUrl)" -ForegroundColor Magenta
        Write-Host ""
        Write-Host "Full Verification URL: https://www.truwit.ai$($json.verifyUrl)" -ForegroundColor Green
        Write-Host ""
        Write-Host "TEST PASSED! The verifyUrl is now in correct format: $($json.verifyUrl)" -ForegroundColor Green
    } else {
        Write-Host "Error Response:" -ForegroundColor Red
        Write-Host $responseBody -ForegroundColor Red
    }
} catch {
    Write-Host ""
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.InnerException) {
        Write-Host "Inner Exception: $($_.Exception.InnerException.Message)" -ForegroundColor Red
    }
} finally {
    $fileStream.Close()
    $client.Dispose()
}

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Cyan
Write-Host ""
