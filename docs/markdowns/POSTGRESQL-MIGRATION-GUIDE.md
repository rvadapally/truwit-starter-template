# PostgreSQL Migration Guide

Complete guide for migrating from SQLite to PostgreSQL and connecting with SQL clients.

---

## ✅ **Migration Status**

- ✅ Code already supports PostgreSQL (Npgsql.EntityFrameworkCore.PostgreSQL v8.0.8)
- ✅ `appsettings.json` updated to use PostgreSQL
- ✅ Entity Framework Core DbContext configured
- ⏳ Railway PostgreSQL setup needed
- ⏳ Database migration pending

---

## 🎯 **Overview**

Your app now uses PostgreSQL instead of SQLite. Benefits:
- ✅ **Persistent data** - No data loss on Railway restarts
- ✅ **Better performance** - Designed for production workloads
- ✅ **Concurrent access** - Multiple connections without locking
- ✅ **SQL queries** - Full SQL support with GUI clients
- ✅ **Scalability** - Production-ready database

---

## 📋 **Migration Steps**

### **Step 1: Set Up Railway PostgreSQL** ⏳

**In Railway Dashboard:**

1. Go to your Railway project: https://railway.app/dashboard
2. Click **"+ New"** → **"Database"** → **"PostgreSQL"**
3. Railway creates the database instantly
4. Click on the PostgreSQL service
5. Go to **"Variables"** tab
6. Copy these values:
   - `PGHOST` - Database host
   - `PGPORT` - Database port (5432)
   - `PGDATABASE` - Database name
   - `PGUSER` - Username
   - `PGPASSWORD` - Password

**Example Connection Values:**
```
PGHOST: truwit-db.railway.internal
PGPORT: 5432
PGDATABASE: railway
PGUSER: postgres
PGPASSWORD: abc123xyz789...
```

---

### **Step 2: Update Railway Environment Variables**

**In Railway API Service (NOT the PostgreSQL service):**

1. Click on your **API service** (HumanProof.Api)
2. Go to **"Variables"** tab
3. Click **"+ Add Variable"**
4. Add this variable:

```
Name:  Database__Type
Value: postgres
```

5. Add this variable (build the connection string from Step 1):

```
Name:  ConnectionStrings__Postgres
Value: Host=PGHOST;Port=5432;Database=PGDATABASE;Username=PGUSER;Password=PGPASSWORD;SSL Mode=Require
```

**Example:**
```
ConnectionStrings__Postgres=Host=truwit-db.railway.internal;Port=5432;Database=railway;Username=postgres;Password=abc123xyz789;SSL Mode=Require
```

**Important:** 
- Use `__` (double underscore) for nested config in environment variables
- Railway will automatically substitute `${{Postgres.PGHOST}}` style references

**Alternative (Simpler):**
```
ConnectionStrings__Postgres=${{Postgres.DATABASE_URL}}
```
Railway automatically creates `DATABASE_URL` for you!

---

### **Step 3: Test Local PostgreSQL** (Optional)

**Install PostgreSQL locally:**

**Windows:**
```powershell
# Download from: https://www.postgresql.org/download/windows/
# Or use Chocolatey:
choco install postgresql

# Start PostgreSQL service
net start postgresql-x64-15
```

**macOS:**
```bash
brew install postgresql
brew services start postgresql
```

**Linux:**
```bash
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Create local database:**
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE truwit;

# Exit
\q
```

**Update `api/appsettings.json`** (for local testing):
```json
{
  "ConnectionStrings": {
    "Postgres": "Host=localhost;Port=5432;Database=truwit;Username=postgres;Password=yourpassword;Include Error Detail=true"
  }
}
```

---

### **Step 4: Run Database Migrations**

**The app automatically creates tables on first run!**

When you start the API, Entity Framework Core will:
1. ✅ Connect to PostgreSQL
2. ✅ Check if tables exist
3. ✅ Create all tables automatically (`EnsureCreatedAsync()`)
4. ✅ Run SQL migrations from `api/Data/Migrations/`

**To test locally:**
```bash
cd api
dotnet run
```

**Check console output:**
```
✅ Using Postgres database
✅ Database created/verified
✅ Running SQL migrations...
✅ Migration: 001_CreateLinkIndexTable.sql - SUCCESS
✅ Migration: 002_CreateReceiptsTable.sql - SUCCESS
✅ All migrations completed successfully
```

**To create new migrations (if needed):**
```bash
cd api
dotnet ef migrations add YourMigrationName
dotnet ef database update
```

---

### **Step 5: Deploy to Railway**

**Commit and push:**
```bash
git add api/appsettings.json
git commit -m "Migrate to PostgreSQL"
git push origin main
```

**Railway will:**
1. ✅ Build your app with PostgreSQL support
2. ✅ Connect to the PostgreSQL database
3. ✅ Create all tables automatically
4. ✅ Run migrations
5. ✅ Start the API

**Monitor deployment:**
- Go to Railway dashboard
- Click on your API service
- Click **"Deployments"** tab
- Watch the build logs
- Look for: `✅ Using Postgres database`

**Wait ~5-10 minutes** for deployment to complete.

---

## 🔌 **Connecting with SQL Clients**

### **Option 1: Azure Data Studio** ⭐ **RECOMMENDED** (Microsoft's Modern SQL Tool)

**Why Azure Data Studio?**
- ✅ **Made by Microsoft** - Familiar interface if you use SSMS
- ✅ **Free** - Open source
- ✅ **PostgreSQL support** - Native extension
- ✅ **Cross-platform** - Windows, Mac, Linux
- ✅ **Modern UI** - Better than SSMS
- ✅ **Same features** - Query editor, table designer, etc.

**Download:**
https://docs.microsoft.com/en-us/sql/azure-data-studio/download

**Setup:**

1. **Install PostgreSQL Extension:**
   - Open Azure Data Studio
   - Click **Extensions** icon (left sidebar)
   - Search: `PostgreSQL`
   - Click **Install** on "PostgreSQL" by Microsoft

2. **Connect to Railway PostgreSQL:**
   - Click **"New Connection"** (top left)
   - **Server:** `your-db.proxy.rlwy.net` (get from Railway)
   - **Connection type:** PostgreSQL
   - **Port:** `5432` (or port from Railway)
   - **Database:** `railway` (or your database name)
   - **Authentication type:** Password
   - **User name:** `postgres`
   - **Password:** (from Railway variables)
   - **Remember password:** ✅ Check
   - Click **Connect**

3. **Get Railway Connection Details:**
   - Railway Dashboard → PostgreSQL service → **Connect** tab
   - **Public Networking:** Enable if not enabled
   - Copy:
     - **Host:** `containers-us-west-xyz.railway.app`
     - **Port:** `7890` (example)
     - **Database:** `railway`
     - **Username:** `postgres`
     - **Password:** Click **Show** to reveal

**Example Connection:**
```
Server:   containers-us-west-123.railway.app
Port:     7890
Database: railway
Username: postgres
Password: abc123xyz789...
```

---

### **Option 2: pgAdmin** (Traditional PostgreSQL Tool)

**Download:**
https://www.pgadmin.org/download/

**Setup:**

1. **Install pgAdmin**
2. **Right-click "Servers"** → **"Register" → "Server"**
3. **General Tab:**
   - Name: `Truwit Railway`
4. **Connection Tab:**
   - Host: (from Railway)
   - Port: (from Railway)
   - Maintenance database: `railway`
   - Username: `postgres`
   - Password: (from Railway)
   - Save password: ✅ Check
5. Click **Save**

**Navigate Database:**
- Servers → Truwit Railway → Databases → railway → Schemas → public → Tables

---

### **Option 3: DBeaver** (Universal Database Tool)

**Download:**
https://dbeaver.io/download/

**Setup:**

1. **Install DBeaver Community Edition**
2. **Database** → **New Database Connection**
3. Select **PostgreSQL**
4. Enter Railway connection details
5. Click **Test Connection**
6. Click **Finish**

---

### **Option 4: DataGrip** (Premium - JetBrains)

**Download:**
https://www.jetbrains.com/datagrip/

**Cost:** $99/year (free 30-day trial)

**Best for:** Professional database work, multiple databases

---

## 📝 **Running SQL Queries**

### **In Azure Data Studio:**

1. **Connect to your database**
2. **New Query** (Ctrl+N)
3. **Write SQL:**

```sql
-- View all proofs
SELECT * FROM "Proofs" ORDER BY "CreatedAt" DESC LIMIT 10;

-- View all link index entries
SELECT * FROM "LinkIndex" ORDER BY "CreatedAt" DESC;

-- Find proofs for specific platform
SELECT p."Id", p."TrustmarkId", l."Platform", l."CanonicalId", p."CreatedAt"
FROM "Proofs" p
INNER JOIN "LinkIndex" l ON p."Id" = l."ProofId"
WHERE l."Platform" = 'YouTube'
ORDER BY p."CreatedAt" DESC;

-- View assets
SELECT * FROM "Assets" ORDER BY "CreatedAt" DESC;

-- Count proofs by platform
SELECT l."Platform", COUNT(*) as count
FROM "LinkIndex" l
GROUP BY l."Platform";

-- Find duplicates (deduplication check)
SELECT "CanonicalId", COUNT(*) as duplicate_count
FROM "LinkIndex"
GROUP BY "CanonicalId"
HAVING COUNT(*) > 1;
```

**Note:** PostgreSQL table names are **case-sensitive** when quoted. Use double quotes: `"Proofs"`, not `Proofs`.

---

## 🔍 **SQL Syntax Differences (SQL Server vs PostgreSQL)**

| SQL Server | PostgreSQL | Notes |
|------------|------------|-------|
| `SELECT TOP 10 *` | `SELECT * LIMIT 10` | Limit results |
| `GETDATE()` | `CURRENT_TIMESTAMP` or `NOW()` | Current date/time |
| `ISNULL(col, 0)` | `COALESCE(col, 0)` | Null handling |
| `VARCHAR(MAX)` | `TEXT` | Unlimited text |
| `IDENTITY(1,1)` | `SERIAL` or `GENERATED ALWAYS AS IDENTITY` | Auto-increment |
| `[Table]` (brackets) | `"Table"` (double quotes) | Identifiers |
| `'A' + 'B'` | `'A' || 'B'` | String concatenation |
| `DATEADD(day, 1, date)` | `date + INTERVAL '1 day'` | Date math |
| `LEN(string)` | `LENGTH(string)` | String length |

**Case Sensitivity:**
- SQL Server: Table names are **case-insensitive**
- PostgreSQL: Table names are **case-sensitive** when quoted

```sql
-- Works in SQL Server, fails in PostgreSQL:
SELECT * FROM proofs;

-- Works in PostgreSQL:
SELECT * FROM "Proofs";

-- Also works (unquoted lowercase):
SELECT * FROM proofs; -- If table was created as lowercase
```

**Your tables use PascalCase**, so always use double quotes:
- ✅ `SELECT * FROM "Proofs"`
- ❌ `SELECT * FROM Proofs` (will fail)
- ❌ `SELECT * FROM proofs` (will fail)

---

## 🧪 **Testing the Migration**

### **Test 1: Verify Connection**

```bash
curl https://truwit-starter-template-production.up.railway.app/health
```

**Expected:**
```json
{
  "ok": true,
  "timestamp": "2025-10-13T00:30:00Z",
  "tools": {
    "yt-dlp": "2025.09.26"
  }
}
```

---

### **Test 2: Create a Proof**

```bash
curl -X POST https://truwit-starter-template-production.up.railway.app/v1/proofs/url \
  -H "Content-Type: application/json" \
  -d '{"Url":"https://www.tiktok.com/@toptierlives/video/7555756163036433677"}'
```

**Expected:**
```json
{
  "proofId": "...",
  "trustmarkId": "abc123",
  "verifyUrl": "/t/abc123",
  "deduped": false
}
```

---

### **Test 3: Query Database**

**In Azure Data Studio:**
```sql
SELECT * FROM "Proofs" ORDER BY "CreatedAt" DESC LIMIT 5;
```

**You should see:**
- ✅ Proof records from production
- ✅ Proper timestamps
- ✅ All columns populated

---

## 🔄 **Data Migration from SQLite to PostgreSQL**

**If you want to migrate existing SQLite data:**

### **Option 1: pg_dump (Manual)**

**Export from SQLite:**
```bash
# Install sqlite3 command line tool
sqlite3 api/Data/truwit.db .dump > sqlite_dump.sql
```

**Import to PostgreSQL:**
```bash
# Edit sqlite_dump.sql to fix syntax differences
# Then import:
psql -h your-host -U postgres -d railway < sqlite_dump.sql
```

### **Option 2: Fresh Start** ⭐ **RECOMMENDED**

Since you're early in development:
1. ✅ Start with empty PostgreSQL database
2. ✅ Tables created automatically
3. ✅ New proofs stored in PostgreSQL
4. ✅ Old SQLite data can be backed up for reference

**Backup old SQLite data:**
```bash
cp api/Data/truwit.db api/Data/truwit_backup_$(date +%Y%m%d).db
```

---

## 🎯 **Railway PostgreSQL Pricing**

| Plan | Storage | Price/Month |
|------|---------|-------------|
| **Free** | 5 GB | $0 |
| **Starter** | 100 GB | $5 |
| **Pro** | 500 GB | $25 |

**Free tier is perfect for:**
- ✅ Development
- ✅ Small production apps (< 100K records)
- ✅ Testing and demos

**When to upgrade:**
- Database size > 5 GB
- Need more connections
- Higher performance requirements

---

## 🐛 **Troubleshooting**

### **Error: "Unable to connect to database"**

**Check:**
1. Railway PostgreSQL service is running
2. Environment variables are set correctly
3. Connection string has correct format
4. SSL Mode is set (`SSL Mode=Require` for Railway)

**Test connection:**
```bash
# In Railway API service logs, look for:
✅ Using Postgres database
✅ Database created/verified
```

---

### **Error: "Table does not exist"**

**Fix:**
```bash
# The app should create tables automatically
# Check Railway logs for migration errors
# If needed, manually run:
cd api
dotnet ef database update
```

---

### **Error: "Password authentication failed"**

**Check:**
1. PostgreSQL password in Railway variables
2. Connection string has correct password
3. No special characters causing issues (URL encode if needed)

---

### **Error: "SSL connection required"**

**Fix connection string:**
```
Host=...;SSL Mode=Require
```

Railway PostgreSQL requires SSL connections.

---

## 📚 **Additional Resources**

### **PostgreSQL Documentation:**
- Official Docs: https://www.postgresql.org/docs/
- SQL Tutorial: https://www.postgresqltutorial.com/

### **Entity Framework Core:**
- PostgreSQL Provider: https://www.npgsql.org/efcore/
- Migrations: https://docs.microsoft.com/en-us/ef/core/managing-schemas/migrations/

### **Azure Data Studio:**
- Documentation: https://docs.microsoft.com/en-us/sql/azure-data-studio/
- PostgreSQL Extension: https://github.com/Microsoft/azuredatastudio-postgresql

---

## ✅ **Next Steps**

1. ⏳ **Set up Railway PostgreSQL** (2 minutes)
2. ⏳ **Update Railway environment variables** (3 minutes)
3. ⏳ **Deploy to Railway** (5-10 minutes)
4. ⏳ **Install Azure Data Studio** (5 minutes)
5. ⏳ **Connect to database** (2 minutes)
6. ✅ **Run SQL queries!**

**Total time: ~20-30 minutes**

---

## 🎉 **Benefits After Migration**

- ✅ **No more data loss** on Railway restarts
- ✅ **Run SQL queries** via Azure Data Studio
- ✅ **Better performance** for production
- ✅ **Concurrent access** without locking
- ✅ **Scalable** for growth
- ✅ **Production-ready** database

---

**Last Updated:** October 13, 2025  
**Version:** 1.0  
**Questions?** Check Railway PostgreSQL documentation or Azure Data Studio docs

Good luck with the migration! 🚀

