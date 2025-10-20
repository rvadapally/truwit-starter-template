using SkiaSharp;
using Svg.Skia;
using QRCoder;

namespace HumanProof.Api.Application.Services;

/// <summary>
/// Generates proof card images from an SVG template.
/// </summary>
public class ProofCardSvgGenerator : IProofCardGenerator
{
    private readonly string _templatePath;
    private readonly string _outputDir;
    private readonly string _publicBase;
    private readonly ILogger<ProofCardSvgGenerator>? _logger;

    public ProofCardSvgGenerator(
        string templatePath,
        string outputDir,
        string publicBase,
        ILogger<ProofCardSvgGenerator>? logger = null)
    {
        _templatePath = templatePath;
        _outputDir = outputDir;
        _publicBase = publicBase;
        _logger = logger;

        Directory.CreateDirectory(_outputDir);
    }

    /// <summary>
    /// Generate a proof card PNG at the requested size.
    /// The SVG template is authored at 1024x1024 and scaled proportionally.
    /// Places the QR at (x=778, y=730, size=120) in 1024 design space.
    /// </summary>
    public (string diskPath, string publicUrl) Generate(string proofId, string proofUrl, int sizePx)
    {
        var fileName = $"{proofId}-{sizePx}.png";
        var outputPath = Path.Combine(_outputDir, fileName);
        var publicUrl = $"{_publicBase}/{fileName}";

        if (File.Exists(outputPath))
        {
            _logger?.LogInformation("Proof card already exists: {OutputPath}", outputPath);
            return (outputPath, publicUrl);
        }

        try
        {
            if (!File.Exists(_templatePath))
                throw new FileNotFoundException($"SVG template not found: {_templatePath}");

            var svgText = File.ReadAllText(_templatePath)
                .Replace("{PROOF_ID}", proofId)
                .Replace("{VERIFICATION_URL}", proofUrl);

            var info = new SKImageInfo(sizePx, sizePx);
            using var surface = SKSurface.Create(info) ?? throw new InvalidOperationException("Failed to create surface");
            var canvas = surface.Canvas;
            canvas.Clear(SKColors.Transparent);

            // Render SVG (design size 1024)
            using (var svg = new SKSvg())
            {
                using var ms = new MemoryStream(System.Text.Encoding.UTF8.GetBytes(svgText));
                svg.Load(ms);
                if (svg.Picture != null)
                {
                    var scale = sizePx / 1024f;
                    var matrix = SKMatrix.CreateScale(scale, scale);
                    canvas.DrawPicture(svg.Picture, ref matrix);
                }
            }

            // Draw QR at scaled design coordinates (aligned within white block)
            var s = sizePx / 1024f;
            var qrX = (int)(692 * s);
            var qrY = (int)(740 * s);
            var qrSize = (int)(140 * s);

            using (var qrGenerator = new QRCodeGenerator())
            using (var qrCodeData = qrGenerator.CreateQrCode(proofUrl, QRCodeGenerator.ECCLevel.Q))
            {
                var qrCode = new PngByteQRCode(qrCodeData);
                var qrPngBytes = qrCode.GetGraphic(6);
                using var qrStream = new MemoryStream(qrPngBytes);
                using var qrBitmap = SKBitmap.Decode(qrStream);
                if (qrBitmap != null)
                {
                    using var qrResized = qrBitmap.Resize(new SKImageInfo(qrSize, qrSize), SKFilterQuality.High);
                    if (qrResized != null)
                    {
                        canvas.DrawBitmap(qrResized, new SKPoint(qrX, qrY));
                    }
                }
            }

            using var image = surface.Snapshot();
            using var data = image.Encode(SKEncodedImageFormat.Png, 95);
            using var fileStream = File.OpenWrite(outputPath);
            data.SaveTo(fileStream);

            _logger?.LogInformation("Generated proof card: {OutputPath} ({Size}x{Size})", outputPath, sizePx, sizePx);
            return (outputPath, publicUrl);
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "Failed to generate proof card for {ProofId} at size {Size}", proofId, sizePx);
            throw;
        }
    }

    public string GetOutputDir() => _outputDir;
}
