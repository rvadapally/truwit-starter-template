using HumanProof.Api.Domain.Entities;
using HumanProof.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace HumanProof.Api.Application.Services;

/// <summary>
/// Configuration options for perceptual hash grouping
/// </summary>
public class GroupingOptions
{
    public int PHashThresholdBits { get; set; } = 6;
    public bool PreserveExif { get; set; } = false;
}

/// <summary>
/// Service for grouping assets by perceptual hash similarity
/// </summary>
public interface IGroupingService
{
    /// <summary>
    /// Find existing group within threshold or create new group
    /// </summary>
    Task<Guid> FindOrCreateGroupAsync(ulong phash, int thresholdBits);
}

public class GroupingService : IGroupingService
{
    private readonly ApplicationDbContext _context;
    private readonly IPHashService _pHashService;
    private readonly ILogger<GroupingService> _logger;
    private readonly GroupingOptions _options;

    public GroupingService(
        ApplicationDbContext context,
        IPHashService pHashService,
        ILogger<GroupingService> logger,
        IOptions<GroupingOptions> options)
    {
        _context = context;
        _pHashService = pHashService;
        _logger = logger;
        _options = options.Value;
    }

    /// <summary>
    /// Find existing group within threshold or create new group
    /// </summary>
    public async Task<Guid> FindOrCreateGroupAsync(ulong phash, int thresholdBits)
    {
        // Convert ulong to byte array for storage
        var phashBytes = BitConverter.GetBytes(phash);
        
        // Retrieve all existing groups (in Phase 1, we do simple scan; Phase 2 can add LSH/IVFFlat index)
        var existingGroups = await _context.AssetGroups
            .Select(g => new { g.GroupId, g.PHash })
            .ToListAsync();

        Guid? nearestGroupId = null;
        int nearestDistance = int.MaxValue;

        // Scan all groups to find nearest match
        foreach (var group in existingGroups)
        {
            var groupPHash = BitConverter.ToUInt64(group.PHash, 0);
            var distance = _pHashService.HammingDistance(phash, groupPHash);

            if (distance < nearestDistance)
            {
                nearestDistance = distance;
                nearestGroupId = group.GroupId;
            }
        }

        // If nearest distance is within threshold, reuse that group
        if (nearestGroupId.HasValue && nearestDistance <= thresholdBits)
        {
            _logger.LogInformation(
                "Grouping: phash={PHash:X16}, nearest_distance={Distance}, threshold={Threshold}, group_id={GroupId}, action=reuse",
                phash, nearestDistance, thresholdBits, nearestGroupId.Value);
                
            return nearestGroupId.Value;
        }

        // Otherwise, create new group
        var newGroup = new AssetGroup
        {
            GroupId = Guid.NewGuid(),
            PHash = phashBytes,
            PHashAlgo = "phash-dct",
            PHashBits = 64,
            CreatedAt = DateTime.UtcNow
        };

        _context.AssetGroups.Add(newGroup);
        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Grouping: phash={PHash:X16}, nearest_distance={Distance}, threshold={Threshold}, group_id={GroupId}, action=create",
            phash, nearestDistance, thresholdBits, newGroup.GroupId);

        return newGroup.GroupId;
    }
}

