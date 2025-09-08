@echo off
chcp 65001 >nul
echo ========================================
echo       洗车IOT系统 - 本机环境启动
echo ========================================
echo.

echo [1/5] 检查MySQL服务状态...
sc query mysql80 | find "RUNNING" >nul
if %errorlevel%==0 (
    echo ✅ MySQL服务正在运行
) else (
    echo ❌ MySQL服务未运行，尝试启动...
    net start mysql80
    if %errorlevel%==0 (
        echo ✅ MySQL服务启动成功
    ) else (
        echo ❌ MySQL服务启动失败，请手动检查
        pause
        exit /b 1
    )
)

echo.
echo [2/5] 检查Redis服务状态...
tasklist | find "redis-server" >nul
if %errorlevel%==0 (
    echo ✅ Redis服务正在运行
) else (
    echo ❌ Redis服务未运行
    echo 请手动启动Redis服务：
    echo   - WSL2方式：wsl sudo service redis-server start
    echo   - Windows版：启动redis-server.exe
    pause
)

echo.
echo [3/5] 测试数据库连接...
mysql -u root -psw63828 -e "SELECT 1;" 2>nul
if %errorlevel%==0 (
    echo ✅ MySQL连接测试成功
) else (
    echo ❌ MySQL连接失败，请检查配置
)

echo.
echo [4/5] 配置环境变量...
if exist "lch-backend\.env.local" (
    copy lch-backend\.env.local lch-backend\.env >nul
    echo ✅ 已使用本机环境配置
) else (
    echo ❌ 找不到本机环境配置文件
    echo 请运行：copy lch-backend\.env.local lch-backend\.env
    pause
    exit /b 1
)

echo.
echo [5/5] 启动后端服务...
cd lch-backend
if not exist "node_modules" (
    echo 安装依赖包...
    call npm install
)

echo 启动开发服务器...
call npm run start:dev

pause