-- TruWit: Subscribers table for waitlist/newsletter
-- Migration: 2026-02-10_postgres_subscribers.sql

CREATE TABLE IF NOT EXISTS "Subscribers" (
    "Id" SERIAL PRIMARY KEY,
    "Email" VARCHAR(255) NOT NULL,
    "Source" VARCHAR(50),
    "ReferralCode" VARCHAR(50),
    "IsVerified" BOOLEAN NOT NULL DEFAULT FALSE,
    "IsUnsubscribed" BOOLEAN NOT NULL DEFAULT FALSE,
    "CreatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "VerifiedAt" TIMESTAMP,
    "UnsubscribedAt" TIMESTAMP
);

-- Unique index on email (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS "IX_Subscribers_Email" ON "Subscribers" (LOWER("Email"));

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS "IX_Subscribers_CreatedAt" ON "Subscribers" ("CreatedAt");
CREATE INDEX IF NOT EXISTS "IX_Subscribers_Source" ON "Subscribers" ("Source") WHERE "Source" IS NOT NULL;
