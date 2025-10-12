# Database Access Guide

## 📍 Database Location

### After the Fix (Now)
```
Local Machine:    api/data/truwit.db
Inside Docker:    /app/data/truwit.db
```

The database now **persists** on your local machine in the `api/data/` folder!

### Before the Fix (Old)
```
Inside Docker:    /app/truwit.db (LOST when container deleted!)
```

---

## 🔍 How to View the Database

### Option 1: VS Code Extension (Easiest)
1. Install **SQLite Viewer** extension
2. Open `api/data/truwit.db` in VS Code
3. Right-click → "Open With SQLite Viewer"
4. Browse tables visually!

### Option 2: DB Browser for SQLite (GUI Tool)
1. Download: https://sqlitebrowser.org/
2. Open `api/data/truwit.db`
3. Full-featured database browser

### Option 3: Command Line (if sqlite3 installed)
```powershell
sqlite3 api/data/truwit.db
```

Then run queries:
```sql
SELECT * FROM Proofs;
SELECT * FROM LinkIndex;
SELECT * FROM Assets;
SELECT * FROM Receipts;
```

### Option 4: Copy from Docker (if needed)
```powershell
docker cp api-api-1:/app/data/truwit.db ./truwit.db
```

---

## 📊 Database Schema

### Main Tables
- **Proofs** - Verification proofs with C2PA data
- **Assets** - Media files (deduplicated by SHA256)
- **Receipts** - Signed receipts with Ed25519 signatures
- **LinkIndex** - URL deduplication (platform + canonical ID)
- **IdempotencyRecords** - API request deduplication
- **VerificationProofs** - Legacy verification records
- **VerificationMetadata** - Legacy metadata
- **VerificationRequests** - Legacy request tracking

---

## 🔄 Docker Volume Mount

The `docker-compose.yml` mounts the database:
```yaml
volumes:
  - ./data:/app/data
```

This means:
- **Container path:** `/app/data/truwit.db`
- **Your computer:** `api/data/truwit.db`
- **Persists:** Even if you delete the container!

---

## 🧪 Quick Database Checks

### Check if database exists
```powershell
Test-Path api/data/truwit.db
```

### Get database size
```powershell
Get-Item api/data/truwit.db | Select-Object Name, Length
```

### Count records via API
```powershell
curl http://127.0.0.1:5001/v1/proofs/test/stats
```

---

## ⚠️ Important Notes

1. **Backup:** Copy `api/data/truwit.db` to backup your data
2. **Git Ignore:** Database file is in `.gitignore` (not committed to git)
3. **Fresh Start:** Delete `api/data/truwit.db` to reset database
4. **Migrations:** Schema updates happen automatically on API startup

---

## 🔧 Troubleshooting

### Database is empty after restart?
- Check the connection string in `api/appsettings.json`
- Should be: `"Sqlite": "Data Source=data/truwit.db"`
- Restart containers: `cd api && docker-compose restart`

### Can't find the database file?
```powershell
# Find it in the container
docker exec api-api-1 find /app -name "*.db"

# Copy it out
docker cp api-api-1:/app/data/truwit.db ./truwit.db
```

### Want to use PostgreSQL instead?
1. Change `"Database": { "Type": "postgres" }` in `appsettings.json`
2. Update the Postgres connection string
3. Restart the API

---

**Now you have full access to your database - right on your computer!** 🎉

