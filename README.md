# 洗车IOT管理系统 🚗💧

[![技术栈](https://img.shields.io/badge/Stack-NestJS%20%2B%20Vue3-brightgreen)](https://github.com/suwei8/lch_qoder)
[![数据库](https://img.shields.io/badge/Database-MySQL%20%2B%20Redis-blue)](https://github.com/suwei8/lch_qoder)
[![部署](https://img.shields.io/badge/Deploy-Docker-orange)](https://github.com/suwei8/lch_qoder)

## 📋 项目简介

洗车IOT管理系统是一个基于物联网技术的智能洗车服务平台，通过微信生态实现用户扫码洗车、商户设备管理、平台运营监控的完整业务闭环。

### 🎯 核心功能

- **🔐 统一认证** - JWT + 微信OAuth双重认证体系
- **📱 微信生态** - 公众号H5、模板消息、JSAPI支付
- **🏪 商户管理** - 设备监控、订单流水、财务提现
- **🖥️ 平台运营** - 数据看板、商户审核、系统配置
- **💰 支付体系** - 微信支付 + 余额支付 + 自动分润
- **📡 设备对接** - 智链物联设备远程控制与状态监控

## 🏗️ 系统架构

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   用户端 (H5)    │  │  商户端(PC+H5)   │  │  平台端(PC+H5)   │
│                 │  │                 │  │                 │
│ • 微信扫码洗车   │  │ • 设备管理       │  │ • 商户审核       │
│ • 订单支付      │  │ • 订单查看       │  │ • 数据统计       │
│ • 余额充值      │  │ • 财务提现       │  │ • 系统配置       │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                     │                     │
         └─────────────────────┼─────────────────────┘
                               │
                ┌─────────────────────────────────────┐
                │            后端服务                  │
                │                                    │
                │ 🔐 认证授权  📋 订单管理  🏪 商户管理  │
                │ 📡 设备管理  💰 支付管理  📢 通知服务  │
                └─────────────────────────────────────┘
                               │
                ┌─────────────────────────────────────┐
                │           数据层                     │
                │                                    │
                │    📊 MySQL     🚀 Redis            │
                │    业务数据      缓存/会话            │
                └─────────────────────────────────────┘
```

## 🛠️ 技术栈

### 后端技术
- **框架**: NestJS + TypeScript
- **数据库**: MySQL 8.0 + Redis 6.0
- **认证**: JWT + 微信OAuth
- **支付**: 微信支付JSAPI
- **设备**: 智链物联IoT协议
- **部署**: Docker + Docker Compose

### 前端技术
- **框架**: Vue 3 + TypeScript
- **UI组件**: Element Plus
- **状态管理**: Pinia
- **构建工具**: Vite
- **路由**: Vue Router 4

## 🚀 快速开始

### 环境要求
- Node.js >= 16.0.0
- MySQL >= 8.0
- Redis >= 6.0
- Docker & Docker Compose (推荐)

### 🐳 Docker 一键启动 (推荐)

```bash
# 克隆项目
git clone https://github.com/suwei8/lch_qoder.git
cd lch_qoder

# 启动数据库服务
docker-compose -f docker-compose.db.yml up -d

# 快速启动开发环境
./quick-start.bat  # Windows
# 或
./start-dev.ps1   # PowerShell
```

### 🔧 手动安装

```bash
# 1. 启动数据库
docker-compose -f docker-compose.db.yml up -d

# 2. 安装后端依赖并启动
cd lch-backend
npm install
npm run start:dev

# 3. 安装前端依赖并启动 (新终端)
cd lch-platform
npm install
npm run dev
```

### 📊 初始化数据

```sql
-- 导入初始化SQL
mysql -u root -p < docs/database/init.sql
```

### 🌐 访问地址

- **平台管理端**: http://localhost:5173
- **后端API**: http://localhost:3000
- **API文档**: http://localhost:3000/api

## 📁 项目结构

```
lch_qoder/
├── 📂 lch-backend/              # 后端服务 (NestJS)
│   ├── 📂 src/
│   │   ├── 🔐 auth/             # 认证授权模块
│   │   ├── 👥 users/            # 用户管理模块  
│   │   ├── 🏪 merchants/        # 商户管理模块
│   │   ├── 📋 orders/           # 订单管理模块
│   │   ├── 📡 devices/          # 设备管理模块
│   │   ├── 💰 payments/         # 支付管理模块
│   │   └── 🔧 common/           # 公共服务模块
│   └── 📄 package.json
├── 📂 lch-platform/             # 平台管理端 (Vue3)
│   ├── 📂 src/
│   │   ├── 🎨 views/            # 页面组件
│   │   ├── 🔌 api/              # API接口
│   │   ├── 📝 types/            # TypeScript类型
│   │   ├── 🗂️ stores/           # Pinia状态管理
│   │   └── 🎭 layout/           # 布局组件
│   └── 📄 package.json
├── 📂 doc/                      # 项目文档
├── 📂 docs/                     # 数据库文档
├── 🐳 docker-compose.db.yml     # 数据库Docker配置
├── 🚀 quick-start.bat          # 快速启动脚本
└── 📖 README.md                # 项目说明
```

## 🔧 开发脚本

| 脚本 | 说明 |
|------|------|
| `quick-start.bat` | 一键启动开发环境 |
| `start-backend.bat` | 启动后端服务 |
| `start-dev.bat` | 启动前端开发服务 |
| `start-dev-cn.bat` | 使用国内镜像启动 |
| `fix-ports.ps1` | 修复端口占用问题 |

## 📊 数据库设计

### 核心数据表

- **👥 users** - 用户信息表
- **🏪 merchants** - 商户信息表  
- **📡 devices** - 设备信息表
- **📋 orders** - 订单信息表
- **💰 payments** - 支付记录表
- **📢 notifications** - 通知记录表

### 📈 索引优化

- 用户微信OpenID索引
- 订单状态和时间复合索引
- 设备商户关联索引
- 支付流水号唯一索引

## 🔌 API接口

### 认证接口
```http
POST /auth/wechat/login    # 微信登录
POST /auth/refresh         # 刷新Token
GET  /auth/profile         # 获取用户信息
```

### 设备管理
```http
GET    /devices            # 设备列表
POST   /devices/:id/control # 设备控制
GET    /devices/:id/status  # 设备状态
```

### 订单管理
```http
POST   /orders             # 创建订单
GET    /orders             # 订单列表
POST   /orders/:id/pay     # 订单支付
```

## 🚀 部署说明

### 生产环境部署

```bash
# 1. 构建后端
cd lch-backend
npm run build

# 2. 构建前端
cd lch-platform  
npm run build

# 3. 使用Docker部署
docker-compose up -d
```

### 环境变量配置

复制并配置环境变量文件：
```bash
cp lch-backend/.env.example lch-backend/.env
```

关键配置项：
- `DATABASE_URL` - MySQL连接地址
- `REDIS_URL` - Redis连接地址  
- `JWT_SECRET` - JWT密钥
- `WECHAT_APPID` - 微信AppID
- `WECHAT_SECRET` - 微信AppSecret

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 📝 更新日志

### v1.0.0 (2025-01-05)
- ✨ 初始版本发布
- 🔐 完成用户认证体系
- 📱 集成微信生态功能
- 🏪 实现商户管理功能
- 📡 对接智链物联设备
- 💰 完成支付体系开发

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系方式

- **项目维护者**: suwei8
- **GitHub**: https://github.com/suwei8/lch_qoder
- **问题反馈**: [GitHub Issues](https://github.com/suwei8/lch_qoder/issues)

---

⭐ 如果这个项目对你有帮助，请给个 Star 支持一下！