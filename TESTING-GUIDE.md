# 🧪 Truwit Automated Testing Guide

## Overview

This guide explains how to use the automated test suite to verify the Truwit Verification App's critical functionality in both local and production environments.

---

## 📁 Test Files

All test files are located in `app/src/testFiles/`:

- **`urlsToTest.txt`** - List of URLs to test (YouTube, TikTok, etc.)
- **`sample.mp4`** - Sample video file for upload testing (4.1 MB)

### Adding Test URLs

Edit `app/src/testFiles/urlsToTest.txt`:

```
// Comments start with //
https://youtu.be/NH2_-4iZEn8
https://youtube.com/shorts/9tr7R1aFqws
https://www.tiktok.com/@toptierlives/video/7555756163036433677
```

---

## 🚀 Running Tests

### Method 1: Test Local Environment (Recommended)

Tests your local Docker setup that mirrors production:

```batch
start.bat
```

**What it does:**
1. ✅ Checks Docker and Node.js prerequisites
2. 🧹 Cleans up existing services
3. 📦 Installs Angular dependencies
4. 🐳 Starts API in Docker container
5. 🌐 Starts Angular dev server
6. 🧪 **Runs automated tests**

**Wait times:**
- API startup: ~15 seconds
- Angular startup: ~10 seconds
- Then tests run automatically

---

### Method 2: Test Production Environment

Tests your live Railway and Cloudflare deployment:

```batch
test-production.bat
```

**Or manually:**

```powershell
powershell -ExecutionPolicy Bypass -File test-suite.ps1 -Environment production
```

---

### Method 3: Manual Testing

Run tests manually with options:

```powershell
# Test local with verbose output
powershell -ExecutionPolicy Bypass -File test-suite.ps1 -Verbose

# Test production with verbose output
powershell -ExecutionPolicy Bypass -File test-suite.ps1 -Environment production -Verbose
```

---

## 🧪 What Gets Tested

### Test 1: Docker Container Health ✅
- **Local only** - Verifies Docker container is running
- Checks API container status

### Test 2: API Health Endpoint ✅
- Tests `/health` endpoint
- Verifies API is responding
- Expected: `200 OK`

### Test 3-5: URL Processing Tests 🔗
For each URL in `urlsToTest.txt`:
- Sends URL to `/v1/proofs` endpoint
- Downloads video with `yt-dlp`
- Analyzes video for C2PA metadata
- Returns proof ID and analysis

**Expected results:**
- ✅ **Success**: Proof created, video analyzed
- ⚠️ **Warning**: YouTube authentication needed (cookies required)
- ❌ **Failure**: API error or timeout

### Test 6: File Upload Test 📤
- Uploads `sample.mp4` to `/v1/proofs`
- Processes uploaded file
- Returns proof ID and analysis

**Expected**: `200 OK` or `201 Created`

---

## 📊 Understanding Test Results

### ✅ Perfect Result (100% Pass)
```
🎉 100% ALL TESTS PASSED! Application is working perfectly!
🚀 Ready for production deployment!
```

**What this means:**
- All endpoints working
- Video processing functional
- File uploads working
- No warnings or errors

---

### ⚠️ Warning Result (Passed with Warnings)
```
✅ All critical tests passed with 1 warning(s)
ℹ️  Warnings are typically non-blocking (e.g., YouTube authentication)
```

**Common warnings:**
1. **YouTube Bot Protection**
   ```
   ⚠️  YouTube requires authentication cookies
   ```
   **Solution**: Configure YouTube cookies (see below)

2. **TikTok Access Issues**
   ```
   ⚠️  TikTok requires specific user agent
   ```
   **Solution**: Use direct video URLs or configure `yt-dlp` options

**Action required:**
- Application works but may need configuration for specific platforms
- Non-blocking for most use cases

---

### ❌ Failure Result
```
⛔ TESTS FAILED - Application has issues that need fixing
```

**Common failures:**

1. **API Not Responding**
   ```
   ❌ API health endpoint failed (Status: 0)
   ```
   **Fix**: 
   - Check if Docker container is running: `docker ps`
   - Restart: `stop.bat` then `start.bat`

2. **yt-dlp Missing**
   ```
   ❌ URL processing failed: yt-dlp not found
   ```
   **Fix**: 
   - Rebuild Docker image: `docker-compose -f api/docker-compose.yml up --build`

3. **Database Issues**
   ```
   ❌ Database error
   ```
   **Fix**:
   - Check API logs: `docker-compose -f api/docker-compose.yml logs`

---

## 🔧 Advanced Testing

### Verbose Mode

Get detailed output for debugging:

```powershell
powershell -ExecutionPolicy Bypass -File test-suite.ps1 -Verbose
```

**Shows:**
- Full API requests/responses
- HTTP headers
- Detailed error messages
- Container diagnostics

---

### Test Logs

Every test run creates a log file:

```
test-results-YYYYMMDD-HHMMSS.log
```

**Contains:**
- Complete test transcript
- All console output
- Timestamps
- Error details

**View logs:**
```powershell
# View latest log
Get-Content (Get-ChildItem test-results-*.log | Sort-Object LastWriteTime -Descending | Select-Object -First 1).Name
```

---

## 🐛 Troubleshooting

### Issue: "Docker container is not running"

**Solution:**
```batch
cd api
docker-compose up --build
```

Wait for: `Now listening on: http://0.0.0.0:8080`

---

### Issue: "YouTube Sign in to confirm you're not a bot"

This is **expected behavior** without cookies.

**Solution 1: Use Cookies (Recommended)**

1. Export YouTube cookies:
   ```bash
   yt-dlp --cookies-from-browser chrome --cookies cookies.txt
   ```

2. Update `api/appsettings.json`:
   ```json
   {
     "YtDlp": {
       "CookieFile": "/app/cookies.txt"
     }
   }
   ```

3. Copy cookies to Docker:
   ```dockerfile
   COPY cookies.txt /app/cookies.txt
   ```

**Solution 2: Test with Non-YouTube URLs**

Use direct video URLs or platforms that don't require authentication.

---

### Issue: "File upload timeout"

**Solution:**
- Increase timeout in test script
- Use smaller test files
- Check Docker container resources

---

### Issue: Tests fail but API works in browser

**Solution:**
```powershell
# Test manually
curl http://localhost:5000/health
curl -X POST http://localhost:5000/v1/proofs -H "Content-Type: application/json" -d "{\"url\":\"YOUR_URL\"}"
```

---

## 📋 Pre-Deployment Checklist

Before deploying to production, ensure:

- [ ] ✅ All local tests pass
- [ ] ✅ No critical failures
- [ ] ✅ File upload works
- [ ] ✅ URL processing works (at least one platform)
- [ ] ✅ Health endpoint responds
- [ ] ⚠️ YouTube cookies configured (if testing YouTube)

**Run:**
```batch
start.bat
```

Watch for: `🎉 100% ALL TESTS PASSED!` or `✅ All critical tests passed`

---

## 🚀 Post-Deployment Testing

After deploying to Railway/Cloudflare:

```batch
test-production.bat
```

**Expected:**
- Same results as local tests
- Production parity verified
- If local tests passed, production tests should pass

---

## 📊 Continuous Testing

### Daily Testing

Test production daily to catch issues:

```powershell
# Schedule with Windows Task Scheduler
powershell -ExecutionPolicy Bypass -File test-suite.ps1 -Environment production
```

### CI/CD Integration

Add to your CI/CD pipeline:

```yaml
# Example GitHub Actions
- name: Test Production
  run: powershell -ExecutionPolicy Bypass -File test-suite.ps1 -Environment production
```

---

## 💡 Best Practices

1. **Test Locally First**
   - Always run `start.bat` before deploying
   - Fix failures in local environment

2. **Keep Test Files Updated**
   - Add URLs that represent your use cases
   - Test with various file sizes

3. **Review Logs**
   - Check `test-results-*.log` for issues
   - Keep logs for debugging

4. **Monitor Warnings**
   - Warnings are okay but should be investigated
   - Plan to fix warnings when possible

5. **Production Parity**
   - Local Docker = Production Railway
   - If it works locally, it should work in production

---

## 🆘 Getting Help

### Check Diagnostics

The test suite automatically runs diagnostics:

- ✅ yt-dlp version
- ✅ ffmpeg version  
- ✅ Temp directory permissions
- ✅ Recent container logs

### View Container Logs

```powershell
# Follow logs in real-time
docker-compose -f api/docker-compose.yml logs -f

# View last 100 lines
docker-compose -f api/docker-compose.yml logs --tail=100
```

### Debug Container

```powershell
# Get shell access
docker-compose -f api/docker-compose.yml exec api /bin/bash

# Inside container:
yt-dlp --version
ffmpeg -version
ls -la /tmp/truwit_dl
```

---

## 📝 Summary

| Environment | Command | Duration | Purpose |
|-------------|---------|----------|---------|
| **Local** | `start.bat` | ~2-5 min | Full dev environment + tests |
| **Production** | `test-production.bat` | ~1-3 min | Test live deployment |
| **Verbose** | `test-suite.ps1 -Verbose` | ~2-5 min | Detailed debugging |

**Success criteria:**
- ✅ All tests passed = Ready to deploy
- ⚠️ Warnings only = Safe to deploy (with caveats)
- ❌ Any failures = Fix before deploying

---

**Next Steps:**
1. Run `start.bat` to test locally
2. If tests pass, deploy to Railway/Cloudflare
3. Run `test-production.bat` to verify deployment
4. Monitor logs and test results daily
