using HumanProof.Api.Domain.Interfaces;
using HumanProof.Api.Domain.Entities;
using HumanProof.Api.Application.Services;

namespace HumanProof.Api.Infrastructure.Services;

public class ProofService : IProofService
{
    private readonly IVerificationRepository _repository;
    private readonly ILogger<ProofService> _logger;
    private readonly IProofCardGenerator? _cardGenerator;

    public ProofService(
        IVerificationRepository repository, 
        ILogger<ProofService> logger,
        IProofCardGenerator? cardGenerator = null)
    {
        _repository = repository;
        _logger = logger;
        _cardGenerator = cardGenerator;
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
        
        var createdProof = await _repository.CreateAsync(proof);
        
        // Generate proof cards (if generator is available)
        _logger.LogInformation("🔍 Card generator status: {Status}", _cardGenerator != null ? "Available" : "NULL");
        if (_cardGenerator != null)
        {
            try
            {
                var proofUrl = $"https://www.truwit.ai/t/{createdProof.ProofId}";
                _logger.LogInformation("🎨 Starting proof card generation for {ProofId}", createdProof.ProofId);
                var (_, smallUrl) = _cardGenerator.Generate(createdProof.ProofId, proofUrl, 800);
                var (_, largeUrl) = _cardGenerator.Generate(createdProof.ProofId, proofUrl, 1024);
                
                createdProof.ProofCardSmallUrl = smallUrl;
                createdProof.ProofCardLargeUrl = largeUrl;
                await _repository.UpdateAsync(createdProof);
                
                _logger.LogInformation("✅ Generated proof cards for {ProofId}", createdProof.ProofId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to generate proof cards for {ProofId}", createdProof.ProofId);
                // Don't fail the proof creation if card generation fails
            }
        }
        else
        {
            _logger.LogWarning("⚠️ Proof card generator is NULL - cards will not be generated");
        }
        
        return createdProof;
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
