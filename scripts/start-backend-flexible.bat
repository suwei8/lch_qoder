@echo off
echo 选择开发环境配置：
echo 1. 远程Linux Docker
echo 2. 本机MySQL/Redis  
echo 3. 云数据库服务
echo.

set /p choice="请输入选择 (1-3): "

if "%choice%"=="1" (
    echo 使用远程Linux Docker配置...
    copy lch-backend\.env.remote lch-backend\.env
    echo 请确保已在Linux服务器启动: docker-compose -f docker-compose.remote.yml up -d
) else if "%choice%"=="2" (
    echo 使用本机配置...
    copy lch-backend\.env.local lch-backend\.env
    echo 请确保本机MySQL和Redis已启动
) else if "%choice%"=="3" (
    echo 使用云数据库配置...
    copy lch-backend\.env.cloud lch-backend\.env
    echo 请确保云数据库配置正确
) else (
    echo 无效选择，退出...
    pause
    exit
)

echo.
echo 启动后端服务...
cd lch-backend
call npm install
call npm run start:dev

pause