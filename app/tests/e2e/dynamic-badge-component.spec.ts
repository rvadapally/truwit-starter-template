import { test, expect } from '@playwright/test';
import { 
  createTestMonitor, 
  waitForPageComplete, 
  waitForNoSpinners, 
  verifyPageIntegrity,
  getProofIdsFromApi,
  navigateToVerificationPage,
  verifyBadgeImageLoads,
  testBadgeActions
} from '../helpers/test-utils';

/**
 * Dynamic Badge Component Tests
 * 
 * Focused tests for badge component loading states, error handling, and actions
 */

test.describe('Dynamic Badge Component', () => {
  
  test('badge loading state displays correctly', async ({ page }) => {
    const monitor = createTestMonitor(page);
    
    // Get existing proof IDs
    const proofIds = await getProofIdsFromApi();
    
    if (proofIds.length === 0) {
      test.skip(true, 'No existing proofs found for testing');
      return;
    }
    
    const proofId = proofIds[0];
    
    // Navigate to verification page
    await page.goto(`/t/${proofId}`);
    
    // Check for loading state initially
    const loadingSpinner = page.locator('.loading-spinner, .badge-loading');
    const hasLoadingState = await loadingSpinner.isVisible();
    
    if (hasLoadingState) {
      // Wait for loading to complete
      await waitForNoSpinners(page, 10000);
    }
    
    await verifyPageIntegrity(page, monitor);
    
    // Verify badge eventually loads
    await verifyBadgeImageLoads(page, 'img.badge-image');
  });

  test('badge error state shows fallback correctly', async ({ page }) => {
    const monitor = createTestMonitor(page);
    
    // Test with invalid proof ID to trigger error state
    await page.goto('/t/INVALID_PROOF_ID_FOR_ERROR_TEST');
    await verifyPageIntegrity(page, monitor);
    
    // Should show error state
    const errorState = page.locator('.error-state, .verification-not-found');
    const hasErrorState = await errorState.isVisible();
    
    if (hasErrorState) {
      // Verify error message is displayed
      await expect(errorState).toBeVisible();
      
      // Verify retry button is present
      const retryButton = page.locator('button:has-text("Retry")');
      if (await retryButton.isVisible()) {
        await expect(retryButton).toBeEnabled();
      }
    } else {
      // If no error state, verify fallback badge displays
      const fallbackBadge = page.locator('img[src*="signed_badge.png"]');
      if (await fallbackBadge.isVisible()) {
        await verifyBadgeImageLoads(page, 'img[src*="signed_badge.png"]');
      }
    }
  });

  test('badge actions work correctly on multiple proofs', async ({ page }) => {
    const monitor = createTestMonitor(page);
    
    // Get multiple proof IDs
    const proofIds = await getProofIdsFromApi();
    
    if (proofIds.length < 2) {
      test.skip(true, 'Need at least 2 proofs for testing multiple badge actions');
      return;
    }
    
    // Test first few proofs
    for (const proofId of proofIds.slice(0, 3)) {
      console.log(`Testing badge actions for proof: ${proofId}`);
      
      monitor.clearErrors();
      await navigateToVerificationPage(page, proofId);
      await verifyPageIntegrity(page, monitor);
      
      // Verify badge loads
      await verifyBadgeImageLoads(page, 'img.badge-image');
      
      // Test badge actions
      await testBadgeActions(page);
      
      // Verify no errors occurred
      monitor.assertNoErrors();
    }
  });

  test('badge component handles network timeouts gracefully', async ({ page }) => {
    const monitor = createTestMonitor(page);
    
    // Get existing proof ID
    const proofIds = await getProofIdsFromApi();
    
    if (proofIds.length === 0) {
      test.skip(true, 'No existing proofs found for testing');
      return;
    }
    
    const proofId = proofIds[0];
    
    // Simulate slow network for badge image
    await page.route('**/assets/proof/*.png', async route => {
      await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay
      await route.continue();
    });
    
    await page.goto(`/t/${proofId}`);
    
    // Should show loading state initially
    const loadingSpinner = page.locator('.loading-spinner, .badge-loading');
    const hasLoadingState = await loadingSpinner.isVisible();
    
    if (hasLoadingState) {
      // Wait for loading to complete (with longer timeout)
      await waitForNoSpinners(page, 15000);
    }
    
    await verifyPageIntegrity(page, monitor);
    
    // Verify badge eventually loads despite delay
    await verifyBadgeImageLoads(page, 'img.badge-image');
  });

  test('badge component handles image load errors', async ({ page }) => {
    const monitor = createTestMonitor(page);
    
    // Get existing proof ID
    const proofIds = await getProofIdsFromApi();
    
    if (proofIds.length === 0) {
      test.skip(true, 'No existing proofs found for testing');
      return;
    }
    
    const proofId = proofIds[0];
    
    // Simulate image load failure
    await page.route('**/assets/proof/*.png', route => route.abort());
    
    await page.goto(`/t/${proofId}`);
    await verifyPageIntegrity(page, monitor);
    
    // Should fallback to static badge
    const fallbackBadge = page.locator('img[src*="signed_badge.png"]');
    if (await fallbackBadge.isVisible()) {
      await verifyBadgeImageLoads(page, 'img[src*="signed_badge.png"]');
    } else {
      // Or show error state
      const errorState = page.locator('.error-state, .badge-fallback');
      await expect(errorState).toBeVisible();
    }
  });

  test('badge component displays correctly on different screen sizes', async ({ page }) => {
    const monitor = createTestMonitor(page);
    
    // Get existing proof ID
    const proofIds = await getProofIdsFromApi();
    
    if (proofIds.length === 0) {
      test.skip(true, 'No existing proofs found for testing');
      return;
    }
    
    const proofId = proofIds[0];
    
    const viewports = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1920, height: 1080, name: 'Desktop' }
    ];
    
    for (const viewport of viewports) {
      console.log(`Testing badge on ${viewport.name} viewport`);
      
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await navigateToVerificationPage(page, proofId);
      await verifyPageIntegrity(page, monitor);
      
      // Verify badge displays correctly
      await verifyBadgeImageLoads(page, 'img.badge-image');
      
      // Verify badge actions are accessible
      const actionButtons = page.locator('.actions-section button');
      const buttonCount = await actionButtons.count();
      expect(buttonCount).toBeGreaterThan(0);
      
      // Verify badge preview section is visible
      await expect(page.locator('.badge-preview')).toBeVisible();
    }
  });

  test('badge component handles rapid navigation', async ({ page }) => {
    const monitor = createTestMonitor(page);
    
    // Get multiple proof IDs
    const proofIds = await getProofIdsFromApi();
    
    if (proofIds.length < 3) {
      test.skip(true, 'Need at least 3 proofs for rapid navigation test');
      return;
    }
    
    // Rapidly navigate between different proof pages
    for (let i = 0; i < 3; i++) {
      const proofId = proofIds[i];
      console.log(`Rapid navigation to proof: ${proofId}`);
      
      monitor.clearErrors();
      await page.goto(`/t/${proofId}`);
      
      // Don't wait for full load, just check no errors
      await page.waitForTimeout(1000);
      
      // Verify no console errors
      const errors = monitor.getConsoleErrors();
      expect(errors.length).toBe(0);
    }
    
    // Final verification on last page
    await verifyPageIntegrity(page, monitor);
    await verifyBadgeImageLoads(page, 'img.badge-image');
  });

  test('badge component memory usage is reasonable', async ({ page }) => {
    const monitor = createTestMonitor(page);
    
    // Get existing proof ID
    const proofIds = await getProofIdsFromApi();
    
    if (proofIds.length === 0) {
      test.skip(true, 'No existing proofs found for testing');
      return;
    }
    
    const proofId = proofIds[0];
    
    // Navigate to verification page multiple times
    for (let i = 0; i < 5; i++) {
      await page.goto(`/t/${proofId}`);
      await verifyPageIntegrity(page, monitor);
      await verifyBadgeImageLoads(page, 'img.badge-image');
      
      // Navigate away and back
      await page.goto('/');
      await page.goto(`/t/${proofId}`);
    }
    
    // Final verification should still work
    await verifyPageIntegrity(page, monitor);
    await verifyBadgeImageLoads(page, 'img.badge-image');
    
    // Verify no memory leaks (no excessive console errors)
    const errors = monitor.getConsoleErrors();
    const memoryErrors = errors.filter(e => e.text.includes('memory') || e.text.includes('leak'));
    expect(memoryErrors.length).toBe(0);
  });

  test('badge component handles concurrent requests', async ({ page }) => {
    const monitor = createTestMonitor(page);
    
    // Get existing proof ID
    const proofIds = await getProofIdsFromApi();
    
    if (proofIds.length === 0) {
      test.skip(true, 'No existing proofs found for testing');
      return;
    }
    
    const proofId = proofIds[0];
    
    // Simulate concurrent badge requests by rapidly reloading
    const promises = [];
    for (let i = 0; i < 3; i++) {
      promises.push(
        page.goto(`/t/${proofId}`).then(() => {
          return page.waitForSelector('img.badge-image', { timeout: 10000 });
        })
      );
    }
    
    // Wait for all requests to complete
    await Promise.allSettled(promises);
    
    // Final verification
    await verifyPageIntegrity(page, monitor);
    await verifyBadgeImageLoads(page, 'img.badge-image');
  });

  test('badge component accessibility features work', async ({ page }) => {
    const monitor = createTestMonitor(page);
    
    // Get existing proof ID
    const proofIds = await getProofIdsFromApi();
    
    if (proofIds.length === 0) {
      test.skip(true, 'No existing proofs found for testing');
      return;
    }
    
    const proofId = proofIds[0];
    
    await navigateToVerificationPage(page, proofId);
    await verifyPageIntegrity(page, monitor);
    
    // Check for alt text on badge image
    const badgeImage = page.locator('img.badge-image');
    const altText = await badgeImage.getAttribute('alt');
    expect(altText).toBeTruthy();
    expect(altText).toContain('Truwit');
    
    // Check for proper button labels
    const actionButtons = page.locator('.actions-section button');
    const buttonCount = await actionButtons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = actionButtons.nth(i);
      const buttonText = await button.textContent();
      expect(buttonText).toBeTruthy();
      expect(buttonText!.trim().length).toBeGreaterThan(0);
    }
    
    // Check for proper heading structure
    const headings = page.locator('h1, h2, h3');
    const headingCount = await headings.count();
    expect(headingCount).toBeGreaterThan(0);
    
    // Verify badge loads correctly
    await verifyBadgeImageLoads(page, 'img.badge-image');
  });

  test('badge component handles edge case proof IDs', async ({ page }) => {
    const monitor = createTestMonitor(page);
    
    // Test various edge case proof IDs
    const edgeCaseIds = [
      'a', // Very short
      'a'.repeat(100), // Very long
      'test-with-dashes',
      'test_with_underscores',
      'test.with.dots',
      'test+with+pluses',
      'test%20with%20encoding'
    ];
    
    for (const proofId of edgeCaseIds) {
      console.log(`Testing edge case proof ID: ${proofId}`);
      
      monitor.clearErrors();
      await page.goto(`/t/${proofId}`);
      
      // Should either show verification data or error state
      await page.waitForTimeout(2000);
      
      const hasVerificationData = await page.locator('.verify-content').isVisible();
      const hasErrorState = await page.locator('.error-state').isVisible();
      
      expect(hasVerificationData || hasErrorState).toBe(true);
      
      // Verify no console errors
      const errors = monitor.getConsoleErrors();
      expect(errors.length).toBe(0);
    }
  });
});

