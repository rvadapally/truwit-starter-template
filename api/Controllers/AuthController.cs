using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using HumanProof.Api.Domain.Entities;
using HumanProof.Api.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace HumanProof.Api.Controllers;

/// <summary>
/// OAuth configuration options
/// </summary>
public class OAuthOptions
{
    public GoogleOptions Google { get; set; } = new();
    public string JwtSecret { get; set; } = string.Empty;
    public int JwtExpirationMinutes { get; set; } = 15;
    
    public class GoogleOptions
    {
        public string ClientId { get; set; } = string.Empty;
        public string ClientSecret { get; set; } = string.Empty;
    }
}

/// <summary>
/// Controller for OAuth authentication and anonymous identity generation
/// </summary>
[ApiController]
[Route("v1/auth")]
public class AuthController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AuthController> _logger;
    private readonly OAuthOptions _oauthOptions;

    public AuthController(
        ApplicationDbContext context,
        ILogger<AuthController> logger,
        IOptions<OAuthOptions> oauthOptions)
    {
        _context = context;
        _logger = logger;
        _oauthOptions = oauthOptions.Value;
    }

    /// <summary>
    /// Start Google OAuth login flow
    /// </summary>
    [HttpGet("login/google")]
    public IActionResult LoginGoogle([FromQuery] string? returnUrl = null)
    {
        var properties = new AuthenticationProperties
        {
            RedirectUri = Url.Action(nameof(CallbackGoogle), new { returnUrl })
        };
        
        return Challenge(properties, GoogleDefaults.AuthenticationScheme);
    }

    /// <summary>
    /// Handle Google OAuth callback
    /// </summary>
    [HttpGet("callback/google")]
    public async Task<IActionResult> CallbackGoogle([FromQuery] string? returnUrl = null)
    {
        try
        {
            var authenticateResult = await HttpContext.AuthenticateAsync(GoogleDefaults.AuthenticationScheme);
            
            if (!authenticateResult.Succeeded)
            {
                _logger.LogWarning("Google authentication failed");
                return BadRequest(new { error = "Authentication failed" });
            }

            var principal = authenticateResult.Principal;
            if (principal == null)
            {
                return BadRequest(new { error = "No principal found" });
            }

            // Extract user information from Google claims
            var googleId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
            var email = principal.FindFirstValue(ClaimTypes.Email);
            var name = principal.FindFirstValue(ClaimTypes.Name);

            if (string.IsNullOrEmpty(googleId) || string.IsNullOrEmpty(email))
            {
                return BadRequest(new { error = "Missing required claims from Google" });
            }

            // Create or update identity
            var identity = await UpsertIdentityAsync("google", googleId, name, email);

            // Generate JWT token
            var token = GenerateJwtToken(identity);

            _logger.LogInformation("Google authentication successful for identity {IdentityId}", identity.IdentityId);

            // Return token (in production, redirect to frontend with token in query or use secure cookie)
            return Ok(new
            {
                identity_token = token,
                identity_id = identity.IdentityId,
                provider = identity.Provider,
                handle = identity.Handle,
                display_name = identity.DisplayName
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during Google OAuth callback");
            return StatusCode(500, new { error = "Internal server error during authentication" });
        }
    }

    /// <summary>
    /// Generate anonymous identity
    /// </summary>
    [HttpPost("anonymous")]
    public async Task<IActionResult> CreateAnonymous()
    {
        try
        {
            var shortGuid = Guid.NewGuid().ToString("N").Substring(0, 8);
            var handle = $"anonymous-{shortGuid}";

            var identity = new Identity
            {
                IdentityId = Guid.NewGuid(),
                Provider = "anon",
                Handle = handle,
                DisplayName = "Anonymous User",
                CreatedAt = DateTime.UtcNow
            };

            _context.Identities.Add(identity);
            await _context.SaveChangesAsync();

            // Generate JWT token
            var token = GenerateJwtToken(identity);

            _logger.LogInformation("Anonymous identity created: {IdentityId}", identity.IdentityId);

            return Ok(new
            {
                identity_token = token,
                identity_id = identity.IdentityId,
                provider = identity.Provider,
                handle = identity.Handle,
                display_name = identity.DisplayName
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating anonymous identity");
            return StatusCode(500, new { error = "Failed to create anonymous identity" });
        }
    }

    /// <summary>
    /// Upsert identity based on provider and handle
    /// </summary>
    private async Task<Identity> UpsertIdentityAsync(string provider, string handle, string? displayName, string? email)
    {
        var identity = await _context.Identities
            .FirstOrDefaultAsync(i => i.Provider == provider && i.Handle == handle);

        if (identity == null)
        {
            identity = new Identity
            {
                IdentityId = Guid.NewGuid(),
                Provider = provider,
                Handle = handle,
                DisplayName = displayName ?? email ?? handle,
                CreatedAt = DateTime.UtcNow
            };

            _context.Identities.Add(identity);
            _logger.LogInformation("Creating new identity: provider={Provider}, handle={Handle}", provider, handle);
        }
        else
        {
            // Update display name if changed
            if (!string.IsNullOrEmpty(displayName) && identity.DisplayName != displayName)
            {
                identity.DisplayName = displayName;
                _logger.LogInformation("Updating identity display name: {IdentityId}", identity.IdentityId);
            }
        }

        await _context.SaveChangesAsync();
        return identity;
    }

    /// <summary>
    /// Generate JWT token containing identity information
    /// </summary>
    private string GenerateJwtToken(Identity identity)
    {
        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_oauthOptions.JwtSecret));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim("identity_id", identity.IdentityId.ToString()),
            new Claim("provider", identity.Provider),
            new Claim("handle", identity.Handle ?? string.Empty),
            new Claim("display_name", identity.DisplayName ?? string.Empty),
            new Claim("follower_count", identity.FollowerCount?.ToString() ?? "0"),
            new Claim("account_created_at", identity.AccountCreatedAt?.ToString("o") ?? string.Empty),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: "Truwit",
            audience: "Truwit-API",
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_oauthOptions.JwtExpirationMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}


