using Microsoft.EntityFrameworkCore;
using HumanProof.Api.Domain.Entities;
using HumanProof.Api.Domain.Interfaces;
using HumanProof.Api.Infrastructure.Data;

namespace HumanProof.Api.Infrastructure.Repositories;

public class PostgresVerificationRepository : IVerificationRepository
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<PostgresVerificationRepository> _logger;

    public PostgresVerificationRepository(
        ApplicationDbContext context,
        ILogger<PostgresVerificationRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<VerificationProof?> GetByProofIdAsync(string proofId)
    {
        try
        {
            return await _context.VerificationProofs
                .Include(p => p.Metadata)
                .FirstOrDefaultAsync(p => p.ProofId == proofId && !p.IsDeleted);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving proof by ID: {ProofId}", proofId);
            throw;
        }
    }

    public async Task<VerificationProof?> GetByIdAsync(Guid id)
    {
        try
        {
            return await _context.VerificationProofs
                .Include(p => p.Metadata)
                .FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving proof by GUID: {Id}", id);
            throw;
        }
    }

    public async Task<IEnumerable<VerificationProof>> GetAllAsync(int page, int pageSize)
    {
        try
        {
            return await _context.VerificationProofs
                .Include(p => p.Metadata)
                .Where(p => !p.IsDeleted)
                .OrderByDescending(p => p.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving all proofs");
            throw;
        }
    }

    public async Task<VerificationProof> CreateAsync(VerificationProof proof)
    {
        try
        {
            proof.CreatedAt = DateTime.Now;
            proof.UpdatedAt = DateTime.Now;
            proof.IsDeleted = false;

            _context.VerificationProofs.Add(proof);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created proof {ProofId} in database", proof.ProofId);
            return proof;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating proof {ProofId}", proof.ProofId);
            throw;
        }
    }

    public async Task<VerificationProof> UpdateAsync(VerificationProof proof)
    {
        try
        {
            proof.UpdatedAt = DateTime.Now;

            _context.VerificationProofs.Update(proof);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated proof {ProofId} in database", proof.ProofId);
            return proof;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating proof {ProofId}", proof.ProofId);
            throw;
        }
    }

    public async Task DeleteAsync(Guid id)
    {
        try
        {
            var proof = await _context.VerificationProofs.FindAsync(id);
            if (proof != null)
            {
                proof.IsDeleted = true;
                proof.UpdatedAt = DateTime.Now;
                await _context.SaveChangesAsync();

                _logger.LogInformation("Soft deleted proof {ProofId} from database", proof.ProofId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting proof {Id}", id);
            throw;
        }
    }

    public async Task<VerificationRequest> CreateVerificationRequestAsync(VerificationRequest request)
    {
        try
        {
            request.CreatedAt = DateTime.Now;
            request.UpdatedAt = DateTime.Now;

            _context.VerificationRequests.Add(request);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created verification request {RequestId} in database", request.Id);
            return request;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating verification request {RequestId}", request.Id);
            throw;
        }
    }

    public async Task<bool> ExistsAsync(string proofId)
    {
        try
        {
            return await _context.VerificationProofs
                .AnyAsync(p => p.ProofId == proofId && !p.IsDeleted);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking if proof exists: {ProofId}", proofId);
            throw;
        }
    }
}
