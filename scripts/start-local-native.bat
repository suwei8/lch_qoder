@echo off
chcp 65001 >nul

echo ============================================
echo     洗车IOT管理系统 - 本机环境启动脚本
echo        (无需Docker，使用本机MySQL/Redis)
echo ============================================
echo.

echo 环境配置检查:
echo - MySQL: 127.0.0.1:3306
echo - Redis: 127.0.0.1:6379
echo - 后端端口: 5603
echo - 前端端口: 5601
echo.

echo 步骤1: 检查MySQL连接...
mysql -h 127.0.0.1 -P 3306 -u root -pcCNyGNDDD5Mp6d9f -e "SELECT 1;" >nul 2>&1
if errorlevel 1 (
    echo ❌ MySQL连接失败！请检查：
    echo    1. MySQL服务是否启动
    echo    2. 用户名密码是否正确：root/cCNyGNDDD5Mp6d9f
    echo    3. 端口3306是否可访问
    pause
    exit /b 1
)
echo ✅ MySQL连接正常

echo.
echo 步骤2: 检查Redis连接...
redis-cli -h 127.0.0.1 -p 6379 ping >nul 2>&1
if errorlevel 1 (
    echo ❌ Redis连接失败！请检查：
    echo    1. Redis服务是否启动
    echo    2. 端口6379是否可访问
    echo    如使用WSL2: wsl redis-server
    pause
    exit /b 1
)
echo ✅ Redis连接正常

echo.
echo 步骤3: 检查数据库是否存在...
mysql -h 127.0.0.1 -P 3306 -u root -pcCNyGNDDD5Mp6d9f -e "USE lch_v4;" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  数据库lch_v4不存在，是否要初始化数据库？
    set /p choice=输入Y确认初始化数据库 (Y/N): 
    if /i "%choice%"=="Y" (
        echo 正在初始化数据库...
        call init-local-database.bat
        if errorlevel 1 (
            echo 数据库初始化失败！
            pause
            exit /b 1
        )
    ) else (
        echo 取消启动，请先初始化数据库
        pause
        exit /b 1
    )
)
echo ✅ 数据库lch_v4存在

echo.
echo 步骤4: 启动后端服务...
cd lch-backend
if not exist "node_modules" (
    echo 正在安装后端依赖...
    call npm install
    if errorlevel 1 (
        echo 后端依赖安装失败！
        cd ..
        pause
        exit /b 1
    )
)

echo 启动后端API服务 (端口: 5603)...
start "LCH-Backend-Local" cmd /k "npm run start:dev"
cd ..

echo.
echo 步骤5: 启动前端服务...
cd lch-platform
if not exist "node_modules" (
    echo 正在安装前端依赖...
    call npm install
    if errorlevel 1 (
        echo 前端依赖安装失败！
        cd ..
        pause
        exit /b 1
    )
)

echo 启动前端平台 (端口: 5601)...
start "LCH-Platform-Local" cmd /k "npm run dev"
cd ..

echo.
echo 等待服务启动...
timeout /t 5 >nul

echo.
echo ============================================
echo           本机环境启动完成！
echo ============================================
echo.
echo 🌐 服务访问地址:
echo   • 后端API:     http://localhost:5603/api
echo   • API文档:     http://localhost:5603/api/docs  
echo   • 前端平台:    http://localhost:5601
echo.
echo 🗄️  数据库连接:
echo   • MySQL:  127.0.0.1:3306/lch_v4
echo   • Redis:  127.0.0.1:6379
echo.
echo 🔑 默认登录信息:
echo   • 用户名: admin
echo   • 密码: 123456
echo.
echo 🛠️  开发工具:
echo   • 测试Redis: test-redis-connection.bat
echo   • 初始化数据库: init-local-database.bat
echo.
echo 💡 提示: 
echo   • 修改代码后服务会自动重载
echo   • 按Ctrl+C可停止对应服务
echo   • 如遇问题请检查数据库和Redis连接
echo.
pause