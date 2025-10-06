using Dapper;
using HumanProof.Api.Domain.Entities;
using HumanProof.Api.Domain.Interfaces;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Configuration;

namespace HumanProof.Api.Infrastructure.Repositories;

/// <summary>
/// Dapper-based LinkIndex repository
/// </summary>
public class LinkIndexRepository : ILinkIndexRepository
{
    private readonly string _connectionString;
    private readonly ILogger<LinkIndexRepository> _logger;

    public LinkIndexRepository(IConfiguration configuration, ILogger<LinkIndexRepository> logger)
    {
        _connectionString = configuration.GetConnectionString("Sqlite") ?? "Data Source=truwit.db";
        _logger = logger;
    }

    public async Task<string?> TryGetProofIdAsync(string platform, string canonicalId)
    {
        using var connection = new SqliteConnection(_connectionString);

        var sql = @"
            SELECT ProofId 
            FROM LinkIndex 
            WHERE Platform = @Platform AND CanonicalId = @CanonicalId";

        return await connection.QueryFirstOrDefaultAsync<string>(sql, new { Platform = platform, CanonicalId = canonicalId });
    }

    public async Task<string> InsertAsync(string platform, string canonicalId, string proofId)
    {
        using var connection = new SqliteConnection(_connectionString);

        try
        {
            var sql = @"
                INSERT INTO LinkIndex (Platform, CanonicalId, ProofId, CreatedAt)
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
        catch (SqliteException ex) when (ex.SqliteErrorCode == 19) // UNIQUE constraint violation
        {
            _logger.LogInformation("LinkIndex entry already exists for {Platform}:{CanonicalId}, returning existing ProofId", platform, canonicalId);

            // Return existing ProofId
            return await TryGetProofIdAsync(platform, canonicalId) ?? proofId;
        }
    }
}
