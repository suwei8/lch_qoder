Write-Host "🔥 管理后台功能测试" -ForegroundColor Green
Write-Host ""

# 测试后端API
Write-Host "1. 测试管理员登录API..."
try {
    $body = '{"username":"admin","password":"123456"}'
    $response = Invoke-WebRequest -Uri "http://localhost:5603/api/auth/admin/login" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
    Write-Host "   ✅ 登录API: 成功 (状态码: $($response.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "   ❌ 登录API: 失败" -ForegroundColor Red
}

# 测试前端
Write-Host ""
Write-Host "2. 测试前端页面..."
try {
    $frontend = Invoke-WebRequest -Uri "http://localhost:5601" -UseBasicParsing -TimeoutSec 5
    Write-Host "   ✅ 前端页面: 正常 (状态码: $($frontend.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "   ❌ 前端页面: 无法访问" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎯 测试完成！"
Write-Host "📱 管理后台: http://localhost:5601"
Write-Host "🔐 登录账户: admin / 123456"
Write-Host "💡 请点击预览按钮打开管理后台"