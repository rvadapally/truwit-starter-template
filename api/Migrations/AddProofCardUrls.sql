-- Migration: Add Proof Card URL columns to VerificationProofs table
-- Created: 2025-10-19
-- Purpose: Store URLs for generated proof card images (640x640 and 1024x1024)

-- Add columns for proof card URLs
ALTER TABLE VerificationProofs ADD COLUMN ProofCardSmallUrl TEXT;
ALTER TABLE VerificationProofs ADD COLUMN ProofCardLargeUrl TEXT;

-- Verify migration
SELECT 'Migration completed successfully' as status;
SELECT COUNT(*) as total_proofs FROM VerificationProofs;

