using HumanProof.Api.Domain.Entities;
using HumanProof.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Logging;

namespace HumanProof.Api.Application.Services;

public interface IGroupingService
{
    Task<AssetGroup> FindOrCreateAssetGroupAsync(byte[] pHash);
}

public class GroupingService : IGroupingService
{
    private readonly ApplicationDbContext _context;
    private readonly IPHashService _pHashService;
    private readonly GroupingOptions _options;
    private readonly ILogger<GroupingService> _logger;

    public GroupingService(
        ApplicationDbContext context,
        IPHashService pHashService,
        IOptions<GroupingOptions> options,
        ILogger<GroupingService> logger)
    {
        _context = context;
        _pHashService = pHashService;
        _options = options.Value;
        _logger = logger;
    }

    /// <summary>
    /// Finds an existing AssetGroup with a pHash within the threshold, or creates a new one.
    /// </summary>
    public async Task<AssetGroup> FindOrCreateAssetGroupAsync(byte[] pHashBytes)
    {
        var pHash = BitConverter.ToUInt64(pHashBytes, 0);

        // Phase 1: Simple SQL scan for candidates
        // In a real-world scenario with many assets, this would be optimized with LSH/IVFFlat indexes.
        var candidateGroups = await _context.AssetGroups
            .AsNoTracking()
            .ToListAsync();

        AssetGroup? bestMatch = null;
        int minDistance = _options.PHashThresholdBits + 1; // Initialize with a value higher than threshold

        foreach (var group in candidateGroups)
        {
            var groupPHash = BitConverter.ToUInt64(group.PHash, 0);
            var distance = _pHashService.HammingDistance(pHash, groupPHash);

            if (distance <= _options.PHashThresholdBits && distance < minDistance)
            {
                minDistance = distance;
                bestMatch = group;
            }
        }

        if (bestMatch != null)
        {
            _logger.LogInformation("Found existing AssetGroup {GroupId} with pHash distance {Distance}", bestMatch.GroupId, minDistance);
            return bestMatch;
        }

        _logger.LogInformation("Creating new AssetGroup for pHash {PHash:X16}", pHash);
        var newGroup = new AssetGroup
        {
            PHash = pHashBytes,
            PHashAlgo = "phash-dct",
            PHashBits = 64,
            CreatedAt = DateTime.UtcNow // Ensure UTC
        };
        _context.AssetGroups.Add(newGroup);
        await _context.SaveChangesAsync(); // Save to get GroupId
        return newGroup;
    }
}

public class GroupingOptions
{
    public int PHashThresholdBits { get; set; } = 6;
    public bool PreserveExif { get; set; } = false;
}
