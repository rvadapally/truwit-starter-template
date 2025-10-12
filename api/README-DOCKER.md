# Local Docker Development

## Why Docker for Local Development?

Running the API in Docker locally ensures:
- ✅ **Environment parity** - Same Linux environment as production
- ✅ **Catch platform issues early** - Windows/Linux path differences, missing dependencies
- ✅ **Consistent behavior** - What works locally will work in production
- ✅ **No "works on my machine"** - Everyone has the same environment

## Quick Start

### 1. Build and Run with Docker Compose

```bash
cd api
docker-compose up --build
```

The API will be available at: `http://localhost:5000`

### 2. Test the API

**PowerShell:**
```powershell
.\test-api.ps1 http://localhost:5000
```

**Bash:**
```bash
chmod +x test-api.sh
./test-api.sh http://localhost:5000
```

### 3. View Logs

```bash
docker-compose logs -f api
```

### 4. Stop the Container

```bash
docker-compose down
```

## Local Development Workflow

### Option 1: Docker Compose (Recommended)
```bash
# Start
cd api
docker-compose up --build

# In another terminal, test
.\test-api.ps1 http://localhost:5000

# Stop
docker-compose down
```

### Option 2: Direct Docker Build
```bash
cd api

# Build
docker build -t humanproof-api .

# Run
docker run -p 5000:8080 -e ASPNETCORE_URLS=http://0.0.0.0:8080 humanproof-api

# Test
.\test-api.ps1 http://localhost:5000
```

### Option 3: .NET CLI (Not Recommended - Different Environment)
```bash
cd api
dotnet run
```
⚠️ **Warning:** This runs on Windows, not Linux. Platform-specific issues may not be caught.

## Testing Strategy

### 1. Local Docker Testing (Before Commit)
```bash
# Build and start
docker-compose up --build

# Run tests
.\test-api.ps1 http://localhost:5000

# If tests pass, commit
git add .
git commit -m "Your changes"
```

### 2. Production Testing (After Deploy)
```bash
# Test production
.\test-api.ps1 https://truwit-starter-template-production.up.railway.app

# If tests fail, check Railway logs
railway logs
```

## Common Commands

### View Container Status
```bash
docker-compose ps
```

### Execute Commands Inside Container
```bash
# Check yt-dlp is installed
docker-compose exec api yt-dlp --version

# Check temp directory
docker-compose exec api ls -la /tmp/truwit_dl

# Open shell
docker-compose exec api /bin/bash
```

### Rebuild After Changes
```bash
# Rebuild and restart
docker-compose up --build

# Force rebuild without cache
docker-compose build --no-cache
docker-compose up
```

### Clean Up
```bash
# Stop and remove containers
docker-compose down

# Remove volumes (deletes database)
docker-compose down -v

# Remove all Docker resources
docker system prune -a
```

## Debugging

### Check Logs
```bash
docker-compose logs -f api
```

### Check Health
```bash
curl http://localhost:5000/health
```

### Verify yt-dlp Works
```bash
docker-compose exec api yt-dlp --version
docker-compose exec api ffmpeg -version
```

### Test File Paths
```bash
# Check if temp directory exists
docker-compose exec api ls -la /tmp/truwit_dl

# Create test file
docker-compose exec api touch /tmp/truwit_dl/test.txt
docker-compose exec api ls -la /tmp/truwit_dl
```

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Stop the process or change port in docker-compose.yml
```

### Container Won't Start
```bash
# Check logs
docker-compose logs api

# Rebuild from scratch
docker-compose down
docker-compose build --no-cache
docker-compose up
```

### Database Issues
```bash
# Remove and recreate volume
docker-compose down -v
docker-compose up --build
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Test API

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: |
          cd api
          docker-compose up -d --build
          
      - name: Wait for API
        run: sleep 10
        
      - name: Run tests
        run: |
          cd api
          chmod +x test-api.sh
          ./test-api.sh http://localhost:5000
          
      - name: Stop containers
        run: |
          cd api
          docker-compose down
```

## Best Practices

1. **Always test in Docker before committing**
2. **Use `docker-compose up --build` to ensure latest changes**
3. **Check logs if tests fail**: `docker-compose logs -f api`
4. **Clean up regularly**: `docker system prune`
5. **Keep docker-compose.yml in sync with Dockerfile**

## Differences from Production

| Aspect | Local Docker | Railway Production |
|--------|-------------|-------------------|
| Port | 5000 (host) → 8080 (container) | Auto-assigned |
| Database | Local SQLite file | Persistent volume |
| Logs | `docker-compose logs` | Railway dashboard |
| Environment | Development | Production |
| Hot reload | ❌ Must rebuild | ❌ Must redeploy |

## Next Steps

1. ✅ Test locally with Docker
2. ✅ Run automated tests
3. ✅ Verify all endpoints work
4. ✅ Commit changes
5. ✅ Test on Railway after deploy
6. ✅ Compare local vs production behavior

---

**Remember:** If it doesn't work in local Docker, it won't work in production!

