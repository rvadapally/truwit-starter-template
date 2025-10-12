namespace HumanProof.Api.Application.DTOs;

/// <summary>
/// Feature flags configuration
/// </summary>
public class FeatureFlags
{
    public bool DevImageTestMode { get; set; } = false;
    public bool SyntheticSignTool { get; set; } = false;
}
