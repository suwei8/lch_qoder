# 简化的管理后台测试
Write-Host "🔥 管理后台功能测试开始..." -ForegroundColor Green
Write-Host ""

# 1. 测试后端API基础连接
Write-Host "1️⃣ 测试后端API连接..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5603/api/merchants" -Method GET -UseBasicParsing -ErrorAction Stop
    Write-Host "   ❌ API需要认证 (预期行为)" -ForegroundColor Yellow
} catch {
    if ($_.Exception.Message -like "*401*" -or $_.Exception.Message -like "*未经授权*") {
        Write-Host "   ✅ API认证机制正常工作" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ API连接异常: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 2. 测试管理员登录
Write-Host ""
Write-Host "2️⃣ 测试管理员登录..." -ForegroundColor Cyan
try {
    $loginData = @{username="admin"; password="123456"} | ConvertTo-Json
    $loginResponse = Invoke-WebRequest -Uri "http://localhost:5603/api/auth/admin/login" -Method POST -Body $loginData -ContentType "application/json" -UseBasicParsing
    
    if ($loginResponse.StatusCode -eq 200) {
        Write-Host "   ✅ 管理员登录成功" -ForegroundColor Green
        $token = ($loginResponse.Content | ConvertFrom-Json).access_token
        
        if ($token) {
            Write-Host "   ✅ 获取访问令牌成功" -ForegroundColor Green
            
            # 3. 测试认证后的API访问
            Write-Host ""
            Write-Host "3️⃣ 测试认证API访问..." -ForegroundColor Cyan
            
            try {
                $merchantResponse = Invoke-WebRequest -Uri "http://localhost:5603/api/merchants" -Headers @{Authorization="Bearer $token"} -UseBasicParsing
                Write-Host "   ✅ 商户管理API: 正常 ($($merchantResponse.StatusCode))" -ForegroundColor Green
            } catch {
                Write-Host "   ⚠️ 商户管理API异常" -ForegroundColor Yellow
            }
            
            try {
                $deviceResponse = Invoke-WebRequest -Uri "http://localhost:5603/api/devices" -Headers @{Authorization="Bearer $token"} -UseBasicParsing
                Write-Host "   ✅ 设备管理API: 正常 ($($deviceResponse.StatusCode))" -ForegroundColor Green
            } catch {
                Write-Host "   ⚠️ 设备管理API异常" -ForegroundColor Yellow
            }
            
            try {
                $orderResponse = Invoke-WebRequest -Uri "http://localhost:5603/api/orders" -Headers @{Authorization="Bearer $token"} -UseBasicParsing
                Write-Host "   ✅ 订单管理API: 正常 ($($orderResponse.StatusCode))" -ForegroundColor Green
            } catch {
                Write-Host "   ⚠️ 订单管理API异常" -ForegroundColor Yellow
            }
        } else {
            Write-Host "   ❌ 令牌解析失败" -ForegroundColor Red
        }
    } else {
        Write-Host "   ❌ 登录失败 (状态码: $($loginResponse.StatusCode))" -ForegroundColor Red
    }
} catch {
    Write-Host "   ❌ 登录请求失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. 前端连接测试
Write-Host ""
Write-Host "4️⃣ 测试前端服务..." -ForegroundColor Cyan
try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:5601" -UseBasicParsing -TimeoutSec 5
    Write-Host "   ✅ 平台管理后台: 正常访问 ($($frontendResponse.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "   ❌ 平台管理后台无法访问" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎯 测试完成！" -ForegroundColor Green
Write-Host "📱 管理后台地址: http://localhost:5601" -ForegroundColor Cyan
Write-Host "🔧 使用管理员账户: admin / 123456" -ForegroundColor Yellow
Write-Host "💡 点击上方预览按钮打开管理后台进行手动测试" -ForegroundColor Magenta