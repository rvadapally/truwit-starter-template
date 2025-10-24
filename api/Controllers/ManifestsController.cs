using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using HumanProof.Api.Application.DTOs;
using HumanProof.Api.Application.Services;
using HumanProof.Api.Infrastructure.Data;
using System.Text.Json;

namespace HumanProof.Api.Controllers;

/// <summary>
/// Manifests endpoint for retrieving asset group information (Phase 4.4)
/// </summary>
[ApiController]
[Route("v1/manifest")]
public class ManifestsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IPHashService _pHashService;
    private readonly GroupingOptions _groupingOptions;
    private readonly ILogger<ManifestsController> _logger;

    public ManifestsController(
        ApplicationDbContext context,
        IPHashService pHashService,
        IOptions<GroupingOptions> groupingOptions,
        ILogger<ManifestsController> logger)
    {
        _context = context;
        _pHashService = pHashService;
        _groupingOptions = groupingOptions.Value;
        _logger = logger;
    }

    /// <summary>
    /// Get manifest for an asset group
    /// Includes files, signatures, identities, and pHash explainer
    /// </summary>
    [HttpGet("{groupId}")]
    [ProducesResponseType(typeof(ManifestResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetManifest(Guid groupId)
    {
        try
        {
            _logger.LogInformation("Get manifest: group_id={GroupId}", groupId);

            // Query AssetGroup with related data
            var assetGroup = await _context.AssetGroups
                .Include(g => g.Files)
                    .ThenInclude(f => f.Signatures)
                        .ThenInclude(s => s.Identity)
                .FirstOrDefaultAsync(g => g.GroupId == groupId);

            if (assetGroup == null)
            {
                _logger.LogWarning("Asset group not found: {GroupId}", groupId);
                return NotFound(new { error = "Asset group not found" });
            }

            // Convert pHash to hex
            var pHashValue = BitConverter.ToUInt64(assetGroup.PHash, 0);
            var pHashHex = pHashValue.ToString("X16");

            // Build files list
            var files = assetGroup.Files.Select(f => new ManifestFile
            {
                FileId = f.FileId,
                Sha256Hex = BitConverter.ToString(f.Sha256).Replace("-", "").ToLower(),
                Width = f.Width,
                Height = f.Height,
                CreatedAt = f.CreatedAt
            }).ToList();

            // Build signatures list
            var signatures = new List<ManifestSignature>();
            foreach (var file in assetGroup.Files)
            {
                foreach (var sig in file.Signatures)
                {
                    SignatureStatement? statement = null;
                    if (!string.IsNullOrEmpty(sig.StatementJson))
                    {
                        try
                        {
                            statement = JsonSerializer.Deserialize<SignatureStatement>(sig.StatementJson);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "Failed to deserialize statement for sig_id={SigId}", sig.SigId);
                        }
                    }

                    signatures.Add(new ManifestSignature
                    {
                        SigId = sig.SigId,
                        FileId = sig.FileId,
                        SignedAt = sig.SignedAt,
                        Identity = new ManifestIdentity
                        {
                            Provider = sig.Identity.Provider,
                            Handle = sig.Identity.Handle,
                            DisplayName = sig.Identity.DisplayName,
                            FollowerCount = sig.Identity.FollowerCount,
                            AccountCreatedAt = sig.Identity.AccountCreatedAt
                        },
                        Statement = statement ?? new SignatureStatement { Claim = "unknown" }
                    });
                }
            }

            // Calculate stats
            var totalSignatures = signatures.Count;
            var firstSignedAt = signatures.Any() 
                ? signatures.Min(s => s.SignedAt) 
                : (DateTime?)null;

            // Find top identity (most signatures)
            ManifestIdentity? topIdentity = null;
            if (signatures.Any())
            {
                var topIdentityGroup = signatures
                    .GroupBy(s => new { s.Identity.Provider, s.Identity.Handle })
                    .OrderByDescending(g => g.Count())
                    .FirstOrDefault();

                if (topIdentityGroup != null)
                {
                    topIdentity = topIdentityGroup.First().Identity;
                }
            }

            var stats = new ManifestStats
            {
                TotalSignatures = totalSignatures,
                FirstSignedAt = firstSignedAt,
                TopIdentity = topIdentity
            };

            // Calculate pHash distances between all files in group
            var distances = new List<int>();
            if (assetGroup.Files.Count > 1)
            {
                var fileList = assetGroup.Files.ToList();
                for (int i = 0; i < fileList.Count; i++)
                {
                    for (int j = i + 1; j < fileList.Count; j++)
                    {
                        // For now, distance from group pHash to itself is 0
                        // In a real implementation, you'd compute pHash for each file and compare
                        distances.Add(0);
                    }
                }
            }

            var pHashExplainer = new PHashExplainer
            {
                ThresholdBits = _groupingOptions.PHashThresholdBits,
                Distances = distances
            };

            var response = new ManifestResponse
            {
                GroupId = groupId,
                PHashHex = pHashHex,
                Files = files,
                Signatures = signatures,
                Stats = stats,
                PHashExplainer = pHashExplainer
            };

            _logger.LogInformation("Manifest retrieved: group_id={GroupId}, files={FileCount}, signatures={SignatureCount}", 
                groupId, files.Count, signatures.Count);

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to get manifest for group {GroupId}", groupId);
            return StatusCode(500, new { error = "Internal server error" });
        }
    }
}

