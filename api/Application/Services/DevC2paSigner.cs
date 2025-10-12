using HumanProof.Api.Application.DTOs;
using HumanProof.Api.Infrastructure.Services;
using Microsoft.Extensions.Options;

namespace HumanProof.Api.Application.Services;

/// <summary>
/// Development-only C2PA signer for creating test artifacts
/// </summary>
public class DevC2paSigner
{
    private readonly IProcessRunner _processRunner;
    private readonly C2paToolOptions _options;
    private readonly ILogger<DevC2paSigner> _logger;

    public DevC2paSigner(
        IProcessRunner processRunner,
        IOptions<C2paToolOptions> options,
        ILogger<DevC2paSigner> logger)
    {
        _processRunner = processRunner;
        _options = options.Value;
        _logger = logger;
    }

    /// <summary>
    /// Signs an MP4 file with C2PA using dev keys
    /// </summary>
    /// <param name="inputPath">Path to input MP4 file</param>
    /// <param name="outputPath">Path for signed output file</param>
    /// <returns>True if signing was successful</returns>
    public async Task<bool> SignFileAsync(string inputPath, string outputPath)
    {
        try
        {
            _logger.LogInformation("Signing file {InputPath} -> {OutputPath}", inputPath, outputPath);

            if (!File.Exists(inputPath))
            {
                _logger.LogError("Input file does not exist: {InputPath}", inputPath);
                return false;
            }

            // Ensure output directory exists
            var outputDir = Path.GetDirectoryName(outputPath);
            if (!string.IsNullOrEmpty(outputDir) && !Directory.Exists(outputDir))
            {
                Directory.CreateDirectory(outputDir);
            }

            // Check if dev keys exist
            var privateKeyPath = "keys/dev.key";
            var certificatePath = "keys/dev.pem";

            if (!File.Exists(privateKeyPath) || !File.Exists(certificatePath))
            {
                _logger.LogError("Dev keys not found. Expected: {PrivateKeyPath}, {CertificatePath}",
                    privateKeyPath, certificatePath);
                return false;
            }

            // Run c2patool sign command
            var arguments = $"\"{inputPath}\" --sign --private-key \"{privateKeyPath}\" --certificate \"{certificatePath}\" --output \"{outputPath}\"";
            var (exitCode, output, error) = await _processRunner.RunAsync(_options.Bin, arguments, _options.TimeoutSeconds * 1000);

            if (exitCode != 0)
            {
                _logger.LogError("C2PA signing failed: {Error}", error);
                return false;
            }

            _logger.LogInformation("Successfully signed file: {OutputPath}", outputPath);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error signing file {InputPath}", inputPath);
            return false;
        }
    }
}
