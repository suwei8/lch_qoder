@echo off
chcp 65001 > nul
title 创建测试商户账号

echo ============================================
echo       洗车IOT管理系统 - 创建测试商户账号
echo ============================================
echo.

echo 正在检查Node.js环境...
node --version > nul 2>&1
if errorlevel 1 (
    echo ❌ 未检测到Node.js，请先安装Node.js
    pause
    exit /b 1
)

echo ✅ Node.js环境检查通过

echo.
echo 正在检查MySQL依赖...
if not exist "node_modules\mysql2" (
    echo 正在安装MySQL依赖...
    npm install mysql2
    if errorlevel 1 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
)

echo ✅ MySQL依赖检查通过

echo.
echo 正在执行创建脚本...
node create-test-merchant.js

echo.
echo 脚本执行完成！
pause