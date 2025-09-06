# WSL2 + Redis 快速安装命令

## 1. 安装WSL2（以管理员身份运行PowerShell）
wsl --install -d Ubuntu-22.04

## 2. 重启后，在Ubuntu中安装Redis
sudo apt update
sudo apt install redis-server -y

## 3. 配置Redis（重要！）
sudo nano /etc/redis/redis.conf
# 找到以下行并修改：
# bind 127.0.0.1 ::1  改为  bind 0.0.0.0
# protected-mode yes  改为  protected-mode no

## 4. 启动Redis
sudo service redis-server start
sudo systemctl enable redis-server

## 5. 测试连接
redis-cli ping
# 应该返回 PONG

## 6. 从Windows测试连接
# 在Windows命令行中：
redis-cli -h localhost -p 6379 ping