using System.Text.Json;
using System.Text.Json.Nodes;
using HumanProof.Api.Application.DTOs;
using Microsoft.Extensions.Options;

namespace HumanProof.Api.Application.Services;

/// <summary>
/// C2PA tool runner for local verification
/// </summary>
public sealed class C2paToolRunner : IC2paToolRunner
{
    private readonly IProcessRunner _processRunner;
    private readonly C2paToolOptions _options;
    private readonly ILogger<C2paToolRunner> _logger;

    public C2paToolRunner(
        IProcessRunner processRunner,
        IOptions<C2paToolOptions> options,
        ILogger<C2paToolRunner> logger)
    {
        _processRunner = processRunner;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<(bool ok, string json)> GetInfoJsonAsync(string mediaPath, CancellationToken ct = default)
    {
        try
        {
            _logger.LogInformation("Running c2patool on file: {MediaPath}", mediaPath);

            if (!File.Exists(mediaPath))
            {
                _logger.LogError("Media file not found: {MediaPath}", mediaPath);
                return (false, "File not found");
            }

            var args = $"\"{mediaPath}\" --info --json";
            
            _logger.LogDebug("Running c2patool with args: {Args}", args);

            var (exitCode, stdout, stderr) = await _processRunner.RunAsync(
                _options.Bin,
                args,
                _options.TimeoutSeconds,
                ct);

            if (exitCode != 0)
            {
                _logger.LogWarning("c2patool failed with exit code {ExitCode}. Stderr: {Stderr}", exitCode, stderr);
                return (false, stderr);
            }

            // Validate JSON output
            try
            {
                JsonDocument.Parse(stdout);
                _logger.LogInformation("c2patool completed successfully for file: {MediaPath}", mediaPath);
                return (true, stdout);
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "c2patool returned invalid JSON for file: {MediaPath}", mediaPath);
                return (false, $"Invalid JSON output: {ex.Message}");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error running c2patool on file: {MediaPath}", mediaPath);
            return (false, $"Tool execution error: {ex.Message}");
        }
    }
}

/// <summary>
/// C2PA JSON parser utilities
/// </summary>
public static class C2paParsers
{
    public static C2paCheckResult ParseC2paToolJson(string json)
    {
        try
        {
            var root = JsonNode.Parse(json);
            if (root == null)
            {
                return new C2paCheckResult(
                    ManifestFound: false,
                    Status: "error",
                    ClaimGenerator: null,
                    ClaimTimestamp: null,
                    Assertions: Array.Empty<C2paAssertion>(),
                    SigningIssuer: null,
                    RawJson: json,
                    MediaSha256: null,
                    Notes: "Invalid JSON"
                );
            }

            var manifests = root["manifests"] as JsonArray;
            var found = manifests != null && manifests.Count > 0;

            if (!found)
            {
                return new C2paCheckResult(
                    ManifestFound: false,
                    Status: "not_found",
                    ClaimGenerator: null,
                    ClaimTimestamp: null,
                    Assertions: Array.Empty<C2paAssertion>(),
                    SigningIssuer: null,
                    RawJson: json,
                    MediaSha256: null,
                    Notes: "No manifests found"
                );
            }

            var manifest = manifests![0]!;
            var generator = manifest["claim_generator"]?.GetValue<string>();
            var timestampStr = manifest["claimed_at"]?.GetValue<string>();
            var issuer = manifest["signature"]?["issuer"]?.GetValue<string>();

            var assertions = new List<C2paAssertion>();
            if (manifest["assertions"] is JsonArray assertionArray)
            {
                foreach (var assertion in assertionArray)
                {
                    var label = assertion?["label"]?.GetValue<string>();
                    var data = assertion?["data"]?.ToJsonString();
                    if (!string.IsNullOrWhiteSpace(label))
                    {
                        assertions.Add(new C2paAssertion(label!, data));
                    }
                }
            }

            DateTimeOffset? timestamp = null;
            if (!string.IsNullOrEmpty(timestampStr) && DateTimeOffset.TryParse(timestampStr, out var parsed))
            {
                timestamp = parsed;
            }

            return new C2paCheckResult(
                ManifestFound: true,
                Status: "verified",
                ClaimGenerator: generator,
                ClaimTimestamp: timestamp,
                Assertions: assertions,
                SigningIssuer: issuer,
                RawJson: json,
                MediaSha256: null,
                Notes: "c2patool verification"
            );
        }
        catch (Exception ex)
        {
            return new C2paCheckResult(
                ManifestFound: false,
                Status: "error",
                ClaimGenerator: null,
                ClaimTimestamp: null,
                Assertions: Array.Empty<C2paAssertion>(),
                SigningIssuer: null,
                RawJson: json,
                MediaSha256: null,
                Notes: $"Parse error: {ex.Message}"
            );
        }
    }
}
