# Multi-Sign System Tests (Phase 7)

## Quick Start - Automated Test Scripts

### PowerShell (Windows) ✨ **RECOMMENDED**

```powershell
# Start the API first
cd api
dotnet run

# In another terminal, run the test script
cd api/Tests
.\test-multisign-flow.ps1

# Optional: Use custom test image
.\test-multisign-flow.ps1 -TestImagePath "C:\path\to\image.png" -Verbose

# Optional: Test against different API
.\test-multisign-flow.ps1 -ApiUrl "https://api.truwit.ai" -Verbose
```

### Bash/curl (Linux/Mac)

```bash
# Start the API first
cd api
dotnet run

# In another terminal, run the test script
cd api/Tests
chmod +x test-multisign-flow.sh
./test-multisign-flow.sh

# Optional: Use custom test image
TEST_IMAGE=/path/to/image.png VERBOSE=true ./test-multisign-flow.sh

# Optional: Test against different API
API_URL=https://api.truwit.ai ./test-multisign-flow.sh
```

**What the scripts test:**
1. ✅ API Health Check
2. ✅ Initialize Proof (`POST /v1/proofs/init`)
3. ✅ Finalize Proof with image upload (`POST /v1/proofs/finalize`)
4. ✅ Anonymous Authentication (`POST /v1/auth/anonymous`)
5. ✅ Create Signature (`POST /v1/signatures`)
6. ✅ Get Manifest (`GET /v1/manifest/{groupId}`)
7. ✅ Get Badge SVG (`GET /v1/badge/{groupId}.svg`)
8. ✅ Rate Limiting (optional, 15 rapid requests)

**Expected Output:**
```
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║        Multi-Sign System Integration Test Suite              ║
║                                                               ║
║        Testing Phases 4-7 Implementation                      ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

✅ API is healthy
✅ Init proof succeeded
✅ Finalize proof succeeded
✅ Anonymous auth succeeded
✅ Signature created successfully
✅ Manifest retrieved successfully
✅ Badge SVG retrieved successfully

🎉 ALL TESTS PASSED!
Implementation complete, all verification steps passed.
```

---

## Test Coverage

### Unit Tests (Future)
- **TestHashing.cs**: SHA256 and pHash computation tests
- **TestSignatures.cs**: Multi-signature and identity tests
- **TestBadgeRender.cs**: Badge SVG generation tests

### Integration Tests (Automated)

To test the full multi-sign workflow:

1. **Start the API**:
   ```bash
   cd api
   dotnet run
   ```

2. **Test Sequence** (using curl or Postman):

#### 1. Initialize Proof
```bash
curl -X POST http://localhost:5000/v1/proofs/init \
  -H "Content-Type: application/json" \
  -d '{"fileName":"test.png","byteSize":12345,"mime":"image/png"}'
```

#### 2. Finalize Proof (upload image)
```bash
# Encode image to base64 first
# On Windows: [Convert]::ToBase64String([IO.File]::ReadAllBytes("test.png"))
# On Linux/Mac: base64 test.png

curl -X POST http://localhost:5000/v1/proofs/finalize \
  -H "Content-Type: application/json" \
  -d '{
    "sha256Hex":"COMPUTED_SHA256_HEX",
    "imageBase64":"BASE64_STRING_HERE",
    "techMeta":{"tool":"test"}
  }'
```

Expected response:
```json
{
  "groupId": "...",
  "fileId": "...",
  "manifestUrl": "https://truwit.ai/v1/manifest/..."
}
```

#### 3. Get Anonymous Identity
```bash
curl -X POST http://localhost:5000/v1/auth/anonymous
```

Expected response:
```json
{
  "identity_token": "JWT_TOKEN_HERE"
}
```

#### 4. Sign the File
```bash
curl -X POST http://localhost:5000/v1/signatures \
  -H "Authorization: Bearer JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "fileId":"FILE_ID_FROM_STEP_2",
    "statement":{"claim":"creator","notes":"Original creator"}
  }'
```

Expected response:
```json
{
  "sigId": "...",
  "signedAt": "2025-10-24T12:00:00Z"
}
```

#### 5. Fetch Manifest
```bash
curl http://localhost:5000/v1/manifest/GROUP_ID_FROM_STEP_2
```

Expected response: JSON with files, signatures, and stats

#### 6. Get Badge SVG
```bash
curl http://localhost:5000/v1/badge/GROUP_ID_FROM_STEP_2.svg > badge.svg
# Open badge.svg in browser
```

### Grouping Test

Upload a slightly cropped/resized version of the same image. It should:
- Return the **same groupId** if pHash distance ≤ 6 bits
- Create a **new AssetFile** with different fileId
- Group both files under the same AssetGroup

### Rate Limiting Test

```bash
# Send 30 requests in quick succession
for i in {1..30}; do 
  curl -X POST http://localhost:5000/v1/proofs/finalize \
    -H "Content-Type: application/json" \
    -d '{"sha256Hex":"test","imageBase64":"test"}' 
done
```

Expected: HTTP 429 (Too Many Requests) after 10 requests with `Retry-After` header

### Database Verification

```sql
-- Check AssetGroups
SELECT group_id, encode(phash, 'hex') as phash_hex, created_at 
FROM "AssetGroups";

-- Check AssetFiles
SELECT file_id, group_id, encode(sha256, 'hex') as sha256_hex, width, height 
FROM "AssetFiles";

-- Check Identities
SELECT identity_id, provider, handle, display_name 
FROM "Identities";

-- Check Signatures
SELECT sig_id, file_id, identity_id, signed_at, statement_json 
FROM "Signatures";

-- Check ManifestEvents
SELECT event_id, group_id, kind, created_at 
FROM "ManifestEvents" 
ORDER BY created_at DESC;
```

## Expected Deliverables

- [ ] Screenshot of badge.svg rendering in browser
- [ ] Sample manifest.json with 2+ signers
- [ ] Database ERD (via `dotnet ef dbcontext scaffold` or dbdiagram.io)
- [ ] Confirmation that pHash grouping works (same groupId for similar images)
- [ ] Confirmation that rate limits are enforced (429 responses)
- [ ] All logs written in single-line JSON format

## Swagger UI

Access Swagger at: http://localhost:5000/swagger

All new endpoints should be visible:
- `POST /v1/proofs/init`
- `POST /v1/proofs/finalize`
- `POST /v1/signatures`
- `GET /v1/manifest/{groupId}`
- `GET /v1/badge/{groupId}.svg`
- `POST /v1/auth/anonymous`
- `GET /v1/auth/login/google`

## Notes

- JWT tokens expire after 15 minutes
- Badge SVGs include QR code linking to manifest
- Badge SVG target size: <25KB
- Rate limits: finalize=10/min, signatures=20/min, anon=5/min

