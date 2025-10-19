#!/usr/bin/env node

// Post-deployment verification script - tests actual deployment URLs
// with cache busting to ensure assets are accessible

import fetch from 'node-fetch';

// Assets to verify on deployment
const assetsToVerify = [
  { 
    url: 'https://truwit.ai/images/verified-circular-badge.jpg', 
    minSize: 10000, 
    description: 'Astro badge image' 
  },
  { 
    url: 'https://truwit.ai/images/verified-by-truwit.png', 
    minSize: 10000, 
    description: 'Astro verified badge' 
  },
  { 
    url: 'https://truwit.ai/app/assets/verified-circular-badge.jpg', 
    minSize: 10000, 
    description: 'Angular badge image' 
  },
  { 
    url: 'https://truwit.ai/app/assets/verified-by-truwit.png', 
    minSize: 10000, 
    description: 'Angular verified badge' 
  },
  { 
    url: 'https://truwit.ai/favicon-truwit.svg', 
    minSize: 100, 
    description: 'Favicon' 
  },
  { 
    url: 'https://truwit.ai/logo.svg', 
    minSize: 100, 
    description: 'Main logo' 
  }
];

// Pages to verify load correctly
const pagesToVerify = [
  { 
    url: 'https://truwit.ai/', 
    expectedTitle: 'TruWit — Where Provenance Meets Proof',
    description: 'Astro homepage' 
  },
  { 
    url: 'https://truwit.ai/app/', 
    expectedTitle: 'HumanProof',
    description: 'Angular app' 
  }
];

console.log('🌐 Verifying deployment assets...\n');

// Verify static assets
console.log('📄 Checking static assets...');
let allAssetsValid = true;

for (const asset of assetsToVerify) {
  try {
    // Add cache busting parameter
    const cacheBustedUrl = `${asset.url}?v=${Date.now()}`;
    
    console.log(`🔍 Testing: ${asset.url}`);
    const response = await fetch(cacheBustedUrl, {
      method: 'HEAD', // Use HEAD to avoid downloading full content
      timeout: 10000
    });
    
    if (!response.ok) {
      console.error(`❌ FAIL: ${asset.url} returned ${response.status} ${response.statusText}`);
      allAssetsValid = false;
      continue;
    }
    
    const contentLength = response.headers.get('content-length');
    const contentType = response.headers.get('content-type');
    
    if (!contentLength) {
      console.error(`❌ FAIL: ${asset.url} - No content-length header`);
      allAssetsValid = false;
      continue;
    }
    
    const fileSize = parseInt(contentLength);
    if (fileSize < asset.minSize) {
      console.error(`❌ FAIL: ${asset.url} - File too small (${fileSize} bytes, minimum ${asset.minSize})`);
      allAssetsValid = false;
      continue;
    }
    
    console.log(`✅ PASS: ${asset.url} - ${fileSize} bytes (${asset.description})`);
    if (contentType) {
      console.log(`   Content-Type: ${contentType}`);
    }
    
  } catch (error) {
    console.error(`❌ FAIL: ${asset.url} - Network error: ${error.message}`);
    allAssetsValid = false;
  }
}

// Verify pages load correctly
console.log('\n📄 Checking pages...');
let allPagesValid = true;

for (const page of pagesToVerify) {
  try {
    console.log(`🔍 Testing: ${page.url}`);
    const response = await fetch(page.url, {
      method: 'GET',
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Deployment-Verifier/1.0)'
      }
    });
    
    if (!response.ok) {
      console.error(`❌ FAIL: ${page.url} returned ${response.status} ${response.statusText}`);
      allPagesValid = false;
      continue;
    }
    
    const html = await response.text();
    
    // Check for expected title
    if (page.expectedTitle && !html.includes(page.expectedTitle)) {
      console.error(`❌ FAIL: ${page.url} - Expected title "${page.expectedTitle}" not found`);
      allPagesValid = false;
      continue;
    }
    
    // Check for basic HTML structure
    if (!html.includes('<html') || !html.includes('</html>')) {
      console.error(`❌ FAIL: ${page.url} - Invalid HTML structure`);
      allPagesValid = false;
      continue;
    }
    
    console.log(`✅ PASS: ${page.url} - ${page.description}`);
    
  } catch (error) {
    console.error(`❌ FAIL: ${page.url} - Network error: ${error.message}`);
    allPagesValid = false;
  }
}

// Test CDN cache headers
console.log('\n🌐 Checking CDN configuration...');
try {
  const testUrl = `${assetsToVerify[0].url}?v=${Date.now()}`;
  const response = await fetch(testUrl, { method: 'HEAD' });
  
  const cacheControl = response.headers.get('cache-control');
  const cfCacheStatus = response.headers.get('cf-cache-status');
  
  console.log(`Cache-Control: ${cacheControl || 'Not set'}`);
  console.log(`CF-Cache-Status: ${cfCacheStatus || 'Not set'}`);
  
  if (cfCacheStatus === 'MISS') {
    console.log('⚠️  WARNING: CDN cache miss - assets may not be cached yet');
  } else if (cfCacheStatus === 'HIT') {
    console.log('✅ CDN cache working correctly');
  }
  
} catch (error) {
  console.log(`⚠️  Could not check CDN status: ${error.message}`);
}

// Summary
console.log('\n' + '='.repeat(50));
if (allAssetsValid && allPagesValid) {
  console.log('✅ Deployment verification passed!');
  console.log('✅ All assets are accessible');
  console.log('✅ All pages load correctly');
  console.log('✅ Deployment is successful');
} else {
  console.log('❌ Deployment verification failed!');
  if (!allAssetsValid) {
    console.log('❌ Some assets are not accessible');
  }
  if (!allPagesValid) {
    console.log('❌ Some pages failed to load');
  }
  console.log('❌ Check Cloudflare build logs and CDN configuration');
  process.exit(1);
}
