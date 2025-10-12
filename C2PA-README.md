# Truwit C2PA Verifier (.NET)

A comprehensive C2PA (Coalition for Content Provenance and Authenticity) verification system built with .NET 8, featuring both hosted verification (fast path) and local verification (robust fallback) for YouTube, TikTok, and generic media URLs.

## 🚀 Features

- **Dual Verification Paths**: Hosted API (fast) + Local c2patool (robust)
- **Platform Support**: YouTube, TikTok, and generic media URLs
- **Real-time Status Tracking**: Detailed progress with checkmarks
- **Comprehensive Error Handling**: Clear error messages and fallbacks
- **SHA-256 Fallback**: Content fingerprinting when C2PA manifests are not found
- **Docker Ready**: Complete containerization with all dependencies

## 🏗️ Architecture

```
POST /v1/proofs/url { url }
    ↓
Detect Platform (YouTube | TikTok | Generic)
    ↓
Try Hosted Verification (fast path)
    ↳ if C2PA present → parse, persist, return
    ↓
Fallback: Download Media (yt-dlp)
    ↓
Run c2patool --info --json
    ↓
Parse Result
    ↓
If still none → compute SHA-256 as provenance fallback
    ↓
Build Receipt (JSON+PDF)
    ↓
Return {proof_id, trustmark_id, /t/:id}
```

## 📋 Verification Steps

The system provides real-time status updates with the following steps:

1. **[✓] Platform Detection** - Identify YouTube, TikTok, or generic media
2. **[✓] C2PA Hosted Verification** - Fast API call to Content Credentials verifier
3. **[✓] Media Download** - Download media using yt-dlp (if hosted verification fails)
4. **[✓] C2PA Local Verification** - Run c2patool on downloaded media
5. **[✓] Hash Computation** - Compute SHA-256 fingerprint as fallback
6. **[✓] GARM Checks** - Content safety verification
7. **[✓] Receipt Generation** - Generate verification receipt

## 🛠️ Dependencies

### External Tools (installed in container)
- **yt-dlp** - Best-in-class YouTube/TikTok downloader
- **c2patool** - C2PA manifest parser/validator
- **ffprobe** - Lightweight media metadata extraction

### Hosted API (optional fast path)
- **Content Credentials Verifier** - `https://verify.contentcredentials.org/api/verify`

## ⚙️ Configuration

```json
{
  "C2pa": {
    "UseHostedVerifier": true,
    "HostedVerifierBaseUrl": "https://verify.contentcredentials.org/api",
    "RequestTimeoutSeconds": 20,
    "MaxRetries": 1
  },
  "Downloader": {
    "Bin": "yt-dlp",
    "TempDir": "./temp_downloads",
    "TimeoutSeconds": 90,
    "MaxBytes": 524288000
  },
  "C2paTool": {
    "Bin": "c2patool",
    "TimeoutSeconds": 20
  }
}
```

## 🚀 Quick Start

### Development
```bash
# Start the API
cd api
dotnet run --urls "http://localhost:5000"

# Start the Angular frontend
cd truwit-integrated
npm run dev
```

### Docker
```bash
# Build and run with Docker Compose
docker-compose up --build

# Or build the Docker image manually
cd api
docker build -t truwit-c2pa-verifier .
docker run -p 5000:8080 truwit-c2pa-verifier
```

## 📡 API Endpoints

### Create Proof from URL
```http
POST /v1/proofs
Content-Type: application/json

{
  "input": {
    "url": "https://youtu.be/QtWt1kArhFw?si=9Lf06mB65AthlOTX"
  },
  "declared": {
    "generator": "Unknown",
    "prompt": "Content verification request",
    "license": "creator_owned"
  }
}
```

### Get Verification Status
```http
GET /v1/verification-status/{verificationId}
```

### Verify Proof
```http
GET /v1/verify/{id}
```

## 🔍 C2PA Result Structure

```csharp
public record C2paCheckResult(
    bool ManifestFound,                    // true if C2PA manifest detected
    string? Status,                         // "verified" | "not_found" | "invalid" | "error"
    string? ClaimGenerator,                 // e.g., "TikTok-C2PA-Client"
    DateTimeOffset? ClaimTimestamp,        // When the claim was made
    IReadOnlyList<C2paAssertion> Assertions, // C2PA assertions found
    string? SigningIssuer,                 // CA/issuer name if present
    string? RawJson,                       // Raw JSON for archival
    string? MediaSha256,                   // SHA-256 fallback fingerprint
    string? Notes                          // Additional notes
);
```

## 🧪 Testing Matrix

| Case | Input | Expected Result |
|------|-------|----------------|
| TikTok AI video (public) | TikTok URL | Hosted verifier → **present**; else download → c2pa **present** |
| YouTube normal vlog | YouTube URL | hosted: none; fallback: none → **sha256 fallback** |
| Leica M11-P image | Local JPEG | c2patool shows **present** |
| Corrupted download | Bad URL | error → return `fetch_failed` |
| Tampered manifest | Local file modified | c2patool → **invalid signature** |
| Large media | >500MB | rejected with "too large" |

## 🔒 Security Features

- **Sandbox Downloads**: Write only to `/tmp/truwit_dl`, delete after parse
- **Size Limits**: Reject files over `MaxBytes` (500MB default)
- **Timeouts**: 20s hosted verify, 90s download, 20s c2pa parse
- **Rate Limiting**: Per IP for `/v1/proofs/url` (configurable)
- **Caching**: 24-hour cache on hosted verifier responses
- **Process Isolation**: All external tools run with strict timeouts

## 📊 Receipt Information

The verification receipt shows:

- **C2PA Status**: `present` or `not found`
- **Claim Generator**: e.g., "TikTok-C2PA-Client"
- **Issuer**: Certificate authority (if provided)
- **Claimed At**: Timestamp of the claim
- **SHA-256**: Fingerprint value (if no C2PA manifest)
- **Source**: `HostedVerifier` or `c2patool`

## 🐳 Docker Details

The Dockerfile includes:
- .NET 8 runtime
- Python 3 + pip for yt-dlp
- ffmpeg for media processing
- c2patool binary (Linux x64)
- Health checks
- Proper volume mounts for data persistence

## 🔧 Development Notes

- **Process Runner**: All external tools use `ProcessRunner` with strict timeouts
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Status Tracking**: Real-time status updates via `VerificationStatusTracker`
- **Cleanup**: Automatic cleanup of temporary files and old verification statuses
- **Logging**: Structured logging throughout the verification pipeline

## 📈 Performance

- **Hosted Verification**: ~2-5 seconds (fast path)
- **Local Verification**: ~30-90 seconds (depending on media size)
- **SHA-256 Fallback**: ~5-10 seconds
- **Memory Usage**: Minimal, with automatic cleanup
- **Concurrent Requests**: Supports multiple simultaneous verifications

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
