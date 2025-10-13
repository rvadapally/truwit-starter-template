using Dapper;
using HumanProof.Api.Domain.Entities;
using HumanProof.Api.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using HumanProof.Api.Infrastructure.Data;

namespace HumanProof.Api.Infrastructure.Repositories;

/// <summary>
/// Dapper-based Idempotency repository (database-agnostic)
/// </summary>
public class IdempotencyRepository : IIdempotencyRepository
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<IdempotencyRepository> _logger;
    private readonly bool _isPostgres;

    public IdempotencyRepository(ApplicationDbContext context, ILogger<IdempotencyRepository> logger)
    {
        _context = context;
        _logger = logger;
        _isPostgres = context.Database.IsNpgsql();
    }

    public async Task<(string? proofId, string? responseJson)> TryGetAsync(string idemKey)
    {
        var connection = _context.Database.GetDbConnection();

        var sql = _isPostgres
            ? @"SELECT ""ProofId"", ""ResponseJson"" FROM ""Idempotency"" WHERE ""IdemKey"" = @IdemKey"
            : @"SELECT ProofId, ResponseJson FROM Idempotency WHERE IdemKey = @IdemKey";

        var result = await connection.QueryFirstOrDefaultAsync<(string? ProofId, string? ResponseJson)>(sql, new { IdemKey = idemKey });

        return (result.ProofId, result.ResponseJson);
    }

    public async Task InsertIfAbsentAsync(string idemKey)
    {
        var connection = _context.Database.GetDbConnection();

        try
        {
            var sql = _isPostgres
                ? @"INSERT INTO ""Idempotency"" (""IdemKey"", ""CreatedAt"") VALUES (@IdemKey, @CreatedAt)"
                : @"INSERT INTO Idempotency (IdemKey, CreatedAt) VALUES (@IdemKey, @CreatedAt)";

            await connection.ExecuteAsync(sql, new { IdemKey = idemKey, CreatedAt = DateTime.Now });
        }
        catch (Exception ex) when (ex.Message.Contains("duplicate key") || ex.Message.Contains("UNIQUE constraint"))
        {
            _logger.LogDebug("Idempotency key {IdemKey} already exists", idemKey);
            // This is expected - the key already exists
        }
    }

    public async Task UpdateResultAsync(string idemKey, string proofId, string responseJson)
    {
        var connection = _context.Database.GetDbConnection();

        var sql = _isPostgres
            ? @"UPDATE ""Idempotency"" SET ""ProofId"" = @ProofId, ""ResponseJson"" = @ResponseJson WHERE ""IdemKey"" = @IdemKey"
            : @"UPDATE Idempotency SET ProofId = @ProofId, ResponseJson = @ResponseJson WHERE IdemKey = @IdemKey";

        await connection.ExecuteAsync(sql, new { IdemKey = idemKey, ProofId = proofId, ResponseJson = responseJson });
    }
}
