using System.ComponentModel.DataAnnotations;
using HumanProof.Api.Domain.Enums;

namespace HumanProof.Api.Domain.Entities;

public class VerificationProof
{
    public Guid Id { get; set; }
    public string ProofId { get; set; } = string.Empty;
    public string ContentHash { get; set; } = string.Empty;
    public string PerceptualHash { get; set; } = string.Empty;
    public string Signature { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public bool IsDeleted { get; set; }
    
    // Navigation properties
    public VerificationMetadata Metadata { get; set; } = null!;
    public Guid MetadataId { get; set; }
}

public class VerificationMetadata
{
    public Guid Id { get; set; }
    public string? Prompt { get; set; }
    public string? ToolName { get; set; }
    public string? ToolVersion { get; set; }
    public string? LikenessConsent { get; set; }
    public LicenseType License { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Navigation properties
    public VerificationProof Proof { get; set; } = null!;
}

public class VerificationRequest
{
    public Guid Id { get; set; }
    public string? Url { get; set; }
    public string? FileName { get; set; }
    public long? FileSize { get; set; }
    public string? ContentType { get; set; }
    public VerificationStatus Status { get; set; }
    public string? ErrorMessage { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    // Navigation properties
    public VerificationProof? Proof { get; set; }
    public Guid? ProofId { get; set; }
}
