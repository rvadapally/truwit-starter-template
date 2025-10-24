using HumanProof.Api.Application.Services;
using HumanProof.Api.Domain.Exceptions;
using Microsoft.AspNetCore.Mvc;

namespace HumanProof.Api.Controllers;

/// <summary>
/// Admin endpoints for managing application settings
/// </summary>
[ApiController]
[Route("v1/admin")]
public class AdminController : ControllerBase
{
    private readonly ISettingsService _settingsService;
    private readonly ILogger<AdminController> _logger;

    public AdminController(
        ISettingsService settingsService,
        ILogger<AdminController> logger)
    {
        _settingsService = settingsService;
        _logger = logger;
    }

    /// <summary>
    /// Get all settings
    /// </summary>
    [HttpGet("settings")]
    [ProducesResponseType(typeof(Dictionary<string, string>), StatusCodes.Status200OK)]
    public async Task<ActionResult<Dictionary<string, string>>> GetSettings()
    {
        _logger.LogInformation("Admin: Getting all settings");
        var settings = await _settingsService.GetAllSettingsAsync();
        return Ok(settings);
    }

    /// <summary>
    /// Get a specific setting by key
    /// </summary>
    [HttpGet("settings/{key}")]
    [ProducesResponseType(typeof(string), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<string>> GetSetting(string key)
    {
        _logger.LogInformation("Admin: Getting setting '{Key}'", key);
        
        var value = await _settingsService.GetSettingAsync(key);
        
        if (value == null)
        {
            return NotFound(new { message = $"Setting '{key}' not found" });
        }

        return Ok(value);
    }

    /// <summary>
    /// Set or update a setting
    /// </summary>
    [HttpPut("settings/{key}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult> SetSetting(string key, [FromBody] SetSettingRequest request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.Value))
        {
            return BadRequest(new { message = "Value is required" });
        }

        // Validate specific settings
        if (key == "YOUTUBE_VERIFICATION_MODE")
        {
            if (request.Value != "thumbnail" && request.Value != "full_video")
            {
                return BadRequest(new { message = "YOUTUBE_VERIFICATION_MODE must be 'thumbnail' or 'full_video'" });
            }
        }

        _logger.LogInformation("Admin: Setting '{Key}' to '{Value}' (UpdatedBy: {UpdatedBy})",
            key, request.Value, request.UpdatedBy ?? "unknown");

        await _settingsService.SetSettingAsync(key, request.Value, request.UpdatedBy);

        return Ok(new { message = $"Setting '{key}' updated successfully", key, value = request.Value });
    }

    // YouTube cookies test removed for MVP (thumbnail-only)
}

/// <summary>
/// Request to set a setting value
/// </summary>
public class SetSettingRequest
{
    /// <summary>
    /// The new value for the setting
    /// </summary>
    public string Value { get; set; } = string.Empty;

    /// <summary>
    /// Optional identifier of who is making this change
    /// </summary>
    public string? UpdatedBy { get; set; }
}

/// <summary>
/// Result of testing YouTube cookies
/// </summary>
public class TestCookiesResult
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? TestVideoId { get; set; }
    public double? Duration { get; set; }
    public string? Error { get; set; }
}

