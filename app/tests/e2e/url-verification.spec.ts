import { test, expect } from '@playwright/test';

/**
 * URL Verification Flow Tests
 * 
 * Tests the complete user journey for verifying content via URL
 */

test.describe('URL Verification Flow', () => {
  
  test('successfully verifies TikTok URL', async ({ page }) => {
    await page.goto('/verify');
    
    // Fill in TikTok URL
    const urlInput = page.locator('input[type="url"], input[name="url"], input[placeholder*="URL"]').first();
    await urlInput.fill('https://www.tiktok.com/@toptierlives/video/7555756163036433677');
    
    // Optional metadata fields
    await page.fill('input[name="toolName"], input[placeholder*="generator"]', 'Playwright Test Runner');
    await page.fill('textarea[name="prompt"], textarea[placeholder*="prompt"]', 'Automated E2E test');
    
    // Submit form
    await page.click('button:has-text("Generate Proof"), button:has-text("Verify")');
    
    // Wait for processing (TikTok is usually fast)
    await page.waitForSelector('.success-message, [class*="success"], .verification-result', { timeout: 120000 });
    
    // Check for success indicators
    const successVisible = await page.locator('.success-message, [class*="success"]').isVisible();
    expect(successVisible).toBe(true);
    
    // Should show proof ID or trustmark ID
    const hasProofId = await page.locator('text=/proof/i, text=/trustmark/i').isVisible();
    expect(hasProofId).toBe(true);
  });

  test('successfully verifies YouTube URL (if cookies configured)', async ({ page }) => {
    await page.goto('/verify');
    
    const urlInput = page.locator('input[type="url"]').first();
    await urlInput.fill('https://www.youtube.com/watch?v=jNQXAC9IVRw');
    
    await page.click('button:has-text("Generate Proof"), button:has-text("Verify")');
    
    // Wait for result (success or bot detection error)
    await page.waitForSelector('.success-message, .error-message', { timeout: 120000 });
    
    const errorText = await page.textContent('body');
    
    if (errorText?.includes('bot') || errorText?.includes('Sign in')) {
      // Expected if cookies not configured
      test.info().annotations.push({ type: 'known-issue', description: 'YouTube bot detection - cookies needed' });
    } else {
      // Should show success
      const successVisible = await page.locator('.success-message').isVisible();
      expect(successVisible).toBe(true);
    }
  });

  test('shows error for invalid URL format', async ({ page }) => {
    await page.goto('/verify');
    
    const urlInput = page.locator('input[type="url"]').first();
    await urlInput.fill('not-a-valid-url');
    
    await page.click('button:has-text("Generate Proof")');
    
    // Should show validation error
    await page.waitForSelector('.error-message, [class*="error"]', { timeout: 10000 });
    
    const errorVisible = await page.locator('.error-message, [class*="error"]').isVisible();
    expect(errorVisible).toBe(true);
  });

  test('shows error when URL field is empty', async ({ page }) => {
    await page.goto('/verify');
    
    // Try to submit without filling URL
    await page.click('button:has-text("Generate Proof")');
    
    // Should show error or button should be disabled
    const errorShown = await page.locator('.error-message, [class*="error"]').isVisible().catch(() => false);
    const buttonDisabled = await page.locator('button:has-text("Generate Proof")').isDisabled();
    
    expect(errorShown || buttonDisabled).toBe(true);
  });

  test('displays proof details after successful verification', async ({ page }) => {
    await page.goto('/verify');
    
    await page.fill('input[type="url"]', 'https://www.tiktok.com/@toptierlives/video/7555756163036433677');
    await page.click('button:has-text("Generate Proof")');
    
    // Wait for success
    await page.waitForSelector('.success-message, [class*="success"]', { timeout: 120000 });
    
    // Should display proof information
    const hasVerifyLink = await page.locator('a:has-text("Show Verification"), a:has-text("View Details"), a[href*="/t/"]').isVisible();
    expect(hasVerifyLink).toBe(true);
  });

  test('verify link navigates to proof page', async ({ page }) => {
    await page.goto('/verify');
    
    await page.fill('input[type="url"]', 'https://www.tiktok.com/@toptierlives/video/7555756163036433677');
    await page.click('button:has-text("Generate Proof")');
    
    await page.waitForSelector('.success-message', { timeout: 120000 });
    
    // Click on verification link
    const verifyLink = page.locator('a:has-text("Show Verification"), a:has-text("View Details"), a[href*="/t/"]').first();
    await verifyLink.click();
    
    // Should navigate to proof page
    await page.waitForURL(/\/t\/[a-zA-Z0-9]+/, { timeout: 10000 });
    
    // Proof page should load
    await expect(page.locator('text=/content hash/i')).toBeVisible({ timeout: 10000 });
  });

  test('can verify multiple URLs in sequence', async ({ page }) => {
    await page.goto('/verify');
    
    const urls = [
      'https://www.tiktok.com/@toptierlives/video/7555756163036433677',
      'https://www.tiktok.com/@test/video/12345', // May fail but shouldn't break
    ];
    
    for (const url of urls) {
      await page.fill('input[type="url"]', url);
      await page.click('button:has-text("Generate Proof")');
      
      // Wait for result
      await page.waitForSelector('.success-message, .error-message', { timeout: 60000 });
      
      // Form should be ready for next input
      const urlInput = page.locator('input[type="url"]');
      await expect(urlInput).toBeEnabled();
    }
  });

  test('loading state shows during processing', async ({ page }) => {
    await page.goto('/verify');
    
    await page.fill('input[type="url"]', 'https://www.tiktok.com/@toptierlives/video/7555756163036433677');
    await page.click('button:has-text("Generate Proof")');
    
    // Should show loading indicator immediately
    const loadingVisible = await page.locator('.spinner, .loading, [class*="loading"]').isVisible();
    expect(loadingVisible).toBe(true);
    
    // Button should be disabled during processing
    const buttonDisabled = await page.locator('button:has-text("Generate Proof")').isDisabled();
    expect(buttonDisabled).toBe(true);
  });

  test('can copy verification link', async ({ page }) => {
    await page.goto('/verify');
    
    await page.fill('input[type="url"]', 'https://www.tiktok.com/@toptierlives/video/7555756163036433677');
    await page.click('button:has-text("Generate Proof")');
    
    await page.waitForSelector('.success-message', { timeout: 120000 });
    
    // Click copy link button (if exists)
    const copyButton = page.locator('button:has-text("Copy"), button[title*="Copy"]').first();
    if (await copyButton.isVisible()) {
      // Grant clipboard permissions
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
      
      await copyButton.click();
      
      // Check clipboard (might contain verification URL)
      const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
      expect(clipboardText).toContain('http');
    }
  });

  test('handles network errors gracefully', async ({ page }) => {
    // Simulate network failure
    await page.route('**/v1/proofs/url', route => route.abort());
    
    await page.goto('/verify');
    await page.fill('input[type="url"]', 'https://www.tiktok.com/@test/video/123');
    await page.click('button:has-text("Generate Proof")');
    
    // Should show error message
    await page.waitForSelector('.error-message, [class*="error"]', { timeout: 10000 });
    
    const errorVisible = await page.locator('.error-message').isVisible();
    expect(errorVisible).toBe(true);
  });
});


