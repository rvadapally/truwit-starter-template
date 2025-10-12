# Environment & Port Mapping

## 🏠 Local Development Environment

### API (Docker Container)
- **Container Internal Port:** `8080`
- **Host Mapped Port:** `5000`
- **URL:** `http://localhost:5000`
- **Health Check:** `http://localhost:5000/health`
- **Environment:** `Development`

### Frontend (Angular)
- **Port:** `4200`
- **URL:** `http://localhost:4200`
- **API URL:** `http://localhost:5000` (from `environment.ts`)

### Configuration Files
- **API:** `api/docker-compose.yml` - Maps `5000:8080`
- **Frontend:** `app/src/environments/environment.ts` - Points to `http://localhost:5000`

---

## 🌐 Production Environment

### API (Railway)
- **URL:** `https://truwit-starter-template-production.up.railway.app`
- **Health Check:** `https://truwit-starter-template-production.up.railway.app/health`
- **Port:** Railway assigns dynamically (internal: 8080)
- **Environment:** `Production`

### Frontend (Cloudflare Pages)
- **URL:** `https://www.truwit.ai`
- **API URL:** `https://truwit-starter-template-production.up.railway.app` (from `environment.prod.ts`)

### Configuration Files
- **API:** `api/Dockerfile` - Exposes port 8080
- **Frontend:** `app/src/environments/environment.prod.ts` - Points to Railway URL

---

## 📋 Port & URL Summary

| Environment | Component | Port/URL | Points To |
|-------------|-----------|----------|-----------|
| **Local** | API Container | `8080` (internal) | - |
| **Local** | API Host | `5000` | Docker container |
| **Local** | Angular | `4200` | - |
| **Local** | Angular API Calls | - | `http://localhost:5000` |
| **Production** | Railway API | `8080` (internal) | - |
| **Production** | Railway Public | `443` (HTTPS) | Railway routes to internal 8080 |
| **Production** | Cloudflare | `443` (HTTPS) | - |
| **Production** | Cloudflare API Calls | - | `https://truwit-starter-template-production.up.railway.app` |

---

## 🔄 How Angular Resolves API URLs

### Local Development (`npm start`)
1. Angular dev server starts on `http://localhost:4200`
2. Uses `app/src/environments/environment.ts`
3. API calls go to: `http://localhost:5000`
4. Docker API responds from container port 8080 (mapped to host 5000)

### Production Build (`npm run build`)
1. Angular builds with `--configuration=production`
2. Replaces `environment.ts` with `environment.prod.ts` (via `angular.json` `fileReplacements`)
3. API calls go to: `https://truwit-starter-template-production.up.railway.app`
4. Railway API responds

---

## ✅ Correct Configuration

### `app/src/environments/environment.ts` (Local)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000'  // Local Docker API
};
```

### `app/src/environments/environment.prod.ts` (Production)
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://truwit-starter-template-production.up.railway.app'  // Railway API
};
```

### `api/docker-compose.yml` (Local Docker)
```yaml
services:
  api:
    ports:
      - "5000:8080"  # Host:Container
    environment:
      - ASPNETCORE_URLS=http://0.0.0.0:8080
```

### `api/Dockerfile` (Production Railway)
```dockerfile
EXPOSE 8080
ENTRYPOINT ["dotnet", "HumanProof.Api.dll"]
```

---

## 🧪 Testing Endpoints

### Local Testing
```bash
# API Health Check
curl http://localhost:5000/health

# Frontend
open http://localhost:4200
```

### Production Testing
```bash
# API Health Check
curl https://truwit-starter-template-production.up.railway.app/health

# Frontend
open https://www.truwit.ai
```

---

## 🚨 Common Issues

### Issue: "Connection Refused" locally
- **Cause:** Angular trying to reach wrong port
- **Fix:** Ensure `environment.ts` points to `http://localhost:5000`
- **Fix:** Ensure Docker is running (`docker ps`)

### Issue: CORS errors locally
- **Cause:** API not allowing `localhost:4200` origin
- **Fix:** Check API CORS configuration allows local development

### Issue: Production not using Railway API
- **Cause:** `environment.prod.ts` not being used during build
- **Fix:** Ensure `angular.json` has `fileReplacements` configured
- **Fix:** Build with `--configuration=production` flag

