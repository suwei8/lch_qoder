@echo off
chcp 65001 >nul

echo ============================================
echo         Liang Che Hui Car Wash System
echo          Auto Port Fix + Start
echo ============================================
echo.

echo Step 1: Cleaning up port conflicts...
echo Stopping existing containers...
docker-compose -f docker-compose.db.yml down >nul 2>&1
docker stop lch-mysql lch-redis >nul 2>&1
docker rm lch-mysql lch-redis >nul 2>&1

echo Step 2: Starting database services with new ports...
echo - MySQL: localhost:3307 (Docker internal: 3306)
echo - Redis: localhost:6380 (Docker internal: 6379)

docker-compose -f docker-compose.db.yml up -d
if errorlevel 1 (
    echo Database startup failed
    pause
    exit /b 1
)

echo Waiting for database initialization...
timeout /t 10 >nul

echo.
echo Step 3: Starting backend API service...
cd lch-backend
if not exist "node_modules" (
    echo Installing backend dependencies...
    call npm install
)
start "LCH-Backend" cmd /k "npm run start:dev"
cd ..

echo.
echo Step 4: Starting frontend platform...
cd lch-platform  
if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
)
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
echo Database Connections:
echo - MySQL:  localhost:3307
echo - Redis:  localhost:6380
echo.
echo Default Login:
echo - Username: admin
echo - Password: 123456
echo.
pause