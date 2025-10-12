# 🚀 Deployment Instructions

This document provides complete deployment instructions for both the **Railway API** and **Cloudflare Pages Frontend**.

---

## Table of Contents
1. [Railway API Deployment](#railway-api-deployment)
2. [Cloudflare Pages Frontend Deployment](#cloudflare-pages-frontend-deployment)
3. [Environment Configuration](#environment-configuration)
4. [YouTube Cookie Configuration](#youtube-cookie-configuration)
5. [Troubleshooting](#troubleshooting)

---

## 🚂 Railway API Deployment

### Prerequisites
- Railway account (https://railway.app)
- GitHub repository connected to Railway
- .NET 8.0 SDK (for local testing)

### 1. Initial Setup

1. **Connect Repository to Railway:**
   ```
   1. Log in to Railway dashboard
   2. Click "New Project" → "Deploy from GitHub repo"
   3. Select your repository
   4. Railway will auto-detect the project
   ```

2. **Configure Root Directory:**
   ```
   Settings → Service Settings → Root Directory: api
   ```
   ⚠️ **IMPORTANT:** Set root directory to `api` so Railway finds the correct Dockerfile.

3. **Verify Dockerfile Detection:**
   Railway should automatically detect `api/Dockerfile` and use it for builds.

### 2. Configuration Files

The API deployment uses these configuration files in the `api/` directory:

#### `api/Dockerfile`
```dockerfile
# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["HumanProof.Api.csproj", "."]
RUN dotnet restore "HumanProof.Api.csproj"
COPY . .
RUN dotnet publish "HumanProof.Api.csproj" -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Install system dependencies (yt-dlp and ffmpeg only - using hosted C2PA verifier)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    python3 \
    ffmpeg \
    curl \
    ca-certificates && \
    curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp && \
    rm -rf /var/lib/apt/lists/* && \
    yt-dlp --version && \
    ffmpeg -version

COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "HumanProof.Api.dll"]
```

#### `api/railway.json`
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

### 3. Environment Variables

Configure these in Railway Dashboard → Variables:

```env
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://0.0.0.0:8080
ASPNETCORE_HTTP_PORTS=8080

# Optional: YouTube cookies for yt-dlp (if needed)
# YT_DLP_COOKIES_FILE=/app/cookies.txt
```

### 4. Health Check

Railway will monitor your API health at:
```
https://your-railway-app.up.railway.app/health
```

Expected response:
```json
{
  "status": "Healthy",
  "timestamp": "2025-10-12T00:00:00Z"
}
```

### 5. Deployment Process

**Automatic Deployment:**
1. Push code to GitHub `main` branch
2. Railway automatically detects changes
3. Builds using Dockerfile
4. Deploys to production
5. Health check verifies deployment

**Manual Deployment:**
1. Go to Railway Dashboard
2. Click "New Deployment" or "Check for Updates"
3. Monitor build logs
4. Verify deployment status

### 6. Monitoring

Check deployment status:
- **Build Logs:** Railway Dashboard → Deployments → View Logs
- **Runtime Logs:** Railway Dashboard → Deployments → View Logs (Runtime)
- **Metrics:** Railway Dashboard → Metrics

---

## ☁️ Cloudflare Pages Frontend Deployment

### Prerequisites
- Cloudflare account (https://dash.cloudflare.com)
- GitHub repository connected to Cloudflare Pages
- Node.js 22.x (for local testing)

### 1. Initial Setup

1. **Create Cloudflare Pages Project:**
   ```
   1. Log in to Cloudflare Dashboard
   2. Navigate to "Pages"
   3. Click "Create a project" → "Connect to Git"
   4. Select your GitHub repository
   5. Configure build settings (see below)
   ```

2. **Build Configuration:**
   ```
   Framework preset: None
   Build command: npm install && npm run build
   Build output directory: dist
   Root directory: / (leave empty or set to root)
   Node.js version: 22 (set in Environment Variables)
   ```

3. **Environment Variables:**
   ```
   NODE_VERSION=22
   NPM_VERSION=10
   ```

### 2. Configuration Files

#### `package.json` (root)
```json
{
  "scripts": {
    "dev": "astro dev",
    "dev:app": "cd app && npm start",
    "dev:both": "concurrently \"npm run dev:app\" \"npm run dev\"",
    "start": "astro dev",
    "build": "npm run build:app && npm run build:astro && npm run integrate",
    "build:astro": "astro build",
    "build:app": "cd app && npm install && npm run build",
    "integrate": "node build-integration.js",
    "preview": "astro preview",
    "astro": "astro",
    "deploy": "npm run build && npx wrangler pages deploy ./dist --project-name=truwit-starter-template"
  }
}
```

#### `app/package.json`
```json
{
  "scripts": {
    "start": "ng serve",
    "build": "ng build --configuration=production"
  }
}
```

#### `.pages.yml` (optional - explicit config)
```yaml
# Cloudflare Pages build configuration
version: 1
build:
  command: "npm run build"
  publish: "dist"
  base_directory: "/"
```

### 3. Environment Configuration

#### Development (`app/src/environments/environment.ts`)
```typescript
export const environment = {
  production: false,
  apiUrl: 'https://truwit-starter-template-production.up.railway.app'
};
```

#### Production (`app/src/environments/environment.prod.ts`)
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://truwit-starter-template-production.up.railway.app'
};
```

#### Angular Build Configuration (`app/angular.json`)
Ensure production configuration includes `fileReplacements`:
```json
{
  "production": {
    "baseHref": "/app/",
    "fileReplacements": [
      {
        "replace": "src/environments/environment.ts",
        "with": "src/environments/environment.prod.ts"
      }
    ],
    "optimization": true,
    "outputHashing": "all",
    "sourceMap": false,
    "namedChunks": false,
    "extractLicenses": true
  }
}
```

### 4. Deployment Process

**Automatic Deployment:**
1. Push code to GitHub `main` branch
2. Cloudflare Pages automatically detects changes
3. Runs build command
4. Deploys to production
5. Available at your custom domain

**Manual Deployment via Wrangler CLI:**
```bash
# Install Wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy
npm run build
wrangler pages deploy ./dist --project-name=truwit-starter-template
```

### 5. Custom Domain

1. Go to Cloudflare Pages → Your Project → Custom domains
2. Add your domain (e.g., `truwit.ai`)
3. Cloudflare automatically configures DNS
4. SSL certificate is auto-provisioned

### 6. Build Troubleshooting

**If build fails with TypeScript errors:**
1. Remove `astro check` from build process (already done)
2. Ensure all Angular dependencies are installed
3. Check Node.js version matches (22.x)

**If API URL is still localhost:**
1. Verify `environment.prod.ts` has correct Railway URL
2. Verify `angular.json` has `fileReplacements` configured
3. Clear Cloudflare Pages cache and retry deployment
4. Check browser console for actual API URL being used

---

## ⚙️ Environment Configuration

### Development vs Production

| Environment | API URL | Usage |
|------------|---------|-------|
| Development | `http://localhost:5000` or Railway URL | Local testing |
| Production | Railway URL | Deployed on Cloudflare |

### Updating API URL

1. **Update environment files:**
   ```typescript
   // app/src/environments/environment.prod.ts
   export const environment = {
     production: true,
     apiUrl: 'https://your-railway-app.up.railway.app'
   };
   ```

2. **Commit and push:**
   ```bash
   git add app/src/environments/
   git commit -m "Update production API URL"
   git push origin main
   ```

3. **Cloudflare will auto-deploy** with new configuration

---

## 🍪 YouTube Cookie Configuration

YouTube requires authentication cookies for yt-dlp to work reliably.

### Option 1: Export Cookies from Browser (Recommended)

1. **Install browser extension:**
   - Chrome: [Get cookies.txt LOCALLY](https://chrome.google.com/webstore/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc)
   - Firefox: [cookies.txt](https://addons.mozilla.org/en-US/firefox/addon/cookies-txt/)

2. **Export cookies:**
   - Log into YouTube in your browser
   - Click extension icon → Export cookies for youtube.com
   - Save as `cookies.txt`

3. **Add to Railway:**
   
   **Method A: Environment Variable**
   ```bash
   # Base64 encode cookies file
   cat cookies.txt | base64 > cookies.b64
   
   # Add to Railway environment variables
   YOUTUBE_COOKIES_BASE64=<paste content of cookies.b64>
   ```
   
   Then update your API code to decode and use:
   ```csharp
   var cookiesBase64 = Environment.GetEnvironmentVariable("YOUTUBE_COOKIES_BASE64");
   if (!string.IsNullOrEmpty(cookiesBase64))
   {
       var cookiesContent = Encoding.UTF8.GetString(Convert.FromBase64String(cookiesBase64));
       File.WriteAllText("/tmp/cookies.txt", cookiesContent);
   }
   ```
   
   **Method B: Volume Mount (Railway Volumes)**
   ```
   1. Create a Railway Volume
   2. Upload cookies.txt to volume
   3. Mount volume at /app/cookies
   4. Update yt-dlp command: --cookies /app/cookies/cookies.txt
   ```

### Option 2: Use --cookies-from-browser

Modify yt-dlp command to extract cookies from browser:
```bash
yt-dlp --cookies-from-browser chrome ...
```

⚠️ **Note:** This requires the browser to be installed in the Docker container, which increases image size significantly.

### Option 3: Use Alternative Video Sources

For testing, use videos from platforms that don't require authentication:
- Direct video URLs (.mp4, .webm)
- Vimeo
- DailyMotion
- Other supported extractors: https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md

---

## 🔧 Troubleshooting

### Railway API Issues

#### Build Fails: "Dockerfile does not exist"
**Solution:**
1. Verify Root Directory is set to `api` in Railway Settings
2. Ensure `api/Dockerfile` exists in repository
3. Check `api/railway.json` has `"dockerfilePath": "Dockerfile"`

#### Deployment Crashes: "dotnet: command not found"
**Solution:**
1. Ensure you're using the correct Dockerfile (multi-stage with .NET runtime)
2. Verify base image is `mcr.microsoft.com/dotnet/aspnet:8.0`

#### yt-dlp Not Found
**Solution:**
1. Check Dockerfile installs yt-dlp correctly
2. Verify installation with: `RUN yt-dlp --version`
3. Ensure `/usr/local/bin` is in PATH

#### Health Check Failing
**Solution:**
1. Verify `/health` endpoint exists in API
2. Check `ASPNETCORE_URLS=http://0.0.0.0:8080`
3. Increase `healthcheckTimeout` in `railway.json`

### Cloudflare Pages Issues

#### Build Fails: npm install errors
**Solution:**
1. Set Node.js version to 22 in Environment Variables
2. Delete `package-lock.json` and regenerate
3. Check for deprecated packages

#### Build Succeeds but App Shows Localhost API
**Solution:**
1. Verify `environment.prod.ts` has correct Railway URL
2. Check `angular.json` production config has `fileReplacements`
3. Ensure build command uses `--configuration=production`
4. Clear Cloudflare build cache and retry

#### TypeScript Errors During Build
**Solution:**
1. Remove `astro check` from build script
2. Set `strict: false` in `tsconfig.json` (not recommended)
3. Fix TypeScript errors in code

#### Submodule Errors
**Solution:**
1. Remove git submodules: `git rm -r submodule_name`
2. Remove `.gitmodules` file if empty
3. Commit changes

### General Issues

#### CORS Errors
**Solution:**
Add CORS configuration to API:
```csharp
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("https://truwit.ai", "https://*.pages.dev")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});
```

#### API Rate Limiting
**Solution:**
Implement rate limiting in API or use Railway's rate limiting features.

---

## 📊 Deployment Checklist

### Before Deploying

- [ ] All code committed to `main` branch
- [ ] `.gitignore` excludes build artifacts (`bin/`, `obj/`, `node_modules/`)
- [ ] Environment files configured with correct API URLs
- [ ] Railway Root Directory set to `api`
- [ ] Cloudflare build command verified
- [ ] Dependencies up to date

### Railway API

- [ ] Dockerfile exists in `api/` directory
- [ ] `railway.json` configured correctly
- [ ] Health check endpoint implemented
- [ ] Environment variables configured
- [ ] Domain configured (if custom domain needed)

### Cloudflare Pages

- [ ] Build command: `npm install && npm run build`
- [ ] Build output directory: `dist`
- [ ] Node.js version: 22
- [ ] Production environment file has Railway API URL
- [ ] Angular build uses production configuration
- [ ] Custom domain configured

### Post-Deployment

- [ ] API health check responds successfully
- [ ] Frontend loads without errors
- [ ] API calls reach Railway backend (check browser console)
- [ ] Test video/file verification workflow
- [ ] Monitor logs for errors

---

## 🎯 Quick Reference

### Railway API URL
```
https://truwit-starter-template-production.up.railway.app
```

### Cloudflare Pages URL
```
https://truwit.ai
https://truwit-starter-template.pages.dev (default)
```

### Key Commands

**Deploy Frontend Manually:**
```bash
npm run build
wrangler pages deploy ./dist --project-name=truwit-starter-template
```

**Test API Locally:**
```bash
cd api
dotnet run
```

**Test Frontend Locally:**
```bash
npm run dev:both
```

---

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages)
- [yt-dlp Documentation](https://github.com/yt-dlp/yt-dlp)
- [Angular Deployment Guide](https://angular.io/guide/deployment)
- [.NET Docker Guide](https://learn.microsoft.com/en-us/dotnet/core/docker/introduction)

---

## 🆘 Support

If you encounter issues not covered in this guide:

1. Check Railway deployment logs
2. Check Cloudflare Pages build logs
3. Check browser console for frontend errors
4. Review API logs in Railway dashboard
5. Test API endpoints directly using Postman/curl

---

**Last Updated:** October 12, 2025
**Version:** 1.0

