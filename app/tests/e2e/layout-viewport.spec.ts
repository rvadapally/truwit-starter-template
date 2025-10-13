import { test, expect } from '@playwright/test';

/**
 * Layout and Viewport Tests
 * 
 * These tests catch issues like:
 * - Elements requiring scrolling to see
 * - Content overflow
 * - Responsive design breakage
 * - Hidden buttons/messages
 */

test.describe('Layout and Viewport Tests', () => {
  
  test('homepage elements are visible without scrolling on desktop', async ({ page }) => {
    await page.goto('/');
    
    // Check that key elements are visible in viewport
    await expect(page.getByRole('heading', { name: /truwit/i })).toBeInViewport();
    await expect(page.getByRole('button', { name: /verify/i })).toBeInViewport();
    
    // Ensure no scrolling is needed to see primary CTA
    const isInViewport = await page.getByRole('button', { name: /verify/i }).isInViewport();
    expect(isInViewport).toBe(true);
  });

  test('verification form is fully visible without scrolling', async ({ page }) => {
    await page.goto('/verify');
    
    // All form elements should be in viewport
    await expect(page.getByLabel(/url/i)).toBeInViewport();
    await expect(page.getByRole('button', { name: /generate proof/i })).toBeInViewport();
    
    // File upload button should be visible
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible();
  });

  test('success messages are visible after form submission', async ({ page }) => {
    await page.goto('/verify');
    
    // Fill form
    await page.fill('input[type="url"]', 'https://www.tiktok.com/@test/video/123');
    
    // Click submit
    await page.click('button:has-text("Generate Proof")');
    
    // Wait for response (success or error)
    await page.waitForSelector('.success-message, .error-message', { timeout: 60000 });
    
    // Check if message is in viewport (not requiring scroll)
    const messageVisible = await page.locator('.success-message, .error-message').isInViewport();
    expect(messageVisible).toBe(true);
  });

  test('error messages are visible without scrolling', async ({ page }) => {
    await page.goto('/verify');
    
    // Submit without filling form
    await page.click('button:has-text("Generate Proof")');
    
    // Error message should appear
    await page.waitForSelector('.error-message, [class*="error"]', { timeout: 5000 });
    
    // Should be visible in viewport
    const errorVisible = await page.locator('.error-message, [class*="error"]').first().isInViewport();
    expect(errorVisible).toBe(true);
  });

  test('verification details page fits in viewport', async ({ page }) => {
    // Skip if running on local (need real proof)
    test.skip(process.env.BASE_URL?.includes('localhost'), 'Requires production data');
    
    await page.goto('/t/test-id');
    
    // Key information should be visible
    await expect(page.getByText(/content hash/i)).toBeInViewport();
    await expect(page.getByText(/issued at/i)).toBeInViewport();
  });

  test('mobile: all critical elements accessible with normal scrolling', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    
    await page.goto('/verify');
    
    // Form should be usable
    await expect(page.getByLabel(/url/i)).toBeVisible();
    
    // Scroll to submit button
    await page.getByRole('button', { name: /generate proof/i }).scrollIntoViewIfNeeded();
    await expect(page.getByRole('button', { name: /generate proof/i })).toBeVisible();
  });

  test('tablet: layout adapts correctly', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    
    await page.goto('/');
    
    // Check responsive layout
    await expect(page.getByRole('heading')).toBeVisible();
    await expect(page.getByRole('button', { name: /verify/i })).toBeVisible();
  });

  test('desktop: no horizontal scrolling required', async ({ page }) => {
    await page.goto('/verify');
    
    // Get page dimensions
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    
    // Body should not exceed viewport width (no horizontal scroll)
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1); // +1 for rounding
  });

  test('mobile: no horizontal scrolling required', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/verify');
    
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1);
  });

  test('long content hashes display correctly without breaking layout', async ({ page }) => {
    test.skip(process.env.BASE_URL?.includes('localhost'), 'Requires production data');
    
    await page.goto('/t/test-id');
    
    // Content hash should be visible and not overflow
    const hashElement = page.getByText(/[a-f0-9]{64}/);
    await expect(hashElement).toBeVisible();
    
    // Check if it breaks the layout
    const boundingBox = await hashElement.boundingBox();
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    
    if (boundingBox) {
      expect(boundingBox.x + boundingBox.width).toBeLessThanOrEqual(viewportWidth);
    }
  });

  test('form remains usable after window resize', async ({ page }) => {
    await page.goto('/verify');
    
    // Start with desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.getByLabel(/url/i)).toBeVisible();
    
    // Resize to mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500); // Wait for layout to adjust
    
    // Form should still be usable
    await expect(page.getByLabel(/url/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /generate proof/i })).toBeVisible();
  });

  test('footer doesnt overlap content', async ({ page }) => {
    await page.goto('/verify');
    
    const footer = page.locator('footer, [class*="footer"]');
    const mainContent = page.locator('main, [class*="main"], [class*="content"]').first();
    
    if (await footer.count() > 0 && await mainContent.count() > 0) {
      const footerBox = await footer.boundingBox();
      const contentBox = await mainContent.boundingBox();
      
      if (footerBox && contentBox) {
        // Footer should not overlap main content
        expect(footerBox.y).toBeGreaterThanOrEqual(contentBox.y + contentBox.height - 10); // -10 for tolerance
      }
    }
  });

  test('navigation menu accessible on all viewport sizes', async ({ page }) => {
    const viewports = [
      { width: 1920, height: 1080, name: 'desktop' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 375, height: 667, name: 'mobile' },
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/');
      
      // Navigation should be accessible (either visible or in hamburger menu)
      const hasVisibleNav = await page.locator('nav, [class*="nav"]').isVisible();
      const hasHamburger = await page.locator('button[class*="menu"], button[class*="hamburger"]').isVisible();
      
      expect(hasVisibleNav || hasHamburger).toBe(true);
    }
  });
});


