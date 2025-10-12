$body = @{ Url = "https://youtu.be/NH2_-4iZEn8" } | ConvertTo-Json

Write-Host "Sending request to: http://localhost:5000/v1/proofs/url"
Write-Host "Body: $body"
Write-Host ""

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/v1/proofs/url" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 120
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host "Status Code: $($response.StatusCode)"
    Write-Host "Response:"
    Write-Host $response.Content
}
catch {
    Write-Host "FAILED!" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)"
    
    try {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $responseBody = $reader.ReadToEnd()
        Write-Host "Error Response:"
        Write-Host $responseBody
        $reader.Close()
        $stream.Close()
    }
    catch {
        Write-Host "Could not read error response: $_"
    }
}

