# Local Testing Guide

This guide explains how to test the Truwit Verification App locally in an environment that **exactly matches** the Railway production deployment.

## 🎯 Goal

**Local environment = Production environment**
- Same database (PostgreSQL)
- Same Docker containers
- Same cookies
- Same logs
- Same everything!

## 📋 Prerequisites

1. **Docker Desktop** installed and running
2. **PowerShell** (for running test scripts)
3. **Git** (to pull latest code)

## 🚀 Quick Start

### 1. Start Local Environment

```powershell
# From project root
docker-compose up -d --build
```

This starts:
- **PostgreSQL** database on `localhost:5432`
- **.NET API** on `http://localhost:5000`
- **Persistent volumes** for data and logs

###  2. Verify It's Running

```powershell
docker ps
```

You should see:
```
CONTAINER ID   IMAGE                        STATUS
xxxxx          humanproof-starter-api       Up X seconds
xxxxx          postgres:15                  Up X seconds (healthy)
```

### 3. Run Comprehensive Tests

```powershell
powershell -ExecutionPolicy Bypass -File test-all-local-comprehensive.ps1
```

This tests:
- ✅ API health
- ✅ URL proof creation (TikTok)
- ✅ File upload
- ✅ Database queries
- ✅ Deduplication
- ✅ Log files
- ✅ YouTube (if cookies valid)

## 📊 Check Database Directly

### Using Docker Exec (Quick)

```powershell
# Count proofs
docker exec truwit-postgres psql -U postgres -d truwit -c "SELECT COUNT(*) FROM \"Proofs\""

# List all proofs
docker exec truwit-postgres psql -U postgres -d truwit -c "SELECT \"TrustmarkId\", \"OriginUrl\", \"CreatedAt\" FROM \"Proofs\" LIMIT 10"

# Check specific proof
docker exec truwit-postgres psql -U postgres -d truwit -c "SELECT * FROM \"Proofs\" WHERE \"TrustmarkId\" = 'YOUR_TRUSTMARK_ID'"
```

### Using Azure Data Studio (GUI)

1. **Download**: https://docs.microsoft.com/en-us/sql/azure-data-studio/download
2. **Connect**:
   - Server: `localhost`
   - Port: `5432`
   - Database: `truwit`
   - Username: `postgres`
   - Password: `password`
   - Auth Type: Password
3. **Query tables**: `Proofs`, `LinkIndex`, `Assets`, `Receipts`

## 📝 Check Logs

### View Live Logs

```powershell
# API logs (console)
docker logs truwit-api --follow

# PostgreSQL logs
docker logs truwit-postgres --follow
```

### View Persistent Log Files

```powershell
# List log files
docker exec truwit-api ls -lah /app/logs/

# View today's logs
docker exec truwit-api cat /app/logs/nlog-own-2025-10-13.log

# Tail logs (last 50 lines)
docker exec truwit-api tail -50 /app/logs/nlog-own-2025-10-13.log
```

**Log Files:**
- `nlog-all-YYYY-MM-DD.log` - All application logs
- `nlog-own-YYYY-MM-DD.log` - API-specific logs with HTTP context
- Archives: Kept for 30 days in `/app/logs/archives/`

## 🧪 Manual Testing

### Test API Endpoints

```powershell
# Health check
Invoke-RestMethod -Uri "http://localhost:5000/health"

# Create proof from URL
$body = @{ url = "https://www.tiktok.com/@username/video/1234567" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5000/v1/proofs/url" -Method Post -Body $body -ContentType "application/json"

# Verify proof
Invoke-RestMethod -Uri "http://localhost:5000/v1/proofs/verify/TRUSTMARK_ID"
```

### Upload File

```powershell
$boundary = [System.Guid]::NewGuid().ToString()
$filePath = "testFiles/test.mp4"
$fileBytes = [System.IO.File]::ReadAllBytes((Resolve-Path $filePath))
$bodyLines = @(
    "--$boundary",
    "Content-Disposition: form-data; name=`"file`"; filename=`"test.mp4`"",
    "Content-Type: video/mp4",
    "",
    [System.Text.Encoding]::GetEncoding("ISO-8859-1").GetString($fileBytes),
    "--$boundary--"
) -join "`r`n"

Invoke-RestMethod -Uri "http://localhost:5000/v1/proofs/file-upload" -Method Post -ContentType "multipart/form-data; boundary=$boundary" -Body $bodyLines
```

## 🛠️ Troubleshooting

### API Not Responding

```powershell
# Check if containers are running
docker ps

# Check API logs for errors
docker logs truwit-api

# Restart API
docker-compose restart api
```

### Database Connection Issues

```powershell
# Check PostgreSQL is healthy
docker ps | Select-String "postgres"

# Test connection
docker exec truwit-postgres psql -U postgres -d truwit -c "SELECT 1"

# Restart PostgreSQL
docker-compose restart postgres
```

### Reset Everything

```powershell
# Stop and remove all containers and volumes
docker-compose down -v

# Rebuild from scratch
docker-compose up -d --build
```

## 📂 Docker Volumes

Persistent data stored in Docker volumes:

- `humanproof-starter_postgres_data` - Database files
- `humanproof-starter_api_data` - API data files
- `humanproof-starter_api_logs` - **Log files** (NEW!)
- `humanproof-starter_api_temp` - Temporary download files

**To view volume data:**

```powershell
# List volumes
docker volume ls

# Inspect volume
docker volume inspect humanproof-starter_api_logs

# Access log files from host
# (Logs are persistent across container restarts!)
docker exec truwit-api cat /app/logs/nlog-own-2025-10-13.log
```

## 🔄 Workflow

### Before Pushing to Railway

1. **Make code changes**
2. **Test locally**:
   ```powershell
   docker-compose up -d --build
   powershell -ExecutionPolicy Bypass -File test-all-local-comprehensive.ps1
   ```
3. **Check logs**:
   ```powershell
   docker exec truwit-api tail -50 /app/logs/nlog-own-*.log
   ```
4. **Verify database**:
   ```powershell
   docker exec truwit-postgres psql -U postgres -d truwit -c "SELECT COUNT(*) FROM \"Proofs\""
   ```
5. **If all tests pass**, push to GitHub (Railway auto-deploys)
6. **Test production** using `test-all-production.ps1`

### Daily Development

```powershell
# Start environment
docker-compose up -d

# Make changes, test immediately
# (Hot reload if needed: docker-compose restart api)

# Check logs in real-time
docker logs truwit-api --follow

# When done
docker-compose down
# (Keeps volumes - data persists!)
```

## 🎯 Benefits

✅ **Catch errors before Railway deployment**  
✅ **Faster feedback loop** (no waiting for Railway builds)  
✅ **Test database queries directly**  
✅ **Access persistent logs** (30 days)  
✅ **Exact production parity**  
✅ **Cost savings** (less Railway build time)  

## 📚 Additional Resources

- **Docker Compose Docs**: https://docs.docker.com/compose/
- **PostgreSQL Docker**: https://hub.docker.com/_/postgres
- **NLog Configuration**: https://nlog-project.org/config/
- **Azure Data Studio**: https://docs.microsoft.com/en-us/sql/azure-data-studio/

---

**Need help?** Check the logs first! 📝
```powershell
docker logs truwit-api --tail 100
docker exec truwit-api tail -100 /app/logs/nlog-own-*.log
```

