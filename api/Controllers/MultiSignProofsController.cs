using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HumanProof.Api.Application.DTOs;
using HumanProof.Api.Application.Services;
using HumanProof.Api.Infrastructure.Data;
using HumanProof.Api.Domain.Entities;
using Microsoft.Extensions.Options;
using System.Text.Json;

namespace HumanProof.Api.Controllers;

/// <summary>
/// Multi-sign proof endpoints for init and finalize operations
/// </summary>
[ApiController]
[Route("v1/proofs")]
public class MultiSignProofsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IPHashService _pHashService;
    private readonly IGroupingService _groupingService;
    private readonly IImageInfoService _imageInfoService;
    private readonly GroupingOptions _groupingOptions;
    private readonly ILogger<MultiSignProofsController> _logger;
    private readonly IConfiguration _configuration;

    public MultiSignProofsController(
        ApplicationDbContext context,
        IPHashService pHashService,
        IGroupingService groupingService,
        IImageInfoService imageInfoService,
        IOptions<GroupingOptions> groupingOptions,
        IConfiguration configuration,
        ILogger<MultiSignProofsController> logger)
    {
        _context = context;
        _pHashService = pHashService;
        _groupingService = groupingService;
        _imageInfoService = imageInfoService;
        _groupingOptions = groupingOptions.Value;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Initialize a new proof upload (Phase 4.1)
    /// </summary>
    [HttpPost("init")]
    [ProducesResponseType(typeof(InitProofResponse), StatusCodes.Status200OK)]
    public IActionResult InitProof([FromBody] InitProofRequest request)
    {
        _logger.LogInformation("Init proof: filename={FileName}, size={ByteSize}, mime={Mime}", 
            request.FileName, request.ByteSize, request.Mime);

        // MVP: Direct upload only, no S3/R2 policy
        var response = new InitProofResponse
        {
            UploadPolicy = null,
            ClientHashInstructions = "Compute SHA256 on client; then POST /v1/proofs/finalize"
        };

        return Ok(response);
    }

    /// <summary>
    /// Finalize a proof with image data and hashes (Phase 4.2)
    /// </summary>
    [HttpPost("finalize")]
    [Microsoft.AspNetCore.RateLimiting.EnableRateLimiting("finalize")]
    [ProducesResponseType(typeof(FinalizeProofResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> FinalizeProof([FromBody] FinalizeProofRequest request)
    {
        try
        {
            _logger.LogInformation("Finalize proof: sha256={Sha256}", request.Sha256Hex);

            // 1. Decode base64 image (reject if missing)
            if (string.IsNullOrEmpty(request.ImageBase64))
            {
                return BadRequest(new { error = "Image data required" });
            }

            byte[] imageBytes;
            try
            {
                imageBytes = Convert.FromBase64String(request.ImageBase64);
            }
            catch (FormatException)
            {
                return BadRequest(new { error = "Invalid base64 image data" });
            }

            // 2. Recompute sha256 and verify match
            var computedSha256 = await _pHashService.ComputeSha256Async(imageBytes);
            var computedSha256Hex = BitConverter.ToString(computedSha256).Replace("-", "").ToLower();

            if (computedSha256Hex != request.Sha256Hex.ToLower())
            {
                _logger.LogWarning("SHA256 mismatch: expected={Expected}, computed={Computed}", 
                    request.Sha256Hex, computedSha256Hex);
                return BadRequest(new { error = "SHA256 hash mismatch" });
            }

            // 3. Compute pHash
            var pHashValue = await _pHashService.ComputePHashAsync(imageBytes);
            var pHashBytes = BitConverter.GetBytes(pHashValue);

            _logger.LogInformation("Computed hashes: sha256={Sha256}, phash={PHash:X16}", 
                computedSha256Hex, pHashValue);

            // 4. Find/create AssetGroup
            var assetGroup = await _groupingService.FindOrCreateAssetGroupAsync(pHashBytes);

            // 5. Extract image info
            var (width, height, mime) = await _imageInfoService.ExtractInfoAsync(imageBytes);

            // 6. Check if file already exists (by SHA256)
            var existingFile = await _context.AssetFiles
                .FirstOrDefaultAsync(f => f.Sha256.SequenceEqual(computedSha256));

            if (existingFile != null)
            {
                _logger.LogInformation("File already exists: file_id={FileId}, group_id={GroupId}", 
                    existingFile.FileId, existingFile.GroupId);

                var publicBase = _configuration["Truwit:PublicBase"] ?? "https://truwit.ai";
                var manifestUrl = $"{publicBase}/v1/manifest/{existingFile.GroupId}";

                return Ok(new FinalizeProofResponse
                {
                    GroupId = existingFile.GroupId,
                    FileId = existingFile.FileId,
                    ManifestUrl = manifestUrl
                });
            }

            // 7. Insert AssetFile
            var assetFile = new AssetFile
            {
                FileId = Guid.NewGuid(),
                GroupId = assetGroup.GroupId,
                Sha256 = computedSha256,
                Bytesize = imageBytes.Length,
                Mime = mime,
                Width = width,
                Height = height,
                CreatedAt = DateTime.UtcNow
            };

            _context.AssetFiles.Add(assetFile);

            // 8. Create ManifestEvent
            var manifestEvent = new ManifestEvent
            {
                EventId = Guid.NewGuid(),
                GroupId = assetGroup.GroupId,
                Kind = "file_added",
                Payload = JsonSerializer.Serialize(new
                {
                    file_id = assetFile.FileId,
                    sha256 = computedSha256Hex,
                    bytesize = imageBytes.Length,
                    width,
                    height,
                    mime,
                    tech_meta = request.TechMeta
                }),
                CreatedAt = DateTime.UtcNow
            };

            _context.ManifestEvents.Add(manifestEvent);

            await _context.SaveChangesAsync();

            _logger.LogInformation("Finalized proof: group_id={GroupId}, file_id={FileId}", 
                assetGroup.GroupId, assetFile.FileId);

            var publicBaseUrl = _configuration["Truwit:PublicBase"] ?? "https://truwit.ai";
            var responseManifestUrl = $"{publicBaseUrl}/v1/manifest/{assetGroup.GroupId}";

            return Ok(new FinalizeProofResponse
            {
                GroupId = assetGroup.GroupId,
                FileId = assetFile.FileId,
                ManifestUrl = responseManifestUrl
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to finalize proof");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }
}

