# QA Screenshots & Testing

This folder contains screenshots captured during QA testing to validate UI/UX changes.

## Taking New Screenshots

### Quick Start (Windows)
Simply double-click `take-screenshots.bat` in the root folder.

### PowerShell
```powershell
# Production (default)
.\take-screenshots.ps1

# Local development
.\take-screenshots.ps1 -Environment local

# Custom URL
.\take-screenshots.ps1 -BaseUrl "https://custom-url.com"
```

## What Gets Captured

The script captures screenshots of:
1. **Astro Landing Page** (`/`) - Marketing home
2. **How It Works** (`/how-it-works`) - Feature explanation
3. **App Home** (`/app`) - Angular app home
4. **Verify Page** (`/app/#/verify`) - Verification form
5. **Verification Report** (`/app/#/t/TW-E6F13C97`) - Sample proof report

## Viewports

Each page is captured in 3 viewports:
- **Desktop:** 1920×1080
- **Tablet:** 768×1024
- **Mobile:** 375×667

Each viewport captures:
- **Full page screenshot** (entire scrollable page)
- **Viewport screenshot** (above-the-fold only)

## Output

Screenshots are saved to a timestamped folder:
```
screenshots-YYYYMMDD-HHMMSS/
  ├── astro-landing-desktop-full.png
  ├── astro-landing-desktop-viewport.png
  ├── astro-landing-tablet-full.png
  ├── astro-landing-tablet-viewport.png
  ├── astro-landing-mobile-full.png
  ├── astro-landing-mobile-viewport.png
  ├── ... (and so on for all pages)
```

## Current Screenshots

The images in this folder were captured to validate the UI cleanup changes:
- Consistent dark theme
- Updated navigation (Home → Astro site)
- 2-column verification report layout
- Feature cards on verify page
- Circular badge display
- Responsive design

## Comparing Screenshots

After making UI changes:
1. Take new screenshots using the script
2. Compare with previous screenshots in this folder
3. Validate all pages look correct
4. Check responsive behavior across viewports

## Requirements

- Node.js (for Playwright)
- PowerShell (Windows) or Bash (Linux/Mac)
- Internet connection (to access production site)

The script will automatically install Playwright if not found.

