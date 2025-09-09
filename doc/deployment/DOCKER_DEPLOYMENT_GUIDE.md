# 🐳 Docker部署迁移文档

## 📋 项目概述

本文档为亮车惠智能洗车IOT管理系统的Docker部署迁移指南，帮助新的开发者快速部署并启动完整的项目环境。

**项目版本**: v5.0  
**更新时间**: 2025-01-09  
**适用环境**: Windows/Linux/macOS

## 🎯 部署架构

```
┌─────────────────────────────────────────────────────────────┐
│                    亮车惠系统架构                              │
├─────────────────────────────────────────────────────────────┤
│  前端应用层                                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ 用户H5端     │ │ 商家端      │ │ 平台管理端   │           │
│  │ :5604       │ │ :5608       │ │ :5602       │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
├─────────────────────────────────────────────────────────────┤
│  后端服务层                                                  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │             NestJS API 服务                             │ │
│  │                  :5603                                  │ │
│  └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  数据存储层 (Docker 容器)                                    │
│  ┌─────────────┐           ┌─────────────┐                 │
│  │   MySQL     │           │    Redis    │                 │
│  │   :3307     │           │    :6380    │                 │
│  └─────────────┘           └─────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

## 🛠️ 环境要求

### 必需软件
- **Docker**: 版本 20.0+ 
- **Docker Compose**: 版本 2.0+
- **Node.js**: 版本 16.0+ (用于前端构建)
- **Git**: 用于代码克隆

### 系统要求
- **内存**: 最低 4GB，推荐 8GB+
- **硬盘**: 至少 10GB 可用空间
- **网络**: 互联网连接（用于下载镜像）

### 端口占用检查
在部署前请确认以下端口未被占用：
- `3307` - MySQL数据库
- `6380` - Redis缓存
- `5603` - 后端API服务
- `5602` - 平台管理端
- `5604` - 用户H5端
- `5608` - 商家端

## 📦 快速部署指南

### 第一步：获取项目代码

```bash
# 克隆项目
git clone https://github.com/suwei8/lch_qoder.git
cd lch_qoder

# 或下载项目压缩包并解压
```

### 第二步：环境配置检查

```bash
# 检查项目结构
ls -la

# 确认关键文件存在
- docker-compose.db.yml          # 数据库容器配置
- lch_v4_database_dump_2025-01-09.sql  # 数据库初始化文件
- lch-backend/.env               # 后端环境配置
- package.json                   # 项目依赖配置
```

### 第三步：启动数据库服务

```bash
# 启动MySQL和Redis容器
docker-compose -f docker-compose.db.yml up -d

# 检查容器状态
docker-compose -f docker-compose.db.yml ps

# 预期输出：
# Name            State    Ports
# lch_mysql       Up       0.0.0.0:3307->3306/tcp
# lch_redis       Up       0.0.0.0:6380->6379/tcp
```

### 第四步：导入数据库

```bash
# 等待MySQL容器完全启动 (约30-60秒)
sleep 60

# 导入数据库结构和数据
docker exec -i lch_mysql mysql -u root -p123456 lch_v4 < lch_v4_database_dump_2025-01-09.sql

# 验证数据库导入
docker exec lch_mysql mysql -u root -p123456 -e "USE lch_v4; SHOW TABLES;"
```

### 第五步：安装依赖

```bash
# 安装根目录依赖
npm install

# 安装后端依赖
cd lch-backend
npm install
cd ..

# 安装前端依赖
cd lch-platform
npm install
cd ..

cd lch-user-h5
npm install
cd ..

cd lch-merchant
npm install
cd ..
```

### 第六步：启动所有服务

```bash
# 使用快速启动脚本 (Windows)
./quick-start.bat

# 或使用PowerShell脚本
./scripts/start-dev.ps1

# 或手动启动各个服务
# 后端服务
cd lch-backend && npm run start:dev &

# 平台管理端
cd lch-platform && npm run dev &

# 用户H5端
cd lch-user-h5 && npm run dev &

# 商家端
cd lch-merchant && npm run dev &
```

### 第七步：验证部署

访问以下地址确认服务正常：

- **后端API**: http://localhost:5603/api
- **API文档**: http://localhost:5603/api/docs
- **平台管理端**: http://localhost:5602
- **用户H5端**: http://localhost:5604
- **商家端**: http://localhost:5608

## 🐳 详细Docker配置

### 数据库容器配置 (docker-compose.db.yml)

```yaml
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    container_name: lch_mysql
    environment:
      MYSQL_ROOT_PASSWORD: 123456
      MYSQL_DATABASE: lch_v4
      MYSQL_USER: lch_user
      MYSQL_PASSWORD: lch_password
    ports:
      - "3307:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./lch_v4_database_dump_2025-01-09.sql:/docker-entrypoint-initdb.d/init.sql
    command: --default-authentication-plugin=mysql_native_password
    networks:
      - lch_network

  redis:
    image: redis:6.0-alpine
    container_name: lch_redis
    ports:
      - "6380:6379"
    volumes:
      - redis_data:/data
    networks:
      - lch_network

volumes:
  mysql_data:
  redis_data:

networks:
  lch_network:
    driver: bridge
```

### 环境变量配置

#### 后端环境变量 (lch-backend/.env)
```bash
# 环境标识
NODE_ENV=development

# 服务器配置
PORT=5603

# 数据库配置 (Docker)
DATABASE_HOST=127.0.0.1
DATABASE_PORT=3307
DATABASE_USERNAME=root
DATABASE_PASSWORD=123456
DATABASE_NAME=lch_v4

# Redis配置 (Docker)
REDIS_HOST=127.0.0.1
REDIS_PORT=6380
REDIS_DB=0

# JWT配置
JWT_SECRET=lch_qoder_jwt_secret_2025_dev_key

# 其他配置...
```

## 🔧 故障排查指南

### 常见问题及解决方案

#### 1. Docker容器启动失败
```bash
# 检查Docker服务状态
docker --version
docker-compose --version

# 检查端口占用
netstat -tulpn | grep :3307
netstat -tulpn | grep :6380

# 清理并重新启动
docker-compose -f docker-compose.db.yml down
docker-compose -f docker-compose.db.yml up -d
```

#### 2. 数据库连接失败
```bash
# 检查MySQL容器日志
docker logs lch_mysql

# 测试数据库连接
docker exec lch_mysql mysql -u root -p123456 -e "SELECT 1"

# 重置数据库密码
docker exec lch_mysql mysql -u root -p123456 -e "ALTER USER 'root'@'%' IDENTIFIED WITH mysql_native_password BY '123456';"
```

#### 3. 前端服务启动失败
```bash
# 检查Node.js版本
node --version
npm --version

# 清理node_modules重新安装
rm -rf node_modules package-lock.json
npm install

# 检查端口占用
netstat -ano | findstr :5602
netstat -ano | findstr :5604
netstat -ano | findstr :5608
```

#### 4. API服务无法访问
```bash
# 检查后端服务日志
cd lch-backend
npm run start:dev

# 检查环境变量
cat .env

# 测试API连接
curl http://localhost:5603/api
```

### 日志检查命令

```bash
# Docker容器日志
docker logs lch_mysql
docker logs lch_redis

# 应用日志位置
lch-backend/logs/          # 后端日志
~/.npm/_logs/              # npm日志
```

## 📊 性能优化建议

### Docker优化
```bash
# 增加Docker内存限制
docker update --memory=2g lch_mysql
docker update --memory=512m lch_redis

# 启用Docker buildx (多平台构建)
docker buildx create --use
```

### 数据库优化
```sql
-- MySQL配置优化
-- 在数据库连接后执行
SET GLOBAL innodb_buffer_pool_size = 128M;
SET GLOBAL max_connections = 100;
```

### 缓存优化
```bash
# Redis内存优化
docker exec lch_redis redis-cli CONFIG SET maxmemory 100mb
docker exec lch_redis redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

## 🔒 安全配置

### 生产环境注意事项

1. **更改默认密码**
```bash
# 修改数据库密码
# 修改Redis密码
# 更新JWT密钥
```

2. **网络安全**
```bash
# 生产环境移除端口暴露
# 使用内部网络通信
# 配置防火墙规则
```

3. **数据备份**
```bash
# 定期备份数据库
docker exec lch_mysql mysqldump -u root -p123456 lch_v4 > backup_$(date +%Y%m%d).sql

# 备份Redis数据
docker exec lch_redis redis-cli BGSAVE
```

## 📋 部署检查清单

### 部署前检查
- [ ] Docker和Docker Compose已安装
- [ ] 端口3307、6380、5603、5602、5604、5608未被占用
- [ ] 项目代码已下载
- [ ] 环境配置文件存在

### 部署过程检查
- [ ] MySQL容器启动成功
- [ ] Redis容器启动成功
- [ ] 数据库导入成功
- [ ] 依赖安装完成
- [ ] 各服务启动成功

### 部署后验证
- [ ] API服务响应正常 (http://localhost:5603/api)
- [ ] 数据库连接正常
- [ ] Redis缓存正常
- [ ] 前端页面加载正常
- [ ] 登录功能正常

## 🆘 技术支持

### 联系方式
- **项目文档**: 项目 `doc/` 目录
- **技术文档**: `doc/deployment/` 目录
- **问题反馈**: GitHub Issues
- **邮件支持**: (待补充)

### 相关资源
- [Docker官方文档](https://docs.docker.com/)
- [Docker Compose文档](https://docs.docker.com/compose/)
- [Node.js官方文档](https://nodejs.org/)
- [Vue 3官方文档](https://vuejs.org/)
- [NestJS官方文档](https://nestjs.com/)

## 📝 版本历史

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| v1.0 | 2025-01-09 | 初始版本，完整Docker部署流程 |

---

**文档创建**: 2025-01-09  
**文档版本**: v1.0  
**适用项目**: 亮车惠智能洗车系统 v5.0  
**维护人员**: 项目开发团队