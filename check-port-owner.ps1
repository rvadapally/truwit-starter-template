# Check which process owns port 5000
Write-Host "`nChecking port 5000 ownership...`n" -ForegroundColor Cyan

$connections = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue

foreach ($conn in $connections) {
    $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
    
    Write-Host "Port: 5000" -ForegroundColor Yellow
    Write-Host "Address: $($conn.LocalAddress)" -ForegroundColor Gray
    Write-Host "State: $($conn.State)" -ForegroundColor Gray
    Write-Host "Process ID: $($conn.OwningProcess)" -ForegroundColor Gray
    Write-Host "Process Name: $($proc.Name)" -ForegroundColor White
    Write-Host "Process Path: $($proc.Path)" -ForegroundColor Gray
    Write-Host "Process Start: $($proc.StartTime)" -ForegroundColor Gray
    Write-Host ""
}


