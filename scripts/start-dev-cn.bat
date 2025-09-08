@echo off
chcp 65001 >nul

echo ============================================
echo         亮车惠自助洗车系统
echo           开发环境启动脚本
echo ============================================
echo.

echo 检查环境依赖...
where node >nul 2>nul
if errorlevel 1 (
    echo Node.js 未安装或不在PATH中，请先安装 Node.js
    pause
    exit /b 1
)

where docker >nul 2>nul
if errorlevel 1 (
    echo Docker 未安装或不在PATH中，请先安装 Docker Desktop
    pause
    exit /b 1
)

echo.
echo 1. 启动数据库服务...
docker-compose -f docker-compose.db.yml up -d
if errorlevel 1 (
    echo 数据库启动失败，请检查Docker运行状态
    pause
    exit /b 1
)

echo 等待数据库初始化...
timeout /t 10

echo.
echo 2. 启动后端API服务...
cd lch-backend
if not exist "node_modules" (
    echo 安装后端依赖...
    call npm install
    if errorlevel 1 (
        echo 后端依赖安装失败
        cd ..
        pause
        exit /b 1
    )
)

echo 启动后端服务...
start "亮车惠-后端服务" cmd /k "npm run start:dev"
cd ..

echo.
echo 3. 启动前端平台管理后台...
cd lch-platform
if not exist "node_modules" (
    echo 安装前端依赖...
    call npm install
    if errorlevel 1 (
        echo 前端依赖安装失败
        cd ..
        pause
        exit /b 1
    )
)

echo 启动前端服务...
start "亮车惠-平台管理后台" cmd /k "npm run dev"
cd ..

echo.
echo ============================================
echo           系统启动完成！
echo ============================================
echo.
echo 服务地址：
echo - 后端API:     http://localhost:5603/api
echo - API文档:     http://localhost:5603/api/docs
echo - 平台管理:    http://localhost:5601
echo.
echo 默认登录账户：
echo - 用户名: admin
echo - 密码: 123456
echo.
echo 数据库连接：
echo - MySQL:  localhost:3306
echo - Redis:  localhost:6379
echo - 数据库: lch_v4
echo.
echo 按任意键继续...
pause