CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

START TRANSACTION;

CREATE TABLE "VerificationMetadata" (
    "Id" TEXT NOT NULL,
    "Prompt" TEXT,
    "ToolName" TEXT,
    "ToolVersion" TEXT,
    "LikenessConsent" TEXT,
    "License" INTEGER NOT NULL,
    "CreatedAt" TEXT NOT NULL,
    "UpdatedAt" TEXT NOT NULL,
    CONSTRAINT "PK_VerificationMetadata" PRIMARY KEY ("Id")
);

CREATE TABLE "VerificationProofs" (
    "Id" TEXT NOT NULL,
    "ProofId" TEXT NOT NULL,
    "ContentHash" TEXT NOT NULL,
    "PerceptualHash" TEXT NOT NULL,
    "Signature" TEXT NOT NULL,
    "CreatedAt" TEXT NOT NULL,
    "UpdatedAt" TEXT NOT NULL,
    "IsDeleted" INTEGER NOT NULL,
    "MetadataId" TEXT NOT NULL,
    CONSTRAINT "PK_VerificationProofs" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_VerificationProofs_VerificationMetadata_MetadataId" FOREIGN KEY ("MetadataId") REFERENCES "VerificationMetadata" ("Id") ON DELETE CASCADE
);

CREATE TABLE "VerificationRequests" (
    "Id" TEXT NOT NULL,
    "Url" TEXT,
    "FileName" TEXT,
    "FileSize" INTEGER,
    "ContentType" TEXT,
    "Status" INTEGER NOT NULL,
    "ErrorMessage" TEXT,
    "CreatedAt" TEXT NOT NULL,
    "UpdatedAt" TEXT NOT NULL,
    "ProofId" TEXT,
    CONSTRAINT "PK_VerificationRequests" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_VerificationRequests_VerificationProofs_ProofId" FOREIGN KEY ("ProofId") REFERENCES "VerificationProofs" ("Id") ON DELETE SET NULL
);

CREATE INDEX "IX_VerificationMetadata_CreatedAt" ON "VerificationMetadata" ("CreatedAt");

CREATE INDEX "IX_VerificationProofs_ContentHash" ON "VerificationProofs" ("ContentHash");

CREATE INDEX "IX_VerificationProofs_CreatedAt" ON "VerificationProofs" ("CreatedAt");

CREATE UNIQUE INDEX "IX_VerificationProofs_MetadataId" ON "VerificationProofs" ("MetadataId");

CREATE UNIQUE INDEX "IX_VerificationProofs_ProofId" ON "VerificationProofs" ("ProofId");

CREATE INDEX "IX_VerificationRequests_CreatedAt" ON "VerificationRequests" ("CreatedAt");

CREATE INDEX "IX_VerificationRequests_ProofId" ON "VerificationRequests" ("ProofId");

CREATE INDEX "IX_VerificationRequests_Status" ON "VerificationRequests" ("Status");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20251005205827_InitialCreate', '8.0.8');

COMMIT;

START TRANSACTION;

ALTER TABLE "VerificationRequests" ALTER COLUMN "Url" TYPE character varying(2000);

ALTER TABLE "VerificationRequests" ALTER COLUMN "UpdatedAt" TYPE timestamp without time zone;

ALTER TABLE "VerificationRequests" ALTER COLUMN "Status" TYPE integer;

ALTER TABLE "VerificationRequests" ALTER COLUMN "ProofId" TYPE uuid;

ALTER TABLE "VerificationRequests" ALTER COLUMN "FileSize" TYPE bigint;

ALTER TABLE "VerificationRequests" ALTER COLUMN "FileName" TYPE character varying(500);

ALTER TABLE "VerificationRequests" ALTER COLUMN "ErrorMessage" TYPE character varying(1000);

ALTER TABLE "VerificationRequests" ALTER COLUMN "CreatedAt" TYPE timestamp without time zone;

ALTER TABLE "VerificationRequests" ALTER COLUMN "ContentType" TYPE character varying(100);

ALTER TABLE "VerificationRequests" ALTER COLUMN "Id" TYPE uuid;

ALTER TABLE "VerificationProofs" ALTER COLUMN "UpdatedAt" TYPE timestamp without time zone;

ALTER TABLE "VerificationProofs" ALTER COLUMN "Signature" TYPE character varying(512);

ALTER TABLE "VerificationProofs" ALTER COLUMN "ProofId" TYPE character varying(50);

ALTER TABLE "VerificationProofs" ALTER COLUMN "PerceptualHash" TYPE character varying(64);

ALTER TABLE "VerificationProofs" ALTER COLUMN "MetadataId" TYPE uuid;

ALTER TABLE "VerificationProofs" ALTER COLUMN "IsDeleted" TYPE boolean;

ALTER TABLE "VerificationProofs" ALTER COLUMN "CreatedAt" TYPE timestamp without time zone;

ALTER TABLE "VerificationProofs" ALTER COLUMN "ContentHash" TYPE character varying(64);

ALTER TABLE "VerificationProofs" ALTER COLUMN "Id" TYPE uuid;

ALTER TABLE "VerificationProofs" ADD "ProofCardLargeUrl" character varying(500);

ALTER TABLE "VerificationProofs" ADD "ProofCardSmallUrl" character varying(500);

ALTER TABLE "VerificationMetadata" ALTER COLUMN "UpdatedAt" TYPE timestamp without time zone;

ALTER TABLE "VerificationMetadata" ALTER COLUMN "ToolVersion" TYPE character varying(50);

ALTER TABLE "VerificationMetadata" ALTER COLUMN "ToolName" TYPE character varying(100);

ALTER TABLE "VerificationMetadata" ALTER COLUMN "Prompt" TYPE character varying(2000);

ALTER TABLE "VerificationMetadata" ALTER COLUMN "LikenessConsent" TYPE character varying(1000);

ALTER TABLE "VerificationMetadata" ALTER COLUMN "License" TYPE integer;

ALTER TABLE "VerificationMetadata" ALTER COLUMN "CreatedAt" TYPE timestamp without time zone;

ALTER TABLE "VerificationMetadata" ALTER COLUMN "Id" TYPE uuid;

CREATE TABLE "AssetGroups" (
    "GroupId" uuid NOT NULL DEFAULT (gen_random_uuid()),
    "PHash" bytea NOT NULL,
    "PHashAlgo" character varying(50) NOT NULL DEFAULT 'phash-dct',
    "PHashBits" integer NOT NULL DEFAULT 64,
    "CreatedAt" timestamp without time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    CONSTRAINT "PK_AssetGroups" PRIMARY KEY ("GroupId")
);

CREATE TABLE "Assets" (
    "AssetId" character varying(50) NOT NULL,
    "Sha256" character varying(64) NOT NULL,
    "MediaType" character varying(100),
    "Bytes" bigint,
    "DurationSec" double precision,
    "Width" integer,
    "Height" integer,
    "CreatedAt" timestamp without time zone NOT NULL,
    CONSTRAINT "PK_Assets" PRIMARY KEY ("AssetId")
);

CREATE TABLE "Identities" (
    "IdentityId" uuid NOT NULL DEFAULT (gen_random_uuid()),
    "Provider" character varying(50) NOT NULL,
    "Handle" character varying(255),
    "DisplayName" character varying(255),
    "FollowerCount" integer,
    "AccountCreatedAt" timestamp without time zone,
    "CreatedAt" timestamp without time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    CONSTRAINT "PK_Identities" PRIMARY KEY ("IdentityId"),
    CONSTRAINT "CK_Identity_Provider" CHECK ("Provider" IN ('x', 'google', 'github', 'behance', 'anon'))
);

CREATE TABLE "LinkIndex" (
    "Platform" character varying(50) NOT NULL,
    "CanonicalId" character varying(200) NOT NULL,
    "ProofId" character varying(50) NOT NULL,
    "CreatedAt" timestamp without time zone NOT NULL,
    CONSTRAINT "PK_LinkIndex" PRIMARY KEY ("Platform", "CanonicalId")
);

CREATE TABLE "Proofs" (
    "Id" character varying(50) NOT NULL,
    "TrustmarkId" character varying(50) NOT NULL,
    "AssetId" character varying(50),
    "C2paPresent" boolean NOT NULL,
    "C2paJson" text,
    "OriginStatus" text NOT NULL,
    "PolicyResult" text NOT NULL,
    "PolicyJson" text,
    "MetadataId" text,
    "ReceiptId" character varying(50),
    "CreatedAt" timestamp without time zone NOT NULL,
    "UpdatedAt" timestamp without time zone NOT NULL,
    "ProofCardSmallUrl" character varying(500),
    "ProofCardLargeUrl" character varying(500),
    CONSTRAINT "PK_Proofs" PRIMARY KEY ("Id")
);

CREATE TABLE "Receipts" (
    "Id" character varying(50) NOT NULL,
    "ProofId" character varying(50) NOT NULL,
    "Json" text NOT NULL,
    "PdfPath" text,
    "ReceiptHash" character varying(64) NOT NULL,
    "Signature" text,
    "SignerPubKey" text,
    "CreatedAt" timestamp without time zone NOT NULL,
    CONSTRAINT "PK_Receipts" PRIMARY KEY ("Id")
);

CREATE TABLE "ServiceSettings" (
    "Key" character varying(255) NOT NULL,
    "Value" text NOT NULL,
    "UpdatedAt" timestamp without time zone NOT NULL,
    "UpdatedBy" character varying(255),
    CONSTRAINT "PK_ServiceSettings" PRIMARY KEY ("Key")
);

CREATE TABLE "AssetFiles" (
    "FileId" uuid NOT NULL DEFAULT (gen_random_uuid()),
    "GroupId" uuid NOT NULL,
    "Sha256" bytea NOT NULL,
    "Bytesize" bigint,
    "Mime" character varying(100),
    "Width" integer,
    "Height" integer,
    "CreatedAt" timestamp without time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    CONSTRAINT "PK_AssetFiles" PRIMARY KEY ("FileId"),
    CONSTRAINT "FK_AssetFiles_AssetGroups_GroupId" FOREIGN KEY ("GroupId") REFERENCES "AssetGroups" ("GroupId") ON DELETE CASCADE
);

CREATE TABLE "ManifestEvents" (
    "EventId" uuid NOT NULL DEFAULT (gen_random_uuid()),
    "GroupId" uuid NOT NULL,
    "Kind" character varying(100) NOT NULL,
    "Payload" jsonb,
    "CreatedAt" timestamp without time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    CONSTRAINT "PK_ManifestEvents" PRIMARY KEY ("EventId"),
    CONSTRAINT "FK_ManifestEvents_AssetGroups_GroupId" FOREIGN KEY ("GroupId") REFERENCES "AssetGroups" ("GroupId") ON DELETE CASCADE
);

CREATE TABLE "Signatures" (
    "SigId" uuid NOT NULL DEFAULT (gen_random_uuid()),
    "FileId" uuid NOT NULL,
    "IdentityId" uuid NOT NULL,
    "SignedAt" timestamp without time zone NOT NULL DEFAULT (CURRENT_TIMESTAMP),
    "SignatureType" character varying(50) NOT NULL DEFAULT 'eddsa',
    "SigBlob" bytea,
    "ClientPublicKey" bytea,
    "StatementJson" jsonb,
    CONSTRAINT "PK_Signatures" PRIMARY KEY ("SigId"),
    CONSTRAINT "FK_Signatures_AssetFiles_FileId" FOREIGN KEY ("FileId") REFERENCES "AssetFiles" ("FileId") ON DELETE CASCADE,
    CONSTRAINT "FK_Signatures_Identities_IdentityId" FOREIGN KEY ("IdentityId") REFERENCES "Identities" ("IdentityId") ON DELETE RESTRICT
);

CREATE INDEX ix_assetfile_group ON "AssetFiles" ("GroupId");

CREATE UNIQUE INDEX "IX_AssetFiles_Sha256" ON "AssetFiles" ("Sha256");

CREATE INDEX ix_assetgroup_phash ON "AssetGroups" ("PHash");

CREATE UNIQUE INDEX "IX_Assets_Sha256" ON "Assets" ("Sha256");

CREATE UNIQUE INDEX "IX_Identities_Provider_Handle" ON "Identities" ("Provider", "Handle");

CREATE INDEX "IX_ManifestEvents_GroupId" ON "ManifestEvents" ("GroupId");

CREATE INDEX "IX_Proofs_AssetId" ON "Proofs" ("AssetId");

CREATE UNIQUE INDEX "IX_Proofs_TrustmarkId" ON "Proofs" ("TrustmarkId");

CREATE INDEX "IX_Receipts_ProofId" ON "Receipts" ("ProofId");

CREATE INDEX "IX_ServiceSettings_Key" ON "ServiceSettings" ("Key");

CREATE INDEX ix_signature_file ON "Signatures" ("FileId");

CREATE INDEX ix_signature_identity ON "Signatures" ("IdentityId");

CREATE UNIQUE INDEX "IX_Signatures_FileId_IdentityId" ON "Signatures" ("FileId", "IdentityId");

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20251024035949_AddMultiSignSchema', '8.0.8');

COMMIT;

