using HumanProof.Api.Domain.Interfaces;
using HumanProof.Api.Domain.Entities;

namespace HumanProof.Api.Infrastructure.Services;

public class ProofService : IProofService
{
    private readonly IVerificationRepository _repository;
    private readonly ILogger<ProofService> _logger;

    public ProofService(IVerificationRepository repository, ILogger<ProofService> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public async Task<string> GenerateProofIdAsync()
    {
        // Generate a short, URL-friendly proof ID
        var random = new Random();
        var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        var proofId = new string(Enumerable.Repeat(chars, 8)
            .Select(s => s[random.Next(s.Length)]).ToArray());
        
        // Ensure uniqueness
        while (await _repository.ExistsAsync(proofId))
        {
            proofId = new string(Enumerable.Repeat(chars, 8)
                .Select(s => s[random.Next(s.Length)]).ToArray());
        }
        
        return proofId;
    }

    public async Task<VerificationProof> CreateProofAsync(VerificationRequest request)
    {
        var proofId = await GenerateProofIdAsync();
        
        var proof = new VerificationProof
        {
            Id = Guid.NewGuid(),
            ProofId = proofId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            IsDeleted = false
        };
        
        return await _repository.CreateAsync(proof);
    }

    public async Task<VerificationProof?> GetProofAsync(string proofId)
    {
        return await _repository.GetByProofIdAsync(proofId);
    }

    public async Task<bool> ValidateProofAsync(string proofId)
    {
        var proof = await _repository.GetByProofIdAsync(proofId);
        return proof != null && !proof.IsDeleted;
    }
}
