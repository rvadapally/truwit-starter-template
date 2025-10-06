using Microsoft.EntityFrameworkCore;
using Microsoft.Data.Sqlite;

namespace HumanProof.Api.Infrastructure.Data;

/// <summary>
/// Service to run SQL migrations from files
/// </summary>
public class SqlMigrationRunner
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<SqlMigrationRunner> _logger;
    private readonly string _migrationsPath;

    public SqlMigrationRunner(ApplicationDbContext context, ILogger<SqlMigrationRunner> logger)
    {
        _context = context;
        _logger = logger;
        _migrationsPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Data", "Migrations");
    }

    /// <summary>
    /// Runs all pending SQL migration files
    /// </summary>
    public async Task RunPendingMigrationsAsync()
    {
        try
        {
            if (!Directory.Exists(_migrationsPath))
            {
                _logger.LogInformation("Migrations directory not found: {Path}", _migrationsPath);
                return;
            }

            var migrationFiles = Directory.GetFiles(_migrationsPath, "*.sql")
                .OrderBy(f => Path.GetFileName(f))
                .ToList();

            if (!migrationFiles.Any())
            {
                _logger.LogInformation("No SQL migration files found in {Path}", _migrationsPath);
                return;
            }

            var connectionString = _context.Database.GetConnectionString();
            if (string.IsNullOrEmpty(connectionString))
            {
                _logger.LogError("Database connection string is null or empty");
                return;
            }

            using var connection = new SqliteConnection(connectionString);
            await connection.OpenAsync();

            // Create migrations tracking table
            await CreateMigrationsTableAsync(connection);

            foreach (var migrationFile in migrationFiles)
            {
                var fileName = Path.GetFileName(migrationFile);
                if (await IsMigrationExecutedAsync(connection, fileName))
                {
                    _logger.LogDebug("Migration {FileName} already executed, skipping", fileName);
                    continue;
                }

                _logger.LogInformation("Executing migration: {FileName}", fileName);
                
                var sql = await File.ReadAllTextAsync(migrationFile);
                await ExecuteMigrationAsync(connection, fileName, sql);
                
                _logger.LogInformation("Successfully executed migration: {FileName}", fileName);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error running SQL migrations");
            throw;
        }
    }

    private async Task CreateMigrationsTableAsync(SqliteConnection connection)
    {
        var createTableSql = @"
            CREATE TABLE IF NOT EXISTS __SqlMigrations (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                FileName TEXT NOT NULL UNIQUE,
                ExecutedAt TEXT NOT NULL DEFAULT (datetime('now'))
            )";

        using var command = new SqliteCommand(createTableSql, connection);
        await command.ExecuteNonQueryAsync();
    }

    private async Task<bool> IsMigrationExecutedAsync(SqliteConnection connection, string fileName)
    {
        var checkSql = "SELECT COUNT(*) FROM __SqlMigrations WHERE FileName = @fileName";
        using var command = new SqliteCommand(checkSql, connection);
        command.Parameters.AddWithValue("@fileName", fileName);
        
        var count = Convert.ToInt32(await command.ExecuteScalarAsync());
        return count > 0;
    }

    private async Task ExecuteMigrationAsync(SqliteConnection connection, string fileName, string sql)
    {
        using var transaction = connection.BeginTransaction();
        try
        {
            // Execute the migration SQL
            using var command = new SqliteCommand(sql, connection, transaction);
            await command.ExecuteNonQueryAsync();

            // Record the migration as executed
            var recordSql = "INSERT INTO __SqlMigrations (FileName) VALUES (@fileName)";
            using var recordCommand = new SqliteCommand(recordSql, connection, transaction);
            recordCommand.Parameters.AddWithValue("@fileName", fileName);
            await recordCommand.ExecuteNonQueryAsync();

            transaction.Commit();
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }
}
