namespace HumanProof.Api.Infrastructure.Middleware;

public class RequestIdMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestIdMiddleware> _logger;

    public RequestIdMiddleware(RequestDelegate next, ILogger<RequestIdMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var requestId = context.Request.Headers["X-Request-ID"].FirstOrDefault() 
                       ?? Guid.NewGuid().ToString("N")[..8];
        
        context.Items["RequestId"] = requestId;
        context.Response.Headers["X-Request-ID"] = requestId;

        using var scope = _logger.BeginScope(new Dictionary<string, object>
        {
            ["RequestId"] = requestId,
            ["Path"] = context.Request.Path,
            ["Method"] = context.Request.Method
        });

        _logger.LogInformation("Request started: {Method} {Path}", 
            context.Request.Method, context.Request.Path);

        var stopwatch = System.Diagnostics.Stopwatch.StartNew();
        
        try
        {
            await _next(context);
        }
        finally
        {
            stopwatch.Stop();
            _logger.LogInformation("Request completed: {StatusCode} in {ElapsedMs}ms", 
                context.Response.StatusCode, stopwatch.ElapsedMilliseconds);
        }
    }
}

public static class RequestIdMiddlewareExtensions
{
    public static IApplicationBuilder UseRequestId(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<RequestIdMiddleware>();
    }
}
