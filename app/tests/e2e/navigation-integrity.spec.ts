import { test, expect } from '@playwright/test';
import { 
  createTestMonitor, 
  waitForPageComplete, 
  waitForNoSpinners, 
  verifyPageIntegrity,
  getProofIdsFromApi,
  navigateToVerificationPage
} from '../helpers/test-utils';

/**
 * Navigation Integrity Tests
 * 
 * Tests all public routes for complete loading, no console errors, 
 * no spinner hangs, and proper element rendering
 */

test.describe('Navigation Integrity', () => {
  
  test('home page loads completely with no errors', async ({ page }) => {
    const monitor = createTestMonitor(page);
    
    await page.goto('/');
    await verifyPageIntegrity(page, monitor);
    
    // Verify key home page elements
    await expect(page.locator('.landing-content')).toBeVisible();
    await expect(page.locator('.landing-card')).toBeVisible();
    await expect(page.locator('.features')).toBeVisible();
    await expect(page.locator('.cta-button')).toBeVisible();
    
    // Verify navigation elements
    await expect(page.locator('.nav-brand')).toBeVisible();
    await expect(page.locator('.nav-links')).toBeVisible();
    await expect(page.locator('a[routerLink="/"]')).toBeVisible();
    await expect(page.locator('a[routerLink="/verify"]')).toBeVisible();
  });

  test('verify page loads completely with no errors', async ({ page }) => {
    const monitor = createTestMonitor(page);
    
    await page.goto('/verify');
    await verifyPageIntegrity(page, monitor);
    
    // Verify verification form elements
    await expect(page.locator('input[type="url"], input[name="url"]')).toBeVisible();
    await expect(page.locator('button:has-text("Generate Proof"), button:has-text("Verify")')).toBeVisible();
    
    // Verify form is ready for input
    const urlInput = page.locator('input[type="url"], input[name="url"]').first();
    await expect(urlInput).toBeEnabled();
  });

  test('navigation between pages works without errors', async ({ page }) => {
    const monitor = createTestMonitor(page);
    
    // Start at home
    await page.goto('/');
    await verifyPageIntegrity(page, monitor);
    
    // Navigate to verify page via link
    await page.click('a[routerLink="/verify"]');
    await page.waitForURL('**/verify');
    await verifyPageIntegrity(page, monitor);
    
    // Navigate back to home via link
    await page.click('a[routerLink="/"]');
    await page.waitForURL('**/');
    await verifyPageIntegrity(page, monitor);
  });

  test('all existing proof verification pages load without errors', async ({ page }) => {
    const monitor = createTestMonitor(page);
    
    // Get existing proof IDs from API
    const proofIds = await getProofIdsFromApi();
    
    if (proofIds.length === 0) {
      test.skip(true, 'No existing proofs found in database');
      return;
    }
    
    // Test each proof ID
    for (const proofId of proofIds.slice(0, 5)) { // Limit to first 5 to avoid long test runs
      console.log(`Testing proof ID: ${proofId}`);
      
      monitor.clearErrors();
      await navigateToVerificationPage(page, proofId);
      
      try {
        await verifyPageIntegrity(page, monitor);
        
        // Verify verification page elements
        await expect(page.locator('.verify-content, .public-verify-container')).toBeVisible();
        
        // Check for either verification data or error state
        const hasVerificationData = await page.locator('.verify-content').isVisible();
        const hasErrorState = await page.locator('.error-state').isVisible();
        
        expect(hasVerificationData || hasErrorState).toBe(true);
        
      } catch (error) {
        console.error(`Failed to verify proof ${proofId}:`, error);
        throw error;
      }
    }
  });

  test('invalid proof ID shows error state without spinner hang', async ({ page }) => {
    const monitor = createTestMonitor(page);
    
    await page.goto('/t/INVALID_PROOF_ID_12345');
    await verifyPageIntegrity(page, monitor);
    
    // Should show error state
    await expect(page.locator('.error-state, .verification-not-found')).toBeVisible();
    
    // Should not have any spinners
    const spinners = await page.locator('.loading, .spinner, [class*="loading"]').all();
    for (const spinner of spinners) {
      const isVisible = await spinner.isVisible();
      expect(isVisible).toBe(false);
    }
  });

  test('page refresh maintains state without errors', async ({ page }) => {
    const monitor = createTestMonitor(page);
    
    // Load home page
    await page.goto('/');
    await verifyPageIntegrity(page, monitor);
    
    // Refresh page
    await page.reload();
    await verifyPageIntegrity(page, monitor);
    
    // Verify elements still present
    await expect(page.locator('.landing-content')).toBeVisible();
    await expect(page.locator('.nav-brand')).toBeVisible();
  });

  test('navigation works with browser back/forward buttons', async ({ page }) => {
    const monitor = createTestMonitor(page);
    
    // Navigate to home
    await page.goto('/');
    await verifyPageIntegrity(page, monitor);
    
    // Navigate to verify
    await page.goto('/verify');
    await verifyPageIntegrity(page, monitor);
    
    // Use browser back button
    await page.goBack();
    await page.waitForURL('**/');
    await verifyPageIntegrity(page, monitor);
    
    // Use browser forward button
    await page.goForward();
    await page.waitForURL('**/verify');
    await verifyPageIntegrity(page, monitor);
  });

  test('all static assets load without 404 errors', async ({ page }) => {
    const monitor = createTestMonitor(page);
    
    await page.goto('/');
    await verifyPageIntegrity(page, monitor);
    
    // Check for logo image
    const logo = page.locator('img[src*="logo"]');
    if (await logo.isVisible()) {
      const logoSrc = await logo.getAttribute('src');
      expect(logoSrc).toBeTruthy();
      
      // Verify logo loads
      const logoNaturalWidth = await logo.evaluate((img: HTMLImageElement) => img.naturalWidth);
      expect(logoNaturalWidth).toBeGreaterThan(0);
    }
    
    // Check for badge image on home page
    const badgeImage = page.locator('img[src*="badge"]');
    if (await badgeImage.isVisible()) {
      const badgeSrc = await badgeImage.getAttribute('src');
      expect(badgeSrc).toBeTruthy();
      
      // Verify badge loads
      const badgeNaturalWidth = await badgeImage.evaluate((img: HTMLImageElement) => img.naturalWidth);
      expect(badgeNaturalWidth).toBeGreaterThan(0);
    }
  });

  test('page loads correctly on mobile viewport', async ({ page }) => {
    const monitor = createTestMonitor(page);
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    await verifyPageIntegrity(page, monitor);
    
    // Verify mobile layout elements
    await expect(page.locator('.landing-content')).toBeVisible();
    await expect(page.locator('.nav-brand')).toBeVisible();
    
    // Check that navigation is responsive
    const navLinks = page.locator('.nav-links');
    const isNavVisible = await navLinks.isVisible();
    expect(isNavVisible).toBe(true);
  });

  test('page loads correctly on tablet viewport', async ({ page }) => {
    const monitor = createTestMonitor(page);
    
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto('/');
    await verifyPageIntegrity(page, monitor);
    
    // Verify tablet layout elements
    await expect(page.locator('.landing-content')).toBeVisible();
    await expect(page.locator('.features')).toBeVisible();
    
    // Check features grid layout
    const features = page.locator('.features');
    const featuresVisible = await features.isVisible();
    expect(featuresVisible).toBe(true);
  });

  test('page loads correctly on desktop viewport', async ({ page }) => {
    const monitor = createTestMonitor(page);
    
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    await page.goto('/');
    await verifyPageIntegrity(page, monitor);
    
    // Verify desktop layout elements
    await expect(page.locator('.landing-content')).toBeVisible();
    await expect(page.locator('.features')).toBeVisible();
    await expect(page.locator('.cta-section')).toBeVisible();
  });

  test('no JavaScript errors during page interactions', async ({ page }) => {
    const monitor = createTestMonitor(page);
    
    await page.goto('/');
    await verifyPageIntegrity(page, monitor);
    
    // Interact with elements
    const ctaButton = page.locator('.cta-button');
    if (await ctaButton.isVisible()) {
      await ctaButton.click();
      await page.waitForURL('**/verify');
      await verifyPageIntegrity(page, monitor);
    }
    
    // Navigate back
    await page.goBack();
    await verifyPageIntegrity(page, monitor);
    
    // Click on brand name
    const brandName = page.locator('.brand-name');
    if (await brandName.isVisible()) {
      await brandName.click();
      // Should navigate to external site, so just verify no errors
      await page.waitForTimeout(2000);
    }
  });

  test('footer displays correctly on all pages', async ({ page }) => {
    const monitor = createTestMonitor(page);
    
    // Test home page footer
    await page.goto('/');
    await verifyPageIntegrity(page, monitor);
    
    const footer = page.locator('.footer');
    if (await footer.isVisible()) {
      await expect(footer).toContainText('Truwit');
      await expect(footer).toContainText('All rights reserved');
    }
    
    // Test verify page footer
    await page.goto('/verify');
    await verifyPageIntegrity(page, monitor);
    
    const verifyFooter = page.locator('.footer');
    if (await verifyFooter.isVisible()) {
      await expect(verifyFooter).toContainText('Truwit');
    }
  });
});

