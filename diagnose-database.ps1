# Copy database from Docker and inspect it
Write-Host "Copying database from Docker container..." -ForegroundColor Cyan
docker cp api-api-1:/app/truwit.db ./truwit-copy.db

if (Test-Path ./truwit-copy.db) {
    Write-Host "Database copied successfully!" -ForegroundColor Green
    
    # Install sqlite3 if needed
    $sqlitePath = "sqlite3.exe"
    if (-not (Get-Command $sqlitePath -ErrorAction SilentlyContinue)) {
        Write-Host "SQLite3 not found in PATH. Trying to use powershell System.Data.SQLite..." -ForegroundColor Yellow
        
        # Check if we have any proofs
        Write-Host "`nAttempting to read database with .NET..." -ForegroundColor Cyan
        
        Add-Type -Path "C:\Windows\Microsoft.NET\assembly\GAC_MSIL\System.Data\v4.0_4.0.0.0__b77a5c561934e089\System.Data.dll"
        
        $connectionString = "Data Source=./truwit-copy.db"
        $connection = New-Object System.Data.SQLite.SQLiteConnection($connectionString)
        
        try {
            $connection.Open()
            
            # Check if Proofs table exists
            $cmd = $connection.CreateCommand()
            $cmd.CommandText = "SELECT name FROM sqlite_master WHERE type='table' AND name='Proofs'"
            $result = $cmd.ExecuteScalar()
            
            if ($result) {
                Write-Host "✅ Proofs table exists" -ForegroundColor Green
                
                # Count proofs
                $cmd.CommandText = "SELECT COUNT(*) FROM Proofs"
                $count = $cmd.ExecuteScalar()
                Write-Host "Total proofs in database: $count" -ForegroundColor Cyan
                
                # Show recent proofs
                $cmd.CommandText = "SELECT Id, TrustmarkId, CreatedAt FROM Proofs ORDER BY CreatedAt DESC LIMIT 5"
                $reader = $cmd.ExecuteReader()
                
                Write-Host "`nRecent proofs:" -ForegroundColor Cyan
                while ($reader.Read()) {
                    Write-Host "  TrustmarkId: $($reader['TrustmarkId']), Id: $($reader['Id'])"
                }
                $reader.Close()
            } else {
                Write-Host "❌ Proofs table does NOT exist!" -ForegroundColor Red
            }
            
            $connection.Close()
        }
        catch {
            Write-Host "Error reading database: $_" -ForegroundColor Red
        }
    }
} else {
    Write-Host "Failed to copy database!" -ForegroundColor Red
}

