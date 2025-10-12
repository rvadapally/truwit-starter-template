using HumanProof.Api.Application.DTOs;
using Microsoft.Extensions.Options;

namespace HumanProof.Api.Application.Services;

/// <summary>
/// Media downloader using yt-dlp
/// </summary>
public sealed class YtDlpDownloader : IMediaDownloader
{
    private readonly IProcessRunner _processRunner;
    private readonly DownloaderOptions _options;
    private readonly ILogger<YtDlpDownloader> _logger;

    public YtDlpDownloader(
        IProcessRunner processRunner,
        IOptions<DownloaderOptions> options,
        ILogger<YtDlpDownloader> logger)
    {
        _processRunner = processRunner;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<string> DownloadAsync(string url, CancellationToken ct = default)
    {
        try
        {
            _logger.LogInformation("Starting download for URL: {Url}", url);

            // Ensure temp directory exists
            Directory.CreateDirectory(_options.TempDir);

            // Generate safe filename
            var safeName = Guid.NewGuid().ToString("N");
            var outputTemplate = Path.Combine(_options.TempDir, $"{safeName}.%(ext)s");

            // Build yt-dlp command
            var args = $"--no-playlist -f \"bv*+ba/b\" --merge-output-format mp4 -o \"{outputTemplate}\" \"{url}\"";

            _logger.LogDebug("Running yt-dlp with args: {Args}", args);

            var (exitCode, stdout, stderr) = await _processRunner.RunAsync(
                _options.Bin, 
                args, 
                _options.TimeoutSeconds, 
                ct);

            if (exitCode != 0)
            {
                _logger.LogError("yt-dlp failed with exit code {ExitCode}. Stderr: {Stderr}", exitCode, stderr);
                throw new InvalidOperationException($"yt-dlp failed: {stderr}");
            }

            // Find the downloaded file
            var downloadedFiles = Directory.GetFiles(_options.TempDir, $"{safeName}.*");
            var downloadedFile = downloadedFiles.FirstOrDefault();

            if (downloadedFile == null)
            {
                _logger.LogError("Downloaded file not found. Expected pattern: {Pattern}", $"{safeName}.*");
                throw new FileNotFoundException($"Download output not found for {safeName}");
            }

            // Check file size
            var fileInfo = new FileInfo(downloadedFile);
            if (fileInfo.Length > _options.MaxBytes)
            {
                _logger.LogError("Downloaded file too large: {Size} bytes (max: {MaxBytes})", fileInfo.Length, _options.MaxBytes);
                File.Delete(downloadedFile); // Clean up
                throw new InvalidOperationException($"File too large: {fileInfo.Length} bytes (max: {_options.MaxBytes})");
            }

            _logger.LogInformation("Successfully downloaded file: {FilePath} ({Size} bytes)", downloadedFile, fileInfo.Length);
            return downloadedFile;
        }
        catch (Exception ex) when (!(ex is InvalidOperationException || ex is FileNotFoundException))
        {
            _logger.LogError(ex, "Unexpected error during download for URL: {Url}", url);
            throw new InvalidOperationException($"Download failed: {ex.Message}", ex);
        }
    }
}
