using System.Diagnostics;

namespace HumanProof.Api.Application.Services;

/// <summary>
/// Process runner utility for executing external commands
/// </summary>
public class ProcessRunner : IProcessRunner
{
    private readonly ILogger<ProcessRunner> _logger;

    public ProcessRunner(ILogger<ProcessRunner> logger)
    {
        _logger = logger;
    }

    public async Task<(int code, string stdout, string stderr)> RunAsync(
        string fileName,
        string args,
        int timeoutSecs,
        CancellationToken ct = default)
    {
        try
        {
            _logger.LogDebug("Running process: {FileName} {Args}", fileName, args);

            var startInfo = new ProcessStartInfo
            {
                FileName = fileName,
                Arguments = args,
                UseShellExecute = false,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                CreateNoWindow = true
            };

            using var process = new Process { StartInfo = startInfo };

            process.Start();

            var stdoutTask = Task.Run(async () =>
            {
                var output = await process.StandardOutput.ReadToEndAsync();
                return output;
            }, ct);

            var stderrTask = Task.Run(async () =>
            {
                var error = await process.StandardError.ReadToEndAsync();
                return error;
            }, ct);

            var timeoutTask = Task.Delay(TimeSpan.FromSeconds(timeoutSecs), ct);
            var processTask = Task.Run(() => process.WaitForExit(), ct);

            var completedTask = await Task.WhenAny(processTask, timeoutTask);

            if (completedTask == timeoutTask)
            {
                _logger.LogWarning("Process timed out after {TimeoutSecs}s: {FileName} {Args}", timeoutSecs, fileName, args);

                try
                {
                    process.Kill();
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error killing timed out process");
                }

                throw new TimeoutException($"Process timed out after {timeoutSecs} seconds");
            }

            await processTask;
            var stdout = await stdoutTask;
            var stderr = await stderrTask;

            _logger.LogDebug("Process completed with exit code {ExitCode}: {FileName}", process.ExitCode, fileName);

            return (process.ExitCode, stdout, stderr);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error running process: {FileName} {Args}", fileName, args);
            throw;
        }
    }
}