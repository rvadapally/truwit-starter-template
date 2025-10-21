-- Find URL submissions (where Url is NOT NULL)
SELECT 
    "Id",
    "Url",
    "FileName",
    "Status",
    "CreatedAt"
FROM "VerificationRequests" 
WHERE "Url" IS NOT NULL
ORDER BY "CreatedAt" DESC;

-- Count URL vs File submissions
SELECT 
    CASE 
        WHEN "Url" IS NOT NULL THEN 'URL Submission'
        WHEN "FileName" IS NOT NULL THEN 'File Upload'
        ELSE 'Unknown'
    END as "SubmissionType",
    COUNT(*) as "Count"
FROM "VerificationRequests"
GROUP BY 
    CASE 
        WHEN "Url" IS NOT NULL THEN 'URL Submission'
        WHEN "FileName" IS NOT NULL THEN 'File Upload'
        ELSE 'Unknown'
    END;

-- Check the new C2PA system for URLs
SELECT 
    "Platform",
    "CanonicalId",
    "ProofId",
    "CreatedAt"
FROM "LinkIndex"
ORDER BY "CreatedAt" DESC;

-- Check receipts for original URLs
SELECT 
    "Id",
    "ProofId",
    "Json"->>'url' as "OriginalUrl",
    "CreatedAt"
FROM "Receipts"
WHERE "Json" ? 'url'
ORDER BY "CreatedAt" DESC;

