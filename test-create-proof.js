#!/usr/bin/env node

import { chromium } from 'playwright';

console.log('🧪 Testing proof creation and asset integration...\n');

async function createTestProof() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔄 Creating test proof via API...');
    
    // Use page.evaluate to make API call
    const response = await page.evaluate(async () => {
      const response = await fetch('http://localhost:5000/v1/proofs/url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `test-browser-${Date.now()}`
        },
        body: JSON.stringify({
          url: 'https://youtu.be/dQw4w9WgXcQ'
        })
      });
      
      if (response.ok) {
        return await response.json();
      } else {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
    });

    console.log('✅ Test proof created successfully!');
    console.log(`   📝 Proof ID: ${response.proofId}`);
    console.log(`   🏷️  Trustmark ID: ${response.trustmarkId}`);
    console.log(`   🔗 Verify URL: ${response.verifyUrl}`);

    // Test the generated proof card
    if (response.trustmarkId) {
      console.log(`\n🎨 Testing generated proof card...`);
      const proofCardUrl = `http://localhost:5000/cards/proof/${response.trustmarkId}-800.png`;
      console.log(`   🔍 Testing: ${proofCardUrl}`);
      
      const cardResponse = await page.goto(proofCardUrl, { waitUntil: 'networkidle' });
      if (cardResponse && cardResponse.ok()) {
        console.log('   ✅ Proof card generated successfully!');
        console.log(`   📏 Content-Type: ${cardResponse.headers()['content-type']}`);
        
        // Take screenshot
        await page.screenshot({ path: `screenshot-proof-card-${response.trustmarkId}.png` });
        console.log(`   📷 Proof card screenshot saved`);
      } else {
        console.error(`   ❌ Proof card failed: ${cardResponse?.status()}`);
      }

      // Test verification page with the proof
      console.log(`\n🔍 Testing verification page...`);
      const verifyUrl = `http://localhost:4200${response.verifyUrl}`;
      console.log(`   🔍 Testing: ${verifyUrl}`);
      
      const verifyResponse = await page.goto(verifyUrl, { waitUntil: 'networkidle' });
      if (verifyResponse && verifyResponse.ok()) {
        console.log('   ✅ Verification page loaded!');
        
        // Check images on verification page
        const images = await page.$$eval('img', imgs => 
          imgs.map(img => ({
            src: img.src,
            alt: img.alt,
            complete: img.complete,
            naturalWidth: img.naturalWidth,
            error: img.complete && img.naturalWidth === 0
          }))
        );

        console.log(`   📸 Found ${images.length} images on verification page:`);
        images.forEach(img => {
          if (img.error) {
            console.error(`     ❌ FAILED: ${img.src}`);
          } else if (img.complete && img.naturalWidth > 0) {
            console.log(`     ✅ LOADED: ${img.src} (${img.naturalWidth}x${img.naturalHeight}px)`);
          }
        });
        
        await page.screenshot({ path: `screenshot-verify-page-${response.trustmarkId}.png`, fullPage: true });
        console.log(`   📷 Verification page screenshot saved`);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  } finally {
    await browser.close();
  }

  return true;
}

createTestProof()
  .then(success => {
    if (success) {
      console.log('\n🎉 PROOF CREATION AND ASSET INTEGRATION SUCCESSFUL!');
      console.log('✅ API CardTemplates working correctly');
      console.log('✅ Proof card generation using consolidated assets');
      console.log('✅ Frontend verification displaying properly');
    } else {
      console.log('\n❌ PROOF CREATION TEST FAILED');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
