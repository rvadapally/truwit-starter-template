using System.ComponentModel.DataAnnotations;
using HumanProof.Api.Domain.Enums;

namespace HumanProof.Api.Application.DTOs;

public class VerificationRequestDto
{
    public string? Url { get; set; }
    public IFormFile? File { get; set; }
    public VerificationMetadataDto? Metadata { get; set; }
}

public class VerificationMetadataDto
{
    public string? Prompt { get; set; }
    public string? ToolName { get; set; }
    public string? ToolVersion { get; set; }
    public string[]? LikenessConsent { get; set; }
    public LicenseType License { get; set; }
}

public class VerificationResultDto
{
    public string ProofId { get; set; } = string.Empty;
    public string ContentHash { get; set; } = string.Empty;
    public string PerceptualHash { get; set; } = string.Empty;
    public VerificationMetadataDto Metadata { get; set; } = null!;
    public DateTime Timestamp { get; set; }
    public string VerificationUrl { get; set; } = string.Empty;
    public string BadgeUrl { get; set; } = string.Empty;
    public string? QrCodeUrl { get; set; }
    public string Signature { get; set; } = string.Empty;
    public int? Duration { get; set; }
    public string? Resolution { get; set; }
    public string? MimeType { get; set; }
}

public class ProofDetailsDto
{
    public string ProofId { get; set; } = string.Empty;
    public string ContentHash { get; set; } = string.Empty;
    public string PerceptualHash { get; set; } = string.Empty;
    public VerificationMetadataDto Metadata { get; set; } = null!;
    public DateTime Timestamp { get; set; }
    public string Signature { get; set; } = string.Empty;
    public bool IsValid { get; set; }
}

public class ApiResponse<T>
{
    public T Data { get; set; } = default!;
    public string Message { get; set; } = string.Empty;
    public int Status { get; set; }
    public bool Success { get; set; }
}

public class PaginationParams
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? SortBy { get; set; }
    public string? SortOrder { get; set; } = "asc";
}

public class PagedResult<T>
{
    public IEnumerable<T> Items { get; set; } = Enumerable.Empty<T>();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}

public class ErrorResponse
{
    public string Error { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public int StatusCode { get; set; }
    public DateTime Timestamp { get; set; }
}
