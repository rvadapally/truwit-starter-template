# TruWit Proof Card System - Quick Start Guide

## 🎯 Goal
Implement SVG-based proof card generation with TW- prefix branding that produces cards like this:

```
┌─────────────────────────────┐
│     Teal Gradient BG        │
│                             │
│    ◉ Verified Badge         │
│   verified by Truwit        │
│ PROVENANCE·PROOF·TRUST      │
│                             │
│  Proof ID: TW-7F39C1AB      │
│  truwit.ai/t/TW-7F39C1AB    │
│                        [QR] │
└─────────────────────────────┘
```

---

## ✅ Phase 0: Cleanup (DO THIS FIRST)

### Windows
```powershell
cd api
.\Scripts\cleanup-dev-data.ps1
```

### Linux/Mac
```bash
cd api
chmod +x Scripts/cleanup-dev-data.sh
./Scripts/cleanup-dev-data.sh
```

**Confirmation:** Type `DELETE` when prompted

**Expected Result:**
```
✅ Cleanup completed successfully!
All tables should show 0 records
```

---

## 📋 Implementation Checklist

### Required Actions Before Implementation

#### ✅ Asset Management
- [ ] **CRITICAL:** Copy badge asset
  ```bash
  # Create directory
  mkdir -p api/wwwroot/assets/badges
  
  # Copy badge (adjust source path if needed)
  cp app/src/assets/verified-circular-badge.jpg api/wwwroot/assets/badges/verified_truwit.png
  
  # OR convert if JPG
  # Use online converter or ImageMagick:
  # convert app/src/assets/verified-circular-badge.jpg -background transparent api/wwwroot/assets/badges/verified_truwit.png
  ```

- [ ] **Verify badge loads:**
  ```bash
  # Start API
  cd api && dotnet run
  
  # In browser, open:
  # http://localhost:5000/assets/badges/verified_truwit.png
  
  # Should display the circular badge image
  ```

- [ ] **Badge requirements:**
  - Format: PNG (transparency support)
  - Minimum size: 512x512px
  - Aspect ratio: 1:1 (square/circular)
  - File size: < 500KB
  - Quality: High (will be displayed at 640px and 1024px)

#### ✅ Automated Tests (to be created)
These test files will verify the badge creation process:

**Unit Tests:** `api/Tests/ProofCardGeneratorTests.cs`
- [ ] `Generate_WithValidInputs_CreatesPngFiles()` - Verifies PNG generation
- [ ] `Generate_WithMissingBadge_ThrowsException()` - Catches missing badge asset
- [ ] `Generate_QRCodeIsReadable()` - Verifies QR code works
- [ ] `Generate_BadgeIsVisible()` - Checks badge rendered in output
- [ ] `Generate_CorrectDimensions()` - Validates 640x640 and 1024x1024 sizes

**Integration Tests:** `api/Tests/ProofCardIntegrationTests.cs`
- [ ] `CreateProof_AutoGeneratesProofCards()` - End-to-end proof creation
- [ ] `ProofCard_ContainsBadgeAsset()` - Verifies badge embedded
- [ ] `ProofCard_ServesWithCorrectHeaders()` - Cache headers check
- [ ] `ProofCard_RegeneratesOnMiss()` - Fallback mechanism

**Visual Tests:** `api/Tests/ProofCardVisualTests.cs`
- [ ] `CompareAgainstReferenceImage()` - Design regression detection
- [ ] `ValidateBadgePosition()` - Badge centered correctly
- [ ] `ValidateQRCodePosition()` - QR in bottom-right corner

**E2E Tests:** `app/tests/e2e/proof-card.spec.ts`
- [ ] `proof card displays correctly` - Browser rendering
- [ ] `proof card fallback works on 404` - Regeneration flow
- [ ] `badge asset loads` - Asset serving verification

---

## 🚀 Implementation Steps

### 1. Update ID Generation (5 minutes)

**File:** `api/Controllers/ProofsController.cs` (line 382-387)

**Change:**
```csharp
private string GenerateShortId()
{
    // OLD: return Guid.NewGuid().ToString("N").Substring(0, 8);
    
    // NEW: Add TW- prefix for branding
    var random = Guid.NewGuid().ToString("N")[..8].ToUpperInvariant();
    return $"TW-{random}";  // Result: TW-7F39C1AB
}
```

**Test:**
```bash
cd api
dotnet run

# In another terminal:
curl -X POST http://localhost:5000/v1/proofs/url \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}' \
  | jq '.trustmarkId'

# Expected output: "TW-XXXXXXXX" (uppercase)
```

---

### 2. Install NuGet Packages (2 minutes)

```bash
cd api
dotnet add package SkiaSharp --version 2.88.7
dotnet add package SkiaSharp.NativeAssets.Linux.NoDependencies --version 2.88.7
dotnet add package SkiaSharp.Extended.Svg --version 2.0.0
dotnet add package QRCoder --version 1.6.0
```

**Verify:**
```bash
dotnet list package | grep -E "SkiaSharp|QRCoder"
```

---

### 3. Create Directory Structure (1 minute)

```bash
cd api
mkdir -p wwwroot/assets/proof
mkdir -p wwwroot/assets/badges
mkdir -p CardTemplates
touch wwwroot/assets/proof/.gitkeep
touch wwwroot/assets/badges/.gitkeep
```

---

### 4. Database Migration (5 minutes)

**Add properties to:** `api/Domain/Entities/VerificationProof.cs` (after line 15)
```csharp
public string? ProofCardSmallUrl { get; set; }
public string? ProofCardLargeUrl { get; set; }
```

**Update configuration in:** `api/Infrastructure/Data/ApplicationDbContext.cs` (after line 36)
```csharp
entity.Property(e => e.ProofCardSmallUrl).HasMaxLength(500);
entity.Property(e => e.ProofCardLargeUrl).HasMaxLength(500);
```

**Run migration:**
```bash
cd api
dotnet ef migrations add AddProofCardUrls
dotnet ef database update
```

**Verify:**
```bash
sqlite3 truwit.db "PRAGMA table_info(VerificationProofs);" | grep ProofCard
```

---

## 📦 Files to Be Created (Next Phase)

Once cleanup and setup are complete, implementation will create these files:

### Core Implementation
1. ✅ `api/CardTemplates/proof-card.svg` - SVG template with placeholders
2. ✅ `api/Application/Services/IProofCardGenerator.cs` - Interface
3. ✅ `api/Application/Services/ProofCardSvgGenerator.cs` - Main generator
4. ✅ `api/Application/Services/ProofCardBackfillService.cs` - Batch operations
5. ✅ `api/Controllers/ProofCardController.cs` - Regeneration endpoint

### Tests (verify badge rendering)
6. ✅ `api/Tests/ProofCardGeneratorTests.cs` - Unit tests
7. ✅ `api/Tests/ProofCardIntegrationTests.cs` - Integration tests
8. ✅ `api/Tests/ProofCardVisualTests.cs` - Visual regression tests
9. ✅ `app/tests/e2e/proof-card.spec.ts` - End-to-end tests

### Frontend
10. ✅ `app/src/app/core/services/proof-card-fallback.service.ts` - 404 handling

### Configuration
11. ✅ Updated `api/.gitignore` - Exclude generated PNGs
12. ✅ Updated `api/Program.cs` - DI, static files, CLI commands
13. ✅ Updated `api/Infrastructure/Services/ProofService.cs` - Auto-generate

---

## 🧪 Manual Testing After Implementation

### Test 1: Badge Asset Verification
```bash
# Start API
cd api && dotnet run

# Open in browser:
http://localhost:5000/assets/badges/verified_truwit.png

# ✅ Expected: Badge image displays
# ❌ If 404: Badge not copied correctly
```

### Test 2: Create Proof with Cards
```bash
# Create proof
curl -X POST http://localhost:5000/v1/proofs/url \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}' \
  | jq -r '.trustmarkId' > proof_id.txt

PROOF_ID=$(cat proof_id.txt)
echo "Proof ID: $PROOF_ID"

# Check if cards were generated
ls -lh api/wwwroot/assets/proof/${PROOF_ID}-*.png

# Expected:
# -rw-r--r--  TW-XXXXXXXX-640.png   (~100KB)
# -rw-r--r--  TW-XXXXXXXX-1024.png  (~200KB)
```

### Test 3: View Card in Browser
```bash
# Open in browser:
http://localhost:5000/assets/proof/${PROOF_ID}-640.png

# ✅ Verify checklist:
# [ ] Teal gradient background
# [ ] Circular badge visible and centered
# [ ] Badge has checkmark icon
# [ ] "verified by Truwit" text visible
# [ ] "Proof ID: TW-XXXXXXXX" displayed
# [ ] URL "truwit.ai/t/TW-XXXXXXXX" visible
# [ ] QR code in bottom-right corner
# [ ] Scan QR code → opens https://www.truwit.ai/t/TW-XXXXXXXX
```

### Test 4: Backfill Command
```bash
# Create 5 test proofs
for i in {1..5}; do
  curl -X POST http://localhost:5000/v1/proofs/url \
    -H "Content-Type: application/json" \
    -d "{\"url\":\"https://www.youtube.com/watch?v=test$i\"}"
  sleep 2
done

# Run backfill
cd api
dotnet run -- BACKFILL

# Expected output:
# ✓ TW-ABC12345 -> /assets/proof/TW-ABC12345-640.png , /assets/proof/TW-ABC12345-1024.png
# ✓ TW-DEF67890 -> /assets/proof/TW-DEF67890-640.png , /assets/proof/TW-DEF67890-1024.png
# ... (5 proofs × 2 sizes = 10 files)

# Verify
ls -1 api/wwwroot/assets/proof/*.png | wc -l
# Expected: 10
```

### Test 5: Truncate Command
```bash
cd api
dotnet run -- TRUNCATE

# Expected output:
# ✓ Truncated images in wwwroot/assets/proof and cleared DB pointers.

# Verify cards deleted
ls api/wwwroot/assets/proof/*.png 2>/dev/null | wc -l
# Expected: 0
```

### Test 6: Regenerate on Miss
```bash
# Delete a card
rm api/wwwroot/assets/proof/${PROOF_ID}-640.png

# Request via regeneration endpoint
curl -I http://localhost:5000/cards/proof/${PROOF_ID}-640.png

# Expected: HTTP/1.1 200 OK

# Verify regenerated
ls -lh api/wwwroot/assets/proof/${PROOF_ID}-640.png
# Expected: file exists
```

---

## 🚨 Common Issues & Solutions

### Issue: Badge asset not found (404)
**Symptom:** `/assets/badges/verified_truwit.png` returns 404

**Solution:**
```bash
# Check file exists
ls -lh api/wwwroot/assets/badges/verified_truwit.png

# If missing, copy from source:
cp app/src/assets/verified-circular-badge.jpg api/wwwroot/assets/badges/verified_truwit.png

# Restart API
cd api && dotnet run
```

### Issue: Cards not generating
**Symptom:** Proof created but no PNG files in `wwwroot/assets/proof/`

**Solution:**
```bash
# Check logs for errors
cd api
dotnet run | grep -i "proof card"

# Common causes:
# 1. SVG template missing → Check CardTemplates/proof-card.svg exists
# 2. Badge asset missing → Check wwwroot/assets/badges/verified_truwit.png exists
# 3. Write permissions → chmod -R 755 wwwroot/
# 4. Service not registered → Check Program.cs DI configuration
```

### Issue: QR code not scannable
**Symptom:** QR code visible but won't scan

**Solution:**
```bash
# Check QR size is appropriate (should be ~12% of card size)
# For 640px card: QR should be ~77px
# For 1024px card: QR should be ~123px

# Increase QR code error correction level in generator:
# QRCodeGenerator.ECCLevel.Q → QRCodeGenerator.ECCLevel.H
```

### Issue: Badge not visible in card
**Symptom:** Card generates but badge is missing or blank

**Solution:**
```bash
# 1. Verify badge file format
file api/wwwroot/assets/badges/verified_truwit.png
# Expected: PNG image data

# 2. Verify badge dimensions
identify api/wwwroot/assets/badges/verified_truwit.png
# Expected: 512x512 or larger

# 3. Check badge path in generator code
# Ensure path matches: wwwroot/assets/badges/verified_truwit.png
```

---

## 📚 Next Steps

1. ✅ **Run cleanup script** (Phase 0 above)
2. ✅ **Update GenerateShortId()** (Step 1)
3. ✅ **Copy badge asset** (Asset Management section)
4. ✅ **Verify badge loads** (Test 1)
5. ⏭️ **Ready for full implementation** (see `PROOF-CARD-IMPLEMENTATION-PLAN.md`)

---

## 📖 Related Documentation

- **`PROOF-CARD-IMPLEMENTATION-PLAN.md`** - Complete 14-phase implementation guide
- **`PROOF-CARD-GENERATOR-CONTEXT.md`** - Project structure analysis
- **`api/Scripts/README.md`** - Cleanup scripts documentation

---

*Ready to proceed? Start with Phase 0 cleanup!*

