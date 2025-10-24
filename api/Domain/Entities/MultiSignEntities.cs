using HumanProof.Api.Domain.Common;

namespace HumanProof.Api.Domain.Entities;

/// <summary>
/// Asset group for perceptual hash-based deduplication
/// </summary>
public class AssetGroup
{
    public Guid GroupId { get; set; } = Guid.NewGuid();
    public byte[] PHash { get; set; } = Array.Empty<byte>();
    public string PHashAlgo { get; set; } = "phash-dct";
    public int PHashBits { get; set; } = 64;
    public DateTime CreatedAt { get; set; } = DateTimeProvider.Now;
    
    // Navigation properties
    public ICollection<AssetFile> Files { get; set; } = new List<AssetFile>();
    public ICollection<ManifestEvent> ManifestEvents { get; set; } = new List<ManifestEvent>();
}

/// <summary>
/// Individual file within an asset group (identified by SHA256)
/// </summary>
public class AssetFile
{
    public Guid FileId { get; set; } = Guid.NewGuid();
    public Guid GroupId { get; set; }
    public byte[] Sha256 { get; set; } = Array.Empty<byte>();
    public long? Bytesize { get; set; }
    public string? Mime { get; set; }
    public int? Width { get; set; }
    public int? Height { get; set; }
    public DateTime CreatedAt { get; set; } = DateTimeProvider.Now;
    
    // Navigation properties
    public AssetGroup Group { get; set; } = null!;
    public ICollection<Signature> Signatures { get; set; } = new List<Signature>();
}

/// <summary>
/// Identity provider information for signers
/// </summary>
public class Identity
{
    public Guid IdentityId { get; set; } = Guid.NewGuid();
    public string Provider { get; set; } = string.Empty; // 'x', 'google', 'github', 'behance', 'anon'
    public string? Handle { get; set; }
    public string? DisplayName { get; set; }
    public int? FollowerCount { get; set; }
    public DateTime? AccountCreatedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTimeProvider.Now;
    
    // Navigation properties
    public ICollection<Signature> Signatures { get; set; } = new List<Signature>();
}

/// <summary>
/// Signature attestation linking an identity to a file
/// </summary>
public class Signature
{
    public Guid SigId { get; set; } = Guid.NewGuid();
    public Guid FileId { get; set; }
    public Guid IdentityId { get; set; }
    public DateTime SignedAt { get; set; } = DateTimeProvider.Now;
    public string SignatureType { get; set; } = "eddsa";
    public byte[]? SigBlob { get; set; }
    public byte[]? ClientPublicKey { get; set; }
    public string? StatementJson { get; set; } // JSONB in PostgreSQL
    
    // Navigation properties
    public AssetFile File { get; set; } = null!;
    public Identity Identity { get; set; } = null!;
}

/// <summary>
/// Event log for manifest changes
/// </summary>
public class ManifestEvent
{
    public Guid EventId { get; set; } = Guid.NewGuid();
    public Guid GroupId { get; set; }
    public string Kind { get; set; } = string.Empty; // 'file_added', 'signature_added', etc.
    public string? Payload { get; set; } // JSONB in PostgreSQL
    public DateTime CreatedAt { get; set; } = DateTimeProvider.Now;
    
    // Navigation properties
    public AssetGroup Group { get; set; } = null!;
}


