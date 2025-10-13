using Dapper;
using HumanProof.Api.Domain.Entities;
using HumanProof.Api.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using HumanProof.Api.Infrastructure.Data;

namespace HumanProof.Api.Infrastructure.Repositories;

/// <summary>
/// Dapper-based Assets repository (database-agnostic)
/// </summary>
public class AssetsRepository : IAssetsRepository
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AssetsRepository> _logger;
    private readonly bool _isPostgres;

    public AssetsRepository(ApplicationDbContext context, ILogger<AssetsRepository> logger)
    {
        _context = context;
        _logger = logger;
        _isPostgres = context.Database.IsNpgsql();
    }

    public async Task<Asset?> GetByIdAsync(string assetId)
    {
        var connection = _context.Database.GetDbConnection();

        var sql = _isPostgres
            ? @"SELECT ""AssetId"", ""Sha256"", ""MediaType"", ""Bytes"", ""DurationSec"", ""Width"", ""Height"", ""CreatedAt""
                FROM ""Assets"" WHERE ""AssetId"" = @AssetId"
            : @"SELECT AssetId, Sha256, MediaType, Bytes, DurationSec, Width, Height, CreatedAt
                FROM Assets WHERE AssetId = @AssetId";

        return await connection.QueryFirstOrDefaultAsync<Asset>(sql, new { AssetId = assetId });
    }

    public async Task<Asset?> GetBySha256Async(string sha256)
    {
        var connection = _context.Database.GetDbConnection();

        var sql = _isPostgres
            ? @"SELECT ""AssetId"", ""Sha256"", ""MediaType"", ""Bytes"", ""DurationSec"", ""Width"", ""Height"", ""CreatedAt""
                FROM ""Assets"" WHERE ""Sha256"" = @Sha256"
            : @"SELECT AssetId, Sha256, MediaType, Bytes, DurationSec, Width, Height, CreatedAt
                FROM Assets WHERE Sha256 = @Sha256";

        return await connection.QueryFirstOrDefaultAsync<Asset>(sql, new { Sha256 = sha256 });
    }

    public async Task<string> InsertAsync(Asset asset)
    {
        var connection = _context.Database.GetDbConnection();

        try
        {
            var sql = _isPostgres
                ? @"INSERT INTO ""Assets"" (""AssetId"", ""Sha256"", ""MediaType"", ""Bytes"", ""DurationSec"", ""Width"", ""Height"", ""CreatedAt"")
                    VALUES (@AssetId, @Sha256, @MediaType, @Bytes, @DurationSec, @Width, @Height, @CreatedAt)"
                : @"INSERT INTO Assets (AssetId, Sha256, MediaType, Bytes, DurationSec, Width, Height, CreatedAt)
                    VALUES (@AssetId, @Sha256, @MediaType, @Bytes, @DurationSec, @Width, @Height, @CreatedAt)";

            await connection.ExecuteAsync(sql, asset);

            return asset.AssetId;
        }
        catch (Exception ex) when (ex.Message.Contains("duplicate key") || ex.Message.Contains("UNIQUE constraint"))
        {
            _logger.LogInformation("Asset already exists for SHA256 {Sha256}, returning existing AssetId", asset.Sha256);

            // Return existing AssetId
            var existing = await GetBySha256Async(asset.Sha256);
            return existing?.AssetId ?? asset.AssetId;
        }
    }
}
