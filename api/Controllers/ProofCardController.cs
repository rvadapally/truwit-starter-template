using Microsoft.AspNetCore.Mvc;
using HumanProof.Api.Application.Services;
using HumanProof.Api.Domain.Interfaces;
using HumanProof.Api.Domain.Entities;

namespace HumanProof.Api.Controllers;

/// <summary>
/// Controller for regenerating proof cards on-demand
/// Used as fallback when static file is missing (e.g., after Railway redeploy)
/// </summary>
[ApiController]
[Route("cards/proof")]
public class ProofCardController : ControllerBase
{
    private readonly IVerificationRepository _verificationRepository;
    private readonly IProofsRepository _proofsRepository;
    private readonly IProofCardGenerator _generator;
    private readonly ILogger<ProofCardController> _logger;

    public ProofCardController(
        IVerificationRepository verificationRepository,
        IProofsRepository proofsRepository,
        IProofCardGenerator generator,
        ILogger<ProofCardController> logger)
    {
        _verificationRepository = verificationRepository;
        _proofsRepository = proofsRepository;
        _generator = generator;
        _logger = logger;
    }

    /// <summary>
    /// Regenerate proof card on-demand
    /// </summary>
    /// <param name="proofId">Proof ID (e.g., TW-7F39C1AB)</param>
    /// <param name="size">Image size (640 or 1024)</param>
    /// <returns>PNG image</returns>
    [HttpGet("{proofId}-{size:int}.png")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RegenerateCard(string proofId, int size)
    {
        try
        {
            // Validate size
            if (size != 640 && size != 800 && size != 1024)
            {
                _logger.LogWarning("Invalid size requested: {Size}", size);
                return BadRequest(new { error = "Size must be 640, 800, or 1024" });
            }

            // Try to find proof in VerificationProofs table first
            var verificationProof = await _verificationRepository.GetByProofIdAsync(proofId);
            if (verificationProof != null)
            {
                return await GenerateCardForVerificationProof(verificationProof, size);
            }

            // If not found in VerificationProofs, try Proofs table
            var proof = await _proofsRepository.GetByIdAsync(proofId);
            if (proof != null)
            {
                return await GenerateCardForProof(proof, size);
            }

            _logger.LogWarning("Proof not found in either table: {ProofId}", proofId);
            return NotFound(new { error = "Proof not found" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error regenerating proof card for {ProofId}", proofId);
            return StatusCode(StatusCodes.Status500InternalServerError, new { error = "Internal server error" });
        }
    }

    private async Task<IActionResult> GenerateCardForVerificationProof(VerificationProof proof, int size)
    {
        // Compute proof URL
        var proofUrl = $"https://www.truwit.ai/t/{proof.ProofId}";

        // Generate card
        _logger.LogInformation("Regenerating proof card for VerificationProof {ProofId} at size {Size}", proof.ProofId, size);
        var (diskPath, publicUrl) = _generator.Generate(proof.ProofId, proofUrl, size);

        // Update database with URL
        if (size == 640 && proof.ProofCardSmallUrl != publicUrl)
        {
            proof.ProofCardSmallUrl = publicUrl;
            await _verificationRepository.UpdateAsync(proof);
        }
        else if (size == 1024 && proof.ProofCardLargeUrl != publicUrl)
        {
            proof.ProofCardLargeUrl = publicUrl;
            await _verificationRepository.UpdateAsync(proof);
        }

        return await ReturnImageFile(diskPath, publicUrl);
    }

    private async Task<IActionResult> GenerateCardForProof(Proof proof, int size)
    {
        // Compute proof URL
        var proofUrl = $"https://www.truwit.ai/t/{proof.TrustmarkId}";

        // Generate card
        _logger.LogInformation("Regenerating proof card for Proof {TrustmarkId} at size {Size}", proof.TrustmarkId, size);
        var (diskPath, publicUrl) = _generator.Generate(proof.TrustmarkId, proofUrl, size);

        // Update database with URL
        if (size == 640 && proof.ProofCardSmallUrl != publicUrl)
        {
            proof.ProofCardSmallUrl = publicUrl;
            await _proofsRepository.UpdateAsync(proof);
        }
        else if (size == 1024 && proof.ProofCardLargeUrl != publicUrl)
        {
            proof.ProofCardLargeUrl = publicUrl;
            await _proofsRepository.UpdateAsync(proof);
        }

        return await ReturnImageFile(diskPath, publicUrl);
    }

    private async Task<IActionResult> ReturnImageFile(string diskPath, string publicUrl)
    {
        // Read and return image
        if (!System.IO.File.Exists(diskPath))
        {
            _logger.LogError("Generated file not found: {DiskPath}", diskPath);
            return StatusCode(StatusCodes.Status500InternalServerError, new { error = "Failed to generate image" });
        }

        var imageBytes = await System.IO.File.ReadAllBytesAsync(diskPath);

        // Set cache headers
        Response.Headers.Append("Cache-Control", "public, max-age=31536000, immutable");
        Response.Headers.Append("X-Generated-On-Demand", "true");

        _logger.LogInformation("✅ Regenerated proof card: {PublicUrl}", publicUrl);

        return File(imageBytes, "image/png");
    }
}

