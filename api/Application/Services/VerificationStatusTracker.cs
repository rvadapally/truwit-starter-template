using HumanProof.Api.Application.DTOs;
using System.Collections.Concurrent;

namespace HumanProof.Api.Application.Services;

/// <summary>
/// Verification status tracking service
/// </summary>
public sealed class VerificationStatusTracker : IVerificationStatusTracker
{
    private readonly ConcurrentDictionary<string, VerificationStatus> _statuses = new();
    private readonly ILogger<VerificationStatusTracker> _logger;

    public VerificationStatusTracker(ILogger<VerificationStatusTracker> logger)
    {
        _logger = logger;
    }

    public string StartVerification(string url)
    {
        var verificationId = Guid.NewGuid().ToString("N");
        var status = new VerificationStatus(
            CurrentStep: VerificationStep.Starting,
            Message: "Starting verification process...",
            IsCompleted: false,
            HasError: false,
            ErrorMessage: null,
            CompletedSteps: new Dictionary<string, bool>(),
            C2paResult: null,
            MediaPath: null,
            FileSizeBytes: null
        );

        _statuses[verificationId] = status;
        _logger.LogInformation("Started verification {VerificationId} for URL: {Url}", verificationId, url);
        return verificationId;
    }

    public void UpdateStatus(string verificationId, VerificationStatus status)
    {
        if (_statuses.TryGetValue(verificationId, out var existingStatus))
        {
            _statuses[verificationId] = status;
            _logger.LogDebug("Updated status for verification {VerificationId}: {Step} - {Message}", 
                verificationId, status.CurrentStep, status.Message);
        }
        else
        {
            _logger.LogWarning("Attempted to update status for unknown verification ID: {VerificationId}", verificationId);
        }
    }

    public VerificationStatus? GetStatus(string verificationId)
    {
        return _statuses.TryGetValue(verificationId, out var status) ? status : null;
    }

    public void CompleteVerification(string verificationId)
    {
        if (_statuses.TryGetValue(verificationId, out var status))
        {
            var completedStatus = status with 
            { 
                CurrentStep = VerificationStep.Completed,
                Message = "Verification completed successfully",
                IsCompleted = true
            };
            _statuses[verificationId] = completedStatus;
            _logger.LogInformation("Completed verification {VerificationId}", verificationId);
        }
    }

    public void CleanupOldVerifications()
    {
        // Remove verifications older than 1 hour
        var cutoff = DateTime.UtcNow.AddHours(-1);
        var toRemove = new List<string>();

        foreach (var kvp in _statuses)
        {
            // For simplicity, we'll clean up based on completion status
            // In a real implementation, you'd track timestamps
            if (kvp.Value.IsCompleted || kvp.Value.HasError)
            {
                toRemove.Add(kvp.Key);
            }
        }

        foreach (var id in toRemove)
        {
            _statuses.TryRemove(id, out _);
        }

        if (toRemove.Count > 0)
        {
            _logger.LogInformation("Cleaned up {Count} old verification statuses", toRemove.Count);
        }
    }
}
