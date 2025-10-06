using HumanProof.Api.Application.DTOs;

namespace HumanProof.Api.Application.Services;

/// <summary>
/// Main C2PA verification service
/// </summary>
public interface IC2paVerifier
{
    Task<C2paCheckResult> VerifyFromUrlAsync(string url, CancellationToken ct = default);
    Task<VerificationStatus> GetVerificationStatusAsync(string verificationId, CancellationToken ct = default);
}

/// <summary>
/// Hosted C2PA verification service (fast path)
/// </summary>
public interface IHostedC2paVerifier
{
    Task<(bool ok, C2paCheckResult? result)> TryVerifyAsync(string url, CancellationToken ct = default);
}

/// <summary>
/// Media downloader service
/// </summary>
public interface IMediaDownloader
{
    /// <summary>
    /// Downloads media from URL and returns absolute path to downloaded file
    /// </summary>
    Task<string> DownloadAsync(string url, CancellationToken ct = default);
}

/// <summary>
/// C2PA tool runner service
/// </summary>
public interface IC2paToolRunner
{
    Task<(bool ok, string json)> GetInfoJsonAsync(string mediaPath, CancellationToken ct = default);
}

/// <summary>
/// Platform detection service
/// </summary>
public interface IPlatformDetector
{
    MediaPlatform Detect(string url);
}

/// <summary>
/// File hashing service
/// </summary>
public interface IHasher
{
    Task<string> Sha256Async(string filePath, CancellationToken ct = default);
}

/// <summary>
/// Process runner utility
/// </summary>
public interface IProcessRunner
{
    Task<(int code, string stdout, string stderr)> RunAsync(
        string fileName, 
        string args, 
        int timeoutSecs, 
        CancellationToken ct = default);
}

/// <summary>
/// Verification status tracking service
/// </summary>
public interface IVerificationStatusTracker
{
    string StartVerification(string url);
    void UpdateStatus(string verificationId, VerificationStatus status);
    VerificationStatus? GetStatus(string verificationId);
    void CompleteVerification(string verificationId);
    void CleanupOldVerifications();
}
