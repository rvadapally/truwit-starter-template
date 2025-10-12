# Truwit Deployment Guide

Complete guide for deploying the Truwit Verification application to production (Railway + Cloudflare Pages).

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Repository Structure](#repository-structure)
3. [Railway Deployment (API)](#railway-deployment-api)
4. [Cloudflare Pages Deployment (Frontend)](#cloudflare-pages-deployment-frontend)
5. [Environment Configuration](#environment-configuration)
6. [Critical Deployment Issues & Fixes](#critical-deployment-issues--fixes)
7. [Testing Production](#testing-production)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Accounts Needed
- **GitHub** account with your repository
- **Railway** account (https://railway.app)
- **Cloudflare** account (https://cloudflare.com)

### Required Tools (Local Development)
- Docker Desktop
- Node.js 18+
- .NET 8.0 SDK
- Git

---

## Repository Structure

```
humanproof-starter/
├── api/                    # .NET API (→ Railway)
│   ├── Dockerfile         # Railway builds this
│   ├── railway.json       # Railway configuration
│   ├── appsettings.json   # API configuration
│   └── ...
├── app/                    # Angular Frontend (→ Cloudflare Pages)
│   ├── src/
│   │   ├── _redirects    # SPA routing for Cloudflare
│   │   └── environments/
│   ├── angular.json       # Build configuration
│   └── package.json
├── package.json           # Root build script (builds Angular)
├── start.bat             # Local development startup
└── stop.bat              # Local development shutdown
```

**Key Points:**
- **Mono-repo structure:** Both API and Frontend in one repository
- **Railway:** Deploys only `api/` directory using `rootDirectory` setting
- **Cloudflare:** Builds Angular app from root using `npm run build`

---

## Railway Deployment (API)

### Initial Setup

**1. Create Railway Project**
```
https://railway.app/new
→ Deploy from GitHub repo
→ Select your repository
```

**2. Configure Service**

In Railway dashboard:

**Build Settings:**
```
Root Directory:    api
Builder:          Dockerfile
```

**Deployment Settings:**
```
Health Check Path:          /health
Health Check Timeout:       100s
Restart Policy:             On Failure
Max Restart Retries:        10
```

**3. Environment Variables**

Railway automatically provides:
```
PORT                      (Railway sets this)
RAILWAY_ENVIRONMENT       production
```

Add these manually:
```
ASPNETCORE_ENVIRONMENT    Production
ASPNETCORE_URLS           http://0.0.0.0:8080
ASPNETCORE_HTTP_PORTS     8080
```

**4. Domain**

Railway provides:
```
https://[your-project]-production.up.railway.app
```

Optional: Add custom domain in Railway settings.

---

### railway.json Configuration

File: `api/railway.json`

```json
{
    "$schema": "https://railway.app/railway.schema.json",
    "build": {
        "builder": "DOCKERFILE",
        "dockerfilePath": "Dockerfile"
    },
    "deploy": {
        "healthcheckPath": "/health",
        "healthcheckTimeout": 100,
        "restartPolicyType": "ON_FAILURE",
        "restartPolicyMaxRetries": 10
    }
}
```

---

### Dockerfile Explained

File: `api/Dockerfile`

**Key Features:**
```dockerfile
# Build stage - compiles .NET app
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["HumanProof.Api.csproj", "."]
RUN dotnet restore "HumanProof.Api.csproj"
COPY . .
RUN dotnet publish "HumanProof.Api.csproj" -c Release -o /app/publish

# Runtime stage - runs the app
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    python3 \
    ffmpeg \
    curl \
    ca-certificates && \
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp && \
    rm -rf /var/lib/apt/lists/* && \
    mkdir -p /tmp/truwit_dl && chmod 777 /tmp/truwit_dl && \
    mkdir -p /app/data && chmod 777 /app/data  # CRITICAL: For SQLite database

COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "HumanProof.Api.dll"]
```

**Critical Line:**
```dockerfile
mkdir -p /app/data && chmod 777 /app/data
```
**Why:** SQLite database is stored at `/app/data/truwit.db`. Without this directory, Railway deployment fails with "unable to open database file".

---

### Database Configuration

**Connection String (appsettings.json):**
```json
{
  "ConnectionStrings": {
    "Sqlite": "Data Source=data/truwit.db"
  }
}
```

**Important:**
- Database is stored in container at `/app/data/truwit.db`
- **Ephemeral:** Data is LOST on container restart
- For production, consider Railway's PostgreSQL add-on or persistent volumes
- Database is created automatically on first run

---

### Deployment Triggers

Railway auto-deploys on:
- ✅ Push to `main` branch
- ✅ Changes in `api/` directory only (due to `rootDirectory: api`)
- ⏱️ Build time: **5-10 minutes**

---

## Cloudflare Pages Deployment (Frontend)

### Initial Setup

**1. Create Cloudflare Pages Project**
```
https://dash.cloudflare.com/[account]/pages
→ Create a project
→ Connect to Git
→ Select your GitHub repository
```

**2. Build Settings**

```
Framework preset:      Angular
Build command:        npm run build
Build output directory: dist/humanproof-web/browser
Root directory:       /
Branch:               main
```

**Important:** Use root directory `/`, not `app/` because the build command in root `package.json` handles navigating to `app/`.

---

### Build Configuration

**Root package.json:**
```json
{
  "scripts": {
    "build": "npm run build:app && npm run build:astro && npm run integrate",
    "build:app": "cd app && npm install && npm run build"
  }
}
```

**App package.json:**
```json
{
  "scripts": {
    "build": "ng build --configuration=production"
  }
}
```

**Angular production build** uses:
- `app/src/environments/environment.prod.ts` (file replacement in angular.json)
- Output: `app/dist/humanproof-web/browser/`

---

### SPA Routing Configuration

**Critical File:** `app/src/_redirects`

```
# Cloudflare Pages SPA routing
# All routes should serve index.html for Angular routing

/*    /index.html   200
```

**Why This Is Critical:**
- Angular uses client-side routing (e.g., `/t/abc123`)
- Without this, direct links return 404
- This tells Cloudflare: "For ANY path, serve index.html"
- Angular router then handles navigation

**Configured in** `app/angular.json`:
```json
{
  "assets": [
    "src/favicon.ico",
    "src/assets",
    "src/_redirects"  // ← Copies to dist/
  ]
}
```

---

### Environment Variables

**File:** `app/src/environments/environment.prod.ts`

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://truwit-starter-template-production.up.railway.app'
};
```

**File replacement configured in** `app/angular.json`:
```json
{
  "configurations": {
    "production": {
      "fileReplacements": [
        {
          "replace": "src/environments/environment.ts",
          "with": "src/environments/environment.prod.ts"
        }
      ]
    }
  }
}
```

---

### Deployment Triggers

Cloudflare auto-deploys on:
- ✅ Push to `main` branch
- ✅ Any changes (monitors all files)
- ⏱️ Build time: **3-5 minutes**

**Note:** Cloudflare builds faster than Railway!

---

## Environment Configuration

### Local Development

**API:**
```json
// api/appsettings.json
{
  "ConnectionStrings": {
    "Sqlite": "Data Source=data/truwit.db"
  }
}
```

**Frontend:**
```typescript
// app/src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://127.0.0.1:5001'  // Local Docker API
};
```

**Docker Compose:**
```yaml
# api/docker-compose.yml
services:
  api:
    ports:
      - "127.0.0.1:5001:8080"  # Local port 5001 → Container port 8080
    volumes:
      - ./data:/app/data  # Database persists locally
```

---

### Production Configuration

**API (Railway):**
- Uses same `appsettings.json`
- Database at `/app/data/truwit.db` (ephemeral)
- Exposed on Railway's provided URL

**Frontend (Cloudflare):**
```typescript
// app/src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://truwit-starter-template-production.up.railway.app'
};
```

**Served on:**
- Primary: `https://[project].pages.dev`
- Custom: `https://www.truwit.ai` (configure in Cloudflare)

---

## Critical Deployment Issues & Fixes

This section documents all the major issues we encountered and fixed.

### Issue 1: Broken Git Submodules

**Error:**
```
fatal: No url found for submodule path 'cloudflare-workers/humanproof-api' in .gitmodules
Failed: error occurred while updating repository submodules
```

**Cause:**
- Repository had submodule entries in git index
- No `.gitmodules` file with URLs
- Cloudflare couldn't clone the repository

**Fix:**
```bash
# Remove submodule entries
git rm --cached cloudflare-workers/humanproof-api truwit-integrated

# Add to .gitignore
echo "cloudflare-workers/" >> .gitignore
echo "truwit-integrated/" >> .gitignore

git commit -m "Remove broken submodules"
git push
```

**Commit:** `9b8a455`

---

### Issue 2: Railway SQLite Database Failure

**Error:**
```
Microsoft.Data.Sqlite.SqliteException (0x80004005): 
SQLite Error 14: 'unable to open database file'.
```

**Cause:**
- Connection string: `Data Source=data/truwit.db`
- Directory `/app/data` didn't exist in Railway container
- Local Docker worked because `docker-compose.yml` creates it via volume mount

**Environment Difference:**
```yaml
# Local: docker-compose.yml creates /app/data
volumes:
  - ./data:/app/data  # ← Automatically creates directory

# Railway: Just runs Dockerfile
# No volume mounts! Directory doesn't exist!
```

**Fix:**
```dockerfile
# api/Dockerfile
RUN mkdir -p /app/data && chmod 777 /app/data
```

**Commit:** `a03c1f0`

---

### Issue 3: Hash Routing Breaking Navigation

**Error:**
- URLs like `http://localhost:4200/#/t/abc123` (ugly hash)
- `window.open()` not working with hash routing
- Direct links failing

**Cause:**
- Angular configured with `HashLocationStrategy`
- Not needed for modern deployments

**Fix:**
```typescript
// app/src/app/app.module.ts
// REMOVED:
// import { HashLocationStrategy, LocationStrategy } from '@angular/common';
// RouterModule.forRoot(routes, { useHash: true }),
// providers: [{ provide: LocationStrategy, useClass: HashLocationStrategy }]

// NOW:
RouterModule.forRoot(routes),  // Clean URLs
providers: []
```

**Added SPA routing:**
```
# app/src/_redirects
/*    /index.html   200
```

**Result:**
- Clean URLs: `http://localhost:4200/t/abc123`
- Direct links work
- Sharing works

**Commit:** `fe8ac6a`

---

### Issue 4: Content Hash Showing "Unknown"

**Error:**
- Verification page showed: `Content Hash: unknown`
- Database had the hash, but API wasn't returning it

**Cause:**
```csharp
// api/Controllers/ProofsController.cs (Line 1097)
// WRONG:
var asset = await _assetsRepo.GetBySha256Async(proof.AssetId);
//                          ↑ Wrong method!
// AssetId is a GUID, not a SHA256 hash!
```

**Fix:**
```csharp
// Added new method to repository:
public async Task<Asset?> GetByIdAsync(string assetId) { ... }

// Updated controller:
var asset = await _assetsRepo.GetByIdAsync(proof.AssetId);
```

**Commit:** `16a90eb`

---

### Issue 5: Timezone Conversion Issues

**Error:**
- API stored timestamps in Central Time
- But marked them as UTC (with 'Z' suffix)
- Browser displayed wrong times

**Cause:**
```csharp
// WRONG:
IssuedAt = proof.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")
// Takes 2:29 AM Central, outputs "2:29Z" (claiming it's UTC!)
```

**Fix:**
```csharp
// api/Controllers/ProofsController.cs
IssuedAt = TimeZoneInfo.ConvertTimeToUtc(
    proof.CreatedAt,
    TimeZoneInfo.FindSystemTimeZoneById("Central Standard Time")
).ToString("yyyy-MM-ddTHH:mm:ssZ")
// Now actually converts to UTC before adding 'Z'
```

**Commit:** `03361ab`

---

### Issue 6: start.bat Starting Wrong Server

**Error:**
- Running `start.bat` started Astro (port 4321) instead of Angular (port 4200)

**Cause:**
```batch
# BROKEN:
cd app
start "Truwit Angular" cmd /k "npm start"
cd ..

# New window starts in ROOT directory, not app!
# Runs root's package.json → Astro
```

**Fix:**
```batch
# FIXED:
start "Truwit Angular" cmd /k "cd app && npm start"
# cd happens INSIDE the new window
```

**Commit:** `53ab97a`

---

### Issue 7: Wrong API Endpoint (No Deduplication)

**Error:**
- Creating proofs for same URL multiple times generated new proofs
- Deduplication not working

**Cause:**
```typescript
// app/src/app/core/services/verification.service.ts
// WRONG:
return this.apiService.post('/v1/proofs', request)  // Legacy endpoint, no dedup

// CORRECT:
return this.apiService.post('/v1/proofs/url', request)  // New endpoint with dedup
```

**Fix:**
- Updated frontend to call `/v1/proofs/url` endpoint
- This endpoint checks `LinkIndex` table for existing proofs

**Commit:** `1eb6791`

---

## Testing Production

### 1. Health Check

**Railway API:**
```bash
curl https://truwit-starter-template-production.up.railway.app/health
```

**Expected Response:**
```json
{
  "ok": true,
  "timestamp": "2025-10-12T08:00:00Z",
  "tools": {
    "yt-dlp": "2025.09.26",
    "c2patool": "unknown"
  }
}
```

---

### 2. Frontend Loads

Visit: `https://www.truwit.ai`

**Check:**
- ✅ Page loads without errors
- ✅ URL is clean (no `#`)
- ✅ Form displays correctly
- ✅ Browser console has no errors

---

### 3. End-to-End Verification

**Step 1: Create Proof**
```
1. Go to https://www.truwit.ai
2. Paste YouTube URL: https://www.youtube.com/watch?v=Av1g2yciuDU
3. Click "Generate Proof"
4. Wait for download (30s - 2min)
5. See success message
```

**Step 2: View Verification**
```
6. Click "View Verification Details"
7. URL should be: https://www.truwit.ai/t/[8-char-id]
8. Check all data displays:
   - Content Hash (64 characters, not "unknown")
   - Timestamps (UTC + Your Time)
   - C2PA Signature Status with explanation
```

**Step 3: Test Deduplication**
```
9. Go back to home
10. Paste SAME URL again
11. Click "Generate Proof"
12. Should return INSTANTLY (no download)
13. Same TrustmarkId as before
14. Same timestamp (not updated)
```

**Step 4: Direct Link**
```
15. Copy the verification URL
16. Open in new incognito window
17. Should load verification page (not 404)
```

---

### 4. Database Test

**Create multiple proofs:**
```bash
# Using curl
curl -X POST https://truwit-starter-template-production.up.railway.app/v1/proofs/url \
  -H "Content-Type: application/json" \
  -d '{"Url":"https://www.youtube.com/watch?v=test1"}'

curl -X POST https://truwit-starter-template-production.up.railway.app/v1/proofs/url \
  -H "Content-Type: application/json" \
  -d '{"Url":"https://www.youtube.com/watch?v=test2"}'
```

**Get stats:**
```bash
curl https://truwit-starter-template-production.up.railway.app/v1/proofs/test/stats
```

---

## Troubleshooting

### Railway Issues

**Problem:** Build fails with "command not found"

**Solution:**
- Check Dockerfile has correct `RUN` commands
- Verify `apt-get install` includes all dependencies

---

**Problem:** API crashes immediately after starting

**Solution:**
```bash
# Check Railway logs for:
- Database connection errors
- Missing directories
- Environment variable issues
```

---

**Problem:** Health check failing

**Solution:**
- Verify `/health` endpoint exists
- Check `ASPNETCORE_URLS` is set to `http://0.0.0.0:8080`
- Increase health check timeout in `railway.json`

---

### Cloudflare Issues

**Problem:** Direct links return 404

**Solution:**
- Verify `_redirects` file exists in build output
- Check `angular.json` includes `src/_redirects` in assets
- Check build output directory contains `_redirects` file

---

**Problem:** API calls return CORS errors

**Solution:**
```csharp
// api/Program.cs
app.UseCors(policy => policy
    .WithOrigins("https://www.truwit.ai")
    .AllowAnyMethod()
    .AllowAnyHeader());
```

---

**Problem:** Environment variables not working

**Solution:**
- Check `angular.json` has `fileReplacements` for production
- Verify `environment.prod.ts` has correct Railway URL
- Clear Cloudflare cache after deployment

---

### Database Issues

**Problem:** "unable to open database file"

**Solution:**
```dockerfile
# Dockerfile must create directory:
RUN mkdir -p /app/data && chmod 777 /app/data
```

---

**Problem:** Database data lost after restart

**Solution:**
- Railway containers are ephemeral
- Use Railway PostgreSQL add-on for persistent data
- Or configure Railway volumes (if available)

---

### General Debugging

**Check Railway Logs:**
```
Railway Dashboard → Your Service → Logs tab
```

**Check Cloudflare Build Logs:**
```
Cloudflare Pages → Your Project → Deployments → Latest deployment
```

**Check Browser Console:**
```
F12 → Console tab
Look for API errors, routing errors, CORS issues
```

---

## Quick Reference

### Deployment Commands

```bash
# Push to trigger both deployments
git push origin main

# Railway deploys: ~5-10 minutes
# Cloudflare deploys: ~3-5 minutes
```

### URLs

```
Local Frontend:    http://localhost:4200
Local API:         http://localhost:5001
Railway API:       https://truwit-starter-template-production.up.railway.app
Cloudflare Pages:  https://www.truwit.ai
```

### Key Files

```
api/Dockerfile              # Railway build instructions
api/railway.json            # Railway configuration
api/appsettings.json        # API configuration
app/angular.json            # Angular build config
app/src/_redirects          # SPA routing for Cloudflare
app/src/environments/*.ts   # API URL configuration
```

---

## Maintenance

### Updating Dependencies

**Frontend:**
```bash
cd app
npm update
npm audit fix
```

**Backend:**
```bash
cd api
dotnet list package --outdated
dotnet add package [PackageName]
```

### Monitoring

**Railway:**
- Check logs daily for errors
- Monitor health check status
- Watch resource usage

**Cloudflare:**
- Check analytics for traffic
- Monitor build success rate
- Review error logs

---

**Last Updated:** October 12, 2025

