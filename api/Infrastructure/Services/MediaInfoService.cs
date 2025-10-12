using System.Diagnostics;
using System.Text.Json;
using HumanProof.Api.Application.DTOs;

namespace HumanProof.Api.Infrastructure.Services;

public interface IMediaInfoService
{
    Task<MediaMetadata?> ExtractMetadataAsync(string filePath, CancellationToken cancellationToken = default);
    Task<MediaMetadata?> ExtractMetadataAsync(Stream stream, string fileName, CancellationToken cancellationToken = default);
}

public class MediaInfoService : IMediaInfoService
{
    private readonly ILogger<MediaInfoService> _logger;
    private readonly string _ffprobePath;

    public MediaInfoService(ILogger<MediaInfoService> logger, IConfiguration configuration)
    {
        _logger = logger;
        _ffprobePath = configuration.GetValue<string>("MediaInfo:FfprobePath") ?? "ffprobe";
    }

    public async Task<MediaMetadata?> ExtractMetadataAsync(string filePath, CancellationToken cancellationToken = default)
    {
        try
        {
            if (!File.Exists(filePath))
            {
                _logger.LogWarning("File not found: {FilePath}", filePath);
                return null;
            }

            return await RunFfprobeAsync(filePath, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error extracting metadata from file: {FilePath}", filePath);
            return null;
        }
    }

    public async Task<MediaMetadata?> ExtractMetadataAsync(Stream stream, string fileName, CancellationToken cancellationToken = default)
    {
        try
        {
            // Save stream to temporary file for ffprobe processing
            var tempPath = Path.GetTempFileName();
            using (var fileStream = File.Create(tempPath))
            {
                await stream.CopyToAsync(fileStream, cancellationToken);
            }

            try
            {
                return await RunFfprobeAsync(tempPath, cancellationToken);
            }
            finally
            {
                // Clean up temporary file
                if (File.Exists(tempPath))
                {
                    File.Delete(tempPath);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error extracting metadata from stream: {FileName}", fileName);
            return null;
        }
    }

    private async Task<MediaMetadata?> RunFfprobeAsync(string filePath, CancellationToken cancellationToken = default)
    {
        try
        {
            var startInfo = new ProcessStartInfo
            {
                FileName = _ffprobePath,
                Arguments = $"-v quiet -print_format json -show_format -show_streams \"{filePath}\"",
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = new Process { StartInfo = startInfo };
            process.Start();

            var output = await process.StandardOutput.ReadToEndAsync();
            var error = await process.StandardError.ReadToEndAsync();

            await process.WaitForExitAsync(cancellationToken);

            if (process.ExitCode != 0)
            {
                _logger.LogWarning("ffprobe failed with exit code {ExitCode}: {Error}", process.ExitCode, error);
                return null;
            }

            return ParseFfprobeOutput(output);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error running ffprobe on file: {FilePath}", filePath);
            return null;
        }
    }

    private MediaMetadata? ParseFfprobeOutput(string jsonOutput)
    {
        try
        {
            using var document = JsonDocument.Parse(jsonOutput);
            var root = document.RootElement;

            var format = root.GetProperty("format");
            var streams = root.GetProperty("streams");

            // Find video stream
            var videoStream = streams.EnumerateArray()
                .FirstOrDefault(s => s.TryGetProperty("codec_type", out var codecType) && 
                                   codecType.GetString() == "video");

            if (videoStream.ValueKind == JsonValueKind.Undefined)
            {
                _logger.LogWarning("No video stream found in media file");
                return null;
            }

            var duration = format.TryGetProperty("duration", out var durationProp) 
                ? (int?)Math.Round(durationProp.GetDouble()) 
                : null;

            var width = videoStream.TryGetProperty("width", out var widthProp) 
                ? widthProp.GetInt32() 
                : 0;
            var height = videoStream.TryGetProperty("height", out var heightProp) 
                ? heightProp.GetInt32() 
                : 0;

            var resolution = width > 0 && height > 0 ? $"{width}x{height}" : null;

            return new MediaMetadata
            {
                Duration = duration,
                Resolution = resolution,
                Width = width,
                Height = height,
                Codec = videoStream.TryGetProperty("codec_name", out var codecProp) 
                    ? codecProp.GetString() 
                    : null,
                BitRate = format.TryGetProperty("bit_rate", out var bitrateProp) 
                    ? bitrateProp.GetString() 
                    : null,
                FrameRate = videoStream.TryGetProperty("r_frame_rate", out var framerateProp) 
                    ? framerateProp.GetString() 
                    : null
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error parsing ffprobe output");
            return null;
        }
    }
}

public class MediaMetadata
{
    public int? Duration { get; set; }
    public string? Resolution { get; set; }
    public int Width { get; set; }
    public int Height { get; set; }
    public string? Codec { get; set; }
    public string? BitRate { get; set; }
    public string? FrameRate { get; set; }
}
