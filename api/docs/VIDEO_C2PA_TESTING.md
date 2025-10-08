# Video C2PA Testing Guide

This guide explains how to test the C2PA video verification features in development mode.

## Prerequisites

1. **Development Environment**: Ensure you're running in Development mode (`ASPNETCORE_ENVIRONMENT=Development`)
2. **Feature Flags**: Enable dev features in `appsettings.json`:
   ```json
   {
     "Features": {
       "DevImageTestMode": true,
       "SyntheticSignTool": true
     }
   }
   ```
3. **Required Tools**: Install the following tools:
   - `yt-dlp` - for downloading videos
   - `c2patool` - for C2PA operations
   - `ffmpeg` - for media processing

## Testing Workflow

### 1. Check Toolchain Health

First, verify all required tools are installed and working:

```bash
GET /health/tools
```

Expected response:
```json
{
  "yt-dlp": "2024.01.01",
  "c2patool": "1.0.0",
  "ffmpeg": "ffmpeg version 6.0"
}
```

### 2. Create Test C2PA-Signed Video (Dev Mode)

In development mode, you can create C2PA-signed test videos:

```bash
POST /dev/sign
Content-Type: multipart/form-data

file: [upload an MP4 file]
```

**Requirements:**
- Only available in Development mode
- Requires `SyntheticSignTool` feature flag enabled
- Dev keys must exist at `keys/dev.key` and `keys/dev.pem`
- Only MP4 files accepted

**Response:**
```json
{
  "signedPath": "/tmp/signed_video.mp4",
  "sizeBytes": 1234567,
  "message": "File signed successfully"
}
```

### 3. Upload and Verify Files

#### Upload Regular Video (No C2PA)
```bash
POST /v1/proofs/file-upload
Content-Type: multipart/form-data

file: [upload regular MP4]
likenessOwnerName: "Test User"
consentEvidenceUrl: "https://example.com/consent"
```

#### Upload C2PA-Signed Video
```bash
POST /v1/proofs/file-upload
Content-Type: multipart/form-data

file: [upload C2PA-signed MP4 from step 2]
likenessOwnerName: "Test User"
consentEvidenceUrl: "https://example.com/consent"
```

#### Upload Image (Dev Mode Only)
```bash
POST /v1/proofs/file-upload
Content-Type: multipart/form-data

file: [upload JPG or PNG image]
likenessOwnerName: "Test User"
```

**Expected Response:**
```json
{
  "proofId": "abc123...",
  "trustmarkId": "def456",
  "verifyUrl": "/t/def456",
  "assetId": "ghi789...",
  "assetReused": false,
  "c2pa": true,
  "origin": {
    "c2pa": true,
    "status": "verified",
    "claimGenerator": "Test Generator",
    "issuer": "Test Issuer",
    "timestamp": "2024-01-01T12:00:00Z",
    "sha256": "abc123..."
  }
}
```

### 4. Verify Proof Results

#### By Trustmark ID
```bash
GET /v1/verify-trustmark/{trustmarkId}
```

#### By Proof ID
```bash
GET /v1/verify/{proofId}
```

**Expected Response:**
```json
{
  "proofId": "abc123...",
  "verdict": "green",
  "contentHash": "abc123...",
  "mime": "video/mp4",
  "duration": null,
  "resolution": null,
  "declared": {
    "generator": "Test Generator",
    "prompt": "",
    "license": "creator-owned"
  },
  "issuedAt": "2024-01-01T12:00:00Z",
  "signatureStatus": "valid",
  "origin": {
    "c2pa": true,
    "status": "verified",
    "claimGenerator": "Test Generator",
    "issuer": "Test Issuer",
    "timestamp": "2024-01-01T12:00:00Z",
    "sha256": "abc123..."
  }
}
```

## Frontend Testing

### Angular Development Mode

1. **Dev Test Mode Indicator**: In development builds, you'll see a "Dev test mode is ON" chip
2. **Image Upload Support**: When `devTestMode: true` is returned from the API, the UI allows JPG/PNG uploads
3. **Origin Card**: Results show an Origin card with:
   - **C2PA Found**: Green card showing generator, issuer, timestamp
   - **No Credentials**: Gray card showing SHA-256 fingerprint

### File Type Validation

- **Production**: Only video files (MP4, AVI, MOV, WebM)
- **Development + DevImageTestMode**: Also allows images (JPG, PNG)

## Error Scenarios

### Missing Tools
```bash
GET /health/tools
# Returns 500 if any tool is missing
```

### Invalid File Types
```bash
POST /v1/proofs/file-upload
# Returns 400 with message about supported file types
```

### Dev Signing in Production
```bash
POST /dev/sign
# Returns 403 Forbidden in production
```

## Postman Collection

Import the `Truwit-Video-C2PA.postman_collection.json` file into Postman to get pre-configured requests with:

- Environment variables for base URL and sample IDs
- Pre-filled request bodies
- Example responses

## Troubleshooting

### Common Issues

1. **Tools Not Found**: Ensure `yt-dlp`, `c2patool`, and `ffmpeg` are in PATH
2. **Dev Keys Missing**: Create dev keys at `keys/dev.key` and `keys/dev.pem`
3. **Feature Flags**: Verify feature flags are enabled in `appsettings.json`
4. **Environment**: Ensure `ASPNETCORE_ENVIRONMENT=Development`

### Logs

Check application logs for detailed error messages:
- C2PA parsing results
- File type validation
- Tool execution errors
- Feature flag status

## Security Notes

- Dev signing endpoint is only available in Development mode
- Image uploads are only allowed with feature flag enabled
- All dev features are automatically disabled in production builds
