SELECT "TrustmarkId", 
       CASE WHEN "ProofCardSmallUrl" IS NULL THEN 'NULL' 
            WHEN "ProofCardSmallUrl" = '' THEN 'EMPTY' 
            ELSE 'HAS_VALUE' END as small_status
FROM "Proofs" LIMIT 5;

