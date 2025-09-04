# 端口冲突修复脚本

Write-Host "检查并清理端口冲突..." -ForegroundColor Yellow

# 首先停止可能存在的旧容器
Write-Host "停止现有Docker容器..." -ForegroundColor Yellow
docker-compose -f docker-compose.db.yml down 2>$null
docker stop lch-mysql lch-redis 2>$null
docker rm lch-mysql lch-redis 2>$null

# 检查关键端口占用
$portsToCheck = @(
    @{Port=3306; Name="MySQL(原生)"; NewPort=3307},
    @{Port=3307; Name="MySQL(新)"; NewPort=3307},
    @{Port=6379; Name="Redis(原生)"; NewPort=6380},
    @{Port=6380; Name="Redis(新)"; NewPort=6380},
    @{Port=5601; Name="前端平台"; NewPort=5601},
    @{Port=5603; Name="后端API"; NewPort=5603}
)

foreach ($portInfo in $portsToCheck) {
    $port = $portInfo.Port
    $name = $portInfo.Name
    
    $result = netstat -ano | findstr ":$port "
    if ($result) {
        Write-Host "! 端口 $port ($name) 被占用" -ForegroundColor Yellow
        
        # 尝试获取进程ID并终止
        $processId = ($result -split "\s+" | Where-Object {$_ -match "^\d+$"})[-1]
        if ($processId -and $processId -ne "0") {
            try {
                $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
                if ($process) {
                    Write-Host "  终止进程: $($process.ProcessName) (PID: $processId)" -ForegroundColor Cyan
                    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
                    Start-Sleep -Seconds 2
                }
            } catch {
                Write-Host "  无法终止进程 PID: $processId" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "✓ 端口 $port ($name) 可用" -ForegroundColor Green
    }
}

# 清理Docker网络
Write-Host "\n清理Docker网络..." -ForegroundColor Yellow
docker network prune -f 2>$null

Write-Host "\n端口清理完成！" -ForegroundColor Green
Write-Host "\n当前端口配置:" -ForegroundColor Cyan
Write-Host "- MySQL: localhost:3307 (Docker内部3306)" -ForegroundColor White
Write-Host "- Redis: localhost:6380 (Docker内部6379)" -ForegroundColor White
Write-Host "- 前端: localhost:5601" -ForegroundColor White
Write-Host "- 后端: localhost:5603" -ForegroundColor White

Write-Host "\n现在可以运行 ./start-dev.ps1 启动系统" -ForegroundColor Green