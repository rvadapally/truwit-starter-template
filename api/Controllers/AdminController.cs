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
    private readonly IYouTubeVideoHasher _youtubeHasher;
    private readonly ILogger<AdminController> _logger;

    public AdminController(
        ISettingsService settingsService,
        IYouTubeVideoHasher youtubeHasher,
        ILogger<AdminController> logger)
    {
        _settingsService = settingsService;
        _youtubeHasher = youtubeHasher;
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

    /// <summary>
    /// Test if YouTube cookies are valid by attempting to get duration of a public video
    /// </summary>
    [HttpPost("youtube/test-cookies")]
    [ProducesResponseType(typeof(TestCookiesResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<TestCookiesResult>> TestYouTubeCookies()
    {
        _logger.LogInformation("Admin: Testing YouTube cookies");

        // Use a known public YouTube video for testing (Rick Astley - Never Gonna Give You Up)
        const string TEST_VIDEO_ID = "dQw4w9WgXcQ";

        try
        {
            // Just try to get the duration - this will validate cookies without downloading
            var result = await _youtubeHasher.HashVideoAsync(TEST_VIDEO_ID);
            
            // If we got here, cookies work
            _logger.LogInformation("✅ YouTube cookies test passed");
            
            return Ok(new TestCookiesResult
            {
                Success = true,
                Message = "Cookies are valid and working",
                TestVideoId = TEST_VIDEO_ID,
                Duration = result.DurationSeconds
            });
        }
        catch (YouTubeCookieException ex)
        {
            _logger.LogWarning(ex, "❌ YouTube cookies test failed - authentication error");
            
            return Ok(new TestCookiesResult
            {
                Success = false,
                Message = "Cookies are invalid or expired",
                Error = ex.Message
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ YouTube cookies test failed - unexpected error");
            
            return Ok(new TestCookiesResult
            {
                Success = false,
                Message = "Test failed with unexpected error",
                Error = ex.Message
            });
        }
    }
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

