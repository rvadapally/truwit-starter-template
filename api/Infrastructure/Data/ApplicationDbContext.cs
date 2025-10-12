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
    
    // C2PA entities
    public DbSet<Proof> Proofs { get; set; } = null!;
    public DbSet<Asset> Assets { get; set; } = null!;
    public DbSet<Receipt> Receipts { get; set; } = null!;
    public DbSet<LinkIndex> LinkIndex { get; set; } = null!;

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
        
        // Configure C2PA entities
        modelBuilder.Entity<Proof>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasMaxLength(50);
            entity.Property(e => e.TrustmarkId).HasMaxLength(50).IsRequired();
            entity.Property(e => e.AssetId).HasMaxLength(50);
            entity.Property(e => e.ReceiptId).HasMaxLength(50);
            entity.HasIndex(e => e.TrustmarkId).IsUnique();
            entity.HasIndex(e => e.AssetId);
        });
        
        modelBuilder.Entity<Asset>(entity =>
        {
            entity.HasKey(e => e.AssetId);
            entity.Property(e => e.AssetId).HasMaxLength(50);
            entity.Property(e => e.Sha256).HasMaxLength(64).IsRequired();
            entity.Property(e => e.MediaType).HasMaxLength(100);
            entity.HasIndex(e => e.Sha256).IsUnique();
        });
        
        modelBuilder.Entity<Receipt>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasMaxLength(50);
            entity.Property(e => e.ProofId).HasMaxLength(50).IsRequired();
            entity.Property(e => e.ReceiptHash).HasMaxLength(64);
            entity.HasIndex(e => e.ProofId);
        });
        
        modelBuilder.Entity<LinkIndex>(entity =>
        {
            entity.HasKey(e => new { e.Platform, e.CanonicalId });
            entity.Property(e => e.Platform).HasMaxLength(50).IsRequired();
            entity.Property(e => e.CanonicalId).HasMaxLength(200).IsRequired();
            entity.Property(e => e.ProofId).HasMaxLength(50).IsRequired();
        });
    }
}
