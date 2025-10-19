using HumanProof.Api.Application.Services;
using HumanProof.Api.Domain.Interfaces;
using HumanProof.Api.Domain.Entities;

namespace HumanProof.Api.Application.Services;

/// <summary>
/// Service for backfilling proof cards for VerificationProof entities
/// </summary>
public class ProofCardBackfillService
{
    private readonly IVerificationRepository _repository;
    private readonly IProofCardGenerator _cardGenerator;
    private readonly ILogger<ProofCardBackfillService> _logger;

    public ProofCardBackfillService(
        IVerificationRepository repository,
        IProofCardGenerator cardGenerator,
        ILogger<ProofCardBackfillService> logger)
    {
        _repository = repository;
        _cardGenerator = cardGenerator;
        _logger = logger;
    }

    public async Task BackfillAllAsync(params int[] sizes)
    {
        _logger.LogInformation("🔄 Starting proof card backfill...");

        try
        {
            // Get all proofs (using large page size to get all)
            var proofs = (await _repository.GetAllAsync(1, 10000)).ToList();
            _logger.LogInformation("Found {Count} proofs to process", proofs.Count);

            if (proofs.Count == 0)
            {
                _logger.LogInformation("No proofs found. Nothing to backfill.");
                Console.WriteLine("ℹ️  No proofs found. Create some proofs first!");
                return;
            }

            if (sizes == null || sizes.Length == 0) sizes = new[] { 800, 1024 };

            foreach (var proof in proofs)
            {
                var proofUrl = $"https://www.truwit.ai/t/{proof.ProofId}";
                string? smallUrl = null;
                string? largeUrl = null;

                foreach (var size in sizes)
                {
                    try
                    {
                        var (_, publicUrl) = _cardGenerator.Generate(proof.ProofId, proofUrl, size);
                        if (size == 640) smallUrl = publicUrl;
                        if (size == 1024) largeUrl = publicUrl;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "❌ Failed to generate proof card for {ProofId} at size {Size}", proof.ProofId, size);
                    }
                }

                // Update row pointers if URLs were generated or if they were null before
                if (proof.ProofCardSmallUrl != smallUrl || proof.ProofCardLargeUrl != largeUrl)
                {
                    proof.ProofCardSmallUrl = smallUrl;
                    proof.ProofCardLargeUrl = largeUrl;
                    await _repository.UpdateAsync(proof);
                    _logger.LogInformation("✓ Updated DB for {ProofId}: Small={Small}, Large={Large}", proof.ProofId, smallUrl, largeUrl);
                }
                else
                {
                    _logger.LogInformation("ℹ️  No DB update needed for {ProofId}", proof.ProofId);
                }
            }
            Console.WriteLine("✅ Proof card backfill completed.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error during proof card backfill.");
            Console.WriteLine($"❌ Error during backfill: {ex.Message}");
        }
    }

    public async Task TruncateAllAsync()
    {
        _logger.LogInformation("🗑️ Starting proof card truncation...");

        try
        {
            var proofs = (await _repository.GetAllAsync(1, 10000)).ToList();
            _logger.LogInformation("Found {Count} proofs to truncate", proofs.Count);

            foreach (var proof in proofs)
            {
                if (!string.IsNullOrEmpty(proof.ProofCardSmallUrl) || !string.IsNullOrEmpty(proof.ProofCardLargeUrl))
                {
                    proof.ProofCardSmallUrl = null;
                    proof.ProofCardLargeUrl = null;
                    await _repository.UpdateAsync(proof);
                    _logger.LogInformation("✓ Cleared proof card URLs for {ProofId}", proof.ProofId);
                }
            }

            Console.WriteLine("✅ Proof card truncation completed.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error during proof card truncation.");
            Console.WriteLine($"❌ Error during truncation: {ex.Message}");
        }
    }
}