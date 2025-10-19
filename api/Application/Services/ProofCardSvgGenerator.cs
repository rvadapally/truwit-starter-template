using SkiaSharp;
using Svg.Skia;
using QRCoder;

namespace HumanProof.Api.Application.Services;

/// <summary>
/// Generates proof card images from rich SVG template
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

        // Ensure output directory exists
        Directory.CreateDirectory(_outputDir);
    }

    /// <summary>
    /// Generate a proof card image matching signed_badge.png design
    /// Uses rich SVG template with placeholders for dynamic content
    /// </summary>
    public (string diskPath, string publicUrl) Generate(string proofId, string proofUrl, int sizePx)
    {
        var fileName = $"{proofId}-{sizePx}.png";
        var outputPath = Path.Combine(_outputDir, fileName);
        var publicUrl = $"{_publicBase}/{fileName}";

        // Skip if file already exists
        if (File.Exists(outputPath))
        {
            _logger?.LogInformation("Proof card already exists: {OutputPath}", outputPath);
            return (outputPath, publicUrl);
        }

        try
        {
            // Step 1: Render the rich SVG template with replaced placeholders
            if (!File.Exists(_templatePath))
            {
                throw new FileNotFoundException($"SVG template not found: {_templatePath}");
            }

            var svgText = File.ReadAllText(_templatePath);

            // Replace text placeholders
            svgText = svgText
                .Replace("{PROOF_ID}", proofId)
                .Replace("{VERIFICATION_URL}", proofUrl);

            // Create canvas
            var info = new SKImageInfo(sizePx, sizePx);
            using var surface = SKSurface.Create(info);
            if (surface == null)
            {
                throw new InvalidOperationException($"Failed to create surface for size {sizePx}x{sizePx}");
            }

            var canvas = surface.Canvas;
            canvas.Clear(SKColors.Transparent);

            // Try to render SVG template
            try
            {
                using var svg = new SKSvg();
                var svgDoc = svg.FromSvg(svgText);

                if (svg.Picture != null)
                {
                    // Scale SVG to fit canvas
                    var svgBounds = svg.Picture.CullRect;
                    var scaleX = sizePx / svgBounds.Width;
                    var scaleY = sizePx / svgBounds.Height;
                    var scale = Math.Min(scaleX, scaleY);

                    var matrix = SKMatrix.CreateScale(scale, scale);
                    canvas.DrawPicture(svg.Picture, ref matrix);
                }
            }
            catch (Exception svgEx)
            {
                _logger?.LogWarning(svgEx, "SVG rendering failed, falling back to manual composition");
                
                // Fallback: Manual composition using SkiaSharp directly
                ComposeCardManually(canvas, sizePx, proofId, proofUrl);
            }

            // Step 2: Overlay QR code on top (this always happens, even if SVG worked)
            var qrSize = (int)(sizePx * 0.15); // 15% of canvas (120px for 800px)
            var qrX = (int)(sizePx * 0.5875); // Position to match signed_badge.png
            var qrY = (int)(sizePx * 0.73125); // Position to match signed_badge.png

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

            // Save to PNG
            using var image = surface.Snapshot();
            using var data = image.Encode(SKEncodedImageFormat.Png, 95);
            using var fileStream = File.OpenWrite(outputPath);
            data.SaveTo(fileStream);

            _logger?.LogInformation("✅ Generated proof card: {OutputPath} ({Size}x{Size})", outputPath, sizePx, sizePx);

            return (outputPath, publicUrl);
        }
        catch (Exception ex)
        {
            _logger?.LogError(ex, "❌ Failed to generate proof card for {ProofId} at size {Size}", proofId, sizePx);
            throw;
        }
    }

    /// <summary>
    /// Manual composition fallback matching signed_badge.png design
    /// </summary>
    private void ComposeCardManually(SKCanvas canvas, int sizePx, string proofId, string proofUrl)
    {
        var templateDir = Path.GetDirectoryName(_templatePath)!;
        
        // Teal background
        canvas.Clear(new SKColor(26, 187, 180));

        // Draw outer square card (smaller, just covering the circle)
        var cardX = sizePx * 0.30f;
        var cardY = sizePx * 0.36f;
        var cardWidth = sizePx * 0.40f;
        var cardHeight = sizePx * 0.52f;

        using var cardPaint = new SKPaint
        {
            Color = new SKColor(15, 150, 144), // Much darker teal for contrast (#0F9690)
            IsAntialias = true,
            Style = SKPaintStyle.Fill
        };

        // Add shadow
        using var shadowPaint = new SKPaint
        {
            Color = SKColors.Black.WithAlpha(40),
            IsAntialias = true,
            MaskFilter = SKMaskFilter.CreateBlur(SKBlurStyle.Normal, 15)
        };

        var cardRect = new SKRect(cardX, cardY, cardX + cardWidth, cardY + cardHeight);
        canvas.DrawRoundRect(cardRect, 24, 24, shadowPaint);
        canvas.DrawRoundRect(cardRect, 24, 24, cardPaint);

        // Load and draw circular badge overlapping top of card
        var badgePath = Path.Combine(templateDir, "verified-circular-badge.jpg");
        if (File.Exists(badgePath))
        {
            using var badgeStream = File.OpenRead(badgePath);
            using var badgeBitmap = SKBitmap.Decode(badgeStream);
            if (badgeBitmap != null)
            {
                var badgeSize = (int)(sizePx * 0.375);
                var badgeX = (sizePx - badgeSize) / 2;
                var badgeY = (int)(sizePx * 0.16);

                // Use circular clipping (gray background will be circular, which is acceptable)
                using var circlePath = new SKPath();
                circlePath.AddCircle(badgeX + badgeSize / 2, badgeY + badgeSize / 2, badgeSize / 2);
                
                canvas.Save();
                canvas.ClipPath(circlePath);
                
                using var scaledBadge = badgeBitmap.Resize(new SKImageInfo(badgeSize, badgeSize), SKFilterQuality.High);
                if (scaledBadge != null)
                {
                    canvas.DrawBitmap(scaledBadge, new SKPoint(badgeX, badgeY));
                }
                
                canvas.Restore();
            }
        }

        // Skip the big "Proof ID:" text since it's shown in the white container below

        // Draw white rounded container (moved closer to circle)
        var containerX = cardX + (sizePx * 0.03f);
        var containerY = cardY + cardHeight - (sizePx * 0.21f);
        var containerWidth = cardWidth - (sizePx * 0.06f);
        var containerHeight = sizePx * 0.16f;

        using var containerPaint = new SKPaint
        {
            Color = SKColors.White,
            IsAntialias = true
        };

        canvas.DrawRoundRect(new SKRect(containerX, containerY, containerX + containerWidth, containerY + containerHeight), 16, 16, containerPaint);

        // Draw URL text
        using var urlPaint = new SKPaint
        {
            Color = new SKColor(45, 45, 45),
            TextSize = sizePx * 0.035f,
            Typeface = SKTypeface.FromFamilyName("Arial", SKFontStyleWeight.Normal, SKFontStyleWidth.Normal, SKFontStyleSlant.Upright),
            IsAntialias = true
        };

        var urlX = containerX + (sizePx * 0.0375f);
        var proofIdWithPrefix = proofId.StartsWith("TW-") ? proofId : $"TW-{proofId}";
        canvas.DrawText("truwit.ai/t/", urlX, containerY + (sizePx * 0.055f), urlPaint);
        canvas.DrawText(proofIdWithPrefix, urlX, containerY + (sizePx * 0.1f), urlPaint);
    }

    public string GetOutputDir()
    {
        return _outputDir;
    }
}
