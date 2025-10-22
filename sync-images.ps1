#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Syncs images from app/src/assets to public/images
.DESCRIPTION
    Copies all images from the source of truth (app/src/assets) 
    to the Astro public folder (public/images) to keep them in sync
.EXAMPLE
    .\sync-images.ps1
#>

Write-Host ""
Write-Host "🖼️  Image Sync Tool" -ForegroundColor Cyan
Write-Host "==================" -ForegroundColor Cyan
Write-Host ""

$source = "app\src\assets"
$destination = "public\images"

if (-not (Test-Path $source)) {
    Write-Host "❌ Source folder not found: $source" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $destination)) {
    Write-Host "📁 Creating destination folder: $destination" -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $destination -Force | Out-Null
}

Write-Host "📂 Source: $source" -ForegroundColor Cyan
Write-Host "📂 Destination: $destination" -ForegroundColor Cyan
Write-Host ""

Write-Host "🔄 Syncing images..." -ForegroundColor Cyan

try {
    # Copy all files from source to destination
    $files = Get-ChildItem -Path $source -File
    $count = 0
    
    foreach ($file in $files) {
        Copy-Item -Path $file.FullName -Destination $destination -Force
        Write-Host "  ✅ $($file.Name)" -ForegroundColor Green
        $count++
    }
    
    Write-Host ""
    Write-Host "✅ Successfully synced $count file(s)" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Review changes with: git status" -ForegroundColor Gray
    Write-Host "  2. Commit both folders together" -ForegroundColor Gray
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "❌ Sync failed: $_" -ForegroundColor Red
    exit 1
}

