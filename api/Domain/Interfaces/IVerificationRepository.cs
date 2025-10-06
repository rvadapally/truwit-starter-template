using HumanProof.Api.Domain.Entities;

namespace HumanProof.Api.Domain.Interfaces;

public interface IVerificationRepository
{
    Task<VerificationProof?> GetByProofIdAsync(string proofId);
    Task<VerificationProof?> GetByIdAsync(Guid id);
    Task<IEnumerable<VerificationProof>> GetAllAsync(int page, int pageSize);
    Task<VerificationProof> CreateAsync(VerificationProof proof);
    Task<VerificationProof> UpdateAsync(VerificationProof proof);
    Task DeleteAsync(Guid id);
    Task<bool> ExistsAsync(string proofId);
    Task<VerificationRequest> CreateVerificationRequestAsync(VerificationRequest request);
}

public interface IHashService
{
    Task<string> ComputeContentHashAsync(Stream content);
    Task<string> ComputePerceptualHashAsync(Stream content);
    Task<string> GenerateSignatureAsync(string content);
    Task<bool> VerifySignatureAsync(string content, string signature);
}

public interface IFileService
{
    Task<Stream> DownloadFromUrlAsync(string url);
    Task<string> SaveFileAsync(Stream content, string fileName);
    Task<Stream> GetFileAsync(string fileName);
    Task DeleteFileAsync(string fileName);
    Task<bool> IsValidVideoFileAsync(string fileName);
    Task<bool> IsValidImageFileAsync(string fileName);
}

public interface IProofService
{
    Task<string> GenerateProofIdAsync();
    Task<VerificationProof> CreateProofAsync(VerificationRequest request);
    Task<VerificationProof?> GetProofAsync(string proofId);
    Task<bool> ValidateProofAsync(string proofId);
}
