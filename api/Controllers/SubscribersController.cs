using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HumanProof.Api.Infrastructure.Data;
using HumanProof.Api.Domain.Entities;
using System.ComponentModel.DataAnnotations;

namespace HumanProof.Api.Controllers;

/// <summary>
/// Email waitlist/newsletter subscription endpoints
/// </summary>
[ApiController]
[Route("v1/subscribe")]
public class SubscribersController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<SubscribersController> _logger;

    public SubscribersController(ApplicationDbContext context, ILogger<SubscribersController> logger)
    {
        _context = context;
        _logger = logger;
    }

    public record SubscribeRequest(
        [Required][EmailAddress] string Email,
        string? Source = null,
        string? ReferralCode = null
    );

    /// <summary>
    /// Subscribe to TruWit waitlist
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> Subscribe([FromBody] SubscribeRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new { error = "Invalid email address" });
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        
        // Check if already subscribed
        var existing = await _context.Subscribers
            .FirstOrDefaultAsync(s => s.Email.ToLower() == normalizedEmail);

        if (existing != null)
        {
            if (existing.IsUnsubscribed)
            {
                // Re-subscribe
                existing.IsUnsubscribed = false;
                existing.UnsubscribedAt = null;
                existing.Source = request.Source ?? existing.Source;
                await _context.SaveChangesAsync();
                
                _logger.LogInformation("User re-subscribed: {Email}", normalizedEmail);
                return Ok(new { message = "Welcome back! You've been re-subscribed.", resubscribed = true });
            }
            
            return Ok(new { message = "You're already on the list!", alreadySubscribed = true });
        }

        var subscriber = new Subscriber
        {
            Email = normalizedEmail,
            Source = request.Source ?? "homepage",
            ReferralCode = request.ReferralCode,
            CreatedAt = DateTime.UtcNow
        };

        _context.Subscribers.Add(subscriber);
        await _context.SaveChangesAsync();

        _logger.LogInformation("New subscriber: {Email} from {Source}", normalizedEmail, request.Source ?? "homepage");

        return Ok(new 
        { 
            message = "You're in! We'll notify you when TruWit launches.",
            success = true
        });
    }

    /// <summary>
    /// Unsubscribe from waitlist
    /// </summary>
    [HttpPost("unsubscribe")]
    public async Task<IActionResult> Unsubscribe([FromBody] SubscribeRequest request)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        
        var subscriber = await _context.Subscribers
            .FirstOrDefaultAsync(s => s.Email.ToLower() == normalizedEmail);

        if (subscriber == null)
        {
            return NotFound(new { error = "Email not found" });
        }

        subscriber.IsUnsubscribed = true;
        subscriber.UnsubscribedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("User unsubscribed: {Email}", normalizedEmail);

        return Ok(new { message = "You've been unsubscribed. Sorry to see you go!" });
    }

    /// <summary>
    /// Get subscriber count (public stat for social proof)
    /// </summary>
    [HttpGet("count")]
    public async Task<IActionResult> GetCount()
    {
        var count = await _context.Subscribers
            .CountAsync(s => !s.IsUnsubscribed);

        return Ok(new { count });
    }

    /// <summary>
    /// Export all subscribers (admin only - requires API key)
    /// </summary>
    [HttpGet("export")]
    public async Task<IActionResult> ExportSubscribers([FromHeader(Name = "X-Admin-Key")] string? adminKey)
    {
        var expectedKey = Environment.GetEnvironmentVariable("ADMIN_API_KEY");
        if (string.IsNullOrEmpty(expectedKey) || adminKey != expectedKey)
        {
            return Unauthorized(new { error = "Invalid admin key" });
        }

        var subscribers = await _context.Subscribers
            .Where(s => !s.IsUnsubscribed)
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => new
            {
                email = s.Email,
                source = s.Source,
                referralCode = s.ReferralCode,
                createdAt = s.CreatedAt
            })
            .ToListAsync();

        return Ok(new
        {
            count = subscribers.Count,
            exportedAt = DateTime.UtcNow,
            subscribers
        });
    }
}
