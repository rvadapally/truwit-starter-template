# Lessons Learned from TruWit Project

**Critical insights and hard-won knowledge from building a production Angular + .NET + Railway + Cloudflare application**

---

## 🚨 Critical Lessons (Must Know)

### 1. CORS Configuration Order is CRITICAL
**Problem:** Static files blocked by CORS policy
**Root Cause:** `UseCors()` must be called BEFORE `UseStaticFiles()`
**Solution:**
```csharp
// CORRECT ORDER in Program.cs
app.UseCors("AllowAll");
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        ctx.Context.Response.Headers.Append("Access-Control-Allow-Origin", "*");
    }
});
```
**Impact:** Without this, frontend cannot load images from API, breaking the entire user experience.

### 2. Angular Routing Order Matters
**Problem:** `/app/t/:id` showing landing page instead of verification page
**Root Cause:** Astro pages intercepting Angular routes
**Solution:**
```typescript
// CORRECT ORDER - More specific routes FIRST
export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 't/:id', component: PublicVerifyComponent },      // Specific first
  { path: 'app/t/:id', component: PublicVerifyComponent },  // Specific first
  { path: 'app', redirectTo: '/', pathMatch: 'full' },       // General after
  { path: '**', redirectTo: '/' }                          // Catch-all last
];
```
**Impact:** Wrong order causes routing conflicts and broken user flows.

### 3. Environment Import Paths Are Tricky
**Problem:** `Cannot find module '../../../environments/environment'`
**Root Cause:** Incorrect directory level counting
**Solution:**
```typescript
// From: app/src/app/features/component/
// To:   app/src/environments/
// Levels: ../../../../environments/environment (4 levels up, not 3)
```
**Impact:** Build failures and deployment issues.

### 4. Railway Ephemeral Storage Problem
**Problem:** Files lost on every redeploy
**Root Cause:** Railway filesystem is ephemeral
**Solution:** Implement regenerate-on-miss endpoints
```csharp
[HttpGet("cards/proof/{id}-{size}.png")]
public async Task<IActionResult> RegenerateProofCard(string id, int size)
{
    // Check if proof exists in database
    // Generate proof card on-the-fly
    // Save to disk
    // Return PNG image
}
```
**Impact:** Without this, proof cards disappear after every deployment.

### 5. Database Migration Timing
**Problem:** New columns not added to existing tables
**Root Cause:** Migration not applied after deployment
**Solution:** Always use `IF NOT EXISTS` and verify
```sql
ALTER TABLE "Proofs"
ADD COLUMN IF NOT EXISTS "ProofCardSmallUrl" TEXT NULL;

-- Always verify
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'Proofs' 
AND column_name LIKE 'ProofCard%';
```
**Impact:** New features fail silently without proper database schema.

---

## 🎯 Architecture Lessons

### 1. Hybrid Deployment Strategy Works
**Approach:** Astro for static pages + Angular for SPA
**Benefits:**
- Fast static page loads
- Rich interactive features where needed
- SEO-friendly landing pages
- Modern SPA for complex workflows

**Implementation:**
```
https://truwit.ai/           → Astro static pages
https://truwit.ai/app/*      → Angular SPA
https://truwit.ai/app/t/:id  → Proof verification page
```

### 2. Image Processing with SkiaSharp
**Key Insights:**
- Always dispose of SKSurface, SKBitmap, SKPaint
- Use fixed QR code sizes (150x150px)
- Implement proper error handling
- Cache generated images

**Best Practice:**
```csharp
public async Task<byte[]> GenerateProofCard(string proofId, string url, int size = 800)
{
    using var surface = SKSurface.Create(new SKImageInfo(size, size));
    using var canvas = surface.Canvas;
    
    // Load template
    using var template = SKBitmap.Decode(templatePath);
    canvas.DrawBitmap(template, 0, 0);
    
    // Add dynamic content
    using var paint = new SKPaint { Color = SKColors.White };
    canvas.DrawText(proofId, x, y, paint);
    
    // Generate QR code
    using var qrCode = GenerateQRCode(url);
    canvas.DrawBitmap(qrCode, qrX, qrY);
    
    // Save to file
    using var image = surface.Snapshot();
    using var data = image.Encode(SKEncodedImageFormat.Png, 95);
    
    return data.ToArray();
}
```

### 3. Badge Generation System
**Architecture:**
- SVG badges for scalability
- PNG fallback for compatibility
- Embed codes for easy integration
- Caching headers for performance

**Endpoints:**
```
GET /v1/badge/{id}.svg      → SVG badge
GET /v1/badge/{id}.png      → PNG badge
GET /v1/badge/{id}/embed    → Embed codes
GET /v1/badge/static        → Static badge
```

---

## 🧪 Testing Lessons

### 1. Comprehensive API Testing
**Approach:** PowerShell scripts for API testing
**Benefits:**
- Tests real production endpoints
- Catches integration issues
- Validates error handling
- Tests performance

**Template:**
```powershell
function Test-Endpoint {
    param([string]$Url, [string]$Method = "GET", [string]$Body = $null)
    
    try {
        $params = @{ Uri = $Url; Method = $Method; ErrorAction = 'Stop' }
        if ($Body) { $params['Body'] = $Body; $params['ContentType'] = 'application/json' }
        
        $response = Invoke-WebRequest @params
        return @{ Success = $true; StatusCode = $response.StatusCode; Data = $response.Content }
    }
    catch {
        return @{ Success = $false; Error = $_.Exception.Message }
    }
}
```

### 2. Playwright E2E Testing
**Key Insights:**
- Test multiple browsers and viewports
- Use proper selectors
- Implement proper waits
- Test error scenarios

**Configuration:**
```typescript
export default defineConfig({
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox-desktop', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit-desktop', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 12'] } },
  ],
});
```

### 3. Pre-Deployment Testing
**Critical:** Always test builds locally before pushing
**Script:**
```powershell
# Test API build
dotnet build
if ($LASTEXITCODE -ne 0) { exit 1 }

# Test Angular build
npm run build
if ($LASTEXITCODE -ne 0) { exit 1 }

# Test Docker Compose
docker-compose up -d --build
Start-Sleep -Seconds 15

# Test API health
$health = Invoke-RestMethod -Uri "http://localhost:5000/health"
if (-not $health.ok) { exit 1 }
```

---

## 🚀 Deployment Lessons

### 1. Railway Deployment
**Key Insights:**
- Use Docker for consistent builds
- Set proper health check endpoints
- Monitor build logs carefully
- Use environment variables correctly

**Configuration:**
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

### 2. Cloudflare Pages Deployment
**Key Insights:**
- Use GitHub Actions for deployment
- Configure proper build commands
- Set correct output directory
- Monitor build logs

**Workflow:**
```yaml
- uses: actions/checkout@v3
- uses: actions/setup-node@v3
  with:
    node-version: '18'
- run: npm ci
- run: npm run build
- uses: cloudflare/pages-action@v1
  with:
    apiToken: ${{ secrets.CF_API_TOKEN }}
    projectName: your-project-name
    directory: dist
```

### 3. Database Migration Strategy
**Critical:** Apply migrations after deployment
**Process:**
1. Deploy API to Railway
2. Wait for deployment to complete
3. Apply database migrations
4. Test endpoints
5. Deploy frontend to Cloudflare

---

## 🔧 Development Workflow Lessons

### 1. Local Development Setup
**Best Practice:** Use Docker Compose for local development
**Benefits:**
- Consistent environment
- Easy database setup
- No local dependency conflicts
- Production-like testing

**Configuration:**
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
```

### 2. Environment Configuration
**Key Insights:**
- Use different configs for different environments
- Never commit secrets
- Use environment variables for API URLs
- Test with production-like configs

**Angular Environment:**
```typescript
// environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://your-project.up.railway.app'
};
```

### 3. Git Workflow
**Best Practice:** Use conventional commits
**Benefits:**
- Clear commit history
- Automated changelog generation
- Better code review process
- Easier debugging

**Format:**
```
feat: add proof card generation
fix: resolve CORS issues
docs: update deployment guide
test: add comprehensive API tests
```

---

## 🎨 UI/UX Lessons

### 1. Responsive Design
**Key Insights:**
- Mobile-first approach
- Test on real devices
- Use proper breakpoints
- Optimize images for mobile

**CSS Approach:**
```scss
.container {
  padding: 1rem;
  
  @media (min-width: 768px) {
    padding: 2rem;
  }
  
  @media (min-width: 1024px) {
    padding: 3rem;
  }
}
```

### 2. Performance Optimization
**Key Insights:**
- Use OnPush change detection
- Implement virtual scrolling for large lists
- Optimize images
- Use proper caching

**Angular Optimization:**
```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OptimizedComponent {
  trackByFn(index: number, item: any): string {
    return item.id;
  }
}
```

### 3. Error Handling
**Key Insights:**
- Show user-friendly error messages
- Implement proper loading states
- Handle network errors gracefully
- Provide retry mechanisms

**Implementation:**
```typescript
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  handleError(error: any): void {
    console.error('Global error:', error);
    // Send to logging service
    // Show user-friendly message
  }
}
```

---

## 🔐 Security Lessons

### 1. Input Validation
**Key Insights:**
- Validate on both client and server
- Use proper validation libraries
- Sanitize user input
- Implement rate limiting

**Server-Side Validation:**
```csharp
[HttpPost]
public async Task<ActionResult> Create([FromBody] CreateDto dto)
{
    if (!ModelState.IsValid)
        return BadRequest(ModelState);
    
    // Additional validation
    if (string.IsNullOrWhiteSpace(dto.Name))
        return BadRequest("Name is required");
    
    // Implementation
}
```

### 2. CORS Configuration
**Key Insights:**
- Configure CORS properly
- Use specific origins in production
- Test CORS in different browsers
- Monitor CORS errors

**Configuration:**
```csharp
services.AddCors(options =>
{
    options.AddPolicy("AllowAll", builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});
```

### 3. Database Security
**Key Insights:**
- Use parameterized queries
- Implement proper authentication
- Use connection pooling
- Monitor database access

**Best Practice:**
```csharp
public async Task<Data> GetByIdAsync(int id)
{
    return await _context.Data
        .Where(d => d.Id == id)
        .FirstOrDefaultAsync();
}
```

---

## 📊 Monitoring Lessons

### 1. Logging Strategy
**Key Insights:**
- Use structured logging
- Include correlation IDs
- Log at appropriate levels
- Don't log sensitive information

**Implementation:**
```csharp
_logger.LogInformation("Processing proof {ProofId} for user {UserId}", 
    proofId, userId);
```

### 2. Health Checks
**Key Insights:**
- Implement comprehensive health checks
- Monitor external dependencies
- Use proper timeouts
- Return meaningful status

**Configuration:**
```csharp
services.AddHealthChecks()
    .AddDbContext<ApplicationDbContext>()
    .AddCheck<ExternalServiceHealthCheck>("external-service");
```

### 3. Performance Monitoring
**Key Insights:**
- Monitor response times
- Track error rates
- Monitor resource usage
- Set up alerts

**Metrics to Track:**
- API response time
- Database query time
- Memory usage
- CPU usage
- Error rates

---

## 🎯 Success Metrics

### Technical Metrics
- [ ] API response time < 500ms
- [ ] Frontend load time < 3 seconds
- [ ] Test coverage > 80%
- [ ] Zero critical security vulnerabilities
- [ ] 99.9% uptime

### User Experience Metrics
- [ ] Mobile responsive design
- [ ] Accessible (WCAG 2.1 AA)
- [ ] Cross-browser compatibility
- [ ] Intuitive navigation
- [ ] Fast image loading

### Business Metrics
- [ ] Core features working end-to-end
- [ ] User can complete primary workflows
- [ ] Error rates < 1%
- [ ] User satisfaction > 4.5/5

---

## 🔄 Maintenance Schedule

### Daily
- [ ] Monitor deployment status
- [ ] Check error logs
- [ ] Verify critical endpoints

### Weekly
- [ ] Run full test suite
- [ ] Review performance metrics
- [ ] Update dependencies

### Monthly
- [ ] Security audit
- [ ] Performance optimization
- [ ] Documentation updates

### Quarterly
- [ ] Architecture review
- [ ] Technology stack evaluation
- [ ] User feedback analysis

---

## 🚨 Common Pitfalls to Avoid

### 1. CORS Issues
- Don't configure CORS after static files
- Don't forget to test CORS in production
- Don't use overly permissive CORS policies

### 2. Routing Conflicts
- Don't mix Astro and Angular routes without planning
- Don't forget to test routing in production
- Don't ignore route order

### 3. Environment Issues
- Don't commit secrets to version control
- Don't forget to update environment variables
- Don't ignore environment-specific configurations

### 4. Database Issues
- Don't forget to apply migrations
- Don't ignore database performance
- Don't forget to backup data

### 5. Deployment Issues
- Don't skip testing before deployment
- Don't ignore build errors
- Don't forget to monitor after deployment

---

## 🎉 Key Success Factors

### 1. Comprehensive Testing
- API testing with PowerShell scripts
- E2E testing with Playwright
- Pre-deployment testing
- Production monitoring

### 2. Proper Configuration
- CORS configuration
- Environment variables
- Database migrations
- Build configuration

### 3. Monitoring and Logging
- Structured logging
- Health checks
- Performance monitoring
- Error tracking

### 4. Documentation
- API documentation
- Deployment guides
- Troubleshooting guides
- Best practices

### 5. Team Communication
- Clear commit messages
- Code reviews
- Documentation updates
- Knowledge sharing

---

**These lessons learned represent hard-won knowledge from building a production application. Follow these insights to avoid common pitfalls and accelerate your next project!**
