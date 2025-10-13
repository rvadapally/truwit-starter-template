# YouTube Cookies Guide - User-Supplied Authentication

## 🎯 **Why Do I Need This?**

YouTube frequently marks automated downloads as "bot activity" and requires authentication. Instead of storing YouTube credentials on our servers, **you can provide your own cookies** when verifying YouTube videos.

---

## 📋 **When You Need Cookies:**

- ✅ **Age-restricted videos**
- ✅ **Private/unlisted videos you have access to**
- ✅ **Videos behind "Sign in to confirm you're not a bot" warnings**
- ❌ **Public videos** (cookies not needed)

---

## 🔧 **How to Export Your YouTube Cookies**

### **Option 1: Using Browser Extension (Easiest)**

#### **Chrome/Edge:**
1. Install [Get cookies.txt LOCALLY](https://chrome.google.com/webstore/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc)
2. Go to [youtube.com](https://youtube.com) and **make sure you're logged in**
3. Click the extension icon
4. Click **"Export"**
5. Save the file

#### **Firefox:**
1. Install [cookies.txt](https://addons.mozilla.org/en-US/firefox/addon/cookies-txt/)
2. Go to [youtube.com](https://youtube.com) and **make sure you're logged in**
3. Click the extension icon
4. Click **"Export Cookies"**
5. Save the file

---

### **Option 2: Manual Export (Advanced)**

If you prefer not to use extensions:

1. Open YouTube in your browser and **log in**
2. Open **Developer Tools** (F12)
3. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
4. Expand **Cookies** → `https://www.youtube.com`
5. Look for these important cookies and copy their values:
   - `LOGIN_INFO`
   - `SSID`
   - `SAPISID`
   - `APISID`
   - `HSID`
   - `SID`

6. **Format them as Netscape cookies:**

```
# Netscape HTTP Cookie File
.youtube.com	TRUE	/	TRUE	1234567890	LOGIN_INFO	your_value_here
.youtube.com	TRUE	/	TRUE	1234567890	SSID	your_value_here
.youtube.com	TRUE	/	TRUE	1234567890	SAPISID	your_value_here
# ... (add all cookies)
```

---

## 🚀 **How to Use Cookies with Truwit API**

### **Method 1: Direct API Call**

```bash
curl -X POST "https://truwit-starter-template-production.up.railway.app/v1/proofs/url" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://youtu.be/YOUR_VIDEO_ID",
    "userCookies": "# Netscape HTTP Cookie File\n.youtube.com\tTRUE\t/\tTRUE\t...\n"
  }'
```

### **Method 2: PowerShell**

```powershell
# Read cookies from file
$cookies = Get-Content "path\to\cookies.txt" -Raw

# Create request
$body = @{
    url = "https://youtu.be/K7uZuy41wlQ"
    userCookies = $cookies
} | ConvertTo-Json

# Send request
$response = Invoke-RestMethod `
    -Uri "https://truwit-starter-template-production.up.railway.app/v1/proofs/url" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"

Write-Host "✅ Trustmark: $($response.trustmarkId)"
```

### **Method 3: JavaScript (Frontend)**

```javascript
// User uploads cookies.txt file
const fileInput = document.querySelector('#cookiesFile');
const file = fileInput.files[0];
const userCookies = await file.text();

// Send request
const response = await fetch('https://truwit-starter-template-production.up.railway.app/v1/proofs/url', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://youtu.be/VIDEO_ID',
    userCookies: userCookies  // Cookies file content
  })
});

const result = await response.json();
console.log('Trustmark:', result.trustmarkId);
```

---

## 🔒 **Security & Privacy**

### **What Happens to Your Cookies?**

1. ✅ Cookies are **only stored temporarily** (for the duration of the download)
2. ✅ Cookies are **automatically deleted** after the video is processed
3. ✅ Cookies are **never logged** or stored in our database
4. ✅ Each request uses its own temporary file

### **Best Practices:**

- 🔐 **Use a dedicated YouTube account** (not your main account)
- ⏰ **Cookies expire** after a few hours/days (you'll need to refresh them)
- 🚫 **Don't share cookies** with untrusted services
- 🔄 **Refresh cookies regularly** if you use Truwit often

---

## ⚠️ **Important Notes**

1. **Cookie Expiration:**
   - YouTube cookies typically expire after **a few hours to a few days**
   - You'll see "Sign in to confirm you're not a bot" errors when they expire
   - Simply export fresh cookies and try again

2. **Account Safety:**
   - We recommend creating a **separate YouTube account** for Truwit
   - Enable **2FA** on your main account
   - Never provide cookies to untrusted websites

3. **Compliance:**
   - Only verify videos **you have rights to**
   - Respect YouTube's Terms of Service
   - Don't use this for downloading copyrighted content without permission

---

## 🧪 **Testing Your Cookies**

### **Quick Test Script:**

Save this as `test-youtube-cookies.ps1`:

```powershell
# Test YouTube cookies with Truwit API

$cookiesFile = "C:\path\to\your\cookies.txt"
$testUrl = "https://youtu.be/K7uZuy41wlQ"

if (!(Test-Path $cookiesFile)) {
    Write-Host "❌ Cookies file not found: $cookiesFile" -ForegroundColor Red
    exit
}

$cookies = Get-Content $cookiesFile -Raw

Write-Host "🧪 Testing YouTube cookies..." -ForegroundColor Cyan

try {
    $body = @{
        url = $testUrl
        userCookies = $cookies
    } | ConvertTo-Json

    $response = Invoke-RestMethod `
        -Uri "https://truwit-starter-template-production.up.railway.app/v1/proofs/url" `
        -Method Post `
        -Body $body `
        -ContentType "application/json"

    Write-Host "✅ SUCCESS! Cookies are working!" -ForegroundColor Green
    Write-Host "   Trustmark: $($response.trustmarkId)" -ForegroundColor Gray
    Write-Host "   View proof: https://www.truwit.ai/verify/$($response.trustmarkId)" -ForegroundColor Cyan
}
catch {
    Write-Host "❌ FAILED: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Your cookies may have expired. Try exporting fresh ones." -ForegroundColor Yellow
}
```

Run it:
```powershell
powershell -ExecutionPolicy Bypass -File test-youtube-cookies.ps1
```

---

## 📚 **FAQ**

**Q: How long do cookies last?**  
A: Usually 1-7 days, depending on YouTube's security measures. They can expire sooner if YouTube detects unusual activity.

**Q: Can I reuse the same cookies for multiple videos?**  
A: Yes! The same cookies file can be used for multiple requests until they expire.

**Q: Why are my cookies expiring so fast?**  
A: YouTube rotates cookies aggressively if it detects bot-like behavior. Try:
- Using a real browser session before exporting
- Watching a video or two before exporting cookies
- Using a dedicated account instead of your main one

**Q: Is this safe?**  
A: Yes, if you follow best practices:
- Use a dedicated account
- Only provide cookies to trusted services (like Truwit)
- Cookies are deleted immediately after use

**Q: What if I don't want to provide cookies?**  
A: Public YouTube videos don't require cookies. Only age-restricted, private, or bot-flagged videos need authentication.

---

## 🆘 **Troubleshooting**

### **Error: "Sign in to confirm you're not a bot"**
→ Your cookies have expired. Export fresh ones.

### **Error: "Invalid cookie format"**
→ Make sure you're using the **Netscape format** (not JSON). Browser extensions handle this automatically.

### **Error: "Download failed"**
→ The video might be:
- Deleted or private (and you don't have access)
- Region-locked
- Behind stricter authentication

### **Cookies work in browser but not in Truwit**
→ Try these steps:
1. Clear your browser cookies
2. Log out and log back in to YouTube
3. Watch a video to "warm up" the session
4. Export cookies again

---

## 📞 **Need Help?**

If you're having trouble:
1. Check the troubleshooting section above
2. Test your cookies with the test script
3. Try exporting fresh cookies
4. Verify you're using the Netscape format

---

**Happy verifying! 🎬✅**

