using HumanProof.Api.Domain.Entities;

namespace HumanProof.Api.Domain.Interfaces;

/// <summary>
/// Repository for LinkIndex operations
/// </summary>
public interface ILinkIndexRepository
{
    Task<string?> TryGetProofIdAsync(string platform, string canonicalId);
    Task<string> InsertAsync(string platform, string canonicalId, string proofId);
}

/// <summary>
/// Repository for Asset operations
/// </summary>
public interface IAssetsRepository
{
    Task<Asset?> GetBySha256Async(string sha256);
    Task<string> InsertAsync(Asset asset);
}

/// <summary>
/// Repository for Proof operations
/// </summary>
public interface IProofsRepository
{
    Task<string> InsertAsync(Proof proof);
    Task<Proof?> GetByIdAsync(string id);
    Task<Proof?> GetByTrustmarkIdAsync(string trustmarkId);
}

/// <summary>
/// Repository for Receipt operations
/// </summary>
public interface IReceiptsRepository
{
    Task<string> InsertAsync(Receipt receipt);
    Task<Receipt?> GetByProofIdAsync(string proofId);
}

/// <summary>
/// Repository for Idempotency operations
/// </summary>
public interface IIdempotencyRepository
{
    Task<(string? proofId, string? responseJson)> TryGetAsync(string idemKey);
    Task InsertIfAbsentAsync(string idemKey);
    Task UpdateResultAsync(string idemKey, string proofId, string responseJson);
}
