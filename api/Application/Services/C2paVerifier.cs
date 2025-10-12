using HumanProof.Api.Application.DTOs;
using HumanProof.Api.Application.Services;

namespace HumanProof.Api.Application.Services;

/// <summary>
/// Main C2PA verification service with hosted and local verification paths
/// </summary>
public sealed class C2paVerifier : IC2paVerifier
{
    private readonly IHostedC2paVerifier _hostedVerifier;
    private readonly IMediaDownloader _downloader;
    private readonly IC2paToolRunner _c2paToolRunner;
    private readonly IHasher _hasher;
    private readonly IPlatformDetector _platformDetector;
    private readonly IVerificationStatusTracker _statusTracker;
    private readonly IConfiguration _configuration;
    private readonly ILogger<C2paVerifier> _logger;

    public C2paVerifier(
        IHostedC2paVerifier hostedVerifier,
        IMediaDownloader downloader,
        IC2paToolRunner c2paToolRunner,
        IHasher hasher,
        IPlatformDetector platformDetector,
        IVerificationStatusTracker statusTracker,
        IConfiguration configuration,
        ILogger<C2paVerifier> logger)
    {
        _hostedVerifier = hostedVerifier;
        _downloader = downloader;
        _c2paToolRunner = c2paToolRunner;
        _hasher = hasher;
        _platformDetector = platformDetector;
        _statusTracker = statusTracker;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<C2paCheckResult> VerifyFromUrlAsync(string url, CancellationToken ct = default)
    {
        var verificationId = _statusTracker.StartVerification(url);
        
        try
        {
            // Step 1: Detect platform
            var platform = _platformDetector.Detect(url);
            _statusTracker.UpdateStatus(verificationId, new VerificationStatus(
                CurrentStep: VerificationStep.PlatformDetected,
                Message: $"Detected platform: {platform}",
                IsCompleted: false,
                HasError: false,
                ErrorMessage: null,
                CompletedSteps: new Dictionary<string, bool> { ["Platform Detection"] = true },
                C2paResult: null,
                MediaPath: null,
                FileSizeBytes: null
            ));

            _logger.LogInformation("Starting C2PA verification for {Platform} URL: {Url}", platform, url);

            // Check if mock mode is enabled
            var mockModeEnabled = _configuration.GetValue<bool>("MockMode:Enabled", false);
            if (mockModeEnabled)
            {
                _logger.LogInformation("Mock mode enabled - simulating verification process");
                return await SimulateVerificationProcessAsync(url, platform, verificationId, ct);
            }

            // Step 2: Try hosted verification first (fast path)
            _statusTracker.UpdateStatus(verificationId, new VerificationStatus(
                CurrentStep: VerificationStep.HostedVerificationAttempted,
                Message: "Attempting hosted verification...",
                IsCompleted: false,
                HasError: false,
                ErrorMessage: null,
                CompletedSteps: new Dictionary<string, bool> 
                { 
                    ["Platform Detection"] = true,
                    ["Hosted Verification"] = true
                },
                C2paResult: null,
                MediaPath: null,
                FileSizeBytes: null
            ));

            var (hostedOk, hostedResult) = await _hostedVerifier.TryVerifyAsync(url, ct);
            if (hostedOk && hostedResult != null && hostedResult.ManifestFound)
            {
                _logger.LogInformation("C2PA manifest found via hosted verifier for URL: {Url}", url);
                _statusTracker.CompleteVerification(verificationId);
                return hostedResult;
            }

            _logger.LogInformation("No C2PA manifest found via hosted verifier, falling back to local verification for URL: {Url}", url);

            // Step 3: Fallback to local verification
            string? downloadedFile = null;
            try
            {
                // Download media
                _statusTracker.UpdateStatus(verificationId, new VerificationStatus(
                    CurrentStep: VerificationStep.MediaDownloaded,
                    Message: "Downloading media for local verification...",
                    IsCompleted: false,
                    HasError: false,
                    ErrorMessage: null,
                    CompletedSteps: new Dictionary<string, bool> 
                    { 
                        ["Platform Detection"] = true,
                        ["Hosted Verification"] = true,
                        ["Media Download"] = true
                    },
                    C2paResult: null,
                    MediaPath: null,
                    FileSizeBytes: null
                ));

                downloadedFile = await _downloader.DownloadAsync(url, ct);
                
                var fileInfo = new FileInfo(downloadedFile);
                _statusTracker.UpdateStatus(verificationId, new VerificationStatus(
                    CurrentStep: VerificationStep.MediaDownloaded,
                    Message: $"Media downloaded successfully ({fileInfo.Length:N0} bytes)",
                    IsCompleted: false,
                    HasError: false,
                    ErrorMessage: null,
                    CompletedSteps: new Dictionary<string, bool> 
                    { 
                        ["Platform Detection"] = true,
                        ["Hosted Verification"] = true,
                        ["Media Download"] = true
                    },
                    C2paResult: null,
                    MediaPath: downloadedFile,
                    FileSizeBytes: fileInfo.Length
                ));

                // Run c2patool
                _statusTracker.UpdateStatus(verificationId, new VerificationStatus(
                    CurrentStep: VerificationStep.LocalVerificationCompleted,
                    Message: "Running local C2PA verification...",
                    IsCompleted: false,
                    HasError: false,
                    ErrorMessage: null,
                    CompletedSteps: new Dictionary<string, bool> 
                    { 
                        ["Platform Detection"] = true,
                        ["Hosted Verification"] = true,
                        ["Media Download"] = true,
                        ["Local Verification"] = true
                    },
                    C2paResult: null,
                    MediaPath: downloadedFile,
                    FileSizeBytes: fileInfo.Length
                ));

                var (toolOk, toolJson) = await _c2paToolRunner.GetInfoJsonAsync(downloadedFile, ct);
                if (toolOk)
                {
                    var parsedResult = C2paParsers.ParseC2paToolJson(toolJson);
                    if (parsedResult.ManifestFound)
                    {
                        _logger.LogInformation("C2PA manifest found via local verification for URL: {Url}", url);
                        _statusTracker.CompleteVerification(verificationId);
                        return parsedResult;
                    }
                }

                // Step 4: No manifest found - compute SHA-256 as fallback
                _statusTracker.UpdateStatus(verificationId, new VerificationStatus(
                    CurrentStep: VerificationStep.HashComputed,
                    Message: "Computing content hash as provenance fallback...",
                    IsCompleted: false,
                    HasError: false,
                    ErrorMessage: null,
                    CompletedSteps: new Dictionary<string, bool> 
                    { 
                        ["Platform Detection"] = true,
                        ["Hosted Verification"] = true,
                        ["Media Download"] = true,
                        ["Local Verification"] = true,
                        ["Hash Computation"] = true
                    },
                    C2paResult: null,
                    MediaPath: downloadedFile,
                    FileSizeBytes: fileInfo.Length
                ));

                var sha256 = await _hasher.Sha256Async(downloadedFile, ct);

                var fallbackResult = new C2paCheckResult(
                    ManifestFound: false,
                    Status: "not_found",
                    ClaimGenerator: null,
                    ClaimTimestamp: null,
                    Assertions: Array.Empty<C2paAssertion>(),
                    SigningIssuer: null,
                    RawJson: toolOk ? toolJson : null,
                    MediaSha256: sha256,
                    Notes: "No C2PA manifest detected; using SHA-256 fingerprint"
                );

                _logger.LogInformation("No C2PA manifest found, using SHA-256 fallback for URL: {Url}, Hash: {Hash}", url, sha256);
                _statusTracker.CompleteVerification(verificationId);
                return fallbackResult;
            }
            finally
            {
                // Clean up downloaded file
                if (!string.IsNullOrEmpty(downloadedFile) && File.Exists(downloadedFile))
                {
                    try
                    {
                        File.Delete(downloadedFile);
                        _logger.LogDebug("Cleaned up downloaded file: {FilePath}", downloadedFile);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to clean up downloaded file: {FilePath}", downloadedFile);
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during C2PA verification for URL: {Url}", url);
            
            var errorStatus = new VerificationStatus(
                CurrentStep: VerificationStep.Error,
                Message: "Verification failed",
                IsCompleted: true,
                HasError: true,
                ErrorMessage: ex.Message,
                CompletedSteps: new Dictionary<string, bool>(),
                C2paResult: null,
                MediaPath: null,
                FileSizeBytes: null
            );
            
            _statusTracker.UpdateStatus(verificationId, errorStatus);
            
            throw;
        }
    }

    public async Task<VerificationStatus> GetVerificationStatusAsync(string verificationId, CancellationToken ct = default)
    {
        var status = _statusTracker.GetStatus(verificationId);
        if (status == null)
        {
            throw new ArgumentException($"Verification ID not found: {verificationId}");
        }
        return status;
    }

    private async Task<C2paCheckResult> SimulateVerificationProcessAsync(string url, MediaPlatform platform, string verificationId, CancellationToken ct)
    {
        try
        {
            // Simulate each step with realistic delays
            var steps = new[]
            {
                ("Platform Detection", "Detected platform: " + platform),
                ("Hosted Verification", "Attempting hosted verification..."),
                ("Media Download", "Downloading media for local verification..."),
                ("Local Verification", "Running local C2PA verification..."),
                ("Hash Computation", "Computing content hash as provenance fallback..."),
                ("GARM Checks", "Running GARM content safety checks..."),
                ("Receipt Generation", "Generating verification receipt...")
            };

            var completedSteps = new Dictionary<string, bool>();

            foreach (var (stepName, message) in steps)
            {
                // Update status
                completedSteps[stepName] = true;
                _statusTracker.UpdateStatus(verificationId, new VerificationStatus(
                    CurrentStep: VerificationStep.Completed,
                    Message: message,
                    IsCompleted: false,
                    HasError: false,
                    ErrorMessage: null,
                    CompletedSteps: completedSteps,
                    C2paResult: null,
                    MediaPath: null,
                    FileSizeBytes: null
                ));

                // Simulate processing time
                await Task.Delay(1000, ct);
            }

            // Complete verification
            _statusTracker.CompleteVerification(verificationId);

            // Return mock result
            var mockResult = new C2paCheckResult(
                ManifestFound: platform == MediaPlatform.TikTok, // Mock: TikTok has C2PA, YouTube doesn't
                Status: platform == MediaPlatform.TikTok ? "verified" : "not_found",
                ClaimGenerator: platform == MediaPlatform.TikTok ? "TikTok-C2PA-Client" : null,
                ClaimTimestamp: platform == MediaPlatform.TikTok ? DateTimeOffset.UtcNow.AddDays(-1) : null,
                Assertions: platform == MediaPlatform.TikTok ? new[]
                {
                    new C2paAssertion("c2pa.claim.generator", "TikTok-C2PA-Client"),
                    new C2paAssertion("c2pa.claim.claim_generator_info", "{\"name\":\"TikTok-C2PA-Client\",\"version\":\"1.0.0\"}")
                } : Array.Empty<C2paAssertion>(),
                SigningIssuer: platform == MediaPlatform.TikTok ? "TikTok Inc." : null,
                RawJson: "{\"mock\":\"simulated_result\"}",
                MediaSha256: $"mock-sha256-{url.GetHashCode():x8}",
                Notes: $"Mock verification for {platform} - simulated result"
            );

            _logger.LogInformation("Mock verification completed for {Platform} URL: {Url}, Manifest Found: {ManifestFound}", 
                platform, url, mockResult.ManifestFound);

            return mockResult;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in mock verification for URL: {Url}", url);
            throw;
        }
    }
}
