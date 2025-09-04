# 亮车惠自助洗车系统 - 开发环境启动脚本
# PowerShell 版本

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "        亮车惠自助洗车系统" -ForegroundColor Cyan
Write-Host "         开发环境启动脚本" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# 检查环境依赖
Write-Host "检查环境依赖..." -ForegroundColor Yellow

# 检查 Node.js
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVersion = node --version
    Write-Host "✓ Node.js: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "✗ Node.js 未安装或不在PATH中，请先安装 Node.js" -ForegroundColor Red
    Read-Host "按回车键退出"
    exit 1
}

# 检查 Docker
if (Get-Command docker -ErrorAction SilentlyContinue) {
    $dockerVersion = docker --version
    Write-Host "✓ Docker: $dockerVersion" -ForegroundColor Green
} else {
    Write-Host "✗ Docker 未安装或不在PATH中，请先安装 Docker Desktop" -ForegroundColor Red
    Read-Host "按回车键退出"
    exit 1
}

Write-Host ""

# 1. 启动数据库服务
Write-Host "1. 启动数据库服务..." -ForegroundColor Yellow

# 停止可能存在的旧容器
docker-compose -f docker-compose.db.yml down 2>$null

# 启动数据库
if ((docker-compose -f docker-compose.db.yml up -d) -and $LASTEXITCODE -eq 0) {
    Write-Host "✓ 数据库服务启动成功" -ForegroundColor Green
} else {
    Write-Host "✗ 数据库启动失败，可能是端口冲突" -ForegroundColor Red
    Write-Host "尝试停止现有Redis服务或更改端口配置" -ForegroundColor Yellow
    Read-Host "按回车键退出"
    exit 1
}

Write-Host "等待数据库初始化..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# 2. 启动后端服务
Write-Host ""
Write-Host "2. 启动后端API服务..." -ForegroundColor Yellow

Set-Location lch-backend

if (-not (Test-Path "node_modules")) {
    Write-Host "安装后端依赖..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ 后端依赖安装成功" -ForegroundColor Green
    } else {
        Write-Host "✗ 后端依赖安装失败" -ForegroundColor Red
        Set-Location ..
        Read-Host "按回车键退出"
        exit 1
    }
}

Write-Host "启动后端服务..." -ForegroundColor Yellow
Start-Process cmd -ArgumentList "/k", "npm run start:dev" -WindowStyle Normal

Set-Location ..

# 3. 启动前端服务
Write-Host ""
Write-Host "3. 启动前端平台管理后台..." -ForegroundColor Yellow

Set-Location lch-platform

if (-not (Test-Path "node_modules")) {
    Write-Host "安装前端依赖..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ 前端依赖安装成功" -ForegroundColor Green
    } else {
        Write-Host "✗ 前端依赖安装失败" -ForegroundColor Red
        Set-Location ..
        Read-Host "按回车键退出"
        exit 1
    }
}

Write-Host "启动前端服务..." -ForegroundColor Yellow
Start-Process cmd -ArgumentList "/k", "npm run dev" -WindowStyle Normal

Set-Location ..

# 完成信息
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "           系统启动完成！" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "服务地址：" -ForegroundColor White
Write-Host "- 后端API:     http://localhost:5603/api" -ForegroundColor Cyan
Write-Host "- API文档:     http://localhost:5603/api/docs" -ForegroundColor Cyan
Write-Host "- 平台管理:    http://localhost:5601" -ForegroundColor Cyan
Write-Host ""
Write-Host "默认登录账户：" -ForegroundColor White
Write-Host "- 用户名: admin" -ForegroundColor Yellow
Write-Host "- 密码: 123456" -ForegroundColor Yellow
Write-Host ""
Write-Host "数据库连接：" -ForegroundColor White
Write-Host "- MySQL:  localhost:3306" -ForegroundColor Cyan
Write-Host "- Redis:  localhost:6379" -ForegroundColor Cyan
Write-Host "- 数据库: lch_v4" -ForegroundColor Cyan
Write-Host ""

Read-Host "按回车键退出"