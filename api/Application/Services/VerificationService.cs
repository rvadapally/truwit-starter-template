using HumanProof.Api.Application.DTOs;
using HumanProof.Api.Domain.Interfaces;
using HumanProof.Api.Domain.Entities;
using HumanProof.Api.Domain.Enums;
using HumanProof.Api.Infrastructure.Services;

namespace HumanProof.Api.Application.Services;

public interface IVerificationService
{
    Task<VerificationResultDto> VerifyContentAsync(VerificationRequestDto request);
    Task<ProofDetailsDto?> GetProofDetailsAsync(string proofId);
    Task<bool> ValidateProofAsync(string proofId);
    Task<List<ProofDetailsDto>> GetAllProofsAsync();
}

public class VerificationService : IVerificationService
{
    private readonly IProofService _proofService;
    private readonly IHashService _hashService;
    private readonly IFileService _fileService;
    private readonly IContentIngestService _contentIngestService;
    private readonly IMediaInfoService _mediaInfoService;
    private readonly IReceiptSigner _receiptSigner;
    private readonly IVerificationRepository _repository;
    private readonly ILogger<VerificationService> _logger;

    public VerificationService(
        IProofService proofService,
        IHashService hashService,
        IFileService fileService,
        IContentIngestService contentIngestService,
        IMediaInfoService mediaInfoService,
        IReceiptSigner receiptSigner,
        IVerificationRepository repository,
        ILogger<VerificationService> logger)
    {
        _proofService = proofService;
        _hashService = hashService;
        _fileService = fileService;
        _contentIngestService = contentIngestService;
        _mediaInfoService = mediaInfoService;
        _receiptSigner = receiptSigner;
        _repository = repository;
        _logger = logger;
    }

    public async Task<VerificationResultDto> VerifyContentAsync(VerificationRequestDto request)
    {
        try
        {
            _logger.LogInformation("Starting content verification for {RequestType}",
                request.File != null ? "file upload" : "URL");

            // Create VerificationRequest entry first
            var verificationRequest = new VerificationRequest
            {
                Id = Guid.NewGuid(),
                Url = request.Url,
                FileName = request.File?.FileName,
                FileSize = request.File?.Length,
                ContentType = request.File?.ContentType,
                Status = Domain.Enums.VerificationStatus.Processing,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            // Use ContentIngestService for real processing
            var ingestResult = request.File != null
                ? await _contentIngestService.ProcessFileAsync(request.File)
                : await _contentIngestService.ProcessUrlAsync(request.Url!);

            // Extract additional metadata if possible
            var mediaMetadata = await ExtractMediaMetadataAsync(ingestResult);

            // Create metadata first
            var metadata = new VerificationMetadata
            {
                Id = Guid.NewGuid(),
                Prompt = request.Metadata?.Prompt,
                ToolName = request.Metadata?.ToolName,
                ToolVersion = request.Metadata?.ToolVersion,
                LikenessConsent = request.Metadata?.LikenessConsent != null
                    ? string.Join(",", request.Metadata.LikenessConsent)
                    : null,
                License = request.Metadata?.License ?? LicenseType.CreatorOwned,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };

            // Create proof with all data
            var proof = new VerificationProof
            {
                Id = Guid.NewGuid(),
                ProofId = await _proofService.GenerateProofIdAsync(),
                ContentHash = ingestResult.ContentHash,
                PerceptualHash = ingestResult.PerceptualHash,
                MetadataId = metadata.Id,
                Metadata = metadata,
                Signature = await _hashService.GenerateSignatureAsync(ingestResult.ContentHash),
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now,
                IsDeleted = false
            };

            // Update VerificationRequest with proof reference
            verificationRequest.ProofId = proof.Id;
            verificationRequest.Status = Domain.Enums.VerificationStatus.Completed;
            verificationRequest.UpdatedAt = DateTime.Now;

            // Save the complete proof to repository
            await _repository.CreateAsync(proof);

            // Save the verification request to repository
            await _repository.CreateVerificationRequestAsync(verificationRequest);

            _logger.LogInformation("Content verification completed successfully for proof {ProofId}",
                proof.ProofId);

            // Create verification result
            var verificationResult = new VerificationResultDto
            {
                ProofId = proof.ProofId,
                ContentHash = proof.ContentHash,
                PerceptualHash = proof.PerceptualHash,
                Metadata = new VerificationMetadataDto
                {
                    Prompt = metadata.Prompt,
                    ToolName = metadata.ToolName,
                    ToolVersion = metadata.ToolVersion,
                    LikenessConsent = metadata.LikenessConsent?.Split(','),
                    License = metadata.License
                },
                Timestamp = proof.CreatedAt,
                VerificationUrl = $"/verify/{proof.ProofId}",
                BadgeUrl = $"/badge/{proof.ProofId}",
                QrCodeUrl = $"/qr/{proof.ProofId}",
                Duration = mediaMetadata?.Duration,
                Resolution = mediaMetadata?.Resolution,
                MimeType = ingestResult.MimeType
            };

            // Sign the receipt
            var (signature, publicKey) = await _receiptSigner.SignReceiptAsync(verificationResult);
            verificationResult.Signature = signature;

            return verificationResult;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during content verification");
            throw;
        }
    }

    private async Task<MediaMetadata?> ExtractMediaMetadataAsync(ContentIngestResult ingestResult)
    {
        try
        {
            // Try to extract metadata using MediaInfoService
            if (ingestResult.SourceUrl != null)
            {
                // For URLs, we'd need to download the file first
                // For now, return basic metadata from ingest result
                return new MediaMetadata
                {
                    Duration = ingestResult.Duration,
                    Resolution = ingestResult.Resolution
                };
            }

            return null;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not extract media metadata");
            return null;
        }
    }

    public async Task<ProofDetailsDto?> GetProofDetailsAsync(string proofId)
    {
        var proof = await _repository.GetByProofIdAsync(proofId);
        if (proof == null)
            return null;

        return new ProofDetailsDto
        {
            ProofId = proof.ProofId,
            ContentHash = proof.ContentHash,
            PerceptualHash = proof.PerceptualHash,
            Metadata = new VerificationMetadataDto
            {
                Prompt = proof.Metadata.Prompt,
                ToolName = proof.Metadata.ToolName,
                ToolVersion = proof.Metadata.ToolVersion,
                LikenessConsent = proof.Metadata.LikenessConsent?.Split(','),
                License = proof.Metadata.License
            },
            Timestamp = proof.CreatedAt,
            Signature = proof.Signature,
            IsValid = await ValidateProofAsync(proofId)
        };
    }

    public async Task<bool> ValidateProofAsync(string proofId)
    {
        var proof = await _repository.GetByProofIdAsync(proofId);
        if (proof == null)
            return false;

        return await _hashService.VerifySignatureAsync(proof.ContentHash, proof.Signature);
    }

    public async Task<List<ProofDetailsDto>> GetAllProofsAsync()
    {
        var allProofs = await _repository.GetAllAsync(1, 1000); // Get first 1000 proofs
        return allProofs.Select(proof => new ProofDetailsDto
        {
            ProofId = proof.ProofId,
            ContentHash = proof.ContentHash,
            PerceptualHash = proof.PerceptualHash,
            Metadata = new VerificationMetadataDto
            {
                Prompt = proof.Metadata.Prompt,
                ToolName = proof.Metadata.ToolName,
                ToolVersion = proof.Metadata.ToolVersion,
                LikenessConsent = proof.Metadata.LikenessConsent?.Split(','),
                License = proof.Metadata.License
            },
            Timestamp = proof.CreatedAt,
            Signature = proof.Signature,
            IsValid = true
        }).ToList();
    }
}
