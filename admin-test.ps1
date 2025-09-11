Write-Host "Platform Admin Test" -ForegroundColor Green
Write-Host ""

# Test backend API
Write-Host "1. Testing admin login API..."
try {
    $body = '{"username":"admin","password":"123456"}'
    $response = Invoke-WebRequest -Uri "http://localhost:5603/api/auth/admin/login" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
    Write-Host "   Success: Login API (Status: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "   Failed: Login API" -ForegroundColor Red
}

# Test frontend
Write-Host ""
Write-Host "2. Testing frontend page..."
try {
    $frontend = Invoke-WebRequest -Uri "http://localhost:5601" -UseBasicParsing -TimeoutSec 5
    Write-Host "   Success: Frontend page (Status: $($frontend.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "   Failed: Frontend page" -ForegroundColor Red
}

Write-Host ""
Write-Host "Test completed!"
Write-Host "Admin Portal: http://localhost:5601"
Write-Host "Login: admin / 123456"
Write-Host "Click preview button above to open admin portal"