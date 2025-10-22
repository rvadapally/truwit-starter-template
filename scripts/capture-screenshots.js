const { chromium } = require('playwright');

const baseUrl = process.argv[2] || 'https://truwit.ai';
const outputDir = process.argv[3] || 'screenshots';

const pages = [
    {name: "astro-landing", url: baseUrl, description: "Astro Landing Page"},
    {name: "how-it-works", url: `${baseUrl}/how-it-works`, description: "How It Works"},
    {name: "app-home", url: `${baseUrl}/app`, description: "Angular App Home"},
    {name: "verify-page", url: `${baseUrl}/app/#/verify`, description: "Verify Page"},
    {name: "verification-report", url: `${baseUrl}/app/#/t/TW-E6F13C97`, description: "Verification Report"}
];

const viewports = [
    {name: "desktop", width: 1920, height: 1080},
    {name: "tablet", width: 768, height: 1024},
    {name: "mobile", width: 375, height: 667}
];

(async () => {
    console.log(`📸 Starting screenshot capture from: ${baseUrl}`);
    console.log(`📁 Output directory: ${outputDir}`);
    console.log('');
    
    const browser = await chromium.launch({ headless: true });
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const page of pages) {
        console.log(`📄 Capturing: ${page.description}`);
        
        for (const viewport of viewports) {
            try {
                const context = await browser.newContext({
                    viewport: { width: viewport.width, height: viewport.height }
                });
                const pageInstance = await context.newPage();
                
                // Navigate to page
                await pageInstance.goto(page.url, { 
                    waitUntil: 'networkidle',
                    timeout: 30000 
                });
                
                // Wait a bit for animations and content to settle
                await pageInstance.waitForTimeout(2000);
                
                // Take full page screenshot
                const fullScreenshot = `${outputDir}/${page.name}-${viewport.name}-full.png`;
                await pageInstance.screenshot({ 
                    path: fullScreenshot, 
                    fullPage: true 
                });
                
                // Take viewport screenshot
                const viewportScreenshot = `${outputDir}/${page.name}-${viewport.name}-viewport.png`;
                await pageInstance.screenshot({ 
                    path: viewportScreenshot, 
                    fullPage: false 
                });
                
                console.log(`  ✅ ${viewport.name}: Full + Viewport`);
                successCount += 2;
                
                await context.close();
                
            } catch (error) {
                console.error(`  ❌ ${viewport.name}: ${error.message}`);
                errorCount++;
            }
        }
    }
    
    await browser.close();
    
    console.log('');
    console.log('================================');
    console.log('Screenshot Capture Summary');
    console.log('================================');
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📁 Output: ${outputDir}`);
    
    process.exit(errorCount > 0 ? 1 : 0);
})();

