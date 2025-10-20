-- Migration: Add Proof Card URL columns to VerificationProofs table (PostgreSQL)
-- Created: 2025-10-19
-- Purpose: Store URLs for generated proof card images (640x640 and 1024x1024)
-- Database: PostgreSQL (Railway production)

-- Add columns for proof card URLs
ALTER TABLE "VerificationProofs" 
ADD COLUMN "ProofCardSmallUrl" TEXT NULL,
ADD COLUMN "ProofCardLargeUrl" TEXT NULL;

-- Add comments for documentation
COMMENT ON COLUMN "VerificationProofs"."ProofCardSmallUrl" IS 'URL for 640x640 proof card image';
COMMENT ON COLUMN "VerificationProofs"."ProofCardLargeUrl" IS 'URL for 1024x1024 proof card image';

-- Verify migration
SELECT 'Migration completed successfully' as status;
SELECT COUNT(*) as total_proofs FROM "VerificationProofs";
