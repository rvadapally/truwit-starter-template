# PostgreSQL Database Verification Queries

Run these queries in **Azure Data Studio** to verify your PostgreSQL database is set up correctly.

---

## ✅ **Step 1: Verify All Tables Exist**

```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

**Expected Tables:**
- `Assets`
- `Idempotency`
- `LinkIndex`
- `Proofs`
- `Receipts`
- `VerificationMetadata`
- `VerificationProofs`
- `__EFMigrationsHistory`
- `__SqlMigrations`

---

## ✅ **Step 2: Check Migration History**

```sql
SELECT * FROM "__SqlMigrations"
ORDER BY "ExecutedAt" DESC;
```

**Expected:** You should see `2025-10-13_postgres_c2pa.sql` executed successfully.

---

## ✅ **Step 3: Verify LinkIndex Table Structure**

```sql
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'LinkIndex'
ORDER BY ordinal_position;
```

**Expected Columns:**
- `Platform` (TEXT)
- `CanonicalId` (TEXT)
- `ProofId` (TEXT)
- `CreatedAt` (TIMESTAMP)

---

## ✅ **Step 4: Verify Assets Table Structure**

```sql
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'Assets'
ORDER BY ordinal_position;
```

**Expected Columns:**
- `AssetId` (TEXT)
- `Sha256` (TEXT)
- `MediaType` (TEXT)
- `Bytes` (BIGINT)
- `DurationSec` (REAL)
- `Width` (INTEGER)
- `Height` (INTEGER)
- `CreatedAt` (TIMESTAMP)

---

## ✅ **Step 5: Verify Proofs Table Structure**

```sql
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'Proofs'
ORDER BY ordinal_position;
```

**Expected Columns:**
- `Id` (TEXT)
- `TrustmarkId` (TEXT)
- `AssetId` (TEXT)
- `C2paPresent` (**BOOLEAN** - not INTEGER!)
- `C2paJson` (TEXT)
- `OriginStatus` (TEXT)
- `PolicyResult` (TEXT)
- `PolicyJson` (TEXT)
- `MetadataId` (TEXT)
- `ReceiptId` (TEXT)
- `CreatedAt` (TIMESTAMP)
- `UpdatedAt` (TIMESTAMP)

---

## ✅ **Step 6: Check for Test Data**

```sql
-- Check if EF Core created test seed data
SELECT COUNT(*) as total_proofs FROM "VerificationProofs";

-- Check if there's any data in the new tables
SELECT COUNT(*) as total_link_index FROM "LinkIndex";
SELECT COUNT(*) as total_assets FROM "Assets";
SELECT COUNT(*) as total_proofs_new FROM "Proofs";
SELECT COUNT(*) as total_receipts FROM "Receipts";
```

---

## ✅ **Step 7: View Any Existing Data**

```sql
-- View any existing proofs
SELECT 
    "Id",
    "TrustmarkId",
    "Platform",
    "Status",
    "CreatedAt"
FROM "Proofs"
ORDER BY "CreatedAt" DESC
LIMIT 10;

-- View any link index entries
SELECT * FROM "LinkIndex"
ORDER BY "CreatedAt" DESC
LIMIT 10;

-- View any assets
SELECT 
    "AssetId",
    "Sha256",
    "MediaType",
    "Bytes",
    "CreatedAt"
FROM "Assets"
ORDER BY "CreatedAt" DESC
LIMIT 10;
```

---

## 📊 **Database Size Info**

```sql
-- Total database size
SELECT pg_size_pretty(pg_database_size('railway')) as database_size;

-- Size per table
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY size_bytes DESC;
```

---

## 🔍 **What to Look For:**

1. ✅ All expected tables exist
2. ✅ `__SqlMigrations` shows the PostgreSQL migration executed
3. ✅ `C2paPresent` column is **BOOLEAN** (not INTEGER)
4. ✅ `CreatedAt` columns are **TIMESTAMP** (not TEXT)
5. ✅ `Bytes` column is **BIGINT** (not INTEGER)

---

## ❌ **If Something is Wrong:**

If any of the above checks fail, please share the results and we can fix it!

