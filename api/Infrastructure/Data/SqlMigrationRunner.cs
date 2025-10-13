using Microsoft.EntityFrameworkCore;
using System.Data.Common;

namespace HumanProof.Api.Infrastructure.Data;

/// <summary>
/// Service to run SQL migrations from files
/// </summary>
public class SqlMigrationRunner
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<SqlMigrationRunner> _logger;
    private readonly string _migrationsPath;
    private readonly bool _isPostgres;

    public SqlMigrationRunner(ApplicationDbContext context, ILogger<SqlMigrationRunner> logger)
    {
        _context = context;
        _logger = logger;
        // Look for migrations in the project root, not the bin directory
        var projectRoot = Directory.GetCurrentDirectory();
        _migrationsPath = Path.Combine(projectRoot, "Data", "Migrations");
        
        // Detect database provider
        _isPostgres = _context.Database.IsNpgsql();
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

            _logger.LogInformation("Running SQL migrations...");

            // Use the database connection from the context
            var connection = _context.Database.GetDbConnection();
            var shouldCloseConnection = connection.State != System.Data.ConnectionState.Open;
            
            if (shouldCloseConnection)
            {
                await connection.OpenAsync();
            }

            try
            {
                // Create migrations tracking table
                await CreateMigrationsTableAsync(connection);

            foreach (var migrationFile in migrationFiles)
            {
                var fileName = Path.GetFileName(migrationFile);
                
                // Skip SQLite-specific migrations when using PostgreSQL
                if (_isPostgres && !fileName.Contains("postgres", StringComparison.OrdinalIgnoreCase))
                {
                    _logger.LogDebug("Skipping SQLite migration {FileName} (using PostgreSQL)", fileName);
                    continue;
                }
                
                // Skip PostgreSQL-specific migrations when using SQLite
                if (!_isPostgres && fileName.Contains("postgres", StringComparison.OrdinalIgnoreCase))
                {
                    _logger.LogDebug("Skipping PostgreSQL migration {FileName} (using SQLite)", fileName);
                    continue;
                }
                
                if (await IsMigrationExecutedAsync(connection, fileName))
                {
                    _logger.LogDebug("Migration {FileName} already executed, skipping", fileName);
                    continue;
                }

                _logger.LogInformation("✅ Migration: {FileName} - EXECUTING", fileName);

                var sql = await File.ReadAllTextAsync(migrationFile);
                await ExecuteMigrationAsync(connection, fileName, sql);

                _logger.LogInformation("✅ Migration: {FileName} - SUCCESS", fileName);
            }
                
                _logger.LogInformation("✅ All migrations completed successfully");
            }
            finally
            {
                if (shouldCloseConnection)
                {
                    await connection.CloseAsync();
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error running SQL migrations");
            throw;
        }
    }

    private async Task CreateMigrationsTableAsync(DbConnection connection)
    {
        var createTableSql = _isPostgres 
            ? @"CREATE TABLE IF NOT EXISTS ""__SqlMigrations"" (
                    ""Id"" SERIAL PRIMARY KEY,
                    ""FileName"" TEXT NOT NULL UNIQUE,
                    ""ExecutedAt"" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                )"
            : @"CREATE TABLE IF NOT EXISTS __SqlMigrations (
                    Id INTEGER PRIMARY KEY AUTOINCREMENT,
                    FileName TEXT NOT NULL UNIQUE,
                    ExecutedAt TEXT NOT NULL DEFAULT (datetime('now'))
                )";

        using var command = connection.CreateCommand();
        command.CommandText = createTableSql;
        await command.ExecuteNonQueryAsync();
    }

    private async Task<bool> IsMigrationExecutedAsync(DbConnection connection, string fileName)
    {
        var checkSql = _isPostgres
            ? @"SELECT COUNT(*) FROM ""__SqlMigrations"" WHERE ""FileName"" = @fileName"
            : "SELECT COUNT(*) FROM __SqlMigrations WHERE FileName = @fileName";
            
        using var command = connection.CreateCommand();
        command.CommandText = checkSql;
        
        var parameter = command.CreateParameter();
        parameter.ParameterName = "@fileName";
        parameter.Value = fileName;
        command.Parameters.Add(parameter);

        var result = await command.ExecuteScalarAsync();
        var count = Convert.ToInt32(result);
        return count > 0;
    }

    private async Task ExecuteMigrationAsync(DbConnection connection, string fileName, string sql)
    {
        using var transaction = await connection.BeginTransactionAsync();
        try
        {
            // Execute the migration SQL
            using var command = connection.CreateCommand();
            command.Transaction = transaction;
            command.CommandText = sql;
            await command.ExecuteNonQueryAsync();

            // Record the migration as executed
            var recordSql = _isPostgres
                ? @"INSERT INTO ""__SqlMigrations"" (""FileName"") VALUES (@fileName)"
                : "INSERT INTO __SqlMigrations (FileName) VALUES (@fileName)";
                
            using var recordCommand = connection.CreateCommand();
            recordCommand.Transaction = transaction;
            recordCommand.CommandText = recordSql;
            
            var parameter = recordCommand.CreateParameter();
            parameter.ParameterName = "@fileName";
            parameter.Value = fileName;
            recordCommand.Parameters.Add(parameter);
            
            await recordCommand.ExecuteNonQueryAsync();

            await transaction.CommitAsync();
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
}
