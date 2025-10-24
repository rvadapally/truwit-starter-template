using QRCoder;
using Microsoft.Extensions.Logging;

namespace HumanProof.Api.Application.Services;

/// <summary>
/// Service for generating QR codes in SVG format
/// </summary>
public interface IQrService
{
    /// <summary>
    /// Generate a QR code as SVG
    /// </summary>
    /// <param name="url">URL to encode in QR code</param>
    /// <param name="pixelSize">Size in pixels (default 88)</param>
    /// <returns>SVG string</returns>
    string GenerateQrSvg(string url, int pixelSize = 88);
}

public class QrService : IQrService
{
    private readonly ILogger<QrService> _logger;

    public QrService(ILogger<QrService> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Generate a QR code as SVG using QRCoder library
    /// </summary>
    public string GenerateQrSvg(string url, int pixelSize = 88)
    {
        try
        {
            using var qrGenerator = new QRCodeGenerator();
            var qrCodeData = qrGenerator.CreateQrCode(url, QRCodeGenerator.ECCLevel.M);
            
            using var qrCode = new SvgQRCode(qrCodeData);
            var svgString = qrCode.GetGraphic(pixelsPerModule: 20);
            
            _logger.LogDebug("Generated QR code for URL: {Url}, size: {Size}px", url, pixelSize);
            
            return svgString;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate QR code for URL: {Url}", url);
            throw new InvalidOperationException("Failed to generate QR code", ex);
        }
    }
}

