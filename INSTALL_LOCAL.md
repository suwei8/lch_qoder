# Windows本机MySQL和Redis安装指南

## MySQL 8.0 安装
1. 下载MySQL Community Server：https://dev.mysql.com/downloads/mysql/
2. 安装并配置：
   - 端口：3306 (或3307避免冲突)
   - 用户：root
   - 密码：sw63828
   - 数据库：lch_v4

## Redis 安装
方式一：使用官方Windows版本
- 下载：https://github.com/microsoftarchive/redis/releases
- 配置端口：6379 (或6380避免冲突)

方式二：使用WSL2 + Redis
```bash
# 在WSL2中安装Redis
sudo apt update
sudo apt install redis-server
redis-server --port 6380
```

## 配置环境变量
复制 .env.local 配置文件