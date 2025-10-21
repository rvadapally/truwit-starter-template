# Full Route Validation Test

This test suite performs a browser-driven crawl across every discoverable route in the Truwit Starter Template. It records HTTP status codes, console output, network failures, and visible loading indicators to ensure a stable experience across the site.

## Prerequisites
1. Install Node.js >= 18 and Python >= 3.11.
2. Install project dependencies:
   ```bash
   npm install
   (cd app && npm install)
   ```
3. Build or run the Astro dev server so the site is available locally. The audit expects the UI at `http://127.0.0.1:4321` by default:
   ```bash
   npm run dev
   ```
   (Keep the server running while the audit executes.)

4. Install Playwright (first run only):
   ```bash
   python -m playwright install --with-deps
   ```

## Execution Steps
Run the Windows batch helper from the repository root. Override `E2E_BASE_URL` if the site is served from a different address.
```cmd
set E2E_BASE_URL=http://127.0.0.1:4321
run-e2e-validation.bat
```

The batch script installs required Playwright browsers, runs `tools/e2e_full_navigation.py`, and returns a non-zero exit code if any navigation fails, network requests return HTTP 400+, console errors appear, or visible loading indicators remain.

## Output
The script prints a JSON report summarising:
- URL and HTTP status for each visited page
- All console messages grouped per page
- Any failed network requests or error responses
- A list of visible loading indicators that remained after the page settled

Use this report to investigate regressions before shipping changes.
