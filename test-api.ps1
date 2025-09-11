# 测试管理后台API连接
Write-Host "🔥 开始测试管理后台API..." -ForegroundColor Green

# 测试后端健康检查
try {
    $healthCheck = Invoke-WebRequest -Uri "http://localhost:5603/api/auth/check" -Method GET -UseBasicParsing
    Write-Host "✅ 后端服务健康检查: OK (状态码: $($healthCheck.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "❌ 后端服务连接失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 测试管理员登录
try {
    $loginBody = @{
        username = "admin"
        password = "123456"
    } | ConvertTo-Json
    
    $loginResponse = Invoke-WebRequest -Uri "http://localhost:5603/api/auth/admin/login" -Method POST -Headers @{"Content-Type"="application/json"} -Body $loginBody -UseBasicParsing
    Write-Host "✅ 管理员登录测试: 成功 (状态码: $($loginResponse.StatusCode))" -ForegroundColor Green
    
    # 解析Token
    $responseData = $loginResponse.Content | ConvertFrom-Json
    $token = $responseData.access_token
    Write-Host "🔑 获取到访问令牌: $($token.Substring(0,20))..." -ForegroundColor Cyan
    
    # 测试商户列表API
    try {
        $merchantsResponse = Invoke-WebRequest -Uri "http://localhost:5603/api/merchants" -Method GET -Headers @{"Authorization"="Bearer $token"} -UseBasicParsing
        Write-Host "✅ 商户列表API: 成功 (状态码: $($merchantsResponse.StatusCode))" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ 商户列表API: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
    # 测试设备列表API
    try {
        $devicesResponse = Invoke-WebRequest -Uri "http://localhost:5603/api/devices" -Method GET -Headers @{"Authorization"="Bearer $token"} -UseBasicParsing
        Write-Host "✅ 设备列表API: 成功 (状态码: $($devicesResponse.StatusCode))" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ 设备列表API: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
    # 测试订单列表API
    try {
        $ordersResponse = Invoke-WebRequest -Uri "http://localhost:5603/api/orders" -Method GET -Headers @{"Authorization"="Bearer $token"} -UseBasicParsing
        Write-Host "✅ 订单列表API: 成功 (状态码: $($ordersResponse.StatusCode))" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ 订单列表API: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ 管理员登录失败: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎯 管理后台API测试完成!" -ForegroundColor Green
Write-Host "📱 平台管理后台地址: http://localhost:5601" -ForegroundColor Cyan
Write-Host "🔧 点击预览按钮打开管理后台界面进行功能测试" -ForegroundColor Yellow