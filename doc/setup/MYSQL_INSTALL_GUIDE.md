# MySQL 8.0 Windows 安装指南

## 1. 下载MySQL
访问官方下载页面：https://dev.mysql.com/downloads/mysql/
- 选择 "MySQL Community Server"
- 操作系统选择 "Microsoft Windows"
- 下载 "Windows (x86, 64-bit), MSI Installer"

## 2. 安装步骤
1. 运行下载的MSI安装程序
2. 选择安装类型：推荐选择 "Developer Default"
3. 配置设置：
   - **服务器端口**：3306 (如果冲突可改为3307)
   - **Root密码**：sw63828 (与项目配置保持一致)
   - **认证方式**：选择 "Use Legacy Authentication Method"

## 3. 验证安装
```cmd
# 测试MySQL连接
mysql -u root -p
# 输入密码：sw63828

# 创建项目数据库
CREATE DATABASE lch_v4 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 4. 配置MySQL服务
```cmd
# 启动MySQL服务
net start mysql80

# 停止MySQL服务
net stop mysql80

# 设置开机自启动
sc config mysql80 start= auto
```

## 5. 防火墙配置（如需要）
- 打开Windows防火墙设置
- 新建入站规则，允许端口3306
- 或者直接允许MySQL应用程序

## 6. 导入初始化数据
```bash
# 如果有初始化SQL文件
mysql -u root -p lch_v4 < path/to/init.sql
```