# 亮车惠自助洗车系统 - 项目设计文档

> **版本**: v2.0  
> **更新时间**: 2025-01-27  
> **适用范围**: 开发团队、产品团队、运维团队  
> **目标**: 统一项目理解，指导开发实施

---

## 1. 项目概览

### 1.1 业务定位
**亮车惠自助洗车系统** - 基于微信生态的智能自助洗车SaaS平台，提供B2B2C三级服务体系。

### 1.2 核心价值
- **用户价值**: 扫码即用，24小时自助洗车，微信支付便捷
- **商户价值**: 降本增效，数字化运营，多渠道收益
- **平台价值**: 统一管控，规模化运营，数据驱动决策

### 1.3 商业模式
- **B2B2C模式**: 平台→商户→用户的三级服务体系
- **收入来源**: 平台抽成、设备租赁、增值服务
- **增长策略**: 充值赠送、优惠券、新人福利促复购

---

## 2. 技术架构

### 2.1 技术栈
```
前端: Vue3 + TypeScript + Vite
后端: Node.js + NestJS + TypeScript  
数据库: MySQL 8.0 + Redis 6.0
部署: Docker + Docker Compose
支付: 微信支付(JSAPI) + 余额系统
IoT: 智链物联设备协议
通知: 微信模板消息 + 腾讯云短信
```

### 2.2 系统架构图
```mermaid
graph TB
    subgraph "前端应用层"
        A[用户端微信H5] 
        B[商户PC管理后台]
        C[商户H5移动端]
        D[平台PC管理后台]
        E[平台H5移动端]
    end
    
    subgraph "API网关层"
        F[Nginx反向代理]
    end
    
    subgraph "后端服务层"
        G[NestJS后端API]
        H[认证服务]
        I[订单服务]
        J[支付服务]
        K[设备服务]
        L[通知服务]
    end
    
    subgraph "数据存储层"
        M[MySQL主库]
        N[Redis缓存]
    end
    
    subgraph "第三方集成"
        O[微信公众号平台]
        P[智链物联IoT]
        Q[腾讯云SMS]
    end
    
    A --> F
    B --> F
    C --> F
    D --> F
    E --> F
    F --> G
    G --> H
    G --> I
    G --> J
    G --> K
    G --> L
    H --> M
    I --> M
    J --> M
    K --> M
    L --> M
    G --> N
    L --> O
    K --> P
    L --> Q
```

### 2.3 部署架构
```
nginx (反向代理)
├── lch-platform:5601  (平台管理前端)
├── lch-merchant:5602  (商户管理前端) 
├── lch-backend:5603   (后端API)
└── docs:5604          (API文档)

数据存储
├── MySQL:3306         (业务数据)
└── Redis:6379         (缓存/会话)

缓存层级优化
├── Redis热点数据      (设备状态、订单状态)
├── 应用内存缓存        (配置参数、用户信息)
└── CDN静态资源       (图片、JS、CSS)
```

---

## 3. 用户角色与权限

### 3.1 角色矩阵
| 角色类型 | 角色细分 | 核心权限 | 访问端 |
|----------|----------|----------|--------|
| **最终用户** | 车主用户 | 扫码洗车、订单管理、充值消费 | 微信H5 |
| **商户角色** | 商户老板 | 全店管理、财务提现、员工管理 | PC + H5 |
|  | 店长 | 设备管理、订单查看、营销配置 | PC + H5 |
|  | 店员 | 设备状态查看、异常处理 | H5 |
| **平台角色** | 超级管理员 | 全平台管理、系统配置 | PC + H5 |
|  | 财务管理员 | 结算审核、对账管理 | PC |
|  | 运维管理员 | 设备监控、异常处理 | PC + H5 |

---

## 4. 核心业务流程

### 4.1 订单状态机
```mermaid
graph LR
    A[INIT创建订单] --> B[PAY_PENDING待支付]
    B --> C[PAID已支付]
    C --> D[STARTING启动中]
    D --> E[IN_USE使用中]
    E --> F[SETTLING结算中]
    F --> G[DONE完成]
    
    B --> H[CLOSED关闭]
    D --> I[REFUNDING退款中]
    I --> J[CLOSED关闭]
    
    style A fill:#e1f5fe
    style G fill:#c8e6c9
    style H fill:#ffcdd2
    style J fill:#ffcdd2
```

### 4.2 关键时序图
```mermaid
sequenceDiagram
    participant U as 用户
    participant H as H5前端
    participant A as 后端API
    participant P as 微信支付
    participant Z as 智链物联
    participant D as 洗车设备

    U->>H: 扫码设备
    H->>A: 创建订单
    A->>H: 返回支付参数
    H->>P: 发起微信支付
    P->>A: 支付成功回调
    A->>Z: 下发启动指令
    Z->>D: 启动设备
    D->>Z: 上报启动成功
    Z->>A: 回调启动成功
    A->>H: 更新订单状态
    Note over D: 用户使用中...
    D->>Z: 上报结算数据
    Z->>A: 回调结算完成
    A->>A: 生成账单分润
```

### 4.3 设备状态管理
```mermaid
stateDiagram-v2
    [*] --> offline
    offline --> online: 设备上线
    online --> busy: 订单占用
    busy --> online: 使用结束
    online --> offline: 设备下线
    offline --> [*]
```

---

## 5. 应用端功能模块

### 5.1 用户端功能 (微信公众号H5)

#### 5.1.1 页面结构
```mermaid
graph TD
    A[首页] --> B[门店详情页]
    A --> C[个人中心]
    B --> D[设备控制页]
    D --> E[支付页]
    C --> F[订单列表]
    C --> G[充值中心]
    C --> H[优惠券页]
    F --> I[订单详情]
```

#### 5.1.2 核心功能
| 功能模块 | 核心功能 | 关键流程 |
|----------|----------|----------|
| **身份认证** | 微信OAuth登录 | 微信授权→获取openid→创建/绑定账户 |
| **门店服务** | 附近门店、设备状态 | 定位→门店列表→设备选择 |
| **洗车服务** | 扫码启动、实时控制 | 扫码→支付→启动→使用→结算 |
| **支付体系** | 微信支付、余额支付 | 订单金额→选择支付方式→完成支付 |
| **会员权益** | 充值赠送、优惠券 | 充值套餐→赠送余额→优惠券使用 |
| **订单管理** | 历史订单、退款申请 | 订单查询→详情查看→异常申诉 |

### 5.2 商户端功能 (PC + H5双端)

#### 5.2.1 PC端功能模块
```mermaid
graph LR
    A[商户资料管理] --> B[设备管理]
    B --> C[订单流水]
    C --> D[财务管理]
    D --> E[员工管理]
    E --> F[营销工具]
    F --> G[数据分析]
```

#### 5.2.2 功能详情
| 功能模块 | 核心功能 | 适用端 |
|----------|----------|--------|
| **商户资料** | 门店信息、资质管理 | PC |
| **设备管理** | 绑定设备、状态监控 | PC + H5 |
| **订单流水** | 营收统计、订单查询 | PC + H5 |
| **财务管理** | 收益查看、提现申请 | PC + H5 |
| **员工管理** | 角色分配、权限控制 | PC |
| **营销工具** | 充值套餐、优惠券 | PC |

### 5.3 平台端功能 (PC + H5双端)

#### 5.3.1 管理架构
```mermaid
graph TB
    A[系统管理] --> B[商户管理]
    B --> C[设备管理]
    C --> D[订单管理]
    D --> E[财务管理]
    E --> F[数据统计]
    F --> G[告警管理]
```

#### 5.3.2 功能矩阵
| 功能模块 | 核心功能 | 适用端 |
|----------|----------|--------|
| **商户管理** | 入驻审核、商户监管 | PC |
| **设备管理** | 全平台监控、远程控制 | PC + H5 |
| **订单管理** | 全局订单、异常处理 | PC + H5 |
| **财务管理** | 分润结算、提现审核 | PC |
| **系统配置** | 参数配置、模板管理 | PC |
| **数据统计** | 平台数据、商户排行 | PC |

---

## 6. IoT设备集成

### 6.1 智链物联协议
```mermaid
graph LR
    A[平台] -->|下发指令| B[智链云]
    B -->|设备控制| C[洗车设备]
    C -->|状态上报| B
    B -->|事件回调| A
```

### 6.2 设备事件映射
| 方向 | 事件类型 | 指令标识 | 关键字段 | 平台处理 |
|------|----------|----------|----------|----------|
| 上报 | 设备上线 | `online` | devid | 置设备状态为online |
| 上报 | 设备下线 | `offline` | devid | 置设备状态为offline |
| 上报 | 启动成功 | `cmd=09` | NO(订单号), RESULT | 订单→IN_USE |
| 上报 | 结算完成 | `cmd=10` | NO, MONEY | 订单→DONE，写分润 |
| 上报 | 设备异常 | `cmd=19` | ERR | 记录告警，推送通知 |
| 下发 | 启动设备 | `cmd=09` | devid, order_no, money | 启动指定设备 |

### 6.3 异常处理机制
| 异常场景 | 检测机制 | 处理策略 |
|----------|----------|----------|
| 设备启动失败 | 30秒超时检测 | 自动退款 |
| 结算数据丢失 | 60秒超时检测 | 人工介入 |
| 设备离线异常 | 心跳检测 | 实时告警 |

---

## 7. 第三方集成

### 7.1 微信生态集成
```mermaid
graph LR
    A[微信公众号平台] --> B[OAuth登录]
    A --> C[JSAPI支付]
    A --> D[模板消息]
    A --> E[定位API]
```

### 7.2 通知服务架构
```mermaid
graph TB
    A[统一通知网关] --> B[微信模板消息]
    A --> C[腾讯云短信]
    A --> D[场景化路由]
    A --> E[频控去重]
    A --> F[失败重试]
```

### 7.3 环境配置
```yaml
# 微信配置
WECHAT_APP_ID: wxec5eaced269d6c51
WECHAT_APP_SECRET: 3274a18161a8e149496e9dd25c339bf0
WECHAT_MCH_ID: 1682730075

# 智链物联配置  
ZL_APP_ID: 9418027365
ZL_TOKEN: 06D2ofasFJcXQgV7kLhZqNPGjyI54YUbwx3
ZL_API_URL: https://cloud.hbzhilian.com/AC/Cmd

# 数据库配置
DATABASE_URL: mysql://root:sw63828@127.0.0.1:3306/lch_v4
REDIS_URL: redis://localhost:6379/0
```

---

## 8. 数据模型设计

### 8.1 数据库优化建议

#### 8.1.1 索引优化策略
```sql
-- 订单表索引优化
CREATE INDEX idx_order_user_status_time ON orders(user_id, status, created_at);
CREATE INDEX idx_order_device_time ON orders(device_id, created_at DESC);
CREATE INDEX idx_order_no ON orders(order_no);
CREATE INDEX idx_order_status_time ON orders(status, created_at);

-- 设备表索引优化
CREATE INDEX idx_device_merchant_status ON devices(merchant_id, status);
CREATE UNIQUE INDEX idx_device_devid ON devices(devid);
CREATE INDEX idx_device_status_updated ON devices(status, last_seen_at);

-- 用户表索引优化
CREATE UNIQUE INDEX idx_user_openid ON users(openid);
CREATE INDEX idx_user_mobile ON users(mobile);
CREATE INDEX idx_user_created ON users(created_at);

-- 财务流水索引
CREATE INDEX idx_balance_user_time ON balance_ledger(user_id, created_at DESC);
CREATE INDEX idx_revenue_merchant_time ON revenue_ledger(merchant_id, created_at DESC);
```

#### 8.1.2 缓存策略设计
| 数据类型 | 缓存键 | TTL | 说明 |
|----------|---------|-----|------|
| 设备状态 | `device:status:{devid}` | 5分钟 | 实时状态缓存 |
| 用户信息 | `user:info:{openid}` | 30分钟 | 基本信息缓存 |
| 订单详情 | `order:detail:{order_no}` | 1小时 | 订单详情缓存 |
| 门店信息 | `merchant:info:{id}` | 1小时 | 门店信息缓存 |
| API限流 | `rate_limit:{user_id}:{endpoint}` | 1分钟 | 限流控制 |

### 8.2 核心实体关系
```mermaid
erDiagram
    USER ||--o{ ORDER : places
    MERCHANT ||--o{ DEVICE : owns
    DEVICE ||--o{ ORDER : serves
    ORDER ||--|| PAYMENT : has
    USER ||--o{ BALANCE_LEDGER : has
    MERCHANT ||--o{ REVENUE_LEDGER : has
    
    USER {
        int id PK
        string openid UK
        string mobile
        decimal balance
        decimal gift_balance
        datetime created_at
    }
    
    MERCHANT {
        int id PK
        string name
        string contact_phone
        string address
        enum status
        datetime created_at
    }
    
    DEVICE {
        int id PK
        string devid UK
        int merchant_id FK
        enum status
        json config_params
        datetime last_seen_at
    }
    
    ORDER {
        int id PK
        string order_no UK
        int user_id FK
        int device_id FK
        enum status
        decimal amount
        datetime start_at
        datetime end_at
    }
```

### 8.2 状态枚举定义
```typescript
enum OrderStatus {
  INIT = 'INIT',
  PAY_PENDING = 'PAY_PENDING', 
  PAID = 'PAID',
  STARTING = 'STARTING',
  IN_USE = 'IN_USE',
  SETTLING = 'SETTLING',
  DONE = 'DONE',
  REFUNDING = 'REFUNDING',
  CLOSED = 'CLOSED'
}

enum DeviceStatus {
  OFFLINE = 'offline',
  ONLINE = 'online', 
  BUSY = 'busy'
}
```

---

## 9. API设计规范

### 9.1 RESTful API结构
```
/api/v1/
├── auth/              # 认证相关
├── users/             # 用户管理  
├── merchants/         # 商户管理
├── devices/           # 设备管理
├── orders/            # 订单管理
├── payments/          # 支付管理
├── notifications/     # 通知管理
└── admin/             # 管理后台
```

### 9.2 核心API端点
| 模块 | 端点 | 方法 | 描述 |
|------|------|------|------|
| 认证 | `/api/auth/wechat` | POST | 微信OAuth登录 |
| 订单 | `/api/orders` | POST | 创建订单 |
| 支付 | `/api/payments/wxpay` | POST | 微信支付 |
| 设备 | `/api/devices/{id}/start` | POST | 启动设备 |
| 回调 | `/api/device/callback` | POST | 设备状态回调 |
| 通知 | `/api/notify/trigger` | POST | 触发通知 |

### 9.3 统一响应格式
```typescript
interface ApiResponse<T> {
  code: number;
  message: string;
  data?: T;
  timestamp: number;
}

// 成功响应
{
  "code": 0,
  "message": "success",
  "data": {...},
  "timestamp": 1706345678
}

// 错误响应  
{
  "code": 40001,
  "message": "用户未登录",
  "timestamp": 1706345678
}
```

---

## 10. 测试策略

### 10.1 测试层级
```mermaid
graph TB
    A[单元测试] --> B[集成测试]
    B --> C[端到端测试]
    C --> D[性能测试]
    D --> E[安全测试]
```

### 10.2 测试覆盖范围
| 测试类型 | 覆盖范围 | 目标 |
|----------|----------|------|
| **单元测试** | 业务逻辑、工具函数 | 覆盖率>80% |
| **集成测试** | API接口、第三方集成 | 核心流程验证 |
| **端到端测试** | 完整业务流程 | 用户场景覆盖 |
| **性能测试** | 并发、响应时间 | 性能基准验证 |
| **安全测试** | 权限、数据安全 | 安全漏洞扫描 |

---

## 11. 部署与运维

### 11.1 Docker部署
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  backend:
    build: ./lch-backend
    ports:
      - "5603:3000"
    environment:
      - NODE_ENV=production
      
  platform:
    build: ./lch-platform  
    ports:
      - "5601:80"
      
  merchant:
    build: ./lch-merchant
    ports:
      - "5602:80"
      
  mysql:
    image: mysql:8.0
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: sw63828
      
  redis:
    image: redis:6.0
    ports:
      - "6379:6379"
```

### 11.2 监控优化

#### 11.2.1 健康检查接口
```typescript
// 服务健康检查
interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: number;
  services: {
    database: 'up' | 'down';
    redis: 'up' | 'down';
    wechat: 'up' | 'down';
    zhilian: 'up' | 'down';
  };
  metrics: {
    uptime: number;
    memory_usage: number;
    cpu_usage: number;
  };
}

// 健康检查端点
GET /api/health      // 简单健康检查
GET /api/health/full // 详细健康检查
```

#### 11.2.2 关键业务指标
```typescript
// 业务指标接口
interface BusinessMetrics {
  orders: {
    total_today: number;
    success_rate: number;
    avg_amount: number;
  };
  devices: {
    total_online: number;
    total_offline: number;
    online_rate: number;
  };
  payments: {
    success_rate: number;
    total_amount_today: number;
  };
  errors: {
    rate_5min: number;
    top_errors: Array<{error: string; count: number}>;
  };
}

GET /api/metrics/business  // 业务指标
GET /api/metrics/system    // 系统指标
```

#### 11.2.3 日志集中化管理
```yaml
# docker-compose.yml 日志配置
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "100m"
        max-file: "5"
        
  # 日志收集器 (可选)
  filebeat:
    image: elastic/filebeat:7.15.0
    volumes:
      - ./logs:/logs:ro
      - ./filebeat.yml:/usr/share/filebeat/filebeat.yml
```
| 指标类型 | 监控项 | 告警阈值 |
|----------|--------|----------|
| **业务指标** | 订单成功率、支付成功率 | <95% |
| **系统指标** | CPU使用率、内存使用率 | >80% |
| **网络指标** | API响应时间 | >2s |
| **设备指标** | 设备在线率 | <90% |

---

## 12. 开发规范

### 12.1 代码规范优化

#### 12.1.1 TypeScript类型定义规范
```typescript
// 统一类型定义
interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
  timestamp: number;
}

// 业务实体类型
interface User {
  id: number;
  openid: string;
  mobile?: string;
  nickname?: string;
  avatar?: string;
  balance: number;
  gift_balance: number;
  created_at: Date;
  updated_at: Date;
}

interface Order {
  id: number;
  order_no: string;
  user_id: number;
  device_id: number;
  merchant_id: number;
  status: OrderStatus;
  amount: number;
  start_at?: Date;
  end_at?: Date;
  created_at: Date;
}
```

#### 12.1.2 错误处理规范
```typescript
// 统一错误码定义
enum ErrorCode {
  SUCCESS = 0,
  INVALID_PARAMS = 40001,
  UNAUTHORIZED = 40101,
  FORBIDDEN = 40301,
  NOT_FOUND = 40401,
  DEVICE_OFFLINE = 50001,
  DEVICE_BUSY = 50002,
  PAYMENT_FAILED = 50003,
  DEVICE_START_TIMEOUT = 50004
}

// 自定义异常类
class BusinessException extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public details?: any
  ) {
    super(message);
  }
}
```

#### 12.1.3 日志规范
```typescript
// 统一日志格式
interface LogContext {
  traceId: string;      // 请求追踪标识
  userId?: number;      // 用户ID
  action: string;       // 操作类型
  resource: string;     // 资源类型
  details?: any;        // 详细信息
}

// 日志级别使用
logger.info('User login', { userId, action: 'login', resource: 'auth' });
logger.warn('Device offline', { deviceId, action: 'status_change', resource: 'device' });
logger.error('Payment failed', { orderId, error, action: 'payment', resource: 'order' });
```

### 12.2 Git工作流优化

#### 12.2.1 分支命名规范
```
feature/功能名称        # 新功能开发
bugfix/问题描述         # Bug修复
hotfix/紧急修复         # 线上紧急修复
release/v1.0.0            # 发版分支

# 示例
feature/user-wechat-login
bugfix/device-status-update
hotfix/payment-callback-error
```

#### 12.2.2 Commit信息规范
```
feat: 新增功能
fix: 修复问题
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建流程或辅助工具变动

# 示例
feat: add wechat oauth login for user
fix: resolve device status update issue
docs: update API documentation for payment
```

### 12.3 代码质量保障

#### 12.3.1 ESLint + Prettier配置
```json
// .eslintrc.js
{
  "extends": [
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "prefer-const": "error",
    "no-var": "error"
  }
}

// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

#### 12.3.2 代码审查清单
- [ ] 代码是否遵循TypeScript类型规范
- [ ] 是否有适当的错误处理
- [ ] 是否有单元测试覆盖
- [ ] API接口是否有文档
- [ ] 敏感数据是否加密/脱敏
- [ ] 是否有适当的日志记录
```mermaid
graph LR
    A[feature分支] --> B[develop分支]
    B --> C[release分支]
    C --> D[main分支]
    D --> E[hotfix分支]
    E --> B
```

### 12.3 发版流程
1. **开发阶段**: feature分支开发
2. **测试阶段**: 合并到develop分支
3. **预发布**: 创建release分支
4. **生产发布**: 合并到main分支
5. **紧急修复**: hotfix分支处理

---

## 13. 安全与可靠性

### 13.1 安全保障增强

#### 13.1.1 API安全增强
```typescript
// API限流策略
interface RateLimitConfig {
  windowMs: number;     // 时间窗口
  maxRequests: number;  // 最大请求数
  skipSuccessfulRequests: boolean;
}

// 不同接口的限流配置
const rateLimitConfigs = {
  '/api/orders': { windowMs: 60000, maxRequests: 30 },
  '/api/payments': { windowMs: 60000, maxRequests: 10 },
  '/api/device/callback': { windowMs: 60000, maxRequests: 1000 }
};
```

#### 13.1.2 数据加密策略
```typescript
// 敏感数据加密
interface SensitiveDataEncryption {
  mobile: string;        // AES加密存储
  idCard: string;        // AES加密存储
  bankAccount: string;   // AES加密存储
}

// 数据脱敏策略
const maskSensitiveData = {
  mobile: (mobile: string) => mobile.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
  idCard: (id: string) => id.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2')
};
```

#### 13.1.3 权限控制增强
```typescript
// RBAC权限模型
interface Permission {
  resource: string;      // 资源
  action: string;        // 操作
  scope?: string;        // 作用域
}

// 角色权限矩阵
const rolePermissions = {
  'platform_admin': ['*:*'],
  'merchant_admin': ['merchant:*:own', 'device:*:own', 'order:read:own'],
  'merchant_staff': ['device:read:own', 'order:read:own'],
  'user': ['order:*:own', 'payment:*:own']
};
```

### 13.2 可靠性设计增强

#### 13.2.1 异常处理机制优化
```mermaid
graph TD
    A[设备启动请求] --> B{设备状态检查}
    B -->|offline| C[返回设备离线错误]
    B -->|busy| D[返回设备占用错误]
    B -->|online| E[下发启动指令]
    E --> F[等待设备响应]
    F --> G{30秒超时检查}
    G -->|超时| H[自动退款]
    G -->|成功| I[订单进入使用中]
    H --> J[订单关闭]
    I --> K[使用结束检查]
    K --> L{60秒结算超时}
    L -->|超时| M[人工介入]
    L -->|正常| N[自动结算]
```

#### 13.2.2 服务降级策略
| 服务 | 降级策略 | 备用方案 |
|------|----------|----------|
| 微信支付 | 余额支付 | 线下支付码 |
| 智链设备 | 手动启动 | 管理员人工处理 |
| 微信模板消息 | 短信通知 | 邮件通知 |
| Redis缓存 | 直接查数据库 | 内存缓存 |

### 13.3 监控告警优化

#### 13.3.1 关键指标监控
```typescript
interface MonitoringMetrics {
  // 业务指标
  orderSuccessRate: number;        // 订单成功率
  paymentSuccessRate: number;      // 支付成功率
  deviceOnlineRate: number;        // 设备在线率
  refundRate: number;              // 退款率
  
  // 技术指标
  apiResponseTime: number;         // API响应时间
  errorRate: number;               // 错误率
  qps: number;                     // 每秒请求数
  cpuUsage: number;                // CPU使用率
  memoryUsage: number;             // 内存使用率
}

// 告警阈值配置
const alertThresholds = {
  orderSuccessRate: 95,    // 低于95%告警
  deviceOnlineRate: 90,    // 低于90%告警
  apiResponseTime: 2000,   // 超过2秒告警
  errorRate: 5,            // 错误率超过5%告警
  cpuUsage: 80,            // CPU超过80%告警
  memoryUsage: 85          // 内存超过85%告警
};
```

---

## 14. 项目交付清单

### 14.1 代码交付
- [ ] 后端服务 (lch-backend)
- [ ] 平台前端 (lch-platform) 
- [ ] 商户前端 (lch-merchant)
- [ ] 用户H5页面 (集成在后端)
- [ ] 数据库脚本
- [ ] Docker部署配置

### 14.2 文档交付  
- [ ] API接口文档
- [ ] 数据库设计文档
- [ ] 部署运维文档
- [ ] 用户操作手册
- [ ] 管理员使用指南

### 14.3 测试交付
- [ ] 测试用例文档
- [ ] 性能测试报告  
- [ ] 安全测试报告
- [ ] 用户验收测试

## 15. 后续优化建议

### 15.1 短期优化 (1-2周)
- [ ] 完善API接口文档，增加请求/响应示例
- [ ] 添加单元测试覆盖率要求 (>80%)
- [ ] 实现统一的错误处理和日志规范
- [ ] 优化数据库索引和查询性能
- [ ] 增加关键业务指标监控

### 15.2 中期优化 (1-2月)
- [ ] 实现缓存策略优化，提升系统性能
- [ ] 完善安全防护，增加API限流和数据加密
- [ ] 建立完整的监控告警体系
- [ ] 优化前端组件结构，提升开发效率
- [ ] 实现自动化测试和部署流程

### 15.3 长期优化 (3-6月)
- [ ] 考虑微服务架构拆分 (如业务规模扩大)
- [ ] 实现读写分离优化数据库性能
- [ ] 建立数据分析平台，支持业务决策
- [ ] 完善用户体验，增加个性化功能
- [ ] 建立完整的运维自动化体系

### 15.4 技术债务管理
- [ ] 定期代码重构，保持代码质量
- [ ] 升级依赖包版本，修复安全漏洞
- [ ] 优化数据库表结构，提升查询效率
- [ ] 完善文档更新机制，保持文档同步
- [ ] 建立代码review流程，确保代码质量