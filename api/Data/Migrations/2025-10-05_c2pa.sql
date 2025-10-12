-- C2PA Deduplication and Receipt System Migration
-- This migration adds tables for URL deduplication, asset management, and receipt generation

CREATE TABLE IF NOT EXISTS LinkIndex (
  Platform TEXT NOT NULL,
  CanonicalId TEXT NOT NULL,
  ProofId TEXT NOT NULL,
  CreatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (Platform, CanonicalId)
);

CREATE TABLE IF NOT EXISTS Assets (
  AssetId TEXT PRIMARY KEY,
  Sha256 TEXT NOT NULL,
  MediaType TEXT,
  Bytes INTEGER,
  DurationSec REAL,
  Width INTEGER,
  Height INTEGER,
  CreatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (Sha256)
);

CREATE TABLE IF NOT EXISTS Proofs (
  Id TEXT PRIMARY KEY,
  TrustmarkId TEXT NOT NULL UNIQUE,
  AssetId TEXT,
  C2paPresent INTEGER NOT NULL DEFAULT 0,
  C2paJson TEXT,
  OriginStatus TEXT NOT NULL,
  PolicyResult TEXT NOT NULL,
  PolicyJson TEXT,
  MetadataId TEXT,
  ReceiptId TEXT,
  CreatedAt TEXT NOT NULL DEFAULT (datetime('now')),
  UpdatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Receipts (
  Id TEXT PRIMARY KEY,
  ProofId TEXT NOT NULL UNIQUE,
  Json TEXT NOT NULL,
  PdfPath TEXT,
  ReceiptHash TEXT NOT NULL,
  Signature TEXT,
  SignerPubKey TEXT,
  CreatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS Idempotency (
  IdemKey TEXT PRIMARY KEY,
  ProofId TEXT,
  ResponseJson TEXT,
  CreatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS IX_Proofs_AssetId ON Proofs(AssetId);
CREATE INDEX IF NOT EXISTS IX_LinkIndex_ProofId ON LinkIndex(ProofId);
CREATE INDEX IF NOT EXISTS IX_Assets_Sha256 ON Assets(Sha256);

-- Backward compatibility view
CREATE VIEW IF NOT EXISTS v_VerificationProofs AS
SELECT p.Id,
       a.Sha256 AS ContentHash,
       NULL AS PerceptualHash,
       r.Signature,
       p.CreatedAt,
       p.UpdatedAt
FROM Proofs p
LEFT JOIN Assets a ON a.AssetId = p.AssetId
LEFT JOIN Receipts r ON r.ProofId = p.Id;
