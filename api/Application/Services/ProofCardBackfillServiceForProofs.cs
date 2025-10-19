using HumanProof.Api.Domain.Interfaces;
using HumanProof.Api.Domain.Entities;

namespace HumanProof.Api.Application.Services;

/// <summary>
/// Service for backfilling proof cards for Proof entities (not VerificationProof)
/// </summary>
public class ProofCardBackfillServiceForProofs
{
    private readonly IProofsRepository _proofsRepo;
    private readonly IProofCardGenerator _cardGenerator;
    private readonly ILogger<ProofCardBackfillServiceForProofs> _logger;

    public ProofCardBackfillServiceForProofs(
        IProofsRepository proofsRepo,
        IProofCardGenerator cardGenerator,
        ILogger<ProofCardBackfillServiceForProofs> logger)
    {
        _proofsRepo = proofsRepo;
        _cardGenerator = cardGenerator;
        _logger = logger;
    }

    public async Task BackfillAllAsync(params int[] sizes)
    {
        _logger.LogInformation("🔄 Starting proof card backfill for Proof entities...");

        try
        {
            var proofs = (await _proofsRepo.GetAllAsync()).ToList();
            _logger.LogInformation("Found {Count} Proof entities to process", proofs.Count);

            if (proofs.Count == 0)
            {
                _logger.LogInformation("No Proof entities found. Nothing to backfill.");
                Console.WriteLine("ℹ️  No Proof entities found. Create some proofs first!");
                return;
            }

            if (sizes == null || sizes.Length == 0) sizes = new[] { 800, 1024 };

            foreach (var proof in proofs)
            {
                var proofUrl = $"https://www.truwit.ai/t/{proof.TrustmarkId}";
                string? smallUrl = null;
                string? largeUrl = null;

                foreach (var size in sizes)
                {
                    try
                    {
                        var (_, publicUrl) = _cardGenerator.Generate(proof.TrustmarkId, proofUrl, size);
                        if (size == 800) smallUrl = publicUrl;
                        if (size == 1024) largeUrl = publicUrl;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "❌ Failed to generate proof card for Proof entity {TrustmarkId} at size {Size}", proof.TrustmarkId, size);
                    }
                }

                // Always update to ensure database is in sync with generated files
                _logger.LogInformation("📝 Comparing DB vs Generated - DB Small={DbSmall}, Generated Small={GenSmall}, DB Large={DbLarge}, Generated Large={GenLarge}", 
                    proof.ProofCardSmallUrl ?? "NULL", smallUrl ?? "NULL", proof.ProofCardLargeUrl ?? "NULL", largeUrl ?? "NULL");
                
                if (proof.ProofCardSmallUrl != smallUrl || proof.ProofCardLargeUrl != largeUrl)
                {
                    proof.ProofCardSmallUrl = smallUrl;
                    proof.ProofCardLargeUrl = largeUrl;
                    await _proofsRepo.UpdateAsync(proof);
                    _logger.LogInformation("✓ Updated DB for Proof entity {TrustmarkId}: Small={Small}, Large={Large}", proof.TrustmarkId, smallUrl, largeUrl);
                }
                else
                {
                    _logger.LogInformation("ℹ️  No DB update needed for Proof entity {TrustmarkId}", proof.TrustmarkId);
                }
            }
            Console.WriteLine("✅ Proof card backfill for Proof entities completed.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error during proof card backfill for Proof entities.");
            Console.WriteLine($"❌ Error during backfill for Proof entities: {ex.Message}");
        }
    }

    public async Task TruncateAllAsync()
    {
        _logger.LogInformation("🗑️  Starting proof card truncation for Proof entities...");

        try
        {
            var proofs = (await _proofsRepo.GetAllAsync()).ToList();
            _logger.LogInformation("Found {Count} Proof entities to truncate", proofs.Count);

            foreach (var proof in proofs)
            {
                string? smallUrl = null;
                string? largeUrl = null;

                // Delete physical files
                if (!string.IsNullOrEmpty(proof.ProofCardSmallUrl))
                {
                    var fileName = Path.GetFileName(proof.ProofCardSmallUrl);
                    var filePath = Path.Combine(_cardGenerator.GetOutputDir(), fileName);
                    if (File.Exists(filePath))
                    {
                        File.Delete(filePath);
                        _logger.LogInformation("🗑️  Deleted file: {FilePath}", filePath);
                    }
                }
                if (!string.IsNullOrEmpty(proof.ProofCardLargeUrl))
                {
                    var fileName = Path.GetFileName(proof.ProofCardLargeUrl);
                    var filePath = Path.Combine(_cardGenerator.GetOutputDir(), fileName);
                    if (File.Exists(filePath))
                    {
                        File.Delete(filePath);
                        _logger.LogInformation("🗑️  Deleted file: {FilePath}", filePath);
                    }
                }

                // Clear DB entries
                if (proof.ProofCardSmallUrl != null || proof.ProofCardLargeUrl != null)
                {
                    proof.ProofCardSmallUrl = null;
                    proof.ProofCardLargeUrl = null;
                    await _proofsRepo.UpdateAsync(proof);
                    _logger.LogInformation("✓ Cleared DB URLs for Proof entity {TrustmarkId}", proof.TrustmarkId);
                }
            }
            Console.WriteLine("✅ Proof card truncation for Proof entities completed.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error during proof card truncation for Proof entities.");
            Console.WriteLine($"❌ Error during truncation for Proof entities: {ex.Message}");
        }
    }
}
