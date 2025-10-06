using Dapper;
using HumanProof.Api.Domain.Entities;
using HumanProof.Api.Domain.Interfaces;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Configuration;

namespace HumanProof.Api.Infrastructure.Repositories;

/// <summary>
/// Dapper-based Idempotency repository
/// </summary>
public class IdempotencyRepository : IIdempotencyRepository
{
    private readonly string _connectionString;
    private readonly ILogger<IdempotencyRepository> _logger;

    public IdempotencyRepository(IConfiguration configuration, ILogger<IdempotencyRepository> logger)
    {
        _connectionString = configuration.GetConnectionString("Sqlite") ?? "Data Source=truwit.db";
        _logger = logger;
    }

    public async Task<(string? proofId, string? responseJson)> TryGetAsync(string idemKey)
    {
        using var connection = new SqliteConnection(_connectionString);
        
        var sql = @"
            SELECT ProofId, ResponseJson 
            FROM Idempotency 
            WHERE IdemKey = @IdemKey";
        
        var result = await connection.QueryFirstOrDefaultAsync<(string? ProofId, string? ResponseJson)>(sql, new { IdemKey = idemKey });
        
        return (result.ProofId, result.ResponseJson);
    }

    public async Task InsertIfAbsentAsync(string idemKey)
    {
        using var connection = new SqliteConnection(_connectionString);
        
        try
        {
            var sql = @"
                INSERT INTO Idempotency (IdemKey, CreatedAt)
                VALUES (@IdemKey, @CreatedAt)";
            
            await connection.ExecuteAsync(sql, new { IdemKey = idemKey, CreatedAt = DateTime.UtcNow });
        }
        catch (SqliteException ex) when (ex.SqliteErrorCode == 19) // UNIQUE constraint violation
        {
            _logger.LogDebug("Idempotency key {IdemKey} already exists", idemKey);
            // This is expected - the key already exists
        }
    }

    public async Task UpdateResultAsync(string idemKey, string proofId, string responseJson)
    {
        using var connection = new SqliteConnection(_connectionString);
        
        var sql = @"
            UPDATE Idempotency 
            SET ProofId = @ProofId, ResponseJson = @ResponseJson
            WHERE IdemKey = @IdemKey";
        
        await connection.ExecuteAsync(sql, new { IdemKey = idemKey, ProofId = proofId, ResponseJson = responseJson });
    }
}
