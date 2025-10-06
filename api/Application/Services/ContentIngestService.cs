using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using HumanProof.Api.Application.DTOs;
using HumanProof.Api.Domain.Enums;

namespace HumanProof.Api.Application.Services;

public interface IContentIngestService
{
    Task<ContentIngestResult> ProcessUrlAsync(string url, CancellationToken cancellationToken = default);
    Task<ContentIngestResult> ProcessFileAsync(IFormFile file, CancellationToken cancellationToken = default);
}

public class ContentIngestService : IContentIngestService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<ContentIngestService> _logger;
    private readonly IConfiguration _configuration;

    public ContentIngestService(
        HttpClient httpClient,
        ILogger<ContentIngestService> logger,
        IConfiguration configuration)
    {
        _httpClient = httpClient;
        _logger = logger;
        _configuration = configuration;
    }

    public async Task<ContentIngestResult> ProcessUrlAsync(string url, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Starting URL processing: {Url}", url);

            // Check if it's a YouTube URL
            if (IsYouTubeUrl(url))
            {
                return await ProcessYouTubeUrlAsync(url, cancellationToken);
            }

            // Process direct URL
            return await ProcessDirectUrlAsync(url, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing URL: {Url}", url);
            throw;
        }
    }

    public async Task<ContentIngestResult> ProcessFileAsync(IFormFile file, CancellationToken cancellationToken = default)
    {
        try
        {
            _logger.LogInformation("Starting file processing: {FileName}", file.FileName);

            using var stream = file.OpenReadStream();
            var (contentHash, perceptualHash) = await ComputeHashesAsync(stream, cancellationToken);

            return new ContentIngestResult
            {
                ContentHash = contentHash,
                PerceptualHash = perceptualHash,
                FileName = file.FileName,
                FileSize = file.Length,
                MimeType = file.ContentType,
                Duration = null, // Will be extracted by MediaInfoService
                Resolution = null, // Will be extracted by MediaInfoService
                SourceUrl = null
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing file: {FileName}", file.FileName);
            throw;
        }
    }

    private async Task<ContentIngestResult> ProcessYouTubeUrlAsync(string url, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Processing YouTube URL: {Url}", url);

        // For now, we'll simulate YouTube processing with a delay
        // In a real implementation, you'd use YoutubeExplode or similar library
        await Task.Delay(2000, cancellationToken); // Simulate processing time

        // Generate a mock content hash for YouTube URLs
        var mockContent = $"YouTube Video: {url}";
        using var mockStream = new MemoryStream(Encoding.UTF8.GetBytes(mockContent));
        var (contentHash, perceptualHash) = await ComputeHashesAsync(mockStream, cancellationToken);

        return new ContentIngestResult
        {
            ContentHash = contentHash,
            PerceptualHash = perceptualHash,
            FileName = "youtube_video.mp4",
            FileSize = mockContent.Length,
            MimeType = "video/mp4",
            Duration = 120, // Mock duration
            Resolution = "1920x1080", // Mock resolution
            SourceUrl = url
        };
    }

    private async Task<ContentIngestResult> ProcessDirectUrlAsync(string url, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Processing direct URL: {Url}", url);

        // Check content length first
        var maxBytes = _configuration.GetValue<long>("Limits:MaxBytes", 500_000_000); // 500MB default
        var contentLength = await GetContentLengthAsync(url, cancellationToken);

        if (contentLength > maxBytes)
        {
            throw new ArgumentException($"Content too large: {contentLength} bytes (max: {maxBytes})");
        }

        // Download and process content
        using var response = await _httpClient.GetAsync(url, HttpCompletionOption.ResponseHeadersRead, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("URL returned non-success status: {StatusCode} for URL: {Url}", response.StatusCode, url);
            throw new HttpRequestException($"URL returned {response.StatusCode} ({response.ReasonPhrase}) for URL: {url}");
        }

        using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        var (contentHash, perceptualHash) = await ComputeHashesAsync(stream, cancellationToken);

        return new ContentIngestResult
        {
            ContentHash = contentHash,
            PerceptualHash = perceptualHash,
            FileName = Path.GetFileName(new Uri(url).LocalPath),
            FileSize = response.Content.Headers.ContentLength ?? 0,
            MimeType = response.Content.Headers.ContentType?.MediaType ?? "application/octet-stream",
            Duration = null, // Will be extracted by MediaInfoService
            Resolution = null, // Will be extracted by MediaInfoService
            SourceUrl = url
        };
    }

    private async Task<(string contentHash, string perceptualHash)> ComputeHashesAsync(Stream stream, CancellationToken cancellationToken)
    {
        using var sha256 = SHA256.Create();
        using var perceptualHasher = new PerceptualHash();

        var contentHashBytes = await sha256.ComputeHashAsync(stream, cancellationToken);
        stream.Position = 0; // Reset for perceptual hash
        var perceptualHashBytes = await perceptualHasher.ComputeHashAsync(stream, cancellationToken);

        return (
            Convert.ToHexString(contentHashBytes).ToLowerInvariant(),
            Convert.ToHexString(perceptualHashBytes).ToLowerInvariant()
        );
    }

    private async Task<long> GetContentLengthAsync(string url, CancellationToken cancellationToken)
    {
        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Head, url);
            using var response = await _httpClient.SendAsync(request, cancellationToken);

            if (response.IsSuccessStatusCode)
            {
                return response.Content.Headers.ContentLength ?? 0;
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not get content length for URL: {Url}", url);
        }

        return 0; // Unknown length
    }

    private static bool IsYouTubeUrl(string url)
    {
        return url.Contains("youtube.com") || url.Contains("youtu.be");
    }
}

public class ContentIngestResult
{
    public string ContentHash { get; set; } = string.Empty;
    public string PerceptualHash { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string MimeType { get; set; } = string.Empty;
    public int? Duration { get; set; }
    public string? Resolution { get; set; }
    public string? SourceUrl { get; set; }
}

// Simple perceptual hash implementation for demo
public class PerceptualHash : IDisposable
{
    public async Task<byte[]> ComputeHashAsync(Stream stream, CancellationToken cancellationToken = default)
    {
        // Simple perceptual hash - in real implementation, this would be more sophisticated
        var buffer = new byte[1024];
        var hash = new byte[32];

        await stream.ReadAsync(buffer, 0, buffer.Length, cancellationToken);

        // Generate a simple hash based on content
        using var sha256 = SHA256.Create();
        return sha256.ComputeHash(buffer);
    }

    public void Dispose()
    {
        // Cleanup if needed
    }
}
