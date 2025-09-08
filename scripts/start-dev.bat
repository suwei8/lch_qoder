@echo off
chcp 65001 >nul
echo ============================================
echo         Liang Che Hui Car Wash System
echo           Development Environment
echo ============================================
echo.

echo Checking environment dependencies...
where node >nul 2>nul
if errorlevel 1 (
    echo Node.js is not installed or not in PATH, please install Node.js first
    pause
    exit /b 1
)

where docker >nul 2>nul
if errorlevel 1 (
    echo Docker is not installed or not in PATH, please install Docker Desktop first
    pause
    exit /b 1
)

echo.
echo 1. Starting database services...
docker-compose -f docker-compose.db.yml up -d
if errorlevel 1 (
    echo Database startup failed, please check Docker status
    pause
    exit /b 1
)

echo Waiting for database initialization...
timeout /t 10

echo.
echo 2. Starting backend API service...
cd lch-backend
if not exist "node_modules" (
    echo Installing backend dependencies...
    call npm install
    if errorlevel 1 (
        echo Backend dependency installation failed
        cd ..
        pause
        exit /b 1
    )
)

echo Starting backend service...
start "LCH-Backend" cmd /k "npm run start:dev"
cd ..

echo.
echo 3. Starting frontend platform admin...
cd lch-platform
if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
    if errorlevel 1 (
        echo Frontend dependency installation failed
        cd ..
        pause
        exit /b 1
    )
)

echo Starting frontend service...
start "LCH-Platform" cmd /k "npm run dev"
cd ..

echo.
echo ============================================
echo           System Started Successfully!
echo ============================================
echo.
echo Service URLs:
echo - Backend API:     http://localhost:5603/api
echo - API Docs:        http://localhost:5603/api/docs
echo - Platform Admin:  http://localhost:5601
echo.
echo Default Login:
echo - Username: admin
echo - Password: 123456
echo.
echo Database Connection:
echo - MySQL:  localhost:3306
echo - Redis:  localhost:6379
echo - Database: lch_v4
echo.
echo Press any key to continue...
pause
