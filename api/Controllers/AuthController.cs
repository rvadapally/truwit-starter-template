using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using AspNet.Security.OAuth.Twitter;
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
    public TwitterOptions Twitter { get; set; } = new();
    public string JwtSecret { get; set; } = string.Empty;
    public int JwtExpirationMinutes { get; set; } = 15;
    
    public class GoogleOptions
    {
        public string ClientId { get; set; } = string.Empty;
        public string ClientSecret { get; set; } = string.Empty;
    }
    
    public class TwitterOptions
    {
        public string ConsumerKey { get; set; } = string.Empty;
        public string ConsumerSecret { get; set; } = string.Empty;
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
        // After OAuth completes on /signin-google, redirect to our controller
        var properties = new AuthenticationProperties
        {
            RedirectUri = "/v1/auth/complete/google" + (string.IsNullOrEmpty(returnUrl) ? "" : $"?returnUrl={Uri.EscapeDataString(returnUrl)}")
        };
        
        return Challenge(properties, GoogleDefaults.AuthenticationScheme);
    }

    /// <summary>
    /// Complete Google OAuth - called after OAuth middleware has signed in the user with cookies
    /// </summary>
    [HttpGet("complete/google")]
    public async Task<IActionResult> CompleteGoogle([FromQuery] string? returnUrl = null)
    {
        try
        {
            // User should already be authenticated via cookie (set by OAuth middleware on /signin-google)
            var cookieResult = await HttpContext.AuthenticateAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            if (!cookieResult.Succeeded || cookieResult.Principal == null)
            {
                _logger.LogWarning("Cookie authentication failed after OAuth");
                return BadRequest(new { error = "Authentication failed - no cookie" });
            }

            // Extract claims from the cookie
            var principal = cookieResult.Principal;
            var googleId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
            var email = principal.FindFirstValue(ClaimTypes.Email);
            var name = principal.FindFirstValue(ClaimTypes.Name);
            
            if (string.IsNullOrEmpty(googleId) || string.IsNullOrEmpty(email))
            {
                return BadRequest(new { error = "Missing required claims from Google" });
            }
            
            // Create or update identity and return JWT
            var identity = await UpsertIdentityAsync("google", googleId, name, email);
            var jwt = GenerateJwtToken(identity);
            return Ok(new { token = jwt, identity = new { identity.IdentityId, identity.Provider, identity.DisplayName } });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error completing Google authentication");
            return StatusCode(500, new { error = "Internal server error", message = ex.Message });
        }
    }

    // NOTE: /v1/auth/callback/google is handled by OAuth middleware (CallbackPath in Program.cs)
    // After middleware completes, it redirects to /v1/auth/complete/google (see LoginGoogle)

    /// <summary>
    /// Start Twitter (X) OAuth login flow
    /// </summary>
    [HttpGet("login/twitter")]
    public IActionResult LoginTwitter([FromQuery] string? returnUrl = null)
    {
        var properties = new AuthenticationProperties
        {
            RedirectUri = Url.Action(nameof(CallbackTwitter), new { returnUrl })
        };
        
        return Challenge(properties, TwitterAuthenticationDefaults.AuthenticationScheme);
    }

    /// <summary>
    /// Handle Twitter (X) OAuth callback
    /// </summary>
    [HttpGet("callback/twitter")]
    public async Task<IActionResult> CallbackTwitter([FromQuery] string? returnUrl = null)
    {
        try
        {
            var authenticateResult = await HttpContext.AuthenticateAsync(TwitterAuthenticationDefaults.AuthenticationScheme);
            
            if (!authenticateResult.Succeeded)
            {
                _logger.LogWarning("Twitter authentication failed");
                return BadRequest(new { error = "Authentication failed" });
            }

            var principal = authenticateResult.Principal;
            if (principal == null)
            {
                return BadRequest(new { error = "No principal found" });
            }

            // Extract user information from Twitter claims
            var twitterId = principal.FindFirstValue(ClaimTypes.NameIdentifier);
            var username = principal.FindFirstValue(ClaimTypes.Name) ?? principal.FindFirstValue("screen_name");
            var email = principal.FindFirstValue(ClaimTypes.Email); // May be null if user didn't grant email permission

            if (string.IsNullOrEmpty(twitterId))
            {
                return BadRequest(new { error = "Missing required claims from Twitter" });
            }

            // Create or update identity (use twitterId as handle since it's unique)
            var identity = await UpsertIdentityAsync("twitter", twitterId, username, email);

            // Generate JWT token
            var token = GenerateJwtToken(identity);

            _logger.LogInformation("Twitter authentication successful for identity {IdentityId}", identity.IdentityId);

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
            _logger.LogError(ex, "Error during Twitter OAuth callback");
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
            new Claim(ClaimTypes.NameIdentifier, identity.IdentityId.ToString()),
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


