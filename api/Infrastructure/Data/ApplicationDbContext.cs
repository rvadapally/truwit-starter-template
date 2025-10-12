using Microsoft.EntityFrameworkCore;
using HumanProof.Api.Domain.Entities;

namespace HumanProof.Api.Infrastructure.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<VerificationProof> VerificationProofs { get; set; } = null!;
    public DbSet<VerificationMetadata> VerificationMetadata { get; set; } = null!;
    public DbSet<VerificationRequest> VerificationRequests { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure VerificationProof
        modelBuilder.Entity<VerificationProof>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ProofId).IsRequired().HasMaxLength(50);
            entity.Property(e => e.ContentHash).IsRequired().HasMaxLength(64);
            entity.Property(e => e.PerceptualHash).IsRequired().HasMaxLength(64);
            entity.Property(e => e.Signature).IsRequired().HasMaxLength(512);
            
            entity.HasIndex(e => e.ProofId).IsUnique();
            entity.HasIndex(e => e.ContentHash);
            entity.HasIndex(e => e.CreatedAt);
            
            // Global query filter for soft deletes
            entity.HasQueryFilter(e => !e.IsDeleted);
            
            // Relationship with metadata
            entity.HasOne(e => e.Metadata)
                  .WithOne(e => e.Proof)
                  .HasForeignKey<VerificationProof>(e => e.MetadataId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Configure VerificationMetadata
        modelBuilder.Entity<VerificationMetadata>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Prompt).HasMaxLength(2000);
            entity.Property(e => e.ToolName).HasMaxLength(100);
            entity.Property(e => e.ToolVersion).HasMaxLength(50);
            entity.Property(e => e.LikenessConsent).HasMaxLength(1000);
            
            entity.HasIndex(e => e.CreatedAt);
        });

        // Configure VerificationRequest
        modelBuilder.Entity<VerificationRequest>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Url).HasMaxLength(2000);
            entity.Property(e => e.FileName).HasMaxLength(500);
            entity.Property(e => e.ContentType).HasMaxLength(100);
            entity.Property(e => e.ErrorMessage).HasMaxLength(1000);
            
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => e.Status);
            
            // Relationship with proof
            entity.HasOne(e => e.Proof)
                  .WithMany()
                  .HasForeignKey(e => e.ProofId)
                  .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
