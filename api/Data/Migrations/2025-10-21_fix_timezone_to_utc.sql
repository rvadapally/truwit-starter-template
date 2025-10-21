-- Fix timezone: Convert all Central Time timestamps to UTC
-- Central Time is UTC-5 (CDT) or UTC-6 (CST), avg UTC-5.5 for safety
-- For existing data created in October 2025, likely CDT (UTC-5)

-- Update Proofs table
UPDATE "Proofs"
SET 
    "CreatedAt" = "CreatedAt" + INTERVAL '5 hours',
    "UpdatedAt" = "UpdatedAt" + INTERVAL '5 hours'
WHERE "CreatedAt" IS NOT NULL;

-- Update Assets table
UPDATE "Assets"
SET "CreatedAt" = "CreatedAt" + INTERVAL '5 hours'
WHERE "CreatedAt" IS NOT NULL;

-- Update Receipts table
UPDATE "Receipts"
SET "CreatedAt" = "CreatedAt" + INTERVAL '5 hours'
WHERE "CreatedAt" IS NOT NULL;

-- Update LinkIndex table
UPDATE "LinkIndex"
SET "CreatedAt" = "CreatedAt" + INTERVAL '5 hours'
WHERE "CreatedAt" IS NOT NULL;

-- Update Idempotency table
UPDATE "Idempotency"
SET "CreatedAt" = "CreatedAt" + INTERVAL '5 hours'
WHERE "CreatedAt" IS NOT NULL;

-- Update VerificationProofs table (if exists)
UPDATE "VerificationProofs"
SET 
    "CreatedAt" = "CreatedAt" + INTERVAL '5 hours',
    "UpdatedAt" = "UpdatedAt" + INTERVAL '5 hours'
WHERE "CreatedAt" IS NOT NULL;

-- Update VerificationMetadata table (if exists)
UPDATE "VerificationMetadata"
SET 
    "CreatedAt" = "CreatedAt" + INTERVAL '5 hours',
    "UpdatedAt" = "UpdatedAt" + INTERVAL '5 hours'
WHERE "CreatedAt" IS NOT NULL;

-- Update VerificationRequest table (if exists)
UPDATE "VerificationRequest"
SET 
    "CreatedAt" = "CreatedAt" + INTERVAL '5 hours',
    "UpdatedAt" = "UpdatedAt" + INTERVAL '5 hours'
WHERE "CreatedAt" IS NOT NULL;
