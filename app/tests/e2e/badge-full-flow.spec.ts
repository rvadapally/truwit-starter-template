import { test, expect } from '@playwright/test';
import { 
  createTestMonitor, 
  waitForPageComplete, 
  waitForNoSpinners, 
  verifyPageIntegrity,
  waitForVerificationFormReady,
  fillVerificationForm,
  submitVerificationForm,
  extractProofIdFromPage,
  navigateToVerificationPage,
  verifyBadgeImageLoads,
  testBadgeActions
} from '../helpers/test-utils';

/**
 * Badge Full Flow Tests
 * 
 * End-to-end tests for proof creation from YouTube URL and badge verification
 */

test.describe('Badge Full Flow', () => {
  
  test('complete flow: YouTube URL → proof creation → badge verification', async ({ page }) => {
    const monitor = createTestMonitor(page);
    
    // Step 1: Navigate to verification page
    await page.goto('/verify');
    await verifyPageIntegrity(page, monitor);
    await waitForVerificationFormReady(page);
    
    // Step 2: Fill form with YouTube URL
    const youtubeUrl = 'https://youtu.be/9DBJXRy5dvk?si=0TvNF1BF11J3d4nH';
    await fillVerificationForm(page, youtubeUrl, 'E2E Test Suite', 'Automated badge verification test');
    
    // Step 3: Submit form and monitor creation process
    console.log('🚀 Starting proof creation...');
    monitor.clearErrors();
    
    await submitVerificationForm(page, 120000); // 2 minute timeout for creation
    
    // Step 4: Verify creation completed successfully
    await verifyPageIntegrity(page, monitor);
    
    // Check for success message
    const successMessage = page.locator('.success-message, [class*="success"]');
    await expect(successMessage).toBeVisible({ timeout: 10000 });
    
    // Step 5: Extract proof ID from success message
    const proofId = await extractProofIdFromPage(page);
    expect(proofId).toBeTruthy();
    console.log(`✅ Proof created with ID: ${proofId}`);
    
    // Step 6: Navigate to verification page
    await navigateToVerificationPage(page, proofId!);
    await verifyPageIntegrity(page, monitor);
    
    // Step 7: Verify badge displays correctly
    await verifyBadgeImageLoads(page, 'img.badge-image');
    
    // Step 8: Verify verification page elements
    await expect(page.locator('.verify-content')).toBeVisible();
    await expect(page.locator('.verdict-badge')).toBeVisible();
    await expect(page.locator('.content-details')).toBeVisible();
    await expect(page.locator('.actions-section')).toBeVisible();
    await expect(page.locator('.badge-preview')).toBeVisible();
    
    // Step 9: Test badge actions
    await testBadgeActions(page);
    
    console.log('✅ Complete badge flow test passed');
  });

  test('badge displays correctly with all verification details', async ({ page }) => {
    const monitor = createTestMonitor(page);
    
    // Create proof first
    await page.goto('/verify');
    await verifyPageIntegrity(page, monitor);
    await waitForVerificationFormReady(page);
    
    const youtubeUrl = 'https://youtu.be/9DBJXRy5dvk?si=0TvNF1BF11J3d4nH';
    await fillVerificationForm(page, youtubeUrl, 'Badge Display Test', 'Testing badge display functionality');
    
    await submitVerificationForm(page, 120000);
    await verifyPageIntegrity(page, monitor);
    
    const proofId = await extractProofIdFromPage(page);
    expect(proofId).toBeTruthy();
    
    // Navigate to verification page
    await navigateToVerificationPage(page, proofId!);
    await verifyPageIntegrity(page, monitor);
    
    // Verify all verification details are present
    await expect(page.locator('.verify-header')).toBeVisible();
    await expect(page.locator('.verdict-badge')).toBeVisible();
    await expect(page.locator('.proof-id')).toBeVisible();
    
    // Verify content details
    await expect(page.locator('.content-details')).toBeVisible();
    await expect(page.locator('.detail-card')).toHaveCount(3); // Content, Declared, Verification details
    
    // Verify content information
    await expect(page.locator('text=/Content Hash/')).toBeVisible();
    await expect(page.locator('text=/MIME Type/')).toBeVisible();
    
    // Verify declared information
    await expect(page.locator('text=/Generator/')).toBeVisible();
    await expect(page.locator('text=/Prompt/')).toBeVisible();
    await expect(page.locator('text=/License/')).toBeVisible();
    
    // Verify verification details
    await expect(page.locator('text=/Issued At/')).toBeVisible();
    await expect(page.locator('text=/UTC/')).toBeVisible();
    await expect(page.locator('text=/Your Time/')).toBeVisible();
    await expect(page.locator('text=/C2PA Signature/')).toBeVisible();
    
    // Verify badge preview
    await expect(page.locator('.badge-preview')).toBeVisible();
    await expect(page.locator('text=/TrustMark Badge/')).toBeVisible();
    await expect(page.locator('.badge-description')).toBeVisible();
    
    // Verify embed snippet
    await expect(page.locator('.embed-snippet')).toBeVisible();
    await expect(page.locator('text=/Use This Badge/')).toBeVisible();
    await expect(page.locator('.embed-textarea')).toBeVisible();
  });

  test('badge actions work correctly', async ({ page }) => {
    const monitor = createTestMonitor(page);
    
    // Create proof first
    await page.goto('/verify');
    await verifyPageIntegrity(page, monitor);
    await waitForVerificationFormReady(page);
    
    const youtubeUrl = 'https://youtu.be/9DBJXRy5dvk?si=0TvNF1BF11J3d4nH';
    await fillVerificationForm(page, youtubeUrl, 'Badge Actions Test', 'Testing badge action functionality');
    
    await submitVerificationForm(page, 120000);
    await verifyPageIntegrity(page, monitor);
    
    const proofId = await extractProofIdFromPage(page);
    expect(proofId).toBeTruthy();
    
    // Navigate to verification page
    await navigateToVerificationPage(page, proofId!);
    await verifyPageIntegrity(page, monitor);
    
    // Grant clipboard permissions for testing
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    
    // Test copy verification link
    const copyLinkButton = page.locator('button:has-text("Copy Verification Link")');
    if (await copyLinkButton.isVisible()) {
      await copyLinkButton.click();
      
      // Verify clipboard contains verification URL
      const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
      expect(clipboardText).toContain('/t/');
      expect(clipboardText).toContain(proofId);
    }
    
    // Test copy image URL
    const copyImageButton = page.locator('button:has-text("Copy Image URL")');
    if (await copyImageButton.isVisible()) {
      await copyImageButton.click();
      
      // Verify clipboard contains image URL
      const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
      expect(clipboardText).toContain('http');
      expect(clipboardText).toContain('.png');
    }
    
    // Test copy embed code
    const copyEmbedButton = page.locator('button:has-text("Copy Embed Code")');
    if (await copyEmbedButton.isVisible()) {
      await copyEmbedButton.click();
      
      // Verify clipboard contains HTML embed code
      const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
      expect(clipboardText).toContain('<a href=');
      expect(clipboardText).toContain('<img src=');
      expect(clipboardText).toContain('Verified by TruWit');
    }
    
    // Test view badge link
    const viewBadgeLink = page.locator('a:has-text("View Badge")');
    if (await viewBadgeLink.isVisible()) {
      const href = await viewBadgeLink.getAttribute('href');
      expect(href).toBeTruthy();
      expect(href).toContain('.png');
    }
  });

  test('badge handles network errors gracefully', async ({ page }) => {
    const monitor = createTestMonitor(page);
    
    // Create proof first
    await page.goto('/verify');
    await verifyPageIntegrity(page, monitor);
    await waitForVerificationFormReady(page);
    
    const youtubeUrl = 'https://youtu.be/9DBJXRy5dvk?si=0TvNF1BF11J3d4nH';
    await fillVerificationForm(page, youtubeUrl, 'Network Error Test', 'Testing network error handling');
    
    await submitVerificationForm(page, 120000);
    await verifyPageIntegrity(page, monitor);
    
    const proofId = await extractProofIdFromPage(page);
    expect(proofId).toBeTruthy();
    
    // Navigate to verification page
    await navigateToVerificationPage(page, proofId!);
    await verifyPageIntegrity(page, monitor);
    
    // Simulate network failure for badge image
    await page.route('**/assets/proof/*.png', route => route.abort());
    
    // Reload page to trigger badge load failure
    await page.reload();
    await verifyPageIntegrity(page, monitor);
    
    // Verify fallback badge displays
    const badgeImage = page.locator('img.badge-image');
    if (await badgeImage.isVisible()) {
      const imgSrc = await badgeImage.getAttribute('src');
      // Should fallback to static badge
      expect(imgSrc).toContain('signed_badge.png');
    }
  });

  test('badge displays correctly on different viewports', async ({ page }) => {
    const monitor = createTestMonitor(page);
    
    // Create proof first
    await page.goto('/verify');
    await verifyPageIntegrity(page, monitor);
    await waitForVerificationFormReady(page);
    
    const youtubeUrl = 'https://youtu.be/9DBJXRy5dvk?si=0TvNF1BF11J3d4nH';
    await fillVerificationForm(page, youtubeUrl, 'Viewport Test', 'Testing badge display on different viewports');
    
    await submitVerificationForm(page, 120000);
    await verifyPageIntegrity(page, monitor);
    
    const proofId = await extractProofIdFromPage(page);
    expect(proofId).toBeTruthy();
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await navigateToVerificationPage(page, proofId!);
    await verifyPageIntegrity(page, monitor);
    await verifyBadgeImageLoads(page, 'img.badge-image');
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await verifyPageIntegrity(page, monitor);
    await verifyBadgeImageLoads(page, 'img.badge-image');
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.reload();
    await verifyPageIntegrity(page, monitor);
    await verifyBadgeImageLoads(page, 'img.badge-image');
  });

  test('verification page meta tags are set correctly', async ({ page }) => {
    const monitor = createTestMonitor(page);
    
    // Create proof first
    await page.goto('/verify');
    await verifyPageIntegrity(page, monitor);
    await waitForVerificationFormReady(page);
    
    const youtubeUrl = 'https://youtu.be/9DBJXRy5dvk?si=0TvNF1BF11J3d4nH';
    await fillVerificationForm(page, youtubeUrl, 'Meta Tags Test', 'Testing meta tag functionality');
    
    await submitVerificationForm(page, 120000);
    await verifyPageIntegrity(page, monitor);
    
    const proofId = await extractProofIdFromPage(page);
    expect(proofId).toBeTruthy();
    
    // Navigate to verification page
    await navigateToVerificationPage(page, proofId!);
    await verifyPageIntegrity(page, monitor);
    
    // Check meta tags
    const title = await page.title();
    expect(title).toContain('Verified by TruWit');
    expect(title).toContain(proofId);
    
    // Check Open Graph tags
    const ogTitle = await page.getAttribute('meta[property="og:title"]', 'content');
    expect(ogTitle).toContain('Verified by TruWit');
    
    const ogDescription = await page.getAttribute('meta[property="og:description"]', 'content');
    expect(ogDescription).toContain('verification');
    
    const ogImage = await page.getAttribute('meta[property="og:image"]', 'content');
    expect(ogImage).toContain('.png');
    
    // Check Twitter tags
    const twitterCard = await page.getAttribute('meta[name="twitter:card"]', 'content');
    expect(twitterCard).toBe('summary_large_image');
  });

  test('proof creation with different metadata works correctly', async ({ page }) => {
    const monitor = createTestMonitor(page);
    
    await page.goto('/verify');
    await verifyPageIntegrity(page, monitor);
    await waitForVerificationFormReady(page);
    
    const youtubeUrl = 'https://youtu.be/9DBJXRy5dvk?si=0TvNF1BF11J3d4nH';
    
    // Test with different metadata
    await fillVerificationForm(page, youtubeUrl, 'Custom Generator Name', 'Custom prompt for testing metadata handling');
    
    await submitVerificationForm(page, 120000);
    await verifyPageIntegrity(page, monitor);
    
    const proofId = await extractProofIdFromPage(page);
    expect(proofId).toBeTruthy();
    
    // Navigate to verification page
    await navigateToVerificationPage(page, proofId!);
    await verifyPageIntegrity(page, monitor);
    
    // Verify metadata is displayed correctly
    await expect(page.locator('text=/Custom Generator Name/')).toBeVisible();
    await expect(page.locator('text=/Custom prompt for testing metadata handling/')).toBeVisible();
    
    // Verify badge still displays correctly
    await verifyBadgeImageLoads(page, 'img.badge-image');
  });

  test('multiple proof creations work without interference', async ({ page }) => {
    const monitor = createTestMonitor(page);
    
    const youtubeUrl = 'https://youtu.be/9DBJXRy5dvk?si=0TvNF1BF11J3d4nH';
    
    // Create first proof
    await page.goto('/verify');
    await verifyPageIntegrity(page, monitor);
    await waitForVerificationFormReady(page);
    
    await fillVerificationForm(page, youtubeUrl, 'First Proof', 'First proof creation test');
    await submitVerificationForm(page, 120000);
    await verifyPageIntegrity(page, monitor);
    
    const firstProofId = await extractProofIdFromPage(page);
    expect(firstProofId).toBeTruthy();
    
    // Reset form for second proof
    await page.goto('/verify');
    await verifyPageIntegrity(page, monitor);
    await waitForVerificationFormReady(page);
    
    await fillVerificationForm(page, youtubeUrl, 'Second Proof', 'Second proof creation test');
    await submitVerificationForm(page, 120000);
    await verifyPageIntegrity(page, monitor);
    
    const secondProofId = await extractProofIdFromPage(page);
    expect(secondProofId).toBeTruthy();
    
    // Verify both proofs are different
    expect(firstProofId).not.toBe(secondProofId);
    
    // Verify both verification pages work
    await navigateToVerificationPage(page, firstProofId!);
    await verifyPageIntegrity(page, monitor);
    await verifyBadgeImageLoads(page, 'img.badge-image');
    
    await navigateToVerificationPage(page, secondProofId!);
    await verifyPageIntegrity(page, monitor);
    await verifyBadgeImageLoads(page, 'img.badge-image');
  });
});

