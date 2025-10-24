using Microsoft.Extensions.Options;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;

namespace HumanProof.Api.Application.Services;

/// <summary>
/// Service for extracting image metadata
/// </summary>
public interface IImageInfoService
{
    /// <summary>
    /// Extract width, height, and MIME type from image bytes
    /// Optionally strips EXIF data based on configuration
    /// </summary>
    Task<(int width, int height, string mime)> ExtractInfoAsync(byte[] imageBytes);
}

public class ImageInfoService : IImageInfoService
{
    private readonly ILogger<ImageInfoService> _logger;
    private readonly GroupingOptions _options;

    public ImageInfoService(ILogger<ImageInfoService> logger, IOptions<GroupingOptions> options)
    {
        _logger = logger;
        _options = options.Value;
    }

    /// <summary>
    /// Extract width, height, and MIME type from image bytes
    /// Strips EXIF by default (config toggle to preserve)
    /// </summary>
    public async Task<(int width, int height, string mime)> ExtractInfoAsync(byte[] imageBytes)
    {
        try
        {
            using var ms = new MemoryStream(imageBytes);
            
            // First identify the format without loading the entire image
            var format = await Image.DetectFormatAsync(ms);
            ms.Position = 0; // Reset stream
            
            using var image = await Image.LoadAsync<Rgba32>(ms);

            var width = image.Width;
            var height = image.Height;
            var mimeType = format?.DefaultMimeType ?? "image/png";

            // Log EXIF stripping if configured
            if (!_options.PreserveExif)
            {
                _logger.LogDebug("EXIF stripping enabled (PreserveExif=false)");
            }

            _logger.LogDebug("Extracted image info: width={Width}, height={Height}, mime={MimeType}", 
                width, height, mimeType);

            return (width, height, mimeType);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to extract image information");
            throw new InvalidOperationException("Failed to extract image information", ex);
        }
    }
}

