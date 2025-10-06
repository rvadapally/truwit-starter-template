using Dapper;
using HumanProof.Api.Domain.Entities;
using HumanProof.Api.Domain.Interfaces;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Configuration;

namespace HumanProof.Api.Infrastructure.Repositories;

/// <summary>
/// Dapper-based Assets repository
/// </summary>
public class AssetsRepository : IAssetsRepository
{
    private readonly string _connectionString;
    private readonly ILogger<AssetsRepository> _logger;

    public AssetsRepository(IConfiguration configuration, ILogger<AssetsRepository> logger)
    {
        _connectionString = configuration.GetConnectionString("Sqlite") ?? "Data Source=truwit.db";
        _logger = logger;
    }

    public async Task<Asset?> GetBySha256Async(string sha256)
    {
        using var connection = new SqliteConnection(_connectionString);
        
        var sql = @"
            SELECT AssetId, Sha256, MediaType, Bytes, DurationSec, Width, Height, CreatedAt
            FROM Assets 
            WHERE Sha256 = @Sha256";
        
        return await connection.QueryFirstOrDefaultAsync<Asset>(sql, new { Sha256 = sha256 });
    }

    public async Task<string> InsertAsync(Asset asset)
    {
        using var connection = new SqliteConnection(_connectionString);
        
        try
        {
            var sql = @"
                INSERT INTO Assets (AssetId, Sha256, MediaType, Bytes, DurationSec, Width, Height, CreatedAt)
                VALUES (@AssetId, @Sha256, @MediaType, @Bytes, @DurationSec, @Width, @Height, @CreatedAt)";
            
            await connection.ExecuteAsync(sql, asset);
            
            return asset.AssetId;
        }
        catch (SqliteException ex) when (ex.SqliteErrorCode == 19) // UNIQUE constraint violation
        {
            _logger.LogInformation("Asset already exists for SHA256 {Sha256}, returning existing AssetId", asset.Sha256);
            
            // Return existing AssetId
            var existing = await GetBySha256Async(asset.Sha256);
            return existing?.AssetId ?? asset.AssetId;
        }
    }
}
