#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Captures screenshots of all Truwit pages for validation
.DESCRIPTION
    Takes screenshots of key pages in both desktop and mobile views
    Saves them to a timestamped folder for comparison
.PARAMETER Environment
    Target environment: 'production' (default) or 'local'
.PARAMETER BaseUrl
    Override base URL (e.g., 'https://truwit.ai' or 'http://localhost:4200')
.EXAMPLE
    .\take-screenshots.ps1
    .\take-screenshots.ps1 -Environment local
    .\take-screenshots.ps1 -BaseUrl "https://truwit.ai"
#>

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('production', 'local')]
    [string]$Environment = 'production',
    
    [Parameter(Mandatory=$false)]
    [string]$BaseUrl = ''
)

# Color output functions
function Write-Info($message) {
    Write-Host "📸 $message" -ForegroundColor Cyan
}

function Write-Success($message) {
    Write-Host "✅ $message" -ForegroundColor Green
}

function Write-Error-Custom($message) {
    Write-Host "❌ $message" -ForegroundColor Red
}

function Write-Warning-Custom($message) {
    Write-Host "⚠️  $message" -ForegroundColor Yellow
}

# Set base URL
if ($BaseUrl -eq '') {
    if ($Environment -eq 'production') {
        $BaseUrl = 'https://truwit.ai'
    } else {
        $BaseUrl = 'http://localhost:4200'
    }
}

Write-Info "Truwit Screenshot Capture Tool"
Write-Host "================================" -ForegroundColor Cyan
Write-Info "Environment: $Environment"
Write-Info "Base URL: $BaseUrl"
Write-Host ""

# Check if Playwright is installed
Write-Info "Checking Playwright installation..."
$playwrightInstalled = $false

try {
    $result = npx playwright --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        $playwrightInstalled = $true
        Write-Success "Playwright is installed: $result"
    }
} catch {
    Write-Warning-Custom "Playwright not found in path"
}

if (-not $playwrightInstalled) {
    Write-Info "Installing Playwright..."
    try {
        npm install -D @playwright/test
        npx playwright install chromium
        Write-Success "Playwright installed successfully"
    } catch {
        Write-Error-Custom "Failed to install Playwright: $_"
        exit 1
    }
}

# Create output directory with timestamp
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$outputDir = "screenshots-$timestamp"
New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
Write-Success "Created output directory: $outputDir"
Write-Host ""

# Define pages to capture
$pages = @(
    @{Name="astro-landing"; Url="$BaseUrl"; Description="Astro Landing Page"},
    @{Name="how-it-works"; Url="$BaseUrl/how-it-works"; Description="How It Works"},
    @{Name="app-home"; Url="$BaseUrl/app"; Description="Angular App Home"},
    @{Name="verify-page"; Url="$BaseUrl/app/#/verify"; Description="Verify Page"},
    @{Name="verification-report"; Url="$BaseUrl/app/#/t/TW-E6F13C97"; Description="Verification Report (Sample)"}
)

# Define viewports
$viewports = @(
    @{Name="desktop"; Width=1920; Height=1080},
    @{Name="tablet"; Width=768; Height=1024},
    @{Name="mobile"; Width=375; Height=667}
)

# Create Node.js script for Playwright
$screenshotScript = @"
const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const pages = $($pages | ConvertTo-Json);
    const viewports = $($viewports | ConvertTo-Json);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const page of pages) {
        console.log(\`📄 Capturing: \${page.Description}\`);
        
        for (const viewport of viewports) {
            try {
                const context = await browser.newContext({
                    viewport: { width: viewport.Width, height: viewport.Height }
                });
                const pageInstance = await context.newPage();
                
                // Navigate to page
                await pageInstance.goto(page.Url, { 
                    waitUntil: 'networkidle',
                    timeout: 30000 
                });
                
                // Wait a bit for animations
                await pageInstance.waitForTimeout(2000);
                
                // Take full page screenshot
                const fullScreenshot = \`$outputDir/\${page.Name}-\${viewport.Name}-full.png\`;
                await pageInstance.screenshot({ 
                    path: fullScreenshot, 
                    fullPage: true 
                });
                
                // Take viewport screenshot
                const viewportScreenshot = \`$outputDir/\${page.Name}-\${viewport.Name}-viewport.png\`;
                await pageInstance.screenshot({ 
                    path: viewportScreenshot, 
                    fullPage: false 
                });
                
                console.log(\`  ✅ \${viewport.Name}: Full + Viewport\`);
                successCount += 2;
                
                await context.close();
                
            } catch (error) {
                console.error(\`  ❌ \${viewport.Name}: \${error.message}\`);
                errorCount++;
            }
        }
    }
    
    await browser.close();
    
    console.log('');
    console.log('================================');
    console.log('Screenshot Capture Summary');
    console.log('================================');
    console.log(\`✅ Success: \${successCount}\`);
    console.log(\`❌ Errors: \${errorCount}\`);
    console.log(\`📁 Output: $outputDir\`);
    
    process.exit(errorCount > 0 ? 1 : 0);
})();
"@

# Save the script to temp file
$tempScriptPath = Join-Path $outputDir "capture-script.js"
$screenshotScript | Out-File -FilePath $tempScriptPath -Encoding UTF8

Write-Info "Starting screenshot capture..."
Write-Host ""

# Run the script
try {
    node $tempScriptPath
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Success "All screenshots captured successfully!"
        Write-Host ""
        
        # List captured files
        Write-Info "Captured files:"
        Get-ChildItem -Path $outputDir -Filter "*.png" | ForEach-Object {
            $sizeKB = [math]::Round($_.Length / 1KB, 2)
            Write-Host "  📷 $($_.Name) ($sizeKB KB)" -ForegroundColor Gray
        }
        
        Write-Host ""
        Write-Success "Screenshots saved to: $outputDir"
        
        # Open folder
        $openFolder = Read-Host "Open screenshots folder? (Y/n)"
        if ($openFolder -ne 'n' -and $openFolder -ne 'N') {
            Invoke-Item $outputDir
        }
        
    } else {
        Write-Warning-Custom "Some screenshots failed to capture. Check the output above."
    }
    
    # Clean up temp script
    Remove-Item $tempScriptPath -ErrorAction SilentlyContinue
    
} catch {
    Write-Error-Custom "Failed to run screenshot capture: $_"
    exit 1
}

Write-Host ""
Write-Info "Screenshot capture complete!"

