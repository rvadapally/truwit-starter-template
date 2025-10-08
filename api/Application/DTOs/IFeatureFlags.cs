namespace HumanProof.Api.Application.DTOs;

/// <summary>
/// Interface for accessing feature flags
/// </summary>
public interface IFeatureFlags
{
    bool DevImageTestMode { get; }
    bool SyntheticSignTool { get; }
}
