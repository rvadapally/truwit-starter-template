namespace HumanProof.Api.Application.Services;

/// <summary>
/// Service for managing application settings stored in the database
/// </summary>
public interface ISettingsService
{
    /// <summary>
    /// Get a setting value by key
    /// </summary>
    /// <param name="key">Setting key (e.g., "YOUTUBE_VERIFICATION_MODE")</param>
    /// <returns>Setting value or null if not found</returns>
    Task<string?> GetSettingAsync(string key);

    /// <summary>
    /// Set or update a setting value
    /// </summary>
    /// <param name="key">Setting key</param>
    /// <param name="value">Setting value</param>
    /// <param name="updatedBy">Optional identifier of who updated this setting</param>
    Task SetSettingAsync(string key, string value, string? updatedBy = null);

    /// <summary>
    /// Get all settings as a dictionary
    /// </summary>
    /// <returns>Dictionary of all settings</returns>
    Task<Dictionary<string, string>> GetAllSettingsAsync();
}

