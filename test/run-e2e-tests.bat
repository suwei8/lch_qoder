@echo off
chcp 65001 >nul

echo ============================================
echo       洗车IOT管理系统 - E2E测试执行
echo ============================================
echo.

set TEST_START_TIME=%date% %time%

echo 【测试环境验证】
echo 检查测试端口可用性...
netstat -an | findstr ":5603" >nul 2>&1
if errorlevel 1 (
    echo ❌ 后端服务(5603)未启动！
    echo    请先运行: start-e2e-env.bat
    pause
    exit /b 1
) else (
    echo ✅ 后端服务(5603)正在运行
)

netstat -an | findstr ":5601" >nul 2>&1
if errorlevel 1 (
    echo ❌ 平台端(5601)未启动！
    pause
    exit /b 1
) else (
    echo ✅ 平台端(5601)正在运行
)

netstat -an | findstr ":5604" >nul 2>&1
if errorlevel 1 (
    echo ❌ 用户H5端(5604)未启动！
    pause
    exit /b 1
) else (
    echo ✅ 用户H5端(5604)正在运行
)

echo.
echo 【执行E2E测试】
echo 开始时间: %TEST_START_TIME%
echo.

rem 清理之前的测试结果
if exist "artifacts\reports" rmdir /s /q "artifacts\reports" >nul 2>&1
if exist "test-results" rmdir /s /q "test-results" >nul 2>&1
mkdir "artifacts\reports" >nul 2>&1

echo 1. 执行后端API测试...
npx playwright test backend-api --reporter=json --output=./artifacts/reports/backend-results.json
set BACKEND_EXIT_CODE=%errorlevel%

echo.
echo 2. 执行平台端测试...
npx playwright test platform-web --reporter=json --output=./artifacts/reports/platform-results.json
set PLATFORM_EXIT_CODE=%errorlevel%

echo.
echo 3. 执行用户H5端测试...
npx playwright test h5-mobile --reporter=json --output=./artifacts/reports/h5-results.json
set H5_EXIT_CODE=%errorlevel%

echo.
echo 4. 生成综合测试报告...
npx playwright test --reporter=html --output=./artifacts/reports/
set REPORT_EXIT_CODE=%errorlevel%

echo.
set TEST_END_TIME=%date% %time%
echo 【测试执行完成】
echo 结束时间: %TEST_END_TIME%
echo.

echo 📊 测试结果统计:
if %BACKEND_EXIT_CODE%==0 (
    echo   ✅ 后端API测试: 通过
) else (
    echo   ❌ 后端API测试: 失败 (退出码: %BACKEND_EXIT_CODE%)
)

if %PLATFORM_EXIT_CODE%==0 (
    echo   ✅ 平台端测试: 通过
) else (
    echo   ❌ 平台端测试: 失败 (退出码: %PLATFORM_EXIT_CODE%)
)

if %H5_EXIT_CODE%==0 (
    echo   ✅ 用户H5端测试: 通过
) else (
    echo   ❌ 用户H5端测试: 失败 (退出码: %H5_EXIT_CODE%)
)

echo.
set /a TOTAL_FAILURES=%BACKEND_EXIT_CODE% + %PLATFORM_EXIT_CODE% + %H5_EXIT_CODE%
if %TOTAL_FAILURES%==0 (
    echo 🎉 所有测试通过！成功率: 100%%
) else (
    echo ⚠️  部分测试失败，详细信息请查看报告
)

echo.
echo 📁 测试产物位置:
echo   • HTML报告:     .\artifacts\reports\
echo   • 截图:         .\artifacts\screenshots\
echo   • 测试日志:     .\artifacts\logs\
echo.

if exist ".\artifacts\reports\index.html" (
    echo 🌐 查看HTML报告: 
    echo    start .\artifacts\reports\index.html
    echo.
    set /p OPEN_REPORT=是否现在打开测试报告? (Y/N): 
    if /i "!OPEN_REPORT!"=="Y" (
        start .\artifacts\reports\index.html
    )
)

pause