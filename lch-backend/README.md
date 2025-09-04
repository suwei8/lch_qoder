# 亮车惠自助洗车系统后端服务

## 项目结构

```
lch-backend/
├── src/
│   ├── auth/           # 认证模块
│   ├── users/          # 用户管理模块  
│   ├── merchants/      # 商户管理模块
│   ├── devices/        # 设备管理模块
│   ├── orders/         # 订单管理模块
│   ├── payments/       # 支付管理模块
│   ├── common/         # 公共模块
│   ├── config/         # 配置模块
│   └── main.ts         # 应用入口
├── .env                # 环境配置
├── .env.example        # 环境配置示例
└── package.json
```

## 核心功能

### ✅ 已完成的模块

1. **认证授权模块**
   - JWT认证策略
   - 角色权限控制
   - 用户登录/注册

2. **用户管理模块**
   - 用户CRUD操作
   - 用户角色管理（普通用户、商户、平台管理员）
   - 用户余额管理
   - 用户统计信息

3. **商户管理模块**
   - 商户申请和审批
   - 商户信息管理
   - 商户收入和结算
   - 商户统计信息

4. **设备管理模块**
   - 设备注册和管理
   - 设备状态监控
   - 设备远程控制
   - 附近设备查询
   - 设备使用统计

5. **订单管理模块**
   - 订单创建和管理
   - 订单状态机处理
   - 支付和退款处理
   - 设备启动和完成流程
   - 订单统计信息

6. **支付管理模块**
   - 微信支付集成（基础框架）
   - 余额支付
   - 支付结果处理
   - 退款处理

7. **公共模块**
   - 日志服务
   - 缓存服务（内存实现）
   - 工具服务
   - 异常处理
   - 响应拦截器

## 技术栈

- **框架**: NestJS + TypeScript
- **数据库**: MySQL + TypeORM  
- **缓存**: 内存缓存（可扩展到Redis）
- **认证**: JWT + Passport
- **文档**: Swagger/OpenAPI
- **验证**: Class-validator

## 环境配置

1. 复制环境配置文件：
```bash
cp .env.example .env
```

2. 修改 `.env` 文件中的配置：
   - 数据库连接信息
   - JWT密钥
   - 微信支付配置
   - 智链物联配置

## 运行说明

1. 安装依赖：
```bash
npm install
```

2. 启动开发服务：
```bash
npm run start:dev
```

3. 访问API文档：
```
http://localhost:5603/api/docs
```

## API接口

### 认证相关
- POST /auth/login - 用户登录
- POST /auth/register - 用户注册
- POST /auth/refresh - 刷新令牌

### 用户管理
- GET /users - 用户列表
- GET /users/profile - 当前用户信息
- POST /users - 创建用户
- PATCH /users/:id - 更新用户
- DELETE /users/:id - 删除用户

### 商户管理  
- POST /merchants/apply - 申请成为商户
- GET /merchants - 商户列表
- PATCH /merchants/:id/approve - 审批商户

### 设备管理
- GET /devices - 设备列表
- GET /devices/nearby - 附近设备
- POST /devices - 创建设备
- POST /devices/:id/control - 控制设备

### 订单管理
- POST /orders - 创建订单
- GET /orders - 订单列表
- POST /orders/:id/cancel - 取消订单
- POST /orders/:id/refund - 订单退款

## 数据库表结构

- `users` - 用户表
- `merchants` - 商户表
- `devices` - 设备表
- `orders` - 订单表

## 状态说明

### 订单状态流转
```
INIT → PAY_PENDING → PAID → STARTING → IN_USE → SETTLING → DONE
                          ↓
                     CANCELLED/REFUNDED
```

### 设备状态
- ONLINE - 在线
- OFFLINE - 离线  
- MAINTENANCE - 维护
- ERROR - 故障

### 设备工作状态
- IDLE - 空闲
- WORKING - 工作中
- PAUSED - 暂停

## 权限控制

- **USER**: 普通用户，可创建订单、查看自己的数据
- **MERCHANT**: 商户，可管理自己的设备和订单
- **PLATFORM_ADMIN**: 平台管理员，可管理所有数据

## 下一步开发

1. 完善微信支付集成
2. 集成智链物联设备协议
3. 添加通知服务模块
4. 完善单元测试
5. 部署配置优化