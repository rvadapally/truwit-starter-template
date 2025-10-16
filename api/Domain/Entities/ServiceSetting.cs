using System.ComponentModel.DataAnnotations;

namespace HumanProof.Api.Domain.Entities;

/// <summary>
/// Key-value store for application configuration and runtime settings
/// </summary>
public class ServiceSetting
{
    /// <summary>
    /// Setting key (e.g., "YOUTUBE_VERIFICATION_MODE")
    /// </summary>
    [Key]
    [Required]
    [MaxLength(255)]
    public string Key { get; set; } = string.Empty;

    /// <summary>
    /// Setting value
    /// </summary>
    [Required]
    public string Value { get; set; } = string.Empty;

    /// <summary>
    /// Timestamp when this setting was last updated
    /// </summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Optional identifier of who updated this setting (admin username, API key, etc.)
    /// </summary>
    [MaxLength(255)]
    public string? UpdatedBy { get; set; }
}

