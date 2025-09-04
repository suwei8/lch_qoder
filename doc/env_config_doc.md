# 《项目环境配置文档》

本项目使用 `.env` 文件进行环境配置，统一管理应用运行所需的参数。以下为详细说明：

---

## 一、应用配置
- **APP_NAME**: 亮车惠自助洗车（应用名称）
- **TIMEZONE**: Asia/Shanghai（系统默认时区）

---

## 二、数据库配置
- **DATABASE_URL**:
  - 用户：root
  - 密码：sw63828
  - 主机：127.0.0.1
  - 端口：3306
  - 数据库：lch_v4
  - 字符集：utf8mb4
- **DATABASE_ECHO**: false（是否开启 SQL 日志回显）

---

## 三、Redis配置
- **REDIS_URL**: `redis://localhost:6379/0`
  - 主机：localhost
  - 端口：6379
  - 数据库：0
- **REDIS_PASSWORD**: （为空表示无密码）

---

## 四、微信配置
- **WECHAT_APP_ID**: wxec5eaced269d6c51 （公众号AppID）
- **WECHAT_APP_SECRET**: 3274a18161a8e149496e9dd25c339bf0 （公众号AppSecret）
- **WECHAT_MCH_ID**: 1682730075 （微信支付商户号）
- **WECHAT_MCH_KEY**: igjqkVMUYwm5ogv4ZEubZbdaMKiNmRiY （微信支付API密钥）
- **WECHAT_CERT_PATH**: certs/apiclient_cert.pem （商户证书路径）
- **WECHAT_KEY_PATH**: certs/apiclient_key.pem （商户私钥路径）

---

## 五、智链物联配置
- **ZL_APP_ID**: 9418027365 （智链物联应用ID）
- **ZL_TOKEN**: 06D2ofasFJcXQgV7kLhZqNPGjyI54YUbwx3 （智链物联授权Token）
- **ZL_API_URL**: https://cloud.hbzhilian.com/AC/Cmd （设备控制API地址）

---
