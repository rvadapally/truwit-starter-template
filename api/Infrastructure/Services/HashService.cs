using HumanProof.Api.Domain.Interfaces;
using System.Security.Cryptography;
using System.Text;

namespace HumanProof.Api.Infrastructure.Services;

public class HashService : IHashService
{
    private readonly ILogger<HashService> _logger;

    public HashService(ILogger<HashService> logger)
    {
        _logger = logger;
    }

    public async Task<string> ComputeContentHashAsync(Stream content)
    {
        using var sha256 = SHA256.Create();
        var hashBytes = await sha256.ComputeHashAsync(content);
        return Convert.ToHexString(hashBytes).ToLowerInvariant();
    }

    public async Task<string> ComputePerceptualHashAsync(Stream content)
    {
        // For now, we'll use a simple hash of the content
        // In a real implementation, you'd use a perceptual hash algorithm like pHash
        using var sha256 = SHA256.Create();
        var hashBytes = await sha256.ComputeHashAsync(content);
        return Convert.ToHexString(hashBytes).ToLowerInvariant();
    }

    public async Task<string> GenerateSignatureAsync(string content)
    {
        // In a real implementation, you'd use a private key for signing
        // For now, we'll use HMAC-SHA256 with a secret key
        var secretKey = "truwit-secret-key"; // This should come from configuration
        var keyBytes = Encoding.UTF8.GetBytes(secretKey);
        var contentBytes = Encoding.UTF8.GetBytes(content);

        using var hmac = new HMACSHA256(keyBytes);
        var signatureBytes = await hmac.ComputeHashAsync(new MemoryStream(contentBytes));
        return Convert.ToHexString(signatureBytes).ToLowerInvariant();
    }

    public async Task<bool> VerifySignatureAsync(string content, string signature)
    {
        var computedSignature = await GenerateSignatureAsync(content);
        return string.Equals(computedSignature, signature, StringComparison.OrdinalIgnoreCase);
    }
}
