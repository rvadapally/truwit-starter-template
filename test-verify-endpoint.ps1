$trustmarkId = "3aee4565"
$apiUrl = "http://localhost:5000"

Write-Host "Testing verify endpoint: $apiUrl/v1/proofs/verify/$trustmarkId"

try {
    $response = Invoke-RestMethod -Uri "$apiUrl/v1/proofs/verify/$trustmarkId" -Method GET -TimeoutSec 10
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host "Response:"
    $response | ConvertTo-Json -Depth 5
}
catch {
    Write-Host "FAILED!" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)"
    Write-Host "Error: $($_.Exception.Message)"
    
    if ($_.Exception.Response) {
        $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "Response Body:"
        Write-Host $errorBody
    }
}

