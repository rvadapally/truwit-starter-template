using System.Security.Cryptography;

namespace HumanProof.Api.Application.Services;

/// <summary>
/// File hashing service
/// </summary>
public sealed class Hasher : IHasher
{
    private readonly ILogger<Hasher> _logger;

    public Hasher(ILogger<Hasher> logger)
    {
        _logger = logger;
    }

    public async Task<string> Sha256Async(string filePath, CancellationToken ct = default)
    {
        try
        {
            _logger.LogDebug("Computing SHA-256 hash for file: {FilePath}", filePath);

            if (!File.Exists(filePath))
            {
                throw new FileNotFoundException($"File not found: {filePath}");
            }

            using var sha256 = SHA256.Create();
            using var stream = File.OpenRead(filePath);
            
            var hashBytes = await sha256.ComputeHashAsync(stream, ct);
            var hashString = Convert.ToHexString(hashBytes).ToLowerInvariant();

            _logger.LogDebug("Computed SHA-256 hash for file: {FilePath}, Hash: {Hash}", filePath, hashString);
            return hashString;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error computing SHA-256 hash for file: {FilePath}", filePath);
            throw;
        }
    }
}
