# 🧪 Professional Testing Guide

This guide explains how to properly test the Truwit application locally and in production using Docker and automated tests.

---

## 🎯 Philosophy: Test Like Production

**Key Principle:** If you test on Windows but deploy on Linux, you WILL have problems.

This is why we use Docker locally:
- ✅ Same Linux environment as Railway production
- ✅ Catches path issues (`C:\temp` vs `/tmp`)
- ✅ Catches missing dependencies
- ✅ No "works on my machine" syndrome

---

## 🚀 Quick Start

### 1. Start Everything (One Command)

```bash
start.bat
```

This will:
1. ✅ Check prerequisites (Docker, Node.js)
2. ✅ Clean up existing services
3. ✅ Install dependencies
4. ✅ Start API in Docker (Linux environment)
5. ✅ Start Angular dev server
6. ✅ Run automated tests

### 2. Stop Everything (One Command)

```bash
stop.bat
```

This will:
1. ✅ Stop Angular dev server
2. ✅ Stop Docker containers
3. ✅ Clean up processes

---

## 🧪 Automated Test Suite

### Local Testing

```powershell
# Test local Docker environment
.\test-suite.ps1
```

### Production Testing

```powershell
# Test Railway production deployment
.\test-suite.ps1 -ProductionTest
```

### What Gets Tested

#### Test 1: Docker Container Health
- ✅ Container is running
- ✅ Container state is healthy
- ❌ Shows container logs if failing

#### Test 2: API Health Endpoint
- ✅ API responds on `/health`
- ✅ Returns 200 status
- ❌ Shows Docker logs if failing

#### Test 3: Direct Video URL Processing
- ✅ API can download and process direct video URLs
- ✅ Creates proof successfully
- ❌ Diagnoses path issues, yt-dlp problems

#### Test 4: TikTok/Social Media URL Processing
- ✅ API processes social media URLs
- ⚠️  May require cookies (expected)
- ❌ Diagnoses authentication issues

#### Test 5: Frontend Accessibility
- ✅ Frontend loads correctly
- ✅ Contains expected content

#### Test 6: Frontend API Configuration
- ✅ Frontend uses correct API URL
- ⚠️  Warns if pointing to wrong environment

#### Diagnostics
- ✅ Checks yt-dlp installation in container
- ✅ Checks ffmpeg installation in container
- ✅ Checks temp directory exists and is writable
- ✅ Captures recent container logs

---

## 📊 Test Output

### Success Output

```
========================================
  Test Summary
========================================

Total Tests: 6
✓ Passed: 6
✗ Failed: 0
⚠ Warnings: 0

Pass Rate: 100%

🎉 ALL TESTS PASSED! Application is working perfectly!
```

### Failure Output with Diagnosis

```
✗ FAILED - Direct video URL processing failed (Status: 500)
Error: Specified method is not supported

⚠ DIAGNOSIS: Path or method not supported on Linux
ℹ This usually means Windows-specific code is running on Linux

Troubleshooting Recommendations:
1. Check Docker logs:
   docker-compose -f api/docker-compose.yml logs -f
2. Check appsettings.json for correct configuration
   - TempDir should be /tmp/truwit_dl, not C:\temp\...
```

---

## 🐳 Docker Local Development

### Why Docker Locally?

| Without Docker | With Docker |
|---------------|-------------|
| ❌ Test on Windows | ✅ Test on Linux (production) |
| ❌ Path issues not caught | ✅ Path issues caught immediately |
| ❌ Missing deps in production | ✅ Missing deps caught locally |
| ❌ "Works on my machine" | ✅ Works everywhere |

### Commands

```bash
# Start API in Docker
cd api
docker-compose up --build

# View logs
docker-compose logs -f

# Check if yt-dlp works
docker-compose exec api yt-dlp --version

# Check temp directory
docker-compose exec api ls -la /tmp/truwit_dl

# Stop
docker-compose down
```

---

## 🔍 Diagnostic Tools

### Check Docker Container Status

```bash
cd api
docker-compose ps
```

### View Live Logs

```bash
cd api
docker-compose logs -f api
```

### Execute Commands in Container

```bash
cd api

# Check yt-dlp
docker-compose exec api yt-dlp --version

# Check ffmpeg
docker-compose exec api ffmpeg -version

# Check temp directory permissions
docker-compose exec api ls -la /tmp/

# Open shell in container
docker-compose exec api /bin/bash
```

### Test API Endpoints Manually

```bash
# Health check
curl http://localhost:5000/health

# Create proof from URL
curl -X POST http://localhost:5000/v1/proofs \
  -H "Content-Type: application/json" \
  -d '{
    "input": {"url": "https://example.com/video.mp4"},
    "declared": {
      "generator": "Test",
      "prompt": "Test",
      "license": "public"
    }
  }'
```

---

## 📝 Test Logs

All tests generate detailed logs:

```
test-results-YYYYMMDD-HHmmss.log
```

These logs include:
- Complete test output
- API responses
- Error messages
- Diagnostic information
- Docker container logs (if applicable)

---

## 🔄 Development Workflow

### Recommended Workflow

```
1. Make code changes
2. Run: start.bat
3. Review test results
4. If tests pass → Commit changes
5. Deploy to Railway
6. Run: test-suite.ps1 -ProductionTest
7. If production tests pass → Success!
```

### If Tests Fail Locally

```
1. Check test output for diagnosis
2. Review Docker logs: docker-compose -f api/docker-compose.yml logs
3. Fix issues
4. Rebuild: docker-compose down && docker-compose up --build
5. Rerun tests: .\test-suite.ps1
```

### If Tests Pass Locally but Fail in Production

```
1. Check Railway deployment logs
2. Compare local vs production configuration
3. Verify environment variables in Railway
4. Check Railway Root Directory setting (should be 'api')
5. Verify Dockerfile is being used (not Nixpacks)
```

---

## 🎓 Understanding Test Results

### Exit Codes

- `0` - All tests passed
- `1` - One or more tests failed

### Test Status Symbols

- `✓` - Test passed (green)
- `✗` - Test failed (red)
- `⚠` - Warning (yellow)
- `ℹ` - Information (cyan)

### Common Warnings

**"TikTok requires authentication (expected behavior)"**
- Not a bug
- TikTok/YouTube require cookies for yt-dlp
- See `DEPLOYMENT.md` for cookie configuration

**"Frontend may not be using correct API URL"**
- Check `app/src/environments/environment.prod.ts`
- Verify `angular.json` has `fileReplacements` configured
- Rebuild frontend: `cd app && npm run build`

---

## 🚨 Common Issues and Solutions

### Issue 1: Docker not running

**Error:**
```
ERROR: Docker is not running. Please start Docker Desktop
```

**Solution:**
1. Open Docker Desktop
2. Wait for it to fully start
3. Run `start.bat` again

### Issue 2: Port already in use

**Error:**
```
Error response from daemon: Ports are not available
```

**Solution:**
```bash
# Stop all Docker containers
docker-compose -f api/docker-compose.yml down

# Kill processes on port 5000
netstat -ano | findstr :5000
# Find the PID and kill it
taskkill /F /PID [PID]
```

### Issue 3: Container fails to start

**Symptoms:**
- Container exits immediately
- Health check fails

**Solution:**
```bash
# View container logs
cd api
docker-compose logs api

# Rebuild without cache
docker-compose build --no-cache
docker-compose up
```

### Issue 4: "Specified method is not supported"

**Diagnosis:**
- Windows-specific code running on Linux
- Usually a path issue

**Solution:**
1. Check `api/appsettings.json`
2. Ensure all paths use Linux format:
   - ✅ `/tmp/truwit_dl`
   - ❌ `C:\temp\truwit_dl`
3. Rebuild and test

### Issue 5: yt-dlp fails

**Symptoms:**
```
ERROR: [youtube] Sign in to confirm you're not a bot
```

**Diagnosis:**
- YouTube/TikTok require authentication
- Expected behavior for protected content

**Solutions:**
1. **Use direct video URLs for testing**
   ```
   https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4
   ```

2. **Configure cookies for YouTube** (see `DEPLOYMENT.md`)

3. **Use file upload instead of URLs**

---

## 📈 Continuous Improvement

### Adding New Tests

Edit `test-suite.ps1` and add new test sections:

```powershell
Write-Section "Test 7: Your New Test"

try {
    # Your test code here
    Write-Success "Test passed"
    $Passed++
} catch {
    Write-Failure "Test failed"
    $Failed++
}
```

### Integrating with CI/CD

See `api/README-DOCKER.md` for GitHub Actions example.

---

## 🎯 Best Practices

1. ✅ **Always test in Docker before committing**
2. ✅ **Run automated tests after every change**
3. ✅ **Review test logs when tests fail**
4. ✅ **Test production after deploying**
5. ✅ **Keep Docker images updated**
6. ✅ **Clean up Docker resources regularly**

```bash
# Clean up unused Docker resources
docker system prune -a
```

---

## 📚 Additional Resources

- **Docker Development Guide:** `api/README-DOCKER.md`
- **Deployment Guide:** `DEPLOYMENT.md`
- **API Tests:** `api/test-api.ps1` and `api/test-api.sh`
- **Docker Compose:** `api/docker-compose.yml`

---

## 🆘 Getting Help

### Check These First

1. Test logs: `test-results-*.log`
2. Docker logs: `docker-compose -f api/docker-compose.yml logs`
3. Railway logs: Railway Dashboard → Deployments → Logs
4. Browser console: F12 → Console tab

### Diagnostic Commands

```bash
# Complete system check
.\test-suite.ps1

# Docker status
docker ps
docker-compose -f api/docker-compose.yml ps

# Container inspection
docker-compose -f api/docker-compose.yml exec api /bin/bash

# Health check
curl http://localhost:5000/health
```

---

**Remember:** Testing locally in Docker is not optional. It's the ONLY way to ensure your code will work in production.

**"If it works in Docker locally, it will work in production."** ✅

