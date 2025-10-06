using HumanProof.Api.Application.Services;
using HumanProof.Api.Application.DTOs;
using HumanProof.Api.Domain.Interfaces;
using HumanProof.Api.Infrastructure.Repositories;
using HumanProof.Api.Infrastructure.Services;
using HumanProof.Api.Infrastructure.Data;
using HumanProof.Api.Infrastructure.Middleware;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "Truwit API",
        Version = "v1"
    });
});

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.WithOrigins("http://localhost:4200", "https://truwit.ai")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// Add HttpClient
builder.Services.AddHttpClient();
builder.Services.AddHttpClient<HostedC2paVerifier>();

// Allow large file uploads
builder.Services.Configure<FormOptions>(o =>
{
    o.MultipartBodyLengthLimit = 1024L * 1024L * 200L;
});

// Register application services
builder.Services.AddScoped<IVerificationService, VerificationService>();
builder.Services.AddScoped<IProofService, ProofService>();
builder.Services.AddScoped<IHashService, HashService>();
builder.Services.AddScoped<IFileService, FileService>();
builder.Services.AddScoped<IContentIngestService, ContentIngestService>();
builder.Services.AddScoped<IMediaInfoService, MediaInfoService>();
builder.Services.AddScoped<IReceiptSigner, ReceiptSigner>();

// Register C2PA services
builder.Services.AddScoped<IC2paVerifier, C2paVerifier>();
builder.Services.AddScoped<IHostedC2paVerifier, HostedC2paVerifier>();
builder.Services.AddScoped<IMediaDownloader, YtDlpDownloader>();
builder.Services.AddScoped<IC2paToolRunner, C2paToolRunner>();
builder.Services.AddScoped<IHasher, Hasher>();
builder.Services.AddScoped<IPlatformDetector, PlatformDetector>();
builder.Services.AddScoped<IProcessRunner, ProcessRunner>();
builder.Services.AddScoped<IUrlCanonicalizer, UrlCanonicalizer>();
builder.Services.AddSingleton<IVerificationStatusTracker, VerificationStatusTracker>();

// Configure C2PA options
builder.Services.Configure<C2paOptions>(builder.Configuration.GetSection("C2pa"));
builder.Services.Configure<DownloaderOptions>(builder.Configuration.GetSection("Downloader"));
builder.Services.Configure<C2paToolOptions>(builder.Configuration.GetSection("C2paTool"));

// Register SQL migration runner
builder.Services.AddScoped<SqlMigrationRunner>();

// Register C2PA repositories
builder.Services.AddScoped<ILinkIndexRepository, LinkIndexRepository>();
builder.Services.AddScoped<IAssetsRepository, AssetsRepository>();
builder.Services.AddScoped<IProofsRepository, ProofsRepository>();
builder.Services.AddScoped<IReceiptsRepository, ReceiptsRepository>();
builder.Services.AddScoped<IIdempotencyRepository, IdempotencyRepository>();

// Register repository implementation based on environment
var databaseType = builder.Configuration.GetValue<string>("Database:Type", "sqlite");

switch (databaseType.ToLower())
{
    case "postgres":
        // Use Postgres database
        var postgresConnectionString = builder.Configuration.GetConnectionString("Postgres")
            ?? "Host=localhost;Database=truwit;Username=postgres;Password=password";

        builder.Services.AddDbContext<ApplicationDbContext>(options =>
            options.UseNpgsql(postgresConnectionString));

        builder.Services.AddScoped<IVerificationRepository, PostgresVerificationRepository>();

        Console.WriteLine("✅ Using Postgres database");
        break;

    case "sqlite":
        // Use SQLite database
        var sqliteConnectionString = builder.Configuration.GetConnectionString("Sqlite")
            ?? "Data Source=truwit.db";

        builder.Services.AddDbContext<ApplicationDbContext>(options =>
            options.UseSqlite(sqliteConnectionString));

        builder.Services.AddScoped<IVerificationRepository, PostgresVerificationRepository>();

        Console.WriteLine("✅ Using SQLite database");
        break;

    default:
        // Use in-memory repository for development
        builder.Services.AddScoped<IVerificationRepository, InMemoryVerificationRepository>();

        Console.WriteLine("✅ Using in-memory repository");
        break;
}

var app = builder.Build();

// Ensure database is created and migrated (if using database)
if (databaseType.ToLower() != "memory")
{
    using var scope = app.Services.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    try
    {
        await context.Database.EnsureCreatedAsync();
        Console.WriteLine("✅ Database created/verified");

        // Run SQL migrations
        var migrationRunner = scope.ServiceProvider.GetRequiredService<SqlMigrationRunner>();
        await migrationRunner.RunPendingMigrationsAsync();
        Console.WriteLine("✅ SQL migrations executed");

        // Seed the database with test data
        await DatabaseSeeder.SeedAsync(context);
        Console.WriteLine("✅ Database seeded with test data");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Database setup failed: {ex.Message}");
        Console.WriteLine($"❌ Stack trace: {ex.StackTrace}");
        throw; // Re-throw to prevent app from starting with broken database
    }
}

// Configure the HTTP request pipeline
// Always enable Swagger for POC
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Truwit API v1");
    c.RoutePrefix = "swagger";
});

app.UseHttpsRedirection();
app.UseRequestId();
app.UseGlobalExceptionHandler();
app.UseCors("AllowAll");
app.UseAuthorization();
app.MapControllers();

// Health check endpoint
app.MapGet("/health", () => 
{
    var toolVersions = new Dictionary<string, string>();
    
    try
    {
        // Get yt-dlp version
        var ytDlpProcess = System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
        {
            FileName = "yt-dlp",
            Arguments = "--version",
            UseShellExecute = false,
            RedirectStandardOutput = true,
            CreateNoWindow = true
        });
        if (ytDlpProcess != null)
        {
            ytDlpProcess.WaitForExit(5000);
            toolVersions["yt-dlp"] = ytDlpProcess.StandardOutput.ReadToEnd().Trim();
        }
    }
    catch { toolVersions["yt-dlp"] = "unknown"; }
    
    try
    {
        // Get c2patool version
        var c2paProcess = System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
        {
            FileName = "c2patool",
            Arguments = "--version",
            UseShellExecute = false,
            RedirectStandardOutput = true,
            CreateNoWindow = true
        });
        if (c2paProcess != null)
        {
            c2paProcess.WaitForExit(5000);
            toolVersions["c2patool"] = c2paProcess.StandardOutput.ReadToEnd().Trim();
        }
    }
    catch { toolVersions["c2patool"] = "unknown"; }
    
    return Results.Ok(new { 
        ok = true, 
        timestamp = DateTime.Now,
        tools = toolVersions
    });
}).AllowAnonymous();

// Badge endpoint
app.MapGet("/badges/{id}.png", (string id) =>
{
    var svg = $"""
    <svg width="200" height="60" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="60" fill="#22c55e" rx="8"/>
        <text x="100" y="35" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">
            Verified by Truwit
        </text>
    </svg>
    """;

    return Results.Content(svg, "image/svg+xml");
}).AllowAnonymous();

app.Run();