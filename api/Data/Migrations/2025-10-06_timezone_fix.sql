-- Migration: Fix timezone to use local time instead of UTC
-- Date: 2025-10-06

-- Update existing records to use local timezone
UPDATE Proofs SET 
    CreatedAt = datetime(CreatedAt, 'localtime'),
    UpdatedAt = datetime(UpdatedAt, 'localtime');

UPDATE Receipts SET 
    CreatedAt = datetime(CreatedAt, 'localtime');

UPDATE Assets SET 
    CreatedAt = datetime(CreatedAt, 'localtime');

UPDATE LinkIndex SET 
    CreatedAt = datetime(CreatedAt, 'localtime');

UPDATE Idempotency SET 
    CreatedAt = datetime(CreatedAt, 'localtime');

-- Note: SQLite doesn't support changing DEFAULT values on existing columns
-- The application code will need to use datetime('now', 'localtime') for new records
