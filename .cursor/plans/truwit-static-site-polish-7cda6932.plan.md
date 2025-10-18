<!-- 7cda6932-b8a2-4bd0-8ec3-3f710ec4d947 845400ec-869f-46de-8171-661b0ad4d218 -->
# TruWit Static Site Polish - Astro Implementation

## Overview

Transform placeholder pages into professional, content-rich pages with a cohesive dark teal design system and reusable components.

## Asset Management Strategy

**Image mapping from `/images/` folder:**

- `68F3B553...PNG` (shield with network) → `public/images/og-truwit.png` (OG image - perfect for social sharing)
- `BBA25E3D...PNG` (dark logo with shield) → `public/images/truwit-logo-dark.png` (main nav logo)
- Use existing `verified-by-truwit.png` as the badge
- Extract/export the teal checkmark shield icon as `public/favicon-truwit.svg` (if needed)

**Logo Fix Strategy:**

The Nav.astro currently references `/logo.svg` which doesn't match your app's teal shield. We'll update it to use `/favicon-truwit.svg` (the shield icon) to match the Angular app nav.

## Implementation Steps

### 1. Update Global Design System

**File: `src/styles/global.css`**

- Replace Bear Blog theme with TruWit dark theme
- Set CSS custom properties: `--bg-0: #0B1116`, `--teal: #22E0C3`, etc.
- Create utility classes: `.card`, `.grid-3`, `.grid-2`, `.btn`, `.chip`, `.badge-row`
- Use Inter font (already available at `/fonts/Inter-Var.woff2`)
- Mobile-responsive breakpoints at 980px

### 2. Create Reusable Components

**File: `src/components/Section.astro`** (new)

- Container with optional kicker + title + card wrapper
- Keeps content tight and centered

**File: `src/components/FeatureCard.astro`** (new)

- Icon + title + body layout
- Used for 3-column feature grids

**File: `src/components/CTA.astro`** (new)

- Reusable call-to-action section
- Configurable title, body, button text/href

### 3. Update BaseHead Component

**File: `src/components/BaseHead.astro`**

- Simplify to accept: title, description, ogImage props
- Set defaults: title = "TruWit — Where Provenance Meets Proof"
- Use `og-truwit.png` for OG image
- Link to `favicon-truwit.svg` (already exists)
- Keep structured data and Twitter meta tags

### 4. Update Navigation

**File: `src/components/Nav.astro`**

- Update nav link: "Try App" → "Launch App" (consistency)
- Ensure labels match: "How It Works", "Use Cases", "Technology", "Pricing", "Investors"
- Keep existing mobile menu functionality

### 5. Update Footer

**File: `src/components/Footer.astro`**

- Add badge row with TruWit branding
- Reference: `<img src="/images/verified-by-truwit.png"/>` (use existing badge)
- Display "Verified by TruWit" badge prominently
- Keep existing footer sections, update styling to match dark theme

### 6. Rewrite Content Pages

**File: `src/pages/how-it-works.astro`**

- Kicker: "PRODUCT", Title: "How it works"
- 3-column feature grid: "Add media" → "Generate proof" → "Share & verify"
- 2-column comparison: "For Creators" vs "For Viewers & Teams"
- Include chips/tags for quick features
- End with CTA component

**File: `src/pages/use-cases.astro`**

- Kicker: "SOLUTIONS", Title: "Use cases"
- 6 use case cards in 3-column grid:
  - Creators & editors
  - Newsrooms
  - Brands & agencies
  - Education
  - Compliance
  - Talent & likeness
- Custom CTA: "See it in action"

**File: `src/pages/technology.astro`**

- Kicker: "UNDER THE HOOD", Title: "Technology"
- 3-column features: Proof-of-origin, Privacy, Tamper awareness
- 2-column cards: Interoperability + Roadmap
- Public-safe language (no proprietary details)

**File: `src/pages/pricing.astro`**

- Kicker: "PRICING", Title: "Simple for launch"
- 2-column: "Early Access — Free" + "Coming Soon"
- Minimal content (pricing isn't finalized yet)

**File: `src/pages/about.astro`**

- Kicker: "ABOUT", Title: "Our mission"
- Brief mission statement
- Contact email: hello@truwit.ai

**File: `src/pages/investors.astro`**

- Kicker: "PARTNERS", Title: "For investors"
- Value proposition for investors
- Chips: Growing proof graph, Public-safe manifests, Enterprise pathways
- Contact email

**File: `src/pages/contact.astro`**

- Kicker: "CONTACT", Title: "Get in touch"
- Simple email link: hello@truwit.ai
- Response time expectation

### 7. Update Homepage

**File: `src/pages/index.astro`**

- Change button label: "Try App" → "Launch App"
- Keep existing hero and structure (already well-designed)
- Ensure consistency with new design tokens if needed

### 8. Copy Brand Assets

Move images from `/images/` to `/public/images/`:

- `68F3B553-F31C-46DE-8E15-0C5F2807193B.PNG` → `public/images/og-truwit.png`
- `BBA25E3D-2ACD-4873-ADA5-A6039D2F8752.PNG` → `public/images/logo-dark.png`

## Key Design Principles

- Low-scroll pages: content fits in ~2 viewport heights
- Consistent dark theme with teal accent (#22E0C3)
- Reusable components reduce duplication
- Public-safe language (no proprietary tech details)
- Mobile-first responsive design
- Clean typography with Inter font

## Build & Deploy

```bash
npm run build      # Builds Astro site to /dist
```

Deploy to Cloudflare Pages (already configured per DEPLOYMENT-GUIDE.md)

### To-dos

- [ ] Replace global.css with TruWit dark theme design tokens and utility classes
- [ ] Create reusable components: Section.astro, FeatureCard.astro, CTA.astro
- [ ] Simplify BaseHead component with new defaults and OG image reference
- [ ] Update Nav and Footer with consistent labels and badge branding
- [ ] Copy brand images from /images/ to /public/images/ with proper naming
- [ ] Rewrite all 6 content pages (how-it-works, use-cases, technology, pricing, about, investors, contact) with professional copy
- [ ] Update homepage button label for consistency
- [ ] Run build command and verify all pages render correctly