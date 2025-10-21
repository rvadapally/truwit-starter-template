# Test URL submission to see URLs in database
# This will create a proof from a URL and show you where it's stored

param(
    [string]$ApiUrl = "http://localhost:5000"
)

Write-Host "🧪 Testing URL Submission to See URLs in Database" -ForegroundColor Cyan
Write-Host "API URL: $ApiUrl" -ForegroundColor Yellow
Write-Host ""

# Test URLs
$testUrls = @(
    "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "https://www.tiktok.com/@test/video/1234567890"
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
        
    } catch {
        Write-Host "  ❌ Error testing URL: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
}

Write-Host "📊 Now check the database for URLs:" -ForegroundColor Cyan
Write-Host "   psql -c \"SELECT * FROM \\\"VerificationRequests\\\" WHERE \\\"Url\\\" IS NOT NULL;\" \"Host=localhost;Database=truwit;Username=postgres;Password=password\"" -ForegroundColor White
Write-Host "   psql -c \"SELECT * FROM \\\"LinkIndex\\\";\" \"Host=localhost;Database=truwit;Username=postgres;Password=password\"" -ForegroundColor White
Write-Host "   psql -c \"SELECT \\\"Json\\\"->>'url' as url FROM \\\"Receipts\\\" WHERE \\\"Json\\\" ? 'url';\" \"Host=localhost;Database=truwit;Username=postgres;Password=password\"" -ForegroundColor White

