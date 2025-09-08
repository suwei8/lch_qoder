# Redis Windows 安装指南

## 方案一：使用WSL2安装Redis（推荐）

### 1. 安装WSL2
```powershell
# 以管理员身份运行PowerShell
wsl --install
# 重启计算机后，安装Ubuntu

# 或者安装特定发行版
wsl --install -d Ubuntu-22.04
```

### 2. 在WSL2中安装Redis
```bash
# 更新包管理器
sudo apt update

# 安装Redis
sudo apt install redis-server -y

# 配置Redis
sudo nano /etc/redis/redis.conf
# 修改以下配置：
# bind 127.0.0.1 ::1  改为  bind 0.0.0.0
# protected-mode yes  改为  protected-mode no
```

### 3. 启动Redis服务
```bash
# 启动Redis服务
sudo service redis-server start

# 设置开机自启动
sudo systemctl enable redis-server

# 测试连接
redis-cli ping
# 应该返回 PONG
```

### 4. 从Windows访问WSL2中的Redis
```bash
# 获取WSL2的IP地址
ip addr show eth0

# 在Windows中测试连接
redis-cli -h [WSL2_IP_ADDRESS] -p 6379 ping
```

## 方案二：使用Redis for Windows（已停止更新，不推荐）

### 1. 下载Redis
GitHub地址：https://github.com/microsoftarchive/redis/releases
- 下载最新版本的 "Redis-x64-*.zip"

### 2. 安装配置
```cmd
# 解压到指定目录，如：C:\redis
# 复制redis.windows.conf为redis.conf

# 修改配置文件
# port 6379  (或改为6380避免冲突)
# bind 127.0.0.1
```

### 3. 运行Redis
```cmd
# 切换到Redis目录
cd C:\redis

# 启动Redis服务器
redis-server.exe redis.conf

# 新终端测试连接
redis-cli.exe ping
```

## 方案三：使用Memurai（商业版本，但有免费开发者版）

### 1. 下载Memurai
官网：https://www.memurai.com/
- 下载免费开发者版本

### 2. 安装
- 运行安装程序
- 选择端口（默认6379）
- 完成安装后自动作为Windows服务运行

### 3. 测试
```cmd
# 使用Redis CLI连接
redis-cli ping
```