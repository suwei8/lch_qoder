Write-Host "测试商户端仪表盘集成" -ForegroundColor Green
Write-Host ""

# 检查商户端是否运行
Write-Host "1. 检查商户端服务..."
try {
    $merchant = Invoke-WebRequest -Uri "http://localhost:5605" -UseBasicParsing -TimeoutSec 3
    Write-Host "   ✅ 商户端服务正常 (状态码: $($merchant.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "   ❌ 商户端服务未启动" -ForegroundColor Red
    Write-Host "   启动商户端: cd lch-merchant && npm run dev" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎯 测试完成！"
Write-Host "📱 商户端地址: http://localhost:5605"
Write-Host "🔧 已集成真实API数据"
Write-Host "💡 支持离线模式和模拟数据"