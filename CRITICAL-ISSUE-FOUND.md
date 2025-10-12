# 🚨 CRITICAL ISSUE FOUND

## Problem
Requests to `localhost:5000` and `localhost:5001` are **NOT reaching the Docker container**.

## Evidence
1. Docker container is running and healthy ✅
2. Port mapping is correct: `8080/tcp -> 127.0.0.1:5001` ✅  
3. API responds to requests (health, proof creation) ✅
4. **Docker logs show ZERO HTTP requests** ❌
5. Same cached `trustmarkId` keeps appearing ❌
6. `/verify` endpoint returns 404 (doesn't exist in old API) ❌

## Root Cause
There's **another API instance running** (likely in WSL) that's intercepting all requests before they reach Docker.

## How to Fix

### Step 1: Find and Kill the Rogue API
```bash
# Check WSL processes
wsl -- ps aux | grep dotnet

# Or check all .NET processes
wsl -- pgrep -a dotnet

# Kill them
wsl -- pkill -9 dotnet
```

### Step 2: Restart Everything Fresh
```bash
# Stop Docker
cd api
docker-compose down

# Clear any cached data
docker system prune -f

# Start fresh
docker-compose up -d

# Wait 10 seconds
timeout /t 10

# Test on port 5001
curl http://127.0.0.1:5001/health
```

### Step 3: Verify Logs Appear
After making a request, check Docker logs:
```bash
docker logs api-api-1 --tail 20
```

**You should see**:
- `💾 InsertAsync called`  
- `HTTP POST /v1/proofs/url`
- Request logging

If you DON'T see these, the rogue API is still intercepting!

---

## Alternative: Use Different Port

Change `docker-compose.yml` to use port `8000`:
```yaml
ports:
  - "127.0.0.1:8000:8080"
```

Then test:
```bash
curl http://127.0.0.1:8000/health
```

---

## Next Steps

1. **Stop WSL completely**: `wsl --shutdown`
2. **Restart Docker Desktop**
3. **Start API**: `cd api && docker-compose up -d`
4. **Test**: `powershell -File test-port-5001.ps1`

The Docker logs MUST show requests for this to work!


