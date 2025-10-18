# Truwit API – Current Functionality

This document describes the current API surface and behavior implemented in `api/` based on the controllers, Program setup, DTOs, and services present in the codebase.

Note: Base path examples assume default local hosting. Swagger is enabled at `/swagger`.

## Overview
- Technology: ASP.NET Core (.NET 8), Controllers + DI services
- CORS: AllowAnyOrigin/Method/Header (policy `AllowAll`)
- Swagger: Always on (POC)
- Health: `/health`, `/health/tools`
- Badges: `/v1/badge/{id}.*`
- Proof lifecycle: create proof from URL or file, store artifacts, verify C2PA when applicable, expose verification/lookup
- Storage: Repositories with environment-driven backing (Postgres/SQLite/In-memory)
- External tools: `yt-dlp`, `ffmpeg`, `c2patool` (local and/or hosted verifier)

## Configuration
Application config is read from `appsettings*.json` and environment:
- `Database:Type`: `postgres` | `sqlite` | other (falls back to in-memory)
  - Postgres: `ConnectionStrings:Postgres`
  - SQLite: `ConnectionStrings:Sqlite` (default `Data Source=truwit.db`)
- `C2pa`: `C2paOptions`
  - `UseHostedVerifier` (default true)
  - `HostedVerifierBaseUrl` (default `https://verify.contentcredentials.org/api`)
  - `RequestTimeoutSeconds` (default 20)
  - `MaxRetries` (default 1)
- `Downloader`: `DownloaderOptions`
  - `Bin` (default `/usr/local/bin/yt-dlp`)
  - `TempDir` (default `/tmp/truwit_dl`)
  - `TimeoutSeconds` (default 90)
  - `MaxBytes` (default 524,288,000)
- `C2paTool`: `C2paToolOptions`
  - `Bin` (default `/usr/local/bin/c2patool`)
  - `TimeoutSeconds` (default 20)
- `Features`: `FeatureFlags` (bound for feature gating in controllers)

The API also wires `ISettingsService` for runtime settings (e.g., YouTube verification mode) and caches via `IMemoryCache`.

## Health Endpoints
- `GET /health`
  - Returns `{ ok, timestamp, tools: { yt-dlp, c2patool } }` with tool versions when available. Anonymous.
- `GET /health/tools`
  - Attempts versions for `yt-dlp`, `c2patool` (with Windows full-path fallback), and `ffmpeg`.
  - Returns 200 with versions when all tools detected; otherwise 500. Anonymous.

## Badges
Controller: `Controllers/BadgesController.cs`

- `GET /v1/badge/{id}.svg`
  - Looks up proof by `ProofId`. If found, returns an SVG badge including `ProofId`. 404 if unknown.
  - Cache-Control: `public, max-age=3600`.
- `GET /v1/badge/{id}.png`
  - Returns SVG content with PNG content type as a placeholder (conversion not implemented). Cache headers applied. 404 if proof not found.
- `GET /v1/badge/{id}/embed`
  - Returns JSON with `html`, `markdown`, and `url` for embedding.
- `GET /v1/badge/static`
  - Serves a static PNG from `uploads/verified-by-truwit.png`. 404 if missing.

Program.cs also maps a simplified badge at `GET /badges/{id}.png` that returns a minimal inline SVG (Anonymous).

## Verification (v1)
Controller: `Controllers/VerificationController.cs`

- `POST /api/v1/verification/upload`
  - Form-data: `file` (required), optional `metadata` fields if provided inside `VerificationRequestDto.Metadata`.
  - Flow: delegates to `IVerificationService.VerifyContentAsync`, which ingests, hashes, stores `VerificationProof`, generates a signature, and returns a `VerificationResultDto`.
  - 200: `ApiResponse<VerificationResultDto>`; 400 when file missing; 500 on server error.

- `POST /api/v1/verification/url`
  - Body: `VerificationRequestDto` with `url` (required). Same flow as upload, but ingestion via URL.
  - 200: `ApiResponse<VerificationResultDto>`; 400 when URL missing; 500 on server error.

- `GET /api/v1/verification/proof/{proofId}`
  - Returns stored proof details mapped to `ProofDetailsDto`; 404 if not found.

- `GET /api/v1/verification/validate/{proofId}`
  - Validates signature by recomputing against stored `ContentHash`; 200 with `ApiResponse<bool>`.

DTOs: `Application/DTOs/VerificationDTOs.cs`
- `VerificationRequestDto` contains `Url`, `File`, `Metadata` (prompt/tool/version/licensing/consent).
- `VerificationResultDto` includes `ProofId`, content/perceptual hashes, metadata echo, timestamps, signature, media info, and badge/verify/qr URLs.
- `ProofDetailsDto` for retrieval.
- Standard wrappers: `ApiResponse<T>`, pagination types.

Service: `Application/Services/VerificationService.cs`
- Creates `VerificationRequest` audit entry; uses `IContentIngestService` to process file/URL.
- Computes cryptographic and perceptual hashes; extracts media metadata when available.
- Creates and persists `VerificationProof` with associated `VerificationMetadata` via `IVerificationRepository`.
- Signs a receipt via `IReceiptSigner` and returns `VerificationResultDto`.
- Provides retrieval (`GetProofDetailsAsync`), validation (`ValidateProofAsync`), and listing (`GetAllProofsAsync`).

## Proofs (newer v1 endpoints)
Controller: `Controllers/ProofsController.cs`

- `POST /v1/proofs/url`
  - Body: `CreateProofFromUrlRequest` `{ url, userCookies? }`.
  - Idempotency: honors `Idempotency-Key` request header via `IIdempotencyRepository` (returns cached `CreateProofFromUrlResponse` when present).
  - Platform detection: uses `IUrlCanonicalizer` + `PlatformDetector` to determine platform (`YouTube`, `TikTok`, `Generic`).
  - YouTube handling:
    - Setting `YOUTUBE_VERIFICATION_MODE` via `ISettingsService` toggles `thumbnail` (default, faster) vs `full_video` mode.
    - In `thumbnail` mode: downloads the thumbnail only (`IYouTubeThumbnailDownloader`) and skips C2PA (thumbnails have no manifests).
    - In `full_video` mode: attempts content download and processing; hashes video and runs C2PA verification.
    - For YouTube-specific hashing-only, `IYouTubeVideoHasher` is used to obtain duration and ensure cookies/auth when needed.
    - Optional `userCookies` from the request can be forwarded to downloader for private/protected content.
  - Non-YouTube platforms: downloads full media via `IMediaDownloader` (wrapped `yt-dlp`), hashes, and attempts C2PA verification.
  - Asset de-dupe: reuses existing `Asset` by SHA-256 (`IAssetsRepository.GetBySha256Async`) when available; else inserts new asset metadata.
  - C2PA verification:
    - For thumbnails: returns `C2paCheckResult` with `ManifestFound=false` and `Status="not_applicable_thumbnail"`.
    - For full media: runs `IC2paVerifier` (which may call hosted verifier or local `c2patool`) and stores raw JSON result.
  - Persists `Proof` including trustmark ID, origin status, and C2PA JSON with timestamps.
  - Response: `CreateProofFromUrlResponse` `{ proofId, trustmarkId, verifyUrl, deduped }`.

- `GET /v1/proofs/{id}`
  - Returns `VerifyResponseDto` with a simplified, public-friendly view: `verdict` (mocked green), content hash, MIME/duration/resolution (when known), declared data, issued at, signature status, badge URL, and origin info parsed from C2PA JSON when present.
  - Falls back to legacy `IVerificationService.GetProofDetailsAsync` shape when record not found in the new tables.

- Test/utilities:
  - `GET /v1/proofs/test/stats`: returns counts and IDs for quick DB sanity.
  - `GET /v1/proofs/test/requests`: returns last 10 `VerificationRequests` for inspection.
  - `POST /v1/proofs/test/simple`: inserts a simple test proof directly through `IVerificationRepository` and returns a minimal verify payload.

DTOs at bottom of `ProofsController.cs`:
- `CreateProofRequestDto`, `InputDataDto`, `DeclaredDataDto`, `CreateProofResponseDto`, `VerifyResponseDto` are used for new proof/verify format responses.

## Admin
Controller: `Controllers/AdminController.cs`

- `GET /v1/admin/settings`
  - Returns all settings (key/value) via `ISettingsService`.
- `GET /v1/admin/settings/{key}`
  - Returns a single setting or 404 if not found.
- `PUT /v1/admin/settings/{key}`
  - Body: `{ value: string, updatedBy?: string }`.
  - Validates `YOUTUBE_VERIFICATION_MODE` must be `thumbnail` or `full_video`.
  - Persists via `ISettingsService.SetSettingAsync` and returns a success message.
- `POST /v1/admin/youtube/test-cookies`
  - Attempts to hash a known public YouTube video (`dQw4w9WgXcQ`) via `IYouTubeVideoHasher.HashVideoAsync` to validate cookies/setup.
  - Returns `{ success, message, testVideoId, duration?, error? }`.

## Services and Utilities (selected)
- `IC2paVerifier`/`HostedC2paVerifier`/`C2paVerifier`: orchestrate C2PA verification via hosted or local tools.
- `IC2paLocalParser`: parse local `c2patool` JSON to `C2paCheckResult`.
- `IC2paToolRunner`: wrapper around invoking `c2patool`.
- `IMediaDownloader` (`YtDlpDownloader`): downloads media files via `yt-dlp` with optional cookies.
- `IYouTubeThumbnailDownloader`: fetches video thumbnails for YouTube `thumbnail` mode.
- `IYouTubeVideoHasher`: fast duration/hash enrichment for YouTube without full download.
- `IHasher`/`HashService` and `IHashService`: compute SHA-256 and other hashes.
- `IContentIngestService`: normalizes ingestion for file/URL flows used by `VerificationService`.
- `IMediaInfoService`: extracts duration/resolution when available.
- `IReceiptSigner`: produces receipt signatures included in `VerificationResultDto`.
- `IUrlCanonicalizer` + `PlatformDetector`: normalizes and classifies input URLs.
- `IVerificationStatusTracker`: in-memory progress tracker for long-running verifications.

## Persistence
Repositories under `Infrastructure/Repositories` and `Infrastructure/Data` implement storage for:
- `VerificationProof` and associated `VerificationMetadata`
- `Assets`, `LinkIndex` (URL ↔ asset/proof mapping), `Proofs`, `Receipts`, `Idempotency`

Database selection in `Program.cs`:
- `postgres`: uses `ApplicationDbContext` with Npgsql and `PostgresVerificationRepository`.
- `sqlite`: uses `ApplicationDbContext` with Sqlite but is currently wired to `PostgresVerificationRepository` in code (likely a temporary placeholder; adjust if needed).
- other: falls back to `InMemoryVerificationRepository`.

On startup, when not using in-memory:
- Ensures database creation
- Runs SQL migrations via `SqlMigrationRunner`
- Seeds test data via `DatabaseSeeder`

## Security and Middleware
- `UseHttpsRedirection`, `UseCors("AllowAll")`, `UseAuthorization`
- Custom middleware: `UseRequestId`, `UseGlobalExceptionHandler`
- Controllers marked `[ApiController]`; endpoints mostly anonymous today; integrate auth when enabling protected routes.

## External Dependencies
- `yt-dlp`: media download and metadata; required for URL-based ingestion and video mode.
- `ffmpeg`: version checked; typically required by `yt-dlp` for certain formats.
- `c2patool`: local C2PA manifest inspection; alternatively a hosted verifier is used.

## Notable Behaviors and Flags
- YouTube verification mode is runtime-configurable via admin setting `YOUTUBE_VERIFICATION_MODE`:
  - `thumbnail`: fast, lower bandwidth, skips C2PA (no thumbnail manifests).
  - `full_video`: slower, downloads media, runs C2PA when possible.
- Idempotency support for `POST /v1/proofs/url` via `Idempotency-Key` header to avoid duplicate work.
- Badge and verify URLs are constructed relative to the current host in responses.

## Example Flows
1) Create proof from URL (YouTube, thumbnail mode):
   - POST `/v1/proofs/url` with `{ url }` → downloads thumbnail → SHA-256 → stores/reuses `Asset` → C2PA skipped → creates `Proof` → returns `proofId`, `verifyUrl`, `badge`.
2) Verify media via upload:
   - POST `/api/v1/verification/upload` with `file` → ingest → hashes → metadata → receipt signature → returns `VerificationResultDto` with badge/qr links.

## Swagger
- UI at `/swagger` with a single document `v1` titled “Truwit API v1”.

## Known Quirks
- SQLite branch in `Program.cs` currently registers `PostgresVerificationRepository` (likely a copy/paste mismatch). Consider swapping to a SQLite-compatible repository implementation if needed.

