using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HumanProof.Api.Infrastructure.Data;

namespace HumanProof.Api.Controllers;

/// <summary>
/// Analytics endpoints for tracking TruWit usage
/// </summary>
[ApiController]
[Route("v1/analytics")]
public class AnalyticsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AnalyticsController> _logger;

    public AnalyticsController(ApplicationDbContext context, ILogger<AnalyticsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Get overall platform statistics
    /// </summary>
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var totalProofs = await _context.VerificationProofs.CountAsync(p => !p.IsDeleted);
        var proofsToday = await _context.VerificationProofs
            .CountAsync(p => !p.IsDeleted && p.CreatedAt >= DateTime.UtcNow.Date);
        var proofsThisWeek = await _context.VerificationProofs
            .CountAsync(p => !p.IsDeleted && p.CreatedAt >= DateTime.UtcNow.AddDays(-7));
        var proofsThisMonth = await _context.VerificationProofs
            .CountAsync(p => !p.IsDeleted && p.CreatedAt >= DateTime.UtcNow.AddDays(-30));
        
        var otsSubmitted = await _context.VerificationProofs
            .CountAsync(p => !p.IsDeleted && p.OtsCreatedAt != null);
        var otsConfirmed = await _context.VerificationProofs
            .CountAsync(p => !p.IsDeleted && p.OtsConfirmedAt != null);

        var totalIdentities = await _context.Identities.CountAsync();

        return Ok(new
        {
            proofs = new
            {
                total = totalProofs,
                today = proofsToday,
                thisWeek = proofsThisWeek,
                thisMonth = proofsThisMonth
            },
            openTimestamps = new
            {
                submitted = otsSubmitted,
                confirmed = otsConfirmed,
                pending = otsSubmitted - otsConfirmed
            },
            users = new
            {
                totalIdentities = totalIdentities
            },
            generatedAt = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Get proof creation trend (daily for last 30 days)
    /// </summary>
    [HttpGet("trends/proofs")]
    public async Task<IActionResult> GetProofTrends([FromQuery] int days = 30)
    {
        days = Math.Min(days, 90); // Cap at 90 days
        var startDate = DateTime.UtcNow.AddDays(-days).Date;

        var proofsByDay = await _context.VerificationProofs
            .Where(p => !p.IsDeleted && p.CreatedAt >= startDate)
            .GroupBy(p => p.CreatedAt.Date)
            .Select(g => new { Date = g.Key, Count = g.Count() })
            .OrderBy(x => x.Date)
            .ToListAsync();

        // Fill in missing days with zero
        var result = new List<object>();
        for (var date = startDate; date <= DateTime.UtcNow.Date; date = date.AddDays(1))
        {
            var count = proofsByDay.FirstOrDefault(x => x.Date == date)?.Count ?? 0;
            result.Add(new { date = date.ToString("yyyy-MM-dd"), count });
        }

        return Ok(new
        {
            period = $"Last {days} days",
            data = result
        });
    }

    /// <summary>
    /// Get recent proofs (admin view)
    /// </summary>
    [HttpGet("recent")]
    public async Task<IActionResult> GetRecentProofs([FromQuery] int limit = 20)
    {
        limit = Math.Min(limit, 100);

        var recentProofs = await _context.VerificationProofs
            .Where(p => !p.IsDeleted)
            .OrderByDescending(p => p.CreatedAt)
            .Take(limit)
            .Select(p => new
            {
                proofId = p.ProofId,
                createdAt = p.CreatedAt,
                hasOts = p.OtsCreatedAt != null,
                otsConfirmed = p.OtsConfirmedAt != null
            })
            .ToListAsync();

        return Ok(new
        {
            count = recentProofs.Count,
            proofs = recentProofs
        });
    }
}
