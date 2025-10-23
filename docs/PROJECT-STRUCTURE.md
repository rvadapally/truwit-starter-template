# Truwit Humanproof Starter - Project Structure

**Last Updated:** October 23, 2025  
**Version:** 1.0.0 MVP

## 📋 Overview

This project is a full-stack application with multiple deployment targets:
- **ASP.NET Core API** (deployed to Railway)
- **Angular SPA** (deployed to Cloudflare Pages at `/app`)
- **Astro Static Site** (deployed to Cloudflare Pages as main site)
- **Cloudflare Functions** (serverless API endpoints)

---

## 🏗️ Root Directory Structure

```
humanproof-starter/
├── 📁 api/                          # ASP.NET Core Web API
├── 📁 app/                          # Angular Single Page Application
├── 📁 src/                          # Astro Static Site Generator
├── 📁 docs/                         # Project Documentation
├── 📁 public/                       # Static Assets (Astro public folder)
├── 📁 functions/                    # Cloudflare Functions
├── 📁 scripts/                      # Build & Utility Scripts
├── 📁 tools/                        # Development Tools & Testing
├── 📁 QA/                          # Quality Assurance Assets
├── 📁 temp/                        # Temporary Files (gitignored)
├── 📁 test-results/                # Test Output Files
├── 📁 screenshots-*/               # Screenshot Archives
├── 📄 docker-compose.yml           # Local Development Setup
├── 📄 astro.config.mjs             # Astro Configuration
├── 📄 wrangler.json                # Cloudflare Workers Configuration
├── 📄 package.json                 # Root Package Dependencies
├── 📄 tsconfig.json                # TypeScript Configuration
├── 📄 .cursorignore                # Cursor IDE Ignore Rules
├── 📄 README.md                    # Project Overview
└── 📄 *.bat, *.ps1, *.sh          # Platform-specific Scripts
```

---

## 🔌 API Directory (`/api`)

**Technology:** ASP.NET Core 8, Entity Framework, PostgreSQL  
**Deployment:** Railway Platform

```
api/
├── 📁 Application/                  # Application Layer (Services, DTOs)
│   ├── 📁 DTOs/                    # Data Transfer Objects
│   │   ├── C2paDTOs.cs
│   │   ├── ProofCreationDTOs.cs
│   │   ├── VerificationDTOs.cs
│   │   └── VerifyDTOs.cs
│   └── 📁 Services/                # Business Logic Services
│       ├── C2paVerifier.cs
│       ├── ContentIngestService.cs
│       ├── ProofCardSvgGenerator.cs
│       ├── VerificationService.cs
│       └── YouTubeVideoHasher.cs
├── 📁 Controllers/                  # API Endpoints
│   ├── AdminController.cs
│   ├── BadgesController.cs
│   ├── ProofCardController.cs
│   ├── ProofsController.cs
│   └── VerificationController.cs
├── 📁 Domain/                       # Domain Layer (Entities, Interfaces)
│   ├── 📁 Entities/                # Database Models
│   ├── 📁 Enums/                   # Enumeration Types
│   └── 📁 Interfaces/              # Service Contracts
├── 📁 Infrastructure/               # Infrastructure Layer
│   ├── 📁 Data/                    # Database Context & Configuration
│   ├── 📁 Middleware/              # HTTP Middleware
│   ├── 📁 Repositories/            # Data Access Layer
│   └── 📁 Services/                # External Service Integrations
├── 📁 CardTemplates/               # Image Templates & Assets
│   ├── banner.png
│   ├── logo.svg                    # SVG Logo (912 bytes)
│   ├── signed_badge.png
│   ├── verified-circular-badge.png
│   └── verified-by-truwit.png
├── 📁 Data/                        # Database & Migrations
│   └── 📁 Migrations/              # SQL Migration Scripts
├── 📁 wwwroot/                     # Static Web Assets
│   └── 📁 assets/                  # Public API Assets
├── 📄 Program.cs                   # Application Entry Point
├── 📄 Dockerfile                   # Container Configuration
├── 📄 railway.json                 # Railway Deployment Config
├── 📄 appsettings.json             # Application Configuration
└── 📄 HumanProof.Api.csproj       # Project File
```

### Key API Features:
- **C2PA Integration:** Content provenance verification
- **YouTube Processing:** Video thumbnail & metadata extraction
- **Proof Card Generation:** SVG-based verification badges
- **PostgreSQL Database:** Production data storage
- **NLog Logging:** Structured application logging

---

## 📱 Angular App Directory (`/app`)

**Technology:** Angular 17, TypeScript, SCSS  
**Deployment:** Cloudflare Pages (`/app` route)

```
app/
├── 📁 src/
│   ├── 📁 app/                     # Angular Application
│   │   ├── 📁 core/                # Singleton Services & Models
│   │   │   ├── 📁 models/          # TypeScript Interfaces
│   │   │   └── 📁 services/        # Core Application Services
│   │   │       ├── api.service.ts
│   │   │       ├── badge.service.ts
│   │   │       ├── unified-badge.service.ts
│   │   │       └── verification.service.ts
│   │   ├── 📁 features/            # Feature Modules
│   │   │   ├── 📁 home/            # Landing Page
│   │   │   └── 📁 verification/    # Verification Flow
│   │   │       ├── 📁 components/
│   │   │       │   ├── public-verify.component.*
│   │   │       │   ├── verification-form.component.*
│   │   │       │   └── verification-result.component.*
│   │   │       └── verification.module.ts
│   │   ├── 📁 shared/              # Reusable Components
│   │   │   └── 📁 components/
│   │   │       ├── 📁 dynamic-badge/
│   │   │       ├── 📁 toast-notification/
│   │   │       └── accessibility-toolbar.component.ts
│   │   ├── app.component.*         # Root Component
│   │   ├── app.module.ts           # App Module
│   │   └── app.routes.ts           # Routing Configuration
│   ├── 📁 assets/                  # Static Assets
│   │   ├── logo.svg                # SVG Logo (912 bytes)
│   │   ├── banner.png
│   │   ├── signed_badge.png
│   │   └── verified-circular-badge.png
│   ├── 📁 environments/            # Environment Configuration
│   ├── index.html                  # Entry HTML
│   ├── main.ts                     # Bootstrap Script
│   └── styles.scss                 # Global Styles
├── 📁 tests/                       # Playwright E2E Tests
│   ├── 📁 e2e/                     # End-to-End Test Specs
│   ├── 📁 fixtures/                # Test Data
│   └── 📁 helpers/                 # Test Utilities
├── 📄 angular.json                 # Angular CLI Configuration
├── 📄 playwright.config.ts         # E2E Test Configuration
├── 📄 package.json                 # Dependencies
└── 📄 tsconfig.json                # TypeScript Configuration
```

### Key Angular Features:
- **Public Verification:** `/t/{proofId}` shareable links
- **File Upload:** Drag-and-drop verification interface
- **Dynamic Badges:** Responsive verification badges
- **Accessibility:** WCAG compliant components
- **Progressive Enhancement:** Works without JavaScript

---

## 🌐 Astro Site Directory (`/src`)

**Technology:** Astro 4, TypeScript, CSS  
**Deployment:** Cloudflare Pages (main site)

```
src/
├── 📁 components/                   # Astro Components
│   ├── BaseHead.astro              # HTML Head Configuration
│   ├── Nav.astro                   # Navigation Component
│   ├── Footer.astro                # Footer Component
│   ├── CTA.astro                   # Call-to-Action Component
│   ├── FeatureCard.astro           # Feature Display Card
│   └── Section.astro               # Layout Section
├── 📁 pages/                       # File-based Routing
│   ├── index.astro                 # Homepage
│   ├── about.astro                 # About Page
│   ├── how-it-works.astro          # Product Overview
│   ├── technology.astro            # Technical Details
│   ├── pricing.astro               # Pricing Information
│   ├── use-cases.astro             # Use Case Examples
│   ├── investors.astro             # Investor Information
│   └── contact.astro               # Contact Form
├── 📁 styles/
│   └── global.css                  # Global Styles
└── env.d.ts                        # TypeScript Definitions
```

### Key Astro Features:
- **Static Generation:** Pre-built pages for performance
- **SEO Optimized:** Meta tags, structured data, sitemaps
- **Dark Theme:** Consistent dark mode design
- **Responsive Design:** Mobile-first approach

---

## 📚 Documentation Directory (`/docs`)

```
docs/
├── 📁 api/                         # API Documentation
│   ├── data-flow.md
│   └── README.md
├── 📁 markdowns/                   # Technical Documentation
│   ├── ARCHITECTURE.md
│   ├── DEPLOYMENT-GUIDE.md
│   ├── LOCAL-TESTING-GUIDE.md
│   ├── POSTGRESQL-MIGRATION-GUIDE.md
│   ├── PROOF-CARD-GENERATOR-CONTEXT.md
│   ├── QUICK-REFERENCE.md
│   ├── SQL-QUERY-EXAMPLES.md
│   └── YOUTUBE-COOKIES-GUIDE.md
├── 📁 plans/                       # Project Planning
│   ├── NEXT-STEPS-ACTION-PLAN.md
│   └── PROOF-CARD-IMPLEMENTATION-PLAN.md
├── 📁 releases/                    # Release Notes
│   ├── README.md
│   └── v1.0.0-mvp-candidate-1.md
├── PROJECT-STRUCTURE.md            # This Document
└── README.md                       # Documentation Index
```

---

## 🌍 Public Assets Directory (`/public`)

**Purpose:** Static assets for Astro site

```
public/
├── 📁 fonts/                       # Web Fonts
│   ├── atkinson-bold.woff
│   └── atkinson-regular.woff
├── 📁 images/                      # Image Assets
│   ├── logo.svg                    # SVG Logo (912 bytes)
│   ├── banner.png
│   ├── og-truwit.png               # Open Graph Image
│   ├── signed_badge.png
│   ├── verified-circular-badge.png
│   └── truwit-*.png                # Brand Variations
├── favicon-truwit.png              # Site Favicon
├── manifest.webmanifest            # PWA Manifest
├── robots.txt                      # Search Engine Rules
├── humans.txt                      # Developer Credits
└── _redirects                      # Cloudflare Redirects
```

---

## ⚡ Cloudflare Functions (`/functions`)

**Purpose:** Serverless API endpoints

```
functions/
├── [[app]].js                      # Catch-all route handler
└── 📁 app/
    └── [[path]].js                 # Dynamic path handler
```

---

## 🔧 Scripts Directory (`/scripts`)

**Purpose:** Build automation and utilities

```
scripts/
├── asset-reference-scanner.js      # Asset Usage Analysis
├── capture-screenshots.js          # Automated Screenshots
├── copy-canonical-assets.js        # Asset Synchronization
├── sync-api-assets.js              # API Asset Management
├── validate-assets.js              # Asset Validation
├── validate-gitignore.js           # GitIgnore Validation
├── verify-build-output.js          # Build Verification
├── verify-deployment.js            # Deployment Testing
├── generate-proof-cards.ps1        # Proof Card Generation
└── test-proof-card-regeneration.ps1
```

---

## 🧪 Tools Directory (`/tools`)

**Purpose:** Development and testing utilities

```
tools/
├── badge_consistency_e2e_test.py   # Badge Testing
├── comprehensive_e2e_test.py       # Full E2E Tests
├── e2e_full_navigation.py          # Navigation Tests
└── 📁 ProofCardGen/                # Standalone Proof Card Generator
    ├── Program.cs
    ├── ProofCardGen.csproj
    └── 📁 bin/                     # Compiled Output
```

---

## 📋 Configuration Files

### Root Level Configurations

| File | Purpose |
|------|---------|
| `astro.config.mjs` | Astro framework configuration |
| `docker-compose.yml` | Local development environment |
| `wrangler.json` | Cloudflare Workers configuration |
| `package.json` | Root npm dependencies |
| `tsconfig.json` | TypeScript global configuration |
| `.cursorignore` | Cursor IDE ignore rules (includes `*.svg`) |

### Environment-Specific Files

| Environment | Configuration Files |
|-------------|-------------------|
| **Angular** | `angular.json`, `playwright.config.ts`, `proxy.conf.json` |
| **API** | `appsettings.json`, `railway.json`, `nlog.config` |
| **Astro** | `astro.config.mjs` (shared with root) |
| **Cloudflare** | `wrangler.json`, `_redirects` |

---

## 🎯 Key Architecture Patterns

### 1. **Asset Management Strategy**
- **Source of Truth:** `app/src/assets/`
- **Sync Scripts:** Copy assets to `public/images/` and `api/CardTemplates/`
- **SVG Handling:** Added to `.cursorignore` to prevent processing errors

### 2. **Database Architecture**
- **Development:** SQLite (`truwit.db`)
- **Production:** PostgreSQL (Railway)
- **Migrations:** SQL scripts in `api/Data/Migrations/`

### 3. **Deployment Strategy**
- **API:** Railway (Docker container)
- **Frontend:** Cloudflare Pages (static builds)
- **Functions:** Cloudflare Workers (serverless)

### 4. **Testing Structure**
- **Unit Tests:** In respective project folders
- **E2E Tests:** Playwright (`app/tests/`)
- **Integration Tests:** Python scripts (`tools/`)

---

## 🚀 Getting Started Commands

```bash
# Install all dependencies
npm install

# Start development servers
npm run dev              # Start all services
npm run dev:astro        # Astro site only
npm run dev:app          # Angular app only
npm run dev:api          # API only

# Build for production
npm run build            # Build all projects
npm run build:astro      # Astro build
npm run build:app        # Angular build

# Testing
npm run test             # Run all tests
npm run test:e2e         # E2E tests only
npm run screenshots      # Generate screenshots

# Asset management
npm run sync-assets      # Sync assets between projects
npm run validate-assets  # Validate asset references
```

---

## 📦 Package Management

### Root Dependencies (`package.json`)
- **@astro/cloudflare** - Cloudflare deployment
- **@playwright/test** - E2E testing framework
- **Astro framework** - Static site generation

### Angular Dependencies (`app/package.json`)
- **Angular 17** - Frontend framework
- **TypeScript** - Language support
- **SCSS** - Styling

### API Dependencies (`api/HumanProof.Api.csproj`)
- **ASP.NET Core 8** - Web framework
- **Entity Framework Core** - ORM
- **Npgsql** - PostgreSQL provider
- **NLog** - Logging framework

---

## 🔍 Special Files & Directories

### Important Files to Note

| File/Directory | Purpose | Notes |
|----------------|---------|-------|
| `truwit.db` | SQLite database | Development only |
| `cookies*.txt` | YouTube authentication | Required for video processing |
| `temp_*` files | Temporary processing | Auto-generated, gitignored |
| `screenshot-*` directories | Test artifacts | Timestamped screenshot archives |
| `.cursorignore` | IDE configuration | Prevents SVG processing errors |

### Deployment-Critical Files

| File | Platform | Purpose |
|------|----------|---------|
| `Dockerfile` | Railway | API containerization |
| `railway.json` | Railway | Deployment configuration |
| `wrangler.json` | Cloudflare | Workers configuration |
| `_redirects` | Cloudflare | URL routing rules |
| `astro.config.mjs` | Cloudflare | Build configuration |

---

## 🏷️ Version Information

- **Project Version:** 1.0.0 MVP
- **Angular:** 17.x
- **ASP.NET Core:** 8.x
- **Astro:** 4.x
- **Node.js:** 18+ required
- **.NET:** 8.0 required

---

**This documentation is automatically generated and maintained. For updates or corrections, please modify the source structure and regenerate this document.**
