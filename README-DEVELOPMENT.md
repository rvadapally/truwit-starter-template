# 🚀 Truwit Development Guide

**Professional development workflow with Docker, automated testing, and production parity.**

---

## ⚡ Quick Start (60 seconds)

```bash
# 1. Start Docker Desktop (if not running)

# 2. Start everything
start.bat

# 3. Tests run automatically!
```

That's it! The script will:
- ✅ Start API in Docker (Linux environment)
- ✅ Start Angular dev server  
- ✅ Run automated tests
- ✅ Open the app in your browser

---

## 📁 Project Structure

```
humanproof-starter/
├── api/                       # .NET API (runs in Docker)
│   ├── Dockerfile             # Production-ready container
│   ├── docker-compose.yml     # Local development
│   ├── appsettings.json       # Configuration
│   ├── test-api.ps1           # API-only tests
│   └── README-DOCKER.md       # Docker guide
├── app/                       # Angular frontend
│   ├── src/
│   │   ├── environments/      # Environment config
│   │   └── app/               # Angular code
│   ├── angular.json
│   └── package.json
├── start.bat                  # 🚀 START HERE
├── stop.bat                   # Stop all services
├── test-suite.ps1             # 🧪 Automated test suite
├── TESTING-GUIDE.md           # Complete testing docs
├── DEPLOYMENT.md              # Railway & Cloudflare deploy
└── README-DEVELOPMENT.md      # This file
```

---

## 🎯 Core Philosophy

### Why Docker Locally?

**Problem:**
- ❌ Code works on Windows dev machine
- ❌ Deploys to Linux (Railway)
- ❌ Fails in production with cryptic errors

**Solution:**
- ✅ Run API in Docker locally (Linux)
- ✅ Catch platform issues before commit
- ✅ **What works locally WILL work in production**

### The Workflow

```
┌─────────────────────────────────────────────────────────┐
│  1. DEVELOP                                             │
│     - Make changes to code                              │
│     - API runs in Docker (Linux)                        │
│     - Frontend runs normally                            │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  2. TEST (Automated)                                    │
│     ✓ Container health                                  │
│     ✓ API endpoints                                     │
│     ✓ Video processing                                  │
│     ✓ Frontend accessibility                            │
│     ✓ Environment configuration                         │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  3. DIAGNOSE (If tests fail)                            │
│     - Captures Docker logs                              │
│     - Identifies issues (paths, deps, config)           │
│     - Provides fix recommendations                      │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  4. DEPLOY                                              │
│     - Commit to Git                                     │
│     - Railway auto-deploys                              │
│     - Run: test-suite.ps1 -ProductionTest               │
└─────────────────────────────────────────────────────────┘
```

---

## 🎮 Commands

### Start & Stop

```bash
# Start everything
start.bat

# Stop everything
stop.bat
```

### Testing

```bash
# Test local (Docker)
.\test-suite.ps1

# Test production
.\test-suite.ps1 -ProductionTest

# Test API only
cd api
.\test-api.ps1 http://localhost:5000
```

### Docker Management

```bash
cd api

# View logs
docker-compose logs -f

# Rebuild
docker-compose down
docker-compose up --build

# Shell access
docker-compose exec api /bin/bash

# Check tools in container
docker-compose exec api yt-dlp --version
docker-compose exec api ffmpeg -version
```

---

## 📊 Test Results

### ✅ Success
```
========================================
  Test Summary
========================================

Total Tests: 6
✓ Passed: 6
✗ Failed: 0

Pass Rate: 100%

🎉 ALL TESTS PASSED!
```

### ❌ Failure with Diagnosis
```
✗ FAILED - API error: yt-dlp or path configuration issue

⚠ DIAGNOSIS: Temp directory configuration issue
ℹ Check appsettings.json - TempDir should be /tmp/truwit_dl

Troubleshooting:
1. docker-compose logs -f
2. Check appsettings.json paths
3. Rebuild: docker-compose up --build
```

---

## 🔧 Configuration

### API Configuration (`api/appsettings.json`)

**Critical Settings:**

```json
{
  "Downloader": {
    "TempDir": "/tmp/truwit_dl"  // ✅ Linux path
    // NOT "C:\\temp\\..." ❌
  }
}
```

### Frontend Configuration

**Development:** `app/src/environments/environment.ts`
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000'  // Local Docker API
};
```

**Production:** `app/src/environments/environment.prod.ts`
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://truwit-starter-template-production.up.railway.app'
};
```

---

## 🐛 Troubleshooting

### Docker not running

```
ERROR: Docker is not running
```

**Fix:** Open Docker Desktop and wait for it to start

### Port already in use

```
Error: Port 5000 is already allocated
```

**Fix:**
```bash
docker-compose -f api/docker-compose.yml down
netstat -ano | findstr :5000
taskkill /F /PID [PID]
```

### "Specified method is not supported"

**Cause:** Windows-specific code (usually paths)

**Fix:**
1. Check `appsettings.json` for Windows paths (`C:\...`)
2. Change to Linux paths (`/tmp/...`)
3. Rebuild: `docker-compose up --build`

### yt-dlp fails

```
ERROR: Sign in to confirm you're not a bot
```

**Cause:** YouTube/TikTok require authentication

**Fix Options:**
1. Use direct video URLs for testing
2. Configure cookies (see `DEPLOYMENT.md`)
3. Use file upload instead

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **TESTING-GUIDE.md** | Complete testing documentation |
| **DEPLOYMENT.md** | Railway & Cloudflare deployment |
| **api/README-DOCKER.md** | Docker development details |
| **README-DEVELOPMENT.md** | This file - development overview |

---

## 🎓 Common Tasks

### Add a New API Endpoint

1. Add endpoint to `api/Controllers/`
2. Test locally: `start.bat`
3. If tests pass → commit
4. Deploy to Railway
5. Test production: `.\test-suite.ps1 -ProductionTest`

### Change API Configuration

1. Edit `api/appsettings.json`
2. **Use Linux paths** (`/tmp/...` not `C:\...`)
3. Rebuild: `docker-compose down && docker-compose up --build`
4. Run tests: `.\test-suite.ps1`
5. If pass → commit

### Update Frontend API URL

1. Edit `app/src/environments/environment.prod.ts`
2. Edit `app/src/environments/environment.ts` (if needed)
3. Verify `app/angular.json` has `fileReplacements`
4. Build: `cd app && npm run build`
5. Test: `.\test-suite.ps1`
6. Deploy to Cloudflare

### Debug Production Issue

```bash
# 1. Test production
.\test-suite.ps1 -ProductionTest

# 2. Check Railway logs
# Go to Railway Dashboard → Logs

# 3. Compare with local
.\test-suite.ps1

# 4. Check configuration differences
# - Environment variables
# - API URLs
# - File paths
```

---

## 🚀 Deployment Workflow

### Local → Production

```bash
# 1. Test locally
start.bat
# Wait for automated tests to complete

# 2. If tests pass, commit
git add .
git commit -m "Your changes"
git push origin main

# 3. Railway auto-deploys
# Monitor at: railway.app

# 4. Test production
.\test-suite.ps1 -ProductionTest

# 5. If production tests pass → SUCCESS! 🎉
```

---

## ⚙️ Advanced

### Custom Test Scenarios

Edit `test-suite.ps1`:

```powershell
Write-Section "Test 7: Your Custom Test"

try {
    $response = Invoke-WebRequest -Uri "$ApiUrl/your-endpoint"
    
    if ($response.StatusCode -eq 200) {
        Write-Success "Custom test passed"
        $Passed++
    }
} catch {
    Write-Failure "Custom test failed"
    $Failed++
}
```

### CI/CD Integration

See `api/README-DOCKER.md` for GitHub Actions examples.

### Performance Testing

```bash
# Install Apache Bench
# Test API performance
ab -n 1000 -c 10 http://localhost:5000/health
```

---

## 📈 Metrics

### Test Coverage

- ✅ Container health
- ✅ API endpoints
- ✅ Video processing
- ✅ Frontend loading
- ✅ Environment config
- ✅ Dependencies (yt-dlp, ffmpeg)

### What's NOT Tested (Yet)

- ⏳ File upload endpoints
- ⏳ C2PA verification
- ⏳ Database operations
- ⏳ Frontend E2E (Playwright)

**PRs welcome!**

---

## 🎯 Best Practices

1. ✅ **Always run `start.bat` before development**
   - Ensures Docker is running
   - Catches config issues early

2. ✅ **Review test output**
   - Don't ignore warnings
   - Fix issues immediately

3. ✅ **Test in Docker, not directly with `dotnet run`**
   - Windows != Linux
   - Paths, line endings, dependencies differ

4. ✅ **Test production after deploy**
   - Auto-deployment doesn't mean auto-success
   - Always run production tests

5. ✅ **Keep Docker clean**
   ```bash
   docker system prune -a
   ```

---

## 🎉 Success Checklist

Before claiming "it works":

- [ ] `start.bat` completes successfully
- [ ] All automated tests pass locally
- [ ] Docker logs show no errors
- [ ] Frontend loads and connects to API
- [ ] Code committed and pushed
- [ ] Railway deployment succeeds
- [ ] Production tests pass: `.\test-suite.ps1 -ProductionTest`
- [ ] Tested actual user workflow (upload/URL verification)

**Only when ALL boxes are checked can you claim success!** ✅

---

## 🆘 Getting Help

### Diagnostic Steps

1. Check test logs: `test-results-*.log`
2. Check Docker logs: `docker-compose -f api/docker-compose.yml logs`
3. Check Railway logs: Railway Dashboard
4. Check browser console: F12
5. Review configuration files
6. Compare local vs production

### Still Stuck?

Run the diagnostic:

```bash
# Full diagnostic output
.\test-suite.ps1 | Tee-Object diagnostic.txt

# Share diagnostic.txt with team
```

---

## 📞 Support

- **Testing Issues:** See `TESTING-GUIDE.md`
- **Deployment Issues:** See `DEPLOYMENT.md`
- **Docker Issues:** See `api/README-DOCKER.md`

---

**Built with professional standards.**
**Tested before claiming success.**
**Docker ensures production parity.**

✅ **Now go build something awesome!**

