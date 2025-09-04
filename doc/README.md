# 亮车惠 · 自助洗车系统

一个基于 Node.js + Vue3 的现代化自助洗车管理平台，通过微信公众号H5为用户提供便捷的自助洗车体验，并为加盟商户和平台提供统一的运营管理后台。

## 🚀 项目特性

- **现代化技术栈**: Node.js + NestJS + Vue3 + TypeScript
- **三端应用**: 用户端(微信H5) + 商户管理后台 + 平台管理后台
- **微信生态**: 支持微信公众号服务号H5、微信支付
- **自助洗车**: 扫码启动、在线支付、设备控制
- **商户运营**: 设备管理、订单流水、财务提现
- **平台管控**: 商户审核、设备监控、财务结算
- **容器化部署**: Docker + Docker Compose 一键部署

## 📁 项目结构

```
lch_v3/
├── lch-backend/          # 后端服务 (NestJS)
│   ├── src/
│   │   ├── auth/         # 认证模块
│   │   ├── users/        # 用户管理
│   │   ├── merchants/    # 商户管理
│   │   ├── devices/      # 洗车设备管理
│   │   ├── orders/       # 订单管理
│   │   ├── payments/     # 支付管理
│   │   └── common/       # 公共模块
│   ├── Dockerfile
│   └── package.json
├── lch-platform/         # 平台管理前端 (Vue3)
│   ├── src/
│   │   ├── views/        # 页面组件
│   │   ├── components/   # 公共组件
│   │   ├── stores/       # 状态管理
│   │   └── utils/        # 工具函数
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── lch-merchant/         # 商户管理前端 (Vue3)
│   ├── src/
│   │   ├── views/        # 页面组件
│   │   ├── components/   # 公共组件
│   │   ├── stores/       # 状态管理
│   │   └── utils/        # 工具函数
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── nginx/                # Nginx配置
│   ├── nginx.conf
│   └── conf.d/
│       └── default.conf
├── docker-compose.prod.yml  # 生产环境配置
├── .env.production       # 环境变量
├── deploy.sh            # Linux/Mac 部署脚本
├── deploy.bat           # Windows 部署脚本
└── README.md
```

## 🌐 访问地址

部署完成后，可以通过以下地址访问：

- **平台管理后台**: http://localhost:5601
- **商户管理后台**: http://localhost:5602
- **后端API**: http://localhost:5603/api
- **API文档**: http://localhost:5604/api/docs



## 👤 默认账户

### 平台管理员
- **用户名**: admin
- **密码**: 123456
- **角色**: platform_admin

### 商户管理员
- **用户名**: merchant_admin
- **密码**: 123456
- **角色**: merchant_admin

## 🚀 快速开始

### Windows 系统部署

```bash
# 运行部署脚本
deploy.bat
```

### Linux/Mac 系统部署

```bash
# 给脚本执行权限
chmod +x deploy.sh

# 运行部署脚本
./deploy.sh
```

---

**亮车惠 · 自助洗车系统** - 让洗车更便捷，让运营更高效！