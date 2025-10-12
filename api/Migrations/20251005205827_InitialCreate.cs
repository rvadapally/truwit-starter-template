using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HumanProof.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "VerificationMetadata",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Prompt = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    ToolName = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    ToolVersion = table.Column<string>(type: "TEXT", maxLength: 50, nullable: true),
                    LikenessConsent = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    License = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VerificationMetadata", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "VerificationProofs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    ProofId = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    ContentHash = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    PerceptualHash = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    Signature = table.Column<string>(type: "TEXT", maxLength: 512, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    IsDeleted = table.Column<bool>(type: "INTEGER", nullable: false),
                    MetadataId = table.Column<Guid>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VerificationProofs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VerificationProofs_VerificationMetadata_MetadataId",
                        column: x => x.MetadataId,
                        principalTable: "VerificationMetadata",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "VerificationRequests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Url = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: true),
                    FileName = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    FileSize = table.Column<long>(type: "INTEGER", nullable: true),
                    ContentType = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    ErrorMessage = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ProofId = table.Column<Guid>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VerificationRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VerificationRequests_VerificationProofs_ProofId",
                        column: x => x.ProofId,
                        principalTable: "VerificationProofs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_VerificationMetadata_CreatedAt",
                table: "VerificationMetadata",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_VerificationProofs_ContentHash",
                table: "VerificationProofs",
                column: "ContentHash");

            migrationBuilder.CreateIndex(
                name: "IX_VerificationProofs_CreatedAt",
                table: "VerificationProofs",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_VerificationProofs_MetadataId",
                table: "VerificationProofs",
                column: "MetadataId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_VerificationProofs_ProofId",
                table: "VerificationProofs",
                column: "ProofId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_VerificationRequests_CreatedAt",
                table: "VerificationRequests",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_VerificationRequests_ProofId",
                table: "VerificationRequests",
                column: "ProofId");

            migrationBuilder.CreateIndex(
                name: "IX_VerificationRequests_Status",
                table: "VerificationRequests",
                column: "Status");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "VerificationRequests");

            migrationBuilder.DropTable(
                name: "VerificationProofs");

            migrationBuilder.DropTable(
                name: "VerificationMetadata");
        }
    }
}
