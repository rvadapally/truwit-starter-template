-- Create multi-sign tables for Phase 4-7
-- Run with: psql -U postgres -d truwit -f thisfile.sql

CREATE TABLE IF NOT EXISTS "AssetGroups" (
    "GroupId" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "PHash" bytea NOT NULL,
    "PHashAlgo" varchar(50) DEFAULT 'phash-dct' NOT NULL,
    "PHashBits" int DEFAULT 64 NOT NULL,
    "CreatedAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS ix_assetgroup_phash ON "AssetGroups"("PHash");

CREATE TABLE IF NOT EXISTS "AssetFiles" (
    "FileId" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "GroupId" uuid NOT NULL,
    "Sha256" bytea NOT NULL,
    "Bytesize" bigint,
    "Mime" varchar(100),
    "Width" int,
    "Height" int,
    "CreatedAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "FK_AssetFiles_AssetGroups" FOREIGN KEY ("GroupId") REFERENCES "AssetGroups"("GroupId") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS ix_assetfile_sha256 ON "AssetFiles"("Sha256");
CREATE INDEX IF NOT EXISTS ix_assetfile_group ON "AssetFiles"("GroupId");

CREATE TABLE IF NOT EXISTS "Identities" (
    "IdentityId" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "Provider" varchar(50) NOT NULL,
    "Handle" varchar(255),
    "DisplayName" varchar(255),
    "FollowerCount" int,
    "AccountCreatedAt" timestamp,
    "CreatedAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "CK_Identity_Provider" CHECK ("Provider" IN ('x', 'google', 'github', 'behance', 'anon'))
);

CREATE UNIQUE INDEX IF NOT EXISTS ix_identity_provider_handle ON "Identities"("Provider", "Handle");

CREATE TABLE IF NOT EXISTS "Signatures" (
    "SigId" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "FileId" uuid NOT NULL,
    "IdentityId" uuid NOT NULL,
    "SignedAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "SignatureType" varchar(50) DEFAULT 'eddsa' NOT NULL,
    "SigBlob" bytea,
    "ClientPublicKey" bytea,
    "StatementJson" jsonb,
    CONSTRAINT "FK_Signatures_AssetFiles" FOREIGN KEY ("FileId") REFERENCES "AssetFiles"("FileId") ON DELETE CASCADE,
    CONSTRAINT "FK_Signatures_Identities" FOREIGN KEY ("IdentityId") REFERENCES "Identities"("IdentityId") ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS ix_signature_file ON "Signatures"("FileId");
CREATE INDEX IF NOT EXISTS ix_signature_identity ON "Signatures"("IdentityId");
CREATE UNIQUE INDEX IF NOT EXISTS ix_signature_file_identity ON "Signatures"("FileId", "IdentityId");

CREATE TABLE IF NOT EXISTS "ManifestEvents" (
    "EventId" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "GroupId" uuid NOT NULL,
    "Kind" varchar(100) NOT NULL,
    "Payload" jsonb,
    "CreatedAt" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT "FK_ManifestEvents_AssetGroups" FOREIGN KEY ("GroupId") REFERENCES "AssetGroups"("GroupId") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_manifestevent_group ON "ManifestEvents"("GroupId");

