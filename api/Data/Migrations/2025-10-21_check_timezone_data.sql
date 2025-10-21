-- Add a migration endpoint to the API for running the timezone fix
-- This will be a temporary endpoint for running the migration

-- First, let's check what tables exist and their current timestamps
SELECT 
    'Proofs' as table_name,
    COUNT(*) as record_count,
    MIN("CreatedAt") as earliest_timestamp,
    MAX("CreatedAt") as latest_timestamp
FROM "Proofs"
UNION ALL
SELECT 
    'Assets' as table_name,
    COUNT(*) as record_count,
    MIN("CreatedAt") as earliest_timestamp,
    MAX("CreatedAt") as latest_timestamp
FROM "Assets"
UNION ALL
SELECT 
    'Receipts' as table_name,
    COUNT(*) as record_count,
    MIN("CreatedAt") as earliest_timestamp,
    MAX("CreatedAt") as latest_timestamp
FROM "Receipts"
UNION ALL
SELECT 
    'LinkIndex' as table_name,
    COUNT(*) as record_count,
    MIN("CreatedAt") as earliest_timestamp,
    MAX("CreatedAt") as latest_timestamp
FROM "LinkIndex"
UNION ALL
SELECT 
    'Idempotency' as table_name,
    COUNT(*) as record_count,
    MIN("CreatedAt") as earliest_timestamp,
    MAX("CreatedAt") as latest_timestamp
FROM "Idempotency";
