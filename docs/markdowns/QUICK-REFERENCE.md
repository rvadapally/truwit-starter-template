# Quick Reference Guide

**Essential commands and configurations for Angular + .NET + Railway + Cloudflare projects**

---

## 🚀 Quick Start Commands

### Project Setup
```bash
# Clone repository
git clone <your-repo-url>
cd <project-name>

# Start local development
docker-compose up -d --build

# Stop local development
docker-compose down

# Rebuild everything
docker-compose up --build -d
```

### API Development
```bash
# Build API
cd api
dotnet build

# Run API locally
dotnet run

# Add new package
dotnet add package <package-name>

# Create new controller
dotnet add controller <ControllerName>

# Run tests
dotnet test
```

### Angular Development
```bash
# Install dependencies
cd app
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Run E2E tests
npm run test:e2e

# Add new component
ng generate component <component-name>

# Add new service
ng generate service <service-name>
```

---

## 🔧 Configuration Files

### Railway Configuration (`railway.json`)
```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "api/Dockerfile"
  },
  "deploy": {
    "startCommand": "dotnet YourApp.dll",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100
  }
}
```

### Docker Compose (`docker-compose.yml`)
```yaml
version: '3.8'
services:
  api:
    build: ./api
    ports:
      - "5000:8080"
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - Database__Type=postgres
      - ConnectionStrings__Postgres=Host=postgres;Database=truwit;Username=postgres;Password=password
    depends_on:
      - postgres

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=truwit
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Angular Environment (`app/src/environments/environment.prod.ts`)
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-project.up.railway.app'
};
```

### Playwright Configuration (`app/playwright.config.ts`)
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['list'], ['json', { outputFile: 'test-results/results.json' }]],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox-desktop', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit-desktop', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 12'] } },
  ],
});
```

---

## 🧪 Testing Commands

### API Testing
```powershell
# Test health endpoint
Invoke-RestMethod -Uri "http://localhost:5000/health"

# Test with curl
curl -X POST http://localhost:5000/v1/proofs/url \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'

# Run comprehensive tests
powershell -ExecutionPolicy Bypass -File test-all-features.ps1 -Environment local
```

### E2E Testing
```bash
# Run all E2E tests
npm run test:e2e

# Run tests in UI mode
npm run test:e2e:ui

# Run specific test file
npx playwright test url-verification.spec.ts

# Run tests in specific browser
npx playwright test --project=chromium-desktop

# Debug tests
npm run test:e2e:debug
```

### Pre-Deployment Testing
```powershell
# Run pre-deployment tests
.\pre-deploy-test.ps1

# Test API build
cd api && dotnet build

# Test Angular build
cd app && npm run build

# Test Docker Compose
docker-compose up -d --build
```

---

## 🚀 Deployment Commands

### Railway Deployment
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link project
railway link

# Deploy
railway up

# View logs
railway logs

# Check status
railway status
```

### Cloudflare Pages Deployment
```bash
# Install Cloudflare CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy
wrangler pages deploy dist

# View deployments
wrangler pages deployment list
```

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/new-feature

# Commit changes
git add .
git commit -m "feat: add new feature"

# Push to remote
git push origin feature/new-feature

# Create pull request
gh pr create --title "Add new feature" --body "Description of changes"

# Merge to main
git checkout main
git merge feature/new-feature
git push origin main
```

---

## 🔍 Debugging Commands

### API Debugging
```bash
# View API logs
docker-compose logs -f api

# Access API container
docker exec -it <container-name> /bin/bash

# Check database
docker exec -it <postgres-container> psql -U postgres -d truwit

# Test API endpoints
curl -v http://localhost:5000/health
```

### Angular Debugging
```bash
# Check Angular build
ng build --verbose

# Run Angular with debug info
ng serve --verbose

# Check bundle size
ng build --stats-json
npx webpack-bundle-analyzer dist/app/stats.json
```

### Database Debugging
```sql
-- Check table structure
\d "Proofs"

-- Check data
SELECT * FROM "Proofs" LIMIT 10;

-- Check indexes
\di

-- Check connections
SELECT * FROM pg_stat_activity;
```

---

## 📊 Monitoring Commands

### Health Checks
```bash
# API health
curl https://your-project.up.railway.app/health

# Frontend health
curl https://your-domain.com

# Database health
docker exec <postgres-container> pg_isready
```

### Performance Monitoring
```bash
# Check API response time
curl -w "@curl-format.txt" -o /dev/null -s https://your-project.up.railway.app/health

# Check frontend load time
curl -w "@curl-format.txt" -o /dev/null -s https://your-domain.com

# Monitor Docker resources
docker stats
```

### Log Monitoring
```bash
# Railway logs
railway logs --follow

# Docker logs
docker-compose logs -f

# Cloudflare logs
wrangler pages deployment list
```

---

## 🛠️ Development Tools

### VS Code Extensions
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "angular.ng-template",
    "ms-dotnettools.csharp",
    "ms-dotnettools.csdevkit",
    "ms-dotnettools.vscode-dotnet-runtime",
    "ms-vscode.vscode-docker",
    "ms-playwright.playwright",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint"
  ]
}
```

### Package.json Scripts
```json
{
  "scripts": {
    "start": "ng serve --proxy-config proxy.conf.json",
    "build": "ng build --configuration=production",
    "test": "ng test",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:report": "playwright show-report",
    "lint": "ng lint",
    "format": "prettier --write \"src/**/*.{ts,html,scss}\""
  }
}
```

### Docker Commands
```bash
# Build Docker image
docker build -t your-app ./api

# Run Docker container
docker run -p 5000:8080 your-app

# Clean up Docker
docker system prune -a

# View Docker images
docker images

# View Docker containers
docker ps -a
```

---

## 🔐 Security Commands

### SSL/TLS Testing
```bash
# Test SSL certificate
openssl s_client -connect your-domain.com:443

# Check SSL rating
curl -s "https://api.ssllabs.com/api/v3/analyze?host=your-domain.com"

# Test CORS
curl -H "Origin: https://your-domain.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://your-api.up.railway.app/health
```

### Security Scanning
```bash
# Scan for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Check for outdated packages
npm outdated

# Update packages
npm update
```

---

## 📈 Performance Commands

### Bundle Analysis
```bash
# Analyze Angular bundle
ng build --stats-json
npx webpack-bundle-analyzer dist/app/stats.json

# Check bundle size
ls -la dist/app/

# Analyze dependencies
npm ls --depth=0
```

### Database Performance
```sql
-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Check table sizes
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 🚨 Emergency Commands

### Rollback Deployment
```bash
# Railway rollback
railway rollback

# Cloudflare rollback
wrangler pages deployment rollback <deployment-id>

# Git rollback
git revert HEAD
git push origin main
```

### Emergency Debugging
```bash
# Check API status
curl -I https://your-project.up.railway.app/health

# Check frontend status
curl -I https://your-domain.com

# Check database connectivity
docker exec <postgres-container> pg_isready

# View recent logs
railway logs --tail 100
```

### Data Recovery
```sql
-- Backup database
pg_dump -h localhost -U postgres -d truwit > backup.sql

-- Restore database
psql -h localhost -U postgres -d truwit < backup.sql

-- Check data integrity
SELECT COUNT(*) FROM "Proofs";
SELECT COUNT(*) FROM "VerificationProofs";
```

---

## 📚 Documentation Commands

### Generate Documentation
```bash
# Generate API documentation
dotnet build
dotnet run --project api -- --generate-docs

# Generate Angular documentation
ng build --configuration=production
npx compodoc -p tsconfig.json -s

# Generate test coverage
ng test --code-coverage
```

### Update Documentation
```bash
# Update README
git add README.md
git commit -m "docs: update README"

# Update API docs
git add api/docs/
git commit -m "docs: update API documentation"

# Update deployment guide
git add DEPLOYMENT-GUIDE.md
git commit -m "docs: update deployment guide"
```

---

## 🎯 Success Metrics Commands

### Performance Metrics
```bash
# API response time
curl -w "Time: %{time_total}s\n" -o /dev/null -s https://your-project.up.railway.app/health

# Frontend load time
curl -w "Time: %{time_total}s\n" -o /dev/null -s https://your-domain.com

# Database query time
docker exec <postgres-container> psql -U postgres -d truwit -c "SELECT pg_sleep(1);"
```

### Uptime Monitoring
```bash
# Check API uptime
curl -f https://your-project.up.railway.app/health || echo "API DOWN"

# Check frontend uptime
curl -f https://your-domain.com || echo "FRONTEND DOWN"

# Check database uptime
docker exec <postgres-container> pg_isready || echo "DATABASE DOWN"
```

---

**This quick reference guide provides essential commands for development, testing, deployment, and monitoring. Keep it handy for your next project!**
