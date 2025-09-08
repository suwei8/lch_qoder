@echo off
chcp 65001 >nul

echo ============================================
echo     洗车IOT管理系统 - E2E测试环境启动
echo ============================================
echo.

echo 【环境要求检查】
echo 正在检查Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js未安装！请先安装Node.js 16+
    echo    下载地址: https://nodejs.org/
    pause
    exit /b 1
) else (
    for /f "delims=" %%i in ('node --version') do echo ✅ Node.js版本: %%i
)

echo.
echo 正在检查MySQL连接 (端口3307)...
echo.| set /p="测试MySQL连接... "
powershell -command "try { $client = New-Object System.Net.Sockets.TcpClient; $client.Connect('127.0.0.1', 3307); $client.Close(); Write-Host '✅ MySQL (3307) 可访问' } catch { Write-Host '❌ MySQL (3307) 不可访问' }"

echo.
echo 正在检查Redis连接 (端口6380)...
echo.| set /p="测试Redis连接... "
powershell -command "try { $client = New-Object System.Net.Sockets.TcpClient; $client.Connect('127.0.0.1', 6380); $client.Close(); Write-Host '✅ Redis (6380) 可访问' } catch { Write-Host '❌ Redis (6380) 不可访问' }"

echo.
echo 【依赖安装】
echo 安装后端依赖...
cd lch-backend
if not exist "node_modules" (
    echo 正在安装后端依赖 (npm ci)...
    npm ci
    if errorlevel 1 (
        echo ❌ 后端依赖安装失败！
        cd ..
        pause
        exit /b 1
    )
) else (
    echo ✅ 后端依赖已存在
)
cd ..

echo.
echo 安装平台端依赖...
cd lch-platform
if not exist "node_modules" (
    echo 正在安装平台端依赖 (npm ci)...
    npm ci
    if errorlevel 1 (
        echo ❌ 平台端依赖安装失败！
        cd ..
        pause
        exit /b 1
    )
) else (
    echo ✅ 平台端依赖已存在
)
cd ..

echo.
echo 安装用户H5端依赖...
cd lch-user-h5
if not exist "node_modules" (
    echo 正在安装用户H5端依赖 (npm ci)...
    npm ci
    if errorlevel 1 (
        echo ❌ 用户H5端依赖安装失败！
        cd ..
        pause
        exit /b 1
    )
) else (
    echo ✅ 用户H5端依赖已存在
)
cd ..

echo.
echo 安装测试依赖...
if not exist "node_modules" (
    echo 正在安装根目录依赖...
    npm install
    if errorlevel 1 (
        echo ❗ 依赖安装失败，尝试手动安装Playwright...
        npm install --save-dev @playwright/test @types/node typescript
    )
) else (
    echo ✅ 根目录依赖已存在
)

echo 安装Playwright浏览器...
npx playwright install >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Playwright浏览器安装失败，请手动执行: npx playwright install
) else (
    echo ✅ Playwright浏览器安装完成
)

echo.
echo 【服务启动】
echo 启动后端服务 (端口5603)...
cd lch-backend
start "E2E-Backend" cmd /k "npm run start:dev"
cd ..

echo 等待后端服务启动...
timeout /t 10 >nul

echo 启动平台端 (端口5601)...
cd lch-platform
start "E2E-Platform" cmd /k "npm run dev -- --port 5601"
cd ..

echo 等待平台端启动...
timeout /t 5 >nul

echo 启动用户H5端 (端口5604)...
cd lch-user-h5
start "E2E-H5" cmd /k "npm run dev -- --port 5604"
cd ..

echo.
echo 【健康检查】
echo 等待所有服务就绪...
timeout /t 15 >nul

echo 检查后端API健康状态...
powershell -command "try { $response = Invoke-WebRequest -Uri 'http://127.0.0.1:5603/api' -TimeoutSec 5; Write-Host '✅ 后端API响应正常 (' $response.StatusCode ')' } catch { Write-Host '❌ 后端API无响应' }"

echo 检查平台端页面...
powershell -command "try { $response = Invoke-WebRequest -Uri 'http://127.0.0.1:5601' -TimeoutSec 5; Write-Host '✅ 平台端页面正常 (' $response.StatusCode ')' } catch { Write-Host '❌ 平台端页面无响应' }"

echo 检查用户H5端页面...
powershell -command "try { $response = Invoke-WebRequest -Uri 'http://127.0.0.1:5604' -TimeoutSec 5; Write-Host '✅ 用户H5端页面正常 (' $response.StatusCode ')' } catch { Write-Host '❌ 用户H5端页面无响应' }"

echo.
echo ============================================
echo           E2E测试环境启动完成！
echo ============================================
echo.
echo 🌐 服务地址:
echo   • 后端API:     http://127.0.0.1:5603/api
echo   • 平台管理端:   http://127.0.0.1:5601
echo   • 用户H5端:    http://127.0.0.1:5604
echo.
echo 🧪 执行E2E测试:
echo   • 运行所有测试:     npx playwright test
echo   • 运行特定测试:     npx playwright test backend-api
echo   • 生成HTML报告:    npx playwright show-report
echo.
echo 📊 测试产物位置: ./artifacts/
echo.
pause