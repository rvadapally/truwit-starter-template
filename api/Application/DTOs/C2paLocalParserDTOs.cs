using System.Text.Json;

namespace HumanProof.Api.Application.DTOs;

/// <summary>
/// Result of C2PA local file parsing
/// </summary>
public class C2paLocalParseResult
{
    public bool ManifestFound { get; set; }
    public string? ClaimGenerator { get; set; }
    public string? Issuer { get; set; }
    public DateTime? ClaimedAt { get; set; }
    public List<C2paLocalAssertion> Assertions { get; set; } = new();
    public string? RawJson { get; set; }
}

/// <summary>
/// C2PA assertion information for local parsing
/// </summary>
public class C2paLocalAssertion
{
    public string Label { get; set; } = string.Empty;
    public string Data { get; set; } = string.Empty;
}

/// <summary>
/// Interface for parsing C2PA data from local files
/// </summary>
public interface IC2paLocalParser
{
    Task<C2paLocalParseResult> ParseAsync(string filePath);
}
