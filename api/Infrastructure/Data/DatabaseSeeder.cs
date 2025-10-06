using HumanProof.Api.Domain.Entities;
using HumanProof.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace HumanProof.Api.Infrastructure.Data;

public static class DatabaseSeeder
{
    public static async Task SeedAsync(ApplicationDbContext context)
    {
        // Check if we already have data
        if (await context.VerificationProofs.AnyAsync())
        {
            return; // Database already seeded
        }

        var testProofs = new[]
        {
            new VerificationProof
            {
                Id = Guid.NewGuid(),
                ProofId = "GKCDxhkC",
                ContentHash = "test-content-hash-12345",
                PerceptualHash = "test-perceptual-hash-67890",
                Signature = "test-signature-abcdef",
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now,
                IsDeleted = false,
                Metadata = new VerificationMetadata
                {
                    Id = Guid.NewGuid(),
                    Prompt = "A cat dancing in a field",
                    ToolName = "Sora v2",
                    ToolVersion = "2.0",
                    License = LicenseType.CreatorOwned,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                }
            },
            new VerificationProof
            {
                Id = Guid.NewGuid(),
                ProofId = "rAZEq8ma",
                ContentHash = "test-content-hash-67890",
                PerceptualHash = "test-perceptual-hash-12345",
                Signature = "test-signature-fedcba",
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now,
                IsDeleted = false,
                Metadata = new VerificationMetadata
                {
                    Id = Guid.NewGuid(),
                    Prompt = "A dog playing in the park",
                    ToolName = "Midjourney",
                    ToolVersion = "5.2",
                    License = LicenseType.BrandOwned,
                    CreatedAt = DateTime.Now,
                    UpdatedAt = DateTime.Now
                }
            },
            new VerificationProof
            {
                Id = Guid.NewGuid(),
                ProofId = "LtYbVpBa",
                ContentHash = "real-content-hash-abcdef123456",
                PerceptualHash = "real-perceptual-hash-789012",
                Signature = "real-signature-xyz789",
                CreatedAt = DateTime.Now.AddMinutes(-30),
                UpdatedAt = DateTime.Now.AddMinutes(-30),
                IsDeleted = false,
                Metadata = new VerificationMetadata
                {
                    Id = Guid.NewGuid(),
                    Prompt = "A beautiful sunset over mountains",
                    ToolName = "DALL-E 3",
                    ToolVersion = "3.0",
                    License = LicenseType.Public,
                    CreatedAt = DateTime.Now.AddMinutes(-30),
                    UpdatedAt = DateTime.Now.AddMinutes(-30)
                }
            }
        };

        // Set the metadata relationship
        foreach (var proof in testProofs)
        {
            proof.MetadataId = proof.Metadata.Id;
            context.VerificationProofs.Add(proof);
        }

        await context.SaveChangesAsync();
    }
}
