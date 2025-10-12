# Playwright E2E Tests for Truwit Verification App

## Overview

Comprehensive end-to-end tests that verify the entire user experience in real browsers.

## Test Suites

### 1. **Layout & Viewport Tests** (`layout-viewport.spec.ts`)
Tests responsiveness and prevents UI issues like:
- ✅ Elements requiring scrolling to see
- ✅ Content overflow
- ✅ Mobile/tablet layout breakage
- ✅ Hidden buttons or messages
- ✅ Horizontal scrolling issues

**Example caught bugs:**
- Status messages appearing below the fold
- Buttons not visible without scrolling
- Form elements cut off on mobile

---

### 2. **URL Verification Flow** (`url-verification.spec.ts`)
Tests the complete URL verification journey:
- ✅ TikTok URL processing
- ✅ YouTube URL processing (with bot detection handling)
- ✅ Invalid URL rejection
- ✅ Loading states
- ✅ Success/error messages
- ✅ Navigation to proof page

**Example caught bugs:**
- Buttons not clickable due to form validation
- Error messages not displayed
- Loading state not showing

---

### 3. **File Upload Flow** (`file-upload.spec.ts`)
Tests file upload functionality:
- ✅ MP4/MOV/AVI/WebM upload
- ✅ File size validation
- ✅ File type validation
- ✅ Upload progress indicators
- ✅ File name display
- ✅ Switching between URL and file

**Example caught bugs:**
- File input not working
- Large files crashing browser
- Wrong file types accepted

---

### 4. **Proof Verification Page** (`proof-verification.spec.ts`)
Tests viewing proof details:
- ✅ Content hash display
- ✅ Timestamp formatting (UTC + Local)
- ✅ Copy to clipboard functionality
- ✅ Social sharing
- ✅ Badge display
- ✅ Direct URL sharing

**Example caught bugs:**
- Routing not working (showed home page instead)
- Content hash overflowing container
- Copy button copying wrong text

---

### 5. **Deduplication & Idempotency** (`deduplication.spec.ts`)
Tests proof deduplication:
- ✅ Same URL returns same proof
- ✅ Faster response for cached proofs
- ✅ Different URLs create different proofs
- ✅ URL parameter handling

**Example caught bugs:**
- New proof generated for same URL
- Cache not working

---

## Installation

```bash
cd app
npm install
npx playwright install
```

This installs Playwright and downloads browsers (Chrome, Firefox, Safari).

---

## Running Tests

### Local Development

```bash
# Run all tests (starts dev server automatically)
npm run test:e2e

# Run tests in UI mode (interactive)
npm run test:e2e:ui

# Run specific test file
npx playwright test layout-viewport.spec.ts

# Run tests in specific browser
npx playwright test --project=chromium-desktop

# Debug tests
npm run test:e2e:debug
```

### Production Testing

```bash
# Test against production
BASE_URL=https://www.truwit.ai npx playwright test

# Generate report
npm run test:e2e:report
```

---

## Test Configuration

**Browsers tested:**
- ✅ Chrome Desktop (1920x1080)
- ✅ Firefox Desktop (1920x1080)
- ✅ Safari Desktop (1920x1080)
- ✅ Chrome Mobile (Pixel 5)
- ✅ Safari Mobile (iPhone 12)
- ✅ iPad Pro

**Features:**
- Screenshot on failure
- Video recording on failure
- Trace collection for debugging
- Parallel execution
- Automatic retry on failure (CI only)

---

## Adding Test Fixtures

Place test files in `tests/fixtures/`:

```
tests/fixtures/
├── sample.mp4          # Small test video (~5MB)
├── large-video.mp4     # Large test video (~500MB+)
├── test-file.txt       # Non-video file for validation
└── README.md           # Instructions for creating fixtures
```

**Creating test fixtures:**

```bash
# Create a small test video (5MB, 10 seconds)
ffmpeg -f lavfi -i testsrc=duration=10:size=1280x720:rate=30 \
       -f lavfi -i sine=frequency=1000:duration=10 \
       -pix_fmt yuv420p -c:v libx264 -c:a aac \
       tests/fixtures/sample.mp4

# Create a text file
echo "This is a test file" > tests/fixtures/test-file.txt
```

---

## CI/CD Integration

### GitHub Actions

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: cd app && npm ci
      
      - name: Install Playwright
        run: cd app && npx playwright install --with-deps
      
      - name: Run Playwright tests
        run: cd app && npm run test:e2e
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: app/playwright-report/
```

---

## Debugging

### Visual Debugging

```bash
# Run tests with UI (see browser in action)
npm run test:e2e:ui

# Debug specific test
npx playwright test --debug layout-viewport.spec.ts
```

### Trace Viewer

```bash
# View trace of failed test
npx playwright show-trace test-results/.../trace.zip
```

### Screenshots & Videos

Failed tests automatically save:
- Screenshot: `test-results/.../test-failed-1.png`
- Video: `test-results/.../video.webm`

---

## Best Practices

### Writing Tests

1. **Use semantic selectors:**
   ```typescript
   // Good
   page.getByRole('button', { name: 'Generate Proof' })
   page.getByLabel('URL')
   
   // Bad
   page.locator('.btn-primary')
   page.locator('#url-input')
   ```

2. **Wait for visibility, not timeouts:**
   ```typescript
   // Good
   await expect(page.getByText('Success')).toBeVisible()
   
   // Bad
   await page.waitForTimeout(5000)
   ```

3. **Use test.skip() for environment-specific tests:**
   ```typescript
   test.skip(process.env.BASE_URL?.includes('localhost'), 'Production only');
   ```

4. **Check viewport visibility:**
   ```typescript
   await expect(page.getByRole('button')).toBeInViewport()
   ```

---

## Troubleshooting

### Tests fail locally but pass in CI

- Clear browser cache: `npx playwright clean`
- Update browsers: `npx playwright install`
- Check for stale state: Restart dev server

### "Element not found" errors

- Element might be in viewport but not visible
- Check for overlapping elements
- Verify selector is correct

### Flaky tests

- Add explicit waits: `await page.waitForLoadState('networkidle')`
- Increase timeout for slow operations
- Use `test.retry()` for known flaky tests

### Browser not launching

- Install system dependencies: `npx playwright install-deps`
- Check disk space (browsers need ~1GB)
- Try single browser: `--project=chromium-desktop`

---

## Performance Tips

1. **Run tests in parallel:**
   ```bash
   npx playwright test --workers=4
   ```

2. **Skip slow tests in development:**
   ```typescript
   test.skip(!process.env.CI, 'Slow test - CI only');
   ```

3. **Use selective test execution:**
   ```bash
   npx playwright test --grep="@fast"
   ```

---

## Coverage Report

View test coverage:

```bash
# Run tests with coverage
npm run test:e2e

# Open HTML report
npm run test:e2e:report
```

**Expected coverage:**
- ✅ All critical user flows
- ✅ Desktop + Mobile + Tablet
- ✅ Chrome + Firefox + Safari
- ✅ Happy path + Error cases

---

## Further Reading

- [Playwright Documentation](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Selectors Guide](https://playwright.dev/docs/selectors)
- [Assertions](https://playwright.dev/docs/test-assertions)

