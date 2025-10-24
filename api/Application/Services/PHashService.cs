using System.Security.Cryptography;
using CoenM.ImageHash;
using CoenM.ImageHash.HashAlgorithms;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.PixelFormats;

namespace HumanProof.Api.Application.Services;

/// <summary>
/// Service for computing SHA256 content hash and perceptual hash (pHash) for images
/// </summary>
public interface IPHashService
{
    /// <summary>
    /// Compute SHA256 hash of file bytes
    /// </summary>
    Task<byte[]> ComputeSha256Async(byte[] fileBytes);
    
    /// <summary>
    /// Compute 64-bit DCT-based perceptual hash
    /// </summary>
    Task<ulong> ComputePHashAsync(byte[] imageBytes);
    
    /// <summary>
    /// Calculate Hamming distance between two pHash values (number of differing bits)
    /// </summary>
    int HammingDistance(ulong hash1, ulong hash2);
}

public class PHashService : IPHashService
{
    private readonly ILogger<PHashService> _logger;

    public PHashService(ILogger<PHashService> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Compute SHA256 hash of file bytes
    /// </summary>
    public Task<byte[]> ComputeSha256Async(byte[] fileBytes)
    {
        using var sha256 = SHA256.Create();
        var hash = sha256.ComputeHash(fileBytes);
        return Task.FromResult(hash);
    }

    /// <summary>
    /// Compute 64-bit DCT-based perceptual hash using CoenM.ImageHash
    /// </summary>
    public Task<ulong> ComputePHashAsync(byte[] imageBytes)
    {
        try
        {
            using var ms = new MemoryStream(imageBytes);
            IImageHash hashAlgorithm = new CoenM.ImageHash.HashAlgorithms.PerceptualHash();
            var hash = hashAlgorithm.Hash(ms);
            _logger.LogDebug("Computed pHash: {Hash:X16}", hash);
            
            return Task.FromResult(hash);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to compute perceptual hash");
            throw new InvalidOperationException("Failed to compute perceptual hash", ex);
        }
    }

    /// <summary>
    /// Calculate Hamming distance between two pHash values
    /// Counts the number of differing bits
    /// </summary>
    public int HammingDistance(ulong hash1, ulong hash2)
    {
        var xor = hash1 ^ hash2;
        var distance = 0;
        
        // Count set bits in XOR result
        while (xor != 0)
        {
            distance += (int)(xor & 1);
            xor >>= 1;
        }
        
        return distance;
    }
}

