using HumanProof.Api.Application.Services;
using HumanProof.Api.Domain.Entities;
using HumanProof.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace HumanProof.Api.Infrastructure.Services;

/// <summary>
/// Implementation of settings service with in-memory caching for performance
/// </summary>
public class SettingsService : ISettingsService
{
    private readonly ApplicationDbContext _context;
    private readonly IMemoryCache _cache;
    private readonly ILogger<SettingsService> _logger;
    private const string CACHE_KEY_PREFIX = "Setting_";
    private static readonly TimeSpan CACHE_DURATION = TimeSpan.FromMinutes(5);

    public SettingsService(
        ApplicationDbContext context,
        IMemoryCache cache,
        ILogger<SettingsService> logger)
    {
        _context = context;
        _cache = cache;
        _logger = logger;
    }

    public async Task<string?> GetSettingAsync(string key)
    {
        if (string.IsNullOrWhiteSpace(key))
        {
            throw new ArgumentException("Key cannot be null or empty", nameof(key));
        }

        // Try to get from cache first
        var cacheKey = $"{CACHE_KEY_PREFIX}{key}";
        if (_cache.TryGetValue(cacheKey, out string? cachedValue))
        {
            _logger.LogDebug("Setting '{Key}' retrieved from cache", key);
            return cachedValue;
        }

        // Not in cache, fetch from database
        _logger.LogDebug("Setting '{Key}' not in cache, fetching from database", key);
        var setting = await _context.ServiceSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Key == key);

        var value = setting?.Value;

        // Cache the result (including null values to avoid repeated DB hits)
        _cache.Set(cacheKey, value, CACHE_DURATION);

        return value;
    }

    public async Task SetSettingAsync(string key, string value, string? updatedBy = null)
    {
        if (string.IsNullOrWhiteSpace(key))
        {
            throw new ArgumentException("Key cannot be null or empty", nameof(key));
        }

        if (value == null)
        {
            throw new ArgumentNullException(nameof(value));
        }

        _logger.LogInformation("Updating setting '{Key}' (UpdatedBy: {UpdatedBy})", key, updatedBy ?? "unknown");

        var setting = await _context.ServiceSettings.FindAsync(key);

        if (setting != null)
        {
            // Update existing setting
            setting.Value = value;
            setting.UpdatedAt = DateTime.UtcNow;
            setting.UpdatedBy = updatedBy;
        }
        else
        {
            // Create new setting
            setting = new ServiceSetting
            {
                Key = key,
                Value = value,
                UpdatedAt = DateTime.UtcNow,
                UpdatedBy = updatedBy
            };
            _context.ServiceSettings.Add(setting);
        }

        await _context.SaveChangesAsync();

        // Invalidate cache
        var cacheKey = $"{CACHE_KEY_PREFIX}{key}";
        _cache.Remove(cacheKey);

        _logger.LogInformation("Setting '{Key}' updated successfully", key);
    }

    public async Task<Dictionary<string, string>> GetAllSettingsAsync()
    {
        _logger.LogDebug("Fetching all settings from database");

        var settings = await _context.ServiceSettings
            .AsNoTracking()
            .ToDictionaryAsync(s => s.Key, s => s.Value);

        _logger.LogDebug("Retrieved {Count} settings", settings.Count);

        return settings;
    }
}

