-- C2PA PostgreSQL Migration
-- PostgreSQL-specific schema for deduplication and receipt system

CREATE TABLE IF NOT EXISTS "LinkIndex" (
  "Platform" TEXT NOT NULL,
  "CanonicalId" TEXT NOT NULL,
  "ProofId" TEXT NOT NULL,
  "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("Platform", "CanonicalId")
);

CREATE TABLE IF NOT EXISTS "Assets" (
  "AssetId" TEXT PRIMARY KEY,
  "Sha256" TEXT NOT NULL,
  "MediaType" TEXT,
  "Bytes" BIGINT,
  "DurationSec" REAL,
  "Width" INTEGER,
  "Height" INTEGER,
  "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("Sha256")
);

CREATE TABLE IF NOT EXISTS "Proofs" (
  "Id" TEXT PRIMARY KEY,
  "TrustmarkId" TEXT NOT NULL UNIQUE,
  "AssetId" TEXT,
  "C2paPresent" BOOLEAN NOT NULL DEFAULT false,
  "C2paJson" TEXT,
  "OriginStatus" TEXT NOT NULL,
  "PolicyResult" TEXT NOT NULL,
  "PolicyJson" TEXT,
  "MetadataId" TEXT,
  "ReceiptId" TEXT,
  "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "UpdatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Receipts" (
  "Id" TEXT PRIMARY KEY,
  "ProofId" TEXT NOT NULL UNIQUE,
  "Json" TEXT NOT NULL,
  "PdfPath" TEXT,
  "ReceiptHash" TEXT NOT NULL,
  "Signature" TEXT,
  "SignerPubKey" TEXT,
  "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Idempotency" (
  "IdemKey" TEXT PRIMARY KEY,
  "ProofId" TEXT,
  "ResponseJson" TEXT,
  "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "IX_Proofs_AssetId" ON "Proofs"("AssetId");
CREATE INDEX IF NOT EXISTS "IX_LinkIndex_ProofId" ON "LinkIndex"("ProofId");
CREATE INDEX IF NOT EXISTS "IX_Assets_Sha256" ON "Assets"("Sha256");

-- Backward compatibility view
CREATE OR REPLACE VIEW "v_VerificationProofs" AS
SELECT p."Id",
       a."Sha256" AS "ContentHash",
       NULL AS "PerceptualHash",
       r."Signature",
       p."CreatedAt",
       p."UpdatedAt"
FROM "Proofs" p
LEFT JOIN "Assets" a ON a."AssetId" = p."AssetId"
LEFT JOIN "Receipts" r ON r."ProofId" = p."Id";

