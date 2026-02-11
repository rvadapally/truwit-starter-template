-- Add OpenTimestamps columns for Bitcoin anchoring
-- TruWit: Content provenance with Bitcoin timestamping

ALTER TABLE "VerificationProofs" ADD COLUMN IF NOT EXISTS "OtsProof" bytea;
ALTER TABLE "VerificationProofs" ADD COLUMN IF NOT EXISTS "OtsCreatedAt" timestamp;
ALTER TABLE "VerificationProofs" ADD COLUMN IF NOT EXISTS "OtsConfirmedAt" timestamp;

-- Index for finding proofs that need OTS upgrade (submitted but not confirmed)
CREATE INDEX IF NOT EXISTS ix_verificationproofs_ots_pending 
ON "VerificationProofs"("OtsCreatedAt") 
WHERE "OtsCreatedAt" IS NOT NULL AND "OtsConfirmedAt" IS NULL;

COMMENT ON COLUMN "VerificationProofs"."OtsProof" IS 'Binary OpenTimestamps proof file for Bitcoin anchoring';
COMMENT ON COLUMN "VerificationProofs"."OtsCreatedAt" IS 'When the proof was submitted to OpenTimestamps calendars';
COMMENT ON COLUMN "VerificationProofs"."OtsConfirmedAt" IS 'When Bitcoin blockchain confirmation was received';
