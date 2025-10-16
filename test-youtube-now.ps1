#############################################################################
# Quick YouTube Test with User-Supplied Cookies
#############################################################################

Write-Host "`n🎬 Testing YouTube with YOUR cookies`n" -ForegroundColor Cyan

# Step 1: Check if cookies file exists
if (!(Test-Path "api/cookies.txt")) {
    Write-Host "❌ ERROR: api/cookies.txt not found!" -ForegroundColor Red
    Write-Host "Export your YouTube cookies first using Get cookies.txt extension" -ForegroundColor Yellow
    exit 1
}

# Step 2: Load cookies
$cookies = Get-Content "api/cookies.txt" -Raw
Write-Host "✅ Loaded cookies: $($cookies.Length) characters" -ForegroundColor Green

# Step 3: Test with YouTube URL
$url = "https://youtu.be/K7uZuy41wlQ"
Write-Host "`n🔗 Testing URL: $url" -ForegroundColor Yellow

try {
    $body = @{
        url = $url
        userCookies = $cookies
    } | ConvertTo-Json
    
    Write-Host "📤 Sending request to Railway..." -ForegroundColor Gray
    $result = Invoke-RestMethod `
        -Uri "https://truwit-starter-template-production.up.railway.app/v1/proofs/url" `
        -Method Post `
        -Body $body `
        -ContentType "application/json" `
        -TimeoutSec 120
    
    Write-Host "`n✅ SUCCESS!" -ForegroundColor Green
    Write-Host "   Trustmark ID: $($result.trustmarkId)" -ForegroundColor White
    Write-Host "   Proof ID: $($result.proofId)" -ForegroundColor Gray
    
    # Test verification endpoint
    Write-Host "`n🔍 Testing verification endpoint..." -ForegroundColor Yellow
    $verify = Invoke-RestMethod `
        -Uri "https://truwit-starter-template-production.up.railway.app/v1/proofs/verify/$($result.trustmarkId)"
    
    Write-Host "✅ Verification works!" -ForegroundColor Green
    Write-Host "   IssuedAt: $($verify.issuedAt)" -ForegroundColor Gray
    Write-Host "   Generator: $($verify.declared.generator)" -ForegroundColor Gray
    
    Write-Host "`n🎉 ALL TESTS PASSED!" -ForegroundColor Green
    
} catch {
    Write-Host "`n❌ FAILED!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Message -match "cookies") {
        Write-Host "`n💡 TIP: Your cookies might be expired. Export fresh ones from your browser." -ForegroundColor Yellow
        Write-Host "   1. Go to youtube.com in your browser (logged in)" -ForegroundColor Gray
        Write-Host "   2. Use 'Get cookies.txt LOCALLY' extension" -ForegroundColor Gray
        Write-Host "   3. Export cookies to api/cookies.txt" -ForegroundColor Gray
    }
}

