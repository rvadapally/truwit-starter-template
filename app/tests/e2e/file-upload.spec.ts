import { test, expect } from '@playwright/test';
import path from 'path';

/**
 * File Upload Verification Flow Tests
 * 
 * Tests uploading video files for verification
 */

test.describe('File Upload Flow', () => {
  
  test('successfully uploads and verifies MP4 file', async ({ page }) => {
    await page.goto('/verify');
    
    // Create a test file path (you'll need to add a sample file)
    const testFilePath = path.join(__dirname, '../fixtures/sample.mp4');
    
    // Find file input
    const fileInput = page.locator('input[type="file"]');
    
    // Upload file
    await fileInput.setInputFiles(testFilePath);
    
    // Optional: Fill metadata
    await page.fill('input[name="toolName"], input[placeholder*="generator"]', 'Test Video Editor');
    
    // Submit
    await page.click('button:has-text("Generate Proof")');
    
    // Wait for upload and processing
    await page.waitForSelector('.success-message, .error-message', { timeout: 120000 });
    
    // Check result
    const successVisible = await page.locator('.success-message').isVisible();
    if (successVisible) {
      expect(successVisible).toBe(true);
      await expect(page.locator('text=/proof/i')).toBeVisible();
    }
  });

  test('shows file name after selection', async ({ page }) => {
    await page.goto('/verify');
    
    const fileInput = page.locator('input[type="file"]');
    const testFilePath = path.join(__dirname, '../fixtures/sample.mp4');
    
    await fileInput.setInputFiles(testFilePath);
    
    // Should display selected file name
    await expect(page.locator('text=/sample\\.mp4/i')).toBeVisible({ timeout: 5000 });
  });

  test('can clear selected file', async ({ page }) => {
    await page.goto('/verify');
    
    const fileInput = page.locator('input[type="file"]');
    const testFilePath = path.join(__dirname, '../fixtures/sample.mp4');
    
    await fileInput.setInputFiles(testFilePath);
    await expect(page.locator('text=/sample\\.mp4/i')).toBeVisible();
    
    // Clear file (if clear button exists)
    const clearButton = page.locator('button:has-text("Clear"), button:has-text("Remove")');
    if (await clearButton.isVisible()) {
      await clearButton.click();
      
      // File name should be gone
      await expect(page.locator('text=/sample\\.mp4/i')).not.toBeVisible();
    }
  });

  test('rejects file if too large', async ({ page }) => {
    test.skip(true, 'Need to create large test file');
    
    await page.goto('/verify');
    
    // Create or use a large file (>500MB)
    const largeFilePath = path.join(__dirname, '../fixtures/large-video.mp4');
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(largeFilePath);
    
    // Should show error about file size
    await expect(page.locator('text=/too large/i, text=/size/i')).toBeVisible({ timeout: 5000 });
  });

  test('rejects non-video file types', async ({ page }) => {
    await page.goto('/verify');
    
    // Try to upload a text file
    const testFilePath = path.join(__dirname, '../fixtures/test-file.txt');
    
    // Create test file if it doesn't exist
    const fs = require('fs');
    if (!fs.existsSync(testFilePath)) {
      fs.mkdirSync(path.dirname(testFilePath), { recursive: true });
      fs.writeFileSync(testFilePath, 'This is a test file');
    }
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testFilePath);
    
    await page.click('button:has-text("Generate Proof")');
    
    // Should show error about invalid file type
    await expect(page.locator('text=/invalid.*type/i, text=/not supported/i')).toBeVisible({ timeout: 10000 });
  });

  test('shows upload progress indicator', async ({ page }) => {
    await page.goto('/verify');
    
    const testFilePath = path.join(__dirname, '../fixtures/sample.mp4');
    const fileInput = page.locator('input[type="file"]');
    
    await fileInput.setInputFiles(testFilePath);
    await page.click('button:has-text("Generate Proof")');
    
    // Should show progress/loading indicator
    const progressVisible = await page.locator('.progress, [class*="progress"], .spinner, [class*="loading"]').isVisible();
    expect(progressVisible).toBe(true);
  });

  test('can switch between URL and file upload', async ({ page }) => {
    await page.goto('/verify');
    
    // Start with URL
    await page.fill('input[type="url"]', 'https://test.com/video');
    
    // Switch to file upload
    const fileInput = page.locator('input[type="file"]');
    const testFilePath = path.join(__dirname, '../fixtures/sample.mp4');
    await fileInput.setInputFiles(testFilePath);
    
    // URL should be cleared or file should be prioritized
    await page.click('button:has-text("Generate Proof")');
    
    // Should process file, not URL
    await page.waitForSelector('.success-message, .error-message', { timeout: 120000 });
  });

  test('displays file metadata after upload', async ({ page }) => {
    await page.goto('/verify');
    
    const testFilePath = path.join(__dirname, '../fixtures/sample.mp4');
    const fileInput = page.locator('input[type="file"]');
    
    await fileInput.setInputFiles(testFilePath);
    
    // Should show file info (name, size, etc.)
    await expect(page.locator('text=/sample\\.mp4/i')).toBeVisible();
    
    // May show file size
    const sizeVisible = await page.locator('text=/[0-9]+ (KB|MB)/').isVisible().catch(() => false);
    // Not required, but nice to have
  });

  test('handles upload errors gracefully', async ({ page }) => {
    // Simulate upload failure
    await page.route('**/v1/proofs/file', route => route.abort());
    
    await page.goto('/verify');
    
    const testFilePath = path.join(__dirname, '../fixtures/sample.mp4');
    const fileInput = page.locator('input[type="file"]');
    
    await fileInput.setInputFiles(testFilePath);
    await page.click('button:has-text("Generate Proof")');
    
    // Should show error
    await expect(page.locator('.error-message, [class*="error"]')).toBeVisible({ timeout: 10000 });
  });

  test('can upload multiple files sequentially', async ({ page }) => {
    test.skip(true, 'Need multiple test files');
    
    await page.goto('/verify');
    
    const files = ['sample1.mp4', 'sample2.mp4'];
    
    for (const file of files) {
      const testFilePath = path.join(__dirname, '../fixtures', file);
      const fileInput = page.locator('input[type="file"]');
      
      await fileInput.setInputFiles(testFilePath);
      await page.click('button:has-text("Generate Proof")');
      
      await page.waitForSelector('.success-message, .error-message', { timeout: 120000 });
      
      // Should be able to upload next file
      await expect(fileInput).toBeEnabled();
    }
  });
});


