# TruWit Proof Card Generator - Current Project Context

## Executive Summary
This document provides a comprehensive overview of the existing TruWit project structure to facilitate the implementation of a proof card generation system with backfill capabilities.

---

## Current Architecture Overview

### Technology Stack
- **Backend**: ASP.NET Core 8.0 (Web API)
- **Frontend**: Angular (in `app/` directory)
- **Database**: SQLite (dev) / PostgreSQL (production)
- **ORM**: Entity Framework Core 8.0.8
- **Dependencies**: NLog, Swagger, QuestPDF, NSec.Cryptography, Dapper

### Project Structure

```
humanproof-starter/
├── api/                          # ASP.NET Core Web API
│   ├── Program.cs                # Main entry point (370 lines)
│   ├── HumanProof.Api.csproj     # Project file
│   ├── Domain/                   # Domain layer
│   │   ├── Entities/
│   │   │   ├── C2paEntities.cs   # Asset, Proof, Receipt, LinkIndex, Idempotency
│   │   │   ├── VerificationProof.cs  # VerificationProof, VerificationMetadata, VerificationRequest
│   │   │   └── ServiceSetting.cs
│   │   ├── Enums/
│   │   ├── Exceptions/
│   │   └── Interfaces/
│   ├── Application/              # Application layer
│   │   ├── DTOs/
│   │   └── Services/             # 19 service files
│   ├── Infrastructure/           # Infrastructure layer
│   │   ├── Data/
│   │   │   ├── ApplicationDbContext.cs  # Main EF Core DbContext
│   │   │   ├── DatabaseSeeder.cs
│   │   │   └── SqlMigrationRunner.cs
│   │   ├── Repositories/         # 7 repository files
│   │   └── Services/             # 5 service files
│   ├── Controllers/              # 4 API controllers
│   │   ├── AdminController.cs
│   │   ├── BadgesController.cs
│   │   ├── ProofsController.cs
│   │   └── VerificationController.cs
│   └── Migrations/
├── app/                          # Angular application (main UI)
│   └── src/
│       └── assets/               # Frontend assets location
│           ├── signed_badge.png
│           ├── verified-by-truwit.png
│           └── [other images]
├── web/                          # Separate Angular app (?)
├── public/                       # Static public assets
│   └── images/
└── [other files]
```

---

## Existing Database Schema

### ApplicationDbContext (Infrastructure/Data/ApplicationDbContext.cs)

The project uses **Entity Framework Core** with the following DbSets:

#### Primary Entities:

1. **VerificationProof** (table: VerificationProofs)
   - `Id` (Guid, PK)
   - `ProofId` (string, unique index, max 50 chars) - **This is the short ID used in URLs**
   - `ContentHash` (string, 64 chars)
   - `PerceptualHash` (string, 64 chars)
   - `Signature` (string, 512 chars)
   - `CreatedAt`, `UpdatedAt` (DateTime)
   - `IsDeleted` (bool) - **Soft delete enabled**
   - `MetadataId` (Guid, FK)
   - **Navigation**: `Metadata` (one-to-one with VerificationMetadata)

2. **Proof** (table: Proofs) - C2PA verification entity
   - `Id` (string, PK, max 50)
   - `TrustmarkId` (string, unique, max 50)
   - `AssetId` (string, max 50)
   - `C2paPresent` (bool)
   - `C2paJson`, `PolicyJson` (string)
   - `OriginStatus`, `PolicyResult` (string)
   - `MetadataId`, `ReceiptId` (string)
   - `CreatedAt`, `UpdatedAt` (DateTime)

3. **Asset** (table: Assets)
   - `AssetId` (string, PK, max 50)
   - `Sha256` (string, unique, 64 chars)
   - `MediaType` (string)
   - `Bytes`, `DurationSec`, `Width`, `Height` (numeric)
   - `CreatedAt` (DateTime)

4. **Receipt** (table: Receipts)
   - `Id` (string, PK)
   - `ProofId` (string, indexed)
   - `Json` (string)
   - `PdfPath` (string)
   - `ReceiptHash` (string, 64 chars)
   - `Signature`, `SignerPubKey` (string)
   - `CreatedAt` (DateTime)

#### Connection String Configuration:
- **SQLite** (default dev): `"Data Source=truwit.db"`
- **PostgreSQL** (production): Configured via `ConnectionStrings:Postgres` in appsettings.json

---

## Database Relationships & Entity Analysis

### Two Proof Systems Coexist:

1. **VerificationProof** system:
   - Used for user-facing verification proofs
   - Has `ProofId` (8-char alphanumeric, e.g., "aBc12DeF")
   - Links to `VerificationMetadata` (prompt, tool info, license)
   - ProofService generates these IDs

2. **Proof** (C2PA) system:
   - Used for C2PA metadata verification
   - Has `TrustmarkId` (unique identifier)
   - Links to `Asset` via `AssetId`
   - Links to `Receipt` via `ReceiptId`

**Key Question for Implementation**: Which entity should get the proof cards?
- **Option A**: Add columns to `VerificationProof` entity
- **Option B**: Add columns to `Proof` (C2PA) entity
- **Option C**: Create separate `ProofCard` entity linked to both

---

## Existing Services

### ProofService (Infrastructure/Services/ProofService.cs)
- **Current Functionality**:
  - `GenerateProofIdAsync()` - Generates 8-char alphanumeric IDs
  - `CreateProofAsync(VerificationRequest)` - Creates new verification proof
  - `GetProofAsync(proofId)` - Retrieves proof by ProofId
  - `ValidateProofAsync(proofId)` - Validates proof exists

**This service is a natural place to integrate card generation.**

---

## Program.cs Analysis

### Current Structure (lines 1-381):
1. **Lines 1-17**: NLog initialization
2. **Lines 18-101**: Service registration
   - Controllers, Swagger, CORS, HttpClient
   - Memory cache (already registered!)
   - 15+ domain services registered
3. **Lines 110-149**: Database provider switching (SQLite/PostgreSQL/InMemory)
4. **Lines 151-178**: Database initialization on startup
   - `EnsureCreatedAsync()`
   - SQL migration runner
   - Database seeding
5. **Lines 180-352**: Middleware pipeline & health check endpoints
6. **Lines 354-367**: Badge SVG endpoint (`/badges/{id}.png`)

### Integration Points for Proof Card Generator:

**Option 1: Extend existing ProofService**
- Add card generation methods to `IProofService` / `ProofService`
- Generate cards during `CreateProofAsync()`
- No CLI needed, automatic generation

**Option 2: Create CLI commands in Program.cs**
- Add command-line argument parsing (lines 17-20)
- Run before `app.Run()` (lines 151-178 area)
- Requires scope creation (pattern already exists)

**Option 3: Create separate console tool project**
- New project: `HumanProof.Tools`
- Reference `HumanProof.Api` project
- Own `Program.cs` with DbContext access

---

## Asset Serving Strategy

### Current Setup:
- **Angular App** (`app/`): Uses `app/src/assets/` for bundled assets
- **API Static Files**: Currently NOT serving static files (no `UseStaticFiles()` in Program.cs)
- **Badge Endpoint**: Dynamic SVG generation at `/badges/{id}.png`

### Recommended Approach for Proof Cards:

1. **Storage Location**:
   ```
   api/wwwroot/assets/proof/
     ├── {shortId}-640.png    (640x640 cards)
     └── {shortId}-1024.png   (1024x1024 cards)
   ```

2. **Add to Program.cs** (after line 188):
   ```csharp
   app.UseStaticFiles(); // Enable static file serving
   ```

3. **Database Schema Addition** (choose one):
   
   **Option A - Add to VerificationProof**:
   ```csharp
   public string? ProofCardSmallUrl { get; set; }  // 640x640
   public string? ProofCardLargeUrl { get; set; }  // 1024x1024
   ```
   
   **Option B - Add to Proof (C2PA)**:
   ```csharp
   public string? ProofCardSmallUrl { get; set; }
   public string? ProofCardLargeUrl { get; set; }
   ```

4. **Public URLs**:
   ```
   https://truwit.ai/assets/proof/{shortId}-640.png
   https://truwit.ai/assets/proof/{shortId}-1024.png
   ```

---

## Badge Assets

### Existing Badge Files:
- `app/src/assets/signed_badge.png` (untracked)
- `app/src/assets/verified-by-truwit.png`
- `app/src/assets/verified-by-truwit.JPG`
- `app/src/assets/verified-circular-badge.jpg`
- `images/signed_badge.png` (untracked)
- `public/images/signed_badge.png` (untracked)

### Recommended for Proof Cards:
- Use: `app/src/assets/verified-circular-badge.jpg`
- Copy to: `api/wwwroot/assets/badges/verified_truwit.png`
- Reference in generator config

---

## NuGet Packages Needed

### Already Installed:
- ✅ Microsoft.EntityFrameworkCore (8.0.8)
- ✅ Microsoft.EntityFrameworkCore.Design (8.0.8)
- ✅ QuestPDF (2024.12.1) - Can generate PDFs/images
- ✅ System.Text.Json (8.0.5)

### Need to Add:
- ❌ SkiaSharp (for image manipulation)
- ❌ SkiaSharp.NativeAssets.Linux.NoDependencies (for Linux deployment)
- ❌ QRCoder (for QR code generation)

---

## Deployment Considerations

### Current Deployment:
- **Railway**: Production hosting (truwit-starter-template-production.up.railway.app)
- **Local**: `start.bat` / `stop.bat` scripts
- **Database**: SQLite (dev), PostgreSQL (production via Railway)

### OS Compatibility:
- **Current**: Windows 10 (26200) with PowerShell
- **Production**: Likely Linux on Railway
- **Important**: Avoid `System.Drawing.Bitmap` - use SkiaSharp only for cross-platform compatibility

### Static Files in Docker:
- Ensure `wwwroot/` folder is included in Docker image
- Verify Railway serves static files correctly
- May need to update `Dockerfile` to copy `wwwroot/`

---

## Git Status

### Uncommitted Changes:
- `api/cookies.txt` (modified)
- `app/src/assets/signed_badge.png` (untracked)
- `images/signed_badge.png` (untracked)
- `public/images/signed_badge.png` (untracked)

**Recommendation**: Clean up duplicate badge files before implementing proof card system.

---

## Implementation Recommendations

### Phase 1: Preparation
1. Choose target entity: `VerificationProof` or `Proof`?
2. Add proof card URL columns to chosen entity
3. Create EF Core migration
4. Clean up duplicate badge assets
5. Choose badge file for proof cards

### Phase 2: Generator Setup
1. Install NuGet packages (SkiaSharp, QRCoder)
2. Create `ProofCardGenerator` service
3. Create options class with configurable paths
4. Add `wwwroot/assets/proof/` directory
5. Enable static file serving in Program.cs

### Phase 3: Integration
1. Extend `ProofService` or create new service
2. Add card generation to proof creation workflow
3. Implement backfill command (CLI or endpoint)
4. Implement truncate command for testing

### Phase 4: Testing & Deployment
1. Test locally with SQLite
2. Test backfill on existing data
3. Update Dockerfile if needed
4. Test on Railway staging
5. Deploy to production

---

## Critical Questions to Answer

Before proceeding with implementation, clarify:

1. **Which entity should store proof card URLs?**
   - a) `VerificationProof` (user-facing proofs with ProofId)
   - b) `Proof` (C2PA verification proofs with TrustmarkId)
   - c) Both (separate proof card URLs for each system)

2. **When should cards be generated?**
   - a) Automatically during proof creation
   - b) On-demand via CLI command
   - c) Both (auto + backfill capability)

3. **Which badge asset should be used?**
   - a) `verified-circular-badge.jpg`
   - b) `verified-by-truwit.png`
   - c) Create new badge design

4. **Storage location preference?**
   - a) `api/wwwroot/assets/proof/` (served by API)
   - b) `app/src/assets/proof/` (bundled with Angular)
   - c) External storage (S3, Azure Blob, etc.)

5. **URL structure?**
   - a) `https://truwit.ai/assets/proof/{shortId}-{size}.png`
   - b) `https://truwit.ai/api/cards/{shortId}?size={size}`
   - c) `https://cdn.truwit.ai/proof/{shortId}-{size}.png`

---

## Script Issues Identified

The provided bash script has several problems for this Windows/cross-platform project:

1. **Bash syntax** - Won't work natively on Windows (current dev environment)
2. **Perl inline editing** - Extremely fragile, won't match existing Program.cs structure
3. **System.Drawing.Bitmap usage** - Will fail on Linux (Railway deployment)
4. **Hardcoded paths** - Doesn't match actual project structure (`web/public` vs `app/src/assets`)
5. **New DbContext creation** - Duplicates existing `ApplicationDbContext`
6. **No entity choice** - Unclear which proof entity to extend

---

## Next Steps

1. **User must answer critical questions above**
2. Create implementation plan based on answers
3. Implement generator service with proper paths
4. Add EF Core migration for chosen entity
5. Test locally before deployment

---

*Document created: 2025-10-19*
*Project: TruWit HumanProof Starter*
*Purpose: Provide context for proof card generator implementation*

