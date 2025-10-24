#!/usr/bin/env node

import { chromium } from 'playwright';
import { readFileSync } from 'fs';

console.log('🖼️  Testing image loading across all application pages...\n');

const testConfig = {
  astroUrl: 'http://localhost:4321',
  angularUrl: 'http://localhost:4200',
  apiUrl: 'http://localhost:5000',
  timeout: 30000,
  screenshots: true
};

// Pages to test
const pagesToTest = [
  // Astro pages
  { name: 'Astro Homepage', url: `${testConfig.astroUrl}/`, framework: 'Astro' },
  { name: 'Astro How It Works', url: `${testConfig.astroUrl}/how-it-works`, framework: 'Astro' },
  
  // Angular pages  
  { name: 'Angular App Home', url: `${testConfig.angularUrl}/`, framework: 'Angular' },
  { name: 'Angular Verify', url: `${testConfig.angularUrl}/verify`, framework: 'Angular' },
  { name: 'Angular Public Verify', url: `${testConfig.angularUrl}/t/TW-12345678`, framework: 'Angular' }
];

// Expected images by framework
const expectedImages = {
  Astro: [
    '/images/banner.png',           // Navbar banner
    '/images/signed_badge.png',     // Feature icons
    '/images/verified-circular-badge.jpg' // Footer badge
  ],
  Angular: [
    'assets/banner.png',            // Navbar banner
    'assets/signed_badge.png',      // Feature icons
    'assets/verified-circular-badge.png' // Footer/verification badges
  ]
};

async function testImageLoading() {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  let allTestsPassed = true;
  const results = [];

  for (const testPage of pagesToTest) {
    console.log(`\n🔍 Testing: ${testPage.name}`);
    console.log(`   URL: ${testPage.url}`);
    
    try {
      // Navigate to page
      const response = await page.goto(testPage.url, { 
        waitUntil: 'networkidle',
        timeout: testConfig.timeout 
      });
      
      if (!response || !response.ok()) {
        throw new Error(`Page failed to load: ${response?.status()}`);
      }
      
      console.log(`   ✅ Page loaded successfully`);

      // Wait for images to load
      await page.waitForTimeout(2000);

      // Get all images on the page
      const images = await page.$$eval('img', imgs => 
        imgs.map(img => ({
          src: img.src,
          alt: img.alt || 'No alt text',
          width: img.width,
          height: img.height,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          complete: img.complete,
          error: img.complete && img.naturalWidth === 0
        }))
      );

      console.log(`   📸 Found ${images.length} images on page`);

      // Check each image
      let pageImagesPassed = true;
      const pageResults = {
        page: testPage.name,
        url: testPage.url,
        framework: testPage.framework,
        totalImages: images.length,
        passedImages: 0,
        failedImages: 0,
        imageDetails: []
      };

      for (const img of images) {
        const isExpectedImage = expectedImages[testPage.framework].some(expected => 
          img.src.includes(expected.replace(/^\//, '').replace(/^assets\//, ''))
        );
        
        if (img.error) {
          console.error(`   ❌ FAILED: ${img.src}`);
          console.error(`      Alt: ${img.alt}`);
          pageImagesPassed = false;
          pageResults.failedImages++;
        } else if (img.complete && img.naturalWidth > 0) {
          console.log(`   ✅ LOADED: ${img.src}`);
          console.log(`      Size: ${img.naturalWidth}x${img.naturalHeight}px`);
          console.log(`      Alt: ${img.alt}`);
          if (isExpectedImage) {
            console.log(`      🎯 Expected ${testPage.framework} asset`);
          }
          pageResults.passedImages++;
        } else {
          console.warn(`   ⚠️  LOADING: ${img.src}`);
          console.warn(`      Complete: ${img.complete}, Natural size: ${img.naturalWidth}x${img.naturalHeight}`);
        }

        pageResults.imageDetails.push({
          src: img.src,
          alt: img.alt,
          loaded: !img.error && img.complete && img.naturalWidth > 0,
          isExpected: isExpectedImage,
          size: `${img.naturalWidth}x${img.naturalHeight}`
        });
      }

      // Check for missing expected images
      const foundImageSrcs = images.map(img => img.src);
      const missingExpectedImages = expectedImages[testPage.framework].filter(expected => {
        return !foundImageSrcs.some(src => src.includes(expected.replace(/^\//, '').replace(/^assets\//, '')));
      });

      if (missingExpectedImages.length > 0) {
        console.error(`   ❌ MISSING expected images:`);
        missingExpectedImages.forEach(missing => {
          console.error(`      - ${missing}`);
        });
        pageImagesPassed = false;
      }

      // Take screenshot for verification
      if (testConfig.screenshots) {
        const screenshotPath = `screenshot-${testPage.name.replace(/\s+/g, '-').toLowerCase()}.png`;
        await page.screenshot({ 
          path: screenshotPath,
          fullPage: true 
        });
        console.log(`   📷 Screenshot saved: ${screenshotPath}`);
      }

      pageResults.success = pageImagesPassed;
      results.push(pageResults);
      
      if (!pageImagesPassed) {
        allTestsPassed = false;
      }

    } catch (error) {
      console.error(`   ❌ ERROR testing ${testPage.name}:`);
      console.error(`      ${error.message}`);
      allTestsPassed = false;
      
      results.push({
        page: testPage.name,
        url: testPage.url,
        framework: testPage.framework,
        success: false,
        error: error.message
      });
    }
  }

  await browser.close();

  // Final summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 IMAGE LOADING TEST SUMMARY');
  console.log('='.repeat(70));

  const passedPages = results.filter(r => r.success).length;
  const failedPages = results.filter(r => !r.success).length;
  const totalImages = results.reduce((sum, r) => sum + (r.passedImages || 0), 0);
  const failedImages = results.reduce((sum, r) => sum + (r.failedImages || 0), 0);

  console.log(`Pages tested: ${results.length}`);
  console.log(`✅ Pages passed: ${passedPages}`);
  console.log(`❌ Pages failed: ${failedPages}`);
  console.log(`📸 Total images loaded: ${totalImages}`);
  console.log(`🚫 Total images failed: ${failedImages}`);

  if (allTestsPassed) {
    console.log('\n🎉 ALL IMAGE LOADING TESTS PASSED!');
    console.log('✅ Banner integration working correctly');
    console.log('✅ Asset consolidation successful');
    console.log('✅ No missing images detected');
  } else {
    console.log('\n🚨 SOME IMAGE LOADING TESTS FAILED!');
    console.log('❌ Check the errors above');
    console.log('💡 Verify asset paths and build processes');
  }

  return allTestsPassed;
}

// Run the tests
testImageLoading()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error during image loading tests:', error);
    process.exit(1);
  });


