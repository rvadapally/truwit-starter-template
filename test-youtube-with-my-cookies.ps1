###############################################################################
# Test YouTube URLs with YOUR Fresh Cookies
###############################################################################

Write-Host "`n🎬 YouTube URL Testing with User-Supplied Cookies`n" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════`n" -ForegroundColor Cyan

# Configuration
$API_URL = "http://localhost:5000"  # Change to Railway URL when testing production
$COOKIES_FILE = "my-youtube-cookies.txt"  # Your exported cookies

# Check if cookies file exists
if (!(Test-Path $COOKIES_FILE)) {
    Write-Host "❌ ERROR: Cookies file not found: $COOKIES_FILE" -ForegroundColor Red
    Write-Host "`n📝 Steps to get cookies:" -ForegroundColor Yellow
    Write-Host "   1. Install 'Get cookies.txt LOCALLY' Chrome extension" -ForegroundColor Gray
    Write-Host "   2. Go to youtube.com (logged in)" -ForegroundColor Gray
    Write-Host "   3. Click extension icon → Export" -ForegroundColor Gray
    Write-Host "   4. Save as: $COOKIES_FILE" -ForegroundColor Gray
    exit 1
}

# Load cookies
Write-Host "📂 Loading cookies from: $COOKIES_FILE" -ForegroundColor Yellow
$cookies = Get-Content $COOKIES_FILE -Raw
Write-Host "✅ Loaded $($cookies.Length) characters`n" -ForegroundColor Green

# Test URLs
$testUrls = @(
    "https://youtu.be/K7uZuy41wlQ",  # Public video
    "https://youtu.be/pfuwsoa7WMU"   # Another public video
)

$results = @()

foreach ($url in $testUrls) {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "🔗 Testing: $url" -ForegroundColor Yellow
    
    try {
        # Create request with user-supplied cookies
        $body = @{
            url = $url
            userCookies = $cookies  # <-- THIS IS THE NEW FEATURE!
        } | ConvertTo-Json
        
        Write-Host "📤 Sending request..." -ForegroundColor Gray
        $result = Invoke-RestMethod `
            -Uri "$API_URL/v1/proofs/url" `
            -Method Post `
            -Body $body `
            -ContentType "application/json" `
            -TimeoutSec 120
        
        Write-Host "✅ SUCCESS!" -ForegroundColor Green
        Write-Host "   Trustmark: $($result.trustmarkId)" -ForegroundColor White
        Write-Host "   Proof ID: $($result.proofId)" -ForegroundColor Gray
        
        $results += @{
            URL = $url
            Status = "SUCCESS"
            Trustmark = $result.trustmarkId
        }
        
    } catch {
        Write-Host "❌ FAILED!" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        
        $results += @{
            URL = $url
            Status = "FAILED"
            Error = $_.Exception.Message
        }
    }
    
    Write-Host ""
}

# Summary
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 SUMMARY" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

$successCount = ($results | Where-Object { $_.Status -eq "SUCCESS" }).Count
$failCount = ($results | Where-Object { $_.Status -eq "FAILED" }).Count

Write-Host "Total Tests: $($results.Count)" -ForegroundColor White
Write-Host "✅ Passed: $successCount" -ForegroundColor Green
Write-Host "❌ Failed: $failCount" -ForegroundColor Red

if ($failCount -eq 0) {
    Write-Host "`n🎉 ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host "Your cookies are working perfectly!" -ForegroundColor Green
} else {
    Write-Host "`n⚠️  Some tests failed. Your cookies might be expired." -ForegroundColor Yellow
    Write-Host "   Try exporting fresh cookies from your browser." -ForegroundColor Gray
}

