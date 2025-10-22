<!-- b8496704-831c-4c48-a2ab-77e48260d1cb 916a2181-9d17-4bbc-a45b-ca6232de2eeb -->
# UI Cleanup & Polish Plan

## Overview

Transform the application into a cohesive, professional experience with consistent design, proper navigation, improved layouts, and dark theme throughout.

## 1. Header & Navigation Updates

### Angular App Header (`app/src/app/app.component.html` & `.scss`)

- Add "Truwit" text next to the teal logo in header
- Replace "About" link with "How It Works"
- Update "Home" button to navigate to the main landing page (favorite page at `/`)
- Ensure header styling matches the favorite page aesthetics

### Page Titles

- Update `app/src/index.html` title from "HumanProof" to "Truwit"
- Update meta tags and dynamic titles throughout

## 2. Landing Page Consistency & Navigation Flow

### Critical Navigation Rule: Home = Astro Site (truwit.ai)

**All "Home" links everywhere go to `https://truwit.ai` (Astro marketing site)**

### Copy Favorite Page Design to Astro Landing

- The Angular home page (`app/src/app/features/home/home.component.ts`) has the perfect design
- Copy this design to Astro landing page (`src/pages/index.astro`)
- Astro landing becomes the main "Home" with same fonts, icons, and layout
- Features section with 4 cards, gradient text, perfect spacing

### Angular App "Home" Button

- In `app/src/app/app.component.html`, "Home" link navigates to `https://truwit.ai` (external)
- Use `window.location.href` or `<a href="https://truwit.ai">` instead of Angular router
- Angular app at `/app/` is for the application; "Home" takes users back to marketing site

### Navigation Links That Work

**Astro Site (truwit.ai):**

- Home → `/` (same site)
- How It Works → `/how-it-works`
- Other marketing links → `/use-cases`, `/pricing`, etc.
- Launch App → `/app/` (goes to Angular app)

**Angular App (truwit.ai/app/):**

- Home → `https://truwit.ai` (external, back to Astro)
- How It Works → `/app/how-it-works` (Angular route, or link to Astro's how-it-works)
- Verify → `/app/verify` (Angular route)

## 3. Verification Form Page Improvements (`/verify`)

### Add Feature Showcase Section

- Add the 4 feature cards from favorite page above the form:
- 🔒 Cryptographic Proof
- ✅ Consent Tracking  
- 🎯 AI Detection
- Verified badge icon - Show Trust
- Use same icon sizes and styling as favorite page
- Replace broken static text with proper visual presentation

### Fix Broken Image

- The "Every verification is cryptographically signed" section needs proper icon
- Use consistent icons from the feature cards

## 4. Verification Report Page Layout (`/t/:id`)

### Two-Column Responsive Layout (`public-verify.component`)

**Left Column:**

- Trustmark Badge (top)
- Verification Details card (below badge)

**Right Column:**

- Content Information card (top)
- Declared Information card (below)

**Bottom Section (full width):**

- All action buttons: Copy Verification Link, Share on X, Copy Image URL, View Badge

**Additional Data to Surface:**

- Canonical URL (from database)
- Generator (fix "unknown" issue - should show tool name)
- License should display as "TW-{PROOF_ID}" format
- Remove: mimetype, prompt (for now)
- Keep: content hash, duration, resolution, timestamps, C2PA status

### Replace "Verified" Text Badge

- Replace the green "Verified" text with `verified-circular-badge.jpg` image
- Position at top of verification report
- Proper sizing and styling

### Mobile Responsive

- Stack all cards in single column on mobile
- Maintain readability and touch targets

## 5. Footer Updates

### Icon Background Fix

- Update CSS in `app.component.scss` to remove silver background
- Ensure circular icon displays cleanly without background
- Fix blend modes and transparency issues

## 6. Theme Removal & Dark Mode Enforcement

### Remove Theme Toggle Completely

- Remove theme toggle from Astro site (`src/components/ThemeToggle.astro`)
- Remove theme toggle references in `src/components/Nav.astro`
- Remove/disable Angular theme service toggle UI
- Force dark theme everywhere

### Update Theme Service

- Lock `app/src/app/core/services/theme.service.ts` to default (dark) theme only
- Remove theme switching capability
- Keep dark theme CSS variables

### Clean Up

- Remove light theme CSS
- Update `app/src/index.html` to remove theme localStorage initialization
- Ensure consistent dark theme across all pages

## 7. How It Works Page

### Angular Route Addition

- Add `/how-it-works` route in Angular app
- Create new component with dark theme, matching fonts
- Show the 3-step process with proper icons

### Astro Page Update  

- Keep Astro how-it-works page for marketing site
- Ensure dark theme and consistent fonts
- Fix theme toggle issues

### Navigation Flow

- "How It Works" link opens the appropriate page based on context
- Both versions should look identical in style

## 8. Consistent Typography & Spacing

### Font Sizes (from favorite page)

- Page titles: 2.5rem, weight 800
- Section titles: 1.5rem, weight 600
- Card titles: 1.25rem, weight 600
- Body text: 1rem
- Descriptions: 0.95rem

### Icon Sizes

- Feature icons: 48px × 48px (like signed_badge.png on favorite page)
- Header logo: 32px × 32px
- Navigation icons: 20px × 20px

### Colors (Dark Theme)

- Primary: #0ea5e9 (cyan/teal)
- Secondary: #22c55e (green)
- Background: #0a1428 to #070d1a (gradient)
- Text: #e6eefc (light)
- Muted text: #9fb3d9

## 9. Responsive Design Standards

### Breakpoints

- Desktop: > 768px (multi-column layouts)
- Mobile: ≤ 768px (single column stack)

### Touch Targets

- Minimum 44px × 44px for all interactive elements on mobile
- Proper spacing between buttons

## Implementation Notes

- Maintain all existing functionality
- Ensure all images use proper asset paths
- Test responsive layouts at multiple screen sizes
- Verify navigation flows work correctly
- Check that all database fields populate correctly
- Ensure consistent loading states and error handling

### To-dos

- [ ] Update header: add 'Truwit' text next to logo, replace 'About' with 'How It Works', update titles from HumanProof to Truwit
- [ ] Remove theme toggle completely, enforce dark theme everywhere, clean up theme service and CSS
- [ ] Add 4 feature cards to verify page with proper icons matching favorite page style, fix broken image section
- [ ] Implement 2-column responsive layout for verification report with 4 cards, add more database fields, replace 'Verified' text with circular badge image
- [ ] Fix footer icon CSS to remove silver background and display cleanly
- [ ] Create/update How It Works pages in both Angular and Astro with consistent dark theme and styling
- [ ] Update routing and navigation flow so Home goes to favorite page, ensure consistency across app
- [ ] Test and verify all pages are responsive, mobile layouts work correctly