using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HumanProof.Api.Application.Services;
using HumanProof.Api.Infrastructure.Data;

namespace HumanProof.Api.Controllers;

/// <summary>
/// Badges endpoint for generating verification badges (Phase 4.5)
/// </summary>
[ApiController]
[Route("v1/badge")]
public class BadgesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IBadgeSvgRenderer _badgeRenderer;
    private readonly IConfiguration _configuration;
    private readonly ILogger<BadgesController> _logger;

    public BadgesController(
        ApplicationDbContext context,
        IBadgeSvgRenderer badgeRenderer,
        IConfiguration configuration,
        ILogger<BadgesController> logger)
    {
        _context = context;
        _badgeRenderer = badgeRenderer;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Get verification badge as SVG
    /// Cacheable with ETag based on group_id + signature count + first date
    /// </summary>
    [HttpGet("{groupId}.svg")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetBadge(Guid groupId)
    {
        try
        {
            _logger.LogInformation("Get badge: group_id={GroupId}", groupId);

            // Query manifest data
            var assetGroup = await _context.AssetGroups
                .Include(g => g.Files)
                    .ThenInclude(f => f.Signatures)
                .FirstOrDefaultAsync(g => g.GroupId == groupId);

            if (assetGroup == null)
            {
                _logger.LogWarning("Asset group not found for badge: {GroupId}", groupId);
                return NotFound();
            }

            // Calculate stats
            var allSignatures = assetGroup.Files
                .SelectMany(f => f.Signatures)
                .OrderBy(s => s.SignedAt)
                .ToList();

            var signatureCount = allSignatures.Count;
            var firstSignedAt = allSignatures.Any() 
                ? allSignatures.First().SignedAt 
                : assetGroup.CreatedAt;

            // Build manifest URL
            var publicBase = _configuration["Truwit:PublicBase"] ?? "https://truwit.ai";
            var manifestUrl = $"{publicBase}/v1/manifest/{groupId}";

            // Generate ETag for caching
            var etag = $"\"{groupId:N}-{signatureCount}-{firstSignedAt:yyyyMMddHHmmss}\"";
            
            // Check if client has cached version
            var requestETag = Request.Headers["If-None-Match"].ToString();
            if (requestETag == etag)
            {
                _logger.LogDebug("Badge cache hit for group {GroupId}", groupId);
                return StatusCode(304); // Not Modified
            }

            // Render badge SVG
            var svg = _badgeRenderer.RenderBadge(groupId, signatureCount, firstSignedAt, manifestUrl);

            // Add cache headers
            Response.Headers.Append("ETag", etag);
            Response.Headers.Append("Cache-Control", "public, max-age=604800"); // 7 days
            Response.Headers.Append("Content-Type", "image/svg+xml");

            _logger.LogInformation("Badge generated: group_id={GroupId}, size={Size} bytes", groupId, svg.Length);

            return Content(svg, "image/svg+xml");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate badge for group {GroupId}", groupId);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }
}
