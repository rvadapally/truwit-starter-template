using Dapper;
using HumanProof.Api.Domain.Entities;
using HumanProof.Api.Domain.Interfaces;
using Microsoft.Extensions.Configuration;
using System.Data.Common;
using Microsoft.EntityFrameworkCore;
using HumanProof.Api.Infrastructure.Data;

namespace HumanProof.Api.Infrastructure.Repositories;

/// <summary>
/// Dapper-based LinkIndex repository (database-agnostic)
/// </summary>
public class LinkIndexRepository : ILinkIndexRepository
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<LinkIndexRepository> _logger;

    public LinkIndexRepository(ApplicationDbContext context, ILogger<LinkIndexRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<string?> TryGetProofIdAsync(string platform, string canonicalId)
    {
        var connection = _context.Database.GetDbConnection();
        var isPostgres = _context.Database.IsNpgsql();

        var sql = isPostgres
            ? @"SELECT ""ProofId"" FROM ""LinkIndex"" WHERE ""Platform"" = @Platform AND ""CanonicalId"" = @CanonicalId"
            : @"SELECT ProofId FROM LinkIndex WHERE Platform = @Platform AND CanonicalId = @CanonicalId";

        return await connection.QueryFirstOrDefaultAsync<string>(sql, new { Platform = platform, CanonicalId = canonicalId });
    }

    public async Task<string> InsertAsync(string platform, string canonicalId, string proofId)
    {
        var connection = _context.Database.GetDbConnection();
        var isPostgres = _context.Database.IsNpgsql();

        try
        {
            var sql = isPostgres
                ? @"INSERT INTO ""LinkIndex"" (""Platform"", ""CanonicalId"", ""ProofId"", ""CreatedAt"")
                    VALUES (@Platform, @CanonicalId, @ProofId, @CreatedAt)"
                : @"INSERT INTO LinkIndex (Platform, CanonicalId, ProofId, CreatedAt)
                    VALUES (@Platform, @CanonicalId, @ProofId, @CreatedAt)";

            await connection.ExecuteAsync(sql, new
            {
                Platform = platform,
                CanonicalId = canonicalId,
                ProofId = proofId,
                CreatedAt = DateTime.Now
            });

            return proofId;
        }
        catch (Exception ex) when (ex.Message.Contains("duplicate key") || ex.Message.Contains("UNIQUE constraint"))
        {
            _logger.LogInformation("LinkIndex entry already exists for {Platform}:{CanonicalId}, returning existing ProofId", platform, canonicalId);

            // Return existing ProofId
            return await TryGetProofIdAsync(platform, canonicalId) ?? proofId;
        }
    }
}
