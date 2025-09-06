@echo off
chcp 65001 >nul

echo ============================================
echo       洗车IOT管理系统 - Redis连接测试
echo ============================================
echo.

echo 正在测试Redis连接...
echo Redis配置:
echo - 主机: 127.0.0.1:6379
echo - 密码: 无
echo.

echo 请确保Redis服务已启动...

redis-cli -h 127.0.0.1 -p 6379 ping

if errorlevel 1 (
    echo Redis连接失败！请检查Redis服务是否启动。
    echo.
    echo 如果您使用WSL2安装Redis，请执行以下命令启动：
    echo wsl redis-server
    echo.
    pause
    exit /b 1
)

echo.
echo Redis连接测试成功！
echo.
echo 设置测试键值...
redis-cli -h 127.0.0.1 -p 6379 set lch_test "connection_ok"
redis-cli -h 127.0.0.1 -p 6379 get lch_test
redis-cli -h 127.0.0.1 -p 6379 del lch_test

echo.
echo ============================================
echo           Redis测试完成！
echo ============================================
pause