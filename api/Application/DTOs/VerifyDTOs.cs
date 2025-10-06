namespace HumanProof.Api.Application.DTOs;

/// <summary>
/// Response for proof verification
/// </summary>
public record VerifyProofResponse(
    string TrustmarkId,
    OriginInfo Origin,
    PolicyInfo Policy,
    ReceiptInfo Receipt,
    DateTime CreatedAt
);

/// <summary>
/// Origin information from C2PA verification
/// </summary>
public record OriginInfo(
    bool C2pa,
    string Status,
    string? ClaimGenerator,
    string? Issuer,
    DateTime? Timestamp,
    string? Sha256
);

/// <summary>
/// Policy information
/// </summary>
public record PolicyInfo(
    string Result,
    object[] Details
);

/// <summary>
/// Receipt information
/// </summary>
public record ReceiptInfo(
    string? PdfUrl,
    object? Json,
    string? Signature,
    string? SignerPubKey
);
