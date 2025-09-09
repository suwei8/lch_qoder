# 🚀 亮车惠智能洗车管理系统 - 快速部署指南

## 📋 项目概述

亮车惠是一个基于物联网技术的智能洗车服务平台，包含用户H5端、商户管理端、平台管理端和后端API服务四个核心模块。

### 🏗️ 系统架构
```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   用户端 (H5)    │  │  商户端(PC+H5)   │  │  平台端(PC+H5)   │
│   端口: 5604     │  │   端口: 5609     │  │   端口: 5602     │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                     │                     │
         └─────────────────────┼─────────────────────┘
                               │
                ┌─────────────────────────────────────┐
                │          后端API服务                │
                │          端口: 5603                 │
                └─────────────────────────────────────┘
                               │
                ┌─────────────────────────────────────┐
                │           数据层                     │
                │    MySQL:3306   Redis:6379          │
                └─────────────────────────────────────┘
```

## 🛠️ 技术栈

### 后端技术栈
- **框架**: NestJS + TypeScript
- **数据库**: MySQL 8.0 + Redis 6.0
- **认证**: JWT + 微信OAuth
- **支付**: 微信支付JSAPI
- **设备**: 智链物联IoT协议

### 前端技术栈
- **框架**: Vue 3 + TypeScript
- **UI组件**: Element Plus
- **状态管理**: Pinia
- **构建工具**: Vite
- **路由**: Vue Router 4

## 🚀 快速部署

### 前置要求
- Node.js >= 16.0.0
- MySQL >= 8.0
- Redis >= 6.0
- npm 或 yarn

### 1️⃣ 克隆项目
```bash
git clone <repository-url>
cd lch_qoder
```

### 2️⃣ 安装依赖
```bash
# 安装根目录依赖
npm install

# 安装后端依赖
cd lch-backend
npm install
cd ..

# 安装平台管理端依赖
cd lch-platform
npm install
cd ..

# 安装商户管理端依赖
cd lch-merchant
npm install
cd ..

# 安装用户H5端依赖
cd lch-user-h5
npm install
cd ..
```

### 3️⃣ 数据库配置

#### 导入数据库
```bash
# 创建数据库
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS lch_v4 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 导入数据
mysql -u root -p lch_v4 < database_export.sql
```

#### 配置数据库连接
复制并修改环境配置文件：
```bash
cp .env.template .env.local
```

编辑 `.env.local` 文件，配置数据库连接信息：
```bash
# 数据库配置
DATABASE_HOST=127.0.0.1
DATABASE_PORT=3306
DATABASE_USERNAME=root
DATABASE_PASSWORD=your_mysql_password
DATABASE_NAME=lch_v4

# Redis配置
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=
```

### 4️⃣ 启动服务

#### 方法一：使用快速启动脚本（推荐）
```bash
# Windows
./quick-start.bat

# 或者使用PowerShell
./start-dev.ps1
```

#### 方法二：手动启动（按照以下顺序）

1. **启动后端API服务**
```bash
cd lch-backend
npm run start:dev
# 服务将在 http://localhost:5603 启动
```

2. **启动平台管理端**
```bash
cd lch-platform
npm run dev
# 服务将在 http://localhost:5602 启动
```

3. **启动用户H5端**
```bash
cd lch-user-h5
npm run dev
# 服务将在 http://localhost:5604 启动
```

4. **启动商户管理端**
```bash
cd lch-merchant
npm run dev
# 服务将在 http://localhost:5609 启动
```

### 5️⃣ 访问系统

| 模块 | URL | 说明 |
|------|-----|------|
| 后端API | http://localhost:5603 | API服务和接口文档 |
| 平台管理端 | http://localhost:5602 | 平台运营管理后台 |
| 用户H5端 | http://localhost:5604 | 微信H5用户端 |
| 商户管理端 | http://localhost:5609 | 商户管理后台 |

### 6️⃣ 默认账户

#### 平台管理员
- 账号: `admin`
- 密码: `123456`
- 访问: http://localhost:5602/login

#### 测试商户
- 账号: `merchant_test`
- 密码: `123456`
- 访问: http://localhost:5609/login

## 🔧 开发配置

### 端口配置
确保以下端口未被占用：
- `5602`: 平台管理端
- `5603`: 后端API服务
- `5604`: 用户H5端
- `5609`: 商户管理端
- `3306`: MySQL数据库
- `6379`: Redis缓存

### 环境变量说明

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| NODE_ENV | 运行环境 | development |
| DATABASE_HOST | 数据库主机 | 127.0.0.1 |
| DATABASE_PORT | 数据库端口 | 3306 |
| DATABASE_USERNAME | 数据库用户名 | root |
| DATABASE_PASSWORD | 数据库密码 | - |
| DATABASE_NAME | 数据库名 | lch_v4 |
| REDIS_HOST | Redis主机 | 127.0.0.1 |
| REDIS_PORT | Redis端口 | 6379 |
| JWT_SECRET | JWT密钥 | - |
| WECHAT_APPID | 微信应用ID | - |
| WECHAT_SECRET | 微信应用密钥 | - |

## 🐳 Docker部署（可选）

### 启动数据库服务
```bash
docker-compose -f docker-compose.db.yml up -d
```

### 完整容器化部署
```bash
docker-compose up -d
```

## 📝 项目结构

```
lch_qoder/
├── lch-backend/          # 后端API服务 (NestJS)
├── lch-platform/         # 平台管理端 (Vue3)
├── lch-merchant/         # 商户管理端 (Vue3)
├── lch-user-h5/          # 用户H5端 (Vue3)
├── doc/                  # 项目文档
├── test/                 # 测试文件
├── scripts/              # 构建脚本
├── .env.local            # 环境配置文件
├── .env.template         # 环境配置模板
├── database_export.sql   # 数据库导出文件
├── docker-compose.yml    # Docker编排文件
├── quick-start.bat       # 快速启动脚本
└── README.md            # 项目说明
```

## 🔍 功能验证

### 1. 后端API验证
访问 http://localhost:5603 查看API状态

### 2. 平台管理端验证
1. 访问 http://localhost:5602/login
2. 使用管理员账户登录
3. 查看仪表盘数据

### 3. 商户管理端验证
1. 访问 http://localhost:5609/login
2. 使用测试商户账户登录
3. 查看商户仪表盘

### 4. 用户H5端验证
访问 http://localhost:5604 查看用户端界面

## 🆘 常见问题

### 数据库连接失败
1. 检查MySQL服务是否运行
2. 确认数据库用户名和密码
3. 确认数据库lch_v4是否存在

### Redis连接失败
1. 检查Redis服务是否运行
2. 确认Redis端口6379是否开放

### 端口冲突
1. 检查端口是否被占用：`netstat -an | findstr :5603`
2. 修改vite.config.ts中的端口配置
3. 重启相应服务

### 依赖安装失败
1. 清理缓存：`npm cache clean --force`
2. 删除node_modules：`rm -rf node_modules`
3. 重新安装：`npm install`

## 📞 技术支持

如有问题，请检查：
1. Node.js版本是否 >= 16.0.0
2. 数据库和Redis是否正常运行
3. 端口是否冲突
4. 环境变量配置是否正确

## 🔄 更新部署

### 拉取最新代码
```bash
git pull origin main
```

### 更新依赖
```bash
npm run install:all
```

### 数据库迁移
```bash
# 如有数据库结构变更，重新导入
mysql -u root -p lch_v4 < database_export.sql
```

### 重启服务
```bash
# 使用快速启动脚本重启所有服务
./quick-start.bat
```

---

🎉 **恭喜！您已成功部署亮车惠智能洗车管理系统！**

如需更详细的开发文档，请查看 `doc/` 目录中的相关文档。