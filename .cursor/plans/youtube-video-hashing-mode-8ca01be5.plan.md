<!-- 8ca01be5-e82d-4620-9499-9fa2cf95ccec d42f7368-3d8e-49a9-a7a6-2e0c94c917f2 -->
# YouTube Video Hashing with Admin Mode Toggle

## Overview

Add dual YouTube verification modes with admin control: thumbnail-only (current, reliable fallback) and full video hashing (15-min strategy with database-stored cookies). This eliminates ephemeral filesystem issues and provides operational flexibility.

## Architecture Changes

### 1. Database Layer - ServiceSettings Table

**File**: `api/Data/Migrations/2025-10-16_service_settings.sql`

Add new migration to create `ServiceSettings` table:

```sql
CREATE TABLE IF NOT EXISTS "ServiceSettings" (
  "Key" TEXT PRIMARY KEY,
  "Value" TEXT NOT NULL,
  "UpdatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "UpdatedBy" TEXT
);

-- Initialize default settings
INSERT INTO "ServiceSettings" ("Key", "Value") VALUES 
  ('YOUTUBE_VERIFICATION_MODE', 'thumbnail'),
  ('YOUTUBE_COOKIES', '')
ON CONFLICT ("Key") DO NOTHING;
```

**File**: `api/Domain/Entities/ServiceSetting.cs` (new)

```csharp
public class ServiceSetting
{
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
}
```

**File**: `api/Infrastructure/Data/ApplicationDbContext.cs`

Add DbSet:

```csharp
public DbSet<ServiceSetting> ServiceSettings { get; set; } = null!;
```

### 2. Settings Service - Database CRUD

**File**: `api/Application/Services/ISettingsService.cs` (new)

```csharp
public interface ISettingsService
{
    Task<string?> GetSettingAsync(string key);
    Task SetSettingAsync(string key, string value, string? updatedBy = null);
    Task<Dictionary<string, string>> GetAllSettingsAsync();
}
```

**File**: `api/Infrastructure/Services/SettingsService.cs` (new)

Implement using ApplicationDbContext, include caching for performance.

### 3. YouTube Video Hasher Service

**File**: `api/Application/Services/IYouTubeVideoHasher.cs` (new)

```csharp
public interface IYouTubeVideoHasher
{
    Task<VideoHashResult> HashVideoAsync(string videoId, CancellationToken ct = default);
}

public record VideoHashResult(
    string FilePath,
    string Sha256,
    long Bytes,
    double DurationSeconds,
    bool WasTruncated
);
```

**File**: `api/Application/Services/YouTubeVideoHasher.cs` (new)

Key implementation details:

- Fetch cookies from database via `ISettingsService`
- Write cookies to temporary file `/tmp/yt_cookies_{guid}.txt`
- Call yt-dlp to get video duration first: `yt-dlp --get-duration {url}`
- If duration ≤ 15 min: download full video
- If duration > 15 min: use `--download-sections *0-900` (first 15 minutes)
- Stream output to temp file, calculate SHA256
- Clean up temp cookie file in finally block
- Detect cookie errors ("Sign in to confirm") and throw specific exception

### 4. Admin API Endpoints

**File**: `api/Controllers/AdminController.cs` (new)

```csharp
[ApiController]
[Route("api/v1/admin")]
public class AdminController : ControllerBase
{
    [HttpGet("settings")]
    public async Task<ActionResult<Dictionary<string, string>>> GetSettings()
    
    [HttpGet("settings/{key}")]
    public async Task<ActionResult<string>> GetSetting(string key)
    
    [HttpPut("settings/{key}")]
    public async Task<ActionResult> SetSetting(string key, [FromBody] string value)
    
    [HttpPost("youtube/test-cookies")]
    public async Task<ActionResult<TestCookiesResult>> TestYouTubeCookies()
}
```

Endpoints:

- `GET /v1/admin/settings` - Get all settings
- `GET /v1/admin/settings/YOUTUBE_VERIFICATION_MODE` - Get current mode
- `PUT /v1/admin/settings/YOUTUBE_VERIFICATION_MODE` - Set mode (body: "thumbnail" or "full_video")
- `PUT /v1/admin/settings/YOUTUBE_COOKIES` - Update cookies (body: cookie string)
- `POST /v1/admin/youtube/test-cookies` - Test if current cookies work

### 5. ProofsController Integration

**File**: `api/Controllers/ProofsController.cs`

Modify YouTube URL handling section (around line 120-150):

```csharp
if (platform == MediaPlatform.YouTube)
{
    // Check admin-configured verification mode
    var verificationMode = await _settingsService.GetSettingAsync("YOUTUBE_VERIFICATION_MODE") ?? "thumbnail";
    
    if (verificationMode == "full_video")
    {
        try
        {
            _logger.LogInformation("Using full video hashing for YouTube: {VideoId}", videoId);
            var hashResult = await _youtubeVideoHasher.HashVideoAsync(videoId);
            downloadedFilePath = hashResult.FilePath;
            fileInfo = new FileInfo(downloadedFilePath);
            // Continue with existing flow...
        }
        catch (YouTubeCookieException ex)
        {
            _logger.LogError(ex, "Cookie authentication failed, falling back to thumbnail mode");
            // Fall through to thumbnail mode
        }
    }
    
    if (verificationMode == "thumbnail" || downloadedFilePath == null)
    {
        // Existing thumbnail logic
        _logger.LogInformation("Using thumbnail hashing for YouTube: {VideoId}", videoId);
        downloadedFilePath = await _thumbnailDownloader.DownloadThumbnailAsync(videoId);
        // ... existing code
    }
}
```

Inject new services into constructor:

- `ISettingsService`
- `IYouTubeVideoHasher`

### 6. Service Registration

**File**: `api/Program.cs`

Add registrations around line 70:

```csharp
builder.Services.AddScoped<ISettingsService, SettingsService>();
builder.Services.AddScoped<IYouTubeVideoHasher, YouTubeVideoHasher>();
```

### 7. Exception Types

**File**: `api/Domain/Exceptions/YouTubeExceptions.cs` (new)

```csharp
public class YouTubeCookieException : Exception
{
    public YouTubeCookieException(string message) : base(message) { }
    public YouTubeCookieException(string message, Exception inner) : base(message, inner) { }
}
```

## Testing Strategy

### Local Docker Tests

**File**: `test-youtube-modes-local.ps1` (new)

Test cases:

1. **Test Thumbnail Mode**

   - Set mode to "thumbnail" via API
   - Upload YouTube URL
   - Verify thumbnail hash created

2. **Test Full Video Mode - Short Video**

   - Set mode to "full_video"
   - Set valid cookies
   - Upload YouTube URL (<15 min)
   - Verify full video hashed

3. **Test Full Video Mode - Long Video**

   - Upload YouTube URL (>15 min)
   - Verify only first 15 minutes hashed

4. **Test Mode Toggle**

   - Create proof in thumbnail mode
   - Switch to full_video mode
   - Create proof for same URL
   - Verify different hashes

5. **Test Cookie Expiration Fallback**

   - Set invalid cookies
   - Set mode to full_video
   - Upload URL
   - Verify fallback to thumbnail + error logged

### Manual Testing Workflow

1. Start local Docker: `docker-compose up -d`
2. Run test suite: `.\test-youtube-modes-local.ps1`
3. Verify all tests pass
4. Check logs for proper error handling
5. Test admin UI (if implemented)

## Deployment Checklist

### Pre-Deployment

- [ ] Run local Docker tests - all pass
- [ ] Verify migration SQL syntax
- [ ] Test cookie update via admin API
- [ ] Test mode toggle functionality
- [ ] Check logs for errors

### Railway Deployment

- [ ] Push to GitHub
- [ ] Wait for Railway auto-deploy
- [ ] Run migration (auto-runs via SqlMigrationRunner)
- [ ] Verify ServiceSettings table created
- [ ] Export fresh cookies.txt from browser
- [ ] POST cookies to `/v1/admin/settings/YOUTUBE_COOKIES`
- [ ] Test with thumbnail mode first
- [ ] Switch to full_video mode
- [ ] Test end-to-end YouTube proof creation
- [ ] Monitor logs for errors

### Cookie Refresh Procedure (When Expired)

1. Admin notices "Sign in to confirm" errors in logs
2. Switch mode: `PUT /v1/admin/settings/YOUTUBE_VERIFICATION_MODE` → "thumbnail"
3. Export fresh cookies from browser (Chrome DevTools → Application → Cookies)
4. Update: `PUT /v1/admin/settings/YOUTUBE_COOKIES` → paste cookie string
5. Test: `POST /v1/admin/youtube/test-cookies`
6. If test passes, switch back: `PUT /v1/admin/settings/YOUTUBE_VERIFICATION_MODE` → "full_video"

## Implementation Order

1. Database layer (migration, entity, DbContext update)
2. SettingsService (interface + implementation)
3. YouTubeVideoHasher service
4. AdminController
5. ProofsController integration
6. Service registration in Program.cs
7. Exception types
8. Local test suite
9. Documentation
10. Deploy and verify

## Files to Create/Modify

### New Files (8)

- `api/Data/Migrations/2025-10-16_service_settings.sql`
- `api/Domain/Entities/ServiceSetting.cs`
- `api/Application/Services/ISettingsService.cs`
- `api/Infrastructure/Services/SettingsService.cs`
- `api/Application/Services/IYouTubeVideoHasher.cs`
- `api/Application/Services/YouTubeVideoHasher.cs`
- `api/Controllers/AdminController.cs`
- `api/Domain/Exceptions/YouTubeExceptions.cs`
- `test-youtube-modes-local.ps1`

### Modified Files (3)

- `api/Infrastructure/Data/ApplicationDbContext.cs` (add DbSet)
- `api/Controllers/ProofsController.cs` (add mode check logic)
- `api/Program.cs` (register services)

## Success Criteria

- ✅ Admin can toggle between thumbnail and full_video modes
- ✅ Cookies stored persistently in database
- ✅ Videos >15 min only hash first 15 minutes
- ✅ Graceful fallback to thumbnail on cookie errors
- ✅ All local Docker tests pass
- ✅ Railway deployment successful with zero downtime
- ✅ Cookie refresh procedure documented and tested

### To-dos

- [ ] Create ServiceSettings table migration SQL file with default values
- [ ] Create ServiceSetting entity class and update ApplicationDbContext
- [ ] Implement ISettingsService interface and SettingsService with caching
- [ ] Implement IYouTubeVideoHasher with 15-min strategy and cookie temp file handling
- [ ] Create AdminController with settings CRUD and cookie test endpoints
- [ ] Update ProofsController to check mode and route to appropriate hasher
- [ ] Register new services in Program.cs
- [ ] Create YouTubeCookieException for specific error handling
- [ ] Create comprehensive PowerShell test suite for local Docker testing
- [ ] Deploy to Railway and verify with production testing