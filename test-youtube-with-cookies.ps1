#!/usr/bin/env pwsh

Write-Host "`n🧪 Testing YouTube with User-Supplied Cookies`n" -ForegroundColor Cyan

# Path to your cookies file (update this path)
$cookiesFile = "api\cookies.txt"

if (!(Test-Path $cookiesFile)) {
    Write-Host "❌ Cookies file not found: $cookiesFile" -ForegroundColor Red
    Write-Host "   Please update the path in this script or create the cookies file" -ForegroundColor Yellow
    exit 1
}

# Read cookies
$cookies = Get-Content $cookiesFile -Raw
Write-Host "✅ Cookies file loaded ($($cookies.Length) characters)" -ForegroundColor Green

# Test URLs
$youtubeUrl1 = "https://youtu.be/K7uZuy41wlQ?si=quUHALUHugf1GYnS"
$youtubeUrl2 = "https://youtu.be/pfuwsoa7WMU?si=ZE0zS8eoZpUnKnJs"

$apiUrl = "https://truwit-starter-template-production.up.railway.app/v1/proofs/url"

# Test 1: YouTube URL #1
Write-Host "`n📺 Test 1: YouTube URL #1" -ForegroundColor Yellow
Write-Host "   URL: $youtubeUrl1" -ForegroundColor Gray

try {
    $body = @{
        url = $youtubeUrl1
        userCookies = $cookies
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri $apiUrl -Method Post -Body $body -ContentType "application/json"
    
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "   Trustmark: $($response.trustmarkId)" -ForegroundColor Gray
    Write-Host "   Proof ID: $($response.proofId)" -ForegroundColor Gray
    Write-Host "   View: https://www.truwit.ai/verify/$($response.trustmarkId)" -ForegroundColor Cyan
}
catch {
    Write-Host "❌ FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 3

# Test 2: YouTube URL #2
Write-Host "`n📺 Test 2: YouTube URL #2" -ForegroundColor Yellow
Write-Host "   URL: $youtubeUrl2" -ForegroundColor Gray

try {
    $body = @{
        url = $youtubeUrl2
        userCookies = $cookies
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri $apiUrl -Method Post -Body $body -ContentType "application/json"
    
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "   Trustmark: $($response.trustmarkId)" -ForegroundColor Gray
    Write-Host "   Proof ID: $($response.proofId)" -ForegroundColor Gray
    Write-Host "   View: https://www.truwit.ai/verify/$($response.trustmarkId)" -ForegroundColor Cyan
}
catch {
    Write-Host "❌ FAILED" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n✅ Tests complete!`n" -ForegroundColor Cyan

