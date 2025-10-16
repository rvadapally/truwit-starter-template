###############################################################################
# Test YouTube on Railway Production with YOUR Cookies
###############################################################################

Write-Host "`n🎬 Testing YouTube on PRODUCTION (Railway)`n" -ForegroundColor Cyan

$COOKIES_FILE = "my-youtube-cookies.txt"

if (!(Test-Path $COOKIES_FILE)) {
    Write-Host "❌ Cookies file not found: $COOKIES_FILE" -ForegroundColor Red
    Write-Host "Export your YouTube cookies first!" -ForegroundColor Yellow
    exit 1
}

$cookies = Get-Content $COOKIES_FILE -Raw
Write-Host "✅ Loaded cookies: $($cookies.Length) characters`n" -ForegroundColor Green

# Test YouTube URL
$url = "https://youtu.be/K7uZuy41wlQ"
Write-Host "🔗 URL: $url" -ForegroundColor Yellow

try {
    $body = @{
        url = $url
        userCookies = $cookies
    } | ConvertTo-Json
    
    Write-Host "📤 Sending to Railway..." -ForegroundColor Gray
    
    $result = Invoke-RestMethod `
        -Uri "https://truwit-starter-template-production.up.railway.app/v1/proofs/url" `
        -Method Post `
        -Body $body `
        -ContentType "application/json" `
        -TimeoutSec 120
    
    Write-Host "`n✅ SUCCESS on PRODUCTION!" -ForegroundColor Green
    Write-Host "   Trustmark: $($result.trustmarkId)" -ForegroundColor White
    Write-Host "   Proof ID: $($result.proofId)" -ForegroundColor Gray
    
    # Verify
    Write-Host "`n🔍 Verifying proof..." -ForegroundColor Yellow
    $verify = Invoke-RestMethod `
        -Uri "https://truwit-starter-template-production.up.railway.app/v1/proofs/verify/$($result.trustmarkId)"
    
    Write-Host "✅ Verification successful!" -ForegroundColor Green
    Write-Host "   IssuedAt: $($verify.issuedAt)" -ForegroundColor Gray
    
} catch {
    Write-Host "`n❌ FAILED!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

