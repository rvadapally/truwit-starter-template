# 🔐 Secrets Storage Guide - Truwit OAuth Configuration

## 📋 **Overview**

This guide will help you securely configure OAuth credentials for Google and Twitter (X) in both local development and production environments.

**Status**: ✅ Twitter/X OAuth configured | ⏳ Google OAuth pending

---

## 🚨 **CRITICAL SECURITY RULES**

1. ❌ **NEVER commit real secrets to Git**
2. ❌ **NEVER push `appsettings.json` with actual credentials**
3. ✅ **ALWAYS use placeholders in `appsettings.json`**
4. ✅ **ALWAYS use User Secrets for local dev**
5. ✅ **ALWAYS use Environment Variables for production**

---

## 📍 **Quick Reference**

| Environment | Storage Method | Location |
|-------------|----------------|----------|
| **Local Dev** | User Secrets | `%APPDATA%\Microsoft\UserSecrets\` |
| **Production** | Environment Variables | Railway Dashboard |
| **Git Repository** | Placeholders only | `api/appsettings.json` |

---

## 🛠️ **Part 1: Local Development Setup**

### **Step 1: Initialize User Secrets**

Open PowerShell in your project directory:

```powershell
cd C:\HareKrishna\Raghu\Truwit\humanproof-starter\api
dotnet user-secrets init
```

**Expected Output**: `Set UserSecretsId to 'xxx...' for MSBuild project...`

---

### **Step 2: Add Your Credentials**

#### **Google OAuth** (To be completed tomorrow)

```powershell
# Replace YOUR_ACTUAL_xxx with real values from Google Cloud Console
dotnet user-secrets set "OAuth:Google:ClientId" "YOUR_ACTUAL_GOOGLE_CLIENT_ID"
dotnet user-secrets set "OAuth:Google:ClientSecret" "YOUR_ACTUAL_GOOGLE_CLIENT_SECRET"
```

#### **Twitter/X OAuth** (Already obtained)

```powershell
# Replace YOUR_ACTUAL_xxx with real values from X Developer Portal
dotnet user-secrets set "OAuth:Twitter:ConsumerKey" "YOUR_ACTUAL_TWITTER_CONSUMER_KEY"
dotnet user-secrets set "OAuth:Twitter:ConsumerSecret" "YOUR_ACTUAL_TWITTER_CONSUMER_SECRET"
```

#### **JWT Secret** (Generate a strong one)

```powershell
# Generate a random 32+ character string (example: use a password generator)
dotnet user-secrets set "OAuth:JwtSecret" "YOUR_STRONG_RANDOM_JWT_SECRET_MIN_32_CHARS"
```

**Example JWT Secret Generator**: Use an online tool or PowerShell:
```powershell
# Generate a 64-character random string
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

---

### **Step 3: Verify User Secrets**

List all your secrets to verify:

```powershell
cd C:\HareKrishna\Raghu\Truwit\humanproof-starter\api
dotnet user-secrets list
```

**Expected Output**:
```
OAuth:Google:ClientId = xxx...
OAuth:Google:ClientSecret = xxx...
OAuth:Twitter:ConsumerKey = xxx...
OAuth:Twitter:ConsumerSecret = xxx...
OAuth:JwtSecret = xxx...
```

---

### **Step 4: Test Locally**

Restart your Docker containers:

```powershell
cd C:\HareKrishna\Raghu\Truwit\humanproof-starter
docker-compose down
docker-compose up -d
```

Test Twitter OAuth:
```
http://localhost:5000/v1/auth/login/twitter
```

Test Google OAuth (once configured):
```
http://localhost:5000/v1/auth/login/google
```

---

## 🚀 **Part 2: Production Setup (Railway)**

### **Step 1: Get Your Credentials**

You'll need:
- ✅ Twitter Consumer Key & Consumer Secret (already obtained)
- ⏳ Google Client ID & Client Secret (to be obtained tomorrow)
- ⏳ JWT Secret (generate a new, production-specific one)

---

### **Step 2: Configure Railway Environment Variables**

1. Go to: [https://railway.app/dashboard](https://railway.app/dashboard)
2. Select your project: **Truwit Starter Template**
3. Select service: **API**
4. Click **"Variables"** tab
5. Click **"New Variable"** for each:

#### **Required Variables**:

```
OAuth__Google__ClientId
YOUR_ACTUAL_GOOGLE_CLIENT_ID

OAuth__Google__ClientSecret
YOUR_ACTUAL_GOOGLE_CLIENT_SECRET

OAuth__Twitter__ConsumerKey
YOUR_ACTUAL_TWITTER_CONSUMER_KEY

OAuth__Twitter__ConsumerSecret
YOUR_ACTUAL_TWITTER_CONSUMER_SECRET

OAuth__JwtSecret
YOUR_STRONG_PRODUCTION_JWT_SECRET_MIN_32_CHARS
```

**⚠️ IMPORTANT**: Use `__` (double underscore) to represent nested JSON paths!

---

### **Step 3: Deploy**

After adding all variables, Railway will automatically redeploy your API.

Monitor the deployment:
```
Railway Dashboard → Deployments → View Logs
```

---

### **Step 4: Verify Production**

Test Twitter OAuth:
```
https://api.truwit.ai/v1/auth/login/twitter
```

Test Google OAuth (once configured):
```
https://api.truwit.ai/v1/auth/login/google
```

---

## 🔑 **Part 3: Getting OAuth Credentials**

### **Twitter/X OAuth** ✅ (Already Done)

You've already configured this in X Developer Portal:
- App Type: **Web App, Automated App or Bot**
- Callback URL: `https://api.truwit.ai/v1/auth/callback/twitter`
- Website URL: `https://truwit.ai`

---

### **Google OAuth** ⏳ (To Do Tomorrow)

#### **Step 1: Go to Google Cloud Console**
Visit: [https://console.cloud.google.com/](https://console.cloud.google.com/)

#### **Step 2: Create/Select Project**
1. Click **"Select a project"** → **"New Project"**
2. Name it: `Truwit` or similar
3. Click **"Create"**

#### **Step 3: Enable Google+ API**
1. Go to **"APIs & Services"** → **"Library"**
2. Search: `Google+ API`
3. Click **"Enable"**

#### **Step 4: Create OAuth Credentials**
1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. Configure consent screen if prompted:
   - User Type: **External**
   - App name: `Truwit`
   - Support email: Your email
   - Developer contact: Your email
4. Application type: **Web application**
5. Name: `Truwit API`
6. **Authorized redirect URIs**:
   - Add: `https://api.truwit.ai/v1/auth/callback/google`
   - Add: `http://localhost:5000/v1/auth/callback/google` (for local testing)
7. Click **"Create"**

#### **Step 5: Copy Credentials**
You'll see:
- **Client ID**: `xxx...apps.googleusercontent.com`
- **Client Secret**: `xxx...`

**Save these securely!** You'll need them for User Secrets and Railway.

---

## 📝 **Part 4: Cleanup `appsettings.json`**

### **Current State** (Has real secrets! 🚨)
Your `api/appsettings.json` currently contains:
```json
{
  "OAuth": {
    "Twitter": {
      "ConsumerSecret": "SnqVNRrJfFWy1sWtphOt75wKSu..." // REAL SECRET!
    }
  }
}
```

### **Required State** (Placeholders only ✅)
Update `api/appsettings.json` to:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "OAuth": {
    "Google": {
      "ClientId": "YOUR_GOOGLE_CLIENT_ID_HERE",
      "ClientSecret": "YOUR_GOOGLE_CLIENT_SECRET_HERE"
    },
    "Twitter": {
      "ConsumerKey": "YOUR_TWITTER_CONSUMER_KEY_HERE",
      "ConsumerSecret": "YOUR_TWITTER_CONSUMER_SECRET_HERE"
    },
    "JwtSecret": "CHANGE_THIS_SECRET_IN_PRODUCTION_MIN_32_CHARS_REQUIRED",
    "JwtExpirationMinutes": 15
  }
}
```

### **Commit Clean File**

```powershell
cd C:\HareKrishna\Raghu\Truwit\humanproof-starter
git add api/appsettings.json
git commit -m "security: Replace real secrets with placeholders in appsettings.json"
git push
```

---

## ✅ **Part 5: Verification Checklist**

### **Local Development**
- [ ] User Secrets initialized
- [ ] Twitter Consumer Key & Secret added to User Secrets
- [ ] Google Client ID & Secret added to User Secrets
- [ ] JWT Secret added to User Secrets
- [ ] Verified with `dotnet user-secrets list`
- [ ] Tested Twitter OAuth: `http://localhost:5000/v1/auth/login/twitter`
- [ ] Tested Google OAuth: `http://localhost:5000/v1/auth/login/google`

### **Production (Railway)**
- [ ] Twitter Consumer Key & Secret added to Railway Variables
- [ ] Google Client ID & Secret added to Railway Variables
- [ ] JWT Secret (production) added to Railway Variables
- [ ] Railway redeployed successfully
- [ ] Tested Twitter OAuth: `https://api.truwit.ai/v1/auth/login/twitter`
- [ ] Tested Google OAuth: `https://api.truwit.ai/v1/auth/login/google`

### **Security**
- [ ] `appsettings.json` contains only placeholders
- [ ] Real secrets removed from Git history (if committed)
- [ ] User Secrets location confirmed: `%APPDATA%\Microsoft\UserSecrets\`
- [ ] Production secrets confirmed in Railway Dashboard only

---

## 🛟 **Troubleshooting**

### **"Secrets not loading locally"**
1. Verify User Secrets are set: `dotnet user-secrets list`
2. Restart Docker containers: `docker-compose restart api`
3. Check API logs: `docker-compose logs api`

### **"OAuth callback error"**
1. Verify callback URLs in Google/Twitter settings
2. Check Railway environment variables (double underscore!)
3. Ensure URLs match exactly (no trailing slashes)

### **"401 Unauthorized"**
1. Check JWT Secret is set (min 32 characters)
2. Verify OAuth credentials are correct
3. Check API logs for detailed error messages

---

## 📚 **Additional Resources**

- [ASP.NET Core User Secrets](https://learn.microsoft.com/en-us/aspnet/core/security/app-secrets)
- [Railway Environment Variables](https://docs.railway.app/develop/variables)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)
- [Twitter OAuth Setup](https://developer.x.com/en/docs/authentication/oauth-2-0)

---

## 📞 **Need Help?**

If you encounter issues:
1. Check the **Troubleshooting** section above
2. Review Railway deployment logs
3. Verify all credentials are correctly formatted
4. Ensure no typos in environment variable names (double underscore!)

---

**Good luck tomorrow! 🚀**

---

**Last Updated**: October 24, 2025  
**Status**: Twitter OAuth ✅ | Google OAuth ⏳  
**Next Steps**: Configure Google OAuth credentials tomorrow

