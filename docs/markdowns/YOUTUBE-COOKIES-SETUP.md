# YouTube Cookies Setup for Railway

This guide explains how to fix YouTube's "Sign in to confirm you're not a bot" error by adding authentication cookies.

---

## Why This Is Needed

YouTube blocks requests from data centers (where Railway runs) to prevent bots. The solution: Use your browser's YouTube cookies to authenticate yt-dlp.

---

## Quick Setup (3 Steps)

### Step 1: Export Your YouTube Cookies

**Option A: Using Browser Extension (Easiest)**

1. Install **"Get cookies.txt LOCALLY"** extension:
   - Chrome: https://chrome.google.com/webstore/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc
   - Firefox: https://addons.mozilla.org/en-US/firefox/addon/cookies-txt/

2. Go to **youtube.com** and make sure you're **signed in**

3. Click the extension icon → **Export** → Save as `cookies.txt`

**Option B: Using yt-dlp (Command Line)**

If you have yt-dlp installed locally:
```bash
yt-dlp --cookies-from-browser chrome --cookies cookies.txt https://www.youtube.com/watch?v=jNQXAC9IVRw
```

This exports cookies from your Chrome browser to `cookies.txt`.

---

### Step 2: Add Cookies to Railway

**Method 1: Environment Variable (Small cookies file)**

1. Open `cookies.txt` in text editor
2. Copy entire contents
3. Go to Railway dashboard → Your service → Variables
4. Add:
   ```
   Name:  YOUTUBE_COOKIES
   Value: [paste entire cookies.txt content]
   ```
5. Add path variable:
   ```
   Name:  YTDLP_COOKIES
   Value: /app/cookies.txt
   ```

**Method 2: Volume Mount (Recommended)**

Railway doesn't support easy file uploads, so we'll bake it into the Docker image:

1. Copy `cookies.txt` to `api/cookies.txt`
2. Update `api/Dockerfile`:
   ```dockerfile
   # Add after COPY --from=build
   COPY cookies.txt /app/cookies.txt
   RUN chmod 644 /app/cookies.txt
   ```
3. Commit and push

---

### Step 3: Deploy

```bash
git add api/
git commit -m "Add YouTube cookies for bot detection bypass"
git push origin main
```

Railway will rebuild with cookies → YouTube downloads work! ✅

---

## Alternative: Use Cookies from Environment Variable

**Update Dockerfile to create cookies.txt from env var:**

```dockerfile
# After COPY --from=build /app/publish .

# Create cookies file from environment variable if provided
RUN if [ -n "$YOUTUBE_COOKIES" ]; then \
      echo "$YOUTUBE_COOKIES" > /app/cookies.txt && \
      chmod 644 /app/cookies.txt; \
    fi
```

**Then in Railway:**
```
YOUTUBE_COOKIES=[paste cookies.txt content]
YTDLP_COOKIES=/app/cookies.txt
```

---

## Security Notes

⚠️ **Cookie Security:**
- Cookies contain your YouTube session
- Don't commit `cookies.txt` to public repositories
- Add `cookies.txt` to `.gitignore` for private repos
- Cookies expire after ~6 months, need to refresh

**For `.gitignore`:**
```
# YouTube cookies (contains auth tokens)
cookies.txt
api/cookies.txt
```

---

## Testing Cookies Work

**After deploying with cookies:**

```bash
# Test via Railway logs - should see:
"Using cookies from: /app/cookies.txt"
"Successfully downloaded file: ..."
```

**Or test directly:**
```bash
curl -X POST https://truwit-starter-template-production.up.railway.app/v1/proofs/url \
  -H "Content-Type: application/json" \
  -d '{"Url":"https://www.youtube.com/watch?v=K7uZuy41wlQ"}'
```

Should return success instead of bot error!

---

## Troubleshooting

**Problem:** Still getting bot error after adding cookies

**Solutions:**
1. Regenerate cookies (sign out/in to YouTube, export again)
2. Make sure you're signed into YouTube when exporting
3. Check cookies.txt file size (should be ~2-10 KB)
4. Verify `YTDLP_COOKIES` env var points to correct path

---

**Problem:** Cookies expire

**Solution:**
- YouTube cookies last ~6 months
- When downloads start failing again, regenerate and redeploy
- Set a calendar reminder to refresh cookies every 3 months

---

**Problem:** Don't want to use personal YouTube account

**Solution:**
- Create a burner Google/YouTube account
- Sign in with that account
- Export cookies from that session
- Use those cookies in production

---

## Quick Command Reference

```bash
# Export cookies from browser
yt-dlp --cookies-from-browser chrome --cookies cookies.txt https://www.youtube.com

# Test cookies locally
yt-dlp --cookies cookies.txt https://www.youtube.com/watch?v=test

# Add to .gitignore
echo "cookies.txt" >> .gitignore
echo "api/cookies.txt" >> .gitignore
```

---

**Once you add cookies, ALL YouTube videos will work on Railway!** 🎉

