using System.Diagnostics;
using System.Text.Json;
using HumanProof.Api.Application.DTOs;
using HumanProof.Api.Infrastructure.Services;
using Microsoft.Extensions.Options;

namespace HumanProof.Api.Application.Services;

/// <summary>
/// Service for parsing C2PA data from local files using c2patool
/// </summary>
public class C2paLocalParser : IC2paLocalParser
{
    private readonly IProcessRunner _processRunner;
    private readonly C2paToolOptions _options;
    private readonly ILogger<C2paLocalParser> _logger;

    public C2paLocalParser(
        IProcessRunner processRunner,
        IOptions<C2paToolOptions> options,
        ILogger<C2paLocalParser> logger)
    {
        _processRunner = processRunner;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<C2paLocalParseResult> ParseAsync(string filePath)
    {
        try
        {
            _logger.LogInformation("Parsing C2PA data from file: {FilePath}", filePath);

            if (!File.Exists(filePath))
            {
                _logger.LogWarning("File does not exist: {FilePath}", filePath);
                return new C2paLocalParseResult { ManifestFound = false };
            }

            // Run c2patool with --info flag (no --json for this version)
            var arguments = $"\"{filePath}\" --info";
            var (exitCode, output, error) = await _processRunner.RunAsync(_options.Bin, arguments, _options.TimeoutSeconds * 1000);

            if (exitCode != 0)
            {
                _logger.LogWarning("c2patool failed for file {FilePath}: {Error}", filePath, error);
                return new C2paLocalParseResult { ManifestFound = false };
            }

            // Parse the JSON output
            var parseResult = ParseC2paJson(output);
            parseResult.RawJson = output;

            _logger.LogInformation("C2PA parsing completed for {FilePath}: ManifestFound={ManifestFound}",
                filePath, parseResult.ManifestFound);

            return parseResult;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error parsing C2PA data from file: {FilePath}", filePath);
            return new C2paLocalParseResult { ManifestFound = false };
        }
    }

    private C2paLocalParseResult ParseC2paJson(string json)
    {
        var result = new C2paLocalParseResult();

        try
        {
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            // Check if manifests exist
            if (root.TryGetProperty("manifests", out var manifests) && manifests.ValueKind == JsonValueKind.Array)
            {
                result.ManifestFound = manifests.GetArrayLength() > 0;

                if (result.ManifestFound && manifests.GetArrayLength() > 0)
                {
                    var firstManifest = manifests[0];

                    // Extract claim generator
                    if (firstManifest.TryGetProperty("claims", out var claims) &&
                        claims.ValueKind == JsonValueKind.Array &&
                        claims.GetArrayLength() > 0)
                    {
                        var firstClaim = claims[0];
                        if (firstClaim.TryGetProperty("generator", out var generator))
                        {
                            result.ClaimGenerator = generator.GetString();
                        }

                        if (firstClaim.TryGetProperty("timestamp", out var timestamp))
                        {
                            if (DateTime.TryParse(timestamp.GetString(), out var parsedTimestamp))
                            {
                                result.ClaimedAt = parsedTimestamp;
                            }
                        }
                    }

                    // Extract issuer
                    if (firstManifest.TryGetProperty("signing", out var signing))
                    {
                        if (signing.TryGetProperty("issuer", out var issuer))
                        {
                            result.Issuer = issuer.GetString();
                        }
                    }

                    // Extract assertions
                    if (firstManifest.TryGetProperty("assertions", out var assertions) &&
                        assertions.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var assertion in assertions.EnumerateArray())
                        {
                            var c2paAssertion = new C2paLocalAssertion();

                            if (assertion.TryGetProperty("label", out var label))
                            {
                                c2paAssertion.Label = label.GetString() ?? string.Empty;
                            }

                            if (assertion.TryGetProperty("data", out var data))
                            {
                                c2paAssertion.Data = data.GetRawText();
                            }

                            result.Assertions.Add(c2paAssertion);
                        }
                    }
                }
            }
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "Failed to parse C2PA JSON: {Json}", json);
            result.ManifestFound = false;
        }

        return result;
    }
}
