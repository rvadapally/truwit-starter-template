using System.Text.Json.Serialization;

namespace HumanProof.Api.Application.DTOs;

/// <summary>
/// Request to create proof from URL
/// </summary>
public record CreateProofFromUrlRequest(string Url);

/// <summary>
/// Response for proof creation from URL
/// </summary>
public record CreateProofFromUrlResponse(
    string ProofId,
    string TrustmarkId,
    string VerifyUrl,
    bool Deduped = false
);

/// <summary>
/// Request to create proof from file upload
/// </summary>
public record CreateProofFromFileRequest(
    string? LikenessOwnerName = null,
    string? ConsentEvidenceUrl = null
);

/// <summary>
/// Response for proof creation from file
/// </summary>
public record CreateProofFromFileResponse(
    string ProofId,
    string TrustmarkId,
    string VerifyUrl,
    string AssetId,
    bool AssetReused = false
);
