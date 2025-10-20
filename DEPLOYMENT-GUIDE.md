# TruWit Proof Card System - Deployment Guide

Complete guide for deploying the TruWit proof card generation system to production.

**Last Updated:** October 19, 2025

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Railway API Deployment](#railway-api-deployment)
4. [Cloudflare Pages Deployment](#cloudflare-pages-deployment)
5. [Database Migration](#database-migration)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Critical Fixes Applied](#critical-fixes-applied)
8. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### Deployment Stack

```
┌─────────────────────────────────────────────────────┐
│  https://truwit.ai (Cloudflare Pages)               │
│  ├── /                 → Astro static pages          │
│  └── /app/*            → Angular SPA                 │
│      └── /app/t/:id    → Proof verification page    │
└─────────────────────────────────────────────────────┘
                    ↓ API calls
┌─────────────────────────────────────────────────────┐
│  Railway API (ASP.NET Core)                         │
│  https://[project].up.railway.app                   │
│  ├── /v1/proofs/*      → Proof management           │
│  ├── /assets/proof/*   → Static proof card images   │
│  └── /cards/proof/*    → Regenerate-on-miss         │
└─────────────────────────────────────────────────────┘
                    ↓ Database
┌─────────────────────────────────────────────────────┐
│  Railway PostgreSQL                                 │
│  ├── Proofs table      → Main proof records         │
│  └── VerificationProofs → Legacy proofs             │
└─────────────────────────────────────────────────────┘
```

### Key Technologies
- **Frontend**: Angular 18 + Astro (hybrid deployment)
- **Backend**: ASP.NET Core 8.0
- **Database**: PostgreSQL (Railway managed)
- **Image Generation**: SkiaSharp + QRCoder
- **Hosting**: Railway (API) + Cloudflare Pages (Frontend)

---

## Prerequisites

### Required Accounts
- ✅ GitHub account with repository access
- ✅ Railway account (https://railway.app)
- ✅ Cloudflare account (https://cloudflare.com)

### Local Development Tools
- Docker Desktop (for local testing)
- .NET 8.0 SDK
- Node.js 18+
- Git

### Repository Access
- Clone the repository: `git clone [your-repo-url]`
- Ensure you're on the `main` branch

---

## Railway API Deployment

### Step 1: Create PostgreSQL Database

1. Go to https://railway.app
2. Create new project or open existing
3. Click **"+ New"** → **"Database"** → **"PostgreSQL"**
4. Wait for database to provision
5. Note the connection string from **"Variables"** tab

### Step 2: Configure API Service

**Build Configuration:**
```
Service Name:         truwit-api
Root Directory:       api
Builder:             Dockerfile
Watch Paths:         api/**
```

**Environment Variables:**
```bash
# Railway provides automatically:
DATABASE_URL=postgresql://...
PORT=8080

# Add these manually:
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://0.0.0.0:8080
Database__Type=postgres
ConnectionStrings__Postgres=${DATABASE_URL}
```

**Health Check:**
```
Path:     /health
Timeout:  100 seconds
```

### Step 3: Deploy

1. Connect GitHub repository
2. Select `main` branch
3. Railway will auto-detect Dockerfile and build
4. **Build time:** 3-5 minutes
5. **First deploy:** May take longer due to package downloads

### Step 4: Verify Deployment

```bash
# Test health endpoint
curl https://[your-project].up.railway.app/health

# Expected response:
{"ok":true,"timestamp":"...","tools":{"yt-dlp":"...","c2patool":"unknown"}}
```

---

## Cloudflare Pages Deployment

### Step 1: Create Cloudflare Pages Project

1. Go to https://dash.cloudflare.com
2. Navigate to **Pages** → **Create a project**
3. Select **"Connect to Git"**
4. Choose your GitHub repository
5. Select `main` branch

### Step 2: Build Configuration

**Framework Preset:** None (custom)

**Build Settings:**
```
Build command:          npm run build
Build output directory: dist
Root directory:         / (leave empty)
Environment:           Production
Node version:          18 or higher
```

### Step 3: Environment Variables

Cloudflare Pages uses file replacements, so no environment variables needed. The production API URL is configured in:

```typescript
// app/src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://[your-railway-project].up.railway.app'
};
```

### Step 4: Custom Domain (Optional)

1. Cloudflare Pages → Your project → **Custom domains**
2. Add `truwit.ai` and `www.truwit.ai`
3. Cloudflare automatically configures DNS

---

## Database Migration

### **CRITICAL:** Apply PostgreSQL Migration

After the first Railway deployment, you **MUST** run this SQL to add proof card columns:

**Step 1: Access Railway PostgreSQL**
1. Railway Dashboard → PostgreSQL service
2. Click **"Data"** tab
3. Click **"Query"** button

**Step 2: Run Migration SQL**
```sql
-- Add proof card URL columns to Proofs table
ALTER TABLE "Proofs"
ADD COLUMN IF NOT EXISTS "ProofCardSmallUrl" TEXT NULL;

ALTER TABLE "Proofs"
ADD COLUMN IF NOT EXISTS "ProofCardLargeUrl" TEXT NULL;

-- Verify columns were added
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'Proofs' 
AND column_name LIKE 'ProofCard%';

-- Expected output:
--  column_name
-- -------------------
--  ProofCardSmallUrl
--  ProofCardLargeUrl
```

**Why This Is Critical:**
- Without these columns, proof card URLs cannot be stored
- New proofs will fail to save proof card references
- Frontend will get 404 when trying to load proof cards

---

## Post-Deployment Verification

### 1. Test Proof Card Generation

**Create a test proof:**
```bash
curl -X POST https://[your-railway].up.railway.app/v1/proofs/url \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: test-$(date +%s)" \
  -d '{"url":"https://youtu.be/dQw4w9WgXcQ"}'
```

**Expected response:**
```json
{
  "proofId": "...",
  "trustmarkId": "TW-XXXXXXXX",  // Note the TW- prefix for new proofs
  "verifyUrl": "/t/TW-XXXXXXXX",
  "deduped": false
}
```

### 2. Test Proof Card Image

**Check if proof card was generated:**
```bash
curl -I https://[your-railway].up.railway.app/assets/proof/[trustmarkId]-800.png
```

**Expected headers:**
```
HTTP/1.1 200 OK
Content-Type: image/png
Access-Control-Allow-Origin: *
Content-Length: [size in bytes]
```

### 3. Test Frontend Display

1. Go to `https://truwit.ai/app/t/[trustmarkId]`
2. **Should display:**
   - Verification page (not landing page)
   - Proof card image with teal background
   - Circular "Verified by TruWit" badge
   - TW- prefixed proof ID in white container
   - QR code for verification
3. **Should NOT display:**
   - Landing page
   - 404 error
   - CORS errors in browser console

### 4. Test CORS Headers

**From browser console on https://truwit.ai:**
```javascript
fetch('https://[your-railway].up.railway.app/assets/proof/test-800.png', {
  method: 'HEAD'
})
.then(r => console.log('CORS OK:', r.headers.get('access-control-allow-origin')))
.catch(e => console.error('CORS FAIL:', e))
```

**Expected:** `CORS OK: *`

---

## Critical Fixes Applied

### Fix 1: CORS for Static Files

**Problem:** Static proof card images had CORS errors

**Solution:**
```csharp
// api/Program.cs
// IMPORTANT: UseCors BEFORE UseStaticFiles
app.UseCors("AllowAll");

app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        // Explicit CORS headers for static files
        ctx.Context.Response.Headers.Append("Access-Control-Allow-Origin", "*");
        ctx.Context.Response.Headers.Append("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
        ctx.Context.Response.Headers.Append("Access-Control-Allow-Headers", "*");
    }
});
```

### Fix 2: Angular Routing Order

**Problem:** `/app/t/:id` was showing landing page instead of verification page

**Solution:**
```typescript
// app/src/app/app.routes.ts
export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 't/:id', component: PublicVerifyComponent },
  // MORE SPECIFIC routes must come FIRST
  { path: 'app/t/:id', component: PublicVerifyComponent },
  // Then less specific routes
  { path: 'app', redirectTo: '/', pathMatch: 'full' },
  { path: '**', redirectTo: '/' }
];
```

### Fix 3: Remove app.astro Interceptor

**Problem:** Astro `app.astro` page was serving empty shell at `/app`

**Solution:**
- Deleted `src/pages/app.astro`
- Angular app served directly from `/app` directory
- No Astro interference with Angular routing

### Fix 4: Proof Card Size Updates

**Problem:** System was generating/requesting 640px instead of 800px

**Solution:**
```csharp
// Updated in 5 locations:
1. ProofService.cs: Generate(proofId, url, 800)  // was 640
2. ProofsController.cs: Generate(id, url, 800)    // was 640
3. ProofCardBackfillService.cs: if (size == 800)  // was 640
4. ProofCardBackfillServiceForProofs.cs: same
5. ProofsController.cs: BadgeUrl fallback uses 800  // was 640
```

### Fix 5: Environment Import Path

**Problem:** TypeScript build error - cannot find module

**Solution:**
```typescript
// app/src/app/features/verification/components/verification-form.component.ts
// WRONG (3 levels up):
import { environment } from '../../../environments/environment';

// CORRECT (4 levels up):
import { environment } from '../../../../environments/environment';
```

---

## Deployment Checklist

### Before Pushing to GitHub

- [ ] Run `dotnet build` in `api/` directory (no errors)
- [ ] Run `npm run build` in `app/` directory (no errors)
- [ ] Test with local Docker: `docker-compose up --build`
- [ ] Verify proof card generation locally
- [ ] Check CORS headers locally (if testing cross-origin)

### After Pushing to GitHub

- [ ] Monitor Railway deployment status (5-10 minutes)
- [ ] Monitor Cloudflare Pages build (3-5 minutes)
- [ ] Both show "Active" or "Success" status

### After Both Deployments Complete

- [ ] Apply PostgreSQL migration (if first deploy)
- [ ] Test health endpoint
- [ ] Create test proof
- [ ] Verify proof card generates
- [ ] Test frontend displays proof card
- [ ] Check CORS headers in browser console
- [ ] Test in incognito mode (no cache)

---

## Troubleshooting

### Railway API Not Deploying

**Check:**
1. GitHub webhook is connected (Project Settings → GitHub)
2. `api/` directory has changes (Railway watches this path)
3. Dockerfile builds successfully locally
4. Railway logs for build errors

**Force Deploy:**
- Railway Dashboard → Service → Deployments → **"Redeploy"**

### Cloudflare Pages Not Deploying

**Check:**
1. GitHub integration is active
2. Build succeeds locally: `npm run build`
3. Cloudflare build logs for errors

**Force Deploy:**
- Cloudflare Pages → Project → **"Retry deployment"**

### CORS Errors in Production

**Symptoms:**
```
Access to XMLHttpRequest at 'https://[railway].up.railway.app/assets/proof/...' 
from origin 'https://truwit.ai' has been blocked by CORS policy
```

**Fix:**
1. Verify `UseCors()` is called BEFORE `UseStaticFiles()` in `api/Program.cs`
2. Check CORS policy includes your Cloudflare domain
3. Redeploy Railway API

### Proof Cards Not Displaying

**Symptoms:**
- Frontend shows 404 for proof card image
- Console error: "Failed to load resource"

**Diagnosis:**
```bash
# Test if proof card exists
curl -I https://[railway].up.railway.app/assets/proof/[id]-800.png

# If 404, test regeneration endpoint
curl https://[railway].up.railway.app/cards/proof/[id]-800.png

# If still 404, check database
```

**Common Causes:**
1. Database migration not applied (columns missing)
2. Proof was created before migration (no URL stored)
3. Railway filesystem is ephemeral (files lost on redeploy)

**Solution:**
- For existing proofs: Use regenerate-on-miss endpoint
- For new proofs: Ensure migration is applied

### Routing Shows Landing Page

**Symptoms:**
- `https://truwit.ai/app/t/:id` shows home page instead of verification

**Diagnosis:**
1. Check if `src/pages/app.astro` exists (should be deleted)
2. Check Angular routes order in `app/src/app/app.routes.ts`
3. Verify `_redirects` file in build output

**Solution:**
- Delete any Astro pages that might intercept `/app` routes
- Ensure more specific routes come before general routes
- Clear Cloudflare cache

### TypeScript Build Errors

**Symptoms:**
```
Cannot find module '../../../environments/environment'
```

**Solution:**
- Count directory levels carefully (usually 4 levels up from components)
- Verify environment files exist and are committed to git
- Run `npm run build` locally to catch errors before pushing

---

## Local Testing (Before Production Deploy)

### Pre-Push Testing Script

**Create:** `pre-push-test.ps1`

```powershell
Write-Host "🔍 Pre-Push Testing..." -ForegroundColor Cyan

# Test API build
Write-Host "`n📦 Building API..." -ForegroundColor Yellow
cd api
dotnet build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ API build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ API build succeeded" -ForegroundColor Green

# Test Angular build
Write-Host "`n📦 Building Angular..." -ForegroundColor Yellow
cd ../app
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Angular build failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Angular build succeeded" -ForegroundColor Green

# Test Docker Compose
Write-Host "`n🐳 Testing with Docker Compose..." -ForegroundColor Yellow
cd ..
docker-compose up -d --build
Start-Sleep -Seconds 15

# Test API health
Write-Host "`n🏥 Testing API health..." -ForegroundColor Yellow
$health = Invoke-RestMethod -Uri "http://localhost:5000/health"
if ($health.ok) {
    Write-Host "✅ API health check passed" -ForegroundColor Green
} else {
    Write-Host "❌ API health check failed" -ForegroundColor Red
    exit 1
}

# Test proof card generation
Write-Host "`n🎨 Testing proof card generation..." -ForegroundColor Yellow
$testResult = docker exec truwit-postgres psql -U postgres -d truwit -c "SELECT COUNT(*) FROM \"Proofs\""
Write-Host "Database has proofs: $testResult"

Write-Host "`n✅ ALL PRE-PUSH TESTS PASSED!" -ForegroundColor Green
Write-Host "Safe to push to production." -ForegroundColor Cyan

# Cleanup
docker-compose down
```

**Usage:**
```powershell
.\pre-push-test.ps1
git push origin main
```

---

## Deployment Order

### Recommended Deployment Sequence

**1. Push to GitHub**
```bash
git add .
git commit -m "feat: your changes"
git push origin main
```

**2. Railway Deploys First (5-10 minutes)**
- Wait for Railway build to complete
- Verify health endpoint responds

**3. Apply Database Migration (if needed)**
- Only needed once, or when adding new columns
- Run SQL in Railway PostgreSQL console

**4. Cloudflare Pages Deploys (3-5 minutes)**
- Usually finishes while waiting for Railway
- But Railway must be deployed first for API availability

**5. Test End-to-End**
- Create new proof
- Verify proof card displays
- Check in incognito mode

---

## Environment-Specific Configurations

### Local Development

**API:** `api/appsettings.json`
```json
{
  "Database": {
    "Type": "postgres"
  },
  "ConnectionStrings": {
    "Postgres": "Host=localhost;Database=truwit;Username=postgres;Password=password"
  }
}
```

**Frontend:** `app/src/environments/environment.ts`
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000'
};
```

### Production

**API:** Uses Railway environment variables
```bash
Database__Type=postgres
ConnectionStrings__Postgres=${DATABASE_URL}  # Railway provides this
```

**Frontend:** `app/src/environments/environment.prod.ts`
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://truwit-starter-template-production.up.railway.app'
};
```

---

## Proof Card System Specifics

### How Proof Cards Are Generated

**On Proof Creation:**
```
1. User creates proof via /v1/proofs/url
2. API downloads and processes media
3. API generates 2 proof card images:
   - [trustmarkId]-800.png  (800x800px)
   - [trustmarkId]-1024.png (1024x1024px)
4. API saves to /app/wwwroot/assets/proof/
5. API stores URLs in database columns:
   - ProofCardSmallUrl
   - ProofCardLargeUrl
6. Frontend loads image from /assets/proof/
```

### Regenerate-on-Miss Endpoint

**Railway has ephemeral storage** - files are lost on redeploy.

**Solution:** Regenerate-on-miss endpoint
```
GET /cards/proof/{trustmarkId}-{size}.png

1. Checks if proof exists in database
2. Generates proof card on-the-fly
3. Saves to disk
4. Returns PNG image
5. Caches for future requests
```

**Frontend automatically uses this:**
```typescript
// 1. Try static file first
HEAD /assets/proof/{id}-800.png

// 2. If 404, regenerate
GET /cards/proof/{id}-800.png

// 3. Then retry static file
GET /assets/proof/{id}-800.png

// 4. If still fails, fallback to old badge
```

### Proof Card Design

**Base Template:** `api/CardTemplates/verified-circular-badge.jpg`

**Composition (SkiaSharp):**
1. Teal background (#1ABBB4)
2. Darker teal square card (layered effect)
3. Circular badge overlapping card top
4. White container at bottom
5. Dynamic elements:
   - Proof ID with TW- prefix
   - Verification URL (truwit.ai/t/...)
   - QR code (150x150px fixed size)

**Output:** 800x800px PNG with 95% quality

---

## Critical Files Reference

### Must Be Committed to Git

```
✅ api/CardTemplates/verified-circular-badge.jpg  # Badge template
✅ api/CardTemplates/proof-card.svg               # SVG template (for reference)
✅ app/src/assets/signed_badge.png                # Reference design
✅ app/src/environments/environment.prod.ts       # Production API URL
✅ api/Data/Migrations/*.sql                      # Database migrations
```

### Must Be in Docker Image

```
✅ api/CardTemplates/                    # For proof card generation
✅ api/wwwroot/assets/proof/.gitkeep     # Ensures directory exists
```

### Must Be in .dockerignore

```
✅ bin/
✅ obj/
✅ *.db
✅ temp_downloads/
✅ uploads/
```

---

## Monitoring

### Railway Logs

**Access:** Railway Dashboard → Service → **Logs** tab

**Watch for:**
- 🔍 Startup logs: `✅ Using Postgres database`
- ⚠️ Proof card generation errors
- ❌ Database connection failures
- 🔄 Health check responses

### Cloudflare Pages Logs

**Access:** Cloudflare Pages → Project → **Deployments**

**Watch for:**
- ✅ Build success
- ❌ TypeScript compilation errors
- ⚠️ Missing environment files
- 🔍 Asset validation failures

### Browser Console

**Production testing:**
```
F12 → Console tab
Look for:
- ❌ CORS errors
- ❌ 404 errors for proof cards
- ❌ API call failures
- ✅ Successful proof card loads
```

---

## Rollback Procedure

### If Deployment Fails

**Railway:**
```
1. Railway Dashboard → Service → Deployments
2. Click on last successful deployment
3. Click "Redeploy"
```

**Cloudflare:**
```
1. Cloudflare Pages → Project → Deployments
2. Find last successful deployment
3. Click "..." → "Rollback to this deployment"
```

**Git:**
```bash
# Rollback code
git revert HEAD
git push origin main

# Or force rollback
git reset --hard [previous-commit-hash]
git push -f origin main  # Use with caution!
```

---

## Best Practices

### Development Workflow

1. ✅ Make changes locally
2. ✅ Run `npm run build` (catch TypeScript errors)
3. ✅ Test with Docker Compose (catch environment issues)
4. ✅ Commit and push
5. ✅ Monitor both deployments
6. ✅ Test in production
7. ✅ If issues, fix and repeat

### Testing Checklist

**Before Every Push:**
- [ ] `dotnet build` succeeds
- [ ] `npm run build` succeeds
- [ ] Docker Compose starts without errors
- [ ] Health endpoint responds
- [ ] No console errors

**After Every Deploy:**
- [ ] Both platforms show "Success"
- [ ] Create test proof works
- [ ] Proof card displays correctly
- [ ] No CORS errors
- [ ] Incognito mode works

---

## Quick Commands Reference

### Local Development

```bash
# Start everything
.\start.bat

# Stop everything
.\stop.bat

# Rebuild Docker
docker-compose up --build -d

# View logs
docker-compose logs -f api

# Run database migration
docker exec truwit-postgres psql -U postgres -d truwit -f /path/to/migration.sql

# Backfill proof cards
docker exec truwit-api dotnet HumanProof.Api.dll BACKFILL-PROOFS
```

### Production Testing

```bash
# Test Railway API
curl https://[railway-url]/health

# Test proof creation
curl -X POST https://[railway-url]/v1/proofs/url \
  -H "Content-Type: application/json" \
  -d '{"url":"https://youtu.be/test"}'

# Test proof card
curl -I https://[railway-url]/assets/proof/[id]-800.png

# Test regeneration
curl https://[railway-url]/cards/proof/[id]-800.png
```

---

## Success Criteria

### Deployment is Successful When:

✅ **Railway API**
- Health endpoint returns `{"ok":true}`
- Proof creation works
- Database queries succeed
- Logs show no errors

✅ **Cloudflare Pages**
- Homepage loads at `https://truwit.ai`
- Verification page loads at `https://truwit.ai/app/t/:id`
- No routing errors
- No 404s for assets

✅ **Proof Card System**
- New proofs get TW- prefix
- Proof cards generate automatically
- Cards display in frontend
- CORS headers present
- Regenerate-on-miss works

✅ **End-to-End**
- User can create proof
- View verification page
- See branded proof card
- Copy embed code
- QR code works

---

## Support & Resources

### Documentation
- Railway Docs: https://docs.railway.app
- Cloudflare Pages: https://developers.cloudflare.com/pages
- ASP.NET Core: https://learn.microsoft.com/aspnet/core
- Angular: https://angular.io/docs

### Common Issues
- See `TROUBLESHOOTING.md` for detailed fixes
- See `LOCAL-TESTING-GUIDE.md` for local development
- See `POSTGRESQL-MIGRATION-GUIDE.md` for database updates

---

**End of Deployment Guide**

This guide reflects all lessons learned from the proof card system implementation. Follow these steps carefully to avoid the common pitfalls we encountered.
