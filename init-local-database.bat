@echo off
chcp 65001 >nul

echo ============================================
echo      洗车IOT管理系统 - 本机数据库初始化
echo ============================================
echo.

echo 正在初始化本机MySQL数据库...
echo 数据库配置:
echo - 主机: 127.0.0.1:3306
echo - 用户名: root
echo - 数据库: lch_v4
echo.

echo 请确保MySQL服务已启动...
pause

echo.
echo 正在导入数据库结构和初始数据...

mysql -h 127.0.0.1 -P 3306 -u root -pcCNyGNDDD5Mp6d9f -e "DROP DATABASE IF EXISTS lch_v4; CREATE DATABASE lch_v4 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

if errorlevel 1 (
    echo 数据库创建失败，请检查MySQL连接配置！
    pause
    exit /b 1
)

mysql -h 127.0.0.1 -P 3306 -u root -pcCNyGNDDD5Mp6d9f lch_v4 < lch_v4_database_dump.sql

if errorlevel 1 (
    echo 数据库导入失败！
    pause
    exit /b 1
)

echo.
echo ============================================
echo           数据库初始化完成！
echo ============================================
echo.
echo 数据库连接信息:
echo - 主机: 127.0.0.1
echo - 端口: 3306
echo - 数据库: lch_v4
echo - 用户名: root
echo - 密码: cCNyGNDDD5Mp6d9f
echo.
echo 默认管理员账号:
echo - 用户名: admin
echo - 密码: 123456
echo.
pause