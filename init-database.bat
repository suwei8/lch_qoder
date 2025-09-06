@echo off
chcp 65001 >nul
echo ========================================
echo         数据库初始化脚本
echo ========================================
echo.

echo [1/3] 检查MySQL连接...
mysql -u root -psw63828 -e "SELECT 1;" 2>nul
if %errorlevel%==0 (
    echo ✅ MySQL连接成功
) else (
    echo ❌ MySQL连接失败
    echo 请检查：
    echo   1. MySQL服务是否启动
    echo   2. 用户名密码是否正确（root/sw63828）
    echo   3. 端口是否为3306
    pause
    exit /b 1
)

echo.
echo [2/3] 执行数据库初始化...
if exist "docs\database\init-local.sql" (
    mysql -u root -psw63828 < docs\database\init-local.sql
    if %errorlevel%==0 (
        echo ✅ 数据库初始化成功
    ) else (
        echo ❌ 数据库初始化失败
        pause
        exit /b 1
    )
) else (
    echo ❌ 找不到初始化SQL文件
    echo 请确保文件路径：docs\database\init-local.sql
    pause
    exit /b 1
)

echo.
echo [3/3] 验证数据库结构...
mysql -u root -psw63828 -e "USE lch_v4; SHOW TABLES;"

echo.
echo ========================================
echo       数据库初始化完成！
echo ========================================
echo 数据库名称：lch_v4
echo 默认用户：root
echo 默认密码：sw63828
echo 端口：3306
echo.
echo 现在可以运行 start-local.bat 启动项目
echo ========================================

pause