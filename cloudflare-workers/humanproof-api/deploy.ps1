# Deploy HumanProof API to Cloudflare Workers
Write-Host "=== HumanProof API Deployment Script ===" -ForegroundColor Cyan

# Check if API token is set
if (-not $env:CLOUDFLARE_API_TOKEN) {
    Write-Host "❌ CLOUDFLARE_API_TOKEN not set" -ForegroundColor Red
    Write-Host "`nPlease set your API token first:" -ForegroundColor Yellow
    Write-Host '$env:CLOUDFLARE_API_TOKEN="your-token-here"' -ForegroundColor Gray
    Write-Host "`nTo get a token:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://dash.cloudflare.com/profile/api-tokens" -ForegroundColor White
    Write-Host "2. Click 'Create Token'" -ForegroundColor White
    Write-Host "3. Use 'Custom token' template" -ForegroundColor White
    Write-Host "4. Set permissions:" -ForegroundColor White
    Write-Host "   - Account: Cloudflare Workers:Edit" -ForegroundColor Gray
    Write-Host "   - Account: D1:Edit" -ForegroundColor Gray
    Write-Host "5. Copy the token" -ForegroundColor White
    exit 1
}

Write-Host "✅ API Token found" -ForegroundColor Green

# Check if we're in the right directory
if (-not (Test-Path "wrangler.jsonc")) {
    Write-Host "❌ wrangler.jsonc not found. Please run this from the worker directory." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Worker configuration found" -ForegroundColor Green

# Deploy the worker
Write-Host "`n=== Deploying to Cloudflare Workers ===" -ForegroundColor Cyan
Write-Host "This will create a new Worker in your Cloudflare account" -ForegroundColor Yellow

try {
    wrangler deploy
    Write-Host "`n✅ Deployment successful!" -ForegroundColor Green
    Write-Host "Your API is now live on Cloudflare Workers!" -ForegroundColor Green
}
catch {
    Write-Host "`n❌ Deployment failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
