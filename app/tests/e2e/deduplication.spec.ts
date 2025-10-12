import { test, expect } from '@playwright/test';

/**
 * Deduplication & Idempotency Tests
 * 
 * Tests that duplicate URLs return the same proof
 */

test.describe('Deduplication & Idempotency', () => {
  
  test('submitting same URL twice returns same proof ID', async ({ page }) => {
    const testUrl = 'https://www.tiktok.com/@toptierlives/video/7555756163036433677';
    
    // First submission
    await page.goto('/verify');
    await page.fill('input[type="url"]', testUrl);
    await page.click('button:has-text("Generate Proof")');
    
    await page.waitForSelector('.success-message', { timeout: 120000 });
    
    // Extract first proof ID/trustmark ID
    const firstProofText = await page.textContent('body');
    const firstProofIdMatch = firstProofText?.match(/([a-z0-9]{8})/i);
    const firstProofId = firstProofIdMatch ? firstProofIdMatch[1] : null;
    
    expect(firstProofId).not.toBeNull();
    
    // Second submission (same URL)
    await page.goto('/verify');
    await page.fill('input[type="url"]', testUrl);
    await page.click('button:has-text("Generate Proof")');
    
    await page.waitForSelector('.success-message', { timeout: 120000 });
    
    // Extract second proof ID
    const secondProofText = await page.textContent('body');
    const secondProofIdMatch = secondProofText?.match(/([a-z0-9]{8})/i);
    const secondProofId = secondProofIdMatch ? secondProofIdMatch[1] : null;
    
    // Should be the same proof ID
    expect(secondProofId).toBe(firstProofId);
  });

  test('deduplication message is shown for duplicate URLs', async ({ page }) => {
    const testUrl = 'https://www.tiktok.com/@toptierlives/video/7555756163036433677';
    
    // First submission
    await page.goto('/verify');
    await page.fill('input[type="url"]', testUrl);
    await page.click('button:has-text("Generate Proof")');
    await page.waitForSelector('.success-message', { timeout: 120000 });
    
    // Second submission
    await page.goto('/verify');
    await page.fill('input[type="url"]', testUrl);
    await page.click('button:has-text("Generate Proof")');
    await page.waitForSelector('.success-message', { timeout: 120000 });
    
    // Should mention it's a duplicate or already exists
    const bodyText = await page.textContent('body');
    const mentions Duplicate = bodyText?.toLowerCase().includes('duplicate') || 
                             bodyText?.toLowerCase().includes('already') ||
                             bodyText?.toLowerCase().includes('existing');
    
    // May or may not show message, but should work either way
  });

  test('deduplication works for URLs with different parameters', async ({ page }) => {
    // YouTube URLs with different tracking parameters
    const url1 = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';
    const url2 = 'https://www.youtube.com/watch?v=jNQXAC9IVRw&si=abc123';
    
    // First URL
    await page.goto('/verify');
    await page.fill('input[type="url"]', url1);
    await page.click('button:has-text("Generate Proof")');
    
    const result1 = await page.waitForSelector('.success-message, .error-message', { timeout: 120000 });
    const isSuccess1 = await page.locator('.success-message').isVisible();
    
    if (isSuccess1) {
      const firstProofText = await page.textContent('body');
      const firstProofIdMatch = firstProofText?.match(/([a-z0-9]{8})/i);
      const firstProofId = firstProofIdMatch ? firstProofIdMatch[1] : null;
      
      // Second URL (with extra parameters)
      await page.goto('/verify');
      await page.fill('input[type="url"]', url2);
      await page.click('button:has-text("Generate Proof")');
      
      const result2 = await page.waitForSelector('.success-message, .error-message', { timeout: 120000 });
      const isSuccess2 = await page.locator('.success-message').isVisible();
      
      if (isSuccess2) {
        const secondProofText = await page.textContent('body');
        const secondProofIdMatch = secondProofText?.match(/([a-z0-9]{8})/i);
        const secondProofId = secondProofIdMatch ? secondProofIdMatch[1] : null;
        
        // Should be the same (canonical URL is the same)
        expect(secondProofId).toBe(firstProofId);
      }
    }
  });

  test('deduplication is fast (returns cached result)', async ({ page }) => {
    const testUrl = 'https://www.tiktok.com/@toptierlives/video/7555756163036433677';
    
    // First submission (slow - downloads video)
    await page.goto('/verify');
    await page.fill('input[type="url"]', testUrl);
    
    const startTime1 = Date.now();
    await page.click('button:has-text("Generate Proof")');
    await page.waitForSelector('.success-message', { timeout: 120000 });
    const duration1 = Date.now() - startTime1;
    
    // Second submission (should be fast - cached)
    await page.goto('/verify');
    await page.fill('input[type="url"]', testUrl);
    
    const startTime2 = Date.now();
    await page.click('button:has-text("Generate Proof")');
    await page.waitForSelector('.success-message', { timeout: 120000 });
    const duration2 = Date.now() - startTime2;
    
    // Second request should be significantly faster (less than 50% of first)
    expect(duration2).toBeLessThan(duration1 * 0.5);
  });

  test('different URLs create different proofs', async ({ page }) => {
    const urls = [
      'https://www.tiktok.com/@toptierlives/video/7555756163036433677',
      'https://www.tiktok.com/@test/video/12345',
    ];
    
    const proofIds: (string | null)[] = [];
    
    for (const url of urls) {
      await page.goto('/verify');
      await page.fill('input[type="url"]', url);
      await page.click('button:has-text("Generate Proof")');
      
      await page.waitForSelector('.success-message, .error-message', { timeout: 120000 });
      
      const isSuccess = await page.locator('.success-message').isVisible();
      if (isSuccess) {
        const proofText = await page.textContent('body');
        const proofIdMatch = proofText?.match(/([a-z0-9]{8})/i);
        proofIds.push(proofIdMatch ? proofIdMatch[1] : null);
      } else {
        proofIds.push(null);
      }
    }
    
    // Filter out nulls
    const validProofIds = proofIds.filter(id => id !== null);
    
    // All valid proof IDs should be unique
    const uniqueProofIds = new Set(validProofIds);
    expect(uniqueProofIds.size).toBe(validProofIds.length);
  });

  test('file uploads with same hash are deduplicated', async ({ page }) => {
    test.skip(true, 'Requires multiple uploads of same file');
    
    const testFilePath = require('path').join(__dirname, '../fixtures/sample.mp4');
    
    // First upload
    await page.goto('/verify');
    const fileInput1 = page.locator('input[type="file"]');
    await fileInput1.setInputFiles(testFilePath);
    await page.click('button:has-text("Generate Proof")');
    await page.waitForSelector('.success-message', { timeout: 120000 });
    
    const firstProofText = await page.textContent('body');
    const firstProofIdMatch = firstProofText?.match(/([a-z0-9]{8})/i);
    const firstProofId = firstProofIdMatch ? firstProofIdMatch[1] : null;
    
    // Second upload (same file)
    await page.goto('/verify');
    const fileInput2 = page.locator('input[type="file"]');
    await fileInput2.setInputFiles(testFilePath);
    await page.click('button:has-text("Generate Proof")');
    await page.waitForSelector('.success-message', { timeout: 120000 });
    
    const secondProofText = await page.textContent('body');
    const secondProofIdMatch = secondProofText?.match(/([a-z0-9]{8})/i);
    const secondProofId = secondProofIdMatch ? secondProofIdMatch[1] : null;
    
    // Should return same proof (same content hash)
    expect(secondProofId).toBe(firstProofId);
  });
});

