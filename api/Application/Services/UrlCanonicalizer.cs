using System.Text.RegularExpressions;
using HumanProof.Api.Application.DTOs;

namespace HumanProof.Api.Application.Services;

/// <summary>
/// Service to canonicalize URLs for different media platforms
/// </summary>
public interface IUrlCanonicalizer
{
    /// <summary>
    /// Canonicalizes a URL to extract platform and stable identifier
    /// </summary>
    /// <param name="url">The input URL</param>
    /// <returns>Tuple of (platform, canonicalId)</returns>
    (MediaPlatform platform, string canonicalId) Canonicalize(string url);
}

public class UrlCanonicalizer : IUrlCanonicalizer
{
    private static readonly Regex YouTubeVideoRegex = new(
        @"(?:youtube\.com/watch\?v=|youtu\.be/)([a-zA-Z0-9_-]{11})",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    private static readonly Regex TikTokVideoRegex = new(
        @"tiktok\.com/@([^/]+)/video/(\d+)",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    public (MediaPlatform platform, string canonicalId) Canonicalize(string url)
    {
        if (string.IsNullOrWhiteSpace(url))
            throw new ArgumentException("URL cannot be null or empty", nameof(url));

        // Normalize URL
        var normalizedUrl = url.Trim().ToLowerInvariant();

        // Check YouTube
        var youtubeMatch = YouTubeVideoRegex.Match(normalizedUrl);
        if (youtubeMatch.Success)
        {
            var videoId = youtubeMatch.Groups[1].Value;
            return (MediaPlatform.YouTube, $"yt:{videoId}");
        }

        // Check TikTok
        var tiktokMatch = TikTokVideoRegex.Match(normalizedUrl);
        if (tiktokMatch.Success)
        {
            var username = tiktokMatch.Groups[1].Value;
            var videoId = tiktokMatch.Groups[2].Value;
            return (MediaPlatform.TikTok, $"tt:{username}:{videoId}");
        }

        // Generic URL canonicalization
        try
        {
            var uri = new Uri(normalizedUrl);
            var canonicalId = $"{uri.Scheme}://{uri.Host}{uri.AbsolutePath}";
            return (MediaPlatform.Generic, canonicalId);
        }
        catch (UriFormatException)
        {
            throw new ArgumentException($"Invalid URL format: {url}", nameof(url));
        }
    }
}
