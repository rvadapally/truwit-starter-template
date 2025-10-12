using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using HumanProof.Api.Application.DTOs;
using HumanProof.Api.Application.Services;
using HumanProof.Api.Domain.Interfaces;
using HumanProof.Api.Domain.Entities;
using HumanProof.Api.Domain.Enums;
using HumanProof.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Net;
using System.Text.RegularExpressions;
using System.Text.Json;

namespace HumanProof.Api.Controllers;

[ApiController]
[Route("v1")]
public class ProofsController : ControllerBase
{
    private readonly IVerificationService _verificationService;
    private readonly IC2paVerifier _c2paVerifier;
    private readonly IVerificationStatusTracker _statusTracker;
    private readonly IUrlCanonicalizer _canonicalizer;
    private readonly ILinkIndexRepository _linkIndexRepo;
    private readonly IAssetsRepository _assetsRepo;
    private readonly IProofsRepository _proofsRepo;
    private readonly IReceiptsRepository _receiptsRepo;
    private readonly IIdempotencyRepository _idempotencyRepo;
    private readonly IReceiptSigner _receiptSigner;
    private readonly IHasher _hasher;
    private readonly IMediaDownloader _downloader;
    private readonly ILogger<ProofsController> _logger;
    private readonly IOptionsSnapshot<FeatureFlags> _featureFlags;
    private readonly DevC2paSigner _devC2paSigner;
    private readonly IC2paLocalParser _c2paLocalParser;

    public ProofsController(
        IVerificationService verificationService,
        IC2paVerifier c2paVerifier,
        IVerificationStatusTracker statusTracker,
        IUrlCanonicalizer canonicalizer,
        ILinkIndexRepository linkIndexRepo,
        IAssetsRepository assetsRepo,
        IProofsRepository proofsRepo,
        IReceiptsRepository receiptsRepo,
        IIdempotencyRepository idempotencyRepo,
        IReceiptSigner receiptSigner,
        IHasher hasher,
        IMediaDownloader downloader,
        ILogger<ProofsController> logger,
        IOptionsSnapshot<FeatureFlags> featureFlags,
        DevC2paSigner devC2paSigner,
        IC2paLocalParser c2paLocalParser)
    {
        _verificationService = verificationService;
        _c2paVerifier = c2paVerifier;
        _statusTracker = statusTracker;
        _canonicalizer = canonicalizer;
        _linkIndexRepo = linkIndexRepo;
        _assetsRepo = assetsRepo;
        _proofsRepo = proofsRepo;
        _receiptsRepo = receiptsRepo;
        _idempotencyRepo = idempotencyRepo;
        _receiptSigner = receiptSigner;
        _hasher = hasher;
        _downloader = downloader;
        _logger = logger;
        _featureFlags = featureFlags;
        _devC2paSigner = devC2paSigner;
        _c2paLocalParser = c2paLocalParser;
    }

    [HttpPost("proofs/url")]
    [ProducesResponseType(typeof(CreateProofFromUrlResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CreateProofFromUrlResponse>> CreateProofFromUrl(
        [FromBody] CreateProofFromUrlRequest request)
    {
        try
        {
            _logger.LogInformation("🚀 CreateProofFromUrl called with URL: {Url}", request?.Url);

            if (string.IsNullOrEmpty(request?.Url))
            {
                _logger.LogWarning("❌ URL is null or empty");
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "URL is required",
                    Status = StatusCodes.Status400BadRequest
                });
            }

            // Check idempotency key
            var idempotencyKey = Request.Headers["Idempotency-Key"].FirstOrDefault();
            _logger.LogInformation("🔑 Idempotency key: {IdempotencyKey}", idempotencyKey ?? "none");

            if (!string.IsNullOrEmpty(idempotencyKey))
            {
                var (existingProofId, existingResponse) = await _idempotencyRepo.TryGetAsync(idempotencyKey);
                if (!string.IsNullOrEmpty(existingProofId) && !string.IsNullOrEmpty(existingResponse))
                {
                    _logger.LogInformation("✅ Returning cached response for idempotency key: {IdemKey}", idempotencyKey);
                    var cachedResponse = JsonSerializer.Deserialize<CreateProofFromUrlResponse>(existingResponse);
                    return Ok(cachedResponse);
                }
            }

            // Canonicalize URL and check for existing proof
            _logger.LogInformation("🔍 Canonicalizing URL: {Url}", request.Url);
            var (platform, canonicalId) = _canonicalizer.Canonicalize(request.Url);
            _logger.LogInformation("📍 Canonicalized to platform: {Platform}, ID: {CanonicalId}", platform, canonicalId);

            var existingProofIdFromIndex = await _linkIndexRepo.TryGetProofIdAsync(platform.ToString(), canonicalId);

            if (!string.IsNullOrEmpty(existingProofIdFromIndex))
            {
                var existingProof = await _proofsRepo.GetByIdAsync(existingProofIdFromIndex);
                if (existingProof != null)
                {
                    _logger.LogInformation("Found existing proof for URL: {Url}, ProofId: {ProofId}", request.Url, existingProofIdFromIndex);

                    var existingResponse = new CreateProofFromUrlResponse(
                        ProofId: existingProof.Id,
                        TrustmarkId: existingProof.TrustmarkId,
                        VerifyUrl: $"/t/{existingProof.TrustmarkId}",
                        Deduped: true
                    );

                    // Cache response for idempotency
                    if (!string.IsNullOrEmpty(idempotencyKey))
                    {
                        await _idempotencyRepo.UpdateResultAsync(idempotencyKey, existingProof.Id, JsonSerializer.Serialize(existingResponse));
                    }

                    return Ok(existingResponse);
                }
            }

            // Create new proof
            _logger.LogInformation("🆕 Creating new proof for URL: {Url}", request.Url);
            var proofId = Guid.NewGuid().ToString("N");
            var trustmarkId = GenerateShortId();
            _logger.LogInformation("🆔 Generated ProofId: {ProofId}, TrustmarkId: {TrustmarkId}", proofId, trustmarkId);

            // Download and create asset
            _logger.LogInformation("📥 Downloading video from URL: {Url}", request.Url);
            var downloadedFilePath = await _downloader.DownloadAsync(request.Url);
            var fileInfo = new FileInfo(downloadedFilePath);
            _logger.LogInformation("✅ Download completed. File: {FilePath}, Size: {Size} bytes", downloadedFilePath, fileInfo.Length);

            // Calculate SHA256 hash
            var sha256 = await _hasher.Sha256Async(downloadedFilePath);
            _logger.LogInformation("🔐 SHA256 calculated: {Sha256}", sha256);

            // Check if asset already exists
            var existingAsset = await _assetsRepo.GetBySha256Async(sha256);
            string assetId;

            if (existingAsset != null)
            {
                _logger.LogInformation("♻️ Reusing existing asset: {AssetId}", existingAsset.AssetId);
                assetId = existingAsset.AssetId;
            }
            else
            {
                // Create new asset
                assetId = Guid.NewGuid().ToString("N");
                var asset = new Asset
                {
                    AssetId = assetId,
                    Sha256 = sha256,
                    MediaType = "video/mp4", // Default for downloaded videos
                    Bytes = fileInfo.Length,
                    DurationSec = null, // We don't have duration info from yt-dlp
                    Width = null, // We don't have dimensions info from yt-dlp
                    Height = null,
                    CreatedAt = DateTime.Now
                };
                await _assetsRepo.InsertAsync(asset);
                _logger.LogInformation("🆕 Created new asset: {AssetId}", assetId);
            }

            // Try hosted verifier first
            _logger.LogInformation("🔍 Starting C2PA verification for URL: {Url}", request.Url);
            var c2paResult = await _c2paVerifier.VerifyFromUrlAsync(request.Url);
            _logger.LogInformation("✅ C2PA verification completed. Manifest found: {ManifestFound}, Status: {Status}",
                c2paResult.ManifestFound, c2paResult.Status);

            // Create proof record
            var proof = new Proof
            {
                Id = proofId,
                TrustmarkId = trustmarkId,
                AssetId = assetId,
                C2paPresent = c2paResult.ManifestFound,
                C2paJson = c2paResult.RawJson,
                OriginStatus = c2paResult.Status ?? "not_found",
                PolicyResult = "pass", // Stub for now
                PolicyJson = "{}",
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            await _proofsRepo.InsertAsync(proof);

            // Create receipt
            var receiptData = new
            {
                proofId = proof.Id,
                trustmarkId = proof.TrustmarkId,
                url = request.Url,
                platform = platform.ToString(),
                canonicalId = canonicalId,
                c2paPresent = c2paResult.ManifestFound,
                originStatus = c2paResult.Status,
                policyResult = "pass",
                timestamp = DateTime.Now
            };

            var (signature, publicKey) = await _receiptSigner.SignReceiptAsync(receiptData);
            var receiptHash = Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(JsonSerializer.Serialize(receiptData))));

            var receipt = new Receipt
            {
                Id = Guid.NewGuid().ToString("N"),
                ProofId = proof.Id,
                Json = JsonSerializer.Serialize(receiptData),
                ReceiptHash = receiptHash,
                Signature = signature,
                SignerPubKey = publicKey,
                CreatedAt = DateTime.Now
            };

            await _receiptsRepo.InsertAsync(receipt);

            // Update proof with receipt ID
            proof.ReceiptId = receipt.Id;
            await _proofsRepo.InsertAsync(proof); // This will update the existing record

            // Add to link index
            await _linkIndexRepo.InsertAsync(platform.ToString(), canonicalId, proof.Id);

            var response = new CreateProofFromUrlResponse(
                ProofId: proof.Id,
                TrustmarkId: proof.TrustmarkId,
                VerifyUrl: $"/t/{proof.TrustmarkId}",
                Deduped: false
            );

            // Cache response for idempotency
            if (!string.IsNullOrEmpty(idempotencyKey))
            {
                await _idempotencyRepo.UpdateResultAsync(idempotencyKey, proof.Id, JsonSerializer.Serialize(response));
            }

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ Error creating proof from URL: {Url}", request?.Url);
            _logger.LogError("❌ Exception details: {ExceptionType}: {ExceptionMessage}", ex.GetType().Name, ex.Message);
            _logger.LogError("❌ Stack trace: {StackTrace}", ex.StackTrace);

            return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse<object>
            {
                Success = false,
                Message = $"Internal server error: {ex.Message}",
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }

    private string GenerateShortId()
    {
        // Generate a short, URL-safe ID using Guid (8 characters)
        // Using Guid ensures uniqueness
        return Guid.NewGuid().ToString("N").Substring(0, 8);
    }

    [HttpPost("proofs/file-upload")]
    [ProducesResponseType(typeof(CreateProofFromFileResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CreateProofFromFileResponse>> CreateProofFromFileUpload(
        [FromForm] CreateProofFromFileRequest request)
    {
        try
        {
            var file = Request.Form.Files.FirstOrDefault();
            if (file == null || file.Length == 0)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "File is required",
                    Status = StatusCodes.Status400BadRequest
                });
            }

            // Save temp file
            var tempPath = Path.GetTempFileName();
            using (var stream = new FileStream(tempPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            try
            {
                // Compute SHA256 hash
                var sha256 = await _hasher.Sha256Async(tempPath);

                // Check if asset already exists
                var existingAsset = await _assetsRepo.GetBySha256Async(sha256);
                string assetId;
                bool assetReused = false;

                if (existingAsset != null)
                {
                    assetId = existingAsset.AssetId;
                    assetReused = true;
                    _logger.LogInformation("Reusing existing asset for SHA256: {Sha256}", sha256);
                }
                else
                {
                    // Create new asset
                    assetId = Guid.NewGuid().ToString("N");
                    var asset = new Asset
                    {
                        AssetId = assetId,
                        Sha256 = sha256,
                        MediaType = file.ContentType,
                        Bytes = file.Length,
                        CreatedAt = DateTime.Now
                    };
                    await _assetsRepo.InsertAsync(asset);
                }

                // Parse C2PA data from the uploaded file
                var c2paResult = await _c2paLocalParser.ParseAsync(tempPath);
                _logger.LogInformation("C2PA parsing completed for file {FileName}: ManifestFound={ManifestFound}",
                    file.FileName, c2paResult.ManifestFound);

                // Create proof
                var proofId = Guid.NewGuid().ToString("N");
                var trustmarkId = GenerateShortId();

                var proof = new Proof
                {
                    Id = proofId,
                    TrustmarkId = trustmarkId,
                    AssetId = assetId,
                    C2paPresent = c2paResult.ManifestFound,
                    C2paJson = c2paResult.RawJson,
                    OriginStatus = c2paResult.ManifestFound ? "verified" : "not_found",
                    PolicyResult = "pass",
                    PolicyJson = "{}",
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.UtcNow
                };

                await _proofsRepo.InsertAsync(proof);

                // Create receipt
                var receiptData = new
                {
                    proofId = proof.Id,
                    trustmarkId = proof.TrustmarkId,
                    assetId = assetId,
                    sha256 = sha256,
                    fileName = file.FileName,
                    contentType = file.ContentType,
                    fileSize = file.Length,
                    likenessOwnerName = request.LikenessOwnerName,
                    consentEvidenceUrl = request.ConsentEvidenceUrl,
                    timestamp = DateTime.Now
                };

                var (signature, publicKey) = await _receiptSigner.SignReceiptAsync(receiptData);
                var receiptHash = Convert.ToHexString(System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(JsonSerializer.Serialize(receiptData))));

                var receipt = new Receipt
                {
                    Id = Guid.NewGuid().ToString("N"),
                    ProofId = proof.Id,
                    Json = JsonSerializer.Serialize(receiptData),
                    ReceiptHash = receiptHash,
                    Signature = signature,
                    SignerPubKey = publicKey,
                    CreatedAt = DateTime.Now
                };

                await _receiptsRepo.InsertAsync(receipt);

                // Update proof with receipt ID
                proof.ReceiptId = receipt.Id;
                await _proofsRepo.InsertAsync(proof);

                var response = new CreateProofFromFileResponse(
                    ProofId: proof.Id,
                    TrustmarkId: proof.TrustmarkId,
                    VerifyUrl: $"/t/{proof.TrustmarkId}",
                    AssetId: assetId,
                    AssetReused: assetReused,
                    C2pa: c2paResult.ManifestFound,
                    Origin: c2paResult.ManifestFound ? new OriginInfo(
                        C2pa: true,
                        Status: "verified",
                        ClaimGenerator: c2paResult.ClaimGenerator,
                        Issuer: c2paResult.Issuer,
                        Timestamp: c2paResult.ClaimedAt,
                        Sha256: sha256
                    ) : null
                );

                return Ok(response);
            }
            finally
            {
                // Clean up temp file
                if (System.IO.File.Exists(tempPath))
                {
                    System.IO.File.Delete(tempPath);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating proof from file");
            return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse<object>
            {
                Success = false,
                Message = "Internal server error",
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }

    [HttpGet("verify-trustmark/{trustmarkId}")]
    [ProducesResponseType(typeof(VerifyProofResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<VerifyProofResponse>> VerifyProofByTrustmark(string trustmarkId)
    {
        try
        {
            var proof = await _proofsRepo.GetByTrustmarkIdAsync(trustmarkId);
            if (proof == null)
            {
                return NotFound();
            }

            var receipt = await _receiptsRepo.GetByProofIdAsync(proof.Id);
            var asset = proof.AssetId != null ? await _assetsRepo.GetBySha256Async(proof.AssetId) : null;

            var response = new VerifyProofResponse(
                TrustmarkId: proof.TrustmarkId,
                Origin: new OriginInfo(
                    C2pa: proof.C2paPresent,
                    Status: proof.OriginStatus,
                    ClaimGenerator: ExtractClaimGenerator(proof.C2paJson),
                    Issuer: ExtractIssuer(proof.C2paJson),
                    Timestamp: ExtractTimestamp(proof.C2paJson),
                    Sha256: asset?.Sha256
                ),
                Policy: new PolicyInfo(
                    Result: proof.PolicyResult,
                    Details: ExtractPolicyDetails(proof.PolicyJson)
                ),
                Receipt: new ReceiptInfo(
                    PdfUrl: receipt?.PdfPath != null ? $"/receipts/{receipt.PdfPath}" : null,
                    Json: receipt?.Json != null ? JsonSerializer.Deserialize<object>(receipt.Json) : null,
                    Signature: receipt?.Signature,
                    SignerPubKey: receipt?.SignerPubKey
                ),
                CreatedAt: proof.CreatedAt
            );

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying proof: {TrustmarkId}", trustmarkId);
            return StatusCode(StatusCodes.Status500InternalServerError);
        }
    }

    /// <summary>
    /// DEV-ONLY: Sign an MP4 file with C2PA for testing purposes
    /// </summary>
    [HttpPost("dev/sign")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<object>> DevSignFile(IFormFile file)
    {
        try
        {
            // Guard: Only allow in Development with SyntheticSignTool enabled
            if (Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") != "Development" ||
                !_featureFlags.Value.SyntheticSignTool)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new ApiResponse<object>
                {
                    Success = false,
                    Message = "Dev signing is only available in Development mode with SyntheticSignTool enabled",
                    Status = StatusCodes.Status403Forbidden
                });
            }

            if (file == null || file.Length == 0)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "File is required",
                    Status = StatusCodes.Status400BadRequest
                });
            }

            // Validate file type (MP4 only for signing)
            if (file.ContentType != "video/mp4")
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Only MP4 files can be signed",
                    Status = StatusCodes.Status400BadRequest
                });
            }

            // Save uploaded file to temp location
            var tempInputPath = Path.GetTempFileName() + ".mp4";
            var tempOutputPath = Path.GetTempFileName() + "_signed.mp4";

            try
            {
                using (var stream = new FileStream(tempInputPath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // Sign the file
                var success = await _devC2paSigner.SignFileAsync(tempInputPath, tempOutputPath);

                if (!success)
                {
                    return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse<object>
                    {
                        Success = false,
                        Message = "Failed to sign file",
                        Status = StatusCodes.Status500InternalServerError
                    });
                }

                var fileInfo = new FileInfo(tempOutputPath);

                return Ok(new
                {
                    signedPath = tempOutputPath,
                    sizeBytes = fileInfo.Length,
                    message = "File signed successfully"
                });
            }
            finally
            {
                // Clean up temp input file
                if (System.IO.File.Exists(tempInputPath))
                {
                    System.IO.File.Delete(tempInputPath);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in dev sign endpoint");
            return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse<object>
            {
                Success = false,
                Message = "An error occurred while signing the file",
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }

    private string? ExtractClaimGenerator(string? c2paJson)
    {
        if (string.IsNullOrEmpty(c2paJson)) return null;
        try
        {
            var doc = JsonDocument.Parse(c2paJson);
            return doc.RootElement.GetProperty("claims")[0].GetProperty("generator").GetString();
        }
        catch
        {
            return null;
        }
    }

    private string? ExtractIssuer(string? c2paJson)
    {
        if (string.IsNullOrEmpty(c2paJson)) return null;
        try
        {
            var doc = JsonDocument.Parse(c2paJson);
            return doc.RootElement.GetProperty("signing").GetProperty("issuer").GetString();
        }
        catch
        {
            return null;
        }
    }

    private DateTime? ExtractTimestamp(string? c2paJson)
    {
        if (string.IsNullOrEmpty(c2paJson)) return null;
        try
        {
            var doc = JsonDocument.Parse(c2paJson);
            var timestampStr = doc.RootElement.GetProperty("claims")[0].GetProperty("timestamp").GetString();
            return DateTime.TryParse(timestampStr, out var timestamp) ? timestamp : null;
        }
        catch
        {
            return null;
        }
    }

    private object[] ExtractPolicyDetails(string? policyJson)
    {
        if (string.IsNullOrEmpty(policyJson)) return Array.Empty<object>();
        try
        {
            var doc = JsonDocument.Parse(policyJson);
            return doc.RootElement.EnumerateArray().Select(e => (object)e).ToArray();
        }
        catch
        {
            return Array.Empty<object>();
        }
    }

    [HttpPost("proofs")]
    [ProducesResponseType(typeof(CreateProofResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CreateProofResponseDto>> CreateProofFromUrlLegacy(
        [FromBody] CreateProofRequestDto request)
    {
        try
        {
            if (string.IsNullOrEmpty(request.Input?.Url))
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "URL is required",
                    Status = StatusCodes.Status400BadRequest
                });
            }

            if (string.IsNullOrEmpty(request.Declared?.Generator) ||
                string.IsNullOrEmpty(request.Declared?.License))
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Generator and license are required",
                    Status = StatusCodes.Status400BadRequest
                });
            }

            // Provide default prompt if empty
            var prompt = string.IsNullOrEmpty(request.Declared.Prompt)
                ? "Content verification request"
                : request.Declared.Prompt;

            _logger.LogInformation("Creating proof for URL: {Url}", request.Input.Url);

            // Use C2PA verifier for comprehensive verification
            var c2paResult = await _c2paVerifier.VerifyFromUrlAsync(request.Input.Url);

            // Create verification result based on C2PA findings
            var verificationRequest = new VerificationRequestDto
            {
                Url = request.Input.Url,
                Metadata = new VerificationMetadataDto
                {
                    Prompt = prompt,
                    ToolName = request.Declared.Generator,
                    License = ParseLicenseType(request.Declared.License)
                }
            };

            var result = await _verificationService.VerifyContentAsync(verificationRequest);

            // Enhance result with C2PA information
            result.Signature = result.Signature ?? "mock-signature";
            result.MimeType = "video/mp4"; // Default for video content
            result.Duration = result.Duration;
            result.Resolution = result.Resolution;

            // Log C2PA results for debugging
            _logger.LogInformation("C2PA verification completed: ManifestFound={ManifestFound}, Status={Status}",
                c2paResult.ManifestFound, c2paResult.Status);

            var response = new CreateProofResponseDto
            {
                ProofId = result.ProofId,
                VerifyUrl = $"http://localhost:4200/#/t/{result.ProofId}",
                BadgeUrl = $"http://localhost:5000/badges/{result.ProofId}.png"
            };

            _logger.LogInformation("Basic verification completed for URL: {Url}", request.Input.Url);

            return Ok(response);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid request for URL: {Url}", request.Input?.Url);
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = ex.Message,
                Status = StatusCodes.Status400BadRequest
            });
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "Network error processing URL: {Url}", request.Input?.Url);

            // Check if it's a 404 error specifically
            if (ex.Message.Contains("404") || ex.Message.Contains("Not Found"))
            {
                return StatusCode(StatusCodes.Status404NotFound, new ApiResponse<object>
                {
                    Success = false,
                    Message = "The provided URL was not found (404). Please check if the URL is correct and accessible.",
                    Status = StatusCodes.Status404NotFound
                });
            }

            return StatusCode(StatusCodes.Status502BadGateway, new ApiResponse<object>
            {
                Success = false,
                Message = "Unable to access the provided URL. Please check if the URL is valid and accessible.",
                Status = StatusCodes.Status502BadGateway
            });
        }
        catch (TimeoutException ex)
        {
            _logger.LogError(ex, "Timeout processing URL: {Url}", request.Input?.Url);
            return StatusCode(StatusCodes.Status408RequestTimeout, new ApiResponse<object>
            {
                Success = false,
                Message = "The request timed out. Please try again with a smaller file or different URL.",
                Status = StatusCodes.Status408RequestTimeout
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error creating proof from URL: {Url}", request.Input?.Url);
            return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse<object>
            {
                Success = false,
                Message = $"An unexpected error occurred: {ex.Message}",
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }

    [HttpPost("proofs/file")]
    [ProducesResponseType(typeof(CreateProofResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CreateProofResponseDto>> CreateProofFromFile(
        [FromForm] IFormFile file,
        [FromForm] string declared)
    {
        try
        {
            if (file == null)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "File is required",
                    Status = StatusCodes.Status400BadRequest
                });
            }

            // MIME type validation with feature flag support
            var allowedMimeTypes = new List<string> { "video/mp4", "video/avi", "video/mov", "video/webm" };

            // In Development with DevImageTestMode enabled, also allow images
            if (Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development" &&
                _featureFlags.Value.DevImageTestMode)
            {
                allowedMimeTypes.AddRange(new[] { "image/jpeg", "image/png" });
            }

            if (!allowedMimeTypes.Contains(file.ContentType))
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = $"Unsupported file type: {file.ContentType}. Allowed types: {string.Join(", ", allowedMimeTypes)}",
                    Status = StatusCodes.Status400BadRequest
                });
            }

            var declaredData = System.Text.Json.JsonSerializer.Deserialize<DeclaredDataDto>(declared);

            if (declaredData == null ||
                string.IsNullOrEmpty(declaredData.Generator) ||
                string.IsNullOrEmpty(declaredData.License))
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Declared data with generator and license is required",
                    Status = StatusCodes.Status400BadRequest
                });
            }

            // Provide default prompt if empty
            var prompt = string.IsNullOrEmpty(declaredData.Prompt)
                ? "Content verification request"
                : declaredData.Prompt;

            _logger.LogInformation("Creating proof for file: {FileName}", file.FileName);

            // Convert to internal format
            var verificationRequest = new VerificationRequestDto
            {
                File = file,
                Metadata = new VerificationMetadataDto
                {
                    Prompt = prompt,
                    ToolName = declaredData.Generator,
                    License = ParseLicenseType(declaredData.License)
                }
            };

            var result = await _verificationService.VerifyContentAsync(verificationRequest);

            var response = new CreateProofResponseDto
            {
                ProofId = result.ProofId,
                VerifyUrl = $"http://localhost:4200/#/t/{result.ProofId}",
                BadgeUrl = $"http://localhost:5000/badges/{result.ProofId}.png",
                DevTestMode = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development" &&
                             _featureFlags.Value.DevImageTestMode
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating proof from file");
            return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse<object>
            {
                Success = false,
                Message = "An error occurred while creating the proof",
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }

    /// <summary>
    /// Get real-time verification status for a verification ID (temporarily disabled)
    /// </summary>
    [HttpGet("verification-status/{verificationId}")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<object>> GetVerificationStatus(string verificationId)
    {
        try
        {
            // Mock status for now (C2PA services temporarily disabled)
            var mockStatus = new
            {
                CurrentStep = "Completed",
                Message = "Verification completed",
                IsCompleted = true,
                HasError = false,
                ErrorMessage = (string?)null,
                CompletedSteps = new Dictionary<string, bool>
                {
                    ["Platform Detection"] = true,
                    ["Hosted Verification"] = true,
                    ["Media Download"] = true,
                    ["Local Verification"] = true,
                    ["Hash Computation"] = true,
                    ["GARM Checks"] = true,
                    ["Receipt Generation"] = true
                }
            };
            return Ok(mockStatus);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting verification status for ID: {VerificationId}", verificationId);
            return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse<object>
            {
                Success = false,
                Message = "An error occurred while getting verification status",
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }

    /// <summary>
    /// TEST ENDPOINT: Get all proofs from database
    /// </summary>
    [HttpGet("proofs/test/all")]
    [ProducesResponseType(typeof(List<object>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<object>>> GetAllProofs()
    {
        try
        {
            var allProofs = await _verificationService.GetAllProofsAsync();
            var result = allProofs.Select(p => new
            {
                proofId = p.ProofId,
                contentHash = p.ContentHash,
                createdAt = p.Timestamp,
                metadata = new
                {
                    toolName = p.Metadata.ToolName,
                    prompt = p.Metadata.Prompt,
                    license = p.Metadata.License
                }
            }).ToList();

            _logger.LogInformation("Retrieved {Count} proofs from database", result.Count);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving all proofs");
            return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse<object>
            {
                Success = false,
                Message = $"Error retrieving proofs: {ex.Message}",
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }

    /// <summary>
    /// TEST ENDPOINT: Check database connection and count
    /// </summary>
    [HttpGet("proofs/test/stats")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<ActionResult<object>> GetDatabaseStats()
    {
        try
        {
            var allProofs = await _verificationService.GetAllProofsAsync();
            var stats = new
            {
                totalProofs = allProofs.Count,
                databaseType = "SQLite",
                timestamp = DateTime.Now,
                proofIds = allProofs.Select(p => p.ProofId).ToList()
            };

            _logger.LogInformation("Database stats: {TotalProofs} proofs", stats.totalProofs);
            return Ok(stats);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting database stats");
            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                error = ex.Message,
                stackTrace = ex.StackTrace
            });
        }
    }

    /// <summary>
    /// TEST ENDPOINT: Get all verification requests from the database.
    /// </summary>
    [HttpGet("proofs/test/requests")]
    [ProducesResponseType(typeof(List<object>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<object>>> GetAllVerificationRequests()
    {
        try
        {
            _logger.LogInformation("Fetching all verification requests");

            // Get the database context to query VerificationRequests directly
            var context = HttpContext.RequestServices.GetRequiredService<ApplicationDbContext>();
            var requests = await context.VerificationRequests
                .OrderByDescending(r => r.CreatedAt)
                .Take(10)
                .Select(r => new
                {
                    r.Id,
                    r.Url,
                    r.FileName,
                    r.FileSize,
                    r.ContentType,
                    r.Status,
                    r.ErrorMessage,
                    r.CreatedAt,
                    r.UpdatedAt,
                    r.ProofId
                })
                .ToListAsync();

            _logger.LogInformation("Found {Count} verification requests", requests.Count);
            return Ok(requests);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting verification requests");
            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                error = ex.Message,
                stackTrace = ex.StackTrace
            });
        }
    }

    /// <summary>
    /// TEST ENDPOINT: Create a simple proof without complex processing
    /// </summary>
    [HttpPost("proofs/test/simple")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<ActionResult<object>> CreateSimpleProof()
    {
        try
        {
            _logger.LogInformation("Creating simple test proof");

            // Create a simple proof directly
            var proof = new Domain.Entities.VerificationProof
            {
                Id = Guid.NewGuid(),
                ProofId = "TEST" + DateTime.Now.Ticks.ToString()[^8], // Last 8 digits
                ContentHash = "test-hash-" + DateTime.Now.Ticks,
                PerceptualHash = "test-perceptual-" + DateTime.Now.Ticks,
                Signature = "test-signature-" + DateTime.Now.Ticks,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now,
                IsDeleted = false,
                MetadataId = Guid.NewGuid(),
                Metadata = new Domain.Entities.VerificationMetadata
                {
                    Id = Guid.NewGuid(),
                    Prompt = "Test prompt",
                    ToolName = "Test Tool",
                    ToolVersion = "1.0",
                    License = Domain.Enums.LicenseType.CreatorOwned,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                }
            };

            // Use the repository directly to avoid complex service logic
            var repository = HttpContext.RequestServices.GetRequiredService<IVerificationRepository>();
            var createdProof = await repository.CreateAsync(proof);

            _logger.LogInformation("Simple test proof created: {ProofId}", createdProof.ProofId);

            return Ok(new
            {
                success = true,
                proofId = createdProof.ProofId,
                message = "Simple test proof created successfully"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating simple test proof");
            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                error = ex.Message,
                stackTrace = ex.StackTrace
            });
        }
    }

    [HttpGet("verify/{id}")]
    [ProducesResponseType(typeof(VerifyResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<VerifyResponseDto>> VerifyProof(string id)
    {
        try
        {
            _logger.LogInformation("Fetching verification details for: {Id}", id);

            // Try to get proof by trustmark ID first
            var proof = await _proofsRepo.GetByTrustmarkIdAsync(id);
            if (proof != null)
            {
                var asset = proof.AssetId != null ? await _assetsRepo.GetBySha256Async(proof.AssetId) : null;

                var response = new VerifyResponseDto
                {
                    ProofId = proof.Id,
                    Verdict = "green",
                    ContentHash = asset?.Sha256 ?? "unknown",
                    Mime = asset?.MediaType ?? "video/mp4",
                    Duration = null,
                    Resolution = null,
                    Declared = new DeclaredDataDto
                    {
                        Generator = ExtractClaimGenerator(proof.C2paJson) ?? "Unknown",
                        Prompt = "",
                        License = "creator-owned"
                    },
                    IssuedAt = proof.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    SignatureStatus = proof.C2paPresent ? "valid" : "invalid",
                    Origin = new OriginInfo(
                        C2pa: proof.C2paPresent,
                        Status: proof.OriginStatus,
                        ClaimGenerator: ExtractClaimGenerator(proof.C2paJson),
                        Issuer: ExtractIssuer(proof.C2paJson),
                        Timestamp: ExtractTimestamp(proof.C2paJson),
                        Sha256: asset?.Sha256
                    )
                };

                return Ok(response);
            }

            // Fallback to verification service for legacy proofs
            var result = await _verificationService.GetProofDetailsAsync(id);

            if (result == null)
            {
                return NotFound(new ApiResponse<object>
                {
                    Success = false,
                    Message = "Verification not found",
                    Status = StatusCodes.Status404NotFound
                });
            }

            var fallbackResponse = new VerifyResponseDto
            {
                ProofId = result.ProofId,
                Verdict = "green", // Mock verdict for POC
                ContentHash = result.ContentHash,
                Mime = "video/mp4", // Mock MIME type
                Duration = 120, // Mock duration
                Resolution = "1920x1080", // Mock resolution
                Declared = new DeclaredDataDto
                {
                    Generator = result.Metadata.ToolName ?? "Unknown",
                    Prompt = result.Metadata.Prompt ?? "",
                    License = result.Metadata.License.ToString().ToLower().Replace("owned", "-owned")
                },
                IssuedAt = result.Timestamp.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                SignatureStatus = result.IsValid ? "valid" : "invalid",
                Origin = new OriginInfo(
                    C2pa: false,
                    Status: "not_found",
                    ClaimGenerator: null,
                    Issuer: null,
                    Timestamp: null,
                    Sha256: result.ContentHash
                )
            };

            return Ok(fallbackResponse);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching verification details for {Id}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, new ApiResponse<object>
            {
                Success = false,
                Message = "An error occurred while fetching verification details",
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }

    private static HumanProof.Api.Domain.Enums.LicenseType ParseLicenseType(string license)
    {
        return license.ToLower() switch
        {
            "creator-owned" => HumanProof.Api.Domain.Enums.LicenseType.CreatorOwned,
            "brand-owned" => HumanProof.Api.Domain.Enums.LicenseType.BrandOwned,
            "public" => HumanProof.Api.Domain.Enums.LicenseType.Public,
            _ => HumanProof.Api.Domain.Enums.LicenseType.CreatorOwned
        };
    }
}

// DTOs for the new API format
public class CreateProofRequestDto
{
    public InputDataDto Input { get; set; } = null!;
    public DeclaredDataDto Declared { get; set; } = null!;
}

public class InputDataDto
{
    public string Url { get; set; } = string.Empty;
}

public class DeclaredDataDto
{
    public string Generator { get; set; } = string.Empty;
    public string Prompt { get; set; } = string.Empty;
    public string License { get; set; } = string.Empty;
}

public class CreateProofResponseDto
{
    public string ProofId { get; set; } = string.Empty;
    public string VerifyUrl { get; set; } = string.Empty;
    public string BadgeUrl { get; set; } = string.Empty;
    public bool DevTestMode { get; set; } = false;
}

public class VerifyResponseDto
{
    public string ProofId { get; set; } = string.Empty;
    public string Verdict { get; set; } = string.Empty;
    public string ContentHash { get; set; } = string.Empty;
    public string? Mime { get; set; }
    public int? Duration { get; set; }
    public string? Resolution { get; set; }
    public DeclaredDataDto Declared { get; set; } = null!;
    public string IssuedAt { get; set; } = string.Empty;
    public string SignatureStatus { get; set; } = string.Empty;
    public OriginInfo? Origin { get; set; }
}
