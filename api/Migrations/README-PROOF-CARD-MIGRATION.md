# Proof Card Migration - Railway PostgreSQL

## 🚨 **CRITICAL FIX NEEDED**

The Railway PostgreSQL database is missing the `ProofCardSmallUrl` and `ProofCardLargeUrl` columns, causing all proof card generation to fail.

## 🔧 **Quick Fix**

### Option 1: Automatic Migration (Recommended)
The migration will run automatically when you redeploy to Railway. The `SqlMigrationRunner` will detect and execute the new migration file.

### Option 2: Manual Migration
If you need to apply the migration immediately without redeploying:

1. **Get your Railway DATABASE_URL**:
   ```bash
   railway variables
   ```

2. **Run the migration script**:
   ```bash
   # Linux/Mac
   chmod +x Scripts/apply-proof-card-migration.sh
   ./Scripts/apply-proof-card-migration.sh
   
   # Windows PowerShell
   .\Scripts\apply-proof-card-migration.ps1
   ```

3. **Or run directly with psql**:
   ```bash
   psql $DATABASE_URL -f Data/Migrations/2025-10-19_postgres_proof_card_urls.sql
   ```

## 📋 **What This Migration Does**

- Adds `ProofCardSmallUrl` TEXT column to `VerificationProofs` table
- Adds `ProofCardLargeUrl` TEXT column to `VerificationProofs` table  
- Adds documentation comments to the columns
- Verifies the migration completed successfully

## ✅ **After Migration**

Once applied, the following will work:
- ✅ Proof card generation on new proof creation
- ✅ Regenerate-on-miss endpoint (`/cards/proof/{id}-{size}.png`)
- ✅ Angular frontend proof card display
- ✅ Backfill command for existing proofs

## 🧪 **Testing**

After migration, test by:
1. Creating a new proof via Angular frontend
2. Verifying proof card is generated automatically
3. Checking that `/assets/proof/{id}-640.png` serves the image
4. Testing regenerate-on-miss endpoint

## 📊 **Current Status**

- ❌ **Database Schema**: Missing proof card columns
- ✅ **API Code**: All proof card generation code is implemented
- ✅ **Angular Frontend**: Ready to display proof cards
- ✅ **Static File Serving**: Working correctly
- ✅ **TW- Prefix**: Working correctly (`TW-A10B5447`)

**The implementation is complete - we just need this database migration!**
