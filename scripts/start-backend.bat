@echo off
chcp 65001
echo 正在启动亮车惠后端服务...

cd /d "%~dp0lch-backend"

echo 检查依赖...
if not exist node_modules (
    echo 正在安装依赖...
    npm install
)

echo 启动开发服务器...
npm run start:dev

pause