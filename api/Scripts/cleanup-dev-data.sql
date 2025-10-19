-- =====================================================================
-- TruWit Dev Database Cleanup Script
-- Purpose: Remove all test proof data before implementing TW- prefix
-- WARNING: This will delete all proofs, assets, receipts, and links
-- Only run in development/testing environments!
-- =====================================================================

-- Display current record counts before cleanup
SELECT '=== BEFORE CLEANUP ===' as status;
SELECT 'Proofs' as table_name, COUNT(*) as record_count FROM Proofs
UNION ALL
SELECT 'Assets', COUNT(*) FROM Assets
UNION ALL
SELECT 'Receipts', COUNT(*) FROM Receipts
UNION ALL
SELECT 'LinkIndex', COUNT(*) FROM LinkIndex
UNION ALL
SELECT 'Idempotency', COUNT(*) FROM Idempotency
UNION ALL
SELECT 'VerificationProofs', COUNT(*) FROM VerificationProofs
UNION ALL
SELECT 'VerificationMetadata', COUNT(*) FROM VerificationMetadata
UNION ALL
SELECT 'VerificationRequests', COUNT(*) FROM VerificationRequests;

-- Delete in correct order (respecting foreign keys)
DELETE FROM Receipts;
DELETE FROM LinkIndex;
DELETE FROM Idempotency;
DELETE FROM Proofs;
DELETE FROM Assets;
DELETE FROM VerificationRequests;
DELETE FROM VerificationProofs;
DELETE FROM VerificationMetadata;

-- Reset auto-increment counters (SQLite specific)
-- Comment out if using PostgreSQL
DELETE FROM sqlite_sequence WHERE name IN (
    'Proofs', 'Assets', 'Receipts', 'LinkIndex', 
    'Idempotency', 'VerificationProofs', 'VerificationMetadata', 'VerificationRequests'
);

-- Verify cleanup was successful
SELECT '=== AFTER CLEANUP ===' as status;
SELECT 'Proofs' as table_name, COUNT(*) as record_count FROM Proofs
UNION ALL
SELECT 'Assets', COUNT(*) FROM Assets
UNION ALL
SELECT 'Receipts', COUNT(*) FROM Receipts
UNION ALL
SELECT 'LinkIndex', COUNT(*) FROM LinkIndex
UNION ALL
SELECT 'Idempotency', COUNT(*) FROM Idempotency
UNION ALL
SELECT 'VerificationProofs', COUNT(*) FROM VerificationProofs
UNION ALL
SELECT 'VerificationMetadata', COUNT(*) FROM VerificationMetadata
UNION ALL
SELECT 'VerificationRequests', COUNT(*) FROM VerificationRequests;

SELECT '✅ Cleanup complete - all tables should show 0 records' as result;

