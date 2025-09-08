@echo off
chcp 65001 > nul
title 一键创建完整测试数据

echo ============================================
echo       洗车IOT管理系统 - 一键创建测试数据
echo ============================================
echo.

echo 🚀 准备创建完整的测试数据...
echo.
echo 将会创建以下数据:
echo - 基础数据库结构
echo - 6个测试商户账号
echo - 14个测试洗车设备  
echo - 146个模拟订单记录
echo - 21条余额流水记录
echo.

set /p confirm=确认开始创建吗？(Y/N): 
if /i not "%confirm%"=="Y" (
    echo 操作已取消
    pause
    exit /b 0
)

echo.
echo ============================================
echo              开始创建测试数据
echo ============================================

echo.
echo [1/4] 正在初始化数据库结构...
node init-database-simple.js
if errorlevel 1 (
    echo ❌ 数据库初始化失败
    pause
    exit /b 1
)

echo.
echo [2/4] 正在创建第一个测试商户...
node create-test-merchant.js
if errorlevel 1 (
    echo ❌ 基础商户创建失败
    pause
    exit /b 1
)

echo.
echo [3/4] 正在批量创建测试商户...
node create-batch-merchants.js
if errorlevel 1 (
    echo ❌ 批量商户创建失败
    pause
    exit /b 1
)

echo.
echo [4/4] 正在创建测试订单数据...
node create-test-orders.js
if errorlevel 1 (
    echo ❌ 订单数据创建失败
    pause
    exit /b 1
)

echo.
echo ============================================
echo              ✅ 创建完成！
echo ============================================

echo.
echo 📊 数据创建汇总:
node show-test-accounts.js

echo.
echo 🎉 测试数据创建完成！现在您可以：
echo.
echo 1. 访问管理后台: http://localhost:5601
echo 2. 使用账号 admin / 123456 登录
echo 3. 测试各种管理功能
echo.
echo 如需重新创建数据，请再次运行此脚本
echo.
pause