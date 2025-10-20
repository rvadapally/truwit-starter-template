param(
  [Parameter(Mandatory=$false)]
  [object[]]$Ids = @('TW-TEST-1234','TW-DEMO-0001'),
  [Parameter(Mandatory=$false)]
  [object[]]$Sizes = @(640,800,1024)
)

# Normalize inputs: support comma-separated strings and arrays
$Ids = @($Ids | ForEach-Object {
  if ($_ -is [string]) { $_.Split(',') } else { $_ }
}) | Where-Object { $_ -and $_.ToString().Trim() -ne '' } | ForEach-Object { $_.ToString().Trim() }

$Sizes = @($Sizes | ForEach-Object {
  if ($_ -is [string]) { $_.Split(',') } else { $_ }
}) | ForEach-Object { [int]($_.ToString().Trim()) }

Write-Host "Generating proof cards..." -ForegroundColor Cyan

$toolDir = Join-Path $PSScriptRoot '..' | Join-Path -ChildPath 'tools/ProofCardGen'
Push-Location $toolDir
foreach ($id in $Ids) {
  foreach ($sz in $Sizes) {
    Write-Host " - $id @ ${sz}px" -ForegroundColor Yellow
    dotnet run -c Release -- $id $sz | Out-Host
  }
}
Pop-Location

Write-Host "Done. Images saved to api/wwwroot/assets/proof" -ForegroundColor Green
