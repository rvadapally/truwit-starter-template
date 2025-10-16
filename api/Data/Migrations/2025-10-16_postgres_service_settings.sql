-- Service Settings Migration
-- Key-value store for application configuration and runtime settings

CREATE TABLE IF NOT EXISTS "ServiceSettings" (
  "Key" TEXT PRIMARY KEY,
  "Value" TEXT NOT NULL,
  "UpdatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "UpdatedBy" TEXT
);

-- Initialize default settings for YouTube verification
INSERT INTO "ServiceSettings" ("Key", "Value", "UpdatedAt") VALUES 
  ('YOUTUBE_VERIFICATION_MODE', 'thumbnail', CURRENT_TIMESTAMP),
  ('YOUTUBE_COOKIES', '', CURRENT_TIMESTAMP)
ON CONFLICT ("Key") DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS "idx_servicesettings_key" ON "ServiceSettings" ("Key");

