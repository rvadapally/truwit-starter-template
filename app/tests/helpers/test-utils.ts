import { Page, expect } from '@playwright/test';

/**
 * Test utilities for E2E navigation and badge integrity tests
 */

export interface ConsoleError {
  type: string;
  text: string;
  timestamp: number;
}

export interface NetworkFailure {
  url: string;
  status: number;
  timestamp: number;
}

export class TestMonitor {
  private consoleErrors: ConsoleError[] = [];
  private networkFailures: NetworkFailure[] = [];
  private page: Page;

  constructor(page: Page) {
    this.page = page;
    this.setupMonitoring();
  }

  private setupMonitoring(): void {
    // Monitor console errors
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        this.consoleErrors.push({
          type: msg.type(),
          text: msg.text(),
          timestamp: Date.now()
        });
      }
    });

    // Monitor network failures
    this.page.on('response', response => {
      if (response.status() >= 400) {
        this.networkFailures.push({
          url: response.url(),
          status: response.status(),
          timestamp: Date.now()
        });
      }
    });
  }

  getConsoleErrors(): ConsoleError[] {
    return [...this.consoleErrors];
  }

  getNetworkFailures(): NetworkFailure[] {
    return [...this.networkFailures];
  }

  clearErrors(): void {
    this.consoleErrors = [];
    this.networkFailures = [];
  }

  assertNoErrors(): void {
    const errors = this.getConsoleErrors();
    const failures = this.getNetworkFailures();

    if (errors.length > 0) {
      const errorMessages = errors.map(e => `${e.type}: ${e.text}`).join('\n');
      throw new Error(`Console errors detected:\n${errorMessages}`);
    }

    if (failures.length > 0) {
      const failureMessages = failures.map(f => `${f.url}: ${f.status}`).join('\n');
      throw new Error(`Network failures detected:\n${failureMessages}`);
    }
  }
}

/**
 * Wait for page to reach complete ready state
 */
export async function waitForPageComplete(page: Page, timeout: number = 30000): Promise<void> {
  await page.waitForFunction(() => document.readyState === 'complete', { timeout });
}

/**
 * Wait for all spinners to disappear
 */
export async function waitForNoSpinners(page: Page, timeout: number = 10000): Promise<void> {
  const spinnerSelectors = [
    '.loading',
    '.spinner', 
    '[class*="loading"]',
    '[class*="spinner"]',
    '.badge-loading',
    '.verification-step'
  ];

  for (const selector of spinnerSelectors) {
    try {
      await page.waitForSelector(selector, { state: 'hidden', timeout });
    } catch (error) {
      // Check if spinner is actually visible
      const spinner = page.locator(selector);
      const isVisible = await spinner.isVisible();
      if (isVisible) {
        throw new Error(`Spinner still visible after timeout: ${selector}`);
      }
    }
  }
}

/**
 * Verify badge image loads successfully
 */
export async function verifyBadgeImageLoads(page: Page, selector: string = 'img.badge-image'): Promise<void> {
  // Wait for badge image to be visible
  await page.waitForSelector(selector, { state: 'visible', timeout: 10000 });

  const badgeImage = page.locator(selector);
  
  // Verify image loaded successfully (not broken)
  const imgNaturalWidth = await badgeImage.evaluate((img: HTMLImageElement) => img.naturalWidth);
  expect(imgNaturalWidth).toBeGreaterThan(0);

  // Verify image has proper dimensions
  const imgNaturalHeight = await badgeImage.evaluate((img: HTMLImageElement) => img.naturalHeight);
  expect(imgNaturalHeight).toBeGreaterThan(0);
}

/**
 * Get existing proof IDs from API
 */
export async function getProofIdsFromApi(baseUrl: string = 'https://api.truwit.ai'): Promise<string[]> {
  try {
    const response = await fetch(`${baseUrl}/v1/proofs/test/stats`);
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data.proofIds || [];
  } catch (error) {
    console.warn('Failed to fetch proof IDs from API:', error);
    return [];
  }
}

/**
 * Extract proof ID from verification success message
 */
export async function extractProofIdFromPage(page: Page): Promise<string | null> {
  try {
    // Look for success message with proof ID
    const successMessage = page.locator('text=/Proof ID:/, text=/proofId/');
    const text = await successMessage.textContent();
    
    if (text) {
      // Extract proof ID from text like "Proof ID: abc123" or "proofId: abc123"
      const match = text.match(/(?:Proof ID:|proofId:)\s*([a-zA-Z0-9-_]+)/i);
      return match ? match[1] : null;
    }
    
    return null;
  } catch (error) {
    console.warn('Failed to extract proof ID from page:', error);
    return null;
  }
}

/**
 * Wait for verification form to be ready
 */
export async function waitForVerificationFormReady(page: Page): Promise<void> {
  await page.waitForSelector('input[type="url"], input[name="url"]', { state: 'visible' });
  await page.waitForSelector('button:has-text("Generate Proof"), button:has-text("Verify")', { state: 'visible' });
}

/**
 * Fill verification form with YouTube URL
 */
export async function fillVerificationForm(page: Page, url: string, generator: string = 'E2E Test Suite', prompt: string = 'Automated badge verification test'): Promise<void> {
  // Fill URL
  const urlInput = page.locator('input[type="url"], input[name="url"], input[placeholder*="URL"]').first();
  await urlInput.fill(url);

  // Fill optional metadata fields
  const toolNameInput = page.locator('input[name="toolName"], input[placeholder*="generator"]');
  if (await toolNameInput.isVisible()) {
    await toolNameInput.fill(generator);
  }

  const promptInput = page.locator('textarea[name="prompt"], textarea[placeholder*="prompt"]');
  if (await promptInput.isVisible()) {
    await promptInput.fill(prompt);
  }
}

/**
 * Submit verification form and wait for completion
 */
export async function submitVerificationForm(page: Page, timeout: number = 120000): Promise<void> {
  const submitButton = page.locator('button:has-text("Generate Proof"), button:has-text("Verify")');
  await submitButton.click();

  // Wait for processing to complete
  await page.waitForSelector('.success-message, [class*="success"], .verification-result', { timeout });
}

/**
 * Navigate to verification page and wait for load
 */
export async function navigateToVerificationPage(page: Page, proofId: string): Promise<void> {
  await page.goto(`/t/${proofId}`);
  await waitForPageComplete(page);
  await waitForNoSpinners(page);
}

/**
 * Verify all key navigation elements are present
 */
export async function verifyNavigationElements(page: Page): Promise<void> {
  // Check for navigation header (unless on public verify page)
  const currentUrl = page.url();
  if (!currentUrl.includes('/t/')) {
    await expect(page.locator('.header, .nav')).toBeVisible();
    await expect(page.locator('.nav-brand')).toBeVisible();
    await expect(page.locator('.nav-links')).toBeVisible();
  }

  // Check for main content
  await expect(page.locator('main, .main-container, .landing-content, .verify-content')).toBeVisible();
}

/**
 * Test badge actions functionality
 */
export async function testBadgeActions(page: Page): Promise<void> {
  // Test copy verification link
  const copyLinkButton = page.locator('button:has-text("Copy Verification Link"), button:has-text("Copy Link")');
  if (await copyLinkButton.isVisible()) {
    await copyLinkButton.click();
    // Note: Clipboard testing requires permissions
  }

  // Test copy image URL
  const copyImageButton = page.locator('button:has-text("Copy Image URL")');
  if (await copyImageButton.isVisible()) {
    await copyImageButton.click();
  }

  // Test share button (should open popup)
  const shareButton = page.locator('button:has-text("Share"), button:has-text("X"), button:has-text("Twitter")');
  if (await shareButton.isVisible()) {
    const popupPromise = page.waitForEvent('popup');
    await shareButton.click();
    try {
      const popup = await popupPromise;
      await popup.close();
    } catch (error) {
      // Popup might not open in test environment
      console.warn('Share popup test failed:', error);
    }
  }
}

/**
 * Comprehensive page integrity check
 */
export async function verifyPageIntegrity(page: Page, monitor: TestMonitor): Promise<void> {
  // Wait for complete load
  await waitForPageComplete(page);
  
  // Wait for spinners to clear
  await waitForNoSpinners(page);
  
  // Verify navigation elements
  await verifyNavigationElements(page);
  
  // Check for console errors and network failures
  monitor.assertNoErrors();
}

/**
 * Create a new test monitor for a page
 */
export function createTestMonitor(page: Page): TestMonitor {
  return new TestMonitor(page);
}

