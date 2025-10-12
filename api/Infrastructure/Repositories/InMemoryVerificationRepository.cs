using HumanProof.Api.Domain.Entities;
using HumanProof.Api.Domain.Interfaces;

namespace HumanProof.Api.Infrastructure.Repositories;

public class InMemoryVerificationRepository : IVerificationRepository
{
    private readonly Dictionary<string, VerificationProof> _proofs = new();
    private readonly Dictionary<Guid, VerificationProof> _proofsById = new();
    private readonly ILogger<InMemoryVerificationRepository> _logger;

    public InMemoryVerificationRepository(ILogger<InMemoryVerificationRepository> logger)
    {
        _logger = logger;

        // Add test proofs for demonstration
        var testProofs = new[]
        {
            new VerificationProof
            {
                Id = Guid.NewGuid(),
                ProofId = "GKCDxhkC",
                ContentHash = "test-content-hash-12345",
                PerceptualHash = "test-perceptual-hash-67890",
                Signature = "test-signature-abcdef",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsDeleted = false,
                Metadata = new VerificationMetadata
                {
                    Id = Guid.NewGuid(),
                    Prompt = "A cat dancing in a field",
                    ToolName = "Sora v2",
                    ToolVersion = "2.0",
                    License = Domain.Enums.LicenseType.CreatorOwned,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            },
            new VerificationProof
            {
                Id = Guid.NewGuid(),
                ProofId = "rAZEq8ma",
                ContentHash = "test-content-hash-67890",
                PerceptualHash = "test-perceptual-hash-12345",
                Signature = "test-signature-fedcba",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                IsDeleted = false,
                Metadata = new VerificationMetadata
                {
                    Id = Guid.NewGuid(),
                    Prompt = "A dog playing in the park",
                    ToolName = "Midjourney",
                    ToolVersion = "5.2",
                    License = Domain.Enums.LicenseType.BrandOwned,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }
            },
            new VerificationProof
            {
                Id = Guid.NewGuid(),
                ProofId = "LtYbVpBa",
                ContentHash = "real-content-hash-abcdef123456",
                PerceptualHash = "real-perceptual-hash-789012",
                Signature = "real-signature-xyz789",
                CreatedAt = DateTime.UtcNow.AddMinutes(-30),
                UpdatedAt = DateTime.UtcNow.AddMinutes(-30),
                IsDeleted = false,
                Metadata = new VerificationMetadata
                {
                    Id = Guid.NewGuid(),
                    Prompt = "A beautiful sunset over mountains",
                    ToolName = "DALL-E 3",
                    ToolVersion = "3.0",
                    License = Domain.Enums.LicenseType.Public,
                    CreatedAt = DateTime.UtcNow.AddMinutes(-30),
                    UpdatedAt = DateTime.UtcNow.AddMinutes(-30)
                }
            }
        };

        foreach (var proof in testProofs)
        {
            _proofs[proof.ProofId] = proof;
            _proofsById[proof.Id] = proof;
            _logger.LogInformation("Added test proof {ProofId} to in-memory repository", proof.ProofId);
        }
    }

    public Task<VerificationProof?> GetByProofIdAsync(string proofId)
    {
        _proofs.TryGetValue(proofId, out var proof);
        return Task.FromResult(proof);
    }

    public Task<VerificationProof?> GetByIdAsync(Guid id)
    {
        _proofsById.TryGetValue(id, out var proof);
        return Task.FromResult(proof);
    }

    public Task<IEnumerable<VerificationProof>> GetAllAsync(int page, int pageSize)
    {
        var results = _proofs.Values
            .Skip((page - 1) * pageSize)
            .Take(pageSize);
        return Task.FromResult(results);
    }

    public Task<VerificationProof> CreateAsync(VerificationProof proof)
    {
        _proofs[proof.ProofId] = proof;
        _proofsById[proof.Id] = proof;
        _logger.LogInformation("Created proof {ProofId} in memory", proof.ProofId);
        return Task.FromResult(proof);
    }

    public Task<VerificationProof> UpdateAsync(VerificationProof proof)
    {
        if (_proofs.ContainsKey(proof.ProofId))
        {
            _proofs[proof.ProofId] = proof;
            _proofsById[proof.Id] = proof;
            _logger.LogInformation("Updated proof {ProofId} in memory", proof.ProofId);
        }
        return Task.FromResult(proof);
    }

    public Task DeleteAsync(Guid id)
    {
        if (_proofsById.TryGetValue(id, out var proof))
        {
            _proofs.Remove(proof.ProofId);
            _proofsById.Remove(id);
            _logger.LogInformation("Deleted proof {ProofId} from memory", proof.ProofId);
        }
        return Task.CompletedTask;
    }

    public Task<bool> ExistsAsync(string proofId)
    {
        return Task.FromResult(_proofs.ContainsKey(proofId));
    }

    public Task<VerificationRequest> CreateVerificationRequestAsync(VerificationRequest request)
    {
        // For in-memory repository, we'll just return the request as-is
        // In a real implementation, you'd store it in memory
        _logger.LogInformation("Created verification request {RequestId} in memory", request.Id);
        return Task.FromResult(request);
    }
}
