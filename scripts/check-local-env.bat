@echo off
chcp 65001 >nul

echo ============================================
echo      洗车IOT管理系统 - 本机环境检查
echo ============================================
echo.

set ERROR_COUNT=0

echo 正在检查运行环境...
echo.

echo [1/6] 检查Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js未安装或不在PATH中
    set /a ERROR_COUNT+=1
) else (
    for /f "delims=" %%i in ('node --version') do echo ✅ Node.js版本: %%i
)

echo.
echo [2/6] 检查npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm未安装或不在PATH中
    set /a ERROR_COUNT+=1
) else (
    for /f "delims=" %%i in ('npm --version') do echo ✅ npm版本: %%i
)

echo.
echo [3/6] 检查MySQL连接...
mysql -h 127.0.0.1 -P 3306 -u root -pcCNyGNDDD5Mp6d9f -e "SELECT VERSION();" >nul 2>&1
if errorlevel 1 (
    echo ❌ MySQL连接失败 (127.0.0.1:3306)
    echo    请检查: 1.MySQL服务是否启动 2.密码是否为: cCNyGNDDD5Mp6d9f
    set /a ERROR_COUNT+=1
) else (
    for /f "skip=1 delims=" %%i in ('mysql -h 127.0.0.1 -P 3306 -u root -pcCNyGNDDD5Mp6d9f -e "SELECT VERSION();" 2^>nul') do (
        echo ✅ MySQL连接正常: %%i
        goto mysql_ok
    )
    :mysql_ok
)

echo.
echo [4/6] 检查Redis连接...
redis-cli -h 127.0.0.1 -p 6379 ping >nul 2>&1
if errorlevel 1 (
    echo ❌ Redis连接失败 (127.0.0.1:6379)
    echo    请检查: 1.Redis服务是否启动 2.如使用WSL2请执行: wsl redis-server
    set /a ERROR_COUNT+=1
) else (
    echo ✅ Redis连接正常
)

echo.
echo [5/6] 检查数据库lch_v4...
mysql -h 127.0.0.1 -P 3306 -u root -pcCNyGNDDD5Mp6d9f -e "USE lch_v4; SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='lch_v4';" >nul 2>&1
if errorlevel 1 (
    echo ❌ 数据库lch_v4不存在或无法访问
    echo    请运行: init-local-database.bat 初始化数据库
    set /a ERROR_COUNT+=1
) else (
    for /f "skip=1 delims=" %%i in ('mysql -h 127.0.0.1 -P 3306 -u root -pcCNyGNDDD5Mp6d9f -e "USE lch_v4; SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='lch_v4';" 2^>nul') do (
        echo ✅ 数据库lch_v4存在，包含 %%i 张表
        goto db_ok
    )
    :db_ok
)

echo.
echo [6/6] 检查端口占用...
netstat -an | findstr ":5603" >nul 2>&1
if not errorlevel 1 (
    echo ⚠️  端口5603已被占用 (后端服务端口)
    set /a ERROR_COUNT+=1
)

netstat -an | findstr ":5601" >nul 2>&1
if not errorlevel 1 (
    echo ⚠️  端口5601已被占用 (前端服务端口)
    set /a ERROR_COUNT+=1
)

if %ERROR_COUNT%==0 (
    echo ✅ 端口5603和5601可用
)

echo.
echo ============================================
echo              检查结果
echo ============================================

if %ERROR_COUNT%==0 (
    echo ✅ 所有检查通过！环境配置正确
    echo.
    echo 可以运行以下命令启动项目:
    echo    start-local-native.bat
) else (
    echo ❌ 发现 %ERROR_COUNT% 个问题，请先解决上述问题
    echo.
    echo 常见解决方案:
    echo  • Node.js: 请安装Node.js 16+
    echo  • MySQL: 确保MySQL服务启动，密码正确
    echo  • Redis: 确保Redis服务启动，或使用WSL2启动
    echo  • 数据库: 运行 init-local-database.bat 初始化
    echo  • 端口占用: 关闭占用端口的程序
)

echo.
pause