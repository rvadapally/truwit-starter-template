using System.Text.Json;

namespace HumanProof.Api.Application.DTOs;

/// <summary>
/// Request to check C2PA manifest for a given URL
/// </summary>
public record C2paCheckRequest(string Url);

/// <summary>
/// Result of C2PA verification process
/// </summary>
public record C2paCheckResult(
    bool ManifestFound,
    string? Status,                  // "verified" | "not_found" | "invalid" | "error"
    string? ClaimGenerator,          // e.g., "TikTok-C2PA-Client"
    DateTimeOffset? ClaimTimestamp,
    IReadOnlyList<C2paAssertion> Assertions,
    string? SigningIssuer,           // CA/issuer name if present
    string? RawJson,                 // entire c2patool/hosted json for archive
    string? MediaSha256,             // fallback provenance
    string? Notes                    // any error/edge-case note
);

/// <summary>
/// Individual C2PA assertion
/// </summary>
public record C2paAssertion(string Label, string? Value);

/// <summary>
/// Platform detection result
/// </summary>
public enum MediaPlatform 
{ 
    YouTube, 
    TikTok, 
    Generic 
}

/// <summary>
/// Verification status for UI progress tracking
/// </summary>
public enum VerificationStep
{
    Starting,
    PlatformDetected,
    HostedVerificationAttempted,
    MediaDownloaded,
    LocalVerificationCompleted,
    HashComputed,
    GarmChecksRunning,
    ReceiptGeneration,
    Completed,
    Error
}

/// <summary>
/// Detailed verification status for real-time updates
/// </summary>
public record VerificationStatus(
    VerificationStep CurrentStep,
    string Message,
    bool IsCompleted,
    bool HasError,
    string? ErrorMessage,
    Dictionary<string, bool> CompletedSteps,
    C2paCheckResult? C2paResult,
    string? MediaPath,
    long? FileSizeBytes
);

/// <summary>
/// Configuration for C2PA verification
/// </summary>
public class C2paOptions
{
    public bool UseHostedVerifier { get; set; } = true;
    public string HostedVerifierBaseUrl { get; set; } = "https://verify.contentcredentials.org/api";
    public int RequestTimeoutSeconds { get; set; } = 20;
    public int MaxRetries { get; set; } = 1;
}

/// <summary>
/// Configuration for media downloader
/// </summary>
public class DownloaderOptions
{
    public string Bin { get; set; } = "/usr/local/bin/yt-dlp";
    public string TempDir { get; set; } = "/tmp/truwit_dl";
    public int TimeoutSeconds { get; set; } = 90;
    public long MaxBytes { get; set; } = 524288000; // 500MB
}

/// <summary>
/// Configuration for C2PA tool
/// </summary>
public class C2paToolOptions
{
    public string Bin { get; set; } = "/usr/local/bin/c2patool";
    public int TimeoutSeconds { get; set; } = 20;
}
