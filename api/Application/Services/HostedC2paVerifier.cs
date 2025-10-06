using System.Text.Json;
using System.Text.Json.Nodes;
using HumanProof.Api.Application.DTOs;
using Microsoft.Extensions.Options;

namespace HumanProof.Api.Application.Services;

/// <summary>
/// Hosted C2PA verification service (fast path)
/// </summary>
public sealed class HostedC2paVerifier : IHostedC2paVerifier
{
    private readonly HttpClient _httpClient;
    private readonly C2paOptions _options;
    private readonly ILogger<HostedC2paVerifier> _logger;

    public HostedC2paVerifier(
        HttpClient httpClient, 
        IOptions<C2paOptions> options,
        ILogger<HostedC2paVerifier> logger)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _logger = logger;
        
        _httpClient.Timeout = TimeSpan.FromSeconds(_options.RequestTimeoutSeconds);
    }

    public async Task<(bool ok, C2paCheckResult? result)> TryVerifyAsync(string url, CancellationToken ct = default)
    {
        try
        {
            _logger.LogInformation("Attempting hosted verification for URL: {Url}", url);

            var payload = JsonContent.Create(new { url });
            using var response = await _httpClient.PostAsync($"{_options.HostedVerifierBaseUrl.TrimEnd('/')}/verify", payload, ct);
            
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Hosted verifier returned {StatusCode} for URL: {Url}", response.StatusCode, url);
                return (false, null);
            }

            var json = await response.Content.ReadAsStringAsync(ct);
            var doc = JsonNode.Parse(json);

            if (doc == null)
            {
                _logger.LogWarning("Hosted verifier returned invalid JSON for URL: {Url}", url);
                return (false, null);
            }

            var verified = doc["verified"]?.GetValue<bool>() ?? false;
            if (!verified)
            {
                _logger.LogInformation("No C2PA manifest found via hosted verifier for URL: {Url}", url);
                return (true, new C2paCheckResult(
                    ManifestFound: false,
                    Status: "not_found",
                    ClaimGenerator: null,
                    ClaimTimestamp: null,
                    Assertions: Array.Empty<C2paAssertion>(),
                    SigningIssuer: null,
                    RawJson: json,
                    MediaSha256: null,
                    Notes: "Hosted verifier - no manifest found"
                ));
            }

            // Parse verified manifest
            var issuer = doc["signing"]?["issuer"]?.GetValue<string>();
            var generator = doc["claims"]?.AsArray()?.FirstOrDefault()?["generator"]?.GetValue<string>();
            var timestampStr = doc["claims"]?.AsArray()?.FirstOrDefault()?["timestamp"]?.GetValue<string>();

            var assertions = new List<C2paAssertion>();
            if (doc["claims"] is JsonArray claims)
            {
                foreach (var claim in claims)
                {
                    var label = claim?["label"]?.GetValue<string>();
                    var value = claim?["value"]?.ToJsonString();
                    if (!string.IsNullOrWhiteSpace(label))
                    {
                        assertions.Add(new C2paAssertion(label!, value));
                    }
                }
            }

            DateTimeOffset? timestamp = null;
            if (!string.IsNullOrEmpty(timestampStr) && DateTimeOffset.TryParse(timestampStr, out var parsed))
            {
                timestamp = parsed;
            }

            var result = new C2paCheckResult(
                ManifestFound: true,
                Status: "verified",
                ClaimGenerator: generator,
                ClaimTimestamp: timestamp,
                Assertions: assertions,
                SigningIssuer: issuer,
                RawJson: json,
                MediaSha256: null,
                Notes: "Hosted verifier - manifest verified"
            );

            _logger.LogInformation("C2PA manifest verified via hosted verifier for URL: {Url}, Generator: {Generator}", url, generator);
            return (true, result);
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(ex, "Network error during hosted verification for URL: {Url}", url);
            return (false, null);
        }
        catch (TaskCanceledException ex) when (ex.InnerException is TimeoutException)
        {
            _logger.LogWarning("Hosted verification timed out for URL: {Url}", url);
            return (false, null);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during hosted verification for URL: {Url}", url);
            return (false, null);
        }
    }
}
