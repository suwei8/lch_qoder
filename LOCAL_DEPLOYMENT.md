# 洗车IOT管理系统 - 本机开发部署方案

## 概述

本方案完全脱离Docker，直接使用本机安装的MySQL和Redis服务进行开发调试。适用于无法安装Docker或希望使用本机数据库服务的开发环境。

## 环境要求

### 必需软件
- **Node.js** >= 16.0.0
- **MySQL** >= 8.0 (本机安装)
- **Redis** >= 6.0 (本机安装或WSL2)
- **Git** (用于代码管理)

### 本机服务配置
- **MySQL**: 127.0.0.1:3306
  - 用户名: root
  - 密码: cCNyGNDDD5Mp6d9f
  - 数据库: lch_v4

- **Redis**: 127.0.0.1:6379
  - 密码: 无

## 快速开始

### 1. 环境检查
运行环境检查脚本，确保所有依赖正常：
```bash
check-local-env.bat
```

### 2. 初始化数据库
如果数据库不存在，运行初始化脚本：
```bash
init-local-database.bat
```

### 3. 启动项目
运行本机启动脚本：
```bash
start-local-native.bat
```

## 文件说明

### 配置文件
- `.env.local` - 项目根目录环境配置
- `lch-backend/.env` - 后端服务环境配置

### 启动脚本
- `start-local-native.bat` - 主启动脚本
- `check-local-env.bat` - 环境检查脚本
- `init-local-database.bat` - 数据库初始化脚本
- `test-redis-connection.bat` - Redis连接测试脚本

## 服务访问地址

启动成功后，可通过以下地址访问：

- **后端API**: http://localhost:5603/api
- **API文档**: http://localhost:5603/api/docs
- **前端平台**: http://localhost:5601

## 默认登录信息

- **用户名**: admin
- **密码**: 123456

## 技术架构

```
┌─────────────────┐  ┌─────────────────┐
│  前端服务 :5601  │  │  后端服务 :5603  │
│    Vue 3 +      │  │    NestJS +     │
│  Element Plus   │  │   TypeScript    │
└─────────────────┘  └─────────────────┘
         │                     │
         └─────────┬─────────────┘
                   │
         ┌─────────▼─────────┐
         │   本机数据服务     │
         │                  │
         │ MySQL   │ Redis  │
         │ :3306   │ :6379  │
         └──────────────────┘
```

## 开发流程

### 1. 代码修改
- 后端代码修改后会自动重载（使用 `npm run start:dev`）
- 前端代码修改后会自动刷新（使用 Vite 热重载）

### 2. 数据库管理
- 使用任意MySQL客户端连接：127.0.0.1:3306
- 或使用命令行：`mysql -h 127.0.0.1 -P 3306 -u root -pcCNyGNDDD5Mp6d9f lch_v4`

### 3. Redis管理
- 使用Redis CLI：`redis-cli -h 127.0.0.1 -p 6379`
- 或使用图形化工具如Redis Desktop Manager

## 常见问题

### Q: MySQL连接失败
**A**: 检查以下几点：
1. MySQL服务是否启动
2. 密码是否正确：`cCNyGNDDD5Mp6d9f`
3. 端口3306是否被其他程序占用
4. 防火墙是否阻止连接

### Q: Redis连接失败
**A**: 如果使用WSL2安装Redis：
```bash
# 启动WSL2中的Redis
wsl redis-server

# 或在WSL2中后台启动
wsl redis-server --daemonize yes
```

### Q: 端口被占用
**A**: 检查并关闭占用端口的程序：
```bash
# 查看端口占用
netstat -ano | findstr :5603
netstat -ano | findstr :5601

# 结束进程
taskkill /PID <进程ID> /F
```

### Q: 依赖安装失败
**A**: 使用国内镜像源：
```bash
npm config set registry https://registry.npmmirror.com
```

## 与Docker方案的区别

| 对比项 | Docker方案 | 本机方案 |
|--------|------------|----------|
| MySQL端口 | 3307 | 3306 |
| Redis端口 | 6380 | 6379 |
| 数据持久化 | Docker卷 | 本机文件系统 |
| 服务管理 | docker-compose | 系统服务 |
| 性能 | 虚拟化开销 | 原生性能 |
| 环境隔离 | 完全隔离 | 共享主机 |

## 注意事项

1. **数据备份**: 本机MySQL数据需要定期备份
2. **端口冲突**: 确保3306和6379端口不被其他程序占用
3. **服务启动**: 每次重启电脑后需要手动启动MySQL和Redis服务
4. **环境变量**: 不要将包含敏感信息的`.env`文件提交到Git
5. **开发调试**: 可以直接在本机使用数据库客户端工具进行调试

## 扩展配置

### 微信开发配置
修改`.env`文件中的微信配置：
```env
WECHAT_APPID=your_actual_appid
WECHAT_SECRET=your_actual_secret
```

### 设备接口配置
修改智链物联设备配置：
```env
ZL_API_URL=https://cloud.hbzhilian.com/AC/Cmd
ZL_APP_ID=your_device_app_id
ZL_SECRET=your_device_secret
```

### 短信服务配置
配置短信服务（可选）：
```env
SMS_ACCESS_KEY=your_sms_access_key
SMS_SECRET_KEY=your_sms_secret_key
SMS_SIGN_NAME=亮车惠
```

## 支持与帮助

如遇问题，请按以下顺序排查：
1. 运行 `check-local-env.bat` 检查环境
2. 查看控制台错误日志
3. 检查数据库和Redis连接
4. 确认端口是否被占用

---

*本文档基于洗车IOT管理系统v1.0，如有更新请参考最新版本文档。*