-- PostgreSQL Queries to Check URLs in Database
-- Run these queries to see where URLs are stored

-- ==============================================
-- 1. LEGACY SYSTEM - VerificationRequests Table
-- ==============================================
-- This shows URLs from the legacy verification system
SELECT 
    "Id",
    "Url",
    "FileName",
    "FileSize",
    "ContentType",
    "Status",
    "ErrorMessage",
    "CreatedAt",
    "UpdatedAt",
    "ProofId"
FROM "VerificationRequests" 
WHERE "Url" IS NOT NULL
ORDER BY "CreatedAt" DESC;

-- Count of URLs in legacy system
SELECT COUNT(*) as LegacyUrlCount
FROM "VerificationRequests" 
WHERE "Url" IS NOT NULL;

-- ==============================================
-- 2. NEW C2PA SYSTEM - LinkIndex Table
-- ==============================================
-- This shows canonical URL mappings (Platform + CanonicalId)
SELECT 
    "Platform",
    "CanonicalId",
    "ProofId",
    "CreatedAt"
FROM "LinkIndex"
ORDER BY "CreatedAt" DESC;

-- Count of canonical mappings
SELECT COUNT(*) as CanonicalMappingCount
FROM "LinkIndex";

-- ==============================================
-- 3. RECEIPTS - Original URLs in JSON
-- ==============================================
-- This shows original URLs stored in receipt JSON
SELECT 
    "Id",
    "ProofId",
    "Json",
    "CreatedAt"
FROM "Receipts"
ORDER BY "CreatedAt" DESC;

-- Extract URLs from receipt JSON using PostgreSQL JSON functions
SELECT 
    "Id",
    "ProofId",
    "Json"->>'url' as "ExtractedUrl",
    "CreatedAt"
FROM "Receipts"
WHERE "Json" ? 'url'
ORDER BY "CreatedAt" DESC;

-- ==============================================
-- 4. COMBINED VIEW - All URL Sources
-- ==============================================
-- Show all URLs from all sources
SELECT 
    'Legacy' as "Source",
    "Id" as "RecordId",
    "Url" as "OriginalUrl",
    NULL as "Platform",
    NULL as "CanonicalId",
    "ProofId",
    "CreatedAt"
FROM "VerificationRequests" 
WHERE "Url" IS NOT NULL

UNION ALL

SELECT 
    'Receipt' as "Source",
    "Id" as "RecordId",
    "Json"->>'url' as "OriginalUrl",
    NULL as "Platform",
    NULL as "CanonicalId",
    "ProofId",
    "CreatedAt"
FROM "Receipts"
WHERE "Json" ? 'url'

ORDER BY "CreatedAt" DESC;

-- ==============================================
-- 5. PROOF CARDS - URLs for Generated Cards
-- ==============================================
-- Check if proof cards have URLs
SELECT 
    "Id",
    "TrustmarkId",
    "ProofCardSmallUrl",
    "ProofCardLargeUrl",
    "CreatedAt"
FROM "Proofs"
WHERE "ProofCardSmallUrl" IS NOT NULL OR "ProofCardLargeUrl" IS NOT NULL
ORDER BY "CreatedAt" DESC;

-- Legacy proof cards
SELECT 
    "Id",
    "ProofId",
    "ProofCardSmallUrl",
    "ProofCardLargeUrl",
    "CreatedAt"
FROM "VerificationProofs"
WHERE "ProofCardSmallUrl" IS NOT NULL OR "ProofCardLargeUrl" IS NOT NULL
ORDER BY "CreatedAt" DESC;

-- ==============================================
-- 6. SUMMARY STATISTICS
-- ==============================================
SELECT 
    'Legacy URLs' as "Type",
    COUNT(*) as "Count"
FROM "VerificationRequests" 
WHERE "Url" IS NOT NULL

UNION ALL

SELECT 
    'Canonical Mappings' as "Type",
    COUNT(*) as "Count"
FROM "LinkIndex"

UNION ALL

SELECT 
    'Receipts with URLs' as "Type",
    COUNT(*) as "Count"
FROM "Receipts"
WHERE "Json" ? 'url'

UNION ALL

SELECT 
    'Proof Cards (New)' as "Type",
    COUNT(*) as "Count"
FROM "Proofs"
WHERE "ProofCardSmallUrl" IS NOT NULL

UNION ALL

SELECT 
    'Proof Cards (Legacy)' as "Type",
    COUNT(*) as "Count"
FROM "VerificationProofs"
WHERE "ProofCardSmallUrl" IS NOT NULL;
