using System.ComponentModel.DataAnnotations;

namespace HumanProof.Api.Application.DTOs;

// Phase 4.1: Init endpoint
public class InitProofRequest
{
    [Required]
    public string FileName { get; set; } = null!;
    
    [Required]
    public long ByteSize { get; set; }
    
    [Required]
    public string Mime { get; set; } = null!;
}

public class InitProofResponse
{
    public object? UploadPolicy { get; set; }
    public string ClientHashInstructions { get; set; } = "Compute SHA256 on client; then POST /v1/proofs/finalize";
}

// Phase 4.2: Finalize endpoint
public class FinalizeProofRequest
{
    [Required]
    public string Sha256Hex { get; set; } = null!;
    
    [Required]
    public string ImageBase64 { get; set; } = null!;
    
    public Dictionary<string, object>? TechMeta { get; set; }
}

public class FinalizeProofResponse
{
    public Guid GroupId { get; set; }
    public Guid FileId { get; set; }
    public string ManifestUrl { get; set; } = null!;
}

// Phase 4.3: Signature endpoint
public class CreateSignatureRequest
{
    [Required]
    public Guid FileId { get; set; }
    
    [Required]
    public SignatureStatement Statement { get; set; } = null!;
    
    public string? ClientPublicKey { get; set; }
    public string? SigBlob { get; set; }
}

public class SignatureStatement
{
    [Required]
    public string Claim { get; set; } = null!; // 'creator', 'witness', 'publisher'
    
    public string? Notes { get; set; }
}

public class CreateSignatureResponse
{
    public Guid SigId { get; set; }
    public DateTime SignedAt { get; set; }
}

// Phase 4.4: Manifest endpoint
public class ManifestResponse
{
    public Guid GroupId { get; set; }
    public string PHashHex { get; set; } = null!;
    public List<ManifestFile> Files { get; set; } = new();
    public List<ManifestSignature> Signatures { get; set; } = new();
    public ManifestStats Stats { get; set; } = null!;
    public PHashExplainer PHashExplainer { get; set; } = null!;
}

public class ManifestFile
{
    public Guid FileId { get; set; }
    public string Sha256Hex { get; set; } = null!;
    public int? Width { get; set; }
    public int? Height { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ManifestSignature
{
    public Guid SigId { get; set; }
    public Guid FileId { get; set; }
    public DateTime SignedAt { get; set; }
    public ManifestIdentity Identity { get; set; } = null!;
    public SignatureStatement Statement { get; set; } = null!;
}

public class ManifestIdentity
{
    public string Provider { get; set; } = null!;
    public string? Handle { get; set; }
    public string? DisplayName { get; set; }
    public int? FollowerCount { get; set; }
    public DateTime? AccountCreatedAt { get; set; }
}

public class ManifestStats
{
    public int TotalSignatures { get; set; }
    public DateTime? FirstSignedAt { get; set; }
    public ManifestIdentity? TopIdentity { get; set; }
}

public class PHashExplainer
{
    public int ThresholdBits { get; set; }
    public List<int> Distances { get; set; } = new();
}

