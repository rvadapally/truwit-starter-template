<!-- 7a97ad52-4536-4269-90c6-c987a7413e59 bd40857f-66b0-482e-abd6-48a6f2176454 -->
# Separate Check Status and Generate Proof with UX Improvements

## Backend Changes

### 1. Create Read-Only Lookup Endpoint

**File**: `api/Controllers/ProofsController.cs`

Add new GET endpoint for read-only proof lookup:

```csharp
[HttpGet("proofs/lookup")]
[ProducesResponseType(typeof(ProofLookupResponse), StatusCodes.Status200OK)]
[ProducesResponseType(StatusCodes.Status404NotFound)]
public async Task<ActionResult<ProofLookupResponse>> LookupProof([FromQuery] string url)
```

- Canonicalize URL
- Query `LinkIndex` for existing proof
- If found: return proof summary (trustmarkId, createdAt, origin status, verify/badge links)
- If not found: return 404 with `{ exists: false }`
- **Never download content or create DB records**

**DTO**: Add `ProofLookupResponse` record at end of ProofsController.cs:

```csharp
public record ProofLookupResponse(
    bool Exists,
    string? TrustmarkId,
    string? ProofId,
    DateTime? CreatedAt,
    string? OriginStatus,
    bool? C2paPresent,
    string? VerifyUrl,
    string? BadgeUrl
);
```

### 2. Fix Timezone Handling

**File**: `api/Controllers/ProofsController.cs`

Lines 1212, 1256 - Current code:

```csharp
IssuedAt = DateTime.SpecifyKind(proof.CreatedAt, DateTimeKind.Utc).ToString("yyyy-MM-ddTHH:mm:ssZ")
```

**Keep as-is** - DB stores UTC correctly. Frontend needs fixing.

### 3. YouTube Mode Indicator

**Note**: YouTube mode already stored in DB via `YOUTUBE_VERIFICATION_MODE` setting (line 173). No backend changes needed - just expose in lookup response.

## Frontend Changes

### 4. Add Two-Button UI

**File**: `app/src/app/features/verification/components/verification-form.component.html`

Replace single "Verify URL" button (lines 62-68) with two buttons:

```html
<div class="button-group">
  <button 
    type="button" 
    class="btn-check-status"
    [disabled]="!verificationForm.get('url')?.value || isVerifying"
    (click)="onCheckStatus()">
    Check Status
  </button>
  <button 
    type="button" 
    class="btn-generate-proof-inline"
    [disabled]="!verificationForm.get('url')?.value || isVerifying"
    (click)="onSubmit()">
    Generate Proof
  </button>
</div>
```

Update help text (line 70-72):

```html
<small>
  <strong>Check Status:</strong> See if proof exists (read-only). 
  <strong>Generate Proof:</strong> Create or retrieve trustmark.
</small>
```

### 5. Add Check Status Method

**File**: `app/src/app/features/verification/components/verification-form.component.ts`

Add new method after `onSubmit()`:

```typescript
onCheckStatus(): void {
  const url = this.verificationForm.get('url')?.value;
  if (!url) return;
  
  this.isVerifying = true;
  this.errorMessage = null;
  this.successMessage = null;
  this.verificationStep = 'Checking proof status...';
  
  this.verificationService.lookupProof(url)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (result) => {
        this.isVerifying = false;
        if (result.exists) {
          this.successMessage = `✅ Proof exists! Created: ${new Date(result.createdAt).toLocaleString()}`;
          // Optionally show link to existing proof
        } else {
          this.successMessage = 'ℹ️ No proof found. Click "Generate Proof" to create one.';
        }
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.isVerifying = false;
        this.errorMessage = error.status === 404 
          ? 'No proof found for this URL' 
          : this.getErrorMessage(error);
        this.cdr.markForCheck();
      }
    });
}
```

### 6. Add Lookup Service Method

**File**: `app/src/app/core/services/verification.service.ts`

Add method after `createProofFromUrl()`:

```typescript
lookupProof(url: string): Observable<ProofLookupResponse> {
  return this.apiService.get<ProofLookupResponse>(`/v1/proofs/lookup?url=${encodeURIComponent(url)}`).pipe(
    map(response => response.data || response)
  );
}
```

Add interface in `app/src/app/core/models/index.ts`:

```typescript
export interface ProofLookupResponse {
  exists: boolean;
  trustmarkId?: string;
  proofId?: string;
  createdAt?: string;
  originStatus?: string;
  c2paPresent?: boolean;
  verifyUrl?: string;
  badgeUrl?: string;
}
```

### 7. Fix Idempotency Header

**File**: `app/src/app/core/services/api.service.ts`

Add idempotency key generation and header to POST requests:

```typescript
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';

post<T>(endpoint: string, data: any): Observable<ApiResponse<T>> {
  const fullUrl = `${this.apiUrl}${endpoint}`;
  
  // Generate unique idempotency key per request
  const idempotencyKey = this.generateIdempotencyKey();
  const headers = new HttpHeaders().set('Idempotency-Key', idempotencyKey);
  
  console.log('🌐 ApiService.post called:');
  console.log('📍 URL:', fullUrl);
  console.log('🔑 Idempotency-Key:', idempotencyKey);
  console.log('📤 Data:', data);
  
  return this.http.post<ApiResponse<T>>(fullUrl, data, { headers }).pipe(
    catchError(this.handleError)
  );
}

private generateIdempotencyKey(): string {
  // Generate unique key: timestamp + random string
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
```

**Why this works**:

- `HttpHeaders` is immutable - `.set()` returns a new instance
- Key is unique per request attempt (prevents double-clicks)
- Backend caches responses by key (lines 106-118 of ProofsController.cs)
- Subsequent requests with same key return cached response instantly

### 8. Fix Timezone Display

**File**: `app/src/app/features/verification/components/public-verify.component.html`

Lines 68-73 - Change "Your Time" display to use browser's actual timezone:

```html
<div class="detail-row">
  <span class="label">Issued At (UTC):</span>
  <span class="value">{{ formatUtcTime(verifyData.issuedAt) }}</span>
</div>
<div class="detail-row">
  <span class="label">Issued At (Your Time):</span>
  <span class="value">{{ formatLocalTime(verifyData.issuedAt) }}</span>
</div>
```

**File**: `app/src/app/features/verification/components/public-verify.component.ts`

Add formatting methods:

```typescript
formatUtcTime(isoString: string): string {
  return new Date(isoString).toLocaleString('en-US', { 
    timeZone: 'UTC', 
    timeZoneName: 'short' 
  });
}

formatLocalTime(isoString: string): string {
  return new Date(isoString).toLocaleString('en-US', { 
    timeZoneName: 'short' 
  });
}
```

### 9. Improve C2PA Status Display (Remove Red)

**File**: `app/src/app/features/verification/components/public-verify.component.html`

Lines 76-83 - Change styling and labels:

```html
<div class="detail-row">
  <span class="label">C2PA Signature Status:</span>
  <span class="value c2pa-status" [ngClass]="getC2paStatusClass(verifyData.origin)">
    {{ getC2paStatusText(verifyData.origin) }}
  </span>
</div>
```

**File**: `app/src/app/features/verification/components/public-verify.component.ts`

Add helper methods:

```typescript
getC2paStatusText(origin: any): string {
  if (!origin) return 'Not checked';
  if (origin.c2pa && origin.status === 'valid') return '✓ Signed';
  if (origin.status === 'not_applicable_thumbnail') return 'Skipped (thumbnail mode)';
  return 'Not signed';
}

getC2paStatusClass(origin: any): string {
  if (!origin) return 'status-neutral';
  if (origin.c2pa && origin.status === 'valid') return 'status-success';
  return 'status-neutral'; // No red
}
```

**File**: `app/src/app/features/verification/components/public-verify.component.scss`

Add neutral styling:

```scss
.status-neutral {
  color: #94a3b8; // gray
}
.status-success {
  color: #22c55e; // green
}
```

### 10. Fix Badge Display

**Problem**: Badge images not loading in both Astro and Angular pages because:

1. BadgesController exists but queries wrong repository (legacy `IVerificationRepository` instead of `IProofsRepository`)
2. Uses `proofId` instead of `trustmarkId`
3. Static badge path incorrect

**Solution A: Fix BadgesController to work with new schema**

**File**: `api/Controllers/BadgesController.cs`

Replace constructor and GetBadgeSvg (lines 14-46):

```csharp
private readonly IProofsRepository _proofsRepo;
private readonly ILogger<BadgesController> _logger;

public BadgesController(
    IProofsRepository proofsRepo,
    ILogger<BadgesController> logger)
{
    _proofsRepo = proofsRepo;
    _logger = logger;
}

[HttpGet("badge/{trustmarkId}.svg")]
[ProducesResponseType(typeof(string), StatusCodes.Status200OK)]
[ProducesResponseType(StatusCodes.Status404NotFound)]
public async Task<IActionResult> GetBadgeSvg(string trustmarkId)
{
    try
    {
        var proof = await _proofsRepo.GetByTrustmarkIdAsync(trustmarkId);
        
        if (proof == null)
        {
            return NotFound();
        }

        var badgeSvg = GenerateBadgeSvg(proof, trustmarkId);
        
        Response.Headers["Cache-Control"] = "public, max-age=3600";
        return Content(badgeSvg, "image/svg+xml");
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error generating badge for trustmark {TrustmarkId}", trustmarkId);
        return StatusCode(StatusCodes.Status500InternalServerError);
    }
}
```

Update GenerateBadgeSvg signature (line 131):

```csharp
private string GenerateBadgeSvg(Proof proof, string trustmarkId)
{
    var statusText = proof.C2paPresent ? "✓ Signed & Verified" : "Verified by Truwit";
    var color = proof.C2paPresent ? "#22c55e" : "#0ea5e9";
    
    return $"""
    <svg width="200" height="60" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" style="stop-color:{color};stop-opacity:1" />
                <stop offset="100%" style="stop-color:#0ea5e9;stop-opacity:1" />
            </linearGradient>
        </defs>
        <rect width="200" height="60" fill="url(#grad)" rx="8"/>
        <text x="100" y="35" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="12" font-weight="bold">
            {statusText}
        </text>
        <text x="100" y="50" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="8" opacity="0.8">
            {trustmarkId}
        </text>
    </svg>
    """;
}
```

**Solution B: Copy static badge images to Angular assets**

Badges already exist in `app/src/assets/` but need to be ensured in both places:

1. **Verify images exist**: `verified-by-truwit.png` and `verified-circular-badge.jpg` are already in `app/src/assets/`
2. **No action needed** - images are already correctly placed

**Solution C: Use static badges as fallback**

**File**: `app/src/app/features/verification/components/public-verify.component.ts`

Add method:

```typescript
getBadgeUrl(): string {
  if (!this.verifyData) {
    return 'assets/verified-by-truwit.png'; // fallback
  }
  
  // Try dynamic badge first, fallback to static
  return this.verifyData.badgeUrl || 'assets/verified-by-truwit.png';
}
```

**File**: `app/src/app/features/verification/components/public-verify.component.html`

Line 103:

```html
<img [src]="getBadgeUrl()" 
     (error)="onBadgeError($event)" 
     alt="Truwit TrustMark Badge" 
     class="badge-image">
```

Add error handler in TypeScript:

```typescript
onBadgeError(event: any): void {
  // Fallback to static badge if dynamic fails
  event.target.src = 'assets/verified-by-truwit.png';
}
```

## Documentation Updates

### 11. Update API Documentation

**File**: `api/API_FUNCTIONALITY.md`

Add section:

```markdown
### GET /v1/proofs/lookup?url={url}
Read-only endpoint to check if a proof exists for a URL.
- Returns 200 with proof details if exists
- Returns 404 if not found
- Never creates or modifies data
```

### 12. Update README

**File**: `README.md`

Update verification flow description to mention two-button approach.

## Acceptance Criteria

- ✅ Two distinct buttons: "Check Status" (read-only) and "Generate Proof" (create)
- ✅ GET /v1/proofs/lookup never downloads content or creates records
- ✅ POST /v1/proofs/url remains the only creation path
- ✅ Idempotency-Key header properly sent from Angular
- ✅ Timezone displays correct local time for user
- ✅ C2PA status shows neutral styling (no red for "not signed")
- ✅ Badge displays using static images based on C2PA status
- ✅ YouTube mode visible in UI (as info text)

### To-dos

- [ ] Create GET /v1/proofs/lookup endpoint with canonicalization and read-only repository lookup
- [ ] Replace single 'Verify URL' button with 'Check Status' and 'Generate Proof' buttons in verification form
- [ ] Implement onCheckStatus() method and add lookupProof() service call
- [ ] Verify and fix Idempotency-Key header implementation in api.service.ts
- [ ] Add formatUtcTime() and formatLocalTime() methods to properly display user's local timezone
- [ ] Remove red styling from C2PA status and add neutral 'Not signed' / 'Skipped' labels
- [ ] Create static badge images and implement conditional badge display based on C2PA status
- [ ] Update API_FUNCTIONALITY.md and README.md with new lookup endpoint and two-button flow