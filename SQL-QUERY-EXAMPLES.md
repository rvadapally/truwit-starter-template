# SQL Query Examples for Truwit Database

Quick reference for common SQL queries you'll use in Azure Data Studio.

---

## 📋 **Table Structure**

Your PostgreSQL database has these main tables:

| Table | Purpose |
|-------|---------|
| `Proofs` | Verification proofs with trustmark IDs |
| `Assets` | Media files (deduplicated by SHA-256) |
| `LinkIndex` | URL deduplication (platform + video ID) |
| `Receipts` | Cryptographic receipts for proofs |
| `IdempotencyRecords` | Request deduplication |

---

## 🔍 **Common Queries**

### **1. View All Proofs (Recent First)**

```sql
SELECT 
    "Id",
    "TrustmarkId",
    "AssetId",
    "C2paPresent",
    "OriginStatus",
    "CreatedAt"
FROM "Proofs"
ORDER BY "CreatedAt" DESC
LIMIT 20;
```

---

### **2. Find Specific YouTube Video**

```sql
SELECT 
    p."Id",
    p."TrustmarkId",
    l."Platform",
    l."CanonicalId",
    p."CreatedAt",
    a."Sha256"
FROM "Proofs" p
LEFT JOIN "LinkIndex" l ON p."Id" = l."ProofId"
LEFT JOIN "Assets" a ON p."AssetId" = a."AssetId"
WHERE l."CanonicalId" LIKE '%K7uZuy41wlQ%'
ORDER BY p."CreatedAt" DESC;
```

---

### **3. Count Proofs by Platform**

```sql
SELECT 
    l."Platform",
    COUNT(*) as total_proofs,
    COUNT(DISTINCT a."Sha256") as unique_assets
FROM "Proofs" p
INNER JOIN "LinkIndex" l ON p."Id" = l."ProofId"
LEFT JOIN "Assets" a ON p."AssetId" = a."AssetId"
GROUP BY l."Platform"
ORDER BY total_proofs DESC;
```

---

### **4. Find Duplicate URLs (Deduplication Check)**

```sql
SELECT 
    "Platform",
    "CanonicalId",
    COUNT(*) as duplicate_count,
    STRING_AGG("ProofId", ', ') as proof_ids
FROM "LinkIndex"
GROUP BY "Platform", "CanonicalId"
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC;
```

---

### **5. View Proofs Created Today**

```sql
SELECT 
    "TrustmarkId",
    "OriginStatus",
    "CreatedAt"
FROM "Proofs"
WHERE "CreatedAt" >= CURRENT_DATE
ORDER BY "CreatedAt" DESC;
```

---

### **6. Find Proofs Without Assets**

```sql
SELECT 
    p."Id",
    p."TrustmarkId",
    p."AssetId",
    p."CreatedAt"
FROM "Proofs" p
LEFT JOIN "Assets" a ON p."AssetId" = a."AssetId"
WHERE a."AssetId" IS NULL
ORDER BY p."CreatedAt" DESC;
```

---

### **7. Get Full Proof Details with All Joins**

```sql
SELECT 
    p."Id" as proof_id,
    p."TrustmarkId",
    l."Platform",
    l."CanonicalId",
    a."Sha256" as asset_hash,
    a."Bytes" as file_size,
    a."MediaType",
    r."ReceiptHash",
    p."C2paPresent",
    p."OriginStatus",
    p."CreatedAt"
FROM "Proofs" p
LEFT JOIN "LinkIndex" l ON p."Id" = l."ProofId"
LEFT JOIN "Assets" a ON p."AssetId" = a."AssetId"
LEFT JOIN "Receipts" r ON p."Id" = r."ProofId"
WHERE p."TrustmarkId" = 'YOUR_TRUSTMARK_ID'
LIMIT 1;
```

---

### **8. Find Proofs by Date Range**

```sql
SELECT 
    "TrustmarkId",
    "CreatedAt"
FROM "Proofs"
WHERE "CreatedAt" BETWEEN '2025-10-12' AND '2025-10-13'
ORDER BY "CreatedAt" DESC;
```

---

### **9. View Asset Storage Statistics**

```sql
SELECT 
    COUNT(*) as total_assets,
    SUM("Bytes") as total_bytes,
    ROUND(SUM("Bytes") / 1024.0 / 1024.0, 2) as total_mb,
    ROUND(AVG("Bytes") / 1024.0 / 1024.0, 2) as avg_mb_per_asset,
    MIN("CreatedAt") as first_asset,
    MAX("CreatedAt") as latest_asset
FROM "Assets";
```

---

### **10. Search Receipts by Proof ID**

```sql
SELECT 
    r."Id",
    r."ProofId",
    r."ReceiptHash",
    r."Signature",
    r."CreatedAt",
    r."Json"
FROM "Receipts" r
WHERE r."ProofId" = 'YOUR_PROOF_ID';
```

---

## 🛠️ **Maintenance Queries**

### **Delete Old Test Data**

```sql
-- CAUTION: This deletes data permanently!
-- Delete proofs older than 30 days
DELETE FROM "Proofs"
WHERE "CreatedAt" < CURRENT_DATE - INTERVAL '30 days';
```

---

### **Find Orphaned Assets**

```sql
-- Assets not linked to any proof
SELECT 
    a."AssetId",
    a."Sha256",
    a."Bytes",
    a."CreatedAt"
FROM "Assets" a
LEFT JOIN "Proofs" p ON a."AssetId" = p."AssetId"
WHERE p."Id" IS NULL
ORDER BY a."CreatedAt" DESC;
```

---

### **Database Size Statistics**

```sql
-- Total database size
SELECT 
    pg_size_pretty(pg_database_size(current_database())) as database_size;

-- Size per table
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 📊 **Analytical Queries**

### **Daily Proof Creation Trend**

```sql
SELECT 
    DATE("CreatedAt") as date,
    COUNT(*) as proofs_created
FROM "Proofs"
WHERE "CreatedAt" >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE("CreatedAt")
ORDER BY date DESC;
```

---

### **Platform Usage Statistics**

```sql
SELECT 
    l."Platform",
    COUNT(*) as total_proofs,
    COUNT(DISTINCT DATE(p."CreatedAt")) as days_active,
    MIN(p."CreatedAt") as first_proof,
    MAX(p."CreatedAt") as latest_proof
FROM "Proofs" p
INNER JOIN "LinkIndex" l ON p."Id" = l."ProofId"
GROUP BY l."Platform"
ORDER BY total_proofs DESC;
```

---

### **Find Most Popular Videos**

```sql
SELECT 
    l."CanonicalId" as video_id,
    l."Platform",
    COUNT(*) as request_count,
    MIN(p."CreatedAt") as first_requested,
    MAX(p."CreatedAt") as last_requested
FROM "LinkIndex" l
INNER JOIN "Proofs" p ON l."ProofId" = p."Id"
GROUP BY l."CanonicalId", l."Platform"
HAVING COUNT(*) > 1
ORDER BY request_count DESC
LIMIT 10;
```

---

## 🔧 **Admin Queries**

### **Check Database Connections**

```sql
SELECT 
    datname as database,
    count(*) as connections
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY datname;
```

---

### **View Active Queries**

```sql
SELECT 
    pid,
    now() - pg_stat_activity.query_start AS duration,
    query,
    state
FROM pg_stat_activity
WHERE state != 'idle'
ORDER BY duration DESC;
```

---

### **Table Row Counts**

```sql
SELECT 
    schemaname,
    tablename,
    n_live_tup as row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;
```

---

## 💡 **Tips**

### **Always Use Double Quotes for Table Names**

```sql
-- ✅ Correct
SELECT * FROM "Proofs";

-- ❌ Wrong (will fail)
SELECT * FROM Proofs;
```

### **Use EXPLAIN for Query Performance**

```sql
EXPLAIN ANALYZE
SELECT * FROM "Proofs" 
WHERE "CreatedAt" > '2025-10-12'
ORDER BY "CreatedAt" DESC;
```

### **Create Indexes for Better Performance**

```sql
-- Index for faster date queries
CREATE INDEX idx_proofs_createdat ON "Proofs"("CreatedAt");

-- Index for trustmark lookups
CREATE INDEX idx_proofs_trustmarkid ON "Proofs"("TrustmarkId");

-- Index for link index lookups
CREATE INDEX idx_linkindex_canonicalid ON "LinkIndex"("CanonicalId");
```

---

## 🎯 **Common Troubleshooting Queries**

### **Find Failed Proofs**

```sql
SELECT 
    "Id",
    "TrustmarkId",
    "OriginStatus",
    "CreatedAt"
FROM "Proofs"
WHERE "OriginStatus" != 'verified'
ORDER BY "CreatedAt" DESC
LIMIT 20;
```

---

### **Check for Missing Receipts**

```sql
SELECT 
    p."Id",
    p."TrustmarkId",
    p."ReceiptId",
    p."CreatedAt"
FROM "Proofs" p
LEFT JOIN "Receipts" r ON p."ReceiptId" = r."Id"
WHERE r."Id" IS NULL
ORDER BY p."CreatedAt" DESC;
```

---

### **Find Proofs with C2PA Data**

```sql
SELECT 
    "TrustmarkId",
    "C2paPresent",
    "C2paJson",
    "CreatedAt"
FROM "Proofs"
WHERE "C2paPresent" = true
ORDER BY "CreatedAt" DESC
LIMIT 10;
```

---

**Happy Querying!** 🚀

For more PostgreSQL functions and syntax, visit:
- https://www.postgresql.org/docs/current/functions.html
- https://www.postgresqltutorial.com/

