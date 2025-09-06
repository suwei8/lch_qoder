@echo off
chcp 65001 > nul
echo ================================================
echo           亮车惠用户端H5应用启动脚本
echo ================================================
echo.

cd /d "%~dp0lch-user-h5"

echo 正在检查项目目录...
if not exist "package.json" (
    echo 错误: 找不到 package.json 文件
    echo 请确保在正确的项目目录中运行此脚本
    pause
    exit /b 1
)

echo 检查依赖包...
if not exist "node_modules" (
    echo 未找到 node_modules，开始安装依赖...
    echo.
    echo 正在安装依赖包，请稍候...
    call npm install
    
    if %errorlevel% neq 0 (
        echo.
        echo npm 安装失败，尝试使用国内源...
        call npm install --registry=https://registry.npmmirror.com
        
        if %errorlevel% neq 0 (
            echo.
            echo 依赖安装失败，请手动运行: npm install
            pause
            exit /b 1
        )
    )
    
    echo.
    echo 依赖安装完成！
) else (
    echo 依赖包已存在，跳过安装步骤
)

echo.
echo 正在启动开发服务器...
echo 访问地址: http://localhost:5604
echo.
echo 按 Ctrl+C 停止服务器
echo ================================================

call npm run dev

if %errorlevel% neq 0 (
    echo.
    echo 启动失败，请检查错误信息
    pause
)