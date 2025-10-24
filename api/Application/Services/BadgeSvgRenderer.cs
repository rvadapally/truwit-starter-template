using Microsoft.Extensions.Logging;
using System.Text;
using System.Globalization;

namespace HumanProof.Api.Application.Services;

/// <summary>
/// Service for rendering badge SVGs with embedded QR codes
/// </summary>
public interface IBadgeSvgRenderer
{
    /// <summary>
    /// Render a verification badge as SVG
    /// </summary>
    /// <param name="groupId">Asset group ID</param>
    /// <param name="signatureCount">Number of signatures</param>
    /// <param name="firstSignedAt">Date of first signature</param>
    /// <param name="manifestUrl">URL to manifest</param>
    /// <returns>SVG string</returns>
    string RenderBadge(Guid groupId, int signatureCount, DateTime firstSignedAt, string manifestUrl);
}

public class BadgeSvgRenderer : IBadgeSvgRenderer
{
    private readonly IQrService _qrService;
    private readonly ILogger<BadgeSvgRenderer> _logger;

    public BadgeSvgRenderer(IQrService qrService, ILogger<BadgeSvgRenderer> logger)
    {
        _qrService = qrService;
        _logger = logger;
    }

    /// <summary>
    /// Render a verification badge with transparent background, teal branding, and embedded QR code
    /// Target size: <25KB
    /// </summary>
    public string RenderBadge(Guid groupId, int signatureCount, DateTime firstSignedAt, string manifestUrl)
    {
        try
        {
            // Generate QR code
            var qrSvg = _qrService.GenerateQrSvg(manifestUrl, 88);
            
            // Format date
            var dateStr = firstSignedAt.ToString("MMM d, yyyy", CultureInfo.InvariantCulture);
            
            // Build SVG with embedded QR
            var svg = new StringBuilder();
            svg.AppendLine("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
            svg.AppendLine($"<svg width=\"400\" height=\"140\" viewBox=\"0 0 400 140\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" role=\"img\" aria-label=\"Verified by Truwit with {signatureCount} signature(s)\">");
            
            // Title for accessibility
            svg.AppendLine($"  <title>Verified by Truwit - {signatureCount} Signature(s)</title>");
            
            // Clickable link wrapping entire badge
            svg.AppendLine($"  <a xlink:href=\"{manifestUrl}\" target=\"_blank\">");
            
            // Background with subtle gradient
            svg.AppendLine("    <defs>");
            svg.AppendLine("      <linearGradient id=\"bg-gradient\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\">");
            svg.AppendLine("        <stop offset=\"0%\" style=\"stop-color:rgba(20,212,201,0.1);stop-opacity:1\" />");
            svg.AppendLine("        <stop offset=\"100%\" style=\"stop-color:rgba(20,212,201,0.05);stop-opacity:1\" />");
            svg.AppendLine("      </linearGradient>");
            svg.AppendLine("    </defs>");
            
            // Background rectangle with border
            svg.AppendLine("    <rect width=\"400\" height=\"140\" rx=\"12\" fill=\"url(#bg-gradient)\" stroke=\"#14D4C9\" stroke-width=\"2\"/>");
            
            // Checkmark icon (left side)
            svg.AppendLine("    <g transform=\"translate(20, 35)\">");
            svg.AppendLine("      <circle cx=\"25\" cy=\"25\" r=\"24\" fill=\"none\" stroke=\"#14D4C9\" stroke-width=\"3\"/>");
            svg.AppendLine("      <path d=\"M 15 25 L 22 32 L 35 18\" fill=\"none\" stroke=\"#14D4C9\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>");
            svg.AppendLine("    </g>");
            
            // Text content (center)
            svg.AppendLine("    <g transform=\"translate(80, 0)\">");
            svg.AppendLine("      <text x=\"0\" y=\"40\" font-family=\"Arial, sans-serif\" font-size=\"18\" font-weight=\"bold\" fill=\"#14D4C9\">Verified by Truwit</text>");
            svg.AppendLine($"      <text x=\"0\" y=\"65\" font-family=\"Arial, sans-serif\" font-size=\"14\" fill=\"#333333\">Signatures: {signatureCount}</text>");
            svg.AppendLine($"      <text x=\"0\" y=\"88\" font-family=\"Arial, sans-serif\" font-size=\"14\" fill=\"#666666\">First signed: {dateStr}</text>");
            svg.AppendLine("      <text x=\"0\" y=\"111\" font-family=\"Arial, sans-serif\" font-size=\"12\" fill=\"#999999\">Click to view full manifest</text>");
            svg.AppendLine("    </g>");
            
            // QR code (right side) - embedded as inline SVG
            svg.AppendLine("    <g transform=\"translate(290, 20)\">");
            // Extract the inner content of the QR SVG (without the outer <svg> tag)
            var qrContent = ExtractQrContent(qrSvg);
            svg.AppendLine(qrContent);
            svg.AppendLine("    </g>");
            
            svg.AppendLine("  </a>");
            svg.AppendLine("</svg>");
            
            var result = svg.ToString();
            _logger.LogInformation("Rendered badge for group {GroupId}, size: {Size} bytes", groupId, result.Length);
            
            return result;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to render badge for group {GroupId}", groupId);
            throw new InvalidOperationException("Failed to render badge", ex);
        }
    }

    /// <summary>
    /// Extract the inner content of QR SVG (paths/rects) without the outer svg tag
    /// </summary>
    private string ExtractQrContent(string qrSvg)
    {
        try
        {
            // Simple extraction: find content between <svg...> and </svg>
            var startIndex = qrSvg.IndexOf('>') + 1;
            var endIndex = qrSvg.LastIndexOf("</svg>");
            
            if (startIndex > 0 && endIndex > startIndex)
            {
                return qrSvg.Substring(startIndex, endIndex - startIndex).Trim();
            }
            
            // Fallback: return QR as-is (will be nested SVG)
            return qrSvg;
        }
        catch
        {
            return qrSvg;
        }
    }
}

