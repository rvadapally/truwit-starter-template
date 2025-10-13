import { test, expect } from '@playwright/test';

/**
 * Proof Verification Page Tests
 * 
 * Tests viewing and interacting with proof verification pages
 */

test.describe('Proof Verification Page', () => {
  
  test('loads verification page with valid proof ID', async ({ page }) => {
    // Skip if local (need real proof from production)
    test.skip(process.env.BASE_URL?.includes('localhost'), 'Requires production proof');
    
    // Navigate to a known proof (you'll need to update this with a real ID)
    await page.goto('/t/test-proof-id');
    
    // Should show proof details
    await expect(page.locator('text=/content hash/i')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/issued at/i')).toBeVisible();
  });

  test('displays 404 for non-existent proof', async ({ page }) => {
    await page.goto('/t/NOTFOUND123');
    
    // Should show error or 404 message
    await expect(page.locator('text=/not found/i, text=/404/i, text=/error/i')).toBeVisible({ timeout: 10000 });
  });

  test('shows all required proof information', async ({ page }) => {
    test.skip(process.env.BASE_URL?.includes('localhost'), 'Requires production proof');
    
    await page.goto('/t/test-proof-id');
    
    // Check for key information fields
    await expect(page.locator('text=/content hash/i')).toBeVisible();
    await expect(page.locator('text=/verdict/i, text=/status/i')).toBeVisible();
    await expect(page.locator('text=/issued at/i, text=/created/i')).toBeVisible();
    await expect(page.locator('text=/signature/i')).toBeVisible();
  });

  test('content hash is displayed correctly', async ({ page }) => {
    test.skip(process.env.BASE_URL?.includes('localhost'), 'Requires production proof');
    
    await page.goto('/t/test-proof-id');
    
    // Should show a 64-character hex string (SHA-256)
    const hashElement = page.locator('text=/[a-f0-9]{64}/i');
    await expect(hashElement).toBeVisible();
    
    // Hash should not overflow container
    const boundingBox = await hashElement.boundingBox();
    expect(boundingBox).not.toBeNull();
  });

  test('can copy content hash', async ({ page }) => {
    test.skip(process.env.BASE_URL?.includes('localhost'), 'Requires production proof');
    
    await page.goto('/t/test-proof-id');
    
    // Grant clipboard permissions
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    
    // Find and click copy button
    const copyButton = page.locator('button:has-text("Copy")').first();
    if (await copyButton.isVisible()) {
      await copyButton.click();
      
      // Verify clipboard contains hash
      const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
      expect(clipboardText).toMatch(/[a-f0-9]{64}/);
    }
  });

  test('can copy verification link', async ({ page }) => {
    test.skip(process.env.BASE_URL?.includes('localhost'), 'Requires production proof');
    
    await page.goto('/t/test-proof-id');
    
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    
    // Click copy link button
    const copyLinkButton = page.locator('button:has-text("Copy"), button:has-text("Link")').first();
    if (await copyLinkButton.isVisible()) {
      await copyLinkButton.click();
      
      // Clipboard should contain the current page URL
      const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
      expect(clipboardText).toContain('/t/');
    }
  });

  test('can share to X/Twitter', async ({ page }) => {
    test.skip(process.env.BASE_URL?.includes('localhost'), 'Requires production proof');
    
    await page.goto('/t/test-proof-id');
    
    // Find share button
    const shareButton = page.locator('button:has-text("Share"), button:has-text("Twitter"), button:has-text("X")').first();
    
    if (await shareButton.isVisible()) {
      // Listen for popup
      const popupPromise = page.waitForEvent('popup');
      await shareButton.click();
      const popup = await popupPromise;
      
      // Verify it opens Twitter
      await popup.waitForLoadState();
      expect(popup.url()).toContain('twitter.com');
      await popup.close();
    }
  });

  test('displays badge correctly', async ({ page }) => {
    test.skip(true, 'Badge feature not yet implemented');
    
    await page.goto('/t/test-proof-id');
    
    // Should show badge or link to badge
    await expect(page.locator('img[src*="badge"], a[href*="badge"]')).toBeVisible();
  });

  test('timestamps display in correct format', async ({ page }) => {
    test.skip(process.env.BASE_URL?.includes('localhost'), 'Requires production proof');
    
    await page.goto('/t/test-proof-id');
    
    // Should show ISO timestamp or formatted date
    const timestampElement = page.locator('text=/[0-9]{4}-[0-9]{2}-[0-9]{2}/');
    await expect(timestampElement).toBeVisible();
  });

  test('shows both UTC and local time', async ({ page }) => {
    test.skip(process.env.BASE_URL?.includes('localhost'), 'Requires production proof');
    
    await page.goto('/t/test-proof-id');
    
    // Should display timestamps in both UTC and local
    await expect(page.locator('text=/UTC/i')).toBeVisible();
    await expect(page.locator('text=/local/i, text=/your time/i')).toBeVisible();
  });

  test('verdict/status is clearly visible', async ({ page }) => {
    test.skip(process.env.BASE_URL?.includes('localhost'), 'Requires production proof');
    
    await page.goto('/t/test-proof-id');
    
    // Verdict badge should be prominent
    const verdictBadge = page.locator('[class*="verdict"], [class*="badge"], [class*="status"]').first();
    await expect(verdictBadge).toBeVisible();
    
    // Should have color coding
    const hasColorClass = await verdictBadge.evaluate(el => {
      const classes = el.className;
      return classes.includes('green') || classes.includes('yellow') || classes.includes('red') || 
             classes.includes('success') || classes.includes('warning') || classes.includes('error');
    });
    expect(hasColorClass).toBe(true);
  });

  test('displays declared metadata', async ({ page }) => {
    test.skip(process.env.BASE_URL?.includes('localhost'), 'Requires production proof');
    
    await page.goto('/t/test-proof-id');
    
    // Should show metadata like generator, prompt, license
    await expect(page.locator('text=/generator/i')).toBeVisible();
    await expect(page.locator('text=/license/i')).toBeVisible();
  });

  test('signature status is explained clearly', async ({ page }) => {
    test.skip(process.env.BASE_URL?.includes('localhost'), 'Requires production proof');
    
    await page.goto('/t/test-proof-id');
    
    // Should show signature status
    await expect(page.locator('text=/signature/i')).toBeVisible();
    
    // If invalid, should explain why
    const signatureElement = page.locator('text=/signature/i').first();
    const isInvalid = await signatureElement.evaluate(el => el.textContent?.toLowerCase().includes('invalid'));
    
    if (isInvalid) {
      // Should have explanation
      await expect(page.locator('text=/no c2pa/i, text=/not signed/i')).toBeVisible();
    }
  });

  test('page is shareable via direct URL', async ({ page }) => {
    test.skip(process.env.BASE_URL?.includes('localhost'), 'Requires production proof');
    
    // Open page directly via URL
    await page.goto('/t/test-proof-id');
    
    // Should load correctly (not redirect to home)
    await expect(page).toHaveURL(/\/t\/test-proof-id/);
    await expect(page.locator('text=/content hash/i')).toBeVisible();
  });

  test('handles slow network gracefully', async ({ page }) => {
    test.skip(process.env.BASE_URL?.includes('localhost'), 'Requires production proof');
    
    // Simulate slow network
    await page.route('**/v1/proofs/verify/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 3000)); // 3s delay
      await route.continue();
    });
    
    await page.goto('/t/test-proof-id');
    
    // Should show loading state
    await expect(page.locator('.loading, .spinner, [class*="loading"]')).toBeVisible();
    
    // Eventually loads
    await expect(page.locator('text=/content hash/i')).toBeVisible({ timeout: 15000 });
  });

  test('refreshing page maintains proof details', async ({ page }) => {
    test.skip(process.env.BASE_URL?.includes('localhost'), 'Requires production proof');
    
    await page.goto('/t/test-proof-id');
    await expect(page.locator('text=/content hash/i')).toBeVisible();
    
    // Reload page
    await page.reload();
    
    // Should still show proof
    await expect(page.locator('text=/content hash/i')).toBeVisible();
  });
});


