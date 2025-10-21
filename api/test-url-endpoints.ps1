# Test script to verify API endpoints and see URLs in action
# This will help you test the API and see where URLs are stored

param(
    [string]$ApiUrl = "http://localhost:5000"
)

Write-Host "🧪 Testing API Endpoints to See URLs in Action" -ForegroundColor Cyan
Write-Host "API URL: $ApiUrl" -ForegroundColor Yellow
Write-Host ""

# Test URLs
$testUrls = @(
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://www.tiktok.com/@test/video/1234567890",
    "https://example.com/test-video.mp4"
)

foreach ($url in $testUrls) {
    Write-Host "🔗 Testing URL: $url" -ForegroundColor Green
    
    try {
        # Test the new C2PA proof creation endpoint
        $body = @{
            url = $url
        } | ConvertTo-Json
        
        $headers = @{
            "Content-Type" = "application/json"
        }
        
        Write-Host "  📤 Creating proof from URL..." -ForegroundColor Yellow
        
        $response = Invoke-RestMethod -Uri "$ApiUrl/v1/proofs/url" -Method POST -Body $body -Headers $headers
        
        Write-Host "  ✅ Proof created successfully!" -ForegroundColor Green
        Write-Host "  🆔 Proof ID: $($response.ProofId)" -ForegroundColor White
        Write-Host "  🏷️  Trustmark ID: $($response.TrustmarkId)" -ForegroundColor White
        Write-Host "  🔗 Verify URL: $($response.VerifyUrl)" -ForegroundColor White
        Write-Host "  📋 Deduped: $($response.Deduped)" -ForegroundColor White
        
        # Test lookup endpoint
        Write-Host "  🔍 Testing lookup..." -ForegroundColor Yellow
        $lookupResponse = Invoke-RestMethod -Uri "$ApiUrl/v1/proofs/lookup?url=$([System.Web.HttpUtility]::UrlEncode($url))" -Method GET
        
        Write-Host "  ✅ Lookup successful!" -ForegroundColor Green
        Write-Host "  📊 Exists: $($lookupResponse.Exists)" -ForegroundColor White
        if ($lookupResponse.Exists) {
            Write-Host "  🆔 Found Proof ID: $($lookupResponse.ProofId)" -ForegroundColor White
            Write-Host "  🏷️  Found Trustmark ID: $($lookupResponse.TrustmarkId)" -ForegroundColor White
        }
        
    } catch {
        Write-Host "  ❌ Error testing URL: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
}

# Test verification endpoint
Write-Host "🔍 Testing verification endpoint..." -ForegroundColor Cyan
try {
    # Get a recent proof ID from the database or use a known one
    $verifyResponse = Invoke-RestMethod -Uri "$ApiUrl/v1/verify-trustmark/TW-12345678" -Method GET
    Write-Host "✅ Verification test completed" -ForegroundColor Green
} catch {
    Write-Host "ℹ️  Verification test skipped (no test trustmark ID)" -ForegroundColor Yellow
}

# Test badge endpoint
Write-Host "🏷️  Testing badge endpoint..." -ForegroundColor Cyan
try {
    $badgeResponse = Invoke-RestMethod -Uri "$ApiUrl/v1/badge/TW-12345678.svg" -Method GET
    Write-Host "✅ Badge test completed" -ForegroundColor Green
} catch {
    Write-Host "ℹ️  Badge test skipped (no test trustmark ID)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📊 Now run the database queries to see where URLs are stored:" -ForegroundColor Cyan
Write-Host "   .\check-urls.ps1" -ForegroundColor White
Write-Host ""
Write-Host "💡 Or run SQL queries directly:" -ForegroundColor Yellow
Write-Host "   -- Inspect URL data via Postgres (psql)" -ForegroundColor White
Write-Host "   -- Example: psql \"$env:POSTGRES_URL\" -c \"SELECT url, createdat FROM \"\"VerificationRequests\"\" WHERE url IS NOT NULL ORDER BY createdat DESC LIMIT 10;\"" -ForegroundColor White

