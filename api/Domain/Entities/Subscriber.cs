namespace HumanProof.Api.Domain.Entities;

/// <summary>
/// Email subscriber for waitlist/newsletter
/// </summary>
public class Subscriber
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string? Source { get; set; } // "homepage", "product_hunt", etc.
    public string? ReferralCode { get; set; }
    public bool IsVerified { get; set; } = false;
    public bool IsUnsubscribed { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? VerifiedAt { get; set; }
    public DateTime? UnsubscribedAt { get; set; }
}
