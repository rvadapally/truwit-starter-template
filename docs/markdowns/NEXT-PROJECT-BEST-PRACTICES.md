# Next Project Best Practices Guide

**Based on TruWit Verification App Experience**

This guide consolidates all lessons learned, best practices, and proven patterns from the successful TruWit project to accelerate your next Angular + .NET + Railway + Cloudflare project.

---

## 🎯 Project Architecture Template

### Recommended Stack
```
Frontend: Angular 18+ (SPA) + Astro (Static Pages)
Backend: ASP.NET Core 8.0 (API)
Database: PostgreSQL (Railway Managed)
Hosting: Railway (API) + Cloudflare Pages (Frontend)
Image Processing: SkiaSharp + QRCoder
Testing: Playwright (E2E) + PowerShell (API)
```

### Project Structure
```
project-root/
├── api/                          # ASP.NET Core API
│   ├── Controllers/             # API endpoints
│   ├── Application/             # Business logic
│   │   ├── Services/           # Core services
│   │   ├── DTOs/               # Data transfer objects
│   │   └── Interfaces/         # Service contracts
│   ├── Domain/                 # Domain models
│   ├── Infrastructure/         # Data access
│   ├── CardTemplates/          # Image templates
│   ├── wwwroot/               # Static files
│   └── Dockerfile             # Container config
├── app/                        # Angular SPA
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/          # Singleton services
│   │   │   ├── shared/        # Reusable components
│   │   │   ├── features/      # Feature modules
│   │   │   └── layout/        # Layout components
│   │   ├── environments/      # Environment configs
│   │   └── assets/            # Static assets
│   ├── tests/e2e/             # Playwright tests
│   └── playwright.config.ts   # E2E test config
├── src/                       # Astro static pages
│   ├── pages/                 # Static routes
│   └── components/            # Astro components
├── public/                    # Static assets
├── docker-compose.yml         # Local development
└── scripts/                   # Automation scripts
```

---

## 🚀 Quick Start Checklist

### Phase 1: Project Setup (Day 1)
- [ ] Create GitHub repository
- [ ] Set up Railway project with PostgreSQL
- [ ] Set up Cloudflare Pages project
- [ ] Configure environment variables
- [ ] Set up local Docker development

### Phase 2: Core Development (Week 1)
- [ ] Implement API health endpoint
- [ ] Set up CORS configuration
- [ ] Create basic Angular routing
- [ ] Implement authentication (if needed)
- [ ] Set up database migrations

### Phase 3: Feature Development (Week 2-3)
- [ ] Implement core business logic
- [ ] Add image processing capabilities
- [ ] Create responsive UI components
- [ ] Implement error handling
- [ ] Add comprehensive testing

### Phase 4: Production Deployment (Week 4)
- [ ] Apply database migrations
- [ ] Configure production environments
- [ ] Set up monitoring and logging
- [ ] Run comprehensive test suite
- [ ] Deploy and verify

---

## 🛠️ Essential Configuration Files

### 1. Railway Configuration (`railway.json`)
```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "api/Dockerfile"
  },
  "deploy": {
    "startCommand": "dotnet HumanProof.Api.dll",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100
  }
}
```

### 2. Cloudflare Pages Configuration
```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}
          accountId: ${{ secrets.CF_ACCOUNT_ID }}
          projectName: your-project-name
          directory: dist
```

### 3. Docker Compose (`docker-compose.yml`)
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
    volumes:
      - ./api/uploads:/app/uploads
      - ./api/wwwroot:/app/wwwroot

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

### 4. Angular Environment (`app/src/environments/environment.prod.ts`)
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-project.up.railway.app'
};
```

---

## 🔧 Critical Implementation Patterns

### 1. CORS Configuration (CRITICAL)
```csharp
// api/Program.cs - MUST be in this order
app.UseCors("AllowAll");

app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        // Explicit CORS headers for static files
        ctx.Context.Response.Headers.Append("Access-Control-Allow-Origin", "*");
        ctx.Context.Response.Headers.Append("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
        ctx.Context.Response.Headers.Append("Access-Control-Allow-Headers", "*");
    }
});
```

### 2. Database Migration Pattern
```sql
-- Always use IF NOT EXISTS for safety
ALTER TABLE "YourTable"
ADD COLUMN IF NOT EXISTS "NewColumn" TEXT NULL;

-- Verify migration
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'YourTable' 
AND column_name = 'NewColumn';
```

### 3. Angular Routing Order (CRITICAL)
```typescript
// app/src/app/app.routes.ts
export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 't/:id', component: PublicVerifyComponent },      // More specific first
  { path: 'app/t/:id', component: PublicVerifyComponent },  // More specific first
  { path: 'app', redirectTo: '/', pathMatch: 'full' },     // Less specific after
  { path: '**', redirectTo: '/' }                          // Catch-all last
];
```

### 4. Environment Import Pattern
```typescript
// Always count directory levels carefully
// From: app/src/app/features/component/
// To:   app/src/environments/
// Levels: ../../../../environments/environment

import { environment } from '../../../../environments/environment';
```

### 5. Image Processing with SkiaSharp
```csharp
public class ImageProcessor
{
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
}
```

---

## 🧪 Testing Strategy

### 1. API Testing Script Template
```powershell
# test-api-comprehensive.ps1
param([string]$Environment = 'production')

$ApiUrl = if ($Environment -eq 'local') { "http://localhost:5000" } else { "https://your-project.up.railway.app" }

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

# Test health endpoint
$health = Test-Endpoint "$ApiUrl/health"
if ($health.Success) {
    Write-Host "✅ Health check passed" -ForegroundColor Green
} else {
    Write-Host "❌ Health check failed: $($health.Error)" -ForegroundColor Red
}
```

### 2. Playwright E2E Configuration
```typescript
// app/playwright.config.ts
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['list'], ['json', { outputFile: 'test-results/results.json' }],
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

### 3. Pre-Deployment Testing
```powershell
# pre-deploy-test.ps1
Write-Host "🔍 Pre-Deployment Testing..." -ForegroundColor Cyan

# Test API build
Write-Host "`n📦 Building API..." -ForegroundColor Yellow
cd api
dotnet build
if ($LASTEXITCODE -ne 0) { Write-Host "❌ API build failed!" -ForegroundColor Red; exit 1 }
Write-Host "✅ API build succeeded" -ForegroundColor Green

# Test Angular build
Write-Host "`n📦 Building Angular..." -ForegroundColor Yellow
cd ../app
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "❌ Angular build failed!" -ForegroundColor Red; exit 1 }
Write-Host "✅ Angular build succeeded" -ForegroundColor Green

# Test Docker Compose
Write-Host "`n🐳 Testing with Docker Compose..." -ForegroundColor Yellow
cd ..
docker-compose up -d --build
Start-Sleep -Seconds 15

# Test API health
$health = Invoke-RestMethod -Uri "http://localhost:5000/health"
if ($health.ok) {
    Write-Host "✅ API health check passed" -ForegroundColor Green
} else {
    Write-Host "❌ API health check failed" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ ALL PRE-DEPLOYMENT TESTS PASSED!" -ForegroundColor Green
docker-compose down
```

---

## 🚨 Common Pitfalls & Solutions

### 1. CORS Issues
**Problem:** Static files blocked by CORS policy
**Solution:** Always configure CORS BEFORE static files middleware

### 2. Angular Routing Conflicts
**Problem:** Astro pages intercepting Angular routes
**Solution:** Delete any Astro pages that might conflict with Angular routes

### 3. Environment Import Errors
**Problem:** Cannot find module '../../../environments/environment'
**Solution:** Count directory levels carefully (usually 4 levels up from components)

### 4. Database Migration Issues
**Problem:** New columns not added to existing tables
**Solution:** Always use `IF NOT EXISTS` and verify with `SELECT` queries

### 5. Image Processing Failures
**Problem:** SkiaSharp crashes or produces invalid images
**Solution:** Always dispose of SKSurface, SKBitmap, and SKPaint objects

### 6. Railway Ephemeral Storage
**Problem:** Files lost on redeploy
**Solution:** Implement regenerate-on-miss endpoints for static files

### 7. Cloudflare Cache Issues
**Problem:** Old versions served from cache
**Solution:** Use cache-busting URLs and clear Cloudflare cache after deployment

---

## 📋 Deployment Checklist

### Before Push
- [ ] `dotnet build` succeeds
- [ ] `npm run build` succeeds
- [ ] Docker Compose starts without errors
- [ ] All tests pass locally
- [ ] No console.log statements in production code

### After Railway Deployment
- [ ] Health endpoint responds
- [ ] Database migrations applied
- [ ] CORS headers present
- [ ] Static files accessible
- [ ] API endpoints functional

### After Cloudflare Deployment
- [ ] Homepage loads correctly
- [ ] Angular app routes properly
- [ ] No 404 errors for assets
- [ ] Images display correctly
- [ ] Mobile responsive

### End-to-End Verification
- [ ] Create test record via API
- [ ] View record in frontend
- [ ] All features work in incognito mode
- [ ] No console errors
- [ ] Performance acceptable

---

## 🔍 Monitoring & Debugging

### Railway Logs
```bash
# Watch logs in real-time
railway logs --follow

# Check specific service
railway logs --service api
```

### Cloudflare Analytics
- Monitor build success rate
- Track page load times
- Watch for 404 errors
- Monitor bandwidth usage

### Browser Debugging
```javascript
// Test CORS from browser console
fetch('https://your-api.up.railway.app/health', { method: 'HEAD' })
  .then(r => console.log('CORS OK:', r.headers.get('access-control-allow-origin')))
  .catch(e => console.error('CORS FAIL:', e))

// Test API endpoints
fetch('https://your-api.up.railway.app/v1/your-endpoint')
  .then(r => r.json())
  .then(data => console.log('API Response:', data))
  .catch(e => console.error('API Error:', e))
```

---

## 🎨 UI/UX Best Practices

### Angular Component Structure
```typescript
@Component({
  selector: 'app-feature',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, SharedModule]
})
export class FeatureComponent implements OnInit, OnDestroy {
  // Use signals for reactive state
  data$ = signal<DataType[]>([]);
  loading$ = signal(false);
  
  // Track by functions for performance
  trackByFn(index: number, item: DataType): string {
    return item.id;
  }
  
  // Always unsubscribe
  private destroy$ = new Subject<void>();
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

### Responsive Design
```scss
// Mobile-first approach
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

### Error Handling
```typescript
// Global error handler
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

## 🚀 Performance Optimization

### API Optimization
```csharp
// Use async/await consistently
public async Task<ActionResult<DataDto>> GetData(int id)
{
    var data = await _repository.GetByIdAsync(id);
    if (data == null) return NotFound();
    return Ok(data);
}

// Implement caching
[ResponseCache(Duration = 3600)]
public async Task<ActionResult<DataDto>> GetCachedData(int id)
{
    // Implementation
}
```

### Angular Optimization
```typescript
// Use OnPush change detection
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})

// Use trackBy in *ngFor
<div *ngFor="let item of items; trackBy: trackByFn">

// Use async pipe
<div>{{ data$ | async }}</div>

// Implement virtual scrolling for large lists
<cdk-virtual-scroll-viewport itemSize="50" class="viewport">
  <div *cdkVirtualFor="let item of items">{{ item.name }}</div>
</cdk-virtual-scroll-viewport>
```

### Image Optimization
```csharp
// Compress images
public byte[] CompressImage(byte[] imageData, int quality = 85)
{
    using var input = new MemoryStream(imageData);
    using var output = new MemoryStream();
    using var image = Image.Load(input);
    
    image.SaveAsJpeg(output, new JpegEncoder { Quality = quality });
    return output.ToArray();
}
```

---

## 🔐 Security Best Practices

### API Security
```csharp
// Input validation
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

// SQL injection prevention (use parameters)
public async Task<Data> GetByIdAsync(int id)
{
    return await _context.Data
        .Where(d => d.Id == id)
        .FirstOrDefaultAsync();
}
```

### Frontend Security
```typescript
// Sanitize user input
import { DomSanitizer } from '@angular/platform-browser';

constructor(private sanitizer: DomSanitizer) {}

sanitizeHtml(html: string): SafeHtml {
  return this.sanitizer.sanitize(SecurityContext.HTML, html);
}

// Validate API responses
interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}
```

---

## 📚 Documentation Standards

### API Documentation
```csharp
/// <summary>
/// Creates a new proof from a URL
/// </summary>
/// <param name="request">The proof creation request</param>
/// <returns>The created proof with verification details</returns>
/// <response code="200">Proof created successfully</response>
/// <response code="400">Invalid URL or request data</response>
/// <response code="500">Server error occurred</response>
[HttpPost("url")]
[ProducesResponseType(typeof(ProofDto), StatusCodes.Status200OK)]
[ProducesResponseType(StatusCodes.Status400BadRequest)]
[ProducesResponseType(StatusCodes.Status500InternalServerError)]
public async Task<ActionResult<ProofDto>> CreateFromUrl([FromBody] CreateProofRequest request)
{
    // Implementation
}
```

### Component Documentation
```typescript
/**
 * FeatureComponent displays and manages feature data
 * 
 * @example
 * ```html
 * <app-feature [data]="featureData" (dataChange)="onDataChange($event)">
 * </app-feature>
 * ```
 */
@Component({
  selector: 'app-feature',
  templateUrl: './feature.component.html',
  styleUrls: ['./feature.component.scss']
})
export class FeatureComponent {
  /** Input data for the feature */
  @Input() data: FeatureData[] = [];
  
  /** Emits when data changes */
  @Output() dataChange = new EventEmitter<FeatureData[]>();
}
```

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

## 📞 Support Resources

### Documentation
- [Railway Docs](https://docs.railway.app)
- [Cloudflare Pages](https://developers.cloudflare.com/pages)
- [ASP.NET Core](https://learn.microsoft.com/aspnet/core)
- [Angular](https://angular.io/docs)
- [Playwright](https://playwright.dev)

### Community
- Railway Discord
- Cloudflare Community
- Angular Discord
- Stack Overflow

### Tools
- Railway CLI
- Cloudflare CLI
- Angular CLI
- Playwright Inspector

---

**This guide represents distilled wisdom from a successful production deployment. Follow these patterns to avoid common pitfalls and accelerate your next project!**
