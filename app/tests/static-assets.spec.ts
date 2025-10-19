import { test, expect } from '@playwright/test';

test.describe('Static Asset Verification', () => {
  test('badge images load on Astro site', async ({ page }) => {
    await page.goto('https://truwit.ai');
    
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
    
    // Find all badge images
    const badges = page.locator('img[src*="verified"]');
    const badgeCount = await badges.count();
    
    expect(badgeCount).toBeGreaterThan(0);
    
    // Check first badge is visible
    await expect(badges.first()).toBeVisible();
    
    // Verify images actually loaded (not broken)
    const naturalWidth = await badges.first().evaluate(
      (img: HTMLImageElement) => img.naturalWidth
    );
    expect(naturalWidth).toBeGreaterThan(0);
    
    // Test direct URL with cache busting
    const response = await page.goto(
      `https://truwit.ai/images/verified-circular-badge.jpg?v=${Date.now()}`
    );
    expect(response?.status()).toBe(200);
    
    // Verify content type
    const contentType = response?.headers()['content-type'];
    expect(contentType).toContain('image');
  });

  test('badge images load on Angular app', async ({ page }) => {
    await page.goto('https://truwit.ai/app');
    
    // Wait for Angular app to load
    await page.waitForLoadState('networkidle');
    
    const badges = page.locator('img[src*="verified"]');
    const badgeCount = await badges.count();
    
    expect(badgeCount).toBeGreaterThan(0);
    
    // Check first badge is visible
    await expect(badges.first()).toBeVisible();
    
    // Verify correct baseHref path
    const src = await badges.first().getAttribute('src');
    expect(src).toMatch(/\/app\/assets\/|assets\//);
    
    // Verify images actually loaded (not broken)
    const naturalWidth = await badges.first().evaluate(
      (img: HTMLImageElement) => img.naturalWidth
    );
    expect(naturalWidth).toBeGreaterThan(0);
    
    // Test direct URL with cache busting
    const response = await page.goto(
      `https://truwit.ai/app/assets/verified-circular-badge.jpg?v=${Date.now()}`
    );
    expect(response?.status()).toBe(200);
    
    // Verify content type
    const contentType = response?.headers()['content-type'];
    expect(contentType).toContain('image');
  });

  test('all critical assets are accessible', async ({ page }) => {
    const criticalAssets = [
      'https://truwit.ai/images/verified-circular-badge.jpg',
      'https://truwit.ai/images/verified-by-truwit.png',
      'https://truwit.ai/app/assets/verified-circular-badge.jpg',
      'https://truwit.ai/app/assets/verified-by-truwit.png',
      'https://truwit.ai/favicon-truwit.svg',
      'https://truwit.ai/logo.svg'
    ];

    for (const assetUrl of criticalAssets) {
      const cacheBustedUrl = `${assetUrl}?v=${Date.now()}`;
      const response = await page.goto(cacheBustedUrl);
      
      expect(response?.status()).toBe(200);
      
      // Verify it's actually an image/file
      const contentType = response?.headers()['content-type'];
      expect(contentType).toBeTruthy();
      
      // Verify file size is reasonable
      const contentLength = response?.headers()['content-length'];
      if (contentLength) {
        const fileSize = parseInt(contentLength);
        expect(fileSize).toBeGreaterThan(100); // At least 100 bytes
      }
    }
  });

  test('pages load without broken images', async ({ page }) => {
    // Track failed image loads
    const failedImages: string[] = [];
    
    page.on('response', response => {
      if (response.url().includes('.jpg') || response.url().includes('.png') || response.url().includes('.svg')) {
        if (!response.ok()) {
          failedImages.push(response.url());
        }
      }
    });

    // Test Astro site
    await page.goto('https://truwit.ai');
    await page.waitForLoadState('networkidle');
    
    // Check for broken images
    const brokenImages = await page.$$eval('img', imgs => 
      imgs.filter(img => img.naturalWidth === 0).map(img => img.src)
    );
    
    expect(brokenImages).toHaveLength(0);
    expect(failedImages).toHaveLength(0);
    
    // Test Angular app
    await page.goto('https://truwit.ai/app');
    await page.waitForLoadState('networkidle');
    
    const brokenImagesApp = await page.$$eval('img', imgs => 
      imgs.filter(img => img.naturalWidth === 0).map(img => img.src)
    );
    
    expect(brokenImagesApp).toHaveLength(0);
  });

  test('CDN cache headers are configured correctly', async ({ page }) => {
    const testUrl = `https://truwit.ai/images/verified-circular-badge.jpg?v=${Date.now()}`;
    const response = await page.goto(testUrl);
    
    expect(response?.status()).toBe(200);
    
    const headers = response?.headers();
    
    // Check for CDN headers
    const cfCacheStatus = headers['cf-cache-status'];
    const cacheControl = headers['cache-control'];
    
    // Should have some caching configuration
    expect(cfCacheStatus || cacheControl).toBeTruthy();
    
    // If Cloudflare cache status is present, it should be valid
    if (cfCacheStatus) {
      expect(['HIT', 'MISS', 'EXPIRED', 'STALE']).toContain(cfCacheStatus);
    }
  });
});
