# PowerShell script to push changes
Write-Host "Adding changes to git..."
git add .

Write-Host "Committing changes..."
git commit -m "Fix badge loading issue - use correct API endpoint /v1/badge/{id}.svg"

Write-Host "Pushing to trigger builds..."
git push origin main

Write-Host "Deployment triggered! Builds should start automatically."
