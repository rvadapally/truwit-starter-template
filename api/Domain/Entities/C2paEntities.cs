namespace HumanProof.Api.Domain.Entities;

/// <summary>
/// Link index for URL deduplication
/// </summary>
public class LinkIndex
{
    public string Platform { get; set; } = string.Empty;
    public string CanonicalId { get; set; } = string.Empty;
    public string ProofId { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Asset information for file deduplication
/// </summary>
public class Asset
{
    public string AssetId { get; set; } = string.Empty;
    public string Sha256 { get; set; } = string.Empty;
    public string? MediaType { get; set; }
    public long? Bytes { get; set; }
    public double? DurationSec { get; set; }
    public int? Width { get; set; }
    public int? Height { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Proof record with C2PA verification results
/// </summary>
public class Proof
{
    public string Id { get; set; } = string.Empty;
    public string TrustmarkId { get; set; } = string.Empty;
    public string? AssetId { get; set; }
    public bool C2paPresent { get; set; }
    public string? C2paJson { get; set; }
    public string OriginStatus { get; set; } = string.Empty;
    public string PolicyResult { get; set; } = string.Empty;
    public string? PolicyJson { get; set; }
    public string? MetadataId { get; set; }
    public string? ReceiptId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Receipt with signature and PDF
/// </summary>
public class Receipt
{
    public string Id { get; set; } = string.Empty;
    public string ProofId { get; set; } = string.Empty;
    public string Json { get; set; } = string.Empty;
    public string? PdfPath { get; set; }
    public string ReceiptHash { get; set; } = string.Empty;
    public string? Signature { get; set; }
    public string? SignerPubKey { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Idempotency tracking for API requests
/// </summary>
public class Idempotency
{
    public string IdemKey { get; set; } = string.Empty;
    public string? ProofId { get; set; }
    public string? ResponseJson { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
