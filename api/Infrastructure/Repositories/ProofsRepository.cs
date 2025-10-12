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
        _logger.LogInformation("💾 InsertAsync called - Id: {Id}, TrustmarkId: {TrustmarkId}", proof.Id, proof.TrustmarkId);
        _logger.LogInformation("📁 Connection string: {ConnectionString}", _connectionString);
        
        using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync();
        
        _logger.LogInformation("✅ Database connection opened for insert");

        var sql = @"
            INSERT INTO Proofs (Id, TrustmarkId, AssetId, C2paPresent, C2paJson, OriginStatus, PolicyResult, PolicyJson, MetadataId, ReceiptId, CreatedAt, UpdatedAt)
            VALUES (@Id, @TrustmarkId, @AssetId, @C2paPresent, @C2paJson, @OriginStatus, @PolicyResult, @PolicyJson, @MetadataId, @ReceiptId, @CreatedAt, @UpdatedAt)
            ON CONFLICT(Id) DO UPDATE SET
                AssetId = excluded.AssetId,
                C2paPresent = excluded.C2paPresent,
                C2paJson = excluded.C2paJson,
                OriginStatus = excluded.OriginStatus,
                PolicyResult = excluded.PolicyResult,
                PolicyJson = excluded.PolicyJson,
                MetadataId = excluded.MetadataId,
                ReceiptId = excluded.ReceiptId,
                UpdatedAt = excluded.UpdatedAt";

        var rowsAffected = await connection.ExecuteAsync(sql, proof);
        
        _logger.LogInformation("✅ Proof inserted/updated - Rows affected: {RowsAffected}", rowsAffected);

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
        _logger.LogInformation("🔍 GetByTrustmarkIdAsync called with trustmarkId: {TrustmarkId}", trustmarkId);
        _logger.LogInformation("📁 Connection string: {ConnectionString}", _connectionString);
        
        using var connection = new SqliteConnection(_connectionString);
        await connection.OpenAsync();
        
        _logger.LogInformation("✅ Database connection opened successfully");

        var sql = @"
            SELECT Id, TrustmarkId, AssetId, C2paPresent, C2paJson, OriginStatus, PolicyResult, PolicyJson, MetadataId, ReceiptId, CreatedAt, UpdatedAt
            FROM Proofs 
            WHERE TrustmarkId = @TrustmarkId";

        var result = await connection.QueryFirstOrDefaultAsync<Proof>(sql, new { TrustmarkId = trustmarkId });
        
        if (result == null)
        {
            _logger.LogWarning("❌ No proof found for trustmarkId: {TrustmarkId}", trustmarkId);
            
            // Count total proofs to see if table is empty
            var countSql = "SELECT COUNT(*) FROM Proofs";
            var count = await connection.ExecuteScalarAsync<int>(countSql);
            _logger.LogInformation("📊 Total proofs in database: {Count}", count);
        }
        else
        {
            _logger.LogInformation("✅ Found proof: Id={Id}, TrustmarkId={TrustmarkId}", result.Id, result.TrustmarkId);
        }
        
        return result;
    }
}
