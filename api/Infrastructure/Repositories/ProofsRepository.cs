using Dapper;
using HumanProof.Api.Domain.Entities;
using HumanProof.Api.Domain.Interfaces;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Configuration;

namespace HumanProof.Api.Infrastructure.Repositories;

/// <summary>
/// Dapper-based Proofs repository
/// </summary>
public class ProofsRepository : IProofsRepository
{
    private readonly string _connectionString;
    private readonly ILogger<ProofsRepository> _logger;

    public ProofsRepository(IConfiguration configuration, ILogger<ProofsRepository> logger)
    {
        _connectionString = configuration.GetConnectionString("Sqlite") ?? "Data Source=truwit.db";
        _logger = logger;
    }

    public async Task<string> InsertAsync(Proof proof)
    {
        using var connection = new SqliteConnection(_connectionString);
        
        var sql = @"
            INSERT INTO Proofs (Id, TrustmarkId, AssetId, C2paPresent, C2paJson, OriginStatus, PolicyResult, PolicyJson, MetadataId, ReceiptId, CreatedAt, UpdatedAt)
            VALUES (@Id, @TrustmarkId, @AssetId, @C2paPresent, @C2paJson, @OriginStatus, @PolicyResult, @PolicyJson, @MetadataId, @ReceiptId, @CreatedAt, @UpdatedAt)";
        
        await connection.ExecuteAsync(sql, proof);
        
        return proof.Id;
    }

    public async Task<Proof?> GetByIdAsync(string id)
    {
        using var connection = new SqliteConnection(_connectionString);
        
        var sql = @"
            SELECT Id, TrustmarkId, AssetId, C2paPresent, C2paJson, OriginStatus, PolicyResult, PolicyJson, MetadataId, ReceiptId, CreatedAt, UpdatedAt
            FROM Proofs 
            WHERE Id = @Id";
        
        return await connection.QueryFirstOrDefaultAsync<Proof>(sql, new { Id = id });
    }

    public async Task<Proof?> GetByTrustmarkIdAsync(string trustmarkId)
    {
        using var connection = new SqliteConnection(_connectionString);
        
        var sql = @"
            SELECT Id, TrustmarkId, AssetId, C2paPresent, C2paJson, OriginStatus, PolicyResult, PolicyJson, MetadataId, ReceiptId, CreatedAt, UpdatedAt
            FROM Proofs 
            WHERE TrustmarkId = @TrustmarkId";
        
        return await connection.QueryFirstOrDefaultAsync<Proof>(sql, new { TrustmarkId = trustmarkId });
    }
}
