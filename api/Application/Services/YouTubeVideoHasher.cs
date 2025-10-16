using System.Diagnostics;
using System.Security.Cryptography;
using System.Text.RegularExpressions;
using HumanProof.Api.Domain.Exceptions;
using Microsoft.Extensions.Options;

namespace HumanProof.Api.Application.Services;

/// <summary>
/// YouTube video hasher with 15-minute smart strategy and database-stored cookies
/// </summary>
public class YouTubeVideoHasher : IYouTubeVideoHasher
{
    private readonly ISettingsService _settingsService;
    private readonly ILogger<YouTubeVideoHasher> _logger;
    private readonly string _tempDir;
    private readonly int _timeoutSeconds;
    private const double MAX_DURATION_SECONDS = 900.0; // 15 minutes

    public YouTubeVideoHasher(
        ISettingsService settingsService,
        ILogger<YouTubeVideoHasher> logger,
        IOptions<AppOptions> options)
    {
        _settingsService = settingsService;
        _logger = logger;
        _tempDir = options.Value.TempDir;
        _timeoutSeconds = 300; // 5 minutes timeout
        Directory.CreateDirectory(_tempDir);
    }

    public async Task<VideoHashResult> HashVideoAsync(string videoId, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(videoId))
        {
            throw new ArgumentException("Video ID cannot be null or empty", nameof(videoId));
        }

        _logger.LogInformation("🎬 Starting YouTube video hash for video: {VideoId}", videoId);

        string? tempCookieFile = null;
        string? outputFilePath = null;

        try
        {
            // Step 1: Get cookies from database and write to temp file
            tempCookieFile = await PrepareCookieFileAsync(ct);

            // Step 2: Get video duration to determine download strategy
            var duration = await GetVideoDurationAsync(videoId, tempCookieFile, ct);
            _logger.LogInformation("📊 Video duration: {Duration:F2} seconds ({Minutes:F1} minutes)",
                duration, duration / 60.0);

            // Step 3: Download video (full or partial based on duration)
            var wasTruncated = duration > MAX_DURATION_SECONDS;
            outputFilePath = await DownloadVideoAsync(videoId, tempCookieFile, wasTruncated, ct);

            // Step 4: Calculate SHA256 hash
            var sha256 = await CalculateSha256Async(outputFilePath, ct);
            var fileInfo = new FileInfo(outputFilePath);

            var actualDuration = wasTruncated ? MAX_DURATION_SECONDS : duration;

            _logger.LogInformation("✅ Video hash completed: {Sha256}, Size: {Bytes} bytes, Truncated: {Truncated}",
                sha256, fileInfo.Length, wasTruncated);

            return new VideoHashResult(
                FilePath: outputFilePath,
                Sha256: sha256,
                Bytes: fileInfo.Length,
                DurationSeconds: actualDuration,
                WasTruncated: wasTruncated
            );
        }
        catch (YouTubeCookieException)
        {
            // Clean up and re-throw cookie exceptions
            CleanupFile(outputFilePath);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Failed to hash YouTube video: {VideoId}", videoId);
            CleanupFile(outputFilePath);
            throw;
        }
        finally
        {
            // Always clean up temporary cookie file
            CleanupFile(tempCookieFile);
        }
    }

    private async Task<string> PrepareCookieFileAsync(CancellationToken ct)
    {
        _logger.LogDebug("Fetching YouTube cookies from database");

        var cookies = await _settingsService.GetSettingAsync("YOUTUBE_COOKIES");

        if (string.IsNullOrWhiteSpace(cookies))
        {
            throw new YouTubeCookieException("YouTube cookies not configured in database. Please set YOUTUBE_COOKIES in ServiceSettings.");
        }

        // Write cookies to temporary file
        var tempCookieFile = Path.Combine(_tempDir, $"yt_cookies_{Guid.NewGuid():N}.txt");
        await File.WriteAllTextAsync(tempCookieFile, cookies, ct);

        _logger.LogDebug("Cookies written to temporary file: {FilePath}", tempCookieFile);

        return tempCookieFile;
    }

    private async Task<double> GetVideoDurationAsync(string videoId, string cookieFile, CancellationToken ct)
    {
        _logger.LogDebug("Getting video duration for: {VideoId}", videoId);

        var url = $"https://www.youtube.com/watch?v={videoId}";
        var args = $"--cookies \"{cookieFile}\" --get-duration --no-warnings {url}";

        var output = await RunYtDlpAsync(args, ct);

        // Parse duration from output (format: HH:MM:SS or MM:SS or SS)
        var durationMatch = Regex.Match(output, @"(\d+):(\d+):(\d+)|(\d+):(\d+)|(\d+)");

        if (!durationMatch.Success)
        {
            throw new InvalidOperationException($"Failed to parse video duration from output: {output}");
        }

        double totalSeconds = 0;

        if (durationMatch.Groups[1].Success) // HH:MM:SS
        {
            totalSeconds = int.Parse(durationMatch.Groups[1].Value) * 3600 +
                          int.Parse(durationMatch.Groups[2].Value) * 60 +
                          int.Parse(durationMatch.Groups[3].Value);
        }
        else if (durationMatch.Groups[4].Success) // MM:SS
        {
            totalSeconds = int.Parse(durationMatch.Groups[4].Value) * 60 +
                          int.Parse(durationMatch.Groups[5].Value);
        }
        else if (durationMatch.Groups[6].Success) // SS
        {
            totalSeconds = int.Parse(durationMatch.Groups[6].Value);
        }

        return totalSeconds;
    }

    private async Task<string> DownloadVideoAsync(string videoId, string cookieFile, bool truncate, CancellationToken ct)
    {
        var url = $"https://www.youtube.com/watch?v={videoId}";
        var outputPath = Path.Combine(_tempDir, $"{videoId}_video.mp4");

        _logger.LogInformation("📥 Downloading video: {VideoId} (Truncate: {Truncate})", videoId, truncate);

        // Build yt-dlp arguments
        var args = $"--cookies \"{cookieFile}\" --format \"bestvideo[height<=1080]+bestaudio/best[height<=1080]\" --output \"{outputPath}\" --no-warnings --no-playlist";

        if (truncate)
        {
            // Download only first 15 minutes (900 seconds)
            args += " --download-sections \"*0-900\"";
            _logger.LogInformation("⏱️ Downloading first 15 minutes only (video is longer)");
        }

        args += $" {url}";

        await RunYtDlpAsync(args, ct);

        if (!File.Exists(outputPath))
        {
            throw new InvalidOperationException($"yt-dlp completed but output file not found: {outputPath}");
        }

        _logger.LogInformation("✅ Download completed: {OutputPath}", outputPath);

        return outputPath;
    }

    private async Task<string> RunYtDlpAsync(string args, CancellationToken ct)
    {
        var psi = new ProcessStartInfo
        {
            FileName = "yt-dlp",
            Arguments = args,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        using var process = new Process { StartInfo = psi };
        var outputBuilder = new System.Text.StringBuilder();
        var errorBuilder = new System.Text.StringBuilder();

        process.OutputDataReceived += (sender, e) =>
        {
            if (e.Data != null)
            {
                outputBuilder.AppendLine(e.Data);
                _logger.LogDebug("yt-dlp output: {Output}", e.Data);
            }
        };

        process.ErrorDataReceived += (sender, e) =>
        {
            if (e.Data != null)
            {
                errorBuilder.AppendLine(e.Data);
                _logger.LogDebug("yt-dlp error: {Error}", e.Data);
            }
        };

        process.Start();
        process.BeginOutputReadLine();
        process.BeginErrorReadLine();

        using var timeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(_timeoutSeconds));
        using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(ct, timeoutCts.Token);

        try
        {
            await process.WaitForExitAsync(linkedCts.Token);
        }
        catch (OperationCanceledException)
        {
            try
            {
                process.Kill(true);
            }
            catch { }

            if (timeoutCts.IsCancellationRequested)
            {
                throw new TimeoutException($"yt-dlp process timed out after {_timeoutSeconds} seconds");
            }

            throw;
        }

        var output = outputBuilder.ToString();
        var error = errorBuilder.ToString();

        // Check for cookie authentication errors
        if (error.Contains("Sign in to confirm you're not a bot") ||
            error.Contains("Sign in to confirm your age") ||
            error.Contains("This video is private") ||
            error.Contains("This video is unavailable"))
        {
            _logger.LogError("🚫 YouTube cookie authentication failed: {Error}", error);
            throw new YouTubeCookieException($"YouTube authentication failed. Cookies may be expired or invalid. Error: {error}");
        }

        if (process.ExitCode != 0)
        {
            throw new InvalidOperationException($"yt-dlp failed with exit code {process.ExitCode}. Error: {error}");
        }

        return output;
    }

    private async Task<string> CalculateSha256Async(string filePath, CancellationToken ct)
    {
        _logger.LogDebug("Calculating SHA256 hash for: {FilePath}", filePath);

        using var stream = File.OpenRead(filePath);
        var hashBytes = await SHA256.HashDataAsync(stream, ct);
        var hash = BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();

        _logger.LogDebug("SHA256 calculated: {Hash}", hash);

        return hash;
    }

    private void CleanupFile(string? filePath)
    {
        if (string.IsNullOrEmpty(filePath) || !File.Exists(filePath))
        {
            return;
        }

        try
        {
            File.Delete(filePath);
            _logger.LogDebug("Cleaned up file: {FilePath}", filePath);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to clean up file: {FilePath}", filePath);
        }
    }
}

