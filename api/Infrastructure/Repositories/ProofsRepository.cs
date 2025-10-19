using Dapper;
using HumanProof.Api.Domain.Entities;
using HumanProof.Api.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using HumanProof.Api.Infrastructure.Data;

namespace HumanProof.Api.Infrastructure.Repositories;

/// <summary>
/// Dapper-based Proofs repository (database-agnostic)
/// </summary>
public class ProofsRepository : IProofsRepository
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ProofsRepository> _logger;
    private readonly bool _isPostgres;

    public ProofsRepository(ApplicationDbContext context, ILogger<ProofsRepository> logger)
    {
        _context = context;
        _logger = logger;
        _isPostgres = context.Database.IsNpgsql();
    }

    public async Task<string> InsertAsync(Proof proof)
    {
        _logger.LogInformation("💾 InsertAsync called - Id: {Id}, TrustmarkId: {TrustmarkId}", proof.Id, proof.TrustmarkId);
        
        var connection = _context.Database.GetDbConnection();
        
        _logger.LogInformation("✅ Database connection opened for insert");

        var sql = _isPostgres
            ? @"INSERT INTO ""Proofs"" (""Id"", ""TrustmarkId"", ""AssetId"", ""C2paPresent"", ""C2paJson"", ""OriginStatus"", ""PolicyResult"", ""PolicyJson"", ""MetadataId"", ""ReceiptId"", ""CreatedAt"", ""UpdatedAt"")
                VALUES (@Id, @TrustmarkId, @AssetId, @C2paPresent, @C2paJson, @OriginStatus, @PolicyResult, @PolicyJson, @MetadataId, @ReceiptId, @CreatedAt, @UpdatedAt)
                ON CONFLICT (""Id"") DO UPDATE SET
                    ""AssetId"" = EXCLUDED.""AssetId"",
                    ""C2paPresent"" = EXCLUDED.""C2paPresent"",
                    ""C2paJson"" = EXCLUDED.""C2paJson"",
                    ""OriginStatus"" = EXCLUDED.""OriginStatus"",
                    ""PolicyResult"" = EXCLUDED.""PolicyResult"",
                    ""PolicyJson"" = EXCLUDED.""PolicyJson"",
                    ""MetadataId"" = EXCLUDED.""MetadataId"",
                    ""ReceiptId"" = EXCLUDED.""ReceiptId"",
                    ""UpdatedAt"" = EXCLUDED.""UpdatedAt"""
            : @"INSERT INTO Proofs (Id, TrustmarkId, AssetId, C2paPresent, C2paJson, OriginStatus, PolicyResult, PolicyJson, MetadataId, ReceiptId, CreatedAt, UpdatedAt)
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
        var connection = _context.Database.GetDbConnection();

        var sql = _isPostgres
            ? @"SELECT ""Id"", ""TrustmarkId"", ""AssetId"", ""C2paPresent"", ""C2paJson"", ""OriginStatus"", ""PolicyResult"", ""PolicyJson"", ""MetadataId"", ""ReceiptId"", ""CreatedAt"", ""UpdatedAt""
                FROM ""Proofs"" WHERE ""Id"" = @Id"
            : @"SELECT Id, TrustmarkId, AssetId, C2paPresent, C2paJson, OriginStatus, PolicyResult, PolicyJson, MetadataId, ReceiptId, CreatedAt, UpdatedAt
                FROM Proofs WHERE Id = @Id";

        return await connection.QueryFirstOrDefaultAsync<Proof>(sql, new { Id = id });
    }

    public async Task<Proof?> GetByTrustmarkIdAsync(string trustmarkId)
    {
        _logger.LogInformation("🔍 GetByTrustmarkIdAsync called with trustmarkId: {TrustmarkId}", trustmarkId);
        
        var connection = _context.Database.GetDbConnection();
        
        _logger.LogInformation("✅ Database connection opened successfully");

        var sql = _isPostgres
            ? @"SELECT ""Id"", ""TrustmarkId"", ""AssetId"", ""C2paPresent"", ""C2paJson"", ""OriginStatus"", ""PolicyResult"", ""PolicyJson"", ""MetadataId"", ""ReceiptId"", ""CreatedAt"", ""UpdatedAt""
                FROM ""Proofs"" WHERE ""TrustmarkId"" = @TrustmarkId"
            : @"SELECT Id, TrustmarkId, AssetId, C2paPresent, C2paJson, OriginStatus, PolicyResult, PolicyJson, MetadataId, ReceiptId, CreatedAt, UpdatedAt
                FROM Proofs WHERE TrustmarkId = @TrustmarkId";

        var result = await connection.QueryFirstOrDefaultAsync<Proof>(sql, new { TrustmarkId = trustmarkId });
        
        if (result == null)
        {
            _logger.LogWarning("❌ No proof found for trustmarkId: {TrustmarkId}", trustmarkId);
            
            // Count total proofs to see if table is empty
            var countSql = _isPostgres ? @"SELECT COUNT(*) FROM ""Proofs""" : "SELECT COUNT(*) FROM Proofs";
            var count = await connection.ExecuteScalarAsync<int>(countSql);
            _logger.LogInformation("📊 Total proofs in database: {Count}", count);
        }
        else
        {
            _logger.LogInformation("✅ Found proof: Id={Id}, TrustmarkId={TrustmarkId}", result.Id, result.TrustmarkId);
        }
        
        return result;
    }

    public async Task<IEnumerable<Proof>> GetAllAsync()
    {
        var connection = _context.Database.GetDbConnection();

        var sql = _isPostgres
            ? @"SELECT ""Id"", ""TrustmarkId"", ""AssetId"", ""C2paPresent"", ""C2paJson"", ""OriginStatus"", ""PolicyResult"", ""PolicyJson"", ""MetadataId"", ""ReceiptId"", ""CreatedAt"", ""UpdatedAt"", ""ProofCardSmallUrl"", ""ProofCardLargeUrl""
                FROM ""Proofs"" ORDER BY ""CreatedAt"" DESC"
            : @"SELECT Id, TrustmarkId, AssetId, C2paPresent, C2paJson, OriginStatus, PolicyResult, PolicyJson, MetadataId, ReceiptId, CreatedAt, UpdatedAt, ProofCardSmallUrl, ProofCardLargeUrl
                FROM Proofs ORDER BY CreatedAt DESC";

        return await connection.QueryAsync<Proof>(sql);
    }

    public async Task UpdateAsync(Proof proof)
    {
        var connection = _context.Database.GetDbConnection();

        var sql = _isPostgres
            ? @"UPDATE ""Proofs"" SET 
                ""TrustmarkId"" = @TrustmarkId,
                ""AssetId"" = @AssetId,
                ""C2paPresent"" = @C2paPresent,
                ""C2paJson"" = @C2paJson,
                ""OriginStatus"" = @OriginStatus,
                ""PolicyResult"" = @PolicyResult,
                ""PolicyJson"" = @PolicyJson,
                ""MetadataId"" = @MetadataId,
                ""ReceiptId"" = @ReceiptId,
                ""UpdatedAt"" = @UpdatedAt,
                ""ProofCardSmallUrl"" = @ProofCardSmallUrl,
                ""ProofCardLargeUrl"" = @ProofCardLargeUrl
                WHERE ""Id"" = @Id"
            : @"UPDATE Proofs SET 
                TrustmarkId = @TrustmarkId,
                AssetId = @AssetId,
                C2paPresent = @C2paPresent,
                C2paJson = @C2paJson,
                OriginStatus = @OriginStatus,
                PolicyResult = @PolicyResult,
                PolicyJson = @PolicyJson,
                MetadataId = @MetadataId,
                ReceiptId = @ReceiptId,
                UpdatedAt = @UpdatedAt,
                ProofCardSmallUrl = @ProofCardSmallUrl,
                ProofCardLargeUrl = @ProofCardLargeUrl
                WHERE Id = @Id";

        await connection.ExecuteAsync(sql, proof);
    }
}
