# 🚀 Quick Start: Automated Testing

## What I Created For You

### ✅ **1. Automated Test Suite** (`test-suite.ps1`)
A comprehensive PowerShell script that automatically tests:
- ✅ API health endpoint
- ✅ All URLs from `urlsToTest.txt` (YouTube, TikTok, etc.)
- ✅ File upload with `sample.mp4`
- ✅ Docker container diagnostics
- ✅ Detailed logging and reporting

### ✅ **2. Test Data** (`app/src/testFiles/`)
- **`urlsToTest.txt`** - 3 real URLs to test (2 YouTube, 1 TikTok)
- **`sample.mp4`** - 4.1 MB video file for upload testing

### ✅ **3. Quick Test Scripts**
- **`start.bat`** - Starts everything + runs tests automatically
- **`test-production.bat`** - Tests your live Railway deployment
- **`stop.bat`** - Stops all services cleanly

### ✅ **4. Documentation**
- **`TESTING-GUIDE.md`** - Complete testing documentation
- **`README-DEVELOPMENT.md`** - Development workflow guide
- **`DEPLOYMENT.md`** - Railway & Cloudflare deployment

---

## 🎯 How To Use (30 Seconds)

### Test Local Environment

```batch
start.bat
```

**That's it!** The script will:
1. Start Docker API container
2. Start Angular dev server
3. Run all automated tests
4. Show you a detailed report

---

### Test Production Environment

```batch
test-production.bat
```

Tests your live Railway + Cloudflare deployment.

---

## 📊 What The Results Mean

### 🎉 Perfect Result
```
🎉 100% ALL TESTS PASSED! Application is working perfectly!
🚀 Ready for production deployment!
```
**Meaning**: Everything works! Safe to deploy.

---

### ⚠️ YouTube Warning (Expected)
```
⚠️ YouTube requires authentication cookies
ℹ️  This is expected behavior for YouTube videos without cookies
```
**Meaning**: App works, but YouTube needs cookies for some videos. This is **normal**.

**To fix:** See "YouTube Cookie Configuration" in `DEPLOYMENT.md`

---

### ❌ Failure
```
⛔ TESTS FAILED - Application has issues that need fixing
```
**Meaning**: Something's broken. Check the error details above.

**Common fixes:**
- Restart Docker Desktop
- Run `stop.bat` then `start.bat`
- Check Docker logs: `docker-compose -f api/docker-compose.yml logs`

---

## 📝 Understanding The Tests

### Test 1: Docker Container Health
- Checks if API container is running
- **Local only** (skipped in production)

### Test 2: API Health Endpoint
- Tests `GET /health`
- Verifies API is responding

### Test 3-5: URL Processing
For each URL in `urlsToTest.txt`:
- Sends URL to API
- Downloads video with `yt-dlp`
- Analyzes for C2PA metadata
- Returns proof ID and analysis

**Current test URLs:**
1. `https://youtu.be/NH2_-4iZEn8` - YouTube video
2. `https://youtube.com/shorts/9tr7R1aFqws` - YouTube Shorts
3. `https://www.tiktok.com/@toptierlives/video/7555756163036433677` - TikTok

### Test 6: File Upload
- Uploads `sample.mp4` (4.1 MB)
- Processes uploaded file
- Returns proof ID and analysis

---

## 🔧 Adding Your Own Tests

### Add More URLs

Edit `app/src/testFiles/urlsToTest.txt`:

```
// Your comment
https://your-video-url.com
https://another-video-url.com
```

### Add More Files

1. Copy your video to `app/src/testFiles/`
2. Update `test-suite.ps1` line 24:
   ```powershell
   $script:SampleVideo = Join-Path $TestFilesDir "your-video.mp4"
   ```

---

## 🐛 Troubleshooting

### "Docker container is not running"

**Fix:**
```batch
cd api
docker-compose up --build
```

Wait for: `Now listening on: http://0.0.0.0:8080`

---

### "YouTube Sign in to confirm you're not a bot"

This is **expected**. YouTube requires cookies for some videos.

**Quick fix**: Test with non-YouTube URLs or see `DEPLOYMENT.md` for cookie configuration.

---

### Tests fail but app works in browser

**Check:**
1. Is Docker running? `docker ps`
2. Is API responding? Visit: http://localhost:5000/health
3. Check logs: `docker-compose -f api/docker-compose.yml logs`

---

## 📋 Pre-Deployment Checklist

Before deploying to production:

```batch
start.bat
```

Verify:
- [ ] ✅ API health test passes
- [ ] ✅ At least 1 URL processes successfully
- [ ] ✅ File upload works
- [ ] ⚠️ YouTube warnings are okay (expected)

**If all pass → Deploy with confidence!**

---

## 🚀 Your Next Steps

### Right Now:

1. **Run the tests:**
   ```batch
   start.bat
   ```

2. **Watch the results** - You should see:
   - Docker container building (~1-2 min first time)
   - API starting
   - Angular starting
   - Tests running automatically
   - Detailed report at the end

3. **Check the log file:**
   - Look for `test-results-YYYYMMDD-HHMMSS.log`
   - Contains full test transcript

### After Local Tests Pass:

4. **Test production:**
   ```batch
   test-production.bat
   ```

5. **Compare results** - Local and production should match!

---

## 💡 Pro Tips

1. **First run takes longer** (~2-3 min) - Docker builds the image
2. **Subsequent runs are faster** (~30 sec) - Uses cached Docker image
3. **YouTube warnings are normal** - Don't worry about them
4. **Check logs if something fails** - `test-results-*.log` has details
5. **Production parity** - If it works locally in Docker, it works on Railway!

---

## 📚 Full Documentation

- **Testing:** `TESTING-GUIDE.md` - Complete testing documentation
- **Development:** `README-DEVELOPMENT.md` - Development workflow
- **Deployment:** `DEPLOYMENT.md` - Railway & Cloudflare setup
- **Docker:** `api/README-DOCKER.md` - Docker-specific info

---

## 🆘 Need Help?

### Check Diagnostics

The test suite shows:
- yt-dlp version
- ffmpeg version
- Temp directory status
- Recent container logs

### View Live Logs

```powershell
docker-compose -f api/docker-compose.yml logs -f
```

### Get Into Container

```powershell
docker-compose -f api/docker-compose.yml exec api /bin/bash
```

---

## 🎉 Summary

**You now have:**
- ✅ Automated testing for all critical functionality
- ✅ Real test data (URLs + video file)
- ✅ Local Docker environment (production parity)
- ✅ Production testing scripts
- ✅ Detailed logs and diagnostics

**To get started:**

```batch
start.bat
```

**That's it! The tests will run automatically and show you exactly what's working! 🚀**

