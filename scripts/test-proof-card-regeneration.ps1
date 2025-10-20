param(
  [string]$ApiUrl = "https://truwit-starter-template-production.up.railway.app",
  [object[]]$Ids = @('TW-TEST-1234','TW-DEMO-0001','TW-F82747F8'),
  [int]$Size = 800,
  [int]$PollRetries = 8,
  [int]$PollDelayMs = 300
)

function Test-Head200 {
  param([string]$Url)
  try {
    $resp = Invoke-WebRequest -Uri $Url -Method Head -TimeoutSec 15 -ErrorAction Stop
    return $resp.StatusCode -ge 200 -and $resp.StatusCode -lt 300
  } catch {
    return $false
  }
}

Write-Host "\n== Proof Card Regeneration Test ==" -ForegroundColor Cyan
Write-Host "API: $ApiUrl" -ForegroundColor DarkCyan
Write-Host "IDs: $($Ids -join ', ')  Size: $Size" -ForegroundColor DarkCyan

$failures = @()

foreach ($raw in $Ids) {
  # Normalize input to string and also test with/without TW- prefix in regen
  $id = $raw.ToString()
  if ($id -match '^TW-') {
    $prefixed = $id
    $bare = $id.Substring(3)
  } else {
    $prefixed = "TW-$id"
    $bare = $id
  }

  $assetUrl = "$ApiUrl/assets/proof/$prefixed-$Size.png"
  Write-Host "\n-- ID: $prefixed" -ForegroundColor Yellow
  Write-Host "Checking asset: $assetUrl" -ForegroundColor Gray

  if (Test-Head200 $assetUrl) {
    Write-Host "OK: asset exists" -ForegroundColor Green
    continue
  }

  Write-Host "MISS: triggering regeneration (prefixed)..." -ForegroundColor DarkYellow
  try {
    # Request PNG; ignore body
    Invoke-WebRequest -Uri "$ApiUrl/cards/proof/$prefixed-$Size.png" -Method Get -TimeoutSec 30 -OutFile "$env:TEMP\card_$prefixed-$Size.png" -ErrorAction SilentlyContinue | Out-Null
  } catch { }

  # Poll for appearance
  $ok = $false
  for ($i=1; $i -le $PollRetries; $i++) {
    Start-Sleep -Milliseconds $PollDelayMs
    if (Test-Head200 $assetUrl) { $ok = $true; break }
  }

  if (-not $ok) {
    Write-Host "Still missing; trying regeneration with bare id: $bare" -ForegroundColor DarkYellow
    try {
      Invoke-WebRequest -Uri "$ApiUrl/cards/proof/$bare-$Size.png" -Method Get -TimeoutSec 30 -OutFile "$env:TEMP\card_$bare-$Size.png" -ErrorAction SilentlyContinue | Out-Null
    } catch { }
    for ($i=1; $i -le $PollRetries; $i++) {
      Start-Sleep -Milliseconds $PollDelayMs
      if (Test-Head200 $assetUrl) { $ok = $true; break }
    }
  }

  if ($ok) {
    Write-Host "OK after regen: $assetUrl" -ForegroundColor Green
  } else {
    Write-Host "FAIL: asset not available after regen attempts -> $assetUrl" -ForegroundColor Red
    $failures += $prefixed
  }
}

if ($failures.Count -gt 0) {
  Write-Host "\nFailures: $($failures -join ', ')" -ForegroundColor Red
  exit 1
} else {
  Write-Host "\nAll proof cards verified." -ForegroundColor Green
}
