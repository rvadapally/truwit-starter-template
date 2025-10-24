-- Service Settings Migration
-- Key-value store for application configuration and runtime settings

CREATE TABLE IF NOT EXISTS "ServiceSettings" (
  "Key" TEXT PRIMARY KEY,
  "Value" TEXT NOT NULL,
  "UpdatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "UpdatedBy" TE-- Initialize default settings for YouTube verification
-- MVP: Only 'thumbnail' mode is supported (no yt-dlp/full_video dependency)
INSERT INTO "ServiceSettings" ("Key", "Value", "UpdatedAt") VALUES 
  ('YOUTUBE_VERIFICATION_MODE', 'thumbnail', CURRENT_TIMESTAMP),
  ('YOUTUBE_COOKIES', '', CURRENT_TIMESTAMP)
ON CONFLICT ("Key") DO NOTHING;") DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS "idx_servicesettings_key" ON "ServiceSettings" ("Key");

