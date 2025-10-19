namespace HumanProof.Api.Application.Services;

/// <summary>
/// Interface for generating proof card images
/// </summary>
public interface IProofCardGenerator
{
    /// <summary>
    /// Generate a proof card image
    /// </summary>
    /// <param name="proofId">Proof ID (e.g., TW-7F39C1AB)</param>
    /// <param name="proofUrl">Full proof URL (e.g., https://www.truwit.ai/t/TW-7F39C1AB)</param>
    /// <param name="sizePx">Size in pixels (800 or 1024)</param>
    /// <returns>Tuple of (disk path, public URL)</returns>
    (string diskPath, string publicUrl) Generate(string proofId, string proofUrl, int sizePx);

    /// <summary>
    /// Get the output directory for proof cards
    /// </summary>
    /// <returns>Output directory path</returns>
    string GetOutputDir();
}

