# API Data Flow and Table Writes (Current Behavior)

This doc summarizes how the server currently behaves for the key user actions and which database tables are written. The API is configured for Postgres only.

## Key Endpoints (UI flows)

- Verify/Check URL (create proof from URL)
  - `POST v1/proofs/url` (ProofsController.CreateProofFromUrl)
- Verify/Check existing by URL
  - `GET v1/proofs/lookup?url=...` (not shown above, but part of ProofsController)
- Verify uploaded file
  - `POST api/v1/verification/upload` (VerificationController.UploadFile)
- Verify URL (legacy verification path)
  - `POST api/v1/verification/url` (VerificationController.VerifyUrl)
- Get proof details
  - `GET api/v1/verification/proof/{proofId}` (VerificationController.GetProofDetails)
- Badge/embeds (read-only, except proof-card regeneration updates small/large URLs)
  - `GET v1/badge/{id}.svg|png|/embed` (BadgesController)
  - `GET cards/proof/{proofId}-{size}.png` (ProofCardController.RegenerateCard)

## Tables Overview

- "Assets": stores file metadata (sha256, media type, bytes, dimensions)
- "Proofs": canonical proof records (trustmark id, c2pa results, asset linkage, proof card URLs)
- "Receipts": signed receipt JSON and optional PDF path
- "LinkIndex": mapping of platform + canonicalId → proofId (dedupe/lookup)
- "Idempotency": tracks idempotent request key and cached response
- Legacy verification tables (used by older flows and UploadFile/ProofCard regeneration):
  - "VerificationRequests": requests and inputs
  - "VerificationProofs": per-request proof output
  - "VerificationMetadata": extra metadata

## Flow: Create Proof From URL (POST v1/proofs/url)

High level sequence (ProofsController + services):

1) Input validation and URL normalization
   - Reads feature flags and settings
   - Determines platform (YouTube vs. other)
   - Optional Idempotency: header `Idempotency-Key`
     - Writes: "Idempotency" (InsertIfAbsent once)
     - On completion: updates "Idempotency" with `ProofId` and `ResponseJson`

2) Download or thumbnail selection and hashing
   - Downloads media (or YouTube thumbnail in thumbnail mode)
   - Computes SHA256

3) Asset upsert
   - Tries to find existing by SHA256
   - If absent: inserts into "Assets"

4) C2PA verification
   - If YouTube thumbnail mode: skips C2PA (no manifests on thumbnails)
   - Otherwise runs hosted/local verifier and captures results

5) Proof create/upsert
   - Inserts/updates "Proofs" with:
     - Id (GUID), TrustmarkId (TW- prefixed), AssetId
     - C2paPresent, C2paJson, OriginStatus, PolicyResult, PolicyJson
     - MetadataId, ReceiptId (may be null initially)
     - ProofCardSmallUrl/ProofCardLargeUrl initially null

6) Link index record
   - Inserts into "LinkIndex" (platform, canonicalId → proofId) for faster lookups and dedupe

7) Receipt (optional when enabled)
   - Inserts into "Receipts" with JSON, receipt hash, signature, signer pubkey, pdf path

Primary writes in this flow:
- "Idempotency" (optional), "Assets", "Proofs", "LinkIndex", "Receipts" (optional)

## Flow: Verify/Check URL (GET v1/proofs/lookup)

- Reads from "LinkIndex" to resolve proofId by URL-derived canonicalId
- If found, reads from "Proofs" to return details
- No writes on successful lookup

## Flow: Verify Uploaded File (POST api/v1/verification/upload)

- Path mirrors the URL flow but sources file from multipart form
- Calls VerificationService which in turn uses hashing/C2PA services
- Current implementation persists via the newer tables as part of shared services:
  - Writes to "Assets" (if new)
  - Writes to "Proofs" with derived TrustmarkId and C2PA results
  - May create a "Receipts" entry when signing is enabled
  - Legacy tables may be populated in some branches depending on service behavior

Note: The legacy verification endpoints under `api/v1/verification/*` previously centered on "VerificationRequests" and "VerificationProofs"; today the codebase is in transition to the unified "Proofs" model used by the `v1/proofs/*` routes. If you see mixed writes, that is why.

## Flow: Proof Card Regeneration (GET cards/proof/{proofId}-{size}.png)

- On demand, re-generates the proof card PNG from template and updates the corresponding record:
  - If found in "VerificationProofs": updates `ProofCardSmallUrl` or `ProofCardLargeUrl` on that entity via `VerificationRepository`
  - If found in "Proofs": updates "Proofs" fields `ProofCardSmallUrl`/`ProofCardLargeUrl` via `ProofsRepository.UpdateAsync`

Writes:
- File written to `wwwroot/assets/proof/...`
- DB update to either "VerificationProofs" or "Proofs" URLs field

## Where to Look in Code

- Controllers
  - `api/Controllers/ProofsController.cs`: URL-based proof creation, lookups, C2PA logic flow
  - `api/Controllers/VerificationController.cs`: legacy upload/url verify, proof details
  - `api/Controllers/ProofCardController.cs`: card regeneration and URL updates
  - `api/Controllers/BadgesController.cs`: badges (read-only)

- Repositories (Dapper over EF connection)
  - `api/Infrastructure/Repositories/AssetsRepository.cs`: writes to "Assets"
  - `api/Infrastructure/Repositories/ProofsRepository.cs`: writes/updates to "Proofs"
  - `api/Infrastructure/Repositories/ReceiptsRepository.cs`: writes to "Receipts"
  - `api/Infrastructure/Repositories/LinkIndexRepository.cs`: writes to "LinkIndex"
  - `api/Infrastructure/Repositories/IdempotencyRepository.cs`: writes to "Idempotency"
  - Legacy: `PostgresVerificationRepository` for older verification tables

## How To Inspect Data (Postgres)

Examples using psql (note quoted identifiers):

```
-- Most recent proofs
SELECT "Id","TrustmarkId","AssetId","C2paPresent","CreatedAt"
FROM "Proofs"
ORDER BY "CreatedAt" DESC
LIMIT 10;

-- Find proof by trustmark
SELECT * FROM "Proofs" WHERE "TrustmarkId" = 'TW-...';

-- Assets by hash
SELECT * FROM "Assets" WHERE "Sha256" = '...';

-- LinkIndex lookup by URL-derived canonical id
SELECT * FROM "LinkIndex" WHERE "Platform"='youtube' AND "CanonicalId"='dQw4w9WgXcQ';

-- Receipts for a proof
SELECT * FROM "Receipts" WHERE "ProofId" = '...';

-- Idempotency cache
SELECT * FROM "Idempotency" ORDER BY "CreatedAt" DESC LIMIT 10;
```

## Logging Tips

- Controllers log high-level steps (look for "CreateProofFromUrl", "Downloading", "C2PA verification").
- Repositories log inserts/updates and row counts (e.g., "Proof inserted/updated").
- Enable debug/trace logging in appsettings for deeper inspection if needed.

## Current State Notes

- Postgres-only: app is configured to use Npgsql and Postgres repositories.
- Dual model: newer `v1/proofs/*` routes write to unified "Proofs" and related tables; legacy `api/v1/verification/*` may still touch legacy verification tables. Over time these should converge on the "Proofs" model.

