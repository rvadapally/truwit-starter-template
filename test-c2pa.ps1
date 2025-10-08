# Test C2PA functionality with downloaded test files

Write-Host "Testing C2PA functionality with downloaded test files..." -ForegroundColor Green

# Wait for API to start
Write-Host "Waiting for API to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Test health endpoint
Write-Host "`n1. Testing health endpoint..." -ForegroundColor Cyan
try {
    $healthResponse = Invoke-WebRequest -Uri "http://localhost:5080/health/tools" -UseBasicParsing
    Write-Host "Health check successful:" -ForegroundColor Green
    Write-Host $healthResponse.Content
}
catch {
    Write-Host "Health check failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Trying alternative port..." -ForegroundColor Yellow
    try {
        $healthResponse = Invoke-WebRequest -Uri "http://localhost:5040/health/tools" -UseBasicParsing
        Write-Host "Health check successful on port 5040:" -ForegroundColor Green
        Write-Host $healthResponse.Content
    }
    catch {
        Write-Host "Health check failed on both ports: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# Test image upload (C2PA JPEG)
Write-Host "`n2. Testing C2PA image upload..." -ForegroundColor Cyan
$imagePath = "api/docs/testfiles/public-testfiles-main/image/jpeg/adobe-20220124-C.jpg"
if (Test-Path $imagePath) {
    Write-Host "Found test image: $imagePath" -ForegroundColor Green
    
    # Create multipart form data
    $boundary = [System.Guid]::NewGuid().ToString()
    $LF = "`r`n"
    
    $fileBytes = [System.IO.File]::ReadAllBytes($imagePath)
    $fileEnc = [System.Text.Encoding]::GetEncoding('UTF-8').GetString($fileBytes)
    
    $bodyLines = (
        "--$boundary",
        "Content-Disposition: form-data; name=`"file`"; filename=`"adobe-20220124-C.jpg`"",
        "Content-Type: image/jpeg",
        "",
        $fileEnc,
        "--$boundary--",
        ""
    ) -join $LF
    
    try {
        $uploadResponse = Invoke-WebRequest -Uri "http://localhost:5080/v1/proofs/file-upload" -Method POST -Body $bodyLines -ContentType "multipart/form-data; boundary=$boundary" -UseBasicParsing
        Write-Host "Image upload successful:" -ForegroundColor Green
        Write-Host $uploadResponse.Content
    }
    catch {
        Write-Host "Image upload failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Red
    }
}
else {
    Write-Host "Test image not found: $imagePath" -ForegroundColor Red
}

# Test video upload (C2PA MP4)
Write-Host "`n3. Testing C2PA video upload..." -ForegroundColor Cyan
$videoPath = "api/docs/testfiles/public-testfiles-main/video/mp4/truepic-20230212-zoetrope.mp4"
if (Test-Path $videoPath) {
    Write-Host "Found test video: $videoPath" -ForegroundColor Green
    
    # For large files, we'll just test the endpoint exists
    try {
        $testResponse = Invoke-WebRequest -Uri "http://localhost:5080/v1/proofs/file-upload" -Method OPTIONS -UseBasicParsing
        Write-Host "Video upload endpoint accessible" -ForegroundColor Green
    }
    catch {
        Write-Host "Video upload endpoint test failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}
else {
    Write-Host "Test video not found: $videoPath" -ForegroundColor Red
}

Write-Host "`nC2PA testing completed!" -ForegroundColor Green
