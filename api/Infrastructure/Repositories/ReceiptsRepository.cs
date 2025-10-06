using Dapper;
using HumanProof.Api.Domain.Entities;
using HumanProof.Api.Domain.Interfaces;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Configuration;

namespace HumanProof.Api.Infrastructure.Repositories;

/// <summary>
/// Dapper-based Receipts repository
/// </summary>
public class ReceiptsRepository : IReceiptsRepository
{
    private readonly string _connectionString;
    private readonly ILogger<ReceiptsRepository> _logger;

    public ReceiptsRepository(IConfiguration configuration, ILogger<ReceiptsRepository> logger)
    {
        _connectionString = configuration.GetConnectionString("Sqlite") ?? "Data Source=truwit.db";
        _logger = logger;
    }

    public async Task<string> InsertAsync(Receipt receipt)
    {
        using var connection = new SqliteConnection(_connectionString);
        
        var sql = @"
            INSERT INTO Receipts (Id, ProofId, Json, PdfPath, ReceiptHash, Signature, SignerPubKey, CreatedAt)
            VALUES (@Id, @ProofId, @Json, @PdfPath, @ReceiptHash, @Signature, @SignerPubKey, @CreatedAt)";
        
        await connection.ExecuteAsync(sql, receipt);
        
        return receipt.Id;
    }

    public async Task<Receipt?> GetByProofIdAsync(string proofId)
    {
        using var connection = new SqliteConnection(_connectionString);
        
        var sql = @"
            SELECT Id, ProofId, Json, PdfPath, ReceiptHash, Signature, SignerPubKey, CreatedAt
            FROM Receipts 
            WHERE ProofId = @ProofId";
        
        return await connection.QueryFirstOrDefaultAsync<Receipt>(sql, new { ProofId = proofId });
    }
}
