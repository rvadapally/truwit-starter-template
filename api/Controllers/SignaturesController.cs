using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using HumanProof.Api.Application.DTOs;
using HumanProof.Api.Infrastructure.Data;
using HumanProof.Api.Domain.Entities;
using System.Security.Claims;
using System.Text.Json;

namespace HumanProof.Api.Controllers;

/// <summary>
/// Signatures endpoint for multi-sign system (Phase 4.3)
/// </summary>
[ApiController]
[Route("v1/signatures")]
public class SignaturesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<SignaturesController> _logger;

    public SignaturesController(ApplicationDbContext context, ILogger<SignaturesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Create a new signature for a file
    /// Requires JWT authentication (identity_token)
    /// </summary>
    [HttpPost]
    [Authorize]
    [Microsoft.AspNetCore.RateLimiting.EnableRateLimiting("signatures")]
    [ProducesResponseType(typeof(CreateSignatureResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> CreateSignature([FromBody] CreateSignatureRequest request)
    {
        try
        {
            // 1. Extract identity from JWT claims
            var identityIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(identityIdClaim) || !Guid.TryParse(identityIdClaim, out var identityId))
            {
                _logger.LogWarning("Invalid or missing identity_id in JWT");
                return Unauthorized(new { error = "Invalid identity token" });
            }

            var provider = User.FindFirst("provider")?.Value;
            var handle = User.FindFirst("handle")?.Value;

            _logger.LogInformation("Create signature: file_id={FileId}, identity_id={IdentityId}, provider={Provider}, handle={Handle}", 
                request.FileId, identityId, provider, handle);

            // 2. Verify identity exists
            var identity = await _context.Identities.FindAsync(identityId);
            if (identity == null)
            {
                _logger.LogWarning("Identity not found: {IdentityId}", identityId);
                return Unauthorized(new { error = "Identity not found" });
            }

            // 3. Verify file_id exists
            var assetFile = await _context.AssetFiles
                .Include(f => f.Group)
                .FirstOrDefaultAsync(f => f.FileId == request.FileId);

            if (assetFile == null)
            {
                _logger.LogWarning("File not found: {FileId}", request.FileId);
                return NotFound(new { error = "File not found" });
            }

            // 4. Check if signature already exists (UNIQUE constraint: file_id + identity_id)
            var existingSignature = await _context.Signatures
                .FirstOrDefaultAsync(s => s.FileId == request.FileId && s.IdentityId == identityId);

            if (existingSignature != null)
            {
                _logger.LogInformation("Signature already exists: sig_id={SigId}", existingSignature.SigId);
                return Ok(new CreateSignatureResponse
                {
                    SigId = existingSignature.SigId,
                    SignedAt = existingSignature.SignedAt
                });
            }

            // 5. Validate statement claim
            var validClaims = new[] { "creator", "witness", "publisher" };
            if (!validClaims.Contains(request.Statement.Claim.ToLower()))
            {
                return BadRequest(new { error = $"Invalid claim. Must be one of: {string.Join(", ", validClaims)}" });
            }

            // 6. Insert Signature
            var signature = new Signature
            {
                SigId = Guid.NewGuid(),
                FileId = request.FileId,
                IdentityId = identityId,
                SignedAt = DateTime.UtcNow,
                SignatureType = "eddsa",
                SigBlob = !string.IsNullOrEmpty(request.SigBlob) 
                    ? Convert.FromBase64String(request.SigBlob) 
                    : null,
                ClientPublicKey = !string.IsNullOrEmpty(request.ClientPublicKey) 
                    ? Convert.FromBase64String(request.ClientPublicKey) 
                    : null,
                StatementJson = JsonSerializer.Serialize(request.Statement)
            };

            _context.Signatures.Add(signature);

            // 7. Create ManifestEvent
            var manifestEvent = new ManifestEvent
            {
                EventId = Guid.NewGuid(),
                GroupId = assetFile.GroupId,
                Kind = "signature_added",
                Payload = JsonSerializer.Serialize(new
                {
                    sig_id = signature.SigId,
                    file_id = request.FileId,
                    identity_id = identityId,
                    provider = identity.Provider,
                    handle = identity.Handle,
                    statement = request.Statement
                }),
                CreatedAt = DateTime.UtcNow
            };

            _context.ManifestEvents.Add(manifestEvent);

            await _context.SaveChangesAsync();

            _logger.LogInformation("Signature created: sig_id={SigId}, group_id={GroupId}", 
                signature.SigId, assetFile.GroupId);

            return CreatedAtAction(
                nameof(GetSignature), 
                new { sigId = signature.SigId }, 
                new CreateSignatureResponse
                {
                    SigId = signature.SigId,
                    SignedAt = signature.SignedAt
                });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create signature");
            return StatusCode(500, new { error = "Internal server error" });
        }
    }

    /// <summary>
    /// Get a signature by ID (helper endpoint)
    /// </summary>
    [HttpGet("{sigId}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetSignature(Guid sigId)
    {
        var signature = await _context.Signatures
            .Include(s => s.Identity)
            .Include(s => s.File)
            .FirstOrDefaultAsync(s => s.SigId == sigId);

        if (signature == null)
        {
            return NotFound();
        }

        return Ok(new
        {
            sig_id = signature.SigId,
            file_id = signature.FileId,
            identity = new
            {
                provider = signature.Identity.Provider,
                handle = signature.Identity.Handle,
                display_name = signature.Identity.DisplayName
            },
            signed_at = signature.SignedAt,
            statement = signature.StatementJson != null 
                ? JsonSerializer.Deserialize<object>(signature.StatementJson) 
                : null
        });
    }
}

