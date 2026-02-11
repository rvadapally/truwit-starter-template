using Microsoft.AspNetCore.Mvc;
using HumanProof.Api.Application.Services;
using HumanProof.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HumanProof.Api.Controllers;

/// <summary>
/// OpenTimestamps endpoints for Bitcoin-anchored timestamps
/// </summary>
[ApiController]
[Route("v1/ots")]
public class OpenTimestampsController : ControllerBase
{
    private readonly IOpenTimestampsService _otsService;
    private readonly ApplicationDbContext _context;
    private readonly ILogger<OpenTimestampsController> _logger;

    public OpenTimestampsController(
        IOpenTimestampsService otsService,
        ApplicationDbContext context,
        ILogger<OpenTimestampsController> logger)
    {
        _otsService = otsService;
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Submit a proof to OpenTimestamps for Bitcoin anchoring
    /// </summary>
    /// <param name="proofId">TruWit proof ID</param>
    [HttpPost("stamp/{proofId}")]
    public async Task<IActionResult> StampProof(string proofId)
    {
        try
        {
            // Find the proof
            var proof = await _context.VerificationProofs
                .FirstOrDefaultAsync(p => p.ProofId == proofId && !p.IsDeleted);

            if (proof == null)
            {
                return NotFound(new { error = "Proof not found" });
            }

            // Check if already stamped
            if (proof.OtsProof != null)
            {
                return Ok(new
                {
                    proofId = proof.ProofId,
                    message = "Already stamped",
                    otsCreatedAt = proof.OtsCreatedAt,
                    otsConfirmedAt = proof.OtsConfirmedAt,
                    downloadUrl = $"/v1/ots/download/{proof.ProofId}.ots"
                });
            }

            // Submit to OpenTimestamps
            _logger.LogInformation("Submitting proof {ProofId} to OpenTimestamps", proofId);
            var otsProof = await _otsService.StampAsync(proof.ContentHash);

            // Save the OTS proof
            proof.OtsProof = otsProof;
            proof.OtsCreatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Proof {ProofId} submitted to OpenTimestamps, {Size} bytes", proofId, otsProof.Length);

            return Ok(new
            {
                proofId = proof.ProofId,
                message = "Submitted to OpenTimestamps calendars. Bitcoin confirmation pending (takes a few hours).",
                otsCreatedAt = proof.OtsCreatedAt,
                otsSize = otsProof.Length,
                downloadUrl = $"/v1/ots/download/{proof.ProofId}.ots"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to submit proof {ProofId} to OpenTimestamps", proofId);
            return StatusCode(500, new { error = "Failed to submit to OpenTimestamps", message = ex.Message });
        }
    }

    /// <summary>
    /// Download the OTS proof file for a proof
    /// </summary>
    [HttpGet("download/{proofId}.ots")]
    public async Task<IActionResult> DownloadOtsProof(string proofId)
    {
        var proof = await _context.VerificationProofs
            .FirstOrDefaultAsync(p => p.ProofId == proofId && !p.IsDeleted);

        if (proof == null)
        {
            return NotFound(new { error = "Proof not found" });
        }

        if (proof.OtsProof == null)
        {
            return NotFound(new { error = "No OpenTimestamps proof available. Submit first via POST /v1/ots/stamp/{proofId}" });
        }

        return File(proof.OtsProof, "application/octet-stream", $"{proofId}.ots");
    }

    /// <summary>
    /// Get OTS status for a proof
    /// </summary>
    [HttpGet("status/{proofId}")]
    public async Task<IActionResult> GetOtsStatus(string proofId)
    {
        var proof = await _context.VerificationProofs
            .FirstOrDefaultAsync(p => p.ProofId == proofId && !p.IsDeleted);

        if (proof == null)
        {
            return NotFound(new { error = "Proof not found" });
        }

        return Ok(new
        {
            proofId = proof.ProofId,
            hasOtsProof = proof.OtsProof != null,
            otsCreatedAt = proof.OtsCreatedAt,
            otsConfirmedAt = proof.OtsConfirmedAt,
            status = proof.OtsProof == null ? "not_submitted" :
                     proof.OtsConfirmedAt != null ? "confirmed" : "pending",
            downloadUrl = proof.OtsProof != null ? $"/v1/ots/download/{proof.ProofId}.ots" : null
        });
    }

    /// <summary>
    /// Bulk stamp all proofs that don't have OTS yet (admin endpoint)
    /// </summary>
    [HttpPost("stamp-all")]
    public async Task<IActionResult> StampAllPending()
    {
        var proofs = await _context.VerificationProofs
            .Where(p => !p.IsDeleted && p.OtsProof == null && !string.IsNullOrEmpty(p.ContentHash))
            .Take(100) // Limit to 100 at a time
            .ToListAsync();

        var results = new List<object>();
        var successCount = 0;
        var failCount = 0;

        foreach (var proof in proofs)
        {
            try
            {
                var otsProof = await _otsService.StampAsync(proof.ContentHash);
                proof.OtsProof = otsProof;
                proof.OtsCreatedAt = DateTime.UtcNow;
                successCount++;
                results.Add(new { proofId = proof.ProofId, status = "success" });
            }
            catch (Exception ex)
            {
                failCount++;
                results.Add(new { proofId = proof.ProofId, status = "failed", error = ex.Message });
                _logger.LogWarning(ex, "Failed to stamp proof {ProofId}", proof.ProofId);
            }

            // Small delay to be nice to calendar servers
            await Task.Delay(100);
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            total = proofs.Count,
            success = successCount,
            failed = failCount,
            results
        });
    }
}
