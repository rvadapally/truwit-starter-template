using System.Security.Cryptography;
using System.Text;

namespace HumanProof.Api.Application.Services;

/// <summary>
/// Service for creating Bitcoin-anchored timestamps via OpenTimestamps
/// </summary>
public interface IOpenTimestampsService
{
    /// <summary>
    /// Submit a hash to OpenTimestamps calendar servers for Bitcoin timestamping
    /// </summary>
    /// <param name="sha256Hash">32-byte SHA256 hash</param>
    /// <returns>OTS proof bytes (pending confirmation)</returns>
    Task<byte[]> StampHashAsync(byte[] sha256Hash);
    
    /// <summary>
    /// Submit content hash to OpenTimestamps
    /// </summary>
    /// <param name="contentHash">Hex-encoded SHA256 hash</param>
    /// <returns>OTS proof bytes</returns>
    Task<byte[]> StampAsync(string contentHash);
    
    /// <summary>
    /// Upgrade a pending OTS proof to include Bitcoin block attestation
    /// </summary>
    /// <param name="otsProof">Original OTS proof bytes</param>
    /// <returns>Upgraded OTS proof with Bitcoin attestation, or null if still pending</returns>
    Task<byte[]?> UpgradeAsync(byte[] otsProof);
}

public class OpenTimestampsService : IOpenTimestampsService
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<OpenTimestampsService> _logger;
    
    // Public OpenTimestamps calendar servers (free, no API key required)
    private static readonly string[] CalendarServers = new[]
    {
        "https://a.pool.opentimestamps.org",
        "https://b.pool.opentimestamps.org",
        "https://a.pool.eternitywall.com"
    };
    
    public OpenTimestampsService(HttpClient httpClient, ILogger<OpenTimestampsService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }
    
    public async Task<byte[]> StampHashAsync(byte[] sha256Hash)
    {
        if (sha256Hash == null || sha256Hash.Length != 32)
            throw new ArgumentException("Hash must be exactly 32 bytes (SHA256)", nameof(sha256Hash));
        
        var exceptions = new List<Exception>();
        
        // Try each calendar server
        foreach (var server in CalendarServers)
        {
            try
            {
                var url = $"{server}/digest";
                _logger.LogInformation("Submitting hash to OpenTimestamps: {Server}", server);
                
                var request = new HttpRequestMessage(HttpMethod.Post, url)
                {
                    Content = new ByteArrayContent(sha256Hash)
                };
                request.Content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("application/x-www-form-urlencoded");
                request.Headers.Accept.Add(new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/vnd.opentimestamps.v1"));
                
                var response = await _httpClient.SendAsync(request);
                
                if (response.IsSuccessStatusCode)
                {
                    var otsProof = await response.Content.ReadAsByteArrayAsync();
                    _logger.LogInformation("OpenTimestamps proof created: {Size} bytes from {Server}", otsProof.Length, server);
                    return otsProof;
                }
                
                _logger.LogWarning("OpenTimestamps server {Server} returned {StatusCode}", server, response.StatusCode);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to reach OpenTimestamps server {Server}", server);
                exceptions.Add(ex);
            }
        }
        
        throw new AggregateException("Failed to submit to any OpenTimestamps calendar server", exceptions);
    }
    
    public async Task<byte[]> StampAsync(string contentHash)
    {
        // Convert hex string to bytes
        var hashBytes = Convert.FromHexString(contentHash);
        return await StampHashAsync(hashBytes);
    }
    
    public async Task<byte[]?> UpgradeAsync(byte[] otsProof)
    {
        // Extract calendar URL from OTS proof and request upgrade
        // For now, return null (upgrade not yet implemented)
        // Full implementation would parse the OTS format and query calendar for Bitcoin attestation
        _logger.LogInformation("OTS upgrade requested, proof size: {Size} bytes", otsProof.Length);
        
        // TODO: Implement OTS proof parsing and upgrade
        // This requires understanding the OTS binary format
        // For MVP, we store the pending proof and users can verify via opentimestamps.org
        
        return null;
    }
}

/// <summary>
/// Extension methods for registering OpenTimestamps services
/// </summary>
public static class OpenTimestampsServiceExtensions
{
    public static IServiceCollection AddOpenTimestamps(this IServiceCollection services)
    {
        services.AddHttpClient<IOpenTimestampsService, OpenTimestampsService>(client =>
        {
            client.Timeout = TimeSpan.FromSeconds(30);
            client.DefaultRequestHeaders.UserAgent.ParseAdd("TruWit/1.0");
        });
        
        return services;
    }
}
