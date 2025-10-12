using Microsoft.AspNetCore.Mvc;
using HumanProof.Api.Application.Services;
using HumanProof.Api.Domain.Interfaces;

namespace HumanProof.Api.Controllers;

[ApiController]
[Route("v1")]
public class BadgesController : ControllerBase
{
    private readonly IVerificationRepository _repository;
    private readonly ILogger<BadgesController> _logger;

    public BadgesController(
        IVerificationRepository repository,
        ILogger<BadgesController> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    [HttpGet("badge/{id}.svg")]
    [ProducesResponseType(typeof(string), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetBadgeSvg(string id)
    {
        try
        {
            var proof = await _repository.GetByProofIdAsync(id);
            
            if (proof == null)
            {
                return NotFound();
            }

            var badgeSvg = GenerateBadgeSvg(proof);
            
            Response.Headers["Cache-Control"] = "public, max-age=3600"; // Cache for 1 hour
            return Content(badgeSvg, "image/svg+xml");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating badge for proof {ProofId}", id);
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
            var proof = await _repository.GetByProofIdAsync(id);
            
            if (proof == null)
            {
                return NotFound();
            }

            var badgeSvg = GenerateBadgeSvg(proof);
            
            // For PNG, we'd need to convert SVG to PNG
            // For now, return SVG with PNG content type
            Response.Headers["Cache-Control"] = "public, max-age=3600";
            return Content(badgeSvg, "image/svg+xml");
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
            var proof = await _repository.GetByProofIdAsync(id);
            
            if (proof == null)
            {
                return NotFound();
            }

            var embedCode = GenerateEmbedCode(id);
            
            return Ok(new
            {
                html = embedCode,
                markdown = GenerateMarkdownCode(id),
                url = $"/v1/badge/{id}.svg"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating embed code for proof {ProofId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    private string GenerateBadgeSvg(Domain.Entities.VerificationProof proof)
    {
        var text = "Verified by Truwit";
        
        return $"""
        <svg width="200" height="60" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style="stop-color:#0ea5e9;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#22c55e;stop-opacity:1" />
                </linearGradient>
            </defs>
            <rect width="200" height="60" fill="url(#grad)" rx="8"/>
            <text x="100" y="35" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="12" font-weight="bold">
                {text}
            </text>
            <text x="100" y="50" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="8" opacity="0.8">
                {proof.ProofId}
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
