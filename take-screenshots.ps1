param(
    [string]$Environment = 'production',
    [string]$BaseUrl = ''
)

# Set base URL
if ($BaseUrl -eq '') {
    if ($Environment -eq 'production') {
        $BaseUrl = 'https://truwit.ai'
    } else {
        $BaseUrl = 'http://localhost:4200'
    }
}

Write-Host ""
Write-Host "Screenshot Capture Tool" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan
Write-Host "Environment: $Environment"
Write-Host "Base URL: $BaseUrl"
Write-Host ""

# Check Playwright
Write-Host "Checking Playwright..." -ForegroundColor Cyan
try {
    npx playwright --version | Out-Null
    Write-Host "Playwright is installed" -ForegroundColor Green
} catch {
    Write-Host "Installing Playwright..." -ForegroundColor Yellow
    npm install -D @playwright/test
    npx playwright install chromium
}

# Create output directory
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$outputDir = "screenshots-$timestamp"
New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
Write-Host "Output directory: $outputDir" -ForegroundColor Green
Write-Host ""

# Run screenshot capture
Write-Host "Starting screenshot capture..." -ForegroundColor Cyan
Write-Host ""

$scriptPath = Join-Path $PSScriptRoot "scripts/capture-screenshots.cjs"
node $scriptPath $BaseUrl $outputDir

Write-Host ""
if ($LASTEXITCODE -eq 0) {
    Write-Host "Success! All screenshots captured" -ForegroundColor Green
} else {
    Write-Host "Some screenshots failed" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Captured files:" -ForegroundColor Cyan
Get-ChildItem -Path $outputDir -Filter "*.png" | ForEach-Object {
    $sizeKB = [math]::Round($_.Length / 1KB, 2)
    Write-Host "  $($_.Name) - $sizeKB KB" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Screenshots saved to: $outputDir" -ForegroundColor Green

# Open folder
Start-Process $outputDir
