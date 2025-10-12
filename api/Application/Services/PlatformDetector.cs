using HumanProof.Api.Application.DTOs;

namespace HumanProof.Api.Application.Services;

/// <summary>
/// Platform detection service that wraps URL canonicalization
/// </summary>
public class PlatformDetector : IPlatformDetector
{
    private readonly IUrlCanonicalizer _canonicalizer;

    public PlatformDetector(IUrlCanonicalizer canonicalizer)
    {
        _canonicalizer = canonicalizer;
    }

    public MediaPlatform Detect(string url)
    {
        var (platform, _) = _canonicalizer.Canonicalize(url);
        return platform;
    }
}