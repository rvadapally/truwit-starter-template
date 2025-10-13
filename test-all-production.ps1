Write-Host "`n🚀 Testing Truwit Production with PostgreSQL`n" -ForegroundColor Cyan

$apiUrl = "https://truwit-starter-template-production.up.railway.app"
$results = @()

# Test 1: Health Check
Write-Host "📡 Test 1: Health Check" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$apiUrl/health" -Method Get
    Write-Host "✅ Health: OK" -ForegroundColor Green
} catch {
    Write-Host "❌ Health check failed" -ForegroundColor Red
}

Start-Sleep -Seconds 2

# Test 2: YouTube URL #1
Write-Host "`n📺 Test 2: YouTube URL #1" -ForegroundColor Yellow
try {
    $body = @{ url = "https://youtu.be/K7uZuy41wlQ?si=quUHALUHugf1GYnS" } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$apiUrl/v1/proofs/url" -Method Post -Body $body -ContentType "application/json"
    Write-Host "✅ Proof generated! Trustmark: $($response.trustmarkId)" -ForegroundColor Green
    $results += "YouTube #1: ✅"
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    $results += "YouTube #1: ❌"
}

Start-Sleep -Seconds 3

# Test 3: YouTube URL #2
Write-Host "`n📺 Test 3: YouTube URL #2" -ForegroundColor Yellow
try {
    $body = @{ url = "https://youtu.be/pfuwsoa7WMU?si=ZE0zS8eoZpUnKnJs" } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$apiUrl/v1/proofs/url" -Method Post -Body $body -ContentType "application/json"
    Write-Host "✅ Proof generated! Trustmark: $($response.trustmarkId)" -ForegroundColor Green
    $results += "YouTube #2: ✅"
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    $results += "YouTube #2: ❌"
}

Start-Sleep -Seconds 3

# Test 4: TikTok URL
Write-Host "`n📱 Test 4: TikTok URL" -ForegroundColor Yellow
try {
    $body = @{ url = "https://www.tiktok.com/@toptierlives/video/7560062313332591886" } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$apiUrl/v1/proofs/url" -Method Post -Body $body -ContentType "application/json"
    Write-Host "✅ Proof generated! Trustmark: $($response.trustmarkId)" -ForegroundColor Green
    $results += "TikTok: ✅"
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    $results += "TikTok: ❌"
}

# Summary
Write-Host "`n📊 Test Summary:" -ForegroundColor Cyan
foreach ($result in $results) {
    Write-Host "   $result"
}

Write-Host "`n✅ Tests complete! Check Azure Data Studio to verify database.`n" -ForegroundColor Green
