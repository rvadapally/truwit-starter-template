# 🔐 Secrets Management Guide

## 📋 Overview

This guide explains how to securely manage OAuth secrets and other sensitive configuration for the Truwit application.

---

## 🚨 **CRITICAL: Never Commit Secrets to Git!**

✅ **DO:**
- Use environment variables for secrets
- Use User Secrets for local development (ASP.NET Core)
- Use Railway Variables for production
- Keep `appsettings.json` with placeholders only

❌ **DON'T:**
- Commit `.env` files
- Commit real secrets in `appsettings.json`
- Share secrets in Slack/Email/Discord
- Hardcode secrets in source code

---

## 🏠 **Local Development Setup**

### **Method 1: ASP.NET Core User Secrets (Recommended for Local)**

The project is already initialized with User Secrets. Add your secrets:

```powershell
cd api

# Google OAuth
dotnet user-secrets set "OAuth:Google:ClientId" "YOUR_GOOGLE_CLIENT_ID"
dotnet user-secrets set "OAuth:Google:ClientSecret" "YOUR_GOOGLE_CLIENT_SECRET"

# Twitter OAuth
dotnet user-secrets set "OAuth:Twitter:ConsumerKey" "YOUR_TWITTER_CONSUMER_KEY"
dotnet user-secrets set "OAuth:Twitter:ConsumerSecret" "YOUR_TWITTER_CONSUMER_SECRET"

# JWT Secret
dotnet user-secrets set "OAuth:JwtSecret" "YOUR_SECURE_JWT_SECRET_MIN_32_CHARS"
```

**Where are User Secrets stored?**
- Windows: `%APPDATA%\Microsoft\UserSecrets\<user_secrets_id>\secrets.json`
- macOS/Linux: `~/.microsoft/usersecrets/<user_secrets_id>/secrets.json`

**Advantages:**
- ✅ Not in source control
- ✅ Persists across sessions
- ✅ ASP.NET Core automatically loads them
- ✅ Per-user configuration

---

### **Method 2: Environment Variables**

You can also use environment variables directly:

```powershell
# PowerShell
$env:OAuth__Google__ClientId = "YOUR_GOOGLE_CLIENT_ID"
$env:OAuth__Google__ClientSecret = "YOUR_GOOGLE_CLIENT_SECRET"
$env:OAuth__Twitter__ConsumerKey = "YOUR_TWITTER_CONSUMER_KEY"
$env:OAuth__Twitter__ConsumerSecret = "YOUR_TWITTER_CONSUMER_SECRET"

# Then run the API
cd api
dotnet run
```

**Note:** Use double underscores (`__`) to represent nested JSON keys in environment variables.

---

## 🐳 **Docker Local Development**

Create a `.env` file in the project root (this is `.gitignore`d):

```bash
# api/.env
OAUTH__GOOGLE__CLIENTID=YOUR_GOOGLE_CLIENT_ID
OAUTH__GOOGLE__CLIENTSECRET=YOUR_GOOGLE_CLIENT_SECRET
OAUTH__TWITTER__CONSUMERKEY=YOUR_TWITTER_CONSUMER_KEY
OAUTH__TWITTER__CONSUMERSECRET=YOUR_TWITTER_CONSUMER_SECRET
OAUTH__JWTSECRET=YOUR_SECURE_JWT_SECRET_MIN_32_CHARS
```

Update `docker-compose.yml` to load the `.env` file:

```yaml
services:
  truwit-api:
    env_file:
      - ./api/.env
```

---

## 🚂 **Railway Production Setup**

### **Step 1: Go to Railway Dashboard**
1. Visit: https://railway.app/
2. Select your **API service**
3. Go to **"Variables"** tab

### **Step 2: Add Environment Variables**

Add these variables (click "+ New Variable"):

```
OAuth__Google__ClientId=YOUR_GOOGLE_CLIENT_ID
OAuth__Google__ClientSecret=YOUR_GOOGLE_CLIENT_SECRET
OAuth__Twitter__ConsumerKey=YOUR_TWITTER_CONSUMER_KEY
OAuth__Twitter__ConsumerSecret=YOUR_TWITTER_CONSUMER_SECRET
OAuth__JwtSecret=YOUR_SECURE_JWT_SECRET_MIN_32_CHARS
```

**Note:** Railway uses double underscores (`__`) for nested configuration.

### **Step 3: Redeploy**
Railway will automatically redeploy when you save the variables.

---

## 🔑 **Getting Your OAuth Credentials**

### **Google OAuth**

1. Go to: https://console.cloud.google.com/
2. Create a new project or select existing
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Authorized redirect URIs:
   ```
   http://localhost:5000/v1/auth/callback/google
   https://api.truwit.ai/v1/auth/callback/google
   ```
7. Copy **Client ID** and **Client Secret**

### **Twitter (X) OAuth**

1. Go to: https://developer.x.com/en/portal/dashboard
2. Create a new app or select existing
3. Go to **User authentication settings**
4. App permissions: **Read** (minimum)
5. Type of App: **Web App, Automated App or Bot**
6. Callback URLs:
   ```
   http://localhost:5000/v1/auth/callback/twitter
   https://api.truwit.ai/v1/auth/callback/twitter
   ```
7. Website URL: `https://truwit.ai`
8. Copy **API Key** (Consumer Key) and **API Secret** (Consumer Secret)

---

## 📦 **What's Already in `.gitignore`**

The following files are already ignored and safe to use:

```gitignore
# Environment files
.env
.env.*
!.env.example

# User Secrets
appsettings.Development.json
appsettings.Local.json
secrets.json

# Sensitive config
*.user
*.suo
*.userprefs
```

---

## ✅ **Verification Checklist**

Before committing changes, verify:

- [ ] `appsettings.json` contains **only placeholders**
- [ ] Real secrets are in **User Secrets** or **Railway Variables**
- [ ] `.env` files are in `.gitignore`
- [ ] No secrets in commit history (`git log` shows no sensitive data)
- [ ] Railway variables are set correctly
- [ ] OAuth callback URLs are configured in provider dashboards

---

## 🆘 **Emergency: Secret Exposed in Git**

If you accidentally commit a secret:

### **1. Rotate the Secret Immediately**
- Generate new Google OAuth credentials
- Generate new Twitter API keys
- Update User Secrets and Railway Variables

### **2. Remove from Git History**
```powershell
# Use BFG Repo-Cleaner or git filter-branch
# Example with BFG:
java -jar bfg.jar --replace-text secrets.txt
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

### **3. Notify Your Team**
- Alert team members to pull latest changes
- Document the incident
- Review security practices

---

## 📚 **Additional Resources**

- [ASP.NET Core User Secrets](https://docs.microsoft.com/en-us/aspnet/core/security/app-secrets)
- [Railway Environment Variables](https://docs.railway.app/develop/variables)
- [Google OAuth Setup](https://support.google.com/cloud/answer/6158849)
- [Twitter OAuth Documentation](https://developer.twitter.com/en/docs/authentication/oauth-1-0a)

---

## 🔒 **Current Status**

- ✅ User Secrets initialized (ID: `8c51e553-70ea-4c18-97c7-ca4ddec6eac5`)
- ✅ `.gitignore` configured correctly
- ✅ `appsettings.json` cleaned (placeholders only)
- ⏳ **TODO: You need to add your actual secrets using User Secrets or Railway Variables**

---

**Remember:** Security is everyone's responsibility! 🛡️

