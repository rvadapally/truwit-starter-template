# Test script to set up and test YouTube full_video mode

Write-Host "`n🧪 Testing YouTube Full Video Mode" -ForegroundColor Cyan
Write-Host "====================================`n" -ForegroundColor Cyan

$apiBase = "https://truwit-starter-template-production.up.railway.app"

# Step 1: Upload cookies
Write-Host "Step 1: Uploading YouTube cookies..." -ForegroundColor Yellow
try {
    $cookiesContent = Get-Content "api/cookies.txt" -Raw
    $cookiesJson = @{ Value = $cookiesContent } | ConvertTo-Json -Depth 10
    
    $response = Invoke-RestMethod `
        -Uri "$apiBase/v1/admin/settings/YOUTUBE_COOKIES" `
        -Method Put `
        -Body $cookiesJson `
        -ContentType "application/json; charset=utf-8" `
        -TimeoutSec 30
    
    Write-Host "✅ Cookies uploaded: $($cookiesContent.Length) characters" -ForegroundColor Green
} catch {
    Write-Host "❌ Cookie upload failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.ErrorDetails.Message)" -ForegroundColor Gray
}

# Step 2: Switch to full_video mode
Write-Host "`nStep 2: Switching to full_video mode..." -ForegroundColor Yellow
try {
    $body = '{"Value": "full_video"}'
    
    $response = Invoke-RestMethod `
        -Uri "$apiBase/v1/admin/settings/YOUTUBE_VERIFICATION_MODE" `
        -Method Put `
        -Body $body `
        -ContentType "application/json" `
        -TimeoutSec 10
    
    Write-Host "✅ Mode switched to: full_video" -ForegroundColor Green
} catch {
    Write-Host "❌ Mode switch failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 3: Verify settings
Write-Host "`nStep 3: Verifying settings..." -ForegroundColor Yellow
try {
    $mode = Invoke-RestMethod -Uri "$apiBase/v1/admin/settings/YOUTUBE_VERIFICATION_MODE" -Method Get
    Write-Host "✅ Current mode: $mode" -ForegroundColor Green
    
    $cookies = Invoke-RestMethod -Uri "$apiBase/v1/admin/settings/YOUTUBE_COOKIES" -Method Get
    Write-Host "✅ Cookies set: $($cookies.Length) characters" -ForegroundColor Green
} catch {
    Write-Host "❌ Verification failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 4: Test with a YouTube video
Write-Host "`nStep 4: Testing with a short YouTube video..." -ForegroundColor Yellow
Write-Host "(This will download the actual video content)" -ForegroundColor Gray

try {
    $testUrl = "https://www.youtube.com/watch?v=jNQXAC9IVRw"  # Me at the zoo (1:18 long)
    $body = @{ Url = $testUrl } | ConvertTo-Json
    
    Write-Host "Testing URL: $testUrl" -ForegroundColor Cyan
    Write-Host "Downloading video... (may take 30-60 seconds)" -ForegroundColor Gray
    
    $response = Invoke-RestMethod `
        -Uri "$apiBase/v1/proofs/url" `
        -Method Post `
        -Body $body `
        -ContentType "application/json" `
        -TimeoutSec 90
    
    Write-Host "`n✅ SUCCESS! Full video proof created!" -ForegroundColor Green
    Write-Host "  Proof ID: $($response.proofId)" -ForegroundColor White
    Write-Host "  Trustmark: $($response.trustmarkId)" -ForegroundColor White
    Write-Host "  Verify: https://www.truwit.ai$($response.verifyUrl)" -ForegroundColor White
    Write-Host "  Deduped: $($response.deduped)" -ForegroundColor White
    
} catch {
    Write-Host "`n❌ Test failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Gray
    }
}

Write-Host "`n====================================`n" -ForegroundColor Cyan
Write-Host "💡 To switch back to thumbnail mode:" -ForegroundColor Yellow
Write-Host '   curl -X PUT https://truwit-starter-template-production.up.railway.app/v1/admin/settings/YOUTUBE_VERIFICATION_MODE -H "Content-Type: application/json" -d "{\"Value\": \"thumbnail\"}"' -ForegroundColor Gray

