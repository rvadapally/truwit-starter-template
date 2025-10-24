using HumanProof.Api.Application.Services;

namespace HumanProof.Api.Application.Services;

/// <summary>
/// Downloads YouTube thumbnails for content verification
/// This is 100% reliable - no cookies, no bot detection, no datacenter IP issues
/// Uses public YouTube CDN - works from any IP including Railway datacenters
/// </summary>
public interface IYouTubeThumbnailDownloader
{
    Task<string> DownloadThumbnailAsync(string videoId, CancellationToken ct = default);
}

public class YouTubeThumbnailDownloader : IYouTubeThumbnailDownloader
{
    private readonly ILogger<YouTubeThumbnailDownloader> _logger;
    private readonly HttpClient _httpClient;
    private readonly string _tempDir;

    public YouTubeThumbnailDownloader(
        ILogger<YouTubeThumbnailDownloader> logger,
        IHttpClientFactory httpClientFactory)
    {
        _logger = logger;
        _httpClient = httpClientFactory.CreateClient();
        _tempDir = Path.Combine(Path.GetTempPath(), "truwit_thumbnails");
        Directory.CreateDirectory(_tempDir);
    }

    public async Task<string> DownloadThumbnailAsync(string videoId, CancellationToken ct = default)
    {
        _logger.LogInformation("Downloading YouTube thumbnail for video: {VideoId}", videoId);

        // YouTube thumbnail URLs (in order of quality preference)
        // Include live variants and additional fallbacks for broader coverage
        var thumbnailUrls = new[]
        {
            $"https://img.youtube.com/vi/{videoId}/maxresdefault.jpg",        // 1920x1080
            $"https://img.youtube.com/vi/{videoId}/maxresdefault_live.jpg",   // Live stream variant
            $"https://img.youtube.com/vi/{videoId}/sddefault.jpg",            // 640x480
            $"https://img.youtube.com/vi/{videoId}/sddefault_live.jpg",       // Live stream variant
            $"https://img.youtube.com/vi/{videoId}/hqdefault.jpg",            // 480x360
            $"https://img.youtube.com/vi/{videoId}/hqdefault_live.jpg",       // Live stream variant
            $"https://img.youtube.com/vi/{videoId}/mqdefault.jpg",            // 320x180
            $"https://img.youtube.com/vi/{videoId}/default.jpg"               // 120x90
        };

        Exception? lastException = null;

        foreach (var url in thumbnailUrls)
        {
            try
            {
                _logger.LogDebug("Trying thumbnail URL: {Url}", url);
                
                var response = await _httpClient.GetAsync(url, ct);
                
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsByteArrayAsync(ct);
                    
                    // Verify it's actually an image (not a placeholder/error)
                    if (content.Length > 1000) // Real images are > 1KB
                    {
                        var outputPath = Path.Combine(_tempDir, $"{videoId}_thumbnail.jpg");
                        await File.WriteAllBytesAsync(outputPath, content, ct);
                        
                        _logger.LogInformation(
                            "Successfully downloaded thumbnail: {OutputPath}, Size: {Size} bytes",
                            outputPath,
                            content.Length);
                        
                        return outputPath;
                    }
                    
                    _logger.LogDebug("Thumbnail too small ({Size} bytes), trying next quality", content.Length);
                }
                else
                {
                    _logger.LogDebug("HTTP {StatusCode} for {Url}", response.StatusCode, url);
                }
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Failed to download from {Url}", url);
                lastException = ex;
            }
        }

        throw new InvalidOperationException(
            $"Failed to download thumbnail for video {videoId}. All quality options failed.",
            lastException);
    }
}

