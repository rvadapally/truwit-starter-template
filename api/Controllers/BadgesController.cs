using Microsoft.AspNetCore.Mvc;
using HumanProof.Api.Application.Services;
using HumanProof.Api.Domain.Interfaces;

namespace HumanProof.Api.Controllers;

[ApiController]
[Route("v1")]
public class BadgesController : ControllerBase
{
    private readonly IProofsRepository _proofsRepo;
    private readonly IVerificationRepository _verificationRepo;
    private readonly ILogger<BadgesController> _logger;

    public BadgesController(
        IProofsRepository proofsRepo,
        IVerificationRepository verificationRepo,
        ILogger<BadgesController> logger)
    {
        _proofsRepo = proofsRepo;
        _verificationRepo = verificationRepo;
        _logger = logger;
    }

    [HttpGet("badge/{trustmarkId}.svg")]
    [ProducesResponseType(typeof(string), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetBadgeSvg(string trustmarkId)
    {
        try
        {
            // Try new system first (Proof with TrustmarkId)
            var proof = await _proofsRepo.GetByTrustmarkIdAsync(trustmarkId);
            
            if (proof != null)
            {
                var badgeSvg = GenerateBadgeSvg(proof, trustmarkId);
                
                Response.Headers["Cache-Control"] = "public, max-age=3600"; // Cache for 1 hour
                return Content(badgeSvg, "image/svg+xml");
            }

            // Fallback to legacy system (VerificationProof with ProofId)
            var legacyProof = await _verificationRepo.GetByProofIdAsync(trustmarkId);
            
            if (legacyProof != null)
            {
                var badgeSvg = GenerateLegacyBadgeSvg(legacyProof, trustmarkId);
                
                Response.Headers["Cache-Control"] = "public, max-age=3600"; // Cache for 1 hour
                return Content(badgeSvg, "image/svg+xml");
            }

            return NotFound();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating badge for trustmark {TrustmarkId}", trustmarkId);
            return StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    [HttpGet("badge/{id}.png")]
    [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetBadgePng(string id)
    {
        try
        {
            // Try new system first (Proof with TrustmarkId)
            var proof = await _proofsRepo.GetByTrustmarkIdAsync(id);
            
            if (proof != null)
            {
                var badgeSvg = GenerateBadgeSvg(proof, id);
                
                // For PNG, we'd need to convert SVG to PNG
                // For now, return SVG with PNG content type
                Response.Headers["Cache-Control"] = "public, max-age=3600";
                return Content(badgeSvg, "image/svg+xml");
            }

            // Fallback to legacy system (VerificationProof with ProofId)
            var legacyProof = await _verificationRepo.GetByProofIdAsync(id);
            
            if (legacyProof != null)
            {
                var badgeSvg = GenerateLegacyBadgeSvg(legacyProof, id);
                
                // For PNG, we'd need to convert SVG to PNG
                // For now, return SVG with PNG content type
                Response.Headers["Cache-Control"] = "public, max-age=3600";
                return Content(badgeSvg, "image/svg+xml");
            }

            return NotFound();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating PNG badge for proof {ProofId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    [HttpGet("badge/{id}/embed")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetBadgeEmbed(string id)
    {
        try
        {
            // Try new system first (Proof with TrustmarkId)
            var proof = await _proofsRepo.GetByTrustmarkIdAsync(id);
            
            if (proof != null)
            {
                var embedCode = GenerateEmbedCode(id);
                
                return Ok(new
                {
                    html = embedCode,
                    markdown = GenerateMarkdownCode(id),
                    url = $"/v1/badge/{id}.svg"
                });
            }

            // Fallback to legacy system (VerificationProof with ProofId)
            var legacyProof = await _verificationRepo.GetByProofIdAsync(id);
            
            if (legacyProof != null)
            {
                var embedCode = GenerateEmbedCode(id);
                
                return Ok(new
                {
                    html = embedCode,
                    markdown = GenerateMarkdownCode(id),
                    url = $"/v1/badge/{id}.svg"
                });
            }

            return NotFound();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating embed code for proof {ProofId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    [HttpGet("badge/static")]
    [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult GetStaticBadge()
    {
        try
        {
            // Try multiple possible paths for the static badge
            var possiblePaths = new[]
            {
                Path.Combine(Directory.GetCurrentDirectory(), "uploads", "verified-by-truwit.png"),
                Path.Combine(Directory.GetCurrentDirectory(), "assets", "verified-by-truwit.png"),
                Path.Combine(Directory.GetCurrentDirectory(), "app", "src", "assets", "verified-by-truwit.png")
            };

            foreach (var badgePath in possiblePaths)
            {
                if (System.IO.File.Exists(badgePath))
                {
                    var fileBytes = System.IO.File.ReadAllBytes(badgePath);
                    Response.Headers["Cache-Control"] = "public, max-age=3600"; // Cache for 1 hour
                    return File(fileBytes, "image/png");
                }
            }

            return NotFound();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error serving static badge");
            return StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    private string GenerateBadgeSvg(Domain.Entities.Proof proof, string trustmarkId)
    {
        var statusText = proof.C2paPresent ? "✓ Signed & Verified" : "Verified by Truwit";
        var color = proof.C2paPresent ? "#22c55e" : "#0ea5e9";
        
        return $"""
        <svg width="200" height="60" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:{color};stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#0ea5e9;stop-opacity:1" />
                </linearGradient>
            </defs>
            <rect width="200" height="60" fill="url(#grad)" rx="8"/>
            <text x="100" y="35" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="12" font-weight="bold">
                {statusText}
            </text>
            <text x="100" y="50" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="8" opacity="0.8">
                {trustmarkId}
            </text>
        </svg>
        """;
    }

    private string GenerateLegacyBadgeSvg(Domain.Entities.VerificationProof proof, string proofId)
    {
        // For legacy proofs, we don't have C2PA info, so just show "Verified by Truwit"
        var statusText = "Verified by Truwit";
        var color = "#0ea5e9";
        
        return $"""
        <svg width="200" height="60" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:{color};stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#0ea5e9;stop-opacity:1" />
                </linearGradient>
            </defs>
            <rect width="200" height="60" fill="url(#grad)" rx="8"/>
            <text x="100" y="35" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="12" font-weight="bold">
                {statusText}
            </text>
            <text x="100" y="50" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="8" opacity="0.8">
                {proofId}
            </text>
        </svg>
        """;
    }

    private string GenerateEmbedCode(string proofId)
    {
        return $"""
        <a href="https://truwit.ai/app/t/{proofId}" target="_blank">
            <img src="https://api.truwit.ai/v1/badge/{proofId}.svg" alt="Verified by Truwit" />
        </a>
        """;
    }

    private string GenerateMarkdownCode(string proofId)
    {
        return $"[![Verified by Truwit](https://api.truwit.ai/v1/badge/{proofId}.svg)](https://truwit.ai/app/t/{proofId})";
    }
}
