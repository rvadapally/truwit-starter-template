namespace HumanProof.Api.Application.Services;

/// <summary>
/// Result of YouTube video hashing operation
/// </summary>
/// <param name="FilePath">Path to the downloaded video file</param>
/// <param name="Sha256">SHA256 hash of the video content</param>
/// <param name="Bytes">Size of the downloaded video in bytes</param>
/// <param name="DurationSeconds">Duration of the video (or segment) in seconds</param>
/// <param name="WasTruncated">True if only first 15 minutes were downloaded (video > 15 min)</param>
public record VideoHashResult(
    string FilePath,
    string Sha256,
    long Bytes,
    double DurationSeconds,
    bool WasTruncated
);

/// <summary>
/// Service for downloading and hashing YouTube videos
/// Implements 15-minute smart hashing strategy:
/// - Videos ≤ 15 min: Hash entire video
/// - Videos > 15 min: Hash only first 15 minutes
/// </summary>
public interface IYouTubeVideoHasher
{
    /// <summary>
    /// Download and hash a YouTube video
    /// </summary>
    /// <param name="videoId">YouTube video ID (11 characters)</param>
    /// <param name="ct">Cancellation token</param>
    /// <returns>Video hash result with file path, hash, and metadata</returns>
    /// <exception cref="YouTubeCookieException">Thrown when cookie authentication fails</exception>
    Task<VideoHashResult> HashVideoAsync(string videoId, CancellationToken ct = default);
}

