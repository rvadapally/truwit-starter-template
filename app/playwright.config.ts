import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Truwit Verification App
 * Tests real user flows in multiple browsers and viewports
 * 
 * Environment Variables:
 * - BASE_URL: Override base URL (default: http://localhost:4200 for dev, https://truwit.ai for prod)
 * - TEST_ENV: Set to 'production' to run against production
 * - CI: Set to 'true' for CI environment
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL || (process.env.TEST_ENV === 'production' ? 'https://truwit.ai' : 'http://localhost:4200'),
    
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Video on failure - enable for badge tests */
    video: process.env.TEST_ENV === 'production' ? 'retain-on-failure' : 'off',
    
    /* Maximum time each action can take - increased for badge operations */
    actionTimeout: process.env.TEST_ENV === 'production' ? 15000 : 10000,
    
    /* Maximum time each test can run - increased for proof creation */
    navigationTimeout: process.env.TEST_ENV === 'production' ? 120000 : 30000,
    
    /* Global test timeout - increased for badge flow tests */
    timeout: process.env.TEST_ENV === 'production' ? 300000 : 60000,
  },

  /* Configure projects for major browsers and viewports */
  projects: [
    {
      name: 'chromium-desktop',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
    },

    {
      name: 'firefox-desktop',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 }
      },
    },

    {
      name: 'webkit-desktop',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 }
      },
    },

    /* Test against mobile viewports (catches scrolling/layout issues!) */
    {
      name: 'mobile-chrome',
      use: { 
        ...devices['Pixel 5'],
      },
    },
    {
      name: 'mobile-safari',
      use: { 
        ...devices['iPhone 12'],
      },
    },

    /* Test against tablet viewports */
    {
      name: 'tablet-ipad',
      use: { 
        ...devices['iPad Pro'],
      },
    },
  ],

  /* Run your local dev server before starting the tests - only for local development */
  webServer: (process.env.CI || process.env.TEST_ENV === 'production') ? undefined : {
    command: 'npm start',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});


