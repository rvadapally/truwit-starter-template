using HumanProof.Api.Application.DTOs;
using Microsoft.Extensions.Options;
using System.Net.Http.Headers;
using System.Text.RegularExpressions;

namespace HumanProof.Api.Application.Services;

/// <summary>
/// Media downloader using yt-dlp
/// </summary>
public sealed class YtDlpDownloader : IMediaDownloader
{
    private readonly IProcessRunner _processRunner; // retained but unused in MVP HTTP mode
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly DownloaderOptions _options;
    private readonly ILogger<YtDlpDownloader> _logger;

    public YtDlpDownloader(
        IProcessRunner processRunner,
        IHttpClientFactory httpClientFactory,
        IOptions<DownloaderOptions> options,
        ILogger<YtDlpDownloader> logger)
    {
        _processRunner = processRunner;
        _httpClientFactory = httpClientFactory;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<string> DownloadAsync(string url, string? userCookies = null, CancellationToken ct = default)
    {
        try
        {
            _logger.LogInformation("Starting HTTP download for URL: {Url}", url);

            // Ensure temp directory exists
            Directory.CreateDirectory(_options.TempDir);

            // We do not support authenticated downloads in MVP HTTP mode
            if (!string.IsNullOrWhiteSpace(userCookies))
            {
                _logger.LogWarning("Ignoring user-supplied cookies in HTTP download mode");
            }

            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(Math.Max(5, _options.TimeoutSeconds));

            using var request = new HttpRequestMessage(HttpMethod.Get, url);
            request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("video/*"));
            request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("image/*"));
            request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/octet-stream"));

            using var response = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, ct);
            if (!response.IsSuccessStatusCode)
            {
                throw new InvalidOperationException($"HTTP download failed: {(int)response.StatusCode} {response.ReasonPhrase}");
            }

            var contentType = response.Content.Headers.ContentType?.MediaType ?? "application/octet-stream";
            var ext = GuessExtension(url, contentType);
            var safeName = $"dl-{Guid.NewGuid():N}{ext}";
            var outputPath = Path.Combine(_options.TempDir, safeName);

            await using var responseStream = await response.Content.ReadAsStreamAsync(ct);
            await using var fileStream = new FileStream(outputPath, FileMode.Create, FileAccess.Write, FileShare.None, 81920, useAsync: true);

            long totalWritten = 0;
            var buffer = new byte[81920];
            int read;
            while ((read = await responseStream.ReadAsync(buffer.AsMemory(0, buffer.Length), ct)) > 0)
            {
                totalWritten += read;
                if (totalWritten > _options.MaxBytes)
                {
                    try { fileStream.Close(); File.Delete(outputPath); } catch { /* ignore */ }
                    throw new InvalidOperationException($"File too large: {totalWritten} bytes (max: {_options.MaxBytes})");
                }
                await fileStream.WriteAsync(buffer.AsMemory(0, read), ct);
            }

            _logger.LogInformation("Successfully downloaded file via HTTP: {FilePath} ({Size} bytes)", outputPath, totalWritten);
            return outputPath;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "HTTP download error for URL: {Url}", url);
            throw new InvalidOperationException($"Download failed: {ex.Message}", ex);
        }
    }

    private static string GuessExtension(string url, string contentType)
    {
        var ext = contentType.ToLowerInvariant() switch
        {
            "video/mp4" => ".mp4",
            "video/webm" => ".webm",
            "video/quicktime" => ".mov",
            "image/jpeg" or "image/jpg" => ".jpg",
            "image/png" => ".png",
            "image/gif" => ".gif",
            "image/webp" => ".webp",
            _ => null
        };
        if (!string.IsNullOrEmpty(ext)) return ext;

        try
        {
            var uri = new Uri(url);
            var path = uri.AbsolutePath;
            var m = Regex.Match(path, @"\.([a-zA-Z0-9]{2,5})$");
            if (m.Success) return "." + m.Groups[1].Value.ToLowerInvariant();
        }
        catch { /* ignore */ }

        return ".bin";
    }
}
