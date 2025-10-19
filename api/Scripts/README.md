# TruWit Database Cleanup Scripts

## Purpose
These scripts clear all test proof data from the database before implementing the TW- prefix system. This ensures no orphaned records with old ID formats remain.

## ⚠️ WARNING
**These scripts will permanently delete ALL proof records!**
- Only run in development/testing environments
- Never run in production
- Back up any important test data before running

## Usage

### Windows (PowerShell)
```powershell
cd api
.\Scripts\cleanup-dev-data.ps1
```

### Linux/Mac (Bash)
```bash
cd api
chmod +x Scripts/cleanup-dev-data.sh
./Scripts/cleanup-dev-data.sh
```

### Direct SQL (Any Platform)
```bash
cd api
sqlite3 truwit.db < Scripts/cleanup-dev-data.sql
```

## What Gets Deleted
- ✅ All Proofs (C2PA verification records)
- ✅ All Assets (file metadata)
- ✅ All Receipts (signed proof receipts)
- ✅ All LinkIndex (URL deduplication)
- ✅ All Idempotency records
- ✅ All VerificationProofs (user proofs)
- ✅ All VerificationMetadata
- ✅ All VerificationRequests

## Verification
The scripts will display:
1. Record counts BEFORE cleanup
2. Record counts AFTER cleanup (should all be 0)
3. Success confirmation

## Next Steps After Cleanup
1. Update `GenerateShortId()` in `ProofsController.cs` to use TW- prefix
2. Restart the API
3. Create a test proof to verify new format (TW-XXXXXXXX)
4. Implement proof card generation system

