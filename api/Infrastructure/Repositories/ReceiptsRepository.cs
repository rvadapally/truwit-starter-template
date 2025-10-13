using Dapper;
using HumanProof.Api.Domain.Entities;
using HumanProof.Api.Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using HumanProof.Api.Infrastructure.Data;

namespace HumanProof.Api.Infrastructure.Repositories;

/// <summary>
/// Dapper-based Receipts repository (database-agnostic)
/// </summary>
public class ReceiptsRepository : IReceiptsRepository
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ReceiptsRepository> _logger;
    private readonly bool _isPostgres;

    public ReceiptsRepository(ApplicationDbContext context, ILogger<ReceiptsRepository> logger)
    {
        _context = context;
        _logger = logger;
        _isPostgres = context.Database.IsNpgsql();
    }

    public async Task<string> InsertAsync(Receipt receipt)
    {
        var connection = _context.Database.GetDbConnection();

        var sql = _isPostgres
            ? @"INSERT INTO ""Receipts"" (""Id"", ""ProofId"", ""Json"", ""PdfPath"", ""ReceiptHash"", ""Signature"", ""SignerPubKey"", ""CreatedAt"")
                VALUES (@Id, @ProofId, @Json, @PdfPath, @ReceiptHash, @Signature, @SignerPubKey, @CreatedAt)"
            : @"INSERT INTO Receipts (Id, ProofId, Json, PdfPath, ReceiptHash, Signature, SignerPubKey, CreatedAt)
                VALUES (@Id, @ProofId, @Json, @PdfPath, @ReceiptHash, @Signature, @SignerPubKey, @CreatedAt)";

        await connection.ExecuteAsync(sql, receipt);

        return receipt.Id;
    }

    public async Task<Receipt?> GetByProofIdAsync(string proofId)
    {
        var connection = _context.Database.GetDbConnection();

        var sql = _isPostgres
            ? @"SELECT ""Id"", ""ProofId"", ""Json"", ""PdfPath"", ""ReceiptHash"", ""Signature"", ""SignerPubKey"", ""CreatedAt""
                FROM ""Receipts"" WHERE ""ProofId"" = @ProofId"
            : @"SELECT Id, ProofId, Json, PdfPath, ReceiptHash, Signature, SignerPubKey, CreatedAt
                FROM Receipts WHERE ProofId = @ProofId";

        return await connection.QueryFirstOrDefaultAsync<Receipt>(sql, new { ProofId = proofId });
    }
}
